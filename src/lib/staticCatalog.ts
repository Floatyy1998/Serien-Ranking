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

function lsGet<T>(key: string): T | null {
  try {
    const raw = getLS()?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
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

function lsRemove(key: string): void {
  try {
    getLS()?.removeItem(key);
  } catch {
    // ignore
  }
}

async function fetchJson<T>(path: string, opts?: { noStore?: boolean }): Promise<T> {
  const url = `${CATALOG_BASE_URL}/${path}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    // version.json muss cache-busted sein, sonst sieht der Client den Bump nie
    // und alle localStorage-Caches bleiben stale. Die grossen Catalog-Files
    // duerfen hingegen weiterhin vom Browser gecacht werden — sie werden ueber
    // den Version-Check invalidiert.
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
  await ensureVersionFresh();
  const cached = lsGet<Record<string, CatalogSeries>>(LS_META_KEY);
  if (cached) {
    memoryMeta = cached;
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogSeries>>('seriesMeta.json');
    memoryMeta = data;
    lsSet(LS_META_KEY, data);
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
  await ensureVersionFresh();
  const cached = lsGet<Record<string, CatalogMovie>>(LS_MOVIES_KEY);
  if (cached) {
    memoryMovies = cached;
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogMovie>>('moviesMeta.json');
    memoryMovies = data;
    lsSet(LS_MOVIES_KEY, data);
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
  await ensureVersionFresh();
  const lsKey = LS_SEASONS_PREFIX + id;
  const cached = lsGet<Record<string, CatalogSeason>>(lsKey);
  if (cached) {
    memorySeasons.set(id, cached);
    return cached;
  }
  try {
    const data = await fetchJson<Record<string, CatalogSeason>>(`seasons/${id}.json`);
    memorySeasons.set(id, data);
    lsSet(lsKey, data);
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
 * Clear all in-memory AND localStorage caches (used after catalog-version
 * changes at runtime, e.g. nach /add).
 */
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
