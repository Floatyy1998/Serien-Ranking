import {
  Add,
  CalendarToday,
  Check,
  FilterList,
  Movie as MovieIcon,
  NewReleases,
  Recommend,
  Search,
  Star,
  TrendingUp,
  Whatshot,
} from '@mui/icons-material';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { genreIdMapForMovies, genreIdMapForSeries } from '../config/menuItems';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { logMovieAdded, logSeriesAdded } from '../features/badges/minimalActivityLogger';
import { Dialog } from '../components/Dialog';

// Memoized components for better performance
const ItemCard = memo(({
  item,
  onItemClick,
  onAddToList,
  addingItem,
  currentTheme,
  isDesktop
}: any) => {
  const handleImageError = useCallback((e: any) => {
    const target = e.target as HTMLImageElement;
    if (!target.src.includes('data:image/svg')) {
      target.src = `data:image/svg+xml;base64,${btoa(`
        <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${currentTheme.background.surface}"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${currentTheme.text.muted}" font-family="Arial" font-size="16">
            Kein Poster
          </text>
        </svg>
      `)}`;
    }
  }, [currentTheme]);

  const imageUrl = useMemo(() => {
    if (!item.poster_path) return '/placeholder.jpg';
    return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  }, [item.poster_path]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => onItemClick(item)}
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
          src={imageUrl}
          alt={item.title || item.name}
          onError={handleImageError}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

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

        {!item.inList && (
          <button
            onClick={(e) => onAddToList(item, e)}
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
          fontSize: isDesktop ? '14px' : '12px',
          fontWeight: isDesktop ? 600 : 500,
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
  );
});

ItemCard.displayName = 'ItemCard';

export const DiscoverPage = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [activeCategory, setActiveCategory] = useState<
    'trending' | 'popular' | 'top_rated' | 'upcoming' | 'recommendations'
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
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsHasMore, setRecommendationsHasMore] = useState(true);
  const [usedRecommendationSources, setUsedRecommendationSources] = useState<Set<string>>(new Set());

  const [isRestoring, setIsRestoring] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(220); // Default height

  // Use refs to access current values in scroll handler
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const showSearchRef = useRef(showSearch);
  const recommendationsLoadingRef = useRef(recommendationsLoading);
  const recommendationsHasMoreRef = useRef(recommendationsHasMore);
  const activeCategoryRef = useRef(activeCategory);

  // Update refs when state changes
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

  // Calculate header height dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerElement = document.querySelector('[data-header="discover-header"]');
      if (headerElement) {
        const height = headerElement.getBoundingClientRect().height;
        setHeaderHeight(height + 10); // Add small buffer
      }
    };

    // Update on mount and resize
    updateHeaderHeight();
    const handleResize = () => {
      updateHeaderHeight();
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);

    // Also update when content changes (filters, search, etc.)
    const timeoutId = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [showSearch, showFilters, activeTab, activeCategory]);

  // Reset or restore filters when component mounts
  useEffect(() => {
    const isComingFromDetail = sessionStorage.getItem('comingFromDetail') === 'true';

    if (isComingFromDetail) {
      const savedState = sessionStorage.getItem('discoverFilters');
      if (savedState) {
        setIsRestoring(true);
        const filters = JSON.parse(savedState);
        setActiveTab(filters.activeTab || 'series');
        setActiveCategory(filters.activeCategory || 'trending');
        setSelectedGenre(filters.selectedGenre || null);
        setShowFilters(filters.showFilters || false);
        setSearchQuery(filters.searchQuery || '');
        setShowSearch(filters.showSearch || false);

        setTimeout(() => {
          setIsRestoring(false);
          setTimeout(() => {
            if (!showSearch) {
              if (filters.activeCategory === 'recommendations') {
                fetchRecommendations(true);
              } else {
                fetchFromTMDB(true);
              }
            }
          }, 100);
        }, 100);
      }
      sessionStorage.removeItem('comingFromDetail');
      sessionStorage.removeItem('discoverFilters');
    } else {
      setActiveTab('series');
      setActiveCategory('trending');
      setSelectedGenre(null);
      setShowFilters(false);
      setSearchQuery('');
      setShowSearch(false);
    }
  }, []);


  // Check if item is in list
  const isInList = useCallback(
    (id: string | number, type: 'series' | 'movie') => {
      if (type === 'series') {
        return seriesList.some((s: any) => s.id === id || s.id === id.toString());
      } else {
        return movieList.some((m: any) => m.id === id || m.id === id.toString());
      }
    },
    [seriesList, movieList]
  );

  // Fetch recommendations based on user's list
  const fetchRecommendations = useCallback(async (reset = false) => {
    if (recommendationsLoading) return;

    setRecommendationsLoading(true);

    try {
      const userItems = activeTab === 'series' ? seriesList : movieList;

      if (userItems.length === 0) {
        setRecommendations([]);
        setRecommendationsHasMore(false);
        setRecommendationsLoading(false);
        return;
      }

      // Reset state if this is a fresh fetch
      if (reset) {
        setUsedRecommendationSources(new Set());
        setRecommendations([]);
        setRecommendationsHasMore(true);
      }

      const currentUsedSources = reset ? new Set<string>() : new Set(usedRecommendationSources);
      const availableItems = userItems.filter(item => !currentUsedSources.has(item.id.toString()));

      // If we've used all items, we can't get more recommendations
      if (availableItems.length === 0) {
        setRecommendationsHasMore(false);
        setRecommendationsLoading(false);
        return;
      }

      // Get random items from user's list for recommendations (3 items per batch)
      const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
      const selectedItems = shuffled.slice(0, Math.min(3, availableItems.length));

      const allRecommendations: any[] = [];
      const existingIds = new Set(recommendations.map(r => r.id));

      const mediaType = activeTab === 'series' ? 'tv' : 'movie';

      for (const item of selectedItems) {
        const endpoint = `https://api.themoviedb.org/3/${mediaType}/${item.id}/recommendations`;
        const params = new URLSearchParams({
          api_key: import.meta.env.VITE_API_TMDB,
          language: 'de-DE',
        });

        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (data.results) {
          data.results.forEach((rec: any) => {
            if (
              !existingIds.has(rec.id) &&
              !isInList(rec.id, activeTab === 'series' ? 'series' : 'movie')
            ) {
              existingIds.add(rec.id);
              allRecommendations.push({
                ...rec,
                type: activeTab === 'series' ? 'series' : 'movie',
                inList: false,
                basedOn: (item as any).title || (item as any).name,
              });
            }
          });
        }

        // Mark this item as used
        currentUsedSources.add(item.id.toString());
      }

      // Shuffle new recommendations
      const shuffledRecommendations = allRecommendations
        .sort(() => 0.5 - Math.random())
        .slice(0, 20); // 20 per batch

      // Update state
      setUsedRecommendationSources(currentUsedSources);

      if (reset) {
        setRecommendations(shuffledRecommendations);
      } else {
        setRecommendations(prev => [...prev, ...shuffledRecommendations]);
      }

      // Check if we have more sources available
      const remainingItems = userItems.filter(item => !currentUsedSources.has(item.id.toString()));
      setRecommendationsHasMore(remainingItems.length > 0);

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      if (reset) {
        setRecommendations([]);
      }
    } finally {
      setRecommendationsLoading(false);
    }
  }, [activeTab, seriesList, movieList, isInList, recommendationsLoading, recommendations, usedRecommendationSources]);

  // Fetch from TMDB
  const fetchFromTMDB = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);
      const currentPage = reset ? 1 : page + 1;

      try {
        let endpoint = '';
        const mediaType = activeTab === 'series' ? 'tv' : 'movie';

        if (selectedGenre) {
          endpoint = `https://api.themoviedb.org/3/discover/${mediaType}`;
        } else {
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

        const params = new URLSearchParams({
          api_key: import.meta.env.VITE_API_TMDB,
          language: 'de-DE',
          page: currentPage.toString(),
          region: 'DE',
        });

        if (selectedGenre) {
          params.append('with_genres', selectedGenre.toString());
          params.append(
            'sort_by',
            activeCategory === 'top_rated' ? 'vote_average.desc' : 'popularity.desc'
          );
        }

        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (data.results) {
          const mappedResults = data.results
            .filter((item: any) => !isInList(item.id, activeTab === 'series' ? 'series' : 'movie'))
            .map((item: any) => ({
              ...item,
              type: activeTab === 'series' ? 'series' : 'movie',
              inList: false,
            }));

          if (reset) {
            setResults(mappedResults);
            setPage(1);
          } else {
            setResults((prev) => {
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
        console.error('Error fetching from TMDB:', error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, activeCategory, selectedGenre, page, loading, isInList]
  );

  // Load initial data when filters change
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
  }, [activeTab, activeCategory, selectedGenre, showSearch, isRestoring]);

  // Auto-load more content if there's not enough to scroll
  useEffect(() => {
    if (activeCategory === 'recommendations') {
      // Auto-load for recommendations
      if (recommendations.length > 0 && recommendationsHasMore && !recommendationsLoading && !showSearch) {
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
      // Auto-load for normal TMDB results
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
  }, [results.length, hasMore, loading, showSearch, activeCategory, fetchFromTMDB, recommendations.length, recommendationsHasMore, recommendationsLoading, fetchRecommendations]);

  // Attach scroll listener
  useEffect(() => {
    const scrollContainer = document.querySelector('.mobile-discover-container');
    if (scrollContainer) {
      const scrollHandler = () => {
        if (!scrollContainer) return;

        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Check if we're near the bottom (500px threshold)
        if (distanceFromBottom < 500) {
          if (activeCategoryRef.current === 'recommendations') {
            // Handle recommendations infinite scroll
            if (recommendationsHasMoreRef.current && !recommendationsLoadingRef.current) {
              fetchRecommendations(false);
            }
          } else if (hasMoreRef.current && !loadingRef.current && !showSearchRef.current) {
            // Handle normal TMDB infinite scroll
            fetchFromTMDB(false);
          }
        }
      };

      scrollContainer.addEventListener('scroll', scrollHandler);
      return () => {
        scrollContainer.removeEventListener('scroll', scrollHandler);
      };
    }
  }, [fetchFromTMDB, fetchRecommendations, activeCategory]);

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
            .filter((item: any) => !isInList(item.id, activeTab === 'series' ? 'series' : 'movie'))
            .slice(0, 20)
            .map((item: any) => ({
              ...item,
              type: activeTab === 'series' ? 'series' : 'movie',
              inList: false,
            }));

          setSearchResults(mappedResults);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    },
    [activeTab, isInList]
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

  // Add to list
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
          setResults((prev) => prev.filter((r) => r.id !== item.id));
          setSearchResults((prev) => prev.filter((r) => r.id !== item.id));
          setRecommendations((prev) => prev.filter((r) => r.id !== item.id));

          const title = item.title || item.name;
          setSnackbar({
            open: true,
            message: `"${title}" wurde erfolgreich hinzugefügt!`
          });

          const posterPath = item.poster_path;
          if (item.type === 'series') {
            await logSeriesAdded(user.uid, item.name || item.title || 'Unbekannte Serie', item.id, posterPath);
          } else {
            await logMovieAdded(user.uid, item.title || 'Unbekannter Film', item.id, posterPath);
          }

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

  // Handle item click
  const handleItemClick = useCallback(
    (item: any) => {
      const filterState = {
        activeTab,
        activeCategory,
        selectedGenre,
        showFilters,
        searchQuery,
        showSearch
      };
      sessionStorage.setItem('discoverFilters', JSON.stringify(filterState));
      sessionStorage.setItem('comingFromDetail', 'true');
      navigate(item.type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
    },
    [navigate, activeTab, activeCategory, selectedGenre, showFilters, searchQuery, showSearch]
  );

  // Memoize genres
  const genres = useMemo(
    () => (activeTab === 'series' ? genreIdMapForSeries : genreIdMapForMovies),
    [activeTab]
  );


  return (
    <div
      style={{
        height: '100vh',
        background: currentTheme.background.default,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Fixed Header and Controls */}
      <div
        data-header="discover-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: currentTheme.background.default,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
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
              {!showSearch && activeCategory !== 'recommendations' && (
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
            onClick={() => {
              setActiveTab('series');
              setShowSearch(false);
            }}
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
            onClick={() => {
              setActiveTab('movies');
              setShowSearch(false);
            }}
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
              gridTemplateColumns: 'repeat(5, 1fr)',
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

            <button
              onClick={() => setActiveCategory('recommendations')}
              style={{
                padding: '8px 4px',
                background:
                  activeCategory === 'recommendations'
                    ? `${currentTheme.status.success}33`
                    : `${currentTheme.text.primary}08`,
                border:
                  activeCategory === 'recommendations'
                    ? `1px solid ${currentTheme.status.success}66`
                    : `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: activeCategory === 'recommendations' ? currentTheme.status.success : currentTheme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Recommend style={{ fontSize: '18px' }} />
              <span style={{ fontSize: '10px', fontWeight: 600 }}>Für dich</span>
            </button>
          </div>
        )}

        {/* Genre Filter Dropdown */}
        {showFilters && !showSearch && activeCategory !== 'recommendations' && (
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
      </div>

      {/* Scrollable Content Area */}
      <div
        className="mobile-discover-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Spacer for fixed header */}
        <div style={{ height: `${headerHeight}px` }} />

        <div style={{ padding: '16px' }}>
        {activeCategory === 'recommendations' ? (
          recommendationsLoading && recommendations.length === 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '40px',
              }}
            >
              <div style={{ color: currentTheme.text.muted }}>Lade Empfehlungen...</div>
            </div>
          ) : !recommendationsLoading && recommendations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <Recommend
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  opacity: 0.3,
                }}
              />
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                {seriesList.length === 0 && movieList.length === 0
                  ? 'Keine Empfehlungen verfügbar'
                  : 'Keine Empfehlungen verfügbar'}
              </p>
              <p style={{ fontSize: '13px' }}>
                {seriesList.length === 0 && movieList.length === 0
                  ? 'Füge erst Serien oder Filme zu deiner Liste hinzu'
                  : ''}
              </p>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: currentTheme.text.muted,
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                Basierend auf deiner Liste
              </p>
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
                {recommendations.map((item) => (
                  <ItemCard
                    key={`rec-${item.type}-${item.id}`}
                    item={item}
                    onItemClick={handleItemClick}
                    onAddToList={addToList}
                    addingItem={addingItem}
                    currentTheme={currentTheme}
                    isDesktop={isDesktop}
                  />
                ))}
              </div>
            </div>
          )
        ) : showSearch ? (
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
                  <ItemCard
                    key={`search-${item.type}-${item.id}`}
                    item={item}
                    onItemClick={handleItemClick}
                    onAddToList={addToList}
                    addingItem={addingItem}
                    currentTheme={currentTheme}
                    isDesktop={isDesktop}
                  />
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
              <ItemCard
                key={`${item.type}-${item.id}`}
                item={item}
                onItemClick={handleItemClick}
                onAddToList={addToList}
                addingItem={addingItem}
                currentTheme={currentTheme}
                isDesktop={isDesktop}
              />
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {((loading && !showSearch && activeCategory !== 'recommendations') ||
          (recommendationsLoading && activeCategory === 'recommendations' && recommendations.length > 0)) && (
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

        {/* Bottom padding */}
        <div style={{ height: '80px' }} />
        </div>
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