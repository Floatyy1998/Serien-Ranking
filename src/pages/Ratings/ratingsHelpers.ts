import type { useAuth } from '../../AuthContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { getImageUrl } from '../../utils/imageUrl';

// ─── Types ──────────────────────────────────────────────────────────────

export interface PreparedItem {
  id: number;
  title: string;
  posterUrl: string;
  rating: number;
  progress: number;
  isMovie: boolean;
  watchlist: boolean;
  releaseDate?: string;
  year?: string;
  genres?: string;
  providers: { name: string; logo: string }[];
}

export interface RatingsStats {
  count: number;
  average: number;
}

export interface UseRatingsDataResult {
  /** Auth - null when context or user is not available */
  user: NonNullable<ReturnType<typeof useAuth>>['user'];
  /** Current active tab */
  activeTab: 'series' | 'movies';
  /** Items to render (progressive) */
  itemsToRender: PreparedItem[];
  /** All current items (after filter/sort) */
  currentItems: PreparedItem[];
  /** Counts per tab */
  seriesCount: number;
  moviesCount: number;
  /** Rating stats */
  stats: RatingsStats;
  /** QuickFilter integration */
  filters: {
    sortBy: string;
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
  };
  /** Handlers */
  handleTabChange: (id: string) => void;
  handleQuickFilterChange: (newFilters: {
    sortBy?: string;
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
  }) => void;
  handleGridClick: (e: React.MouseEvent) => void;
  /** Ref to attach to the scroll container */
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Quick filter active state for empty message */
  quickFilter: string | null;
}

// ─── Helpers (pure functions, created once) ─────────────────────────────

export function getRating(item: Series | Movie): number {
  const r = parseFloat(calculateOverallRating(item));
  return isNaN(r) ? 0 : r;
}

export function getSeriesProgress(series: Series): number {
  if (!series.seasons) return 0;
  let aired = 0;
  let watched = 0;
  for (const season of series.seasons) {
    if (!season.episodes) continue;
    for (const ep of season.episodes) {
      if (!ep) continue;
      if (hasEpisodeAired(ep)) {
        aired++;
        if (ep.watched) watched++;
      }
    }
  }
  return aired > 0 ? (watched / aired) * 100 : 0;
}

export function hasWatchedEpisodes(series: Series): boolean {
  if (!series.seasons) return false;
  for (const season of series.seasons) {
    if (!season.episodes) continue;
    for (const ep of season.episodes) {
      if (!ep) continue;
      if (hasEpisodeAired(ep) && ep.watched) return true;
    }
  }
  return false;
}

export function extractProviders(item: Series | Movie): { name: string; logo: string }[] {
  const result: { name: string; logo: string }[] = [];
  if (!item.provider?.provider?.length) return result;
  const seen = new Set<string>();
  for (const p of item.provider.provider) {
    if (!seen.has(p.name) && result.length < 2) {
      seen.add(p.name);
      result.push({ name: p.name, logo: p.logo });
    }
  }
  return result;
}

function extractGenres(item: Series | Movie): string | undefined {
  const genres = item.genre?.genres?.filter((g) => g.toLowerCase() !== 'all');
  if (genres && genres.length > 0) return genres.slice(0, 2).join(', ');
  const tmdbGenres = item.genres;
  if (tmdbGenres && tmdbGenres.length > 0)
    return tmdbGenres
      .filter((g) => g.name.toLowerCase() !== 'all')
      .slice(0, 2)
      .map((g) => g.name)
      .join(', ');
  return undefined;
}

function extractYear(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  return String(dateStr).slice(0, 4) || undefined;
}

function getSeriesYear(s: Series): string | undefined {
  // 1. Explicit dates
  const explicit = s.first_air_date || s.release_date;
  if (explicit) return extractYear(explicit);
  // 2. Fallback: first episode air_date
  if (s.seasons) {
    for (const season of s.seasons) {
      if (!season.episodes) continue;
      for (const ep of season.episodes) {
        if (!ep) continue;
        const d = ep.air_date || ep.airDate || ep.firstAired;
        if (d) return extractYear(d);
      }
    }
  }
  return undefined;
}

export function prepareSeriesItem(s: Series, r: number): PreparedItem {
  return {
    id: s.id,
    title: s.title || '',
    posterUrl: getImageUrl(s.poster, 'w342', ''),
    rating: r,
    progress: getSeriesProgress(s),
    isMovie: false,
    watchlist: s.watchlist === true,
    year: getSeriesYear(s),
    genres: extractGenres(s),
    providers: extractProviders(s),
  };
}

export function prepareMovieItem(m: Movie, r: number): PreparedItem {
  return {
    id: m.id,
    title: m.title || '',
    posterUrl: getImageUrl(m.poster, 'w342', ''),
    rating: r,
    progress: 0,
    isMovie: true,
    watchlist: m.watchlist === true,
    releaseDate: m.release_date,
    year: extractYear(m.release_date),
    genres: extractGenres(m),
    providers: extractProviders(m),
  };
}
