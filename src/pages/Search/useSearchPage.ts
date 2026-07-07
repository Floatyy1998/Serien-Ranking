/**
 * useSearchPage - Business logic hook for SearchPage
 * Manages search state, TMDB API calls, session persistence, and list operations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { preloadImage } from '../../lib/preloadImage';
import { backendFetch } from '../../services/backendApi';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { filterItemsByActiveProviders } from '../Discover/watchProviderFilter';
import type { Movie as MovieType } from '../../types/Movie';
import type { Series } from '../../types/Series';

export interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  media_type?: string;
  type: 'series' | 'movie';
  inList: boolean;
}

export type SearchTypeFilter = 'all' | 'series' | 'movies';

export interface UseSearchPageResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: SearchTypeFilter;
  setSearchType: (type: SearchTypeFilter) => void;
  searchResults: SearchResult[];
  loading: boolean;
  recentSearches: string[];
  popularSearches: string[];
  isDesktop: boolean;
  snackbar: { open: boolean; message: string };
  dialog: {
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  setDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
    }>
  >;
  handleItemClick: (item: SearchResult) => void;
  addToList: (item: SearchResult) => Promise<void>;
  pendingAddIds: Set<string>;
  removeRecentSearch: (term: string) => void;
  /** F7: "Läuft auf meinen Abos"-Filter. */
  onlyMyProviders: boolean;
  setOnlyMyProviders: (value: boolean) => void;
}

/**
 * @param activeProviders Set der aktiven Abo-Provider-Namen (aus
 *   `useActiveSubscriptions`). Leer = kein Provider-Filter möglich (No-Op).
 */
// Stabile Default-Referenz (Inline `new Set()` pro Render destabilisiert Callbacks).
const EMPTY_ACTIVE_PROVIDERS = new Set<string>();

export const useSearchPage = (
  activeProviders: Set<string> = EMPTY_ACTIVE_PROVIDERS
): UseSearchPageResult => {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const { user } = useAuth() || {};
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const isReturning = window.history.state?.usr?.returning === true;

  const [searchQuery, setSearchQueryState] = useState(() => {
    return urlParams.get('q') || '';
  });

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      setUrlParams(
        (prev) => {
          if (query) {
            prev.set('q', query);
          } else {
            prev.delete('q');
          }
          return prev;
        },
        { replace: true }
      );
    },
    [setUrlParams]
  );

  const [searchType, setSearchTypeState] = useState<SearchTypeFilter>(() => {
    return (urlParams.get('type') as SearchTypeFilter) || 'all';
  });

  const setSearchType = useCallback(
    (type: SearchTypeFilter) => {
      setSearchTypeState(type);
      setUrlParams(
        (prev) => {
          if (type && type !== 'all') {
            prev.set('type', type);
          } else {
            prev.delete('type');
          }
          return prev;
        },
        { replace: true }
      );
    },
    [setUrlParams]
  );

  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => {
    if (isReturning) {
      const saved = sessionStorage.getItem('searchResults');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [onlyMyProviders, setOnlyMyProviders] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const recent = localStorage.getItem('recentSearches');
      return recent ? (JSON.parse(recent) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [dialog, setDialog] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'info' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  // IDs der Items, die gerade hinzugefuegt werden — fuer Spinner-Anzeige.
  // Key: `${type}-${id}` damit Serie und Film mit gleicher TMDB-ID kollisionsfrei sind.
  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());
  const { isDesktop } = useDeviceType();
  const [popularSearches] = useState([
    'Breaking Bad',
    'The Last of Us',
    'Succession',
    'Oppenheimer',
    'Barbie',
    'Wednesday',
  ]);

  // Cache results in sessionStorage for back-navigation
  useEffect(() => {
    sessionStorage.setItem('searchResults', JSON.stringify(searchResults));
  }, [searchResults]);

  // Scroll position restoration
  useEffect(() => {
    if (isReturning) {
      const savedScroll = sessionStorage.getItem('search-scroll');
      if (savedScroll) {
        const pos = parseInt(savedScroll, 10);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const container = document.querySelector('.mobile-content') as HTMLElement;
            if (container) container.scrollTo({ top: pos });
          });
        });
      }
    }
  }, [isReturning]);

  const saveToRecent = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Live abgeleitete Sets der bereits hinzugefuegten IDs. Memoisiert damit
  // der enrichedResults-Memo unten stabile Item-Refs liefern kann.
  const inListIds = useMemo(
    () => ({
      series: new Set(seriesList.map((s: Series) => s.id)),
      movies: new Set(movieList.map((m: MovieType) => m.id)),
    }),
    [seriesList, movieList]
  );

  const searchTMDB = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      saveToRecent(query);

      const apiKey = import.meta.env.VITE_API_TMDB;
      const encoded = encodeURIComponent(query);
      const hasNonLatin = (text: string) => /[^\u0020-\u024F\u1E00-\u1EFF]/.test(text);

      try {
        const results: SearchResult[] = [];
        const wantSeries = searchType === 'all' || searchType === 'series';
        const wantMovies = searchType === 'all' || searchType === 'movies';

        const [seriesDE, seriesEN, movieDE, movieEN] = await Promise.all([
          wantSeries
            ? fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encoded}&language=de-DE`
              ).then((r) => r.json())
            : Promise.resolve(null),
          wantSeries
            ? fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encoded}&language=en-US`
              ).then((r) => r.json())
            : Promise.resolve(null),
          wantMovies
            ? fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encoded}&language=de-DE`
              ).then((r) => r.json())
            : Promise.resolve(null),
          wantMovies
            ? fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encoded}&language=en-US`
              ).then((r) => r.json())
            : Promise.resolve(null),
        ]);

        const enSeriesMap = new Map<number, string>();
        if (seriesEN?.results) {
          for (const item of seriesEN.results) {
            enSeriesMap.set(item.id, item.name || item.title || '');
          }
        }

        const enMovieMap = new Map<number, string>();
        if (movieEN?.results) {
          for (const item of movieEN.results) {
            enMovieMap.set(item.id, item.title || item.name || '');
          }
        }

        if (seriesDE?.results) {
          results.push(
            ...seriesDE.results.map((item: SearchResult) => {
              const deName = item.name || item.title || '';
              const enName = enSeriesMap.get(item.id);
              const name = hasNonLatin(deName) && enName ? enName : deName;
              return {
                ...item,
                name,
                title: name,
                type: 'series' as const,
                // inList wird live aus den Contexts abgeleitet (s. enrichedResults)
                inList: false,
              };
            })
          );
        }

        if (movieDE?.results) {
          results.push(
            ...movieDE.results.map((item: SearchResult) => {
              const deTitle = item.title || item.name || '';
              const enTitle = enMovieMap.get(item.id);
              const title = hasNonLatin(deTitle) && enTitle ? enTitle : deTitle;
              return {
                ...item,
                title,
                name: title,
                type: 'movie' as const,
                inList: false,
              };
            })
          );
        }

        results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        // F7: optional auf die aktiven Abos einschränken (client-seitig, weil
        // TMDBs `/search` keinen `with_watch_providers`-Filter kennt).
        const filtered =
          onlyMyProviders && activeProviders.size > 0
            ? await filterItemsByActiveProviders(results, activeProviders)
            : results;
        setSearchResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [searchType, saveToRecent, onlyMyProviders, activeProviders]
  );

  // inList live ableiten — nur betroffene Items kriegen einen neuen Ref,
  // damit memo'd SearchResultCards nicht unnoetig re-rendern.
  const enrichedResults = useMemo(() => {
    return searchResults.map((r) => {
      const inList = r.type === 'series' ? inListIds.series.has(r.id) : inListIds.movies.has(r.id);
      if (inList === r.inList) return r;
      return { ...r, inList };
    });
  }, [searchResults, inListIds]);

  // Debounced search with skip-on-return logic. Ref statt State, damit das
  // einmalige "Skip" beim Re-Mount keine zusaetzliche Re-Render-Welle
  // ausloest (set-state-in-effect-Pattern war hier ueberfluessig).
  const skipInitialSearchRef = useRef(isReturning && searchResults.length > 0);

  useEffect(() => {
    if (skipInitialSearchRef.current) {
      skipInitialSearchRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      searchTMDB(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchTMDB]);

  const handleItemClick = useCallback(
    (item: SearchResult) => {
      window.history.replaceState({ ...window.history.state, usr: { returning: true } }, '');

      const container = document.querySelector('.mobile-content') as HTMLElement;
      if (container && container.scrollTop > 0) {
        sessionStorage.setItem('search-scroll', String(container.scrollTop));
      }

      // Warm the larger poster in parallel with the lazy Detail-route chunk.
      // TMDB poster_path is a relative path → build a w500 absolute URL.
      if (item.poster_path) {
        preloadImage(`https://image.tmdb.org/t/p/w500${item.poster_path}`);
      }

      if (item.type === 'series') {
        navigate(`/series/${item.id}`);
      } else {
        navigate(`/movie/${item.id}`);
      }
    },
    [navigate]
  );

  const addToList = useCallback(
    async (item: SearchResult) => {
      if (!user) {
        setDialog({
          open: true,
          message: 'Bitte einloggen um Inhalte hinzuzufügen!',
          type: 'warning',
        });
        return;
      }

      const pendingKey = `${item.type}-${item.id}`;
      setPendingAddIds((prev) => {
        const next = new Set(prev);
        next.add(pendingKey);
        return next;
      });

      try {
        const response = await backendFetch(item.type === 'series' ? '/add' : '/addMovie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: import.meta.env.VITE_USER,
            id: item.id,
            uuid: user.uid,
          }),
        });

        if (response.ok) {
          // Nicht mehr aus searchResults filtern — der inList-Wert wird
          // live aus den Contexts abgeleitet (enrichedResults), das Item
          // bleibt sichtbar und der Add-Button wird zum Check-Badge sobald
          // Firebase die neue Liste pusht.
          const title = item.title || item.name || '';

          setSnackbar({
            open: true,
            message: `"${title}" wurde erfolgreich hinzugefügt!`,
          });

          const posterPath = item.poster_path;
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
        console.error('Error adding item:', error);
        setDialog({ open: true, message: 'Fehler beim Hinzufügen des Inhalts.', type: 'error' });
      } finally {
        setPendingAddIds((prev) => {
          if (!prev.has(pendingKey)) return prev;
          const next = new Set(prev);
          next.delete(pendingKey);
          return next;
        });
      }
    },
    [user]
  );

  const removeRecentSearch = useCallback(
    (term: string) => {
      const updated = recentSearches.filter((s) => s !== term);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    },
    [recentSearches]
  );

  return {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults: enrichedResults,
    loading,
    recentSearches,
    popularSearches,
    isDesktop,
    snackbar,
    dialog,
    setDialog,
    handleItemClick,
    addToList,
    pendingAddIds,
    removeRecentSearch,
    onlyMyProviders,
    setOnlyMyProviders,
  };
};
