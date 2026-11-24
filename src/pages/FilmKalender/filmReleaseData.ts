/**
 * Datenlayer des Film-Kalenders: TMDB-Discover pro Monat + Modus (Kino/
 * Digital) in der Watch-Region des Users, mit exakter Release-Datums-
 * Auflösung pro Film (movie/{id} + release_dates → regionales Datum des
 * passenden Typs; derselbe Abruf liefert über credits Regie und Besetzung).
 * Geladen wird in Blöcken nach Popularität, weitere Blöcke auf Wunsch.
 * Ergebnisse werden pro Session gecacht.
 */

import { tmdbFetch } from '../../services/api/tmdbClient';
import { pickProviderTiers, watchRegion } from '../../services/settings/region';
import { isSupportedProvider } from '../../config/menuItems';
import { getProviderLogoUrl } from '../../lib/provider/providerMerge';
import { normalizeProviderName } from '../../lib/provider/providerName';
import { mapGenreIds } from '../../utils/genreMap';
import {
  CINEMA_RELEASE_TYPES,
  DIGITAL_RELEASE_TYPES,
  pickRegionalDateInRange,
  type TmdbReleaseDates,
} from '../../lib/watch/movieCountdown';

export type ReleaseMode = 'cinema' | 'digital';

export interface FilmReleaseEntry {
  tmdbId: number;
  title: string;
  /** Volle Poster-URL (w342) oder ''. */
  poster: string;
  /** Regionales Release-Datum „YYYY-MM-DD" (Kino- bzw. Digital-Start). */
  releaseDate: string;
  rating: number | null;
  /** Genre-Zeile (App-Vokabular, bereits gejoint), '' wenn unbekannt. */
  genres: string;
  overview: string;
  mode: ReleaseMode;
  /** Flatrate-Anbieter der Watch-Region (nur Streaming-Modus, sonst leer). */
  providers: { name: string; logo: string }[];
  directors: string[];
  cast: string[];
}

interface MovieCredits {
  cast?: { name?: string; order?: number }[];
  crew?: { name?: string; job?: string }[];
}

interface MovieDetailResponse {
  release_dates?: TmdbReleaseDates;
  credits?: MovieCredits;
}

const MAX_DIRECTORS = 2;
const MAX_CAST = 3;

export function pickDirectors(credits: MovieCredits | undefined): string[] {
  const names = (credits?.crew || [])
    .filter((member) => member.job === 'Director' && member.name)
    .map((member) => member.name as string);
  return [...new Set(names)].slice(0, MAX_DIRECTORS);
}

export function pickLeadCast(credits: MovieCredits | undefined): string[] {
  const names = [...(credits?.cast || [])]
    .filter((member) => member.name)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((member) => member.name as string);
  return [...new Set(names)].slice(0, MAX_CAST);
}

const PAGES_PER_LOAD = 5;
const DISCOVER_PAGE_SIZE = 20;
const RESOLVE_BATCH = 20;

export interface FilmReleasePage {
  entries: FilmReleaseEntry[];
  /** Filme des Zeitraums, die noch nicht geladen sind. */
  remaining: number;
}

interface DiscoverMovie {
  id: number;
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
  overview?: string;
  release_date?: string;
}

interface DiscoverResponse {
  results?: DiscoverMovie[];
  total_pages?: number;
  total_results?: number;
}

interface LoadState {
  entries: FilmReleaseEntry[];
  seen: Set<number>;
  nextPage: number;
  remaining: number;
}

const cache = new Map<string, LoadState>();
const pending = new Map<string, Promise<FilmReleasePage>>();

/** Datumsbereich eines Quartals-Tabs: 1. des Startmonats bis Monatsende +2. */
function quarterRange(start: Date, monthsSpan: number): { gte: string; lte: string } {
  const first = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(start.getFullYear(), start.getMonth() + monthsSpan, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { gte: fmt(first), lte: fmt(last) };
}

interface WatchProviderEntry {
  provider_name?: string;
  logo_path?: string | null;
}

interface WatchProvidersResponse {
  results?: Record<string, { flatrate?: WatchProviderEntry[]; ads?: WatchProviderEntry[] }>;
}

/** Flatrate-Anbieter der Watch-Region (normalisiert, mit Logo). */
async function resolveProviders(movieId: number): Promise<{ name: string; logo: string }[]> {
  try {
    const data = await tmdbFetch<WatchProvidersResponse>(`movie/${movieId}/watch/providers`, {
      language: undefined,
    });
    const seen = new Set<string>();
    const out: { name: string; logo: string }[] = [];
    for (const raw of pickProviderTiers(data.results)) {
      const normalized = normalizeProviderName(raw.provider_name ?? '');
      if (!normalized || seen.has(normalized)) continue;
      if (watchRegion === 'DE' && !isSupportedProvider(normalized)) continue;
      seen.add(normalized);
      const logo =
        getProviderLogoUrl(normalized) ??
        (raw.logo_path ? `https://image.tmdb.org/t/p/w92${raw.logo_path}` : '');
      if (!logo) continue;
      out.push({ name: normalized, logo });
    }
    return out;
  } catch {
    return [];
  }
}

async function resolveEntry(
  raw: DiscoverMovie,
  mode: ReleaseMode,
  region: string,
  range: { gte: string; lte: string }
): Promise<FilmReleaseEntry | null> {
  const types = mode === 'cinema' ? CINEMA_RELEASE_TYPES : DIGITAL_RELEASE_TYPES;
  let releaseDate = '';
  let credits: MovieCredits | undefined;
  try {
    const data = await tmdbFetch<MovieDetailResponse>(`movie/${raw.id}`, {
      language: undefined,
      append_to_response: 'release_dates,credits',
    });
    releaseDate = pickRegionalDateInRange(
      data.release_dates || {},
      region,
      types,
      range.gte,
      range.lte
    );
    credits = data.credits;
  } catch {
    // Fallback unten
  }
  // Fallback: Discover-Datum, wenn es in den Zeitraum fällt (Discover hat regional
  // gefiltert — das exakte Regional-Datum war nur nicht abrufbar).
  if (
    !releaseDate &&
    raw.release_date &&
    raw.release_date >= range.gte &&
    raw.release_date <= range.lte
  ) {
    releaseDate = raw.release_date;
  }
  if (!releaseDate) return null;

  // Anbieter nur im Streaming-Modus auflösen (Kino hat keine) — ein weiterer
  // kleiner Request pro Film, läuft im selben Batch und landet im Cache.
  const providers = mode === 'digital' ? await resolveProviders(raw.id) : [];

  return {
    tmdbId: raw.id,
    title: raw.title || '',
    poster: raw.poster_path ? `https://image.tmdb.org/t/p/w342${raw.poster_path}` : '',
    releaseDate,
    rating: typeof raw.vote_average === 'number' && raw.vote_average > 0 ? raw.vote_average : null,
    genres: mapGenreIds(raw.genre_ids || [], 3),
    overview: raw.overview || '',
    mode,
    providers,
    directors: pickDirectors(credits),
    cast: pickLeadCast(credits),
  };
}

async function loadNextBlock(
  key: string,
  previous: LoadState | undefined,
  mode: ReleaseMode,
  region: string,
  range: { gte: string; lte: string }
): Promise<FilmReleasePage> {
  const fetchPage = (page: number) =>
    tmdbFetch<DiscoverResponse>('discover/movie', {
      region,
      with_release_type: mode === 'cinema' ? '3|2' : '4',
      'release_date.gte': range.gte,
      'release_date.lte': range.lte,
      sort_by: 'popularity.desc',
      page,
    });

  const firstPage = previous?.nextPage ?? 1;
  const first = await fetchPage(firstPage);
  const totalPages = Math.max(first.total_pages || firstPage, firstPage);
  const lastPage = Math.min(firstPage + PAGES_PER_LOAD - 1, totalPages);
  const followPages: number[] = [];
  for (let page = firstPage + 1; page <= lastPage; page++) followPages.push(page);
  const responses = [first, ...(await Promise.all(followPages.map(fetchPage)))];

  const seen = new Set(previous?.seen);
  const raws: DiscoverMovie[] = [];
  for (const res of responses) {
    for (const item of res.results || []) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      raws.push(item);
    }
  }

  const entries = [...(previous?.entries || [])];
  for (let i = 0; i < raws.length; i += RESOLVE_BATCH) {
    const batch = raws.slice(i, i + RESOLVE_BATCH);
    const resolved = await Promise.all(batch.map((raw) => resolveEntry(raw, mode, region, range)));
    for (const entry of resolved) if (entry) entries.push(entry);
  }
  entries.sort((a, b) =>
    a.releaseDate < b.releaseDate ? -1 : a.releaseDate > b.releaseDate ? 1 : 0
  );

  const remaining =
    lastPage >= totalPages
      ? 0
      : Math.max(1, (first.total_results || 0) - lastPage * DISCOVER_PAGE_SIZE);
  cache.set(key, { entries, seen, nextPage: lastPage + 1, remaining });
  return { entries, remaining };
}

/**
 * Releases eines 3-Monats-Blocks (Quartals-Tab wie beim Serien-Kalender) für
 * einen Modus (Kino/Digital), nach Datum sortiert. Der erste Aufruf lädt die
 * populärsten Filme, `more` hängt den nächsten Block an. Session-Cache pro
 * Region+Bereich+Modus.
 */
export async function fetchFilmReleases(
  quarterStart: Date,
  mode: ReleaseMode,
  more: boolean = false
): Promise<FilmReleasePage> {
  const region = watchRegion;
  const range = quarterRange(quarterStart, 3);
  const key = `${region}:${range.gte}:${range.lte}:${mode}`;
  const state = cache.get(key);
  if (state && (!more || state.remaining === 0)) {
    return { entries: state.entries, remaining: state.remaining };
  }
  const running = pending.get(key);
  if (running) return running;
  const run = loadNextBlock(key, state, mode, region, range).finally(() => pending.delete(key));
  pending.set(key, run);
  return run;
}
