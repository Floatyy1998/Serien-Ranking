/**
 * RatingsPage - Premium Ratings Collection
 * Browse and filter your rated series and movies
 */

import { Movie as MovieIcon, Star, Tv as TvIcon, WatchLater } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { calculateOverallRating } from '../lib/rating/rating';
import { QuickFilter } from '../components/QuickFilter';

export const RatingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useAuth();
  const user = authContext?.user;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme, getMobilePageBackground } = useTheme();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize all states from URL params
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>(() => {
    return searchParams.get('tab') === 'movies' ? 'movies' : 'series';
  });

  const [sortOption, setSortOption] = useState(() => {
    return searchParams.get('sort') || 'rating-desc';
  });

  const [selectedGenre, setSelectedGenre] = useState(() => {
    return searchParams.get('genre') || 'Alle';
  });

  const [selectedProvider, setSelectedProvider] = useState<string | null>(() => {
    return searchParams.get('provider') || null;
  });

  const [quickFilter, setQuickFilter] = useState<string | null>(() => {
    return searchParams.get('filter') || null;
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return searchParams.get('search') || '';
  });

  const [, startTransition] = useTransition();
  const isUpdatingFromQuickFilter = useRef(false);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Update URL when any filter changes
  const updateURL = useCallback((updates: {
    tab?: string;
    sort?: string;
    genre?: string;
    provider?: string | null;
    filter?: string | null;
    search?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams);

    if (updates.tab !== undefined) {
      if (updates.tab === 'movies') newParams.set('tab', 'movies');
      else newParams.delete('tab');
    }
    if (updates.sort !== undefined) {
      if (updates.sort !== 'rating-desc') newParams.set('sort', updates.sort);
      else newParams.delete('sort');
    }
    if (updates.genre !== undefined) {
      if (updates.genre && updates.genre !== 'Alle') newParams.set('genre', updates.genre);
      else newParams.delete('genre');
    }
    if (updates.provider !== undefined) {
      if (updates.provider) newParams.set('provider', updates.provider);
      else newParams.delete('provider');
    }
    if (updates.filter !== undefined) {
      if (updates.filter) newParams.set('filter', updates.filter);
      else newParams.delete('filter');
    }
    if (updates.search !== undefined) {
      if (updates.search) newParams.set('search', updates.search);
      else newParams.delete('search');
    }

    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle browser back/forward navigation
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

  const filters: {
    sortBy?: string;
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
  } = {
    sortBy: sortOption,
    genre: selectedGenre !== 'Alle' ? selectedGenre : undefined,
    provider: selectedProvider || undefined,
    quickFilter: quickFilter || undefined,
    search: searchQuery || undefined
  };

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

    if (newFilters.sortBy !== undefined) {
      if (newFilters.sortBy && newFilters.sortBy !== 'rating-desc') {
        newParams.set('sort', newFilters.sortBy);
      } else {
        newParams.delete('sort');
      }
    }
    if (newFilters.genre !== undefined) {
      if (newFilters.genre && newFilters.genre !== 'Alle') {
        newParams.set('genre', newFilters.genre);
      } else {
        newParams.delete('genre');
      }
    }
    if (newFilters.provider !== undefined) {
      if (newFilters.provider) {
        newParams.set('provider', newFilters.provider);
      } else {
        newParams.delete('provider');
      }
    }
    if (newFilters.quickFilter !== undefined) {
      if (newFilters.quickFilter) {
        newParams.set('filter', newFilters.quickFilter);
      } else {
        newParams.delete('filter');
      }
    }
    if (newFilters.search !== undefined) {
      if (newFilters.search) {
        newParams.set('search', newFilters.search);
      } else {
        newParams.delete('search');
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
  }, [setSearchParams, startTransition]);

  // Save scroll position before navigating
  const handleItemClick = (item: any, type: 'series' | 'movie') => {
    let position = 0;
    let scrollSource = '';

    let element = scrollRef.current?.parentElement;
    let parentIndex = 0;
    while (element && parentIndex < 5) {
      if (element.scrollTop > 0) {
        position = element.scrollTop;
        scrollSource = `parent-${parentIndex}`;
        break;
      }
      element = element.parentElement;
      parentIndex++;
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
      try {
        const scrollKey = `ratingsPageScroll_${activeTab}`;
        sessionStorage.setItem(scrollKey, position.toString());
        sessionStorage.setItem(`ratingsPageScrollSource_${activeTab}`, scrollSource);
        sessionStorage.setItem('shouldRestoreRatingsScroll', 'true');
      } catch (error) {
        console.error('Error saving scroll position:', error);
      }
    }
    if (type === 'series') {
      navigate(`/series/${item.id}`);
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Get ALL series
  const ratedSeries = useMemo(() => {
    let filtered = seriesList;

    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((series) => {
        const genres = series.genre?.genres || [];
        if (Array.isArray(genres)) {
          return genres.some((g: string) => g.toLowerCase() === filters.genre!.toLowerCase());
        }
        return false;
      });
    }

    if (filters.provider && filters.provider !== 'All') {
      filtered = filtered.filter((series) => {
        if (series.provider?.provider && Array.isArray(series.provider.provider)) {
          return series.provider.provider.some((p: any) => p.name === filters.provider);
        }
        return false;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((series) => series.title?.toLowerCase().includes(searchLower));
    }

    // Apply quick filters
    if (filters.quickFilter === 'watchlist') {
      filtered = filtered.filter((s) => s.watchlist === true);
    } else if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculateOverallRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      filtered = filtered.filter((s) => {
        const series = s as any;
        if (!series.seasons) return false;

        const today = new Date();
        let totalAiredEpisodes = 0;
        let watchedEpisodes = 0;

        series.seasons.forEach((season: any) => {
          if (season.episodes) {
            season.episodes.forEach((ep: any) => {
              if (ep.air_date) {
                const airDate = new Date(ep.air_date);
                if (airDate <= today) {
                  totalAiredEpisodes++;
                  if (ep.watched) watchedEpisodes++;
                }
              }
            });
          }
        });

        return watchedEpisodes > 0 && watchedEpisodes < totalAiredEpisodes;
      });
    } else if (filters.quickFilter === 'not-started') {
      filtered = filtered.filter((s) => {
        const series = s as any;
        if (!series.seasons) return true;

        let watchedEpisodes = 0;
        const today = new Date();

        series.seasons.forEach((season: any) => {
          if (season.episodes) {
            season.episodes.forEach((ep: any) => {
              if (ep.air_date) {
                const airDate = new Date(ep.air_date);
                if (airDate <= today && ep.watched) {
                  watchedEpisodes++;
                }
              }
            });
          }
        });

        return watchedEpisodes === 0;
      });
    } else if (filters.quickFilter === 'ongoing') {
      filtered = filtered.filter((s) => {
        const status = s.status?.toLowerCase();
        return status === 'returning series' || status === 'ongoing' || (!status && s.production?.production === true);
      });
    }

    // Apply sorting
    const sortBy =
      filters.quickFilter === 'ongoing' ? 'rating-desc' :
      filters.quickFilter === 'recently-added' ? 'date-desc' :
      filters.sortBy || 'rating-desc';

    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateOverallRating(a));
      const ratingB = parseFloat(calculateOverallRating(b));

      switch (sortBy) {
        case 'rating-desc': return ratingB - ratingA;
        case 'rating-asc': return ratingA - ratingB;
        case 'name-asc': return (a.title || '').localeCompare(b.title || '');
        case 'name-desc': return (b.title || '').localeCompare(a.title || '');
        case 'date-desc': return Number(b.nmr) - Number(a.nmr);
        default: return ratingB - ratingA;
      }
    });

    return filtered;
  }, [seriesList, filters.sortBy, filters.genre, filters.provider, filters.quickFilter, filters.search]);

  // Get ALL movies
  const ratedMovies = useMemo(() => {
    let filtered = movieList;

    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((movie) => {
        const genres = movie.genre?.genres || [];
        if (Array.isArray(genres)) {
          return genres.some((g: string) => g.toLowerCase() === filters.genre!.toLowerCase());
        }
        return false;
      });
    }

    if (filters.provider && filters.provider !== 'All') {
      filtered = filtered.filter((movie) => {
        if (movie.provider?.provider && Array.isArray(movie.provider.provider)) {
          return movie.provider.provider.some((p: any) => p.name === filters.provider);
        }
        return false;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((movie) => movie.title?.toLowerCase().includes(searchLower));
    }

    if (filters.quickFilter === 'watchlist') {
      filtered = filtered.filter((m) => m.watchlist === true);
    } else if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculateOverallRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      filtered = [];
    } else if (filters.quickFilter === 'not-started') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculateOverallRating(m));
        return isNaN(rating) || rating === 0;
      });
    }

    const sortBy =
      filters.quickFilter === 'ongoing' ? 'rating-desc' :
      filters.quickFilter === 'recently-added' ? 'date-desc' :
      filters.sortBy || 'rating-desc';

    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateOverallRating(a));
      const ratingB = parseFloat(calculateOverallRating(b));

      switch (sortBy) {
        case 'rating-desc': return ratingB - ratingA;
        case 'rating-asc': return ratingA - ratingB;
        case 'name-asc': return (a.title || '').localeCompare(b.title || '');
        case 'name-desc': return (b.title || '').localeCompare(a.title || '');
        case 'date-desc': return Number(b.nmr) - Number(a.nmr);
        default: return ratingB - ratingA;
      }
    });

    return filtered;
  }, [movieList, filters.sortBy, filters.genre, filters.provider, filters.quickFilter, filters.search]);

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  // Restore scroll position
  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('shouldRestoreRatingsScroll');

    if (shouldRestore === 'true' && currentItems.length > 0) {
      sessionStorage.removeItem('shouldRestoreRatingsScroll');

      let tabForScroll = activeTab;
      try {
        const stored = sessionStorage.getItem('ratingsPageState');
        if (stored) {
          const parsed = JSON.parse(stored);
          tabForScroll = parsed.activeTab || activeTab;
        }
      } catch (error) {
        console.error('Error loading tab for scroll:', error);
      }

      const scrollKey = `ratingsPageScroll_${tabForScroll}`;
      const position = sessionStorage.getItem(scrollKey);
      const scrollSource = sessionStorage.getItem(`ratingsPageScrollSource_${tabForScroll}`);

      if (position) {
        const scrollTop = parseInt(position, 10);
        if (scrollTop > 0) {
          const restoreScroll = () => {
            if (scrollSource && scrollSource.startsWith('parent-')) {
              const parentIndex = parseInt(scrollSource.split('-')[1], 10);
              let element = scrollRef.current?.parentElement;
              for (let i = 0; i < parentIndex && element; i++) {
                element = element.parentElement;
              }
              if (element) {
                if (element.scrollHeight > element.clientHeight) {
                  element.scrollTop = scrollTop;
                  setTimeout(() => {
                    if (element && element.scrollTop < scrollTop * 0.8) {
                      element.scrollTop = scrollTop;
                    }
                  }, 50);
                } else {
                  setTimeout(restoreScroll, 200);
                }
              }
            }
          };
          setTimeout(restoreScroll, 500);
        }
      }
    }
  }, [activeTab, currentItems.length]);

  const itemsWithRating = currentItems.filter((item) => {
    const rating = parseFloat(calculateOverallRating(item));
    return !isNaN(rating) && rating > 0;
  });

  const averageRating =
    itemsWithRating.length > 0
      ? itemsWithRating.reduce((acc, item) => acc + parseFloat(calculateOverallRating(item)), 0) / itemsWithRating.length
      : 0;

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100%',
          background: getMobilePageBackground(),
          color: currentTheme.text.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, #fbbf2430, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.primary}20, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}ee`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Header Content */}
        <div
          style={{
            padding: '20px',
            paddingTop: 'calc(20px + env(safe-area-inset-top))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: `linear-gradient(135deg, ${currentTheme.text.primary}, #fbbf24)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <Star style={{ fontSize: '28px', color: '#fbbf24', WebkitTextFillColor: 'initial' }} />
              Meine Bewertungen
            </h1>
          </div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: `${currentTheme.background.surface}`,
                border: `1px solid ${currentTheme.border.default}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 700 }}>{itemsWithRating.length}</span>
              <span style={{ fontSize: '13px', color: currentTheme.text.muted }}>bewertet</span>
            </div>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: `#fbbf2415`,
                border: `1px solid #fbbf2430`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Star style={{ fontSize: 18, color: '#fbbf24' }} />
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>
                {averageRating.toFixed(1)}
              </span>
              <span style={{ fontSize: '13px', color: currentTheme.text.muted }}>Durchschnitt</span>
            </div>
          </motion.div>
        </div>

        {/* Premium Tab Navigation */}
        <div style={{ padding: '0 20px 16px' }}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '4px',
              background: currentTheme.background.surface,
              borderRadius: '16px',
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab('series');
                updateURL({ tab: 'series' });
              }}
              style={{
                flex: 1,
                padding: '14px',
                background: activeTab === 'series'
                  ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                  : 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: activeTab === 'series' ? 'white' : currentTheme.text.secondary,
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeTab === 'series' ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <TvIcon style={{ fontSize: '20px' }} />
              Serien
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: activeTab === 'series' ? 'rgba(255,255,255,0.2)' : `${currentTheme.text.muted}20`,
                  fontSize: '12px',
                }}
              >
                {ratedSeries.length}
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab('movies');
                updateURL({ tab: 'movies' });
              }}
              style={{
                flex: 1,
                padding: '14px',
                background: activeTab === 'movies'
                  ? `linear-gradient(135deg, #f59e0b, #ef4444)`
                  : 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: activeTab === 'movies' ? 'white' : currentTheme.text.secondary,
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeTab === 'movies' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <MovieIcon style={{ fontSize: '20px' }} />
              Filme
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: activeTab === 'movies' ? 'rgba(255,255,255,0.2)' : `${currentTheme.text.muted}20`,
                  fontSize: '12px',
                }}
              >
                {ratedMovies.length}
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div style={{ padding: '0 20px', flex: 1, position: 'relative', zIndex: 1 }}>
        {currentItems.length === 0 ? (
          <motion.div
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
              <Star style={{ fontSize: '48px', color: currentTheme.text.muted }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>
              Noch keine {activeTab === 'series' ? 'Serien' : 'Filme'}
            </h3>
            <p style={{ margin: 0, color: currentTheme.text.muted, fontSize: '15px' }}>
              {quickFilter ? 'Keine Ergebnisse für diesen Filter' : `Bewerte ${activeTab === 'series' ? 'Serien' : 'Filme'} um sie hier zu sehen!`}
            </p>
          </motion.div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                window.innerWidth >= 1200
                  ? 'repeat(8, 1fr)'
                  : window.innerWidth >= 768
                    ? 'repeat(5, 1fr)'
                    : 'repeat(auto-fill, minmax(105px, 1fr))',
              gap: '12px',
            }}
          >
            <AnimatePresence mode="popLayout">
              {currentItems.map((item, index) => {
                const rating = parseFloat(calculateOverallRating(item));
                const isMovie = 'release_date' in item;

                let progress = 0;
                if (!isMovie) {
                  const series = item as any;
                  if (series.seasons) {
                    const today = new Date();
                    let totalAiredEpisodes = 0;
                    let watchedEpisodes = 0;

                    series.seasons.forEach((season: any) => {
                      if (season.episodes) {
                        season.episodes.forEach((ep: any) => {
                          if (ep.air_date) {
                            const airDate = new Date(ep.air_date);
                            if (airDate <= today) {
                              totalAiredEpisodes++;
                              if (ep.watched) watchedEpisodes++;
                            }
                          }
                        });
                      }
                    });

                    progress = totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;
                  }
                }

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleItemClick(item, isMovie ? 'movie' : 'series')}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      <img
                        src={getImageUrl(item.poster)}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('data:image/svg')) {
                            target.src = `data:image/svg+xml;base64,${btoa(`
                              <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100%" height="100%" fill="${currentTheme.background.surface}"/>
                                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${currentTheme.text.muted}" font-family="Arial" font-size="14">
                                  Kein Poster
                                </text>
                              </svg>
                            `)}`;
                          }
                        }}
                        style={{
                          width: '100%',
                          aspectRatio: '2/3',
                          objectFit: 'cover',
                          background: currentTheme.background.surface,
                        }}
                      />

                      {/* Provider Badges */}
                      {item.provider?.provider && item.provider.provider.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            display: 'flex',
                            gap: '3px',
                          }}
                        >
                          {Array.from(new Set(item.provider.provider.map((p: any) => p.name)))
                            .slice(0, 2)
                            .map((name) => {
                              const provider = item.provider?.provider.find((p: any) => p.name === name);
                              return provider ? (
                                <div
                                  key={name as string}
                                  style={{
                                    background: `${currentTheme.background.default}dd`,
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '6px',
                                    padding: '2px',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <img
                                    src={provider.logo}
                                    alt={provider.name}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      objectFit: 'cover',
                                    }}
                                  />
                                </div>
                              ) : null;
                            })}
                        </div>
                      )}

                      {/* Rating Badge */}
                      {!isNaN(rating) && rating > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: `linear-gradient(135deg, #1a1a1aee, #2a2a2aee)`,
                            backdropFilter: 'blur(8px)',
                            borderRadius: '10px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Star style={{ fontSize: '12px', color: '#fbbf24' }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Watchlist Badge */}
                      {item.watchlist === true && (
                        <div
                          style={{
                            position: 'absolute',
                            top: (!isNaN(rating) && rating > 0) ? '36px' : '6px',
                            right: '6px',
                            background: `${currentTheme.status.info}dd`,
                            backdropFilter: 'blur(8px)',
                            borderRadius: '8px',
                            padding: '3px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <WatchLater style={{ fontSize: '10px', color: '#fff' }} />
                        </div>
                      )}

                      {/* Progress Bar */}
                      {!isMovie && progress > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'rgba(0,0,0,0.5)',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: Math.min(index * 0.02, 0.5) }}
                            style={{
                              height: '100%',
                              background: progress === 100
                                ? `linear-gradient(90deg, ${currentTheme.status.success}, #10b981)`
                                : `linear-gradient(90deg, ${currentTheme.primary}, #8b5cf6)`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: currentTheme.text.primary,
                        margin: '8px 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </h4>

                    {!isMovie && progress > 0 && (
                      <p
                        style={{
                          fontSize: '11px',
                          color: progress === 100 ? currentTheme.status.success : currentTheme.primary,
                          margin: '2px 0 0 0',
                          fontWeight: 600,
                        }}
                      >
                        {progress === 100 ? 'Fertig' : `${Math.round(progress)}%`}
                      </p>
                    )}

                    {isMovie && item.release_date && (
                      <p style={{ fontSize: '11px', color: currentTheme.text.muted, margin: '2px 0 0 0' }}>
                        {item.release_date.split('-')[0]}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div style={{ gridColumn: '1 / -1', height: '100px' }} />
          </div>
        )}
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
