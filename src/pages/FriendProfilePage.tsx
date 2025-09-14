import { Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { useAuth } from '../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../contexts/ThemeContext';
import { calculateOverallRating } from '../lib/rating/rating';
import { QuickFilter } from '../components/QuickFilter';
import { BackButton } from '../components/BackButton';

interface FriendItem {
  id: number;
  nmr: number;
  title: string;
  poster: any;
  rating: any;
  genre?: any;
  genres?: string[];
  provider?: any;
  seasons?: any[];
  release_date?: string;
}

export const FriendProfilePage: React.FC = () => {
  const { id: friendId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  // const { user } = useAuth()!;
  const [loading, setLoading] = useState(true);
  const [friendName, setFriendName] = useState('');
  const [friendSeries, setFriendSeries] = useState<FriendItem[]>([]);
  const [friendMovies, setFriendMovies] = useState<FriendItem[]>([]);
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [filters, setFilters] = useState<{
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
    sortBy?: string;
  }>({});

  // Load friend's data
  useEffect(() => {
    const loadFriendData = async () => {
      if (!friendId) return;

      try {
        setLoading(true);

        // Load friend's name
        const userRef = firebase.database().ref(`users/${friendId}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();
        setFriendName(userData?.displayName || 'User');

        // Load friend's series
        const seriesRef = firebase.database().ref(`${friendId}/serien`);
        const seriesSnapshot = await seriesRef.once('value');
        const seriesData = seriesSnapshot.val() || {};

        const seriesList: FriendItem[] = [];
        for (const [key, value] of Object.entries(seriesData)) {
          const series = value as any;
          seriesList.push({
            id: series.id || parseInt(key),
            nmr: series.nmr || parseInt(key),
            title: series.title || 'Unknown',
            poster: series.poster,
            rating: series.rating,
            genre: series.genre,
            genres: series.genre?.genres || [],
            provider: series.provider,
            seasons: series.seasons,
          });
        }
        setFriendSeries(seriesList);

        // Load friend's movies
        const moviesRef = firebase.database().ref(`${friendId}/filme`);
        const moviesSnapshot = await moviesRef.once('value');
        const moviesData = moviesSnapshot.val() || {};

        const moviesList: FriendItem[] = [];
        for (const [key, value] of Object.entries(moviesData)) {
          const movie = value as any;
          moviesList.push({
            id: movie.id || parseInt(key),
            nmr: movie.nmr || parseInt(key),
            title: movie.title || 'Unknown',
            poster: movie.poster,
            rating: movie.rating,
            genre: movie.genre,
            genres: movie.genre?.genres || [],
            provider: movie.provider,
            release_date: movie.release_date,
          });
        }
        setFriendMovies(moviesList);
      } catch (error) {
        console.error('Error loading friend data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriendData();
  }, [friendId]);

  // Helper to calculate rating for friend
  const calculateFriendRating = (item: any): string => {
    if (!item.rating) return '0.00';
    return calculateOverallRating(item);
  };

  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Filter and sort series
  const ratedSeries = useMemo(() => {
    let filtered = friendSeries;

    // Apply filters
    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((series) => {
        const genres = series.genres || series.genre?.genres || [];
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
    if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculateFriendRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      // For series: started but not finished (has progress but not 100%)
      filtered = filtered.filter((s) => {
        if (!s.seasons) return false;

        let watchedEpisodes = 0;
        let totalAiredEpisodes = 0;
        const today = new Date();

        s.seasons.forEach((season: any) => {
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
      // For series: items that haven't been started (no episodes watched)
      filtered = filtered.filter((s) => {
        if (!s.seasons) return true; // If no seasons data, consider as not started

        let watchedEpisodes = 0;
        const today = new Date();

        s.seasons.forEach((season: any) => {
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
    } else if (filters.quickFilter === 'recently-rated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculateFriendRating(s));
        return !isNaN(rating) && rating > 0;
      });
    } else if (filters.quickFilter === 'recently-added') {
      // Show all items, sorting will handle the "recently added" part
    }

    // Apply sorting - special handling for certain quickfilters
    const sortBy =
      filters.quickFilter === 'recently-rated'
        ? 'date-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';
    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateFriendRating(a));
      const ratingB = parseFloat(calculateFriendRating(b));

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
          return Number(b.nmr) - Number(a.nmr);
        default:
          return ratingB - ratingA;
      }
    });

    return filtered;
  }, [friendSeries, filters, friendId]);

  // Filter and sort movies
  const ratedMovies = useMemo(() => {
    let filtered = friendMovies;

    // Apply filters (same logic as series)
    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((movie) => {
        const genres = movie.genres || movie.genre?.genres || [];
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

    // Apply quick filters for movies
    if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculateFriendRating(m));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'not-started') {
      // For movies: items that haven't been watched (no rating or rating is 0)
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculateFriendRating(m));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'recently-rated') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculateFriendRating(m));
        return !isNaN(rating) && rating > 0;
      });
    } else if (filters.quickFilter === 'recently-added') {
      // Show all items, sorting will handle the "recently added" part
    }

    // Apply sorting - special handling for certain quickfilters
    const sortBy =
      filters.quickFilter === 'recently-rated'
        ? 'date-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';
    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateFriendRating(a));
      const ratingB = parseFloat(calculateFriendRating(b));

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
          return Number(b.nmr) - Number(a.nmr);
        default:
          return ratingB - ratingA;
      }
    });

    return filtered;
  }, [friendMovies, filters, friendId]);

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  // Calculate average rating
  const itemsWithRating = currentItems.filter((item) => {
    const rating = parseFloat(calculateFriendRating(item));
    return !isNaN(rating) && rating > 0;
  });

  const averageRating =
    itemsWithRating.length > 0
      ? itemsWithRating.reduce((acc, item) => acc + parseFloat(calculateFriendRating(item)), 0) /
        itemsWithRating.length
      : 0;

  if (loading) {
    return (
      <div
        style={{
          background: currentTheme.background.default,
          color: currentTheme.text.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header
        style={{
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <BackButton />

          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: 0,
                background: currentTheme.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {friendName}
            </h1>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: '4px 0 0 0',
              }}
            >
              Ø {averageRating.toFixed(1)} ⭐ • {itemsWithRating.length} bewertet
            </p>
          </div>
        </div>
      </header>

      {/* Quick Filter */}
      <QuickFilter
        onFilterChange={setFilters}
        isMovieMode={activeTab === 'movies'}
        isRatingsMode={true}
        hasBottomNav={false} // No bottom navigation on friend profile page
      />

      {/* Tab Switcher */}
      <div
        style={{
          display: 'flex',
          margin: '0 20px 20px 20px',
          background: currentTheme.background.surface,
          borderRadius: '12px',
        }}
      >
        <button
          onClick={() => setActiveTab('series')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'series' ? currentTheme.primary : 'transparent',
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
            background: activeTab === 'movies' ? `${currentTheme.primary}CC` : 'transparent',
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
      <div style={{ padding: window.innerWidth >= 768 ? '0 40px' : '0 20px' }}>
        {currentItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: currentTheme.text.muted,
            }}
          >
            <Star style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
            <h3>Keine {activeTab === 'series' ? 'Serien' : 'Filme'} gefunden</h3>
            <p>
              {friendName} hat noch keine {activeTab === 'series' ? 'Serien' : 'Filme'} bewertet
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                window.innerWidth >= 1200
                  ? 'repeat(6, 1fr)'
                  : window.innerWidth >= 768
                    ? 'repeat(4, 1fr)'
                    : 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: window.innerWidth >= 768 ? '20px' : '16px',
            }}
          >
            {currentItems.map((item) => {
              const rating = parseFloat(calculateFriendRating(item));
              const isMovie = 'release_date' in item;

              // Calculate progress for series
              let progress = 0;
              if (!isMovie && item.seasons) {
                const today = new Date();
                let totalAiredEpisodes = 0;
                let watchedEpisodes = 0;

                item.seasons.forEach((season) => {
                  if (season.episodes) {
                    const episodes = Array.isArray(season.episodes)
                      ? season.episodes
                      : Object.values(season.episodes || {});
                    episodes.forEach((ep: any) => {
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

                progress =
                  totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;
              }

              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(isMovie ? `/movie/${item.id}` : `/series/${item.id}`)}
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
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
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
                      </div>
                    )}

                    {/* Rating Badge */}
                    {rating > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: `${currentTheme.background.default}CC`,
                          backdropFilter: 'blur(10px)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Star style={{ fontSize: '16px', color: currentTheme.status.warning }} />
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: currentTheme.text.primary,
                          }}
                        >
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Progress Bar for Series */}
                    {!isMovie && progress > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          height: '4px',
                          background: `${currentTheme.background.default}80`,
                          borderRadius: '0 0 8px 8px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            background:
                              progress === 100
                                ? 'linear-gradient(90deg, #00d4aa, #00b4d8)'
                                : 'linear-gradient(90deg, #667eea, #764ba2)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      margin: '8px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3',
                      minHeight: '32px',
                    }}
                  >
                    {item.title}
                  </h3>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
