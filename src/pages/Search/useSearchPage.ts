/**
 * useSearchPage - Business logic hook for SearchPage
 * Manages search state, TMDB API calls, session persistence, and list operations.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
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
  removeRecentSearch: (term: string) => void;
}

export const useSearchPage = (): UseSearchPageResult => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const isReturning = window.history.state?.usr?.returning === true;

  const [searchQuery, setSearchQuery] = useState(() => {
    if (isReturning) {
      return sessionStorage.getItem('searchQuery') || '';
    }
    sessionStorage.removeItem('searchQuery');
    sessionStorage.removeItem('searchType');
    sessionStorage.removeItem('searchResults');
    return '';
  });

  const [searchType, setSearchType] = useState<SearchTypeFilter>(() => {
    if (isReturning) {
      const saved = sessionStorage.getItem('searchType');
      return (saved as SearchTypeFilter) || 'all';
    }
    return 'all';
  });

  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => {
    if (isReturning) {
      const saved = sessionStorage.getItem('searchResults');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'info' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [isDesktop] = useState(window.innerWidth >= 768);
  const [popularSearches] = useState([
    'Breaking Bad',
    'The Last of Us',
    'Succession',
    'Oppenheimer',
    'Barbie',
    'Wednesday',
  ]);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Persist search state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('searchType', searchType);
  }, [searchType]);

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

  const isInList = useCallback(
    (id: string | number, type: 'series' | 'movie') => {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      if (type === 'series') {
        return seriesList.some((s: Series) => s.id === numId);
      } else {
        return movieList.some((m: MovieType) => m.id === numId);
      }
    },
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
                inList: isInList(item.id, 'series'),
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
                inList: isInList(item.id, 'movie'),
              };
            })
          );
        }

        results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [searchType, isInList, saveToRecent]
  );

  // Debounced search with skip-on-return logic
  const [skipInitialSearch, setSkipInitialSearch] = useState(() => {
    return isReturning && searchResults.length > 0;
  });

  useEffect(() => {
    if (skipInitialSearch) {
      setSkipInitialSearch(false);
      return;
    }

    const timer = setTimeout(() => {
      searchTMDB(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchTMDB, skipInitialSearch]);

  const handleItemClick = useCallback(
    (item: SearchResult) => {
      window.history.replaceState({ ...window.history.state, usr: { returning: true } }, '');

      const container = document.querySelector('.mobile-content') as HTMLElement;
      if (container && container.scrollTop > 0) {
        sessionStorage.setItem('search-scroll', String(container.scrollTop));
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
          setSearchResults((prev) => prev.filter((r) => r.id !== item.id));

          const title = item.title || item.name;
          setSnackbar({
            open: true,
            message: `"${title}" wurde erfolgreich hinzugefügt!`,
          });

          const posterPath = item.poster_path;
          if (item.media_type === 'tv' || endpoint.includes('/add')) {
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
    searchResults,
    loading,
    recentSearches,
    popularSearches,
    isDesktop,
    snackbar,
    dialog,
    setDialog,
    handleItemClick,
    addToList,
    removeRecentSearch,
  };
};
