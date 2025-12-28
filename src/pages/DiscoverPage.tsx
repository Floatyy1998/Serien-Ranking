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
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { genreIdMapForMovies, genreIdMapForSeries } from '../config/menuItems';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { logMovieAdded, logSeriesAdded } from '../features/badges/minimalActivityLogger';
import { Dialog } from '../components/Dialog';

// Premium memoized item card
const ItemCard = memo(({
  item,
  onItemClick,
  onAddToList,
  addingItem,
  currentTheme,
  isDesktop,
  index
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      style={{ position: 'relative' }}
    >
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => onItemClick(item)}
        style={{
          width: '100%',
          aspectRatio: '2/3',
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          marginBottom: '10px',
          cursor: 'pointer',
          boxShadow: `0 6px 20px ${currentTheme.background.default}80`,
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

        {/* Premium gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {item.vote_average > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '5px 10px',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(20, 20, 40, 0.9))',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Star
              style={{
                fontSize: '13px',
                color: '#ffc107',
              }}
            />
            {item.vote_average.toFixed(1)}
          </div>
        )}

        {!item.inList && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => onAddToList(item, e)}
            disabled={addingItem === `${item.type}-${item.id}`}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '34px',
              height: '34px',
              background: addingItem === `${item.type}-${item.id}`
                ? 'rgba(255, 255, 255, 0.1)'
                : `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: addingItem === `${item.type}-${item.id}` ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
              boxShadow: `0 4px 12px ${currentTheme.primary}50`,
            }}
          >
            <Add
              style={{
                fontSize: '20px',
                color: 'white',
                opacity: addingItem === `${item.type}-${item.id}` ? 0.5 : 1,
              }}
            />
          </motion.button>
        )}
      </motion.div>

      <h4
        style={{
          fontSize: isDesktop ? '14px' : '13px',
          fontWeight: 700,
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

      <p
        style={{
          fontSize: '12px',
          color: currentTheme.text.muted,
          margin: '4px 0 0 0',
          fontWeight: 500,
        }}
      >
        {item.release_date || item.first_air_date
          ? new Date(item.release_date || item.first_air_date).getFullYear()
          : 'TBA'}
      </p>
    </motion.div>
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
  const [headerHeight, setHeaderHeight] = useState(220);

  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const showSearchRef = useRef(showSearch);
  const recommendationsLoadingRef = useRef(recommendationsLoading);
  const recommendationsHasMoreRef = useRef(recommendationsHasMore);
  const activeCategoryRef = useRef(activeCategory);

  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { showSearchRef.current = showSearch; }, [showSearch]);
  useEffect(() => { recommendationsLoadingRef.current = recommendationsLoading; }, [recommendationsLoading]);
  useEffect(() => { recommendationsHasMoreRef.current = recommendationsHasMore; }, [recommendationsHasMore]);
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerElement = document.querySelector('[data-header="discover-header"]');
      if (headerElement) {
        const height = headerElement.getBoundingClientRect().height;
        setHeaderHeight(height + 10);
      }
    };

    updateHeaderHeight();
    const handleResize = () => {
      updateHeaderHeight();
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    const timeoutId = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [showSearch, showFilters, activeTab, activeCategory]);

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

      if (reset) {
        setUsedRecommendationSources(new Set());
        setRecommendations([]);
        setRecommendationsHasMore(true);
      }

      const currentUsedSources = reset ? new Set<string>() : new Set(usedRecommendationSources);
      const availableItems = userItems.filter(item => !currentUsedSources.has(item.id.toString()));

      if (availableItems.length === 0) {
        setRecommendationsHasMore(false);
        setRecommendationsLoading(false);
        return;
      }

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

        currentUsedSources.add(item.id.toString());
      }

      const shuffledRecommendations = allRecommendations
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);

      setUsedRecommendationSources(currentUsedSources);

      if (reset) {
        setRecommendations(shuffledRecommendations);
      } else {
        setRecommendations(prev => [...prev, ...shuffledRecommendations]);
      }

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

  useEffect(() => {
    if (activeCategory === 'recommendations') {
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

  useEffect(() => {
    const scrollContainer = document.querySelector('.mobile-discover-container');
    if (scrollContainer) {
      const scrollHandler = () => {
        if (!scrollContainer) return;

        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        if (distanceFromBottom < 500) {
          if (activeCategoryRef.current === 'recommendations') {
            if (recommendationsHasMoreRef.current && !recommendationsLoadingRef.current) {
              fetchRecommendations(false);
            }
          } else if (hasMoreRef.current && !loadingRef.current && !showSearchRef.current) {
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showSearch) {
        searchItems(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSearch, searchItems]);

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

  const genres = useMemo(
    () => (activeTab === 'series' ? genreIdMapForSeries : genreIdMapForMovies),
    [activeTab]
  );

  // Category configuration for premium styling
  const categories = [
    { id: 'trending', label: 'Trend', icon: TrendingUp, color: currentTheme.primary },
    { id: 'popular', label: 'Beliebt', icon: Whatshot, color: currentTheme.status.error },
    { id: 'top_rated', label: 'Top', icon: Star, color: currentTheme.status.warning },
    { id: 'upcoming', label: activeTab === 'movies' ? 'Neu' : 'Läuft', icon: NewReleases, color: currentTheme.status.success },
    { id: 'recommendations', label: 'Für dich', icon: Recommend, color: '#8b5cf6' },
  ] as const;

  return (
    <div
      style={{
        height: '100vh',
        background: currentTheme.background.default,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Decorative background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(ellipse at 20% 0%, ${currentTheme.primary}12 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 100%, #8b5cf612 0%, transparent 50%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Fixed Header and Controls */}
      <div
        data-header="discover-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}f0`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}20 0%, transparent 100%)`,
          }}
        >
          {/* Premium Header */}
          <header
            style={{
              padding: '14px 20px',
              paddingTop: 'calc(14px + env(safe-area-inset-top))',
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
                  fontSize: '24px',
                  fontWeight: 800,
                  margin: 0,
                  background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Entdecken
              </h1>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!showSearch && activeCategory !== 'recommendations' && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                      padding: '10px',
                      background: selectedGenre
                        ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                        : currentTheme.background.surface,
                      border: selectedGenre ? 'none' : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '12px',
                      color: selectedGenre ? '#fff' : currentTheme.text.primary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: selectedGenre ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                    }}
                    title={selectedGenre ? genres.find((g) => g.id === selectedGenre)?.name : 'Genre Filter'}
                  >
                    <FilterList style={{ fontSize: '20px' }} />
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowSearch(!showSearch);
                    if (!showSearch) {
                      setShowFilters(false);
                    }
                  }}
                  style={{
                    padding: '10px',
                    background: showSearch
                      ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                      : currentTheme.background.surface,
                    border: showSearch ? 'none' : `1px solid ${currentTheme.border.default}`,
                    borderRadius: '12px',
                    color: showSearch ? '#fff' : currentTheme.text.primary,
                    cursor: 'pointer',
                    boxShadow: showSearch ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  <Search style={{ fontSize: '20px' }} />
                </motion.button>
              </div>
            </div>
          </header>

          {/* Premium Search Input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '0 20px 12px 20px', overflow: 'hidden' }}
              >
                <input
                  type="text"
                  placeholder={`${activeTab === 'series' ? 'Serien' : 'Filme'} suchen...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: currentTheme.background.surface,
                    border: `1px solid ${currentTheme.border.default}`,
                    borderRadius: '14px',
                    color: currentTheme.text.primary,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Tab Switcher */}
          <div
            style={{
              display: 'flex',
              padding: '8px 20px',
              gap: '10px',
            }}
          >
            {[
              { id: 'series', label: 'Serien', icon: CalendarToday },
              { id: 'movies', label: 'Filme', icon: MovieIcon },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab(tab.id as 'series' | 'movies');
                    setShowSearch(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: isActive
                      ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                      : currentTheme.background.surface,
                    border: isActive ? 'none' : `1px solid ${currentTheme.border.default}`,
                    borderRadius: '14px',
                    color: isActive ? '#fff' : currentTheme.text.primary,
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: isActive ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon style={{ fontSize: '18px' }} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          {/* Premium Categories */}
          {!showSearch && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                padding: '8px 20px 14px 20px',
              }}
            >
              {categories.map(cat => {
                const isActive = activeCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '10px 4px',
                      background: isActive
                        ? `linear-gradient(135deg, ${cat.color}30, ${cat.color}10)`
                        : currentTheme.background.surface,
                      border: isActive
                        ? `1px solid ${cat.color}50`
                        : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '12px',
                      color: isActive ? cat.color : currentTheme.text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon style={{ fontSize: '20px' }} />
                    <span style={{ fontSize: '10px', fontWeight: 700 }}>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Premium Genre Filter Dropdown */}
          <AnimatePresence>
            {showFilters && !showSearch && activeCategory !== 'recommendations' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '0 20px 14px 20px', overflow: 'hidden' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '12px',
                    background: currentTheme.background.surface,
                    borderRadius: '14px',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedGenre(null);
                      setShowFilters(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      background: !selectedGenre
                        ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.primary}10)`
                        : 'transparent',
                      border: !selectedGenre
                        ? `1px solid ${currentTheme.primary}50`
                        : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '10px',
                      color: !selectedGenre ? currentTheme.primary : currentTheme.text.primary,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    Alle
                  </motion.button>
                  {genres.map((genre) => (
                    <motion.button
                      key={genre.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedGenre(genre.id);
                        setShowFilters(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        background:
                          selectedGenre === genre.id
                            ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.primary}10)`
                            : 'transparent',
                        border:
                          selectedGenre === genre.id
                            ? `1px solid ${currentTheme.primary}50`
                            : `1px solid ${currentTheme.border.default}`,
                        borderRadius: '10px',
                        color: selectedGenre === genre.id ? currentTheme.primary : currentTheme.text.primary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {genre.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

        <div style={{ padding: '16px 20px' }}>
          {activeCategory === 'recommendations' ? (
            recommendationsLoading && recommendations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '60px 20px',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: `3px solid ${currentTheme.border.default}`,
                    borderTopColor: currentTheme.primary,
                    marginBottom: '16px',
                  }}
                />
                <p style={{ color: currentTheme.text.muted, fontSize: '14px' }}>
                  Lade Empfehlungen...
                </p>
              </motion.div>
            ) : !recommendationsLoading && recommendations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: currentTheme.background.surface,
                  borderRadius: '20px',
                  border: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <Recommend
                  style={{
                    fontSize: '56px',
                    marginBottom: '16px',
                    color: currentTheme.text.muted,
                  }}
                />
                <p style={{ fontSize: '16px', color: currentTheme.text.secondary, marginBottom: '8px', fontWeight: 600 }}>
                  Keine Empfehlungen verfügbar
                </p>
                <p style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                  {seriesList.length === 0 && movieList.length === 0
                    ? 'Füge erst Serien oder Filme zu deiner Liste hinzu'
                    : ''}
                </p>
              </motion.div>
            ) : (
              <div>
                <p
                  style={{
                    fontSize: '13px',
                    color: currentTheme.text.muted,
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontWeight: 500,
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
                  {recommendations.map((item, index) => (
                    <ItemCard
                      key={`rec-${item.type}-${item.id}`}
                      item={item}
                      onItemClick={handleItemClick}
                      onAddToList={addToList}
                      addingItem={addingItem}
                      currentTheme={currentTheme}
                      isDesktop={isDesktop}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )
          ) : showSearch ? (
            <div>
              {searchLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '60px 20px',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      border: `3px solid ${currentTheme.border.default}`,
                      borderTopColor: currentTheme.primary,
                      marginBottom: '16px',
                    }}
                  />
                  <p style={{ color: currentTheme.text.muted, fontSize: '14px' }}>
                    Suche läuft...
                  </p>
                </motion.div>
              ) : searchResults.length === 0 && searchQuery.trim() ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: currentTheme.background.surface,
                    borderRadius: '20px',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  <Search
                    style={{
                      fontSize: '56px',
                      marginBottom: '16px',
                      color: currentTheme.text.muted,
                    }}
                  />
                  <p style={{ color: currentTheme.text.secondary, fontSize: '15px' }}>
                    Keine Ergebnisse für "{searchQuery}"
                  </p>
                </motion.div>
              ) : searchResults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: currentTheme.background.surface,
                    borderRadius: '20px',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  <Search
                    style={{
                      fontSize: '56px',
                      marginBottom: '16px',
                      color: currentTheme.text.muted,
                    }}
                  />
                  <p style={{ color: currentTheme.text.secondary, fontSize: '15px' }}>
                    Gib einen Suchbegriff ein...
                  </p>
                </motion.div>
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
                  {searchResults.map((item, index) => (
                    <ItemCard
                      key={`search-${item.type}-${item.id}`}
                      item={item}
                      onItemClick={handleItemClick}
                      onAddToList={addToList}
                      addingItem={addingItem}
                      currentTheme={currentTheme}
                      isDesktop={isDesktop}
                      index={index}
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
              {results.map((item, index) => (
                <ItemCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onItemClick={handleItemClick}
                  onAddToList={addToList}
                  addingItem={addingItem}
                  currentTheme={currentTheme}
                  isDesktop={isDesktop}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Premium Loading indicator */}
          {((loading && !showSearch && activeCategory !== 'recommendations') ||
            (recommendationsLoading && activeCategory === 'recommendations' && recommendations.length > 0)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '30px',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: `3px solid ${currentTheme.border.default}`,
                  borderTopColor: currentTheme.primary,
                }}
              />
            </motion.div>
          )}

          {/* Bottom padding */}
          <div style={{ height: '80px' }} />
        </div>
      </div>

      {/* Premium Snackbar for success feedback */}
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
              background: `linear-gradient(135deg, ${currentTheme.status.success}, #10b981)`,
              color: 'white',
              padding: '14px 24px',
              borderRadius: '16px',
              boxShadow: `0 8px 24px ${currentTheme.status.success}50`,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: 'calc(100% - 40px)',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Check style={{ fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
