/**
 * SearchPage - Premium Search Experience
 * Modern search interface with animated results
 */

import {
  Add,
  CalendarToday,
  Check,
  Close,
  History,
  Movie,
  Search,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { Movie as MovieType } from '../../types/Movie';
import { Series } from '../../types/Series';
import { Dialog, LoadingSpinner, PageHeader } from '../../components/ui';
import './SearchPage.css';

interface SearchResult {
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

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme } = useTheme();

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
  const [searchType, setSearchType] = useState<'all' | 'series' | 'movies'>(() => {
    if (isReturning) {
      const saved = sessionStorage.getItem('searchType');
      return (saved as 'all' | 'series' | 'movies') || 'all';
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

  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('searchType', searchType);
  }, [searchType]);

  useEffect(() => {
    sessionStorage.setItem('searchResults', JSON.stringify(searchResults));
  }, [searchResults]);

  const saveToRecent = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const isInList = (id: string | number, type: 'series' | 'movie') => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    if (type === 'series') {
      return seriesList.some((s: Series) => s.id === numId);
    } else {
      return movieList.some((m: MovieType) => m.id === numId);
    }
  };

  const searchTMDB = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      saveToRecent(query);

      try {
        const results: SearchResult[] = [];

        const fetchSeries =
          searchType === 'all' || searchType === 'series'
            ? fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${import.meta.env.VITE_API_TMDB}&query=${encodeURIComponent(query)}&language=de-DE`
              ).then((r) => r.json())
            : Promise.resolve(null);

        const fetchMovies =
          searchType === 'all' || searchType === 'movies'
            ? fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_API_TMDB}&query=${encodeURIComponent(query)}&language=de-DE`
              ).then((r) => r.json())
            : Promise.resolve(null);

        const [seriesData, movieData] = await Promise.all([fetchSeries, fetchMovies]);

        if (seriesData?.results) {
          results.push(
            ...seriesData.results.map((item: SearchResult) => ({
              ...item,
              type: 'series',
              inList: isInList(item.id, 'series'),
            }))
          );
        }

        if (movieData?.results) {
          results.push(
            ...movieData.results.map((item: SearchResult) => ({
              ...item,
              type: 'movie',
              inList: isInList(item.id, 'movie'),
            }))
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
    [searchType, seriesList, movieList]
  );

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
  }, [searchQuery, searchTMDB]);

  const handleItemClick = (item: SearchResult) => {
    window.history.replaceState({ ...window.history.state, usr: { returning: true } }, '');

    if (item.type === 'series') {
      navigate(`/series/${item.id}`);
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  const addToList = async (item: SearchResult) => {
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
  };

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const filterTabs = [
    {
      key: 'all',
      label: 'Alle',
      icon: null,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
    },
    {
      key: 'series',
      label: 'Serien',
      icon: CalendarToday,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, #667eea)`,
    },
    {
      key: 'movies',
      label: 'Filme',
      icon: Movie,
      gradient: `linear-gradient(135deg, ${currentTheme.status.error}, #ff9a00)`,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.status.error}20, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Search Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: `${currentTheme.background.default}ee`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 100,
        }}
      >
        <PageHeader
          title="Suche"
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.primary}
          sticky={false}
          style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))' }}
        />

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: '0 20px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '16px',
              padding: '14px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <Search style={{ fontSize: '22px', color: currentTheme.text.muted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Serien & Filmen..."
              autoFocus
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: currentTheme.text.primary,
                fontSize: '16px',
              }}
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0, borderRadius: '50%' }}
                animate={{ scale: 1, borderRadius: '50%' }}
                whileTap={{ scale: 0.9, borderRadius: '50%' }}
                onClick={() => setSearchQuery('')}
                style={{
                  background: `${currentTheme.text.muted}20`,
                  border: 'none',
                  padding: 0,
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  borderRadius: '50%',
                  color: currentTheme.text.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <Close style={{ fontSize: '16px' }} />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: 'flex',
            padding: '0 20px 16px',
            gap: '10px',
          }}
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              className="search-filter-btn"
              onClick={() => setSearchType(tab.key as 'all' | 'series' | 'movies')}
              style={{
                padding: '10px 18px',
                background: searchType === tab.key ? tab.gradient : currentTheme.background.surface,
                border:
                  searchType === tab.key ? 'none' : `1px solid ${currentTheme.border.default}`,
                borderRadius: '14px',
                color: searchType === tab.key ? 'white' : currentTheme.text.secondary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: searchType === tab.key ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon && <tab.icon style={{ fontSize: '16px' }} />}
              {tab.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
              }}
            >
              <LoadingSpinner text="Suche läuft..." />
            </motion.div>
          ) : searchQuery && searchResults.length > 0 ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Results Count */}
              <p
                style={{
                  fontSize: '14px',
                  color: currentTheme.text.muted,
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontWeight: 700, color: currentTheme.primary }}>
                  {searchResults.length}
                </span>{' '}
                Ergebnisse für "{searchQuery}"
              </p>

              {/* Results Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isDesktop
                    ? 'repeat(auto-fill, minmax(180px, 1fr))'
                    : 'repeat(2, 1fr)',
                  gap: isDesktop ? '24px' : '10px',
                }}
              >
                {searchResults.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="search-result-item"
                    style={{ position: 'relative' }}
                  >
                    <div
                      className="search-result-poster"
                      onClick={() => handleItemClick(item)}
                      style={{
                        width: '100%',
                        aspectRatio: '2/3',
                        position: 'relative',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <img
                        src={
                          item.poster_path
                            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                            : '/placeholder.jpg'
                        }
                        alt={item.title || item.name}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />

                      {/* Gradient Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Rating Badge */}
                      {item.vote_average && item.vote_average > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: isDesktop ? '8px' : '6px',
                            right: isDesktop ? '8px' : '6px',
                            padding: isDesktop ? '4px 8px' : '3px 6px',
                            background: 'rgba(0, 0, 0, 0.85)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: isDesktop ? '8px' : '6px',
                            fontSize: isDesktop ? '12px' : '10px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: 'white',
                          }}
                        >
                          <Star style={{ fontSize: isDesktop ? '12px' : '10px', color: currentTheme.status.warning }} />
                          {item.vote_average.toFixed(1)}
                        </div>
                      )}

                      {/* Type Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: isDesktop ? '8px' : '6px',
                          left: isDesktop ? '8px' : '6px',
                          padding: isDesktop ? '4px 10px' : '3px 7px',
                          background:
                            item.type === 'series'
                              ? `linear-gradient(135deg, ${currentTheme.primary}, #667eea)`
                              : `linear-gradient(135deg, ${currentTheme.status.error}, #ff9a00)`,
                          borderRadius: isDesktop ? '8px' : '6px',
                          fontSize: isDesktop ? '11px' : '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                          color: 'white',
                        }}
                      >
                        {item.type === 'series' ? 'Serie' : 'Film'}
                      </div>

                      {/* Add/Check Button */}
                      {!item.inList ? (
                        <button
                          className="search-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToList(item);
                          }}
                          style={{
                            position: 'absolute',
                            bottom: isDesktop ? '10px' : '6px',
                            right: isDesktop ? '10px' : '6px',
                            width: isDesktop ? '36px' : '30px',
                            height: isDesktop ? '36px' : '30px',
                            background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: `0 4px 12px ${currentTheme.primary}50`,
                          }}
                        >
                          <Add style={{ fontSize: isDesktop ? '20px' : '18px', color: 'white' }} />
                        </button>
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: isDesktop ? '10px' : '6px',
                            right: isDesktop ? '10px' : '6px',
                            width: isDesktop ? '36px' : '30px',
                            height: isDesktop ? '36px' : '30px',
                            background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${currentTheme.status.success}50`,
                          }}
                        >
                          <Check style={{ fontSize: isDesktop ? '20px' : '18px', color: 'white' }} />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        margin: 0,
                        color: currentTheme.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title || item.name}
                    </h4>

                    {/* Year */}
                    <p
                      style={{
                        fontSize: '12px',
                        color: currentTheme.text.muted,
                        margin: '4px 0 0 0',
                      }}
                    >
                      {item.release_date || item.first_air_date
                        ? new Date((item.release_date || item.first_air_date)!).getFullYear()
                        : 'TBA'}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : searchQuery && !loading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center',
                padding: '60px 20px',
              }}
            >
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 24px',
                  borderRadius: '50%',
                  background: `${currentTheme.text.muted}10`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Search style={{ fontSize: '48px', color: currentTheme.text.muted }} />
              </div>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                }}
              >
                Keine Ergebnisse
              </h3>
              <p style={{ margin: 0, color: currentTheme.text.muted, fontSize: '15px' }}>
                Keine Ergebnisse für "{searchQuery}"
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Trending Searches */}
              <section style={{ marginBottom: '32px' }}>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: currentTheme.text.primary,
                  }}
                >
                  <TrendingUp style={{ fontSize: '20px', color: currentTheme.primary }} />
                  Beliebte Suchen
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {popularSearches.map((term, index) => (
                    <motion.button
                      key={term}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchQuery(term)}
                      style={{
                        padding: '10px 18px',
                        background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}08)`,
                        border: `1px solid ${currentTheme.primary}30`,
                        borderRadius: '20px',
                        color: currentTheme.text.primary,
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {term}
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <section>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: currentTheme.text.primary,
                    }}
                  >
                    <History style={{ fontSize: '20px', color: currentTheme.text.muted }} />
                    Zuletzt gesucht
                  </h3>

                  <div
                    style={{
                      background: currentTheme.background.surface,
                      borderRadius: '16px',
                      border: `1px solid ${currentTheme.border.default}`,
                      overflow: 'hidden',
                    }}
                  >
                    {recentSearches.map((term, index) => (
                      <motion.button
                        key={term}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.03 }}
                        onClick={() => setSearchQuery(term)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom:
                            index < recentSearches.length - 1
                              ? `1px solid ${currentTheme.border.default}`
                              : 'none',
                          color: currentTheme.text.primary,
                          fontSize: '15px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Search style={{ fontSize: '18px', color: currentTheme.text.muted }} />
                          <span>{term}</span>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: `${currentTheme.text.muted}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Close style={{ fontSize: '16px', color: currentTheme.text.muted }} />
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Snackbar */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
              color: 'white',
              padding: '14px 24px',
              borderRadius: '14px',
              boxShadow: `0 8px 24px ${currentTheme.status.success}40`,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: 'calc(100% - 40px)',
            }}
          >
            <Check style={{ fontSize: '22px' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
};
