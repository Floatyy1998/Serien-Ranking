import { CalendarToday, Check, Close, Movie, Search, TrendingUp } from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { Movie as MovieType } from '../../types/Movie';
import { Series } from '../../types/Series';
import { VirtualizedSearchResults } from '../components/VirtualizedSearchResults';
import { MobileDialog } from '../components/MobileDialog';
// import { genreIdMapForSeries, genreIdMapForMovies } from '../../config/menuItems';

export const MobileSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'series' | 'movies'>('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', type: 'info' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
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

  // Save search to recent
  const saveToRecent = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Check if item is already in list
  const isInList = (id: string | number, type: 'series' | 'movie') => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    if (type === 'series') {
      return seriesList.some((s: Series) => s.id === numId);
    } else {
      return movieList.some((m: MovieType) => m.id === numId);
    }
  };

  // Search TMDB
  const searchTMDB = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      saveToRecent(query);

      try {
        const results = [];

        // Search series if needed
        if (searchType === 'all' || searchType === 'series') {
          const seriesResponse = await fetch(
            `https://api.themoviedb.org/3/search/tv?api_key=${import.meta.env.VITE_API_TMDB}&query=${encodeURIComponent(query)}&language=de-DE`
          );
          const seriesData = await seriesResponse.json();

          if (seriesData.results) {
            results.push(
              ...seriesData.results.map((item: any) => ({
                ...item,
                type: 'series',
                inList: isInList(item.id, 'series'),
              }))
            );
          }
        }

        // Search movies if needed
        if (searchType === 'all' || searchType === 'movies') {
          const movieResponse = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_API_TMDB}&query=${encodeURIComponent(query)}&language=de-DE`
          );
          const movieData = await movieResponse.json();

          if (movieData.results) {
            results.push(
              ...movieData.results.map((item: any) => ({
                ...item,
                type: 'movie',
                inList: isInList(item.id, 'movie'),
              }))
            );
          }
        }

        // Sort by popularity
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTMDB(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchTMDB]);

  // Handle item click - always navigate to detail page
  const handleItemClick = (item: any) => {
    // Always navigate to detail page
    if (item.type === 'series') {
      navigate(`/series/${item.id}`);
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  // Add to list
  const addToList = async (item: any) => {
    if (!user) {
      setDialog({ open: true, message: 'Bitte einloggen um Inhalte hinzuzufügen!', type: 'warning' });
      return;
    }

    const endpoint =
      item.type === 'series'
        ? 'https://serienapi.konrad-dinges.de/add'
        : 'https://serienapi.konrad-dinges.de/addMovie';

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
        // Remove item from search results (like in MobileDiscoverPage)
        setSearchResults((prev) => prev.filter((r) => r.id !== item.id));
        
        // Show success snackbar
        const title = item.title || item.name;
        setSnackbar({ 
          open: true, 
          message: `"${title}" wurde erfolgreich hinzugefügt!` 
        });

        // Activity-Logging für Friend + Badge-System (wie Desktop)
        if (item.media_type === 'tv' || endpoint.includes('/add')) {
          await logSeriesAdded(user.uid, item.name || item.title || 'Unbekannte Serie', item.id);
        } else {
          await logMovieAdded(user.uid, item.title || 'Unbekannter Film', item.id);
        }

        // Hide snackbar after 3 seconds
        setTimeout(() => {
          setSnackbar({ open: false, message: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setDialog({ open: true, message: 'Fehler beim Hinzufügen des Inhalts.', type: 'error' });
    }
  };

  // Remove search term
  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <div>
      {/* Search Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: '20px',
            paddingTop: 'calc(20px + env(safe-area-inset-top))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px',
            }}
          >
            <Search style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
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
                color: 'white',
                fontSize: '16px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Close style={{ fontSize: '20px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '0 20px 12px',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setSearchType('all')}
            style={{
              padding: '8px 16px',
              background:
                searchType === 'all'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: searchType === 'all' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Alle
          </button>
          <button
            onClick={() => setSearchType('series')}
            style={{
              padding: '8px 16px',
              background:
                searchType === 'series'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: searchType === 'series' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CalendarToday style={{ fontSize: '14px' }} />
            Serien
          </button>
          <button
            onClick={() => setSearchType('movies')}
            style={{
              padding: '8px 16px',
              background:
                searchType === 'movies'
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ff9a00 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: searchType === 'movies' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Movie style={{ fontSize: '14px' }} />
            Filme
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Suche läuft...</div>
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <>
            {/* Search Results */}
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '20px',
              }}
            >
              {searchResults.length} Ergebnisse für "{searchQuery}"
            </p>

            {/* Virtualized Results List */}
            <VirtualizedSearchResults
              results={searchResults}
              onItemClick={handleItemClick}
              onAddClick={addToList}
              height={window.innerHeight - 200} // Account for header and search bar
            />
          </>
        ) : searchQuery && !loading ? (
          <p
            style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '40px',
            }}
          >
            Keine Ergebnisse für "{searchQuery}"
          </p>
        ) : (
          <>
            {/* Trending Searches */}
            <section style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <TrendingUp style={{ fontSize: '18px' }} />
                Beliebte Suchen
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  Zuletzt gesucht
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>{term}</span>
                      <Close
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        style={{ fontSize: '16px', opacity: 0.5 }}
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Success Snackbar */}
      {snackbar.open && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: currentTheme.status.success,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: 'calc(100% - 40px)',
            transition: 'all 0.3s ease-out',
          }}
        >
          <Check style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{snackbar.message}</span>
        </div>
      )}

      {/* Dialog for alerts */}
      <MobileDialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
};
