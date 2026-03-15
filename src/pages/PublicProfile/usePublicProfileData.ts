import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  trackPublicProfileTabSwitched,
  trackPublicProfileItemClicked,
} from '../../firebase/analytics';
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

interface PublicUserData {
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

function resolveTheme(): PublicTheme {
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

function applyFilters(
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

/* ================================================================== */
/*  Main hook                                                          */
/* ================================================================== */

export function usePublicProfileData() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const currentTheme = resolveTheme();

  /* state */
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileSeries, setProfileSeries] = useState<PublicItem[]>([]);
  const [profileMovies, setProfileMovies] = useState<PublicItem[]>([]);
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [profileExists, setProfileExists] = useState(true);
  const [filters, setFilters] = useState<PublicFilters>({});

  /* ----- data fetching ----- */
  useEffect(() => {
    const loadPublicProfileData = async () => {
      if (!publicId) return;

      try {
        const usersRef = firebase.database().ref('users');
        const usersSnapshot = await usersRef.once('value');
        const users = usersSnapshot.val();

        let foundUser: PublicUserData | null = null;
        let foundUserId: string | null = null;

        if (users) {
          for (const [userId, userData] of Object.entries(users)) {
            const user = userData as PublicUserData;
            if (user.publicProfileId === publicId && user.isPublicProfile) {
              foundUser = user;
              foundUserId = userId;
              break;
            }
          }
        }

        if (!foundUser || !foundUserId) {
          setProfileExists(false);
          setLoading(false);
          return;
        }

        setProfileName(foundUser.username || foundUser.displayName || 'Unbekannt');

        // Load series
        const seriesRef = firebase.database().ref(`${foundUserId}/serien`);
        const seriesSnapshot = await seriesRef.once('value');
        const series = seriesSnapshot.val();

        if (series) {
          const seriesArray = Object.entries(series).map(([key, value]) => {
            const data = value as PublicItem;
            return {
              id: data.id || parseInt(key),
              nmr: data.nmr || parseInt(key),
              title: data.title,
              poster: data.poster,
              rating: data.rating,
              genre: data.genre,
              genres: data.genres,
              provider: data.provider,
              seasons: Array.isArray(data.seasons)
                ? data.seasons
                : data.seasons
                  ? (Object.values(data.seasons) as PublicSeason[])
                  : [],
            };
          });
          setProfileSeries(seriesArray);
        }

        // Load movies
        const moviesRef = firebase.database().ref(`${foundUserId}/filme`);
        const moviesSnapshot = await moviesRef.once('value');
        const movies = moviesSnapshot.val();

        if (movies) {
          const moviesArray = Object.entries(movies).map(([key, value]) => {
            const data = value as PublicItem;
            return {
              id: data.id || parseInt(key),
              nmr: data.nmr || parseInt(key),
              title: data.title,
              poster: data.poster,
              rating: data.rating,
              genre: data.genre,
              genres: data.genres,
              provider: data.provider,
              release_date: data.release_date,
            };
          });
          setProfileMovies(moviesArray);
        }
      } catch (error) {
        console.error('Error loading public profile:', error);
        setProfileExists(false);
      } finally {
        setLoading(false);
      }
    };

    loadPublicProfileData();
  }, [publicId]);

  /* ----- filtered / sorted lists ----- */
  const ratedSeries = useMemo(
    () => applyFilters(profileSeries, filters, false),
    [profileSeries, filters]
  );

  const ratedMovies = useMemo(
    () => applyFilters(profileMovies, filters, true),
    [profileMovies, filters]
  );

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  /* ----- average rating ----- */
  const averageRating = useMemo(() => {
    const allItems = [...profileSeries, ...profileMovies];
    const withRating = allItems.filter((item) => {
      const r = parseFloat(calculatePublicRating(item));
      return !isNaN(r) && r > 0;
    });
    if (withRating.length === 0) return 0;
    const total = withRating.reduce(
      (sum, item) => sum + parseFloat(calculatePublicRating(item)),
      0
    );
    return total / withRating.length;
  }, [profileSeries, profileMovies]);

  const itemsWithRatingCount = useMemo(() => {
    const allItems = [...profileSeries, ...profileMovies];
    return allItems.filter((item) => {
      const r = parseFloat(calculatePublicRating(item));
      return !isNaN(r) && r > 0;
    }).length;
  }, [profileSeries, profileMovies]);

  /* ----- scroll position restore ----- */
  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('shouldRestorePublicProfileScroll');

    if (shouldRestore === 'true' && currentItems.length > 0) {
      sessionStorage.removeItem('shouldRestorePublicProfileScroll');

      const scrollKey = `publicProfilePageScroll_${publicId}_${activeTab}`;
      const position = sessionStorage.getItem(scrollKey);
      const scrollSource = sessionStorage.getItem(
        `publicProfilePageScrollSource_${publicId}_${activeTab}`
      );

      if (position) {
        const scrollTop = parseInt(position, 10);
        if (scrollTop > 0) {
          const restoreScroll = () => {
            if (scrollSource && scrollSource.startsWith('parent-')) {
              const parentIndex = parseInt(scrollSource.split('-')[1], 10);
              let element = scrollRef.current?.parentElement;
              for (let i = 0; i < parentIndex && element; i++) {
                element = element.parentElement;
              }
              if (element) {
                if (element.scrollHeight > element.clientHeight) {
                  element.scrollTop = scrollTop;
                  setTimeout(() => {
                    if (element && element.scrollTop < scrollTop * 0.8) {
                      element.scrollTop = scrollTop;
                    }
                  }, 50);
                } else {
                  setTimeout(restoreScroll, 200);
                }
              }
            }
          };

          setTimeout(restoreScroll, 500);
        }
      }
    }
  }, [publicId, activeTab, currentItems.length]);

  /* ----- save scroll + navigate ----- */
  const handleItemClick = useCallback(
    (item: PublicItem, type: 'series' | 'movie') => {
      let position = 0;
      let scrollSource = '';

      let element = scrollRef.current?.parentElement;
      let parentIndex = 0;
      while (element && parentIndex < 5) {
        if (element.scrollTop > 0) {
          position = element.scrollTop;
          scrollSource = `parent-${parentIndex}`;
          break;
        }
        element = element.parentElement;
        parentIndex++;
      }

      if (position === 0) {
        if (scrollRef.current && scrollRef.current.scrollTop > 0) {
          position = scrollRef.current.scrollTop;
          scrollSource = 'container';
        } else if (window.scrollY > 0) {
          position = window.scrollY;
          scrollSource = 'window';
        } else if (document.documentElement.scrollTop > 0) {
          position = document.documentElement.scrollTop;
          scrollSource = 'documentElement';
        } else if (document.body.scrollTop > 0) {
          position = document.body.scrollTop;
          scrollSource = 'body';
        }
      }

      if (position > 0) {
        try {
          const scrollKey = `publicProfilePageScroll_${publicId}_${activeTab}`;
          sessionStorage.setItem(scrollKey, position.toString());
          sessionStorage.setItem(
            `publicProfilePageScrollSource_${publicId}_${activeTab}`,
            scrollSource
          );
          sessionStorage.setItem('shouldRestorePublicProfileScroll', 'true');
        } catch (error) {
          console.error('Error saving scroll position:', error);
        }
      }

      trackPublicProfileItemClicked(String(item.id), type);
      navigate(type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
    },
    [navigate, publicId, activeTab]
  );

  return {
    /* theme */
    currentTheme,
    /* route */
    publicId,
    navigate,
    scrollRef,
    /* loading / error */
    loading,
    profileExists,
    /* profile info */
    profileName,
    averageRating,
    itemsWithRatingCount,
    /* tab */
    activeTab,
    setActiveTab: ((tab: 'series' | 'movies') => {
      setActiveTab(tab);
      trackPublicProfileTabSwitched(tab);
    }) as React.Dispatch<React.SetStateAction<'series' | 'movies'>>,
    /* filters */
    filters,
    setFilters,
    /* items */
    ratedSeries,
    ratedMovies,
    currentItems,
    /* actions */
    handleItemClick,
  };
}
