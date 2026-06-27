/**
 * animeFillerService – read-only client for anime filler/recap data.
 *
 * The frontend NEVER calls AniList or Jikan directly. The backend
 * (update_anime_filler.js daily cron + /add fire-and-forget) populates
 * `admin/animeFiller/{tmdbId}` in Firebase. The Detail-Page reload button
 * hits a backend endpoint (`POST /refreshAnimeFiller`) which re-fetches
 * server-side. This keeps API quotas and edge-case retries on a single
 * authoritative host.
 *
 * Frontend responsibilities:
 *   1. Read `admin/animeFiller/{tmdbId}` from Firebase
 *   2. Cache the result in localStorage (7-day TTL, 1-h negative TTL)
 *   3. On reload-button: POST to backend, then re-read Firebase
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

const CACHE_PREFIX = 'animeFiller_v3:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Negatives expire fast – the backend may catch up on the next cron pass
// or via a fresh /add trigger.
const NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1000;

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

export interface FillerEpisode {
  /** Absolute episode number across the whole anime (Jikan-style). */
  malEpisodeNumber: number;
  title: string;
  filler: boolean;
  recap: boolean;
}

export interface AnimeFillerData {
  malId: number;
  totalEpisodes: number | null;
  fillerCount: number;
  recapCount: number;
  episodes: FillerEpisode[];
  fetchedAt: number;
}

/**
 * Lookup key shape: "s{seasonNumber}-e{episodeNumber}" using the user-facing
 * (1-based) numbering. SeasonsSection and ContinueWatching both expose these
 * numbers directly, so the consumer doesn't need to compute anything.
 */
export function fillerLookupKey(seasonNumber: number, episodeNumber: number): string {
  return `s${seasonNumber}-e${episodeNumber}`;
}

interface SeasonLike {
  seasonNumber?: number;
  season_number?: number;
  episodes?: unknown[];
}

/**
 * Flatten the TMDB-style season tree to absolute episode numbers and match
 * against the MAL list. Works for animes tracked under a single continuous
 * MAL entry (One Piece, Naruto, Bleach …); per-season-MAL animes (AoT, JoJo)
 * will only resolve the first season, which is the safe failure mode.
 */
export function buildFillerLookup(
  seasons: SeasonLike[] | undefined,
  fillerEpisodes: FillerEpisode[]
): Map<string, FillerEpisode> {
  const lookup = new Map<string, FillerEpisode>();
  if (!seasons || fillerEpisodes.length === 0) return lookup;

  const byMalNumber = new Map<number, FillerEpisode>();
  for (const ep of fillerEpisodes) {
    byMalNumber.set(ep.malEpisodeNumber, ep);
  }

  let absoluteIndex = 0;
  for (const season of seasons) {
    if (!season) continue;
    const seasonNumber = (season.seasonNumber ?? season.season_number ?? 0) + 1;
    const episodes = Array.isArray(season.episodes) ? season.episodes : [];
    for (let epIdx = 0; epIdx < episodes.length; epIdx += 1) {
      absoluteIndex += 1;
      const match = byMalNumber.get(absoluteIndex);
      if (!match) continue;
      if (!match.filler && !match.recap) continue;
      const episodeNumber = epIdx + 1;
      lookup.set(fillerLookupKey(seasonNumber, episodeNumber), match);
    }
  }

  return lookup;
}

/**
 * Synchronous cache read – returns whatever is already in localStorage.
 * ContinueWatching uses this to decorate next-up posters without spawning
 * Firebase reads per series.
 */
export function readFillerCacheSync(seriesId: number | string): AnimeFillerData | null {
  const cached = readCache(String(seriesId));
  return cached?.data ?? null;
}

interface CacheRecord {
  data: AnimeFillerData | null;
  fetchedAt: number;
}

function readCache(key: string): CacheRecord | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheRecord;
    const ttl = parsed.data ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS;
    if (Date.now() - parsed.fetchedAt > ttl) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, record: CacheRecord): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(record));
  } catch {
    /* quota – ignore */
  }
}

/** Wipe the cached entry for a single series. */
export function clearAnimeFillerCacheForSeries(seriesId: number | string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + String(seriesId));
    // Legacy keys (v1 / v2) – clean those too so a forced reload starts fresh.
    localStorage.removeItem('animeFiller_v2:' + String(seriesId));
    localStorage.removeItem('animeFiller_v1:' + String(seriesId));
  } catch {
    /* ignore */
  }
}

/** Wipe every cached entry. Useful escape hatch from DevTools. */
export function clearAnimeFillerCache(): number {
  let removed = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith(CACHE_PREFIX) ||
          k.startsWith('animeFiller_v2:') ||
          k.startsWith('animeFiller_v1:'))
      ) {
        keys.push(k);
      }
    }
    for (const k of keys) {
      localStorage.removeItem(k);
      removed += 1;
    }
  } catch {
    /* ignore */
  }
  return removed;
}

/**
 * Optional DevTools logging – activate with:
 *   localStorage.setItem('debug:animeFiller', '1'); location.reload();
 */
function debug(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem('debug:animeFiller') !== '1') return;
  } catch {
    return;
  }
  // eslint-disable-next-line no-console
  console.log('[animeFiller]', ...args);
}

type BackendFillerItem = number | { n: number; t?: string };

interface BackendFillerRecord {
  status?: string;
  malId?: number;
  totalEpisodes?: number;
  fillerCount?: number;
  recapCount?: number;
  /** Either plain numbers (v3 format) or {n, t} objects (v4+). */
  filler?: BackendFillerItem[];
  recap?: BackendFillerItem[];
  updatedAt?: number;
  aniListTitles?: Record<string, string | null> | null;
}

function readBackendItem(item: BackendFillerItem): { n: number; t: string } {
  if (typeof item === 'number') return { n: item, t: '' };
  return { n: item.n, t: item.t ?? '' };
}

/**
 * The only network read this module performs. Backend keeps the upstream
 * AniList/Jikan API calls on the server – frontend never touches them.
 */
async function fetchBackendFillerData(seriesId: number | string): Promise<AnimeFillerData | null> {
  try {
    const snap = await firebase.database().ref(`admin/animeFiller/${seriesId}`).once('value');
    const v = snap.val() as BackendFillerRecord | null;
    if (!v || v.status !== 'ok' || !v.malId) return null;
    const episodes: FillerEpisode[] = [];
    for (const item of v.filler ?? []) {
      const { n, t } = readBackendItem(item);
      episodes.push({ malEpisodeNumber: n, title: t, filler: true, recap: false });
    }
    for (const item of v.recap ?? []) {
      const { n, t } = readBackendItem(item);
      episodes.push({ malEpisodeNumber: n, title: t, filler: false, recap: true });
    }
    debug('backend hit', {
      seriesId,
      malId: v.malId,
      fillerCount: v.fillerCount,
      recapCount: v.recapCount,
    });
    return {
      malId: v.malId,
      totalEpisodes: v.totalEpisodes ?? null,
      fillerCount: v.fillerCount ?? episodes.filter((e) => e.filler).length,
      recapCount: v.recapCount ?? episodes.filter((e) => e.recap).length,
      episodes,
      fetchedAt: v.updatedAt ?? Date.now(),
    };
  } catch (err) {
    console.warn('[animeFiller] backend lookup failed', { seriesId, err });
    return null;
  }
}

/**
 * Get filler/recap data for a series. Reads localStorage first, then
 * Firebase. Never hits AniList/Jikan directly.
 */
export async function getAnimeFillerData(
  seriesId: number | string
): Promise<AnimeFillerData | null> {
  const key = String(seriesId);
  const cached = readCache(key);
  if (cached) {
    debug('cache hit', { seriesId, hasData: !!cached.data });
    return cached.data;
  }

  const backend = await fetchBackendFillerData(seriesId);
  writeCache(key, { data: backend, fetchedAt: backend?.fetchedAt ?? Date.now() });
  return backend;
}

/**
 * Ask the backend to (re)fetch this series from AniList/Jikan, then re-read
 * the result from Firebase. Used by the Detail-Page reload button.
 */
export async function refreshAnimeFillerViaBackend(
  seriesId: number | string
): Promise<AnimeFillerData | null> {
  clearAnimeFillerCacheForSeries(seriesId);
  if (!BACKEND_URL) {
    console.warn('[animeFiller] no VITE_BACKEND_API_URL – cannot refresh');
    return null;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/refreshAnimeFiller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(seriesId) }),
    });
    if (!res.ok) {
      console.warn('[animeFiller] backend refresh non-ok', { seriesId, status: res.status });
      return null;
    }
    const json = (await res.json()) as { status?: string };
    debug('backend refresh', { seriesId, status: json.status });
  } catch (err) {
    console.warn('[animeFiller] backend refresh threw', { seriesId, err });
    return null;
  }
  // Backend may take a moment to commit the write – tiny delay before re-read.
  await new Promise((r) => setTimeout(r, 300));
  return getAnimeFillerData(seriesId);
}

// ── DevTools escape hatch ────────────────────────────────────────────────
// Lets you debug straight from the browser console:
//   animeFillerDebug.refresh(123)
//   animeFillerDebug.clearFor(123)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).animeFillerDebug = {
    read: getAnimeFillerData,
    refresh: refreshAnimeFillerViaBackend,
    clearAll: clearAnimeFillerCache,
    clearFor: clearAnimeFillerCacheForSeries,
  };
}
