import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  trackFriendProfileTabSwitched,
  trackFriendProfileTasteMatchClicked,
} from '../../firebase/analytics';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FriendProvider {
  id: number;
  logo: string;
  name: string;
}

export interface FriendEpisode {
  air_date?: string;
  airstamp?: string;
  id: number;
  name?: string;
  watched?: boolean;
  watchCount?: number;
  episode_number?: number;
}

export interface FriendSeason {
  seasonNumber?: number;
  season_number?: number;
  rating?: number;
  episodes?: FriendEpisode[];
}

export interface FriendItem {
  id: number;
  nmr: number;
  title: string;
  poster: string | { poster: string };
  rating: Record<string, number> | number;
  genre?: { genres?: string[] };
  genres?: string[];
  provider?: { provider: FriendProvider[] };
  seasons?: FriendSeason[];
  release_date?: string;
  status?: string;
  production?: { production: boolean };
}

export interface Filters {
  genre?: string;
  provider?: string;
  quickFilter?: string;
  search?: string;
  sortBy?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export const calculateFriendRating = (item: FriendItem): string => {
  if (!item.rating) return '0.00';
  return calculateOverallRating(item as unknown as Series);
};

export const calculateProgress = (item: FriendItem): number => {
  if (!item.seasons) return 0;
  let totalAiredEpisodes = 0;
  let watchedEpisodes = 0;

  item.seasons.forEach((season) => {
    if (season.episodes) {
      const episodes = Array.isArray(season.episodes)
        ? season.episodes
        : (Object.values(season.episodes || {}) as FriendEpisode[]);
      episodes.forEach((ep: FriendEpisode) => {
        if (hasEpisodeAired(ep) || !ep.air_date) {
          totalAiredEpisodes++;
          if (ep.watched) watchedEpisodes++;
        }
      });
    }
  });

  return totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;
};

/* ------------------------------------------------------------------ */
/*  Filtering / sorting                                                */
/* ------------------------------------------------------------------ */

const filterByGenre = (items: FriendItem[], genre: string): FriendItem[] =>
  items.filter((item) => {
    const genres = item.genres || item.genre?.genres || [];
    return Array.isArray(genres) && genres.some((g) => g.toLowerCase() === genre.toLowerCase());
  });

const filterByProvider = (items: FriendItem[], provider: string): FriendItem[] =>
  items.filter(
    (item) =>
      item.provider?.provider &&
      Array.isArray(item.provider.provider) &&
      item.provider.provider.some((p: FriendProvider) => p.name === provider)
  );

const filterBySearch = (items: FriendItem[], search: string): FriendItem[] => {
  const lower = search.toLowerCase();
  return items.filter((item) => item.title?.toLowerCase().includes(lower));
};

const filterByQuickFilter = (
  items: FriendItem[],
  quickFilter: string,
  isMovieMode: boolean
): FriendItem[] => {
  switch (quickFilter) {
    case 'unrated':
      return items.filter((item) => {
        const r = parseFloat(calculateFriendRating(item));
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
          const r = parseFloat(calculateFriendRating(m));
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

const sortItems = (items: FriendItem[], sortBy: string): FriendItem[] => {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const ratingA = parseFloat(calculateFriendRating(a));
    const ratingB = parseFloat(calculateFriendRating(b));

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

const applyFiltersAndSort = (
  items: FriendItem[],
  filters: Filters,
  isMovieMode: boolean
): FriendItem[] => {
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
};

/* ------------------------------------------------------------------ */
/*  Hook return type                                                   */
/* ------------------------------------------------------------------ */

export interface UseFriendProfileDataReturn {
  loading: boolean;
  friendId: string | undefined;
  friendName: string;
  activeTab: 'series' | 'movies';
  setActiveTab: React.Dispatch<React.SetStateAction<'series' | 'movies'>>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  ratedSeries: FriendItem[];
  ratedMovies: FriendItem[];
  currentItems: FriendItem[];
  averageRating: number;
  itemsWithRatingCount: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleItemClick: (item: FriendItem, type: 'series' | 'movie') => void;
  navigateToTasteMatch: () => void;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export const useFriendProfileData = (): UseFriendProfileDataReturn => {
  const { id: friendId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [friendName, setFriendName] = useState('');
  const [friendSeries, setFriendSeries] = useState<FriendItem[]>([]);
  const [friendMovies, setFriendMovies] = useState<FriendItem[]>([]);
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [filters, setFilters] = useState<Filters>({});

  /* ---------- data fetching ---------- */

  useEffect(() => {
    const loadFriendData = async () => {
      if (!friendId) return;

      try {
        setLoading(true);

        const userRef = firebase.database().ref(`users/${friendId}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();
        setFriendName(userData?.displayName || 'User');

        const seriesRef = firebase.database().ref(`${friendId}/serien`);
        const seriesSnapshot = await seriesRef.once('value');
        const seriesData = seriesSnapshot.val() || {};

        const seriesList: FriendItem[] = [];
        for (const [key, value] of Object.entries(seriesData)) {
          const series = value as FriendItem;
          seriesList.push({
            id: series.id || parseInt(key),
            nmr: series.nmr || parseInt(key),
            title: series.title || 'Unknown',
            poster: series.poster,
            rating: series.rating,
            genre: series.genre,
            genres: series.genre?.genres || [],
            provider: series.provider,
            seasons: Array.isArray(series.seasons)
              ? series.seasons
              : series.seasons
                ? (Object.values(series.seasons) as FriendSeason[])
                : [],
            status: series.status,
            production: series.production,
          });
        }
        setFriendSeries(seriesList);

        const moviesRef = firebase.database().ref(`${friendId}/filme`);
        const moviesSnapshot = await moviesRef.once('value');
        const moviesData = moviesSnapshot.val() || {};

        const moviesList: FriendItem[] = [];
        for (const [key, value] of Object.entries(moviesData)) {
          const movie = value as FriendItem;
          moviesList.push({
            id: movie.id || parseInt(key),
            nmr: movie.nmr || parseInt(key),
            title: movie.title || 'Unknown',
            poster: movie.poster,
            rating: movie.rating,
            genre: movie.genre,
            genres: movie.genre?.genres || [],
            provider: movie.provider,
            release_date: movie.release_date,
            status: movie.status,
            production: movie.production,
          });
        }
        setFriendMovies(moviesList);
      } catch (error) {
        console.error('Error loading friend data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriendData();
  }, [friendId]);

  /* ---------- filtered / sorted lists ---------- */

  const ratedSeries = useMemo(
    () => applyFiltersAndSort(friendSeries, filters, false),
    [friendSeries, filters]
  );

  const ratedMovies = useMemo(
    () => applyFiltersAndSort(friendMovies, filters, true),
    [friendMovies, filters]
  );

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  /* ---------- scroll restoration ---------- */

  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('shouldRestoreFriendProfileScroll');

    if (shouldRestore === 'true' && currentItems.length > 0) {
      sessionStorage.removeItem('shouldRestoreFriendProfileScroll');

      const scrollKey = `friendProfilePageScroll_${friendId}_${activeTab}`;
      const position = sessionStorage.getItem(scrollKey);
      const scrollSource = sessionStorage.getItem(
        `friendProfilePageScrollSource_${friendId}_${activeTab}`
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
  }, [friendId, activeTab, currentItems.length]);

  /* ---------- stats ---------- */

  const itemsWithRating = useMemo(
    () =>
      currentItems.filter((item) => {
        const rating = parseFloat(calculateFriendRating(item));
        return !isNaN(rating) && rating > 0;
      }),
    [currentItems]
  );

  const averageRating = useMemo(
    () =>
      itemsWithRating.length > 0
        ? itemsWithRating.reduce((acc, item) => acc + parseFloat(calculateFriendRating(item)), 0) /
          itemsWithRating.length
        : 0,
    [itemsWithRating]
  );

  /* ---------- navigation ---------- */

  const handleItemClick = useCallback(
    (item: FriendItem, type: 'series' | 'movie') => {
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
        }
      }

      if (position > 0) {
        try {
          const scrollKey = `friendProfilePageScroll_${friendId}_${activeTab}`;
          sessionStorage.setItem(scrollKey, position.toString());
          sessionStorage.setItem(
            `friendProfilePageScrollSource_${friendId}_${activeTab}`,
            scrollSource
          );
          sessionStorage.setItem('shouldRestoreFriendProfileScroll', 'true');
        } catch (error) {
          console.error('Error saving scroll position:', error);
        }
      }

      navigate(type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
    },
    [friendId, activeTab, navigate]
  );

  const navigateToTasteMatch = useCallback(() => {
    trackFriendProfileTasteMatchClicked(friendName);
    navigate(`/taste-match/${friendId}`);
  }, [navigate, friendId, friendName]);

  return {
    loading,
    friendId,
    friendName,
    activeTab,
    setActiveTab: ((tab: 'series' | 'movies') => {
      setActiveTab(tab);
      trackFriendProfileTabSwitched(tab);
    }) as React.Dispatch<React.SetStateAction<'series' | 'movies'>>,
    filters,
    setFilters,
    ratedSeries,
    ratedMovies,
    currentItems,
    averageRating,
    itemsWithRatingCount: itemsWithRating.length,
    scrollRef,
    handleItemClick,
    navigateToTasteMatch,
  };
};
