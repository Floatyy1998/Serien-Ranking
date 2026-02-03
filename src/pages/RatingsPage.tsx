/**
 * RatingsPage - Performance-Optimized Ratings Collection
 *
 * Key optimizations vs. previous version:
 * - CSS content-visibility:auto for native browser virtualization (skips off-screen items)
 * - CSS Grid media queries instead of JS window.innerWidth
 * - Pre-computed ratings & progress in useMemo (calculated once, not 3x per item)
 * - React.memo on grid items to prevent unnecessary re-renders
 * - Event delegation: single click handler on grid container
 * - No Framer Motion on grid items (removed AnimatePresence + layout animations)
 * - Static placeholder SVG (generated once, not per error)
 */

import { Movie as MovieIcon, Star, Tv as TvIcon, WatchLater } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { calculateOverallRating } from '../lib/rating/rating';
import { QuickFilter } from '../components/QuickFilter';
import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';
import './RatingsPage.css';

// ─── Types ──────────────────────────────────────────────────────────────

interface PreparedItem {
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

// ─── Constants & Helpers (outside component, created once) ──────────────

const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="100%" height="100%" fill="#1a1a2e"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
    'fill="#666" font-family="Arial" font-size="14">Kein Poster</text></svg>'
)}`;

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.target as HTMLImageElement;
  if (!target.src.includes('data:image/svg')) {
    target.src = PLACEHOLDER_SVG;
  }
}

// getImageUrl imported from utils - uses '' fallback for ratings
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
      if (ep.air_date && new Date(ep.air_date).getTime() <= now && ep.watched) return true;
    }
  }
  return false;
}

function extractProviders(item: Series | Movie): { name: string; logo: string }[] {
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

// ─── Memoized Grid Item (no Framer Motion) ──────────────────────────────

const RatingGridItem = React.memo<{
  item: PreparedItem;
  theme: ReturnType<typeof import('../theme/dynamicTheme').generateDynamicTheme>;
}>(({ item, theme }) => (
  <div className="ratings-grid-item" data-id={item.id} data-movie={item.isMovie || undefined}>
    <div className="ratings-poster-wrap">
      <img
        src={item.posterUrl || PLACEHOLDER_SVG}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="ratings-poster-img"
        onError={handleImgError}
        style={{ background: theme.background.surface }}
      />

      {item.providers.length > 0 && (
        <div className="ratings-provider-badges">
          {item.providers.map(p => (
            <div key={p.name} className="ratings-provider-badge" style={{ background: `${theme.background.default}dd` }}>
              <img src={p.logo} alt={p.name} />
            </div>
          ))}
        </div>
      )}

      {item.rating > 0 && (
        <div className="ratings-rating-badge">
          <Star style={{ fontSize: 12, color: '#fbbf24' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.rating.toFixed(1)}</span>
        </div>
      )}

      {item.watchlist && (
        <div
          className="ratings-watchlist-badge"
          style={{ top: item.rating > 0 ? 36 : 6, background: `${theme.status.info}dd` }}
        >
          <WatchLater style={{ fontSize: 10, color: '#fff' }} />
        </div>
      )}

      {!item.isMovie && item.progress > 0 && (
        <div className="ratings-progress-track">
          <div
            className="ratings-progress-fill"
            style={{
              width: `${item.progress}%`,
              background: item.progress === 100
                ? `linear-gradient(90deg, ${theme.status.success}, #10b981)`
                : `linear-gradient(90deg, ${theme.primary}, #8b5cf6)`,
            }}
          />
        </div>
      )}
    </div>

    <h4 className="ratings-item-title" style={{ color: theme.text.primary }}>{item.title}</h4>

    {!item.isMovie && item.progress > 0 && (
      <p
        className="ratings-item-meta"
        style={{ color: item.progress === 100 ? theme.status.success : theme.primary, fontWeight: 600 }}
      >
        {item.progress === 100 ? 'Fertig' : `${Math.round(item.progress)}%`}
      </p>
    )}

    {item.isMovie && item.releaseDate && (
      <p className="ratings-item-meta" style={{ color: theme.text.muted }}>
        {item.releaseDate.split('-')[0]}
      </p>
    )}
  </div>
));

RatingGridItem.displayName = 'RatingGridItem';

// ─── Main Component ─────────────────────────────────────────────────────

export const RatingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useAuth();
  const user = authContext?.user;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme, getMobilePageBackground } = useTheme();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // ─── State (initialized from URL) ───────────────────
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>(() =>
    searchParams.get('tab') === 'movies' ? 'movies' : 'series'
  );
  const [sortOption, setSortOption] = useState(() => searchParams.get('sort') || 'rating-desc');
  const [selectedGenre, setSelectedGenre] = useState(() => searchParams.get('genre') || 'Alle');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(() => searchParams.get('provider') || null);
  const [quickFilter, setQuickFilter] = useState<string | null>(() => searchParams.get('filter') || null);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');

  const [, startTransition] = useTransition();
  const isUpdatingFromQuickFilter = useRef(false);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // ─── URL Sync ───────────────────────────────────────
  const updateURL = useCallback((updates: Record<string, string | null | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    const defaults: Record<string, string> = { tab: 'series', sort: 'rating-desc', genre: 'Alle' };

    for (const [key, val] of Object.entries(updates)) {
      if (val && val !== defaults[key]) {
        newParams.set(key, val);
      } else {
        newParams.delete(key);
      }
    }

    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

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

  // ─── QuickFilter Integration ────────────────────────
  const filters = useMemo(() => ({
    sortBy: sortOption,
    genre: selectedGenre !== 'Alle' ? selectedGenre : undefined,
    provider: selectedProvider || undefined,
    quickFilter: quickFilter || undefined,
    search: searchQuery || undefined,
  }), [sortOption, selectedGenre, selectedProvider, quickFilter, searchQuery]);

  const handleQuickFilterChange = useCallback((newFilters: {
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

    queueMicrotask(() => { isUpdatingFromQuickFilter.current = false; });
  }, [setSearchParams, startTransition]);

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
  const handleGridClick = useCallback((e: React.MouseEvent) => {
    const gridItem = (e.target as HTMLElement).closest('.ratings-grid-item') as HTMLElement | null;
    if (!gridItem) return;

    const id = gridItem.dataset.id;
    const isMovie = gridItem.dataset.movie !== undefined;
    if (!id) return;

    saveScrollPosition();
    navigate(isMovie ? `/movie/${id}` : `/series/${id}`);
  }, [navigate, saveScrollPosition]);

  // ─── Data Preparation (single pass: rate → filter → sort → prepare) ──

  const effectiveSortBy = useMemo(() =>
    quickFilter === 'ongoing' ? 'rating-desc'
      : quickFilter === 'recently-added' ? 'date-desc'
        : sortOption,
    [quickFilter, sortOption]
  );

  const preparedSeries = useMemo(() => {
    // Step 1: Pre-compute ratings (once per item)
    let items = seriesList.map(s => ({ s, r: getRating(s) }));

    // Step 2: Filter
    if (selectedGenre !== 'Alle') {
      const gl = selectedGenre.toLowerCase();
      items = items.filter(({ s }) => {
        const genres = s.genre?.genres;
        return Array.isArray(genres) && genres.some(g => g.toLowerCase() === gl);
      });
    }

    if (selectedProvider) {
      items = items.filter(({ s }) =>
        s.provider?.provider?.some(p => p.name === selectedProvider)
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
        return status === 'returning series' || status === 'ongoing' || (!status && s.production?.production === true);
      });
    }

    // Step 3: Sort (uses pre-computed rating)
    items.sort((a, b) => {
      switch (effectiveSortBy) {
        case 'rating-desc': return b.r - a.r;
        case 'rating-asc': return a.r - b.r;
        case 'name-asc': return (a.s.title || '').localeCompare(b.s.title || '');
        case 'name-desc': return (b.s.title || '').localeCompare(a.s.title || '');
        case 'date-desc': return Number(b.s.nmr) - Number(a.s.nmr);
        default: return b.r - a.r;
      }
    });

    // Step 4: Prepare for rendering (compute progress, providers once)
    return items.map(({ s, r }): PreparedItem => ({
      id: s.id,
      title: s.title || '',
      posterUrl: getImageUrl(s.poster),
      rating: r,
      progress: getSeriesProgress(s),
      isMovie: false,
      watchlist: s.watchlist === true,
      providers: extractProviders(s),
    }));
  }, [seriesList, selectedGenre, selectedProvider, searchQuery, quickFilter, effectiveSortBy]);

  const preparedMovies = useMemo(() => {
    let items = movieList.map(m => ({ m, r: getRating(m) }));

    if (selectedGenre !== 'Alle') {
      const gl = selectedGenre.toLowerCase();
      items = items.filter(({ m }) => {
        const genres = m.genre?.genres;
        return Array.isArray(genres) && genres.some(g => g.toLowerCase() === gl);
      });
    }

    if (selectedProvider) {
      items = items.filter(({ m }) =>
        m.provider?.provider?.some(p => p.name === selectedProvider)
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
        case 'rating-desc': return b.r - a.r;
        case 'rating-asc': return a.r - b.r;
        case 'name-asc': return (a.m.title || '').localeCompare(b.m.title || '');
        case 'name-desc': return (b.m.title || '').localeCompare(a.m.title || '');
        case 'date-desc': return Number(b.m.nmr) - Number(a.m.nmr);
        default: return b.r - a.r;
      }
    });

    return items.map(({ m, r }): PreparedItem => ({
      id: m.id,
      title: m.title || '',
      posterUrl: getImageUrl(m.poster),
      rating: r,
      progress: 0,
      isMovie: true,
      watchlist: m.watchlist === true,
      releaseDate: m.release_date,
      providers: extractProviders(m),
    }));
  }, [movieList, selectedGenre, selectedProvider, searchQuery, quickFilter, effectiveSortBy]);

  const currentItems = activeTab === 'series' ? preparedSeries : preparedMovies;

  // ─── Progressive Rendering ────────────────────────
  // Mount only ~30 items initially, then load the rest in rAF batches (~60ms total).
  // This keeps initial mount and tab switches fast.
  const INITIAL_RENDER = 30;
  const RENDER_BATCH = 50;

  const [renderCount, setRenderCount] = useState(INITIAL_RENDER);

  // Reset when items change (tab switch, filter change) — React-sanctioned setState-during-render
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
      setRenderCount(c => Math.min(c + RENDER_BATCH, currentItems.length));
    });
    return () => cancelAnimationFrame(id);
  }, [renderCount, currentItems.length]);

  const itemsToRender = currentItems.slice(0, renderCount);

  // ─── Stats (cheap: ratings are pre-computed) ────────
  const stats = useMemo(() => {
    const rated = currentItems.filter(i => i.rating > 0);
    const avg = rated.length > 0
      ? rated.reduce((sum, i) => sum + i.rating, 0) / rated.length
      : 0;
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
    } catch { /* ignore */ }

    const position = parseInt(sessionStorage.getItem(`ratingsPageScroll_${tabForScroll}`) || '0', 10);
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

  // ─── Render ─────────────────────────────────────────

  if (!user) {
    return (
      <div style={{
        minHeight: '100%',
        background: getMobilePageBackground(),
        color: currentTheme.text.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      style={{
        minHeight: '100%',
        background: currentTheme.background.default,
        color: currentTheme.text.primary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Decorative Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        background: `
          radial-gradient(ellipse 80% 50% at 50% -20%, #fbbf2430, transparent),
          radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.primary}20, transparent)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Sticky Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: `${currentTheme.background.default}ee`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: `linear-gradient(135deg, ${currentTheme.text.primary}, #fbbf24)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              <Star style={{ fontSize: 28, color: '#fbbf24', WebkitTextFillColor: 'initial' }} />
              Meine Bewertungen
            </h1>
          </div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 16, marginTop: 16 }}
          >
            <div style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{stats.count}</span>
              <span style={{ fontSize: 13, color: currentTheme.text.muted }}>bewertet</span>
            </div>
            <div style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: '#fbbf2415',
              border: '1px solid #fbbf2430',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Star style={{ fontSize: 18, color: '#fbbf24' }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{stats.average.toFixed(1)}</span>
              <span style={{ fontSize: 13, color: currentTheme.text.muted }}>Durchschnitt</span>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            display: 'flex',
            gap: 8,
            padding: 4,
            background: currentTheme.background.surface,
            borderRadius: 16,
            border: `1px solid ${currentTheme.border.default}`,
          }}>
            <button
              className="ratings-tab-btn"
              onClick={() => { setActiveTab('series'); updateURL({ tab: 'series' }); }}
              style={{
                background: activeTab === 'series'
                  ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                  : 'transparent',
                color: activeTab === 'series' ? 'white' : currentTheme.text.secondary,
                boxShadow: activeTab === 'series' ? `0 4px 12px ${currentTheme.primary}40` : 'none',
              }}
            >
              <TvIcon style={{ fontSize: 20 }} />
              Serien
              <span style={{
                padding: '2px 8px',
                borderRadius: 8,
                background: activeTab === 'series' ? 'rgba(255,255,255,0.2)' : `${currentTheme.text.muted}20`,
                fontSize: 12,
              }}>
                {preparedSeries.length}
              </span>
            </button>

            <button
              className="ratings-tab-btn"
              onClick={() => { setActiveTab('movies'); updateURL({ tab: 'movies' }); }}
              style={{
                background: activeTab === 'movies'
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'transparent',
                color: activeTab === 'movies' ? 'white' : currentTheme.text.secondary,
                boxShadow: activeTab === 'movies' ? '0 4px 12px rgba(245,158,11,0.4)' : 'none',
              }}
            >
              <MovieIcon style={{ fontSize: 20 }} />
              Filme
              <span style={{
                padding: '2px 8px',
                borderRadius: 8,
                background: activeTab === 'movies' ? 'rgba(255,255,255,0.2)' : `${currentTheme.text.muted}20`,
                fontSize: 12,
              }}>
                {preparedMovies.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div style={{ padding: '0 20px', flex: 1, position: 'relative', zIndex: 1 }}>
        {itemsToRender.length > 0 ? (
          <div className="ratings-grid" onClick={handleGridClick}>
            {itemsToRender.map(item => (
              <RatingGridItem key={item.id} item={item} theme={currentTheme} />
            ))}
            <div className="ratings-spacer" />
          </div>
        ) : currentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 100,
              height: 100,
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: `${currentTheme.text.muted}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Star style={{ fontSize: 48, color: currentTheme.text.muted }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
              Noch keine {activeTab === 'series' ? 'Serien' : 'Filme'}
            </h3>
            <p style={{ margin: 0, color: currentTheme.text.muted, fontSize: 15 }}>
              {quickFilter
                ? 'Keine Ergebnisse für diesen Filter'
                : `Bewerte ${activeTab === 'series' ? 'Serien' : 'Filme'} um sie hier zu sehen!`}
            </p>
          </div>
        ) : null}
      </div>

      {/* QuickFilter FAB */}
      <QuickFilter
        onFilterChange={handleQuickFilterChange}
        isMovieMode={activeTab === 'movies'}
        isRatingsMode={true}
        initialFilters={filters}
      />
    </div>
  );
};
