import { Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { calculateOverallRating } from '../lib/rating/rating';
import { QuickFilter } from '../components/QuickFilter';

// TMDB Genre IDs mapping (unused but kept for reference)
// const TMDB_GENRE_MAP: { [key: number]: string } = { ... };

export const RatingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { currentTheme, getMobilePageBackground, getMobileHeaderStyle } = useTheme();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Simple local state management
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>(() => {
    try {
      const stored = sessionStorage.getItem('ratingsPageState');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.activeTab || 'series';
      }
    } catch (error) {
      console.error('Error loading activeTab:', error);
    }
    return 'series';
  });

  const [sortOption, setSortOption] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ratingsPageState');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.sortOption || 'rating-desc';
      }
    } catch (error) {
      console.error('Error loading sortOption:', error);
    }
    return 'rating-desc';
  });

  const [selectedGenre, setSelectedGenre] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ratingsPageState');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.selectedGenre || 'Alle';
      }
    } catch (error) {
      console.error('Error loading selectedGenre:', error);
    }
    return 'Alle';
  });

  const [selectedProvider, setSelectedProvider] = useState<string | null>(() => {
    try {
      const stored = sessionStorage.getItem('ratingsPageState');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.selectedProvider || null;
      }
    } catch (error) {
      console.error('Error loading selectedProvider:', error);
    }
    return null;
  });

  const [showUnrated, setShowUnrated] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ratingsPageState');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.showUnrated || false;
      }
    } catch (error) {
      console.error('Error loading showUnrated:', error);
    }
    return false;
  });

  // Save state to sessionStorage whenever any state changes
  useEffect(() => {
    const state = {
      activeTab,
      sortOption,
      selectedGenre,
      selectedProvider,
      showUnrated
    };
    try {
      sessionStorage.setItem('ratingsPageState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [activeTab, sortOption, selectedGenre, selectedProvider, showUnrated]);

  // Check for tab parameter in URL
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');

  // Initialize filters from state
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
    quickFilter: showUnrated ? 'unrated' : undefined,
    search: undefined
  };

  // Set tab from URL parameter only once on mount
  useEffect(() => {
    if (tabParam === 'movies') {
      setActiveTab('movies');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Restore scroll position only when coming back from detail pages
  useEffect(() => {
    // Check if we should restore scroll position
    const shouldRestore = sessionStorage.getItem('shouldRestoreRatingsScroll');

    if (shouldRestore === 'true') {
      // Clear the flag immediately
      sessionStorage.removeItem('shouldRestoreRatingsScroll');

      // Delay to ensure DOM is ready
      setTimeout(() => {
        try {
          // Get the current tab from sessionStorage directly (not from state)
          const storedState = sessionStorage.getItem('ratingsPageState');
          let currentTab = 'series'; // default
          if (storedState) {
            const parsed = JSON.parse(storedState);
            currentTab = parsed.activeTab || 'series';
          }

          // Use tab-specific scroll position
          const scrollKey = `ratingsPageScroll_${currentTab}`;
          const position = sessionStorage.getItem(scrollKey);
          if (position && scrollRef.current) {
            const scrollTop = parseInt(position, 10);
            if (scrollTop > 0) {
              scrollRef.current.scrollTop = scrollTop;
            }
          }
        } catch (error) {
          console.error('Error restoring scroll position:', error);
        }
      }, 300); // Increased delay to ensure DOM is fully ready
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save scroll position before navigating away
  const handleItemClick = (item: any, type: 'series' | 'movie') => {
    if (scrollRef.current) {
      const position = scrollRef.current.scrollTop;
      try {
        // Save tab-specific scroll position
        const scrollKey = `ratingsPageScroll_${activeTab}`;
        sessionStorage.setItem(scrollKey, position.toString());
        // Set flag that we're navigating to a detail page
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

  // Helper function to get user rating (unused)
  // const getUserRating = (rating: any): number => {
  //   if (!rating || !user?.uid) return 0;
  //   return rating[user.uid] || 0;
  // };

  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Get ALL series (including unrated with rating 0)
  const ratedSeries = useMemo(() => {
    // Start with ALL series, don't filter by rating
    let filtered = seriesList;

    // Apply filters
    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((series) => {
        // Genres können in series.genres oder series.genre.genres sein
        const genres = series.genre?.genres || [];
        if (Array.isArray(genres)) {
          const hasGenre = genres.some(
            (g: string) => g.toLowerCase() === filters.genre!.toLowerCase()
          );
          return hasGenre;
        }
        return false;
      });
    }

    if (filters.provider && filters.provider !== 'All') {
      filtered = filtered.filter((series) => {
        // Provider structure: series.provider.provider[]
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
      // Filter for series that are in the watchlist
      filtered = filtered.filter((s) => {
        return s.watchlist === true;
      });
    } else if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculateOverallRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      // Nur Serien die begonnen aber nicht fertig sind
      filtered = filtered.filter((s) => {
        const series = s as any; // Type assertion
        if (!series.seasons) return false;

        const today = new Date();
        let totalAiredEpisodes = 0;
        let watchedEpisodes = 0;

        series.seasons.forEach((season: any) => {
          if (season.episodes) {
            season.episodes.forEach((ep: any) => {
              // Nur ausgestrahlte Episoden zählen (mit air_date in der Vergangenheit)
              if (ep.air_date) {
                const airDate = new Date(ep.air_date);
                if (airDate <= today) {
                  totalAiredEpisodes++;
                  if (ep.watched) watchedEpisodes++;
                }
              }
              // Episoden ohne air_date werden NICHT gezählt
            });
          }
        });

        // Begonnen aber nicht fertig (zwischen 1% und 99%)
        return watchedEpisodes > 0 && watchedEpisodes < totalAiredEpisodes;
      });
    } else if (filters.quickFilter === 'not-started') {
      // Serien die noch nicht begonnen wurden (keine Episoden geschaut)
      filtered = filtered.filter((s) => {
        const series = s as any; // Type assertion
        if (!series.seasons) return true; // Wenn keine Seasons-Daten vorhanden sind, als nicht begonnen betrachten

        let watchedEpisodes = 0;
        const today = new Date();

        series.seasons.forEach((season: any) => {
          if (season.episodes) {
            season.episodes.forEach((ep: any) => {
              // Nur ausgestrahlte Episoden zählen (mit air_date in der Vergangenheit)
              if (ep.air_date) {
                const airDate = new Date(ep.air_date);
                if (airDate <= today && ep.watched) {
                  watchedEpisodes++;
                }
              }
            });
          }
        });

        // Noch nicht begonnen (keine Episoden geschaut)
        return watchedEpisodes === 0;
      });
    } else if (filters.quickFilter === 'ongoing') {
      // Show ongoing series (still running)
      filtered = filtered.filter((s) => {
        const status = s.status?.toLowerCase();
        return status === 'returning series' || status === 'ongoing' || (!status && s.production?.production === true);
      });
    } else if (filters.quickFilter === 'recently-added') {
      // Show all items, sorted by ID (proxy for when added)
      // No filter needed since we want to show all recently added items
    }

    // Apply sorting
    const sortBy =
      filters.quickFilter === 'ongoing'
        ? 'rating-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';
    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateOverallRating(a));
      const ratingB = parseFloat(calculateOverallRating(b));

      switch (sortBy) {
        case 'rating-desc':
          return ratingB - ratingA;
        case 'rating-asc':
          return ratingA - ratingB;
        case 'name-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'name-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'date-desc':
          // Use nmr as proxy for when it was added (higher nmr = newer)
          // Cast to number to ensure proper numeric comparison
          return Number(b.nmr) - Number(a.nmr);
        default:
          return ratingB - ratingA;
      }
    });

    return filtered;
  }, [seriesList, filters, user]);

  // Get ALL movies (including unrated with rating 0)
  const ratedMovies = useMemo(() => {
    // Start with ALL movies, don't filter by rating
    let filtered = movieList;

    // Apply filters
    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((movie) => {
        // Genres können in movie.genres oder movie.genre.genres sein
        const genres = movie.genre?.genres || [];
        if (Array.isArray(genres)) {
          return genres.some((g: string) => g.toLowerCase() === filters.genre!.toLowerCase());
        }
        return false;
      });
      console.log('After genre filter:', filtered.length);
    }

    if (filters.provider && filters.provider !== 'All') {
      filtered = filtered.filter((movie) => {
        // Provider structure: movie.provider.provider[]
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

    // Apply quick filters
    if (filters.quickFilter === 'watchlist') {
      // Filter for movies that are in the watchlist
      filtered = filtered.filter((m) => {
        return m.watchlist === true;
      });
    } else if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculateOverallRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      // Movies don't have seasons, so skip this filter for movies
      filtered = []; // No movies can be "started" since they don't have episodes
    } else if (filters.quickFilter === 'not-started') {
      // For movies: items that haven't been watched (no rating or rating is 0)
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculateOverallRating(m));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'ongoing') {
      // Show ongoing movies (still running - nicht applicable für Filme, zeige alle)
      // Für Filme ist "ongoing" nicht relevant, also alle anzeigen
      // Keine Filterung
    } else if (filters.quickFilter === 'recently-added') {
      // Show all items, sorted by ID (proxy for when added)
      // No filter needed since we want to show all recently added items
    }

    // Apply sorting
    const sortBy =
      filters.quickFilter === 'ongoing'
        ? 'rating-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';
    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateOverallRating(a));
      const ratingB = parseFloat(calculateOverallRating(b));

      switch (sortBy) {
        case 'rating-desc':
          return ratingB - ratingA;
        case 'rating-asc':
          return ratingA - ratingB;
        case 'name-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'name-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'date-desc':
          // Use nmr as proxy for when it was added (higher nmr = newer)
          // Cast to number to ensure proper numeric comparison
          return Number(b.nmr) - Number(a.nmr);
        default:
          return ratingB - ratingA;
      }
    });

    return filtered;
  }, [movieList, filters, user]);

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  // Nur Items mit Bewertungen für den Durchschnitt berücksichtigen (Rating > 0)
  const itemsWithRating = currentItems.filter((item) => {
    const rating = parseFloat(calculateOverallRating(item));
    return !isNaN(rating) && rating > 0;
  });

  const averageRating =
    itemsWithRating.length > 0
      ? itemsWithRating.reduce((acc, item) => acc + parseFloat(calculateOverallRating(item)), 0) /
        itemsWithRating.length
      : 0;

  return (
    <div
      ref={scrollRef}
      style={{
        minHeight: '100vh',
        background: getMobilePageBackground(), // Dynamisch: transparent wenn Bild, sonst undurchsichtig
        color: currentTheme.text.primary,
        overflow: 'auto',
        height: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Star style={{ fontSize: '28px', color: currentTheme.status.warning }} />
            Meine Bewertungen
          </h1>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            fontSize: '14px',
            color: currentTheme.text.secondary,
          }}
        >
          <span>{itemsWithRating.length} bewertet</span>
          <span>Ø {averageRating.toFixed(1)} ⭐</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          padding: '0 20px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('series')}
          style={{
            flex: 1,
            padding: '12px',
            background:
              activeTab === 'series' ? currentTheme.primary : currentTheme.background.surface,
            border: 'none',
            borderRadius: '12px 0 0 12px',
            color: activeTab === 'series' ? 'white' : currentTheme.text.primary,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <TvIcon style={{ fontSize: '20px' }} />
          Serien ({ratedSeries.length})
        </button>

        <button
          onClick={() => setActiveTab('movies')}
          style={{
            flex: 1,
            padding: '12px',
            background:
              activeTab === 'movies' ? `${currentTheme.primary}CC` : currentTheme.background.surface,
            border: 'none',
            borderRadius: '0 12px 12px 0',
            color: activeTab === 'movies' ? 'white' : currentTheme.text.primary,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <MovieIcon style={{ fontSize: '20px' }} />
          Filme ({ratedMovies.length})
        </button>
      </div>


      {/* Items Grid */}
      <div style={{ padding: '0 20px' }}>
        {currentItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: currentTheme.text.muted,
            }}
          >
            <Star style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
            <h3>Noch keine Bewertungen</h3>
            <p>Bewerte {activeTab === 'series' ? 'Serien' : 'Filme'} um sie hier zu sehen!</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                window.innerWidth >= 1200
                  ? 'repeat(8, 1fr)'
                  : window.innerWidth >= 768
                    ? 'repeat(5, 1fr)'
                    : 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '16px',
            }}
          >
            {currentItems.map((item) => {
              const rating = parseFloat(calculateOverallRating(item));
              const isMovie = 'release_date' in item;

              // Calculate progress for series (only aired episodes)
              let progress = 0;
              if (!isMovie) {
                const series = item as any; // Type assertion for series
                if (series.seasons) {
                  const today = new Date();
                  let totalAiredEpisodes = 0;
                  let watchedEpisodes = 0;

                  series.seasons.forEach((season: any) => {
                    if (season.episodes) {
                      season.episodes.forEach((ep: any) => {
                        // Nur ausgestrahlte Episoden zählen (mit air_date in der Vergangenheit)
                        if (ep.air_date) {
                          const airDate = new Date(ep.air_date);
                          if (airDate <= today) {
                            totalAiredEpisodes++;
                            if (ep.watched) watchedEpisodes++;
                          }
                        }
                        // Episoden ohne air_date werden NICHT gezählt
                      });
                    }
                  });

                  progress =
                    totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;
                }
              }

              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleItemClick(item, isMovie ? 'movie' : 'series')}
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getImageUrl(item.poster)}
                      alt={item.title}
                      style={{
                        width: '100%',
                        aspectRatio: '2/3',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        background: currentTheme.background.surface,
                      }}
                    />

                    {/* Provider Badges */}
                    {item.provider?.provider && item.provider.provider.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          display: 'flex',
                          gap: '4px',
                        }}
                      >
                        {Array.from(new Set(item.provider.provider.map((p: any) => p.name)))
                          .slice(0, 2)
                          .map((name) => {
                            const provider = item.provider?.provider.find(
                              (p: any) => p.name === name
                            );
                            return provider ? (
                              <div
                                key={provider.id}
                                style={{
                                  background: `${currentTheme.background.default}99`,
                                  backdropFilter: 'blur(8px)',
                                  border: `1px solid ${currentTheme.border.default}`,
                                  borderRadius: '8px',
                                  padding: '2px',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <img
                                  src={provider.logo}
                                  alt={provider.name}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                  }}
                                />
                              </div>
                            ) : null;
                          })}
                        {item.provider.provider.length > 2 && (
                          <div
                            style={{
                              background: `${currentTheme.background.default}99`,
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: currentTheme.text.primary,
                            }}
                          >
                            +{item.provider.provider.length - 2}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rating Badge */}
                    {!isNaN(rating) && rating > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: `${currentTheme.background.default}CC`,
                          borderRadius: '16px',
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        <Star
                          style={{
                            fontSize: '14px',
                            color: currentTheme.status.warning,
                          }}
                        />
                        {rating.toFixed(1)}
                      </div>
                    )}

                    {/* Progress Bar for Series */}
                    {!isMovie && progress > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          right: '6px',
                          height: '4px',
                          background: `${currentTheme.background.default}99`,
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            background:
                              progress === 100
                                ? currentTheme.status.success
                                : currentTheme.status.success,
                            transition: 'width 0.3s ease',
                            boxShadow: `0 0 4px ${currentTheme.status.success}80`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <h4
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
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

                  {/* Show progress percentage for series */}
                  {!isMovie && progress > 0 && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: currentTheme.status.success,
                        margin: '2px 0 0 0',
                        fontWeight: 500,
                      }}
                    >
                      {Math.round(progress)}% geschaut
                    </p>
                  )}

                  {isMovie && item.release_date && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: currentTheme.text.muted,
                        margin: '2px 0 0 0',
                      }}
                    >
                      {item.release_date.split('-')[0]}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* QuickFilter FAB */}
      <QuickFilter
        onFilterChange={(newFilters) => {
          // Update state directly
          if (newFilters.sortBy) setSortOption(newFilters.sortBy);
          if (newFilters.genre !== undefined) setSelectedGenre(newFilters.genre || 'Alle');
          if (newFilters.provider !== undefined) setSelectedProvider(newFilters.provider);
          if (newFilters.quickFilter !== undefined) setShowUnrated(newFilters.quickFilter === 'unrated');
        }}
        isMovieMode={activeTab === 'movies'}
        isRatingsMode={true}
        initialFilters={filters}
      />
    </div>
  );
};
