import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { t } from '../../services/i18n';
import { tmdbFetch } from '../../services/tmdbClient';
import type { DiscoverItem } from './discoverItemHelpers';
import { useDiscoverActions } from './useDiscoverActions';
import { filterItemsByActiveProviders } from './watchProviderFilter';

/** Schlanke TMDB-Listen-Response (nur die hier gelesenen Felder). */
interface TmdbListResponse {
  results?: DiscoverItem[];
  total_pages?: number;
}

/** Bewertung des aktuellen Nutzers für ein Listen-Item (0, falls unbewertet). */
function userRatingOf(item: Series | Movie, uid: string | undefined): number {
  if (!uid) return 0;
  const rating = (item as { rating?: Record<string, number> }).rating;
  const value = rating?.[uid];
  return typeof value === 'number' && value > 0 ? value : 0;
}

interface UseDiscoverFetchResult {
  results: DiscoverItem[];
  setResults: React.Dispatch<React.SetStateAction<DiscoverItem[]>>;
  loading: boolean;
  error: string | null;
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

// Stabile Default-Referenz: ein Inline `new Set()` pro Render wechselt die
// Identitaet, destabilisiert die Fetch-Callbacks und loopt den Auto-Fetch-Effect.
const EMPTY_ACTIVE_PROVIDERS = new Set<string>();

export const useDiscoverFetch = (
  activeTab: 'series' | 'movies',
  activeCategory: string,
  selectedGenre: number | null,
  showSearch: boolean,
  searchQuery: string,
  isRestoring: boolean,
  onlyMyProviders = false,
  activeProviders: Set<string> = EMPTY_ACTIVE_PROVIDERS
): UseDiscoverFetchResult => {
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { user } = useAuth() || {};
  const uid = user?.uid;

  const [results, setResults] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  // Page-Level-Fehler: nur gesetzt, wenn ein Reset-Fetch scheitert (Sackgasse
  // ohne Inhalte). Pagination-Fehler bleiben wie bisher still (Liste steht ja).
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState<DiscoverItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<DiscoverItem[]>([]);
  const [recommendationsHasMore, setRecommendationsHasMore] = useState(true);
  const [usedRecommendationSources, setUsedRecommendationSources] = useState<Set<string>>(
    new Set()
  );

  const { addingItem, snackbar, dialog, setDialog, addToList } = useDiscoverActions(
    setResults,
    setSearchResults,
    setRecommendations
  );

  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const showSearchRef = useRef(showSearch);
  const recommendationsLoadingRef = useRef(recommendationsLoading);
  const recommendationsHasMoreRef = useRef(recommendationsHasMore);
  const activeCategoryRef = useRef(activeCategory);
  const recommendationsRef = useRef(recommendations);
  const usedSourcesRef = useRef(usedRecommendationSources);

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
  useEffect(() => {
    recommendationsRef.current = recommendations;
  }, [recommendations]);
  useEffect(() => {
    usedSourcesRef.current = usedRecommendationSources;
  }, [usedRecommendationSources]);

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
      if (recommendationsLoadingRef.current) return;

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

        const currentUsedSources = reset ? new Set<string>() : new Set(usedSourcesRef.current);
        // Versteckte Serien nicht als Empfehlungs-Quelle nutzen.
        const availableItems = userItems.filter(
          (item) =>
            !currentUsedSources.has(item.id.toString()) && !(item as { hidden?: boolean }).hidden
        );

        if (availableItems.length === 0) {
          setRecommendationsHasMore(false);
          setRecommendationsLoading(false);
          return;
        }

        // Gewichtete Quell-Auswahl: höher bewertete Titel bevorzugen (statt rein
        // zufällig), aber innerhalb des Top-Pools mischen, damit es abwechslungsreich
        // bleibt. Unbewertete Titel landen am Ende des Pools.
        const rankedItems = [...availableItems].sort(
          (a, b) => userRatingOf(b, uid) - userRatingOf(a, uid)
        );
        const poolSize = Math.min(10, rankedItems.length);
        const pool = rankedItems.slice(0, poolSize).sort(() => 0.5 - Math.random());
        const selectedItems = pool.slice(0, Math.min(3, pool.length));

        const allRecommendations: DiscoverItem[] = [];
        const existingIds = new Set(recommendationsRef.current.map((r) => r.id));

        const mediaType = activeTab === 'series' ? 'tv' : 'movie';

        const recResponses = await Promise.all(
          selectedItems.map(async (item) => ({
            item,
            data: await tmdbFetch<TmdbListResponse>(`${mediaType}/${item.id}/recommendations`),
          }))
        );

        for (const { item, data } of recResponses) {
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

        // Nach Qualität sortieren (TMDB-Wertung, dann Popularität) statt zufällig,
        // damit die stärksten Vorschläge oben stehen.
        let rankedRecommendations = allRecommendations
          .sort((a, b) => {
            const va = (a as { vote_average?: number }).vote_average ?? 0;
            const vb = (b as { vote_average?: number }).vote_average ?? 0;
            if (vb !== va) return vb - va;
            const pa = (a as { popularity?: number }).popularity ?? 0;
            const pb = (b as { popularity?: number }).popularity ?? 0;
            return pb - pa;
          })
          .slice(0, 20);

        if (onlyMyProviders && activeProviders.size > 0) {
          rankedRecommendations = await filterItemsByActiveProviders(
            rankedRecommendations,
            activeProviders
          );
        }

        setUsedRecommendationSources(currentUsedSources);

        if (reset) {
          setRecommendations(rankedRecommendations);
        } else {
          setRecommendations((prev) => [...prev, ...rankedRecommendations]);
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
    [activeTab, seriesList, movieList, isInList, uid, onlyMyProviders, activeProviders]
  );

  const fetchFromTMDB = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;

      setLoading(true);
      setError(null);
      const currentPage = reset ? 1 : pageRef.current + 1;

      try {
        let endpoint = '';
        const mediaType = activeTab === 'series' ? 'tv' : 'movie';

        if (selectedGenre) {
          endpoint = `discover/${mediaType}`;
        } else {
          switch (activeCategory) {
            case 'trending':
              endpoint = `trending/${mediaType}/week`;
              break;
            case 'popular':
              endpoint = `${mediaType}/popular`;
              break;
            case 'top_rated':
              endpoint = `${mediaType}/top_rated`;
              break;
            case 'upcoming':
              if (activeTab === 'movies') {
                endpoint = 'movie/upcoming';
              } else {
                endpoint = 'tv/on_the_air';
              }
              break;
          }
        }

        // undefined-Params werden vom Client weggelassen (konditionale Genre-Filter).
        const data = await tmdbFetch<TmdbListResponse>(endpoint, {
          page: currentPage,
          region: 'DE',
          with_genres: selectedGenre ? selectedGenre : undefined,
          sort_by: selectedGenre
            ? activeCategory === 'top_rated'
              ? 'vote_average.desc'
              : 'popularity.desc'
            : undefined,
        });

        if (data.results) {
          let mappedResults: DiscoverItem[] = data.results
            .filter(
              (item: DiscoverItem) =>
                !isInList(item.id, activeTab === 'series' ? 'series' : 'movie')
            )
            .map((item: DiscoverItem) => ({
              ...item,
              type: activeTab === 'series' ? 'series' : ('movie' as const),
              inList: false,
            }));

          if (onlyMyProviders && activeProviders.size > 0) {
            mappedResults = await filterItemsByActiveProviders(mappedResults, activeProviders);
          }

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

          setHasMore(currentPage < (data.total_pages ?? 0));
        }
      } catch (error) {
        console.error('Error fetching from TMDB:', error);
        setHasMore(false);
        if (reset) {
          setError(t('Inhalte konnten nicht geladen werden.'));
        }
      } finally {
        setLoading(false);
      }
    },
    [activeTab, activeCategory, selectedGenre, isInList, onlyMyProviders, activeProviders]
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
  }, [
    activeTab,
    activeCategory,
    selectedGenre,
    showSearch,
    isRestoring,
    fetchRecommendations,
    fetchFromTMDB,
  ]);

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
        const data = await tmdbFetch<TmdbListResponse>(`search/${mediaType}`, {
          query,
          page: 1,
        });

        if (data.results) {
          let mappedResults: DiscoverItem[] = data.results
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

          if (onlyMyProviders && activeProviders.size > 0) {
            mappedResults = await filterItemsByActiveProviders(mappedResults, activeProviders);
          }

          setSearchResults(mappedResults);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    },
    [activeTab, isInList, onlyMyProviders, activeProviders]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showSearch) {
        searchItems(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSearch, searchItems]);

  const setupScrollListener = useCallback(
    (_currentActiveCategory: string) => {
      const scrollContainer = document.querySelector('.mobile-discover-container');
      if (!scrollContainer) return undefined;

      let ticking = false;
      const scrollHandler = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const distanceFromBottom =
            scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;

          if (distanceFromBottom < 500) {
            if (activeCategoryRef.current === 'recommendations') {
              if (recommendationsHasMoreRef.current && !recommendationsLoadingRef.current) {
                fetchRecommendations(false);
              }
            } else if (hasMoreRef.current && !loadingRef.current && !showSearchRef.current) {
              fetchFromTMDB(false);
            }
          }
        });
      };

      scrollContainer.addEventListener('scroll', scrollHandler, { passive: true });
      return () => {
        scrollContainer.removeEventListener('scroll', scrollHandler);
      };
    },
    [fetchFromTMDB, fetchRecommendations]
  );

  return {
    results,
    setResults,
    loading,
    error,
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
