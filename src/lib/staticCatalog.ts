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
 *   2. IndexedDB-Cache mit Version-Check (spart Traffic ueber Reloads).
 *      Frueher localStorage — wurde aber auf iOS Safari (UTF-16, ~5 MB Quota)
 *      bei vielen Serien zu eng und liess QuotaExceededError fuer ALLE
 *      anderen localStorage-Writes (Theme, HomeConfig, ...) durchschlagen.
 *   3. Bei Fehler: Firebase-Fallback (robust gegen Server-Ausfall)
 */

import type { CatalogSeries, CatalogMovie, CatalogSeason } from '../types/CatalogTypes';
import { idbGetVersioned, idbSetVersioned, idbRemove, idbRemovePrefix } from './catalogIDB';

// Vite injiziert process.env.VITE_* via define() in vite.config.ts
declare const process: { env: Record<string, string | undefined> };

const CATALOG_BASE_URL =
  (process.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de') + '/catalog';

const LS_PREFIX = 'catalog-static:';
const LS_VERSION_KEY = LS_PREFIX + 'version';
const LS_META_KEY = LS_PREFIX + 'seriesMeta';
const LS_MOVIES_KEY = LS_PREFIX + 'moviesMeta';
const LS_SEASONS_PREFIX = LS_PREFIX + 'seasons:';

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
let cachedVersion: number | null = null;
let versionFetchPromise: Promise<number | null> | null = null;

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
    idbRemovePrefix(LS_SEASONS_PREFIX),
  ]);
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

// ---------- Public API ----------

/**
 * Laedt catalog/seriesMeta (alle Serien, ohne Seasons, ~400 KB gzipped ~80 KB).
 */
export async function fetchStaticCatalogSeries(): Promise<Record<string, CatalogSeries> | null> {
  if (memoryMeta) return memoryMeta;
  const version = await ensureVersionFresh();
  const cached = await idbGetVersioned<Record<string, CatalogSeries>>(LS_META_KEY, version);
  if (cached) {
    memoryMeta = cached;
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogSeries>>('seriesMeta.json', {
      version,
    });
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
  const version = await ensureVersionFresh();
  const cached = await idbGetVersioned<Record<string, CatalogMovie>>(LS_MOVIES_KEY, version);
  if (cached) {
    memoryMovies = cached;
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogMovie>>('moviesMeta.json', {
      version,
    });
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
 */
export async function fetchStaticCatalogSeasons(
  tmdbId: string | number
): Promise<Record<string, CatalogSeason> | null> {
  const id = String(tmdbId);
  const mem = memorySeasons.get(id);
  if (mem) return mem;
  const version = await ensureVersionFresh();
  const cacheKey = LS_SEASONS_PREFIX + id;
  const cached = await idbGetVersioned<Record<string, CatalogSeason>>(cacheKey, version);
  if (cached) {
    memorySeasons.set(id, cached);
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogSeason>>(`seasons/${id}.json`, {
      version,
    });
    memorySeasons.set(id, data);
    void idbSetVersioned(cacheKey, version, data);
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
  const local = await getLocalVersion();
  if (local !== null && local === remote) {
    // unveraendert — nichts zu tun
    return false;
  }
  // Bump detected: memory + IDB komplett invalidieren
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  await invalidateLocalCaches();
  await setLocalVersion(remote);
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
    if (version != null) void idbSetVersioned(LS_META_KEY, version, data);
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
    if (version != null) void idbSetVersioned(LS_MOVIES_KEY, version, data);
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
  localVersionCache = undefined;
  void idbRemove(LS_META_KEY);
  void idbRemove(LS_MOVIES_KEY);
  void idbRemove(LS_VERSION_KEY);
  void idbRemovePrefix(LS_SEASONS_PREFIX);
}
