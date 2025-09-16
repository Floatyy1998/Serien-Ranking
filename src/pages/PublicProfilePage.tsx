import { Movie as MovieIcon, Public, Star, Tv as TvIcon } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { QuickFilter } from '../components/QuickFilter';
import { BackButton } from '../components/BackButton';

interface PublicItem {
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
  status?: string;
  production?: {
    production: boolean;
  };
}

export const PublicProfilePage: React.FC = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();

  // Try to use theme, but fallback to default if not in ThemeProvider
  let currentTheme: any;
  try {
    const theme = useTheme();
    currentTheme = theme.currentTheme;
  } catch {
    // Fallback theme for unauthenticated users
    currentTheme = {
      primary: '#667eea',
      background: {
        default: '#0a0a0f',
        surface: 'rgba(255, 255, 255, 0.05)',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
      border: {
        default: 'rgba(255, 255, 255, 0.1)',
      },
    };
  }

  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileSeries, setProfileSeries] = useState<PublicItem[]>([]);
  const [profileMovies, setProfileMovies] = useState<PublicItem[]>([]);
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [profileExists, setProfileExists] = useState(true);
  const [filters, setFilters] = useState<{
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
    sortBy?: string;
  }>({});

  // Load public profile data
  useEffect(() => {
    const loadPublicProfileData = async () => {
      if (!publicId) return;

      try {
        // Find user with this public profile ID
        const usersRef = firebase.database().ref('users');
        const usersSnapshot = await usersRef.once('value');
        const users = usersSnapshot.val();

        let foundUser = null;
        let foundUserId = null;

        if (users) {
          for (const [userId, userData] of Object.entries(users)) {
            const user = userData as any;
            if (user.publicProfileId === publicId && user.isPublicProfile) {
              foundUser = user;
              foundUserId = userId;
              break;
            }
          }
        }

        if (!foundUser || !foundUserId) {
          setProfileExists(false);
          setLoading(false);
          return;
        }

        setProfileName(foundUser.username || foundUser.displayName || 'Unbekannt');

        // Load user's series
        const seriesRef = firebase.database().ref(`${foundUserId}/serien`);
        const seriesSnapshot = await seriesRef.once('value');
        const series = seriesSnapshot.val();

        if (series) {
          const seriesArray = Object.entries(series).map(([key, data]: [string, any]) => ({
            id: data.id || parseInt(key), // Use data.id if available, otherwise use the key
            nmr: data.nmr || parseInt(key),
            title: data.title,
            poster: data.poster,
            rating: data.rating,
            genre: data.genre,
            genres: data.genres,
            provider: data.provider,
            seasons: data.seasons,
          }));

          setProfileSeries(seriesArray);
        }

        // Load user's movies
        const moviesRef = firebase.database().ref(`${foundUserId}/filme`);
        const moviesSnapshot = await moviesRef.once('value');
        const movies = moviesSnapshot.val();

        if (movies) {
          const moviesArray = Object.entries(movies).map(([key, data]: [string, any]) => ({
            id: data.id || parseInt(key), // Use data.id if available, otherwise use the key
            nmr: data.nmr || parseInt(key),
            title: data.title,
            poster: data.poster,
            rating: data.rating,
            genre: data.genre,
            genres: data.genres,
            provider: data.provider,
            release_date: data.release_date,
          }));

          setProfileMovies(moviesArray);
        }
      } catch (error) {
        console.error('Error loading public profile:', error);
        setProfileExists(false);
      } finally {
        setLoading(false);
      }
    };

    loadPublicProfileData();
  }, [publicId]);

  const calculatePublicRating = (item: PublicItem): string => {
    if (!item.rating) return '0.0';

    // Create a simplified rating structure
    let totalRating = 0;
    let ratingCount = 0;

    // For series with seasons
    if (item.seasons && Array.isArray(item.seasons)) {
      item.seasons.forEach((season: any) => {
        if (season.rating && season.rating > 0) {
          totalRating += season.rating;
          ratingCount++;
        }
      });
    }

    // For single rating (movies or overall series rating)
    if (typeof item.rating === 'number' && item.rating > 0) {
      totalRating += item.rating;
      ratingCount++;
    }

    if (ratingCount === 0) return '0.0';
    return (totalRating / ratingCount).toFixed(1);
  };

  const ratedSeries = useMemo(() => {
    let filtered = profileSeries;

    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((series) => {
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
      filtered = [];
    } else if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculatePublicRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      // Serien die begonnen aber nicht fertig sind
      filtered = filtered.filter((s) => {
        if (!s.seasons) return false;

        const today = new Date();
        let totalAiredEpisodes = 0;
        let watchedEpisodes = 0;

        s.seasons.forEach((season: any) => {
          if (season.episodes) {
            season.episodes.forEach((ep: any) => {
              // Nur ausgestrahlte Episoden zählen
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

        // Begonnen aber nicht fertig (zwischen 1% und 99%)
        return watchedEpisodes > 0 && watchedEpisodes < totalAiredEpisodes;
      });
    } else if (filters.quickFilter === 'not-started') {
      // Serien die noch nicht begonnen wurden
      filtered = filtered.filter((s) => {
        if (!s.seasons) return true;

        let watchedEpisodes = 0;
        const today = new Date();

        s.seasons.forEach((season: any) => {
          if (season.episodes) {
            season.episodes.forEach((ep: any) => {
              // Nur ausgestrahlte Episoden zählen
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
      // Public-Daten haben oft keine status/production Felder
      // Fallback: Zeige alle Serien, da wir nicht wissen können welche fortlaufend sind
      console.log('Public Profile - ONGOING filter: Public data has no status info, showing all series');
      // filtered bleibt unverändert (alle Serien)
    } else if (filters.quickFilter === 'recently-added') {
      // Show all items, sorted by ID
    }

    // Apply sorting
    const sortBy =
      filters.quickFilter === 'ongoing'
        ? 'rating-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';
    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculatePublicRating(a));
      const ratingB = parseFloat(calculatePublicRating(b));

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
          return Number(b.nmr) - Number(a.nmr);
        default:
          return ratingB - ratingA;
      }
    });

    return filtered;
  }, [profileSeries, filters]);

  const ratedMovies = useMemo(() => {
    let filtered = profileMovies;

    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((movie) => {
        const genres = movie.genre?.genres || [];
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

    // Apply quick filters
    if (filters.quickFilter === 'watchlist') {
      filtered = [];
    } else if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculatePublicRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      filtered = [];
    } else if (filters.quickFilter === 'not-started') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculatePublicRating(m));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'ongoing') {
      // Für Filme ist "ongoing" nicht relevant, also alle anzeigen
      // Keine Filterung
    } else if (filters.quickFilter === 'recently-added') {
      // Show all items, sorted by ID
    }

    // Apply sorting
    const sortBy =
      filters.quickFilter === 'ongoing'
        ? 'rating-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';
    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculatePublicRating(a));
      const ratingB = parseFloat(calculatePublicRating(b));

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
          return Number(b.nmr) - Number(a.nmr);
        default:
          return ratingB - ratingA;
      }
    });

    return filtered;
  }, [profileMovies, filters]);

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  // Calculate average rating
  const averageRating = useMemo(() => {
    const allItems = [...profileSeries, ...profileMovies];
    const itemsWithRating = allItems.filter((item) => {
      const rating = parseFloat(calculatePublicRating(item));
      return !isNaN(rating) && rating > 0;
    });

    if (itemsWithRating.length === 0) return 0;

    const totalRating = itemsWithRating.reduce((sum, item) => {
      const rating = parseFloat(calculatePublicRating(item));
      return sum + rating;
    }, 0);

    return totalRating / itemsWithRating.length;
  }, [profileSeries, profileMovies]);

  const itemsWithRating = useMemo(() => {
    const allItems = [...profileSeries, ...profileMovies];
    return allItems.filter((item) => {
      const rating = parseFloat(calculatePublicRating(item));
      return !isNaN(rating) && rating > 0;
    });
  }, [profileSeries, profileMovies]);

  // Get TMDB image URL
  const getImageUrl = (poster: any): string => {
    if (!poster) return '/placeholder.jpg';
    const path = typeof poster === 'object' ? poster.poster : poster;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: currentTheme.background.default,
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

  if (!profileExists) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: currentTheme.background.default,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: currentTheme.text.primary,
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <Public style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.3 }} />
        <h2 style={{ marginBottom: '16px' }}>Profil nicht gefunden</h2>
        <p style={{ color: currentTheme.text.secondary, marginBottom: '32px' }}>
          Dieses öffentliche Profil existiert nicht oder ist nicht mehr öffentlich zugänglich.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            background: currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Zur Startseite
        </button>
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
              {profileName}
            </h1>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Public style={{ fontSize: '14px' }} />
              Öffentliches Profil • Ø {averageRating.toFixed(1)} ⭐ • {itemsWithRating.length} bewertet
            </p>
          </div>
        </div>
      </header>

      {/* Quick Filter */}
      <QuickFilter
        onFilterChange={setFilters}
        isMovieMode={activeTab === 'movies'}
        isRatingsMode={true}
        hasBottomNav={false}
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
      <div style={{ padding: '0 20px 100px 20px' }}>
        {currentItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: currentTheme.text.secondary,
            }}
          >
            <Star style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
              Keine {activeTab === 'series' ? 'Serien' : 'Filme'} gefunden
            </h3>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>
              Versuche andere Filter oder entferne sie.
            </p>
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
              const rating = parseFloat(calculatePublicRating(item));
              const isMovie = activeTab === 'movies';

              // Calculate progress for series
              let progress = 0;
              if (!isMovie && item.seasons) {
                const today = new Date();
                let totalAiredEpisodes = 0;
                let watchedEpisodes = 0;

                item.seasons.forEach((season: any) => {
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
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

                    {/* Progress Bar for Series */}
                    {!isMovie && progress > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          right: '6px',
                          height: '4px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: progress === 100 ? '#4cd137' : currentTheme.primary,
                            transition: 'width 0.3s ease',
                          }}
                        />
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
                            color: '#FFD700',
                          }}
                        />
                        {rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: currentTheme.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3',
                      minHeight: '36px',
                    }}
                  >
                    {item.title}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};