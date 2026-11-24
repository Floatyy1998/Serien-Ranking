import { t } from '../../services/i18n';
import type { Movie } from '../../types/Movie';
import { isMovieWatched } from '../rating/rating';

export type MovieReleaseKind = 'cinema' | 'digital';

export interface RegionalRelease {
  date: string;
  kind: MovieReleaseKind;
}

export interface MovieCountdown {
  type: 'movie-release';
  movieId: number;
  title: string;
  posterUrl: string;
  nextDate: string;
  daysUntil: number;
  release: MovieReleaseKind | 'unknown';
}

export interface TmdbReleaseDates {
  results?: {
    iso_3166_1: string;
    release_dates?: { type: number; release_date: string }[];
  }[];
}

// TMDB release_dates: 1 Premiere, 2 Kino (limitiert), 3 Kino, 4 Digital, 5 Physisch, 6 TV
export const CINEMA_RELEASE_TYPES = [3, 2];
export const DIGITAL_RELEASE_TYPES = [4];

const DAY_MS = 86_400_000;
const CANDIDATE_LOOKBACK_DAYS = 365;

export function pickRegionalDate(data: TmdbReleaseDates, region: string, types: number[]): string {
  const regional = data.results?.find((r) => r.iso_3166_1 === region);
  if (!regional?.release_dates?.length) return '';
  const dates = regional.release_dates
    .filter((d) => types.includes(d.type) && d.release_date)
    .map((d) => d.release_date.slice(0, 10))
    .sort();
  return dates[0] || '';
}

export function pickRegionalRelease(
  data: TmdbReleaseDates,
  region: string
): RegionalRelease | null {
  const cinema = pickRegionalDate(data, region, CINEMA_RELEASE_TYPES);
  if (cinema) return { date: cinema, kind: 'cinema' };
  const digital = pickRegionalDate(data, region, DIGITAL_RELEASE_TYPES);
  if (digital) return { date: digital, kind: 'digital' };
  return null;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Katalog-Wert `"KINO|DIGITAL"` (je frühestes Datum oder leer) → Start in der Region. */
export function parseCatalogRelease(value: string | null | undefined): RegionalRelease | null {
  const [cinema, digital] = (value || '').split('|');
  if (ISO_DAY.test(cinema)) return { date: cinema, kind: 'cinema' };
  if (digital && ISO_DAY.test(digital)) return { date: digital, kind: 'digital' };
  return null;
}

export function parseLocalDay(dateStr: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || '');
  if (!match) return null;
  const day = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(day.getTime()) ? null : day;
}

export function startOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntilDay(dateStr: string | null | undefined, today: Date): number | null {
  const day = parseLocalDay(dateStr);
  if (!day) return null;
  return Math.round((day.getTime() - startOfDay(today).getTime()) / DAY_MS);
}

const isAwaited = (movie: Movie): boolean =>
  !!movie?.id && !isMovieWatched(movie) && movie.status !== 'Canceled';

// Das Katalog-Datum ist das weltweit früheste (oft eine Festival-Premiere) — der regionale
// Start kann Monate später liegen, darum zählen auch jüngst „erschienene" Filme als Kandidaten.
export function isReleaseCandidate(movie: Movie, today: Date): boolean {
  if (!isAwaited(movie)) return false;
  const days = daysUntilDay(movie.release_date, today);
  if (days !== null) return days >= -CANDIDATE_LOOKBACK_DAYS;
  return !!movie.status && movie.status !== 'Released';
}

export function sortReleaseCandidates(movies: Movie[]): Movie[] {
  return [...movies].sort((a, b) =>
    (b.release_date || '9999').localeCompare(a.release_date || '9999')
  );
}

export function buildMovieCountdowns(
  movies: Movie[],
  lookup: (movieId: number) => RegionalRelease | null | undefined,
  today: Date
): MovieCountdown[] {
  const results: MovieCountdown[] = [];
  for (const movie of movies) {
    if (!isAwaited(movie)) continue;
    const regional = lookup(movie.id);
    const nextDate = regional?.date || movie.release_date || '';
    const daysUntil = daysUntilDay(nextDate, today);
    if (daysUntil === null || daysUntil < 0) continue;
    results.push({
      type: 'movie-release',
      movieId: movie.id,
      title: movie.title || '',
      posterUrl: movie.poster?.poster || '',
      nextDate: nextDate.slice(0, 10),
      daysUntil,
      release: regional?.kind ?? 'unknown',
    });
  }
  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function movieReleaseLabel(release: MovieCountdown['release']): string {
  if (release === 'cinema') return t('Kinostart');
  if (release === 'digital') return t('Streaming-Start');
  return t('Filmstart');
}
