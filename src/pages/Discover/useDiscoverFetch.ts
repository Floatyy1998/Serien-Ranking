import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import {
  DEFAULT_VIEW_FILTERS,
  activeViewFilterCount,
  discoverGenreParams,
  passesViewFilters,
  type DiscoverViewFilters,
} from '../../lib/taste/discoverFilters';
import {
  buildSupportIndex,
  buildTasteProfile,
  rankBrowse,
  rankCandidates,
  seedBatches,
  topGenrePairs,
  type ScoreOptions,
  type ScoredItem,
  type SeedResults,
  type SupportIndex,
  type TasteItem,
  type TasteMedia,
  type TasteProfile,
  type TasteSeed,
} from '../../lib/taste/tasteEngine';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { t } from '../../services/i18n';
import { tmdbFetch } from '../../services/api/tmdbClient';
import {
  fetchGenrePicks,
  fetchSeedResults,
  interestTagsFor,
  loadTasteSignals,
  type TasteSignals,
} from '../../services/taste/tasteRecommendations';
import { watchRegion } from '../../services/settings/region';
import type { DiscoverItem } from './discoverItemHelpers';
import { useDiscoverActions } from './useDiscoverActions';
import { filterItemsByActiveProviders } from './watchProviderFilter';

/** Schlanke TMDB-Listen-Response (nur die hier gelesenen Felder). */
interface TmdbListResponse {
  results?: DiscoverItem[];
  total_pages?: number;
}

const REC_PAGE_SIZE = 30;
const REC_MIN_PAGE = 12;

interface TasteContext {
  media: TasteMedia;
  profile: TasteProfile;
  signals: TasteSignals;
  batches: TasteSeed[][];
  firstLists: SeedResults<TasteItem>[];
  index: SupportIndex;
}

interface TasteSession {
  context: TasteContext;
  nextBatch: number;
  lists: SeedResults<TasteItem>[];
  pool: DiscoverItem[];
  shown: Set<number>;
  ranked: boolean;
}

const withTaste = (
  { item, match, reasons, genreIds, friend }: ScoredItem<TasteItem | DiscoverItem>,
  media: TasteMedia
): DiscoverItem => ({
  ...item,
  type: media,
  inList: false,
  match,
  basedOn: reasons[0],
  basedOnMore: reasons[1],
  fitGenres: genreIds,
  friendPick: friend,
});

const scoreOptionsOf = (context: TasteContext): ScoreOptions => ({
  media: context.media,
  profile: context.profile,
  interests: context.signals.interests,
  interestTags: interestTagsFor(context.signals, context.media),
  communityRating: (id) => context.signals.community[String(id)]?.a,
  friendPicks: context.signals.friendPicks,
  available: context.signals.available,
});

export interface DiscoverFetchExtras {
  viewFilters: DiscoverViewFilters;
  ownProviders: Set<string>;
  readsManga: boolean;
}

const BROWSE_MIN_PAGE = 8;
const BROWSE_MAX_PAGES = 4;

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
const DEFAULT_EXTRAS: DiscoverFetchExtras = {
  viewFilters: DEFAULT_VIEW_FILTERS,
  ownProviders: EMPTY_ACTIVE_PROVIDERS,
  readsManga: false,
};

export const useDiscoverFetch = (
  activeTab: 'series' | 'movies',
  activeCategory: string,
  selectedGenre: number | null,
  showSearch: boolean,
  searchQuery: string,
  isRestoring: boolean,
  onlyMyProviders = false,
  activeProviders: Set<string> = EMPTY_ACTIVE_PROVIDERS,
  extras: DiscoverFetchExtras = DEFAULT_EXTRAS
): UseDiscoverFetchResult => {
  const { viewFilters } = extras;
  const extrasRef = useRef(extras);
  useEffect(() => {
    extrasRef.current = extras;
  }, [extras]);
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
  const seriesListRef = useRef(seriesList);
  const movieListRef = useRef(movieList);
  const tasteSessionRef = useRef<TasteSession | null>(null);
  const tasteContextRef = useRef<{ key: string; promise: Promise<TasteContext | null> } | null>(
    null
  );
  const recommendationsRunRef = useRef(0);
  const browseRunRef = useRef(0);

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
    seriesListRef.current = seriesList;
    movieListRef.current = movieList;
  }, [seriesList, movieList]);

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

  const hasLibrary = (activeTab === 'series' ? seriesList : movieList).length > 0;

  const getTasteContext = useCallback(
    (media: TasteMedia, fresh = false): Promise<TasteContext | null> => {
      const librarySize = seriesListRef.current.length + movieListRef.current.length;
      const { ownProviders, readsManga } = extrasRef.current;
      const key = `${uid ?? ''}:${media}:${librarySize > 0}:${ownProviders.size}:${readsManga}`;
      const cached = tasteContextRef.current;
      if (!fresh && cached?.key === key) return cached.promise;

      const promise = (async (): Promise<TasteContext | null> => {
        if (librarySize === 0) return null;
        const signals = await loadTasteSignals(uid, media, ownProviders);
        const profile = buildTasteProfile(
          seriesListRef.current,
          movieListRef.current,
          media,
          Date.now(),
          { tagMap: signals.tagMap, readsManga, disliked: signals.disliked }
        );
        const batches = seedBatches(profile.seeds);
        const firstLists = batches[0] ? await fetchSeedResults(media, batches[0]) : [];
        return {
          media,
          profile,
          signals,
          batches,
          firstLists,
          index: buildSupportIndex(firstLists),
        };
      })().catch(() => null);
      tasteContextRef.current = { key, promise };
      return promise;
    },
    [uid]
  );

  const fetchRecommendations = useCallback(
    async (reset = false) => {
      if (!reset && recommendationsLoadingRef.current) return;

      const run = ++recommendationsRunRef.current;
      recommendationsLoadingRef.current = true;
      setRecommendationsLoading(true);

      try {
        const media: TasteMedia = activeTab === 'series' ? 'series' : 'movie';
        const ownedItems = media === 'series' ? seriesListRef.current : movieListRef.current;

        if (!hasLibrary || ownedItems.length === 0) {
          tasteSessionRef.current = null;
          setRecommendations([]);
          setRecommendationsHasMore(false);
          return;
        }

        let session = reset ? null : tasteSessionRef.current;
        if (!session) {
          setRecommendations([]);
          setRecommendationsHasMore(true);
          const context = await getTasteContext(media, true);
          if (!context) {
            if (run === recommendationsRunRef.current) setRecommendationsHasMore(false);
            return;
          }
          const picks = await fetchGenrePicks(media, topGenrePairs(context.profile, media));
          session = {
            context,
            nextBatch: 1,
            lists: [...context.firstLists, ...picks],
            pool: [],
            shown: new Set(),
            ranked: false,
          };
        }

        const active = session;
        const { context } = active;
        const page: DiscoverItem[] = [];
        while (page.length < REC_MIN_PAGE && run === recommendationsRunRef.current) {
          if (active.pool.length === 0) {
            if (active.ranked) {
              const batch = context.batches[active.nextBatch];
              if (!batch) break;
              active.nextBatch++;
              active.lists.push(...(await fetchSeedResults(media, batch)));
            }
            active.ranked = true;
            const ownedIds = new Set(
              (media === 'series' ? seriesListRef.current : movieListRef.current).map((item) =>
                Number(item.id)
              )
            );
            active.pool = rankCandidates(active.lists, {
              ...scoreOptionsOf(context),
              exclude: (id) =>
                ownedIds.has(id) || active.shown.has(id) || context.signals.blocked.has(id),
              daySeed: Math.floor(Date.now() / 86_400_000),
            }).map((scored) => withTaste(scored, media));
            continue;
          }

          let slice = active.pool.splice(0, REC_PAGE_SIZE);
          slice.forEach((item) => active.shown.add(item.id));
          slice = slice.filter((item) => passesViewFilters(item, viewFilters));
          if (onlyMyProviders && activeProviders.size > 0) {
            slice = await filterItemsByActiveProviders(slice, activeProviders);
          }
          page.push(...slice);
        }

        if (run !== recommendationsRunRef.current) return;
        tasteSessionRef.current = active;
        setRecommendations((prev) => (reset ? page : [...prev, ...page]));
        setRecommendationsHasMore(
          active.pool.length > 0 || active.nextBatch < context.batches.length
        );
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        if (reset && run === recommendationsRunRef.current) {
          setRecommendations([]);
        }
      } finally {
        if (run === recommendationsRunRef.current) {
          recommendationsLoadingRef.current = false;
          setRecommendationsLoading(false);
        }
      }
    },
    [activeTab, hasLibrary, onlyMyProviders, activeProviders, getTasteContext, viewFilters]
  );

  const fetchFromTMDB = useCallback(
    async (reset = false) => {
      if (!reset && loadingRef.current) return;

      const run = ++browseRunRef.current;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const currentPage = reset ? 1 : pageRef.current + 1;

      try {
        let endpoint = '';
        const mediaType = activeTab === 'series' ? 'tv' : 'movie';
        const genreParams =
          activeCategory === 'upcoming'
            ? null
            : discoverGenreParams(viewFilters, activeTab === 'series' ? 'series' : 'movie');
        const viaDiscover = !!selectedGenre || !!genreParams;

        if (viaDiscover) {
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

        const tasteMedia: TasteMedia = activeTab === 'series' ? 'series' : 'movie';
        const filtering =
          activeViewFilterCount(viewFilters) > 0 || (onlyMyProviders && activeProviders.size > 0);
        const collected: DiscoverItem[] = [];
        let pageNo = currentPage;
        let totalPages = 0;
        let loaded = false;

        const maxAttempts = filtering ? BROWSE_MAX_PAGES : 1;
        for (let attempt = 1; ; attempt++) {
          // undefined-Params werden vom Client weggelassen (konditionale Genre-Filter).
          const [data, taste] = await Promise.all([
            tmdbFetch<TmdbListResponse>(endpoint, {
              page: pageNo,
              region: watchRegion,
              with_genres: selectedGenre ? selectedGenre : genreParams?.with_genres,
              without_genres: genreParams?.without_genres,
              with_original_language: genreParams?.with_original_language,
              sort_by: viaDiscover
                ? activeCategory === 'top_rated'
                  ? 'vote_average.desc'
                  : 'popularity.desc'
                : undefined,
              'vote_count.gte': viaDiscover && activeCategory === 'top_rated' ? 200 : undefined,
            }),
            getTasteContext(tasteMedia),
          ]);
          if (!data.results) break;
          loaded = true;
          totalPages = data.total_pages ?? 0;

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

          if (taste) {
            mappedResults = rankBrowse(mappedResults, taste.index, scoreOptionsOf(taste)).map(
              (scored) => withTaste(scored, tasteMedia)
            );
          }
          mappedResults = mappedResults.filter((item) => passesViewFilters(item, viewFilters));

          if (onlyMyProviders && activeProviders.size > 0) {
            mappedResults = await filterItemsByActiveProviders(mappedResults, activeProviders);
          }
          collected.push(...mappedResults);

          if (
            collected.length >= BROWSE_MIN_PAGE ||
            pageNo >= totalPages ||
            attempt >= maxAttempts
          ) {
            break;
          }
          pageNo++;
        }

        if (run !== browseRunRef.current) return;
        if (loaded) {
          if (reset) {
            setResults(collected);
          } else {
            setResults((prev) => {
              const existingIds = new Set(
                prev.map((item: DiscoverItem) => `${item.type}-${item.id}`)
              );
              const newResults = collected.filter(
                (item: DiscoverItem) => !existingIds.has(`${item.type}-${item.id}`)
              );
              return [...prev, ...newResults];
            });
          }
          setPage(pageNo);
          setHasMore(pageNo < totalPages);
        }
      } catch (error) {
        if (run !== browseRunRef.current) return;
        console.error('Error fetching from TMDB:', error);
        setHasMore(false);
        if (reset) {
          setError(t('Inhalte konnten nicht geladen werden.'));
        }
      } finally {
        if (run === browseRunRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [
      activeTab,
      activeCategory,
      selectedGenre,
      isInList,
      onlyMyProviders,
      activeProviders,
      getTasteContext,
      viewFilters,
    ]
  );

  useEffect(() => {
    if (isRestoring) return;

    if (activeCategory === 'recommendations') {
      if (!showSearch) fetchRecommendations(true);
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
            if (showSearchRef.current) return;
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
