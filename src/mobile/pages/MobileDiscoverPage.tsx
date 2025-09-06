import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Whatshot, NewReleases, Star, 
  Movie as MovieIcon, CalendarToday, FilterList, Check, Add,
  Search, ArrowBack
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useAuth } from '../../App';
import { genreIdMapForSeries, genreIdMapForMovies } from '../../config/menuItems';
// import { Series } from '../../types/Series';
// import { Movie } from '../../types/Movie';
import { logSeriesAdded, logMovieAdded } from '../../features/badges/minimalActivityLogger';
// import { calculateOverallRating } from '../../lib/rating/rating';
import { useTheme } from '../../contexts/ThemeContext';

export const MobileDiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme } = useTheme();
  
  
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [activeCategory, setActiveCategory] = useState<'trending' | 'popular' | 'top_rated' | 'upcoming'>('trending');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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
  
  // Check if item is in list
  const isInList = (id: string | number, type: 'series' | 'movie') => {
    if (type === 'series') {
      const found = seriesList.some((s: any) => s.id === id || s.id === id.toString());
      if (found) console.log('Found in series list:', id);
      return found;
    } else {
      const found = movieList.some((m: any) => m.id === id || m.id === id.toString());
      if (found) console.log('Found in movie list:', id);
      return found;
    }
  };
  
  // Get TMDB image URL
  const getImageUrl = (path: string | null): string => {
    if (!path) return '/placeholder.jpg';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };
  
  // Fetch from TMDB
  const fetchFromTMDB = useCallback(async (reset = false) => {
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
        region: 'DE'
      });
      
      // Add genre filter if selected
      if (selectedGenre) {
        params.append('with_genres', selectedGenre.toString());
        // Add sort for discover endpoint
        params.append('sort_by', activeCategory === 'top_rated' ? 'vote_average.desc' : 'popularity.desc');
      }
      
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      
      if (data.results) {
        const mappedResults = data.results
          .filter((item: any) => !isInList(item.id, activeTab === 'series' ? 'series' : 'movie')) // Hide items already in list
          .map((item: any) => ({
            ...item,
            type: activeTab === 'series' ? 'series' : 'movie',
            inList: false // Since we filtered them out
          }));
        
        if (reset) {
          setResults(mappedResults);
          setPage(1);
        } else {
          setResults(prev => {
            // Filter out duplicates by creating a Set of existing IDs
            const existingIds = new Set(prev.map((item: any) => `${item.type}-${item.id}`));
            const newResults = mappedResults.filter((item: any) => !existingIds.has(`${item.type}-${item.id}`));
            return [...prev, ...newResults];
          });
          setPage(currentPage);
        }
        
        setHasMore(currentPage < data.total_pages);
      }
    } catch (error) {
      console.error('Error fetching from TMDB:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeCategory, selectedGenre, page, loading, seriesList, movieList]);
  
  // Load initial data
  useEffect(() => {
    if (!showSearch) {
      fetchFromTMDB(true);
    }
  }, [activeTab, activeCategory, selectedGenre, showSearch]);
  
  // Search function
  const searchItems = useCallback(async (query: string) => {
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
        page: '1'
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
            inList: false // Since we filtered them out
          }));
        
        setSearchResults(mappedResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [activeTab, seriesList, movieList]);
  
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showSearch) {
        searchItems(searchQuery);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSearch, searchItems]);
  
  
  // Add to list
  const addToList = async (item: any) => {
    if (!user) {
      alert('Bitte einloggen!');
      return;
    }
    
    const endpoint = item.type === 'series' 
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
        setResults(prev => 
          prev.map(r => r.id === item.id ? { ...r, inList: true } : r)
        );
        
        // Activity-Logging für Friend + Badge-System (wie Desktop)
        if (item.type === 'series') {
          await logSeriesAdded(
            user.uid,
            item.name || item.title || 'Unbekannte Serie',
            item.id
          );
        } else {
          await logMovieAdded(
            user.uid,
            item.title || 'Unbekannter Film',
            item.id
          );
        }
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };
  
  // Handle item click
  const handleItemClick = (item: any) => {
    if (item.inList) {
      navigate(item.type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
    } else {
      addToList(item);
    }
  };
  
  // Load more on scroll
  const handleScroll = useCallback(() => {
    const scrollContainer = document.querySelector('.mobile-content');
    if (!scrollContainer) return;
    
    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    
    // Check if we're within 200px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loading) {
      fetchFromTMDB();
    }
  }, [hasMore, loading, fetchFromTMDB]);
  
  // Attach scroll listener
  useEffect(() => {
    const scrollContainer = document.querySelector('.mobile-content');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  const genres = activeTab === 'series' ? genreIdMapForSeries : genreIdMapForMovies;
  
  return (
    <div>
      {/* Header */}
      <header style={{
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        background: `linear-gradient(180deg, ${currentTheme.background.default} 0%, ${currentTheme.background.default}CC 100%)`,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.text.primary,
                cursor: 'pointer',
                padding: '4px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowBack style={{ fontSize: '28px' }} />
            </button>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 800,
                margin: 0,
                background: currentTheme.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Entdecken
              </h1>
              <p style={{ 
                color: currentTheme.text.secondary, 
                fontSize: '16px',
                margin: '4px 0 0 0'
              }}>
                {showSearch ? 'Suche' : 'Trending & Beliebte Inhalte'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setShowSearch(!showSearch);
              }}
              style={{
                padding: '10px',
                background: showSearch ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '12px',
                color: currentTheme.text.primary,
                cursor: 'pointer'
              }}
            >
              <Search />
            </button>
          </div>
        </div>
      </header>
      
      {/* Search Input */}
      {showSearch && (
        <div style={{
          padding: '0 20px',
          marginBottom: '20px'
        }}>
          <input
            type="text"
            placeholder={`${activeTab === 'series' ? 'Serien' : 'Filme'} suchen...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              background: `${currentTheme.text.primary}0D`,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '12px',
              color: currentTheme.text.primary,
              fontSize: '16px'
            }}
          />
        </div>
      )}
      
      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        padding: '0 20px',
        marginBottom: '20px',
        gap: '12px'
      }}>
        <button
          onClick={() => setActiveTab('series')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'series' 
              ? currentTheme.primary
              : `${currentTheme.text.primary}0D`,
            border: activeTab === 'series'
              ? 'none'
              : `1px solid ${currentTheme.border.default}`,
            borderRadius: '12px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <CalendarToday style={{ fontSize: '18px' }} />
          Serien
        </button>
        
        <button
          onClick={() => setActiveTab('movies')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'movies' 
              ? currentTheme.status.error
              : `${currentTheme.text.primary}0D`,
            border: activeTab === 'movies'
              ? 'none'
              : `1px solid ${currentTheme.border.default}`,
            borderRadius: '12px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <MovieIcon style={{ fontSize: '18px' }} />
          Filme
        </button>
      </div>
      
      {/* Categories */}
      {!showSearch && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px',
          padding: '0 20px',
          marginBottom: '24px'
        }}>
        <button
          onClick={() => setActiveCategory('trending')}
          style={{
            padding: '20px',
            background: activeCategory === 'trending'
              ? `${currentTheme.primary}33`
              : `${currentTheme.text.primary}08`,
            border: activeCategory === 'trending'
              ? `1px solid ${currentTheme.primary}66`
              : `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingUp style={{ fontSize: '32px', color: currentTheme.primary }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Im Trend</span>
        </button>
        
        <button
          onClick={() => setActiveCategory('popular')}
          style={{
            padding: '20px',
            background: activeCategory === 'popular'
              ? `${currentTheme.status.error}33`
              : `${currentTheme.text.primary}08`,
            border: activeCategory === 'popular'
              ? `1px solid ${currentTheme.status.error}66`
              : `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Whatshot style={{ fontSize: '32px', color: currentTheme.status.error }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Beliebt</span>
        </button>
        
        <button
          onClick={() => setActiveCategory('top_rated')}
          style={{
            padding: '20px',
            background: activeCategory === 'top_rated'
              ? `${currentTheme.status.warning}33`
              : `${currentTheme.text.primary}08`,
            border: activeCategory === 'top_rated'
              ? `1px solid ${currentTheme.status.warning}66`
              : `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Star style={{ fontSize: '32px', color: currentTheme.status.warning }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Top Bewertet</span>
        </button>
        
        <button
          onClick={() => setActiveCategory('upcoming')}
          style={{
            padding: '20px',
            background: activeCategory === 'upcoming'
              ? `${currentTheme.status.success}33`
              : `${currentTheme.text.primary}08`,
            border: activeCategory === 'upcoming'
              ? `1px solid ${currentTheme.status.success}66`
              : `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <NewReleases style={{ fontSize: '32px', color: currentTheme.status.success }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {activeTab === 'movies' ? 'Demnächst' : 'Läuft gerade'}
          </span>
        </button>
      </div>
      )}
      
      {/* Genre Filter */}
      {!showSearch && (
        <div style={{ 
          padding: '0 20px',
          marginBottom: '20px'
        }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: `${currentTheme.text.primary}0D`,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '8px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <FilterList style={{ fontSize: '18px' }} />
          Genre Filter
          {selectedGenre && ` (${genres.find(g => g.id === selectedGenre)?.name})`}
        </button>
        
        {showFilters && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '12px'
          }}>
            <button
              onClick={() => {
                setSelectedGenre(null);
                setShowFilters(false);
              }}
              style={{
                padding: '6px 12px',
                background: !selectedGenre 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: !selectedGenre
                  ? 'none'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Alle
            </button>
            {genres.map(genre => (
              <button
                key={genre.id}
                onClick={() => {
                  setSelectedGenre(genre.id);
                  setShowFilters(false);
                }}
                style={{
                  padding: '6px 12px',
                  background: selectedGenre === genre.id 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedGenre === genre.id
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}
      </div>
      )}
      
      {/* Content */}
      {showSearch ? (
        <div style={{ padding: '0 20px' }}>
          {searchLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '40px'
            }}>
              <div style={{ color: currentTheme.text.muted }}>Suche läuft...</div>
            </div>
          ) : searchResults.length === 0 && searchQuery.trim() ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255, 255, 255, 0.4)'
            }}>
              <Search style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
              <p>Keine Ergebnisse für "{searchQuery}"</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255, 255, 255, 0.4)'
            }}>
              <Search style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
              <p>Gib einen Suchbegriff ein...</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isDesktop 
                ? 'repeat(auto-fill, minmax(150px, 1fr))' 
                : 'repeat(2, 1fr)', 
              gap: '16px',
              maxWidth: isDesktop ? '1200px' : '100%',
              margin: isDesktop ? '0 auto' : '0'
            }}>
              {searchResults.map(item => (
                <div 
                  key={`search-${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  style={{ 
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <img
                      src={getImageUrl(item.poster_path)}
                      alt={item.title || item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    
                    {/* Rating Badge */}
                    {item.vote_average > 0 && (
                      <div style={{
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
                        gap: '2px'
                      }}>
                        <Star style={{ fontSize: '12px', color: currentTheme.status.warning }} />
                        {item.vote_average.toFixed(1)}
                      </div>
                    )}
                    
                    {/* In List Badge */}
                    {item.inList ? (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        background: 'rgba(76, 209, 55, 0.9)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check style={{ fontSize: '18px', color: currentTheme.text.primary }} />
                      </div>
                    ) : (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <Add style={{ fontSize: '18px', color: currentTheme.text.primary }} />
                      </div>
                    )}
                  </div>
                  
                  <h4 style={{ 
                    fontSize: '12px',
                    fontWeight: 500,
                    margin: 0,
                    color: 'rgba(255, 255, 255, 0.9)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.3
                  }}>
                    {item.title || item.name}
                  </h4>
                  
                  <p style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    margin: '2px 0 0 0'
                  }}>
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isDesktop 
            ? 'repeat(auto-fill, minmax(150px, 1fr))' 
            : 'repeat(2, 1fr)', 
          gap: '16px',
          padding: '0 20px',
          maxWidth: isDesktop ? '1200px' : '100%',
          margin: isDesktop ? '0 auto' : '0'
        }}>
          {results.map(item => (
          <div 
            key={`${item.type}-${item.id}`}
            onClick={() => handleItemClick(item)}
            style={{ 
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div style={{
              width: '100%',
              aspectRatio: '2/3',
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <img
                src={getImageUrl(item.poster_path)}
                alt={item.title || item.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              {/* Rating Badge */}
              {item.vote_average > 0 && (
                <div style={{
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
                  gap: '2px'
                }}>
                  <Star style={{ fontSize: '12px', color: currentTheme.status.warning }} />
                  {item.vote_average.toFixed(1)}
                </div>
              )}
              
              {/* In List Badge */}
              {item.inList && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '28px',
                  height: '28px',
                  background: 'rgba(76, 209, 55, 0.9)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check style={{ fontSize: '18px', color: 'white' }} />
                </div>
              )}
              
              {/* Add Button */}
              {!item.inList && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '28px',
                  height: '28px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Add style={{ fontSize: '18px', color: 'white' }} />
                </div>
              )}
            </div>
            
            <h4 style={{ 
              fontSize: '14px',
              fontWeight: 600,
              margin: 0,
              color: 'rgba(255, 255, 255, 0.9)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3
            }}>
              {item.title || item.name}
            </h4>
            
            <p style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.4)',
              margin: '2px 0 0 0'
            }}>
              {item.release_date || item.first_air_date 
                ? new Date(item.release_date || item.first_air_date).getFullYear()
                : 'TBA'}
            </p>
          </div>
        ))}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ color: currentTheme.text.muted }}>Lade mehr...</div>
        </div>
      )}
    </div>
  );
};