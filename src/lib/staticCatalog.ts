/**
 * Static Catalog Loader
 *
 * Laedt das "catalog/*"-Tree ueber statische JSON-Files vom eigenen Server
 * statt von Firebase. Catalog ist read-only Metadaten (~15 MB), die aktuell
 * den Groessteil des Firebase-Download-Egress verursachen.
 *
 * Infrastruktur:
 *   - Server-Cron (SerienApi index.js) schreibt catalog/*-Subtrees als
 *     JSON-Files nach /home/serien/SerienApi/public/catalog/
 *   - nginx served das unter https://serienapi.konrad-dinges.de/catalog/
 *     mit gzip-Kompression + 24h Cache-Control
 *
 * Caching-Strategie (Stale-While-Revalidate):
 *   1. In-Memory-Cache pro Tab — sofortige Returns waehrend Session
 *   2. IndexedDB-Cache — wird bei Cache-Hit SOFORT ausgeliefert, der
 *      Versions-Check laeuft asynchron im Hintergrund. Erst wenn der
 *      Server eine neue Version meldet, werden Caches invalidiert; der
 *      naechste Aufruf (bzw. der naechste visibilitychange-Poll im
 *      Provider) holt frisch.
 *   3. Bei Fehler / leerem Cache: direkter Fetch vom Server
 *   4. Fetch-Timeout (15s) verhindert haengende Requests
 */

import type { CatalogSeries, CatalogMovie, CatalogSeason } from '../types/CatalogTypes';
import {
  idbGetVersioned,
  idbGetAny,
  idbSetVersioned,
  idbRemove,
  idbRemovePrefix,
} from './catalogIDB';

// Vite injiziert process.env.VITE_* via define() in vite.config.ts
declare const process: { env: Record<string, string | undefined> };

const CATALOG_BASE_URL =
  (process.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de') + '/catalog';

const LS_PREFIX = 'catalog-static:';
const LS_VERSION_KEY = LS_PREFIX + 'version';
const LS_META_KEY = LS_PREFIX + 'seriesMeta';
const LS_MOVIES_KEY = LS_PREFIX + 'moviesMeta';
const LS_SEASONS_PREFIX = LS_PREFIX + 'seasons:';
const LS_SEASONS_BULK_KEY = LS_PREFIX + 'seasonsBulk';

// Default-Timeout fuer alle Catalog-Fetches: 15s. Verhindert dass ein
// haengender Request die UI ewig blockiert (catalogLoading bleibt sonst true).
const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

// Einmalige Migration: Alte localStorage-Eintraege mit catalog-static:*-
// Prefix entfernen. Wichtig fuer Bestands-User, deren localStorage durch
// die alte Strategie voll ist und dadurch andere setItem-Aufrufe (Theme,
// HomeConfig, Watch-Next-Settings) blockiert.
let lsMigrationDone = false;
function migrateLocalStorageOnce(): void {
  if (lsMigrationDone) return;
  lsMigrationDone = true;
  try {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!ls) return;
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(LS_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) {
      try {
        ls.removeItem(k);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

interface VersionResponse {
  version: number;
  updatedAt: string;
}

let memoryMeta: Record<string, CatalogSeries> | null = null;
let memoryMovies: Record<string, CatalogMovie> | null = null;
const memorySeasons = new Map<string, Record<string, CatalogSeason>>();
let memorySeasonsBulk: Record<string, Record<string, CatalogSeason>> | null = null;
let cachedVersion: number | null = null;
let versionFetchPromise: Promise<number | null> | null = null;

async function fetchJson<T>(
  path: string,
  opts?: { noStore?: boolean; version?: number | null; timeoutMs?: number }
): Promise<T> {
  // Version-basierter Cache-Bust fuer Catalog-Files (seriesMeta, moviesMeta,
  // seasons/*). Der Browser-HTTP-Cache respektiert `max-age=86400` auch wenn
  // serverseitig neue Daten stehen — das umgehen wir, indem jede Version eine
  // eigene URL bekommt. So liegt alte Version 24h im Cache, neue Version ist
  // ein neuer URL-Key und wird vom Netz geholt.
  const query = opts?.version != null ? `?v=${opts.version}` : '';
  const url = `${CATALOG_BASE_URL}/${path}${query}`;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      // version.json selbst muss immer frisch sein (sonst sehen wir den Bump nie),
      // deshalb no-store. Die grossen Files duerfen 24h gecacht bleiben, weil
      // ihre URL durch den ?v=-Query automatisch invalidiert wird.
      cache: opts?.noStore ? 'no-store' : 'default',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`static catalog fetch failed ${res.status} ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Holt die aktuelle Catalog-Version vom Server.
 * Wird von allen fetch*-Funktionen verwendet, um zu entscheiden, ob ein
 * gecachter Wert noch gueltig ist.
 */
async function getRemoteVersion(): Promise<number | null> {
  if (cachedVersion !== null) return cachedVersion;
  if (versionFetchPromise) return versionFetchPromise;
  versionFetchPromise = (async () => {
    try {
      const v = await fetchJson<VersionResponse>('version.json', {
        noStore: true,
        // version.json ist 100 Bytes — kurzer Timeout reicht und verhindert
        // dass der ganze Stale-While-Revalidate-Check ewig haengt
        timeoutMs: 5_000,
      });
      cachedVersion = typeof v?.version === 'number' ? v.version : null;
      return cachedVersion;
    } catch (e) {
      console.warn('[staticCatalog] version fetch failed', e);
      return null;
    } finally {
      versionFetchPromise = null;
    }
  })();
  return versionFetchPromise;
}

// Lokal gespeicherte Catalog-Version (in IDB). In-Memory gespiegelt damit
// die meisten Aufrufe synchron sind.
let localVersionCache: number | null | undefined = undefined;
const LOCAL_VERSION_KEY = LS_VERSION_KEY; // wiederverwenden als IDB-Key

async function getLocalVersion(): Promise<number | null> {
  if (localVersionCache !== undefined) return localVersionCache;
  // Stable sentinel-Version 0, damit idbGetVersioned den Wert mit jeder
  // erwarteten Version 0 ausliefert (wir interessieren uns hier nicht fuer
  // einen separaten Versions-Check, der "Wert" ist die Version selbst).
  const stored = await idbGetVersioned<number>(LOCAL_VERSION_KEY, 0);
  localVersionCache = typeof stored === 'number' ? stored : null;
  return localVersionCache;
}

async function setLocalVersion(v: number): Promise<void> {
  localVersionCache = v;
  await idbSetVersioned<number>(LOCAL_VERSION_KEY, 0, v);
}

async function invalidateLocalCaches(): Promise<void> {
  await Promise.all([
    idbRemove(LS_META_KEY),
    idbRemove(LS_MOVIES_KEY),
    idbRemove(LS_SEASONS_BULK_KEY),
    idbRemovePrefix(LS_SEASONS_PREFIX),
  ]);
}

/**
 * Hintergrund-Versionscheck: vergleicht Remote-Version mit der lokal
 * gespeicherten Version. Bei Mismatch werden alle Caches invalidiert,
 * damit der naechste Catalog-Aufruf frisch holt.
 *
 * Diese Funktion wird im Stale-While-Revalidate-Pfad ohne `await` aufgerufen
 * — UI bekommt die gecachten Daten sofort, der Refresh kommt beim naechsten
 * Tick (z.B. via checkForCatalogVersionBump()).
 */
async function revalidateInBackground(localV: number | null): Promise<void> {
  migrateLocalStorageOnce();
  const remote = await getRemoteVersion();
  if (remote === null) return;
  if (localV !== null && localV === remote) {
    // Nichts zu tun — Cache ist aktuell
    return;
  }
  // Bump erkannt: Caches komplett invalidieren. UI sieht noch die alten
  // Daten bis zum naechsten Refresh.
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  memorySeasonsBulk = null;
  await invalidateLocalCaches();
  await setLocalVersion(remote);
}

async function ensureVersionFresh(): Promise<number | null> {
  migrateLocalStorageOnce();
  const remote = await getRemoteVersion();
  if (remote === null) return null;
  const local = await getLocalVersion();
  if (local !== null && local !== remote) {
    await invalidateLocalCaches();
  }
  await setLocalVersion(remote);
  return remote;
}

// ---------- Provider-Dedup-Expansion ----------

interface ProviderEntry {
  logo?: string;
  name?: string;
}

interface DedupedMetaPayload {
  _meta?: { providers?: Record<string, ProviderEntry> };
  [tmdbId: string]: unknown;
}

/**
 * Bei Provider-Dedup im Server steht oben im JSON ein `_meta.providers`-Mapping
 * von ID -> {logo, name}, und in jedem Series/Movie-Eintrag sind die Provider
 * nur noch als `[id, id, id]` gespeichert. Wir expandieren das nach dem Fetch
 * zurueck zur alten Full-Object-Struktur, sodass das uebrige Frontend
 * unveraendert bleibt.
 *
 * Bei alten Payloads (ohne _meta) ist das ein No-Op.
 */
function expandProviders<T extends { providers?: unknown }>(raw: unknown): Record<string, T> {
  if (!raw || typeof raw !== 'object') return {};
  const payload = raw as DedupedMetaPayload;
  const providerMap = payload._meta?.providers;
  const out: Record<string, T> = {};
  for (const key in payload) {
    if (key === '_meta') continue;
    const entry = payload[key] as T & { providers?: unknown };
    if (entry && providerMap && Array.isArray(entry.providers)) {
      const expanded = (entry.providers as unknown[]).map((p) => {
        if (typeof p === 'number') {
          const info = providerMap[String(p)] || {};
          return { id: p, logo: info.logo || '', name: info.name || '' };
        }
        return p;
      });
      out[key] = { ...entry, providers: expanded } as T;
    } else {
      out[key] = entry as T;
    }
  }
  return out;
}

// ---------- Public API ----------

/**
 * Laedt catalog/seriesMeta (alle Serien, ohne Seasons, ~400 KB gzipped ~80 KB).
 *
 * Stale-While-Revalidate: bei vorhandenem Cache wird sofort zurueckgegeben,
 * der Versions-Check laeuft im Hintergrund.
 */
export async function fetchStaticCatalogSeries(): Promise<Record<string, CatalogSeries> | null> {
  if (memoryMeta) return memoryMeta;

  // Stale-While-Revalidate: IDB sofort lesen, ohne Versions-Roundtrip abzuwarten
  const cached = await idbGetAny<Record<string, CatalogSeries>>(LS_META_KEY);
  if (cached) {
    memoryMeta = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  // Cold path: Version + Daten holen
  const version = await ensureVersionFresh();
  try {
    const raw = await fetchJson<unknown>('seriesMeta.json', { version });
    const data = expandProviders<CatalogSeries>(raw);
    memoryMeta = data;
    void idbSetVersioned(LS_META_KEY, version, data);
    return data;
  } catch (e) {
    console.warn('[staticCatalog] seriesMeta fetch failed, returning null', e);
    return null;
  }
}

/**
 * Laedt catalog/moviesMeta (alle Filme, ~300 KB gzipped ~60 KB).
 */
export async function fetchStaticCatalogMovies(): Promise<Record<string, CatalogMovie> | null> {
  if (memoryMovies) return memoryMovies;

  const cached = await idbGetAny<Record<string, CatalogMovie>>(LS_MOVIES_KEY);
  if (cached) {
    memoryMovies = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const raw = await fetchJson<unknown>('moviesMeta.json', { version });
    const data = expandProviders<CatalogMovie>(raw);
    memoryMovies = data;
    void idbSetVersioned(LS_MOVIES_KEY, version, data);
    return data;
  } catch (e) {
    console.warn('[staticCatalog] moviesMeta fetch failed, returning null', e);
    return null;
  }
}

/**
 * Laedt catalog/seasons/{tmdbId} (Seasons einer einzelnen Serie, ~10 KB).
 * Wird heute nur noch fuer Edge-Cases verwendet — der Provider lädt normalerweise
 * den Bulk via fetchStaticCatalogSeasonsBulk().
 */
export async function fetchStaticCatalogSeasons(
  tmdbId: string | number
): Promise<Record<string, CatalogSeason> | null> {
  const id = String(tmdbId);
  const mem = memorySeasons.get(id);
  if (mem) return mem;

  // Falls bulk-Daten geladen sind, daraus bedienen
  if (memorySeasonsBulk && memorySeasonsBulk[id]) {
    memorySeasons.set(id, memorySeasonsBulk[id]);
    return memorySeasonsBulk[id];
  }

  const cacheKey = LS_SEASONS_PREFIX + id;
  const cached = await idbGetAny<Record<string, CatalogSeason>>(cacheKey);
  if (cached) {
    memorySeasons.set(id, cached.data);
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<Record<string, CatalogSeason>>(`seasons/${id}.json`, {
      version,
    });
    memorySeasons.set(id, data);
    void idbSetVersioned(cacheKey, version, data);
    return data;
  } catch (e) {
    if (!String(e).includes('404')) {
      console.warn(`[staticCatalog] seasons/${id} fetch failed`, e);
    }
    return null;
  }
}

/**
 * Laedt catalog/seasonsAll.json (alle Seasons aller Serien in einem Request).
 * Ersetzt die frueheren N parallelen Requests pro User-Serie und reduziert
 * die Initialladezeit dramatisch bei vielen Serien (Browser-Limit von 6
 * parallelen Connections pro Origin).
 *
 * Returnt null wenn das Bulk-File noch nicht existiert (Server-Cron nicht
 * gelaufen oder alte Server-Version) — Provider faellt dann auf einzelne
 * fetchStaticCatalogSeasons-Calls zurueck.
 */
export async function fetchStaticCatalogSeasonsBulk(): Promise<Record<
  string,
  Record<string, CatalogSeason>
> | null> {
  if (memorySeasonsBulk) return memorySeasonsBulk;

  const cached =
    await idbGetAny<Record<string, Record<string, CatalogSeason>>>(LS_SEASONS_BULK_KEY);
  if (cached) {
    memorySeasonsBulk = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<Record<string, Record<string, CatalogSeason>>>('seasonsAll.json', {
      version,
    });
    memorySeasonsBulk = data;
    void idbSetVersioned(LS_SEASONS_BULK_KEY, version, data);
    return data;
  } catch (e) {
    // 404 = Bulk-File existiert noch nicht (Backend nicht aktuell). Kein Fehler-Log,
    // der Provider faellt auf einzelne Season-Fetches zurueck.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] seasonsAll fetch failed', e);
    }
    return null;
  }
}

/**
 * Prueft ob serverseitig eine neue Catalog-Version vorliegt und invalidiert
 * in diesem Fall Memory + IDB (aber ohne direkt neu zu fetchen).
 * Wird beim Tab-visibilitychange aufgerufen, damit der Client neue Cron-
 * Daten nach laengerer Inaktivitaet automatisch zieht — ohne App-Reload.
 *
 * Returns true wenn eine neue Version gefunden wurde (und Caches invalidiert
 * wurden), false sonst.
 */
export async function checkForCatalogVersionBump(): Promise<boolean> {
  // Cached Version zuruecksetzen damit getRemoteVersion den Server neu abfragt
  cachedVersion = null;
  let remote: number | null;
  try {
    const v = await fetchJson<VersionResponse>('version.json', {
      noStore: true,
      timeoutMs: 5_000,
    });
    remote = typeof v?.version === 'number' ? v.version : null;
  } catch {
    return false;
  }
  if (remote === null) return false;
  cachedVersion = remote;
  const local = await getLocalVersion();
  if (local !== null && local === remote) {
    return false;
  }
  // Bump detected: memory + IDB komplett invalidieren
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  memorySeasonsBulk = null;
  await invalidateLocalCaches();
  await setLocalVersion(remote);
  return true;
}

/**
 * Erzwingt einen frischen Fetch vom Server, ohne Memory-, IDB-
 * oder Browser-HTTP-Cache. Nuetzlich wenn bekannt ist, dass Daten fehlen
 * (z.B. nach /add oder bei stale Cache).
 */
export async function fetchStaticCatalogSeriesFresh(): Promise<Record<
  string,
  CatalogSeries
> | null> {
  try {
    const url = `${CATALOG_BASE_URL}/seriesMeta.json?_=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const raw = await res.json();
      const data = expandProviders<CatalogSeries>(raw);
      memoryMeta = data;
      const version = await getRemoteVersion();
      if (version != null) void idbSetVersioned(LS_META_KEY, version, data);
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}

export async function fetchStaticCatalogMoviesFresh(): Promise<Record<
  string,
  CatalogMovie
> | null> {
  try {
    const url = `${CATALOG_BASE_URL}/moviesMeta.json?_=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const raw = await res.json();
      const data = expandProviders<CatalogMovie>(raw);
      memoryMovies = data;
      const version = await getRemoteVersion();
      if (version != null) void idbSetVersioned(LS_MOVIES_KEY, version, data);
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}

export function clearStaticCatalogCache(): void {
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  memorySeasonsBulk = null;
  cachedVersion = null;
  localVersionCache = undefined;
  void idbRemove(LS_META_KEY);
  void idbRemove(LS_MOVIES_KEY);
  void idbRemove(LS_VERSION_KEY);
  void idbRemove(LS_SEASONS_BULK_KEY);
  void idbRemovePrefix(LS_SEASONS_PREFIX);
}
