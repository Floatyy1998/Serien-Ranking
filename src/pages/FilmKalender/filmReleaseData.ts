/**
 * Datenlayer des Film-Kalenders: TMDB-Discover pro Monat + Modus (Kino/
 * Digital) in der Watch-Region des Users, mit exakter Release-Datums-
 * Auflösung pro Film (movie/{id}/release_dates → regionales Datum des
 * passenden Typs). Ergebnisse werden pro Session gecacht.
 */

import { tmdbFetch } from '../../services/tmdbClient';
import { pickProviderRegion, watchRegion } from '../../services/region';
import { isSupportedProvider } from '../../config/menuItems';
import { getProviderLogoUrl } from '../../lib/providerMerge';
import { normalizeProviderName } from '../../lib/providerName';
import { mapGenreIds } from '../../utils/genreMap';

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
}

// TMDB release_dates: 1 Premiere, 2 Kino (limitiert), 3 Kino, 4 Digital, 5 Physisch, 6 TV
const CINEMA_TYPES = [3, 2];
const DIGITAL_TYPES = [4];

const DISCOVER_PAGES = 3;
const MAX_PER_MODE = 36;
const RESOLVE_BATCH = 6;

interface DiscoverMovie {
  id: number;
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
  overview?: string;
  release_date?: string;
}

interface ReleaseDatesResponse {
  results?: {
    iso_3166_1: string;
    release_dates?: { type: number; release_date: string }[];
  }[];
}

const cache = new Map<string, FilmReleaseEntry[]>();

/** Datumsbereich eines Quartals-Tabs: 1. des Startmonats bis Monatsende +2. */
function quarterRange(start: Date, monthsSpan: number): { gte: string; lte: string } {
  const first = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(start.getFullYear(), start.getMonth() + monthsSpan, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { gte: fmt(first), lte: fmt(last) };
}

/** Frühestes regionales Release-Datum der gewünschten Typen ('' wenn keins). */
function pickRegionalDate(data: ReleaseDatesResponse, region: string, types: number[]): string {
  const regional = data.results?.find((r) => r.iso_3166_1 === region);
  if (!regional?.release_dates?.length) return '';
  const dates = regional.release_dates
    .filter((d) => types.includes(d.type) && d.release_date)
    .map((d) => d.release_date.slice(0, 10))
    .sort();
  return dates[0] || '';
}

interface WatchProvidersResponse {
  results?: Record<string, { flatrate?: { provider_name?: string; logo_path?: string | null }[] }>;
}

/** Flatrate-Anbieter der Watch-Region (normalisiert, mit Logo). */
async function resolveProviders(movieId: number): Promise<{ name: string; logo: string }[]> {
  try {
    const data = await tmdbFetch<WatchProvidersResponse>(`movie/${movieId}/watch/providers`, {
      language: undefined,
    });
    const regional = pickProviderRegion(data.results);
    const seen = new Set<string>();
    const out: { name: string; logo: string }[] = [];
    for (const raw of regional?.flatrate || []) {
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
  const types = mode === 'cinema' ? CINEMA_TYPES : DIGITAL_TYPES;
  let releaseDate = '';
  try {
    const data = await tmdbFetch<ReleaseDatesResponse>(`movie/${raw.id}/release_dates`, {
      language: undefined,
    });
    releaseDate = pickRegionalDate(data, region, types);
  } catch {
    // Fallback unten
  }
  // Fallback: Primär-Datum, wenn es in den Monat fällt (Discover hat regional
  // gefiltert — das exakte Regional-Datum war nur nicht abrufbar).
  if (!releaseDate && raw.release_date && raw.release_date >= range.gte) {
    releaseDate = raw.release_date;
  }
  if (!releaseDate || releaseDate < range.gte || releaseDate > range.lte) return null;

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
  };
}

/**
 * Alle Releases eines 3-Monats-Blocks (Quartals-Tab wie beim Serien-Kalender)
 * für einen Modus (Kino/Digital), nach Datum sortiert. Session-Cache pro
 * Region+Bereich+Modus.
 */
export async function fetchFilmReleases(
  quarterStart: Date,
  mode: ReleaseMode,
  monthsSpan: number = 3
): Promise<FilmReleaseEntry[]> {
  const region = watchRegion;
  const range = quarterRange(quarterStart, monthsSpan);
  const key = `${region}:${range.gte}:${range.lte}:${mode}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const raws: DiscoverMovie[] = [];
  const seen = new Set<number>();

  for (let page = 1; page <= DISCOVER_PAGES; page++) {
    const res = await tmdbFetch<{ results?: DiscoverMovie[]; total_pages?: number }>(
      'discover/movie',
      {
        region,
        with_release_type: mode === 'cinema' ? '3|2' : '4',
        'release_date.gte': range.gte,
        'release_date.lte': range.lte,
        sort_by: 'popularity.desc',
        page,
      }
    );
    for (const item of res.results || []) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      raws.push(item);
    }
    if (!res.total_pages || page >= res.total_pages) break;
  }

  // Regionales Datum in kleinen Batches auflösen (Connection-Pool schonen).
  const capped = raws.slice(0, MAX_PER_MODE);
  const entries: FilmReleaseEntry[] = [];
  for (let i = 0; i < capped.length; i += RESOLVE_BATCH) {
    const batch = capped.slice(i, i + RESOLVE_BATCH);
    const resolved = await Promise.all(batch.map((raw) => resolveEntry(raw, mode, region, range)));
    for (const entry of resolved) if (entry) entries.push(entry);
  }

  entries.sort((a, b) =>
    a.releaseDate < b.releaseDate ? -1 : a.releaseDate > b.releaseDate ? 1 : 0
  );
  cache.set(key, entries);
  return entries;
}
