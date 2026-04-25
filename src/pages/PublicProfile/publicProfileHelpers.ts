import { useTheme } from '../../contexts/ThemeContextDef';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface PublicProvider {
  id: number;
  logo: string;
  name: string;
}

export interface PublicEpisode {
  air_date?: string;
  airstamp?: string;
  id: number;
  name?: string;
  watched?: boolean;
  watchCount?: number;
  episode_number?: number;
}

export interface PublicSeason {
  seasonNumber?: number;
  season_number?: number;
  rating?: number;
  episodes?: PublicEpisode[];
}

export interface PublicItem {
  id: number;
  nmr: number;
  title: string;
  poster: string | { poster: string };
  rating: Record<string, number> | number;
  genre?: { genres?: string[] };
  genres?: string[];
  provider?: { provider: PublicProvider[] };
  seasons?: PublicSeason[];
  release_date?: string;
  status?: string;
  production?: { production: boolean };
}

export interface PublicFilters {
  genre?: string;
  provider?: string;
  quickFilter?: string;
  search?: string;
  sortBy?: string;
}

export interface PublicUserData {
  publicProfileId?: string;
  isPublicProfile?: boolean;
  username?: string;
  displayName?: string;
}

/* ------------------------------------------------------------------ */
/*  Fallback theme for unauthenticated visitors                        */
/* ------------------------------------------------------------------ */

export interface FallbackTheme {
  primary: string;
  background: {
    default: string;
    surface: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  border: {
    default: string;
  };
}

export type PublicTheme = ReturnType<typeof useTheme>['currentTheme'] | FallbackTheme;

export function useResolvedTheme(): PublicTheme {
  try {
    const theme = useTheme();
    return theme.currentTheme;
  } catch {
    return {
      primary: 'var(--theme-primary, #667eea)',
      background: {
        default: 'var(--theme-bg-default, #0a0a0f)',
        surface: 'rgba(255, 255, 255, 0.04)',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
      border: {
        default: 'rgba(255, 255, 255, 0.08)',
      },
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Rating helpers                                                     */
/* ------------------------------------------------------------------ */

export function calculatePublicRating(item: PublicItem): string {
  if (!item.rating) return '0.00';
  return calculateOverallRating(item as unknown as Series);
}

/* ------------------------------------------------------------------ */
/*  Progress helper                                                    */
/* ------------------------------------------------------------------ */

export function calculateProgress(item: PublicItem): number {
  if (!item.seasons) return 0;
  let totalAiredEpisodes = 0;
  let watchedEpisodes = 0;

  item.seasons.forEach((season) => {
    if (season.episodes) {
      const episodes = Array.isArray(season.episodes)
        ? season.episodes
        : (Object.values(season.episodes || {}) as PublicEpisode[]);
      episodes.forEach((ep: PublicEpisode) => {
        if (hasEpisodeAired(ep) || !ep.air_date) {
          totalAiredEpisodes++;
          if (ep.watched) watchedEpisodes++;
        }
      });
    }
  });

  return totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;
}

/* ------------------------------------------------------------------ */
/*  Filtering / sorting (identical to FriendProfile semantics)         */
/* ------------------------------------------------------------------ */

const filterByGenre = (items: PublicItem[], genre: string): PublicItem[] =>
  items.filter((item) => {
    const genres = item.genres || item.genre?.genres || [];
    return Array.isArray(genres) && genres.some((g) => g.toLowerCase() === genre.toLowerCase());
  });

const filterByProvider = (items: PublicItem[], provider: string): PublicItem[] =>
  items.filter(
    (item) =>
      item.provider?.provider &&
      Array.isArray(item.provider.provider) &&
      item.provider.provider.some((p: PublicProvider) => p.name === provider)
  );

const filterBySearch = (items: PublicItem[], search: string): PublicItem[] => {
  const lower = search.toLowerCase();
  return items.filter((item) => item.title?.toLowerCase().includes(lower));
};

const filterByQuickFilter = (
  items: PublicItem[],
  quickFilter: string,
  isMovieMode: boolean
): PublicItem[] => {
  switch (quickFilter) {
    case 'unrated':
      return items.filter((item) => {
        const r = parseFloat(calculatePublicRating(item));
        return isNaN(r) || r === 0;
      });

    case 'started':
      if (isMovieMode) return items;
      return items.filter((item) => {
        if (!item.seasons) return false;
        let watched = 0;
        let totalAired = 0;
        item.seasons.forEach((season) => {
          if (season.episodes) {
            season.episodes.forEach((ep) => {
              if (hasEpisodeAired(ep) || !ep.air_date) {
                totalAired++;
                if (ep.watched) watched++;
              }
            });
          }
        });
        return watched > 0 && watched < totalAired;
      });

    case 'not-started':
      if (isMovieMode) {
        return items.filter((m) => {
          const r = parseFloat(calculatePublicRating(m));
          return isNaN(r) || r === 0;
        });
      }
      return items.filter((item) => {
        if (!item.seasons) return true;
        let watched = 0;
        item.seasons.forEach((season) => {
          if (season.episodes) {
            season.episodes.forEach((ep) => {
              if ((hasEpisodeAired(ep) || !ep.air_date) && ep.watched) watched++;
            });
          }
        });
        return watched === 0;
      });

    case 'ongoing':
      return items.filter((item) => {
        const status = item.status?.toLowerCase();
        return (
          status === 'returning series' ||
          status === 'ongoing' ||
          (!status && item.production?.production === true)
        );
      });

    default:
      return items;
  }
};

const sortItems = (items: PublicItem[], sortBy: string): PublicItem[] => {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const ratingA = parseFloat(calculatePublicRating(a));
    const ratingB = parseFloat(calculatePublicRating(b));

    switch (sortBy) {
      case 'rating-desc':
        return ratingB - ratingA;
      case 'rating-asc':
        return ratingA - ratingB;
      case 'name-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'name-desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'date-desc':
        return Number(b.nmr) - Number(a.nmr);
      default:
        return ratingB - ratingA;
    }
  });
  return sorted;
};

export function applyFilters(
  items: PublicItem[],
  filters: PublicFilters,
  isMovieMode: boolean
): PublicItem[] {
  let filtered = items;

  if (filters.genre && filters.genre !== 'All') {
    filtered = filterByGenre(filtered, filters.genre);
  }
  if (filters.provider && filters.provider !== 'All') {
    filtered = filterByProvider(filtered, filters.provider);
  }
  if (filters.search) {
    filtered = filterBySearch(filtered, filters.search);
  }
  if (filters.quickFilter) {
    filtered = filterByQuickFilter(filtered, filters.quickFilter, isMovieMode);
  }

  const sortBy =
    filters.quickFilter === 'ongoing'
      ? 'rating-desc'
      : filters.quickFilter === 'recently-added'
        ? 'date-desc'
        : filters.sortBy || 'rating-desc';

  return sortItems(filtered, sortBy);
}
