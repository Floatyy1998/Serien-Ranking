import { useTheme } from '../../contexts/ThemeContext';
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
  production?: {
    production: boolean;
  };
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

export function resolveTheme(): PublicTheme {
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
  if (!item.rating) return '0.0';

  let totalRating = 0;
  let ratingCount = 0;

  if (item.seasons && Array.isArray(item.seasons)) {
    item.seasons.forEach((season: PublicSeason) => {
      if (season.rating && season.rating > 0) {
        totalRating += season.rating;
        ratingCount++;
      }
    });
  }

  if (typeof item.rating === 'number' && item.rating > 0) {
    totalRating += item.rating;
    ratingCount++;
  }

  if (ratingCount === 0) return '0.0';
  return (totalRating / ratingCount).toFixed(1);
}

/* ------------------------------------------------------------------ */
/*  Filtering + sorting (shared between series & movies)               */
/* ------------------------------------------------------------------ */

export function applyFilters(
  items: PublicItem[],
  filters: PublicFilters,
  isMovieMode: boolean
): PublicItem[] {
  let filtered = items;

  /* genre */
  if (filters.genre && filters.genre !== 'All') {
    filtered = filtered.filter((item) => {
      const genres = item.genre?.genres || [];
      if (Array.isArray(genres)) {
        return genres.some((g: string) => g.toLowerCase() === filters.genre!.toLowerCase());
      }
      return false;
    });
  }

  /* provider */
  if (filters.provider && filters.provider !== 'All') {
    filtered = filtered.filter((item) => {
      if (item.provider?.provider && Array.isArray(item.provider.provider)) {
        return item.provider.provider.some((p: PublicProvider) => p.name === filters.provider);
      }
      return false;
    });
  }

  /* search */
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((item) => item.title?.toLowerCase().includes(searchLower));
  }

  /* quick filters */
  if (filters.quickFilter === 'watchlist') {
    filtered = [];
  } else if (filters.quickFilter === 'unrated') {
    filtered = filtered.filter((s) => {
      const rating = parseFloat(calculatePublicRating(s));
      return isNaN(rating) || rating === 0;
    });
  } else if (filters.quickFilter === 'started') {
    if (isMovieMode) {
      filtered = [];
    } else {
      filtered = filtered.filter((s) => {
        if (!s.seasons) return false;
        let totalAiredEpisodes = 0;
        let watchedEpisodes = 0;

        s.seasons.forEach((season: PublicSeason) => {
          if (season.episodes) {
            season.episodes.forEach((ep: PublicEpisode) => {
              if (hasEpisodeAired(ep) || !ep.air_date) {
                totalAiredEpisodes++;
                if (ep.watched) watchedEpisodes++;
              }
            });
          }
        });

        return watchedEpisodes > 0 && watchedEpisodes < totalAiredEpisodes;
      });
    }
  } else if (filters.quickFilter === 'not-started') {
    if (isMovieMode) {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculatePublicRating(m));
        return isNaN(rating) || rating === 0;
      });
    } else {
      filtered = filtered.filter((s) => {
        if (!s.seasons) return true;
        let watchedEpisodes = 0;

        s.seasons.forEach((season: PublicSeason) => {
          if (season.episodes) {
            season.episodes.forEach((ep: PublicEpisode) => {
              if ((hasEpisodeAired(ep) || !ep.air_date) && ep.watched) {
                watchedEpisodes++;
              }
            });
          }
        });

        return watchedEpisodes === 0;
      });
    }
  }
  // 'ongoing' and 'recently-added' leave filtered unchanged

  /* sorting */
  const sortBy =
    filters.quickFilter === 'ongoing'
      ? 'rating-desc'
      : filters.quickFilter === 'recently-added'
        ? 'date-desc'
        : filters.sortBy || 'rating-desc';

  filtered.sort((a, b) => {
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

  return filtered;
}

/* ------------------------------------------------------------------ */
/*  Progress helper                                                    */
/* ------------------------------------------------------------------ */

export function calculateProgress(item: PublicItem): number {
  if (!item.seasons) return 0;
  let totalAiredEpisodes = 0;
  let watchedEpisodes = 0;

  item.seasons.forEach((season: PublicSeason) => {
    if (season.episodes) {
      season.episodes.forEach((ep: PublicEpisode) => {
        if (hasEpisodeAired(ep) || !ep.air_date) {
          totalAiredEpisodes++;
          if (ep.watched) watchedEpisodes++;
        }
      });
    }
  });

  return totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;
}
