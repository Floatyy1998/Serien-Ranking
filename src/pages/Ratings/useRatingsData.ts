/**
 * useRatingsData - Business logic hook for RatingsPage
 *
 * Handles:
 * - State management (tab, sort, genre, provider, quickFilter, search)
 * - URL synchronization (searchParams <-> state)
 * - Data preparation: rate -> filter -> sort -> prepare (single pass)
 * - Progressive rendering (initial batch + rAF batches)
 * - Scroll position save/restore
 * - Stats computation
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

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

function getImageUrl(posterObj: string | { poster?: string } | null | undefined): string {
  if (!posterObj) return '';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
}

function getRating(item: Series | Movie): number {
  const r = parseFloat(calculateOverallRating(item));
  return isNaN(r) ? 0 : r;
}

function getSeriesProgress(series: Series): number {
  if (!series.seasons) return 0;
  const now = Date.now();
  let aired = 0;
  let watched = 0;
  for (const season of series.seasons) {
    if (!season.episodes) continue;
    for (const ep of season.episodes) {
      if (!ep) continue;
      if (ep.air_date && new Date(ep.air_date).getTime() <= now) {
        aired++;
        if (ep.watched) watched++;
      }
    }
  }
  return aired > 0 ? (watched / aired) * 100 : 0;
}

function hasWatchedEpisodes(series: Series): boolean {
  if (!series.seasons) return false;
  const now = Date.now();
  for (const season of series.seasons) {
    if (!season.episodes) continue;
    for (const ep of season.episodes) {
      if (!ep) continue;
      if (ep.air_date && new Date(ep.air_date).getTime() <= now && ep.watched) return true;
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

// ─── Progressive rendering constants ────────────────────────────────────

const INITIAL_RENDER = 30;
const RENDER_BATCH = 50;

// ─── Hook ───────────────────────────────────────────────────────────────

export const useRatingsData = (): UseRatingsDataResult => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useAuth();
  const user = authContext?.user;
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // ─── State (initialized from URL) ───────────────────
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>(() =>
    searchParams.get('tab') === 'movies' ? 'movies' : 'series'
  );
  const [sortOption, setSortOption] = useState(() => searchParams.get('sort') || 'rating-desc');
  const [selectedGenre, setSelectedGenre] = useState(() => searchParams.get('genre') || 'Alle');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    () => searchParams.get('provider') || null
  );
  const [quickFilter, setQuickFilter] = useState<string | null>(
    () => searchParams.get('filter') || null
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');

  const [, startTransition] = useTransition();
  const isUpdatingFromQuickFilter = useRef(false);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // ─── URL Sync ───────────────────────────────────────
  const updateURL = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const newParams = new URLSearchParams(searchParams);
      const defaults: Record<string, string> = {
        tab: 'series',
        sort: 'rating-desc',
        genre: 'Alle',
      };

      for (const [key, val] of Object.entries(updates)) {
        if (val && val !== defaults[key]) {
          newParams.set(key, val);
        } else {
          newParams.delete(key);
        }
      }

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get('tab') === 'movies' ? 'movies' : 'series');
      setSortOption(params.get('sort') || 'rating-desc');
      setSelectedGenre(params.get('genre') || 'Alle');
      setSelectedProvider(params.get('provider') || null);
      setQuickFilter(params.get('filter') || null);
      setSearchQuery(params.get('search') || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ─── Tab Change Handler ────────────────────────────
  const handleTabChange = useCallback(
    (id: string) => {
      setActiveTab(id as 'series' | 'movies');
      updateURL({ tab: id });
    },
    [updateURL]
  );

  // ─── QuickFilter Integration ────────────────────────
  const filters = useMemo(
    () => ({
      sortBy: sortOption,
      genre: selectedGenre !== 'Alle' ? selectedGenre : undefined,
      provider: selectedProvider || undefined,
      quickFilter: quickFilter || undefined,
      search: searchQuery || undefined,
    }),
    [sortOption, selectedGenre, selectedProvider, quickFilter, searchQuery]
  );

  const handleQuickFilterChange = useCallback(
    (newFilters: {
      sortBy?: string;
      genre?: string;
      provider?: string;
      quickFilter?: string;
      search?: string;
    }) => {
      if (isUpdatingFromQuickFilter.current) return;
      isUpdatingFromQuickFilter.current = true;

      const newParams = new URLSearchParams(searchParamsRef.current);
      const paramMap: Record<string, string | undefined> = {
        sort: newFilters.sortBy,
        genre: newFilters.genre,
        provider: newFilters.provider,
        filter: newFilters.quickFilter,
        search: newFilters.search,
      };
      const defaults: Record<string, string> = { sort: 'rating-desc', genre: 'Alle' };

      for (const [key, val] of Object.entries(paramMap)) {
        if (val === undefined) continue;
        if (val && val !== defaults[key]) {
          newParams.set(key, val);
        } else {
          newParams.delete(key);
        }
      }

      setSearchParams(newParams, { replace: true });

      startTransition(() => {
        if (newFilters.sortBy !== undefined) setSortOption(newFilters.sortBy || 'rating-desc');
        if (newFilters.genre !== undefined) setSelectedGenre(newFilters.genre || 'Alle');
        if (newFilters.provider !== undefined) setSelectedProvider(newFilters.provider || null);
        if (newFilters.quickFilter !== undefined) setQuickFilter(newFilters.quickFilter || null);
        if (newFilters.search !== undefined) setSearchQuery(newFilters.search || '');
      });

      queueMicrotask(() => {
        isUpdatingFromQuickFilter.current = false;
      });
    },
    [setSearchParams, startTransition]
  );

  // ─── Scroll Position Management ─────────────────────
  const saveScrollPosition = useCallback(() => {
    let position = 0;
    let scrollSource = '';

    let element = scrollRef.current?.parentElement;
    for (let i = 0; i < 5 && element; i++) {
      if (element.scrollTop > 0) {
        position = element.scrollTop;
        scrollSource = `parent-${i}`;
        break;
      }
      element = element.parentElement;
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
      sessionStorage.setItem(`ratingsPageScroll_${activeTab}`, position.toString());
      sessionStorage.setItem(`ratingsPageScrollSource_${activeTab}`, scrollSource);
      sessionStorage.setItem('shouldRestoreRatingsScroll', 'true');
    }
  }, [activeTab]);

  // Event delegation: single click handler for the entire grid
  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      // Ignore clicks on provider overflow badge (tooltip trigger)
      if ((e.target as HTMLElement).closest('.ratings-provider-badges')) return;

      const gridItem = (e.target as HTMLElement).closest(
        '.ratings-grid-item'
      ) as HTMLElement | null;
      if (!gridItem) return;

      const id = gridItem.dataset.id;
      const isMovie = gridItem.dataset.movie !== undefined;
      if (!id) return;

      saveScrollPosition();
      navigate(isMovie ? `/movie/${id}` : `/series/${id}`);
    },
    [navigate, saveScrollPosition]
  );

  // ─── Data Preparation (single pass: rate -> filter -> sort -> prepare) ──

  const effectiveSortBy = useMemo(
    () =>
      quickFilter === 'ongoing'
        ? 'rating-desc'
        : quickFilter === 'recently-added'
          ? 'date-desc'
          : sortOption,
    [quickFilter, sortOption]
  );

  const preparedSeries = useMemo(() => {
    // Step 1: Pre-compute ratings (once per item)
    let items = seriesList.map((s) => ({ s, r: getRating(s) }));

    // Step 2: Filter
    if (selectedGenre !== 'Alle') {
      const gl = selectedGenre.toLowerCase();
      items = items.filter(({ s }) => {
        const genres = s.genre?.genres;
        return Array.isArray(genres) && genres.some((g) => g.toLowerCase() === gl);
      });
    }

    if (selectedProvider) {
      items = items.filter(({ s }) =>
        s.provider?.provider?.some((p) => p.name === selectedProvider)
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(({ s }) => s.title?.toLowerCase().includes(q));
    }

    if (quickFilter === 'watchlist') {
      items = items.filter(({ s }) => s.watchlist === true);
    } else if (quickFilter === 'unrated') {
      items = items.filter(({ r }) => r === 0);
    } else if (quickFilter === 'started') {
      items = items.filter(({ s }) => {
        const progress = getSeriesProgress(s);
        return progress > 0 && progress < 100;
      });
    } else if (quickFilter === 'not-started') {
      items = items.filter(({ s }) => !hasWatchedEpisodes(s));
    } else if (quickFilter === 'ongoing') {
      items = items.filter(({ s }) => {
        const status = s.status?.toLowerCase();
        return (
          status === 'returning series' ||
          status === 'ongoing' ||
          (!status && s.production?.production === true)
        );
      });
    }

    // Step 3: Sort (uses pre-computed rating)
    items.sort((a, b) => {
      switch (effectiveSortBy) {
        case 'rating-desc':
          return b.r - a.r;
        case 'rating-asc':
          return a.r - b.r;
        case 'name-asc':
          return (a.s.title || '').localeCompare(b.s.title || '');
        case 'name-desc':
          return (b.s.title || '').localeCompare(a.s.title || '');
        case 'date-desc':
          return Number(b.s.nmr) - Number(a.s.nmr);
        default:
          return b.r - a.r;
      }
    });

    // Step 4: Prepare for rendering (compute progress, providers once)
    return items.map(
      ({ s, r }): PreparedItem => ({
        id: s.id,
        title: s.title || '',
        posterUrl: getImageUrl(s.poster),
        rating: r,
        progress: getSeriesProgress(s),
        isMovie: false,
        watchlist: s.watchlist === true,
        providers: extractProviders(s),
      })
    );
  }, [seriesList, selectedGenre, selectedProvider, searchQuery, quickFilter, effectiveSortBy]);

  const preparedMovies = useMemo(() => {
    let items = movieList.map((m) => ({ m, r: getRating(m) }));

    if (selectedGenre !== 'Alle') {
      const gl = selectedGenre.toLowerCase();
      items = items.filter(({ m }) => {
        const genres = m.genre?.genres;
        return Array.isArray(genres) && genres.some((g) => g.toLowerCase() === gl);
      });
    }

    if (selectedProvider) {
      items = items.filter(({ m }) =>
        m.provider?.provider?.some((p) => p.name === selectedProvider)
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(({ m }) => m.title?.toLowerCase().includes(q));
    }

    if (quickFilter === 'watchlist') {
      items = items.filter(({ m }) => m.watchlist === true);
    } else if (quickFilter === 'unrated') {
      items = items.filter(({ r }) => r === 0);
    } else if (quickFilter === 'started') {
      items = [];
    } else if (quickFilter === 'not-started') {
      items = items.filter(({ r }) => r === 0);
    }

    items.sort((a, b) => {
      switch (effectiveSortBy) {
        case 'rating-desc':
          return b.r - a.r;
        case 'rating-asc':
          return a.r - b.r;
        case 'name-asc':
          return (a.m.title || '').localeCompare(b.m.title || '');
        case 'name-desc':
          return (b.m.title || '').localeCompare(a.m.title || '');
        case 'date-desc':
          return Number(b.m.nmr) - Number(a.m.nmr);
        default:
          return b.r - a.r;
      }
    });

    return items.map(
      ({ m, r }): PreparedItem => ({
        id: m.id,
        title: m.title || '',
        posterUrl: getImageUrl(m.poster),
        rating: r,
        progress: 0,
        isMovie: true,
        watchlist: m.watchlist === true,
        releaseDate: m.release_date,
        providers: extractProviders(m),
      })
    );
  }, [movieList, selectedGenre, selectedProvider, searchQuery, quickFilter, effectiveSortBy]);

  const currentItems = activeTab === 'series' ? preparedSeries : preparedMovies;

  // ─── Progressive Rendering ────────────────────────
  const [renderCount, setRenderCount] = useState(INITIAL_RENDER);

  // Reset when items change (tab switch, filter change)
  const filterFingerprint = `${activeTab}\0${quickFilter}\0${selectedGenre}\0${selectedProvider}\0${searchQuery}\0${effectiveSortBy}`;
  const prevFingerprintRef = useRef(filterFingerprint);
  if (prevFingerprintRef.current !== filterFingerprint) {
    prevFingerprintRef.current = filterFingerprint;
    setRenderCount(INITIAL_RENDER);
  }

  // Progressively render remaining items via rAF
  useEffect(() => {
    if (renderCount >= currentItems.length) return;
    const id = requestAnimationFrame(() => {
      setRenderCount((c) => Math.min(c + RENDER_BATCH, currentItems.length));
    });
    return () => cancelAnimationFrame(id);
  }, [renderCount, currentItems.length]);

  const itemsToRender = currentItems.slice(0, renderCount);

  // ─── Stats (cheap: ratings are pre-computed) ────────
  const stats = useMemo(() => {
    const rated = currentItems.filter((i) => i.rating > 0);
    const avg = rated.length > 0 ? rated.reduce((sum, i) => sum + i.rating, 0) / rated.length : 0;
    return { count: rated.length, average: avg };
  }, [currentItems]);

  // ─── Scroll Restoration ─────────────────────────────
  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('shouldRestoreRatingsScroll');
    if (shouldRestore !== 'true' || currentItems.length === 0) return;

    sessionStorage.removeItem('shouldRestoreRatingsScroll');

    let tabForScroll = activeTab;
    try {
      const stored = sessionStorage.getItem('ratingsPageState');
      if (stored) tabForScroll = JSON.parse(stored).activeTab || activeTab;
    } catch {
      /* ignore */
    }

    const position = parseInt(
      sessionStorage.getItem(`ratingsPageScroll_${tabForScroll}`) || '0',
      10
    );
    const scrollSource = sessionStorage.getItem(`ratingsPageScrollSource_${tabForScroll}`);

    if (position <= 0) return;

    const restoreScroll = () => {
      if (scrollSource?.startsWith('parent-')) {
        const parentIndex = parseInt(scrollSource.split('-')[1], 10);
        let el = scrollRef.current?.parentElement;
        for (let i = 0; i < parentIndex && el; i++) el = el.parentElement;
        if (el) {
          if (el.scrollHeight > el.clientHeight) {
            el.scrollTop = position;
            setTimeout(() => {
              if (el && el.scrollTop < position * 0.8) el.scrollTop = position;
            }, 50);
          } else {
            setTimeout(restoreScroll, 200);
          }
        }
      }
    };

    setTimeout(restoreScroll, 500);
  }, [activeTab, currentItems.length]);

  return {
    user: user ?? null,
    activeTab,
    itemsToRender,
    currentItems,
    seriesCount: preparedSeries.length,
    moviesCount: preparedMovies.length,
    stats,
    filters,
    handleTabChange,
    handleQuickFilterChange,
    handleGridClick,
    scrollRef,
    quickFilter,
  };
};
