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
 * Caching-Strategie:
 *   1. In-Memory-Cache pro Tab (keine Netzwerk-Requests waehrend Session)
 *   2. localStorage-Cache mit Version-Check (spart Traffic ueber Reloads)
 *   3. Bei Fehler: Firebase-Fallback (robust gegen Server-Ausfall)
 */

import type { CatalogSeries, CatalogMovie, CatalogSeason } from '../types/CatalogTypes';

// Vite injiziert process.env.VITE_* via define() in vite.config.ts
declare const process: { env: Record<string, string | undefined> };

const CATALOG_BASE_URL =
  (process.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de') + '/catalog';

const LS_PREFIX = 'catalog-static:';
const LS_VERSION_KEY = LS_PREFIX + 'version';
const LS_META_KEY = LS_PREFIX + 'seriesMeta';
const LS_MOVIES_KEY = LS_PREFIX + 'moviesMeta';
const LS_SEASONS_PREFIX = LS_PREFIX + 'seasons:';

interface VersionResponse {
  version: number;
  updatedAt: string;
}

let memoryMeta: Record<string, CatalogSeries> | null = null;
let memoryMovies: Record<string, CatalogMovie> | null = null;
const memorySeasons = new Map<string, Record<string, CatalogSeason>>();
let cachedVersion: number | null = null;
let versionFetchPromise: Promise<number | null> | null = null;

function getLS(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

// Wrapper fuer versioned Storage: Datenwerte werden als { v, data } abgelegt,
// damit beim Lesen sofort geprueft werden kann ob der Eintrag zur aktuellen
// Catalog-Version gehoert. Falls nicht, wird null zurueckgegeben (und im
// Zweifel der Key geloescht) — sodass der Caller einen frischen Fetch
// ausloest. Verhindert den Edge-Case, dass localStorage-Version und -Content
// auseinanderlaufen.
interface VersionedEntry<T> {
  v: number;
  data: T;
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = getLS()?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function lsGetVersioned<T>(key: string, expectedVersion: number | null): T | null {
  try {
    const raw = getLS()?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VersionedEntry<T> | T;
    // Nur akzeptieren wenn der Eintrag das neue Format hat UND die Version matcht.
    // Alte Eintraege ohne `v`-Feld werden bewusst verworfen und neu geholt.
    if (
      parsed &&
      typeof parsed === 'object' &&
      'v' in (parsed as VersionedEntry<T>) &&
      'data' in (parsed as VersionedEntry<T>)
    ) {
      const entry = parsed as VersionedEntry<T>;
      if (expectedVersion != null && entry.v === expectedVersion) {
        return entry.data;
      }
      // Version mismatch → alten Eintrag entfernen
      getLS()?.removeItem(key);
      return null;
    }
    // Legacy-Format ohne Versionsmarkierung → als stale betrachten
    getLS()?.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    getLS()?.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled - ignore silently
  }
}

function lsSetVersioned<T>(key: string, version: number | null, data: T): void {
  if (version == null) return;
  try {
    const entry: VersionedEntry<T> = { v: version, data };
    getLS()?.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

function lsRemove(key: string): void {
  try {
    getLS()?.removeItem(key);
  } catch {
    // ignore
  }
}

async function fetchJson<T>(
  path: string,
  opts?: { noStore?: boolean; version?: number | null }
): Promise<T> {
  // Version-basierter Cache-Bust fuer Catalog-Files (seriesMeta, moviesMeta,
  // seasons/*). Der Browser-HTTP-Cache respektiert `max-age=86400` auch wenn
  // serverseitig neue Daten stehen — das umgehen wir, indem jede Version eine
  // eigene URL bekommt. So liegt alte Version 24h im Cache, neue Version ist
  // ein neuer URL-Key und wird vom Netz geholt.
  const query = opts?.version != null ? `?v=${opts.version}` : '';
  const url = `${CATALOG_BASE_URL}/${path}${query}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    // version.json selbst muss immer frisch sein (sonst sehen wir den Bump nie),
    // deshalb no-store. Die grossen Files duerfen 24h gecacht bleiben, weil
    // ihre URL durch den ?v=-Query automatisch invalidiert wird.
    cache: opts?.noStore ? 'no-store' : 'default',
  });
  if (!res.ok) {
    throw new Error(`static catalog fetch failed ${res.status} ${url}`);
  }
  return (await res.json()) as T;
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
      const v = await fetchJson<VersionResponse>('version.json', { noStore: true });
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

function getLocalVersion(): number | null {
  const v = lsGet<number>(LS_VERSION_KEY);
  return typeof v === 'number' ? v : null;
}

function setLocalVersion(v: number): void {
  lsSet(LS_VERSION_KEY, v);
}

function invalidateLocalCaches(): void {
  lsRemove(LS_META_KEY);
  lsRemove(LS_MOVIES_KEY);
  // seasons werden einzeln gekeyed; loesche alle seasons-Eintraege mit
  // passendem prefix damit keine stale-Daten nach version-bump bleiben
  const ls = getLS();
  if (!ls) return;
  const toRemove: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    if (key && key.startsWith(LS_SEASONS_PREFIX)) toRemove.push(key);
  }
  for (const key of toRemove) lsRemove(key);
}

async function ensureVersionFresh(): Promise<number | null> {
  const remote = await getRemoteVersion();
  if (remote === null) return null;
  const local = getLocalVersion();
  if (local !== null && local !== remote) {
    invalidateLocalCaches();
  }
  setLocalVersion(remote);
  return remote;
}

// ---------- Public API ----------

/**
 * Laedt catalog/seriesMeta (alle Serien, ohne Seasons, ~400 KB gzipped ~80 KB).
 */
export async function fetchStaticCatalogSeries(): Promise<Record<string, CatalogSeries> | null> {
  if (memoryMeta) return memoryMeta;
  const version = await ensureVersionFresh();
  const cached = lsGetVersioned<Record<string, CatalogSeries>>(LS_META_KEY, version);
  if (cached) {
    memoryMeta = cached;
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogSeries>>('seriesMeta.json', {
      version,
    });
    memoryMeta = data;
    lsSetVersioned(LS_META_KEY, version, data);
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
  const version = await ensureVersionFresh();
  const cached = lsGetVersioned<Record<string, CatalogMovie>>(LS_MOVIES_KEY, version);
  if (cached) {
    memoryMovies = cached;
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogMovie>>('moviesMeta.json', {
      version,
    });
    memoryMovies = data;
    lsSetVersioned(LS_MOVIES_KEY, version, data);
    return data;
  } catch (e) {
    console.warn('[staticCatalog] moviesMeta fetch failed, returning null', e);
    return null;
  }
}

/**
 * Laedt catalog/seasons/{tmdbId} (Seasons einer einzelnen Serie, ~10 KB).
 */
export async function fetchStaticCatalogSeasons(
  tmdbId: string | number
): Promise<Record<string, CatalogSeason> | null> {
  const id = String(tmdbId);
  const mem = memorySeasons.get(id);
  if (mem) return mem;
  const version = await ensureVersionFresh();
  const lsKey = LS_SEASONS_PREFIX + id;
  const cached = lsGetVersioned<Record<string, CatalogSeason>>(lsKey, version);
  if (cached) {
    memorySeasons.set(id, cached);
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogSeason>>(`seasons/${id}.json`, {
      version,
    });
    memorySeasons.set(id, data);
    lsSetVersioned(lsKey, version, data);
    return data;
  } catch (e) {
    // 404 bedeutet einfach: noch keine Seasons fuer diese Serie exportiert
    if (!String(e).includes('404')) {
      console.warn(`[staticCatalog] seasons/${id} fetch failed`, e);
    }
    return null;
  }
}

/**
 * Prueft ob serverseitig eine neue Catalog-Version vorliegt und invalidiert
 * in diesem Fall Memory + localStorage (aber ohne direkt neu zu fetchen).
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
    const v = await fetchJson<VersionResponse>('version.json', { noStore: true });
    remote = typeof v?.version === 'number' ? v.version : null;
  } catch {
    return false;
  }
  if (remote === null) return false;
  cachedVersion = remote;
  const local = getLocalVersion();
  if (local !== null && local === remote) {
    // unveraendert — nichts zu tun
    return false;
  }
  // Bump detected: memory + localStorage komplett invalidieren
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  invalidateLocalCaches();
  setLocalVersion(remote);
  return true;
}

/**
 * Clear all in-memory AND localStorage caches (used after catalog-version
 * changes at runtime, e.g. nach /add).
 */
/**
 * Erzwingt einen frischen Fetch vom Server, ohne Memory-, localStorage-
 * oder Browser-HTTP-Cache. Nützlich wenn bekannt ist, dass Daten fehlen
 * (z.B. nach /add oder bei stale Cache).
 */
export async function fetchStaticCatalogSeriesFresh(): Promise<Record<
  string,
  CatalogSeries
> | null> {
  try {
    const url = `${CATALOG_BASE_URL}/seriesMeta.json?_=${Date.now()}`;
    const res = await fetch(url, { method: 'GET', credentials: 'omit', cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, CatalogSeries>;
    // Update caches with fresh data
    memoryMeta = data;
    const version = await getRemoteVersion();
    if (version != null) lsSetVersioned(LS_META_KEY, version, data);
    return data;
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
    const res = await fetch(url, { method: 'GET', credentials: 'omit', cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, CatalogMovie>;
    memoryMovies = data;
    const version = await getRemoteVersion();
    if (version != null) lsSetVersioned(LS_MOVIES_KEY, version, data);
    return data;
  } catch {
    return null;
  }
}

export function clearStaticCatalogCache(): void {
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  cachedVersion = null;
  lsRemove(LS_META_KEY);
  lsRemove(LS_MOVIES_KEY);
  lsRemove(LS_VERSION_KEY);
  // seasons/*-Eintraege sind numeriert, einmal durch den storage iterieren
  try {
    const ls = getLS();
    if (ls) {
      const toRemove: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(LS_SEASONS_PREFIX)) toRemove.push(k);
      }
      for (const k of toRemove) lsRemove(k);
    }
  } catch {
    // ignore
  }
}
