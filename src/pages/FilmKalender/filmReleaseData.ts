/**
 * Datenlayer des Film-Kalenders: TMDB-Discover für ein Quartal + Modus (Kino/
 * Digital) in der Watch-Region des Users. Discover liefert mit `region` schon
 * das früheste regionale Datum des abgefragten Typs — die Liste kommt deshalb
 * komplett aus den Discover-Seiten, ohne Abruf pro Film. Regie, Besetzung und
 * Anbieter lädt jede Karte selbst nach (fetchFilmDetails), sobald sie sichtbar
 * wird. Beides wird pro Session gecacht.
 */

import { tmdbFetch } from '../../services/api/tmdbClient';
import { pickProviderTiers, watchRegion } from '../../services/settings/region';
import { isSupportedProvider } from '../../config/menuItems';
import { getProviderLogoUrl } from '../../lib/provider/providerMerge';
import { normalizeProviderName } from '../../lib/provider/providerName';
import { mapGenreIds } from '../../utils/genreMap';

export type ReleaseMode = 'cinema' | 'digital';

export interface FilmDetails {
  /** Flatrate-Anbieter der Watch-Region (nur Streaming-Modus, sonst leer). */
  providers: { name: string; logo: string }[];
  directors: string[];
  cast: string[];
}

export interface FilmReleaseEntry extends FilmDetails {
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
}

interface MovieCredits {
  cast?: { name?: string; order?: number }[];
  crew?: { name?: string; job?: string }[];
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

/** Obergrenze der Discover-Seiten (20 Filme je Seite); ein Quartal hat 11–16. */
const MAX_DISCOVER_PAGES = 40;
/** Erststart weltweit höchstens so lange vor dem Zeitraum — ältere Filme sind
 *  Wiederaufführungen bzw. Katalogtitel, keine Neustarts. */
const MAX_AGE_YEARS = 2;
const DETAIL_PARALLEL = 6;

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
}

const cache = new Map<string, FilmReleaseEntry[]>();
const pending = new Map<string, Promise<FilmReleaseEntry[]>>();

function yearsBefore(day: string, years: number): string {
  return `${Number(day.slice(0, 4)) - years}${day.slice(4)}`;
}

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

async function resolveCredits(movieId: number): Promise<MovieCredits | undefined> {
  try {
    return await tmdbFetch<MovieCredits>(`movie/${movieId}/credits`, { language: undefined });
  } catch {
    return undefined;
  }
}

const detailsCache = new Map<string, FilmDetails>();
const detailsPending = new Map<string, Promise<FilmDetails>>();
let detailsActive = 0;
const detailsWaiting: (() => void)[] = [];

// Beim schnellen Scrollen melden sich viele Karten auf einmal — die zuletzt
// sichtbar gewordene ist die, auf die der Nutzer gerade schaut.
async function withDetailSlot<T>(task: () => Promise<T>): Promise<T> {
  if (detailsActive >= DETAIL_PARALLEL) {
    await new Promise<void>((resolve) => detailsWaiting.push(resolve));
  } else {
    detailsActive++;
  }
  try {
    return await task();
  } finally {
    const next = detailsWaiting.pop();
    if (next) next();
    else detailsActive--;
  }
}

const detailsKey = (movieId: number, mode: ReleaseMode) => `${watchRegion}:${mode}:${movieId}`;

export function peekFilmDetails(movieId: number, mode: ReleaseMode): FilmDetails | undefined {
  return detailsCache.get(detailsKey(movieId, mode));
}

/** Regie, Besetzung und (nur Streaming) Anbieter eines Films. */
export function fetchFilmDetails(movieId: number, mode: ReleaseMode): Promise<FilmDetails> {
  const key = detailsKey(movieId, mode);
  const cached = detailsCache.get(key);
  if (cached) return Promise.resolve(cached);
  const running = detailsPending.get(key);
  if (running) return running;
  const run = withDetailSlot(async () => {
    const [credits, providers] = await Promise.all([
      resolveCredits(movieId),
      mode === 'digital' ? resolveProviders(movieId) : Promise.resolve([]),
    ]);
    const details: FilmDetails = {
      providers,
      directors: pickDirectors(credits),
      cast: pickLeadCast(credits),
    };
    detailsCache.set(key, details);
    return details;
  }).finally(() => detailsPending.delete(key));
  detailsPending.set(key, run);
  return run;
}

async function loadReleases(
  mode: ReleaseMode,
  region: string,
  range: { gte: string; lte: string }
): Promise<FilmReleaseEntry[]> {
  const fetchPage = (page: number) =>
    tmdbFetch<DiscoverResponse>('discover/movie', {
      region,
      with_release_type: mode === 'cinema' ? '3|2' : '4',
      'release_date.gte': range.gte,
      'release_date.lte': range.lte,
      'primary_release_date.gte': yearsBefore(range.gte, MAX_AGE_YEARS),
      sort_by: 'popularity.desc',
      page,
    });

  const first = await fetchPage(1);
  const lastPage = Math.min(first.total_pages || 1, MAX_DISCOVER_PAGES);
  const followPages: number[] = [];
  for (let page = 2; page <= lastPage; page++) followPages.push(page);
  const responses = [first, ...(await Promise.all(followPages.map(fetchPage)))];

  const seen = new Set<number>();
  const entries: FilmReleaseEntry[] = [];
  for (const res of responses) {
    for (const raw of res.results || []) {
      if (!raw?.id || seen.has(raw.id)) continue;
      seen.add(raw.id);
      // Das Discover-Datum ist der früheste Termin der Region: liegt er vor
      // dem Zeitraum, ist der Termin im Zeitraum eine Wiederaufführung.
      const releaseDate = raw.release_date || '';
      if (releaseDate < range.gte || releaseDate > range.lte) continue;
      entries.push({
        tmdbId: raw.id,
        title: raw.title || '',
        poster: raw.poster_path ? `https://image.tmdb.org/t/p/w342${raw.poster_path}` : '',
        releaseDate,
        rating:
          typeof raw.vote_average === 'number' && raw.vote_average > 0 ? raw.vote_average : null,
        genres: mapGenreIds(raw.genre_ids || [], 3),
        overview: raw.overview || '',
        mode,
        providers: [],
        directors: [],
        cast: [],
      });
    }
  }

  // Stabil: Filme desselben Tages bleiben nach Popularität geordnet.
  return entries.sort((a, b) =>
    a.releaseDate < b.releaseDate ? -1 : a.releaseDate > b.releaseDate ? 1 : 0
  );
}

/**
 * Alle Releases eines 3-Monats-Blocks (Quartals-Tab wie beim Serien-Kalender)
 * für einen Modus (Kino/Digital), nach Datum sortiert. Session-Cache pro
 * Region+Bereich+Modus.
 */
export function fetchFilmReleases(
  quarterStart: Date,
  mode: ReleaseMode
): Promise<FilmReleaseEntry[]> {
  const region = watchRegion;
  const range = quarterRange(quarterStart, 3);
  const key = `${region}:${range.gte}:${range.lte}:${mode}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const running = pending.get(key);
  if (running) return running;
  const run = loadReleases(mode, region, range)
    .then((entries) => {
      cache.set(key, entries);
      return entries;
    })
    .finally(() => pending.delete(key));
  pending.set(key, run);
  return run;
}
