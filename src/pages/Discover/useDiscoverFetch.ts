import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import type { DiscoverItem } from './DiscoverItemCard';

interface UseDiscoverFetchResult {
  results: DiscoverItem[];
  setResults: React.Dispatch<React.SetStateAction<DiscoverItem[]>>;
  loading: boolean;
  hasMore: boolean;
  searchResults: DiscoverItem[];
  setSearchResults: React.Dispatch<React.SetStateAction<DiscoverItem[]>>;
  searchLoading: boolean;
  recommendations: DiscoverItem[];
  setRecommendations: React.Dispatch<React.SetStateAction<DiscoverItem[]>>;
  recommendationsLoading: boolean;
  recommendationsHasMore: boolean;
  addingItem: string | null;
  snackbar: { open: boolean; message: string };
  dialog: { open: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' };
  setDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
    }>
  >;
  fetchFromTMDB: (reset?: boolean) => Promise<void>;
  fetchRecommendations: (reset?: boolean) => Promise<void>;
  searchItems: (query: string) => Promise<void>;
  addToList: (item: DiscoverItem, event?: React.MouseEvent) => Promise<void>;
  isInList: (id: string | number, type: 'series' | 'movie') => boolean;
  setupScrollListener: (activeCategory: string) => (() => void) | undefined;
}

export const useDiscoverFetch = (
  activeTab: 'series' | 'movies',
  activeCategory: string,
  selectedGenre: number | null,
  showSearch: boolean,
  searchQuery: string,
  isRestoring: boolean
): UseDiscoverFetchResult => {
  const { user } = useAuth()!;
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [results, setResults] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [dialog, setDialog] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'info' });
  const [searchResults, setSearchResults] = useState<DiscoverItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<DiscoverItem[]>([]);
  const [recommendationsHasMore, setRecommendationsHasMore] = useState(true);
  const [usedRecommendationSources, setUsedRecommendationSources] = useState<Set<string>>(
    new Set()
  );

  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const showSearchRef = useRef(showSearch);
  const recommendationsLoadingRef = useRef(recommendationsLoading);
  const recommendationsHasMoreRef = useRef(recommendationsHasMore);
  const activeCategoryRef = useRef(activeCategory);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    showSearchRef.current = showSearch;
  }, [showSearch]);
  useEffect(() => {
    recommendationsLoadingRef.current = recommendationsLoading;
  }, [recommendationsLoading]);
  useEffect(() => {
    recommendationsHasMoreRef.current = recommendationsHasMore;
  }, [recommendationsHasMore]);
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  const isInList = useCallback(
    (id: string | number, type: 'series' | 'movie') => {
      if (type === 'series') {
        return seriesList.some(
          (s: Series) => s.id != null && (s.id === id || s.id.toString() === id.toString())
        );
      } else {
        return movieList.some(
          (m: Movie) => m.id != null && (m.id === id || m.id.toString() === id.toString())
        );
      }
    },
    [seriesList, movieList]
  );

  const fetchRecommendations = useCallback(
    async (reset = false) => {
      if (recommendationsLoading) return;

      setRecommendationsLoading(true);

      try {
        const userItems = activeTab === 'series' ? seriesList : movieList;

        if (userItems.length === 0) {
          setRecommendations([]);
          setRecommendationsHasMore(false);
          setRecommendationsLoading(false);
          return;
        }

        if (reset) {
          setUsedRecommendationSources(new Set());
          setRecommendations([]);
          setRecommendationsHasMore(true);
        }

        const currentUsedSources = reset ? new Set<string>() : new Set(usedRecommendationSources);
        const availableItems = userItems.filter(
          (item) => !currentUsedSources.has(item.id.toString())
        );

        if (availableItems.length === 0) {
          setRecommendationsHasMore(false);
          setRecommendationsLoading(false);
          return;
        }

        const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
        const selectedItems = shuffled.slice(0, Math.min(3, availableItems.length));

        const allRecommendations: DiscoverItem[] = [];
        const existingIds = new Set(recommendations.map((r) => r.id));

        const mediaType = activeTab === 'series' ? 'tv' : 'movie';

        for (const item of selectedItems) {
          const endpoint = `https://api.themoviedb.org/3/${mediaType}/${item.id}/recommendations`;
          const params = new URLSearchParams({
            api_key: import.meta.env.VITE_API_TMDB,
            language: 'de-DE',
          });

          const response = await fetch(`${endpoint}?${params}`);
          const data = await response.json();

          if (data.results) {
            data.results.forEach((rec: DiscoverItem) => {
              if (
                !existingIds.has(rec.id) &&
                !isInList(rec.id, activeTab === 'series' ? 'series' : 'movie')
              ) {
                existingIds.add(rec.id);
                allRecommendations.push({
                  ...rec,
                  type: activeTab === 'series' ? 'series' : 'movie',
                  inList: false,
                  basedOn: (item as Series & Movie).title || (item as Series & Movie).name,
                });
              }
            });
          }

          currentUsedSources.add(item.id.toString());
        }

        const shuffledRecommendations = allRecommendations
          .sort(() => 0.5 - Math.random())
          .slice(0, 20);

        setUsedRecommendationSources(currentUsedSources);

        if (reset) {
          setRecommendations(shuffledRecommendations);
        } else {
          setRecommendations((prev) => [...prev, ...shuffledRecommendations]);
        }

        const remainingItems = userItems.filter(
          (item) => !currentUsedSources.has(item.id.toString())
        );
        setRecommendationsHasMore(remainingItems.length > 0);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        if (reset) {
          setRecommendations([]);
        }
      } finally {
        setRecommendationsLoading(false);
      }
    },
    [
      activeTab,
      seriesList,
      movieList,
      isInList,
      recommendationsLoading,
      recommendations,
      usedRecommendationSources,
    ]
  );

  const fetchFromTMDB = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);
      const currentPage = reset ? 1 : page + 1;

      try {
        let endpoint = '';
        const mediaType = activeTab === 'series' ? 'tv' : 'movie';

        if (selectedGenre) {
          endpoint = `https://api.themoviedb.org/3/discover/${mediaType}`;
        } else {
          switch (activeCategory) {
            case 'trending':
              endpoint = `https://api.themoviedb.org/3/trending/${mediaType}/week`;
              break;
            case 'popular':
              endpoint = `https://api.themoviedb.org/3/${mediaType}/popular`;
              break;
            case 'top_rated':
              endpoint = `https://api.themoviedb.org/3/${mediaType}/top_rated`;
              break;
            case 'upcoming':
              if (activeTab === 'movies') {
                endpoint = `https://api.themoviedb.org/3/movie/upcoming`;
              } else {
                endpoint = `https://api.themoviedb.org/3/tv/on_the_air`;
              }
              break;
          }
        }

        const params = new URLSearchParams({
          api_key: import.meta.env.VITE_API_TMDB,
          language: 'de-DE',
          page: currentPage.toString(),
          region: 'DE',
        });

        if (selectedGenre) {
          params.append('with_genres', selectedGenre.toString());
          params.append(
            'sort_by',
            activeCategory === 'top_rated' ? 'vote_average.desc' : 'popularity.desc'
          );
        }

        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (data.results) {
          const mappedResults = data.results
            .filter(
              (item: DiscoverItem) =>
                !isInList(item.id, activeTab === 'series' ? 'series' : 'movie')
            )
            .map((item: DiscoverItem) => ({
              ...item,
              type: activeTab === 'series' ? 'series' : ('movie' as const),
              inList: false,
            }));

          if (reset) {
            setResults(mappedResults);
            setPage(1);
          } else {
            setResults((prev) => {
              const existingIds = new Set(
                prev.map((item: DiscoverItem) => `${item.type}-${item.id}`)
              );
              const newResults = mappedResults.filter(
                (item: DiscoverItem) => !existingIds.has(`${item.type}-${item.id}`)
              );
              return [...prev, ...newResults];
            });
            setPage(currentPage);
          }

          setHasMore(currentPage < data.total_pages);
        }
      } catch (error) {
        console.error('Error fetching from TMDB:', error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, activeCategory, selectedGenre, page, loading, isInList]
  );

  useEffect(() => {
    if (isRestoring) return;

    if (activeCategory === 'recommendations') {
      fetchRecommendations(true);
    } else if (!showSearch) {
      setResults([]);
      setPage(1);
      setHasMore(true);
      fetchFromTMDB(true);
    }
  }, [activeTab, activeCategory, selectedGenre, showSearch, isRestoring]);

  useEffect(() => {
    if (activeCategory === 'recommendations') {
      if (
        recommendations.length > 0 &&
        recommendationsHasMore &&
        !recommendationsLoading &&
        !showSearch
      ) {
        const checkNeedMoreContent = () => {
          const scrollContainer = document.querySelector('.mobile-discover-container');
          if (scrollContainer) {
            const { scrollHeight, clientHeight } = scrollContainer;
            if (scrollHeight <= clientHeight) {
              fetchRecommendations(false);
            }
          }
        };
        setTimeout(checkNeedMoreContent, 100);
      }
    } else {
      if (results.length > 0 && hasMore && !loading && !showSearch) {
        const checkNeedMoreContent = () => {
          const scrollContainer = document.querySelector('.mobile-discover-container');
          if (scrollContainer) {
            const { scrollHeight, clientHeight } = scrollContainer;
            if (scrollHeight <= clientHeight) {
              fetchFromTMDB(false);
            }
          }
        };
        setTimeout(checkNeedMoreContent, 100);
      }
    }
  }, [
    results.length,
    hasMore,
    loading,
    showSearch,
    activeCategory,
    fetchFromTMDB,
    recommendations.length,
    recommendationsHasMore,
    recommendationsLoading,
    fetchRecommendations,
  ]);

  const searchItems = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);

      try {
        const mediaType = activeTab === 'series' ? 'tv' : 'movie';
        const endpoint = `https://api.themoviedb.org/3/search/${mediaType}`;

        const params = new URLSearchParams({
          api_key: import.meta.env.VITE_API_TMDB,
          language: 'de-DE',
          query: query,
          page: '1',
        });

        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (data.results) {
          const mappedResults = data.results
            .filter(
              (item: DiscoverItem) =>
                !isInList(item.id, activeTab === 'series' ? 'series' : 'movie')
            )
            .slice(0, 20)
            .map((item: DiscoverItem) => ({
              ...item,
              type: activeTab === 'series' ? 'series' : ('movie' as const),
              inList: false,
            }));

          setSearchResults(mappedResults);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    },
    [activeTab, isInList]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showSearch) {
        searchItems(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSearch, searchItems]);

  const addToList = useCallback(
    async (item: DiscoverItem, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }

      if (!user) {
        setDialog({
          open: true,
          message: 'Bitte einloggen um Inhalte hinzuzufügen!',
          type: 'warning',
        });
        return;
      }

      const itemKey = `${item.type}-${item.id}`;
      setAddingItem(itemKey);

      const endpoint =
        item.type === 'series'
          ? `${import.meta.env.VITE_BACKEND_API_URL}/add`
          : `${import.meta.env.VITE_BACKEND_API_URL}/addMovie`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: import.meta.env.VITE_USER,
            id: item.id,
            uuid: user.uid,
          }),
        });

        if (response.ok) {
          setResults((prev) => prev.filter((r) => r.id !== item.id));
          setSearchResults((prev) => prev.filter((r) => r.id !== item.id));
          setRecommendations((prev) => prev.filter((r) => r.id !== item.id));

          const title = item.title || item.name;
          setSnackbar({
            open: true,
            message: `"${title}" wurde erfolgreich hinzugefügt!`,
          });

          const posterPath = item.poster_path ?? undefined;
          if (item.type === 'series') {
            await logSeriesAdded(
              user.uid,
              item.name || item.title || 'Unbekannte Serie',
              item.id,
              posterPath
            );
          } else {
            await logMovieAdded(user.uid, item.title || 'Unbekannter Film', item.id, posterPath);
          }

          setTimeout(() => {
            setSnackbar({ open: false, message: '' });
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to add item:', error);
      } finally {
        setAddingItem(null);
      }
    },
    [user]
  );

  const setupScrollListener = useCallback(
    (_currentActiveCategory: string) => {
      const scrollContainer = document.querySelector('.mobile-discover-container');
      if (scrollContainer) {
        const scrollHandler = () => {
          if (!scrollContainer) return;

          const scrollTop = scrollContainer.scrollTop;
          const scrollHeight = scrollContainer.scrollHeight;
          const clientHeight = scrollContainer.clientHeight;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

          if (distanceFromBottom < 500) {
            if (activeCategoryRef.current === 'recommendations') {
              if (recommendationsHasMoreRef.current && !recommendationsLoadingRef.current) {
                fetchRecommendations(false);
              }
            } else if (hasMoreRef.current && !loadingRef.current && !showSearchRef.current) {
              fetchFromTMDB(false);
            }
          }
        };

        scrollContainer.addEventListener('scroll', scrollHandler);
        return () => {
          scrollContainer.removeEventListener('scroll', scrollHandler);
        };
      }
    },
    [fetchFromTMDB, fetchRecommendations]
  );

  return {
    results,
    setResults,
    loading,
    hasMore,
    searchResults,
    setSearchResults,
    searchLoading,
    recommendations,
    setRecommendations,
    recommendationsLoading,
    recommendationsHasMore,
    addingItem,
    snackbar,
    dialog,
    setDialog,
    fetchFromTMDB,
    fetchRecommendations,
    searchItems,
    addToList,
    isInList,
    setupScrollListener,
  };
};
