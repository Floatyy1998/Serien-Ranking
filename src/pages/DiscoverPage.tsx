import {
  Add,
  CalendarToday,
  Check,
  FilterList,
  Movie as MovieIcon,
  NewReleases,
  Search,
  Star,
  TrendingUp,
  Whatshot,
} from '@mui/icons-material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { genreIdMapForMovies, genreIdMapForSeries } from '../config/menuItems';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { logMovieAdded, logSeriesAdded } from '../features/badges/minimalActivityLogger';
import { Dialog } from '../components/Dialog';

export const DiscoverPage = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [activeCategory, setActiveCategory] = useState<
    'trending' | 'popular' | 'top_rated' | 'upcoming'
  >('trending');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [dialog, setDialog] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', type: 'info' });
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if item is in list - memoized for performance
  const isInList = useCallback(
    (id: string | number, type: 'series' | 'movie') => {
      if (type === 'series') {
        const found = seriesList.some((s: any) => s.id === id || s.id === id.toString());
        return found;
      } else {
        const found = movieList.some((m: any) => m.id === id || m.id === id.toString());
        return found;
      }
    },
    [seriesList, movieList]
  );

  // Get TMDB image URL - memoized
  const getImageUrl = useCallback((path: string | null): string => {
    if (!path) return '/placeholder.jpg';
    return `https://image.tmdb.org/t/p/w500${path}`;
  }, []);

  // Fetch from TMDB
  const fetchFromTMDB = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);

      const currentPage = reset ? 1 : page + 1;

      try {
        let endpoint = '';
        const mediaType = activeTab === 'series' ? 'tv' : 'movie';

        // Use discover endpoint when genre filter is active
        if (selectedGenre) {
          endpoint = `https://api.themoviedb.org/3/discover/${mediaType}`;
        } else {
          // Build endpoint based on category
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

        // Add parameters
        const params = new URLSearchParams({
          api_key: import.meta.env.VITE_API_TMDB,
          language: 'de-DE',
          page: currentPage.toString(),
          region: 'DE',
        });

        // Add genre filter if selected
        if (selectedGenre) {
          params.append('with_genres', selectedGenre.toString());
          // Add sort for discover endpoint
          params.append(
            'sort_by',
            activeCategory === 'top_rated' ? 'vote_average.desc' : 'popularity.desc'
          );
        }

        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (data.results) {
          const mappedResults = data.results
            .filter((item: any) => !isInList(item.id, activeTab === 'series' ? 'series' : 'movie')) // Hide items already in list
            .map((item: any) => ({
              ...item,
              type: activeTab === 'series' ? 'series' : 'movie',
              inList: false, // Since we filtered them out
            }));

          if (reset) {
            setResults(mappedResults);
            setPage(1);
          } else {
            setResults((prev) => {
              // Filter out duplicates by creating a Set of existing IDs
              const existingIds = new Set(prev.map((item: any) => `${item.type}-${item.id}`));
              const newResults = mappedResults.filter(
                (item: any) => !existingIds.has(`${item.type}-${item.id}`)
              );
              return [...prev, ...newResults];
            });
            setPage(currentPage);
          }

          setHasMore(currentPage < data.total_pages);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    },
    [activeTab, activeCategory, selectedGenre, page, loading, seriesList, movieList]
  );

  // Load initial data and trigger second page load if needed
  useEffect(() => {
    if (!showSearch) {
      fetchFromTMDB(true);
      // Automatically load second page after initial load to ensure enough content for scrolling
      setTimeout(() => {
        const scrollContainer = document.querySelector('.mobile-discover-container');
        if (scrollContainer) {
          const hasScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
          if (!hasScroll && hasMore) {
            fetchFromTMDB(false);
          }
        }
      }, 500);
    }
  }, [activeTab, activeCategory, selectedGenre, showSearch]);

  // Search function
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
            .filter((item: any) => !isInList(item.id, activeTab === 'series' ? 'series' : 'movie')) // Hide items already in list
            .slice(0, 20)
            .map((item: any) => ({
              ...item,
              type: activeTab === 'series' ? 'series' : 'movie',
              inList: false, // Since we filtered them out
            }));

          setSearchResults(mappedResults);
        }
      } catch (error) {
      } finally {
        setSearchLoading(false);
      }
    },
    [activeTab, seriesList, movieList]
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showSearch) {
        searchItems(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSearch, searchItems]);

  // Add to list - memoized
  const addToList = useCallback(
    async (item: any, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }
      
      if (!user) {
        setDialog({ open: true, message: 'Bitte einloggen um Inhalte hinzuzufügen!', type: 'warning' });
        return;
      }

      const itemKey = `${item.type}-${item.id}`;
      setAddingItem(itemKey);

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
          // Remove item from results immediately
          setResults((prev) => prev.filter((r) => r.id !== item.id));
          setSearchResults((prev) => prev.filter((r) => r.id !== item.id));
          
          // Show success snackbar
          const title = item.title || item.name;
          setSnackbar({ 
            open: true, 
            message: `"${title}" wurde erfolgreich hinzugefügt!` 
          });

          // Activity-Logging für Friend + Badge-System (wie Desktop)
          if (item.type === 'series') {
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
        console.error('Failed to add item:', error);
      } finally {
        setAddingItem(null);
      }
    },
    [user]
  );

  // Handle item click - memoized
  const handleItemClick = useCallback(
    (item: any) => {
      // Always navigate to detail page
      navigate(item.type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
    },
    [navigate]
  );

  // Load more on scroll
  const handleScroll = useCallback(() => {
    const scrollContainer = document.querySelector('.mobile-discover-container');
    if (!scrollContainer) return;

    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;

    // Check if we're within 800px of the bottom and ensure minimum content height
    // This helps trigger loading even with just 2 rows initially
    const triggerDistance = Math.min(800, scrollHeight * 0.3);
    
    if (scrollHeight - scrollTop - clientHeight < triggerDistance && hasMore && !loading && !showSearch) {
      fetchFromTMDB(false); // Pass false to load next page, not reset
    }
  }, [hasMore, loading, fetchFromTMDB, showSearch]);

  // Attach scroll listener
  useEffect(() => {
    const scrollContainer = document.querySelector('.mobile-discover-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Memoize genres to prevent recreation on every render
  const genres = useMemo(
    () => (activeTab === 'series' ? genreIdMapForSeries : genreIdMapForMovies),
    [activeTab]
  );

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: currentTheme.background.default,
        overflow: 'hidden',
      }}
    >
      {/* Fixed Header and Controls */}
      <div
        style={{
          flexShrink: 0,
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '12px 16px',
            paddingTop: 'calc(12px + env(safe-area-inset-top))',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                background: currentTheme.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Entdecken
            </h1>

            <div style={{ display: 'flex', gap: '6px' }}>
              {!showSearch && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    padding: '8px',
                    background: selectedGenre ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
                    border: `1px solid ${selectedGenre ? currentTheme.primary : currentTheme.border.default}`,
                    borderRadius: '8px',
                    color: selectedGenre ? currentTheme.primary : currentTheme.text.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={selectedGenre ? genres.find((g) => g.id === selectedGenre)?.name : 'Genre Filter'}
                >
                  <FilterList style={{ fontSize: '18px' }} />
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (!showSearch) {
                    setShowFilters(false);
                  }
                }}
                style={{
                  padding: '8px',
                  background: showSearch
                    ? `${currentTheme.primary}33`
                    : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${showSearch ? currentTheme.primary : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color: showSearch ? currentTheme.primary : currentTheme.text.primary,
                  cursor: 'pointer',
                }}
              >
                <Search style={{ fontSize: '18px' }} />
              </button>
            </div>
          </div>
        </header>

        {/* Search Input */}
        {showSearch && (
          <div
            style={{
              padding: '0 16px 8px 16px',
            }}
          >
            <input
              type="text"
              placeholder={`${activeTab === 'series' ? 'Serien' : 'Filme'} suchen...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: `${currentTheme.text.primary}0D`,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: currentTheme.text.primary,
                fontSize: '14px',
              }}
            />
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setActiveTab('series')}
            style={{
              flex: 1,
              padding: '8px',
              background:
                activeTab === 'series' ? currentTheme.primary : `${currentTheme.text.primary}0D`,
              border: activeTab === 'series' ? 'none' : `1px solid ${currentTheme.border.default}`,
              borderRadius: '8px',
              color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <CalendarToday style={{ fontSize: '16px' }} />
            Serien
          </button>

          <button
            onClick={() => setActiveTab('movies')}
            style={{
              flex: 1,
              padding: '8px',
              background:
                activeTab === 'movies'
                  ? `${currentTheme.primary}CC`
                  : `${currentTheme.text.primary}0D`,
              border: activeTab === 'movies' ? 'none' : `1px solid ${currentTheme.border.default}`,
              borderRadius: '8px',
              color: activeTab === 'movies' ? 'white' : currentTheme.text.primary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <MovieIcon style={{ fontSize: '16px' }} />
            Filme
          </button>
        </div>

        {/* Categories */}
        {!showSearch && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              padding: '0 16px 12px 16px',
            }}
          >
            <button
              onClick={() => setActiveCategory('trending')}
              style={{
                padding: '8px 4px',
                background:
                  activeCategory === 'trending'
                    ? `${currentTheme.primary}33`
                    : `${currentTheme.text.primary}08`,
                border:
                  activeCategory === 'trending'
                    ? `1px solid ${currentTheme.primary}66`
                    : `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: activeCategory === 'trending' ? currentTheme.primary : currentTheme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <TrendingUp style={{ fontSize: '18px' }} />
              <span style={{ fontSize: '10px', fontWeight: 600 }}>Trend</span>
            </button>

            <button
              onClick={() => setActiveCategory('popular')}
              style={{
                padding: '8px 4px',
                background:
                  activeCategory === 'popular'
                    ? `${currentTheme.status.error}33`
                    : `${currentTheme.text.primary}08`,
                border:
                  activeCategory === 'popular'
                    ? `1px solid ${currentTheme.status.error}66`
                    : `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: activeCategory === 'popular' ? currentTheme.status.error : currentTheme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Whatshot style={{ fontSize: '18px' }} />
              <span style={{ fontSize: '10px', fontWeight: 600 }}>Beliebt</span>
            </button>

            <button
              onClick={() => setActiveCategory('top_rated')}
              style={{
                padding: '8px 4px',
                background:
                  activeCategory === 'top_rated'
                    ? `${currentTheme.status.warning}33`
                    : `${currentTheme.text.primary}08`,
                border:
                  activeCategory === 'top_rated'
                    ? `1px solid ${currentTheme.status.warning}66`
                    : `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: activeCategory === 'top_rated' ? currentTheme.status.warning : currentTheme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Star style={{ fontSize: '18px' }} />
              <span style={{ fontSize: '10px', fontWeight: 600 }}>Top</span>
            </button>

            <button
              onClick={() => setActiveCategory('upcoming')}
              style={{
                padding: '8px 4px',
                background:
                  activeCategory === 'upcoming'
                    ? `${currentTheme.status.success}33`
                    : `${currentTheme.text.primary}08`,
                border:
                  activeCategory === 'upcoming'
                    ? `1px solid ${currentTheme.status.success}66`
                    : `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: activeCategory === 'upcoming' ? currentTheme.status.success : currentTheme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <NewReleases style={{ fontSize: '18px' }} />
              <span style={{ fontSize: '10px', fontWeight: 600 }}>
                {activeTab === 'movies' ? 'Neu' : 'Läuft'}
              </span>
            </button>
          </div>
        )}

        {/* Genre Filter Dropdown */}
        {showFilters && !showSearch && (
          <div
            style={{
              padding: '0 16px 12px 16px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                maxHeight: '150px',
                overflowY: 'auto',
                padding: '8px',
                background: `${currentTheme.text.primary}08`,
                borderRadius: '8px',
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <button
                onClick={() => {
                  setSelectedGenre(null);
                  setShowFilters(false);
                }}
                style={{
                  padding: '6px 8px',
                  background: !selectedGenre ? `${currentTheme.primary}33` : 'transparent',
                  border: !selectedGenre
                    ? `1px solid ${currentTheme.primary}66`
                    : `1px solid ${currentTheme.border.default}`,
                  borderRadius: '6px',
                  color: !selectedGenre ? currentTheme.primary : currentTheme.text.primary,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Alle
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => {
                    setSelectedGenre(genre.id);
                    setShowFilters(false);
                  }}
                  style={{
                    padding: '6px 8px',
                    background:
                      selectedGenre === genre.id ? `${currentTheme.primary}33` : 'transparent',
                    border:
                      selectedGenre === genre.id
                        ? `1px solid ${currentTheme.primary}66`
                        : `1px solid ${currentTheme.border.default}`,
                    borderRadius: '6px',
                    color: selectedGenre === genre.id ? currentTheme.primary : currentTheme.text.primary,
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div
        className="mobile-discover-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
        }}
      >
        {showSearch ? (
          <div>
            {searchLoading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '40px',
                }}
              >
                <div style={{ color: currentTheme.text.muted }}>Suche läuft...</div>
              </div>
            ) : searchResults.length === 0 && searchQuery.trim() ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                <Search
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                />
                <p>Keine Ergebnisse für "{searchQuery}"</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                <Search
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                />
                <p>Gib einen Suchbegriff ein...</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isDesktop
                    ? 'repeat(auto-fill, minmax(200px, 1fr))'
                    : 'repeat(2, 1fr)',
                  gap: isDesktop ? '24px' : '16px',
                  maxWidth: '100%',
                  margin: '0',
                }}
              >
                {searchResults.map((item) => (
                  <div
                    key={`search-${item.type}-${item.id}`}
                    style={{
                      position: 'relative',
                    }}
                  >
                    <div
                      onClick={() => handleItemClick(item)}
                      style={{
                        width: '100%',
                        aspectRatio: '2/3',
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src={getImageUrl(item.poster_path)}
                        alt={item.title || item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />

                      {/* Rating Badge */}
                      {item.vote_average > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            padding: '4px 8px',
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Star
                            style={{
                              fontSize: '12px',
                              color: currentTheme.status.warning,
                            }}
                          />
                          {item.vote_average.toFixed(1)}
                        </div>
                      )}

                      {/* Add Button */}
                      {!item.inList && (
                        <button
                          onClick={(e) => addToList(item, e)}
                          disabled={addingItem === `${item.type}-${item.id}`}
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            width: '28px',
                            height: '28px',
                            background: addingItem === `${item.type}-${item.id}` 
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            cursor: addingItem === `${item.type}-${item.id}` ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease',
                            padding: 0,
                          }}
                        >
                          <Add
                            style={{
                              fontSize: '18px',
                              color: currentTheme.text.primary,
                              opacity: addingItem === `${item.type}-${item.id}` ? 0.5 : 1,
                            }}
                          />
                        </button>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        margin: 0,
                        color: 'rgba(255, 255, 255, 0.9)',
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

                    <p
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        margin: '2px 0 0 0',
                      }}
                    >
                      {item.release_date || item.first_air_date
                        ? new Date(item.release_date || item.first_air_date).getFullYear()
                        : 'TBA'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isDesktop
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(2, 1fr)',
              gap: isDesktop ? '24px' : '16px',
              maxWidth: '100%',
              margin: '0',
            }}
          >
            {results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                style={{
                  position: 'relative',
                }}
              >
                <div
                  onClick={() => handleItemClick(item)}
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={getImageUrl(item.poster_path)}
                    alt={item.title || item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Rating Badge */}
                  {item.vote_average > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Star
                        style={{
                          fontSize: '12px',
                          color: currentTheme.status.warning,
                        }}
                      />
                      {item.vote_average.toFixed(1)}
                    </div>
                  )}

                  {/* Add Button */}
                  {!item.inList && (
                    <button
                      onClick={(e) => addToList(item, e)}
                      disabled={addingItem === `${item.type}-${item.id}`}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        background: addingItem === `${item.type}-${item.id}` 
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        cursor: addingItem === `${item.type}-${item.id}` ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        padding: 0,
                      }}
                    >
                      <Add
                        style={{
                          fontSize: '18px',
                          color: 'white',
                          opacity: addingItem === `${item.type}-${item.id}` ? 0.5 : 1,
                        }}
                      />
                    </button>
                  )}
                </div>

                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: 0,
                    color: 'rgba(255, 255, 255, 0.9)',
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

                <p
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    margin: '2px 0 0 0',
                  }}
                >
                  {item.release_date || item.first_air_date
                    ? new Date(item.release_date || item.first_air_date).getFullYear()
                    : 'TBA'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {loading && !showSearch && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div style={{ color: currentTheme.text.muted }}>Lade mehr...</div>
          </div>
        )}

        {/* Bottom padding for better scrolling */}
        <div style={{ height: '100px' }} />
      </div>

      {/* Snackbar for success feedback */}
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
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
});

DiscoverPage.displayName = 'DiscoverPage';
