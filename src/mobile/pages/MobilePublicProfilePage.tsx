import {
  ArrowBack,
  Movie as MovieIcon,
  Public,
  Star,
  Tv as TvIcon,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { calculateOverallRating } from '../../lib/rating/rating';
import { MobileQuickFilter } from '../components/MobileQuickFilter';

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
}

export const MobilePublicProfilePage: React.FC = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
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
        console.log('Starting to load public profile for ID:', publicId);

        // Find user with this public profile ID
        const usersRef = firebase.database().ref('users');
        const usersSnapshot = await usersRef.once('value');
        const users = usersSnapshot.val();

        console.log(
          'Found users in database:',
          users ? Object.keys(users).length : 0
        );

        let foundUser = null;
        let foundUserId = null;

        if (users) {
          for (const [userId, userData] of Object.entries(users)) {
            const user = userData as any;
            console.log(
              `Checking user ${userId}: publicProfileId=${user.publicProfileId}, isPublicProfile=${user.isPublicProfile}`
            );
            if (user.publicProfileId === publicId && user.isPublicProfile) {
              foundUser = user;
              foundUserId = userId;
              console.log('Found matching user:', userId, user);
              break;
            }
          }
        }

        if (!foundUser || !foundUserId) {
          console.log('Public profile not found or not public');
          setProfileExists(false);
          setLoading(false);
          return;
        }

        console.log(
          `Loading public profile for: ${
            foundUser.username || foundUser.displayName
          }`
        );
        setProfileName(
          foundUser.username || foundUser.displayName || 'Unbekannt'
        );

        // Load user's series
        const seriesRef = firebase.database().ref(`${foundUserId}/serien`);
        console.log(`Loading series from: ${foundUserId}/serien`);
        const seriesSnapshot = await seriesRef.once('value');
        const series = seriesSnapshot.val();
        console.log('Raw series data:', series);

        if (series) {
          const seriesArray = Object.entries(series).map(
            ([id, data]: [string, any]) => ({
              id: parseInt(id),
              nmr: data.nmr || 0,
              title: data.title,
              poster: data.poster,
              rating: data.rating,
              genre: data.genre,
              genres: data.genres,
              provider: data.provider,
              seasons: data.seasons,
            })
          );

          console.log(
            `Loaded ${seriesArray.length} series for public profile:`,
            seriesArray
          );
          setProfileSeries(seriesArray);
        } else {
          console.log('No series found for this user');
        }

        // Load user's movies
        const moviesRef = firebase.database().ref(`${foundUserId}/filme`);
        console.log(`Loading movies from: ${foundUserId}/filme`);
        const moviesSnapshot = await moviesRef.once('value');
        const movies = moviesSnapshot.val();
        console.log('Raw movies data:', movies);

        if (movies) {
          const moviesArray = Object.entries(movies).map(
            ([id, data]: [string, any]) => ({
              id: parseInt(id),
              nmr: data.nmr || 0,
              title: data.title,
              poster: data.poster,
              rating: data.rating,
              genre: data.genre,
              genres: data.genres,
              provider: data.provider,
              release_date: data.release_date,
            })
          );

          console.log(
            `Loaded ${moviesArray.length} movies for public profile:`,
            moviesArray
          );
          setProfileMovies(moviesArray);
        } else {
          console.log('No movies found for this user');
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
    // Create a minimal object that matches what calculateOverallRating expects
    const ratingData = {
      rating: item.rating,
      seasons: item.seasons,
    };
    return calculateOverallRating(ratingData as any);
  };

  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';

    // Handle object with poster property containing full URL
    if (typeof posterObj === 'object' && posterObj.poster) {
      const posterUrl = posterObj.poster;
      if (posterUrl.startsWith('http')) return posterUrl;
      return `https://image.tmdb.org/t/p/w342${posterUrl}`;
    }

    // Handle direct string
    if (typeof posterObj === 'string') {
      if (posterObj.startsWith('http')) return posterObj;
      return `https://image.tmdb.org/t/p/w342${posterObj}`;
    }

    return '/placeholder.jpg';
  };

  // Filter and sort series
  const ratedSeries = useMemo(() => {
    let filtered = profileSeries;

    // Apply filters
    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((series) => {
        const genres = series.genres || series.genre?.genres || [];
        if (Array.isArray(genres)) {
          return genres.some(
            (g: string) => g.toLowerCase() === filters.genre!.toLowerCase()
          );
        }
        return false;
      });
    }

    if (filters.provider && filters.provider !== 'All') {
      filtered = filtered.filter((series) => {
        if (
          series.provider?.provider &&
          Array.isArray(series.provider.provider)
        ) {
          return series.provider.provider.some(
            (p: any) => p.name === filters.provider
          );
        }
        return false;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((series) =>
        series.title?.toLowerCase().includes(searchLower)
      );
    }

    // Apply quick filters
    if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculatePublicRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'best-rated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculatePublicRating(s));
        return !isNaN(rating) && rating >= 8;
      });
    } else if (filters.quickFilter === 'worst-rated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculatePublicRating(s));
        return !isNaN(rating) && rating > 0 && rating <= 6;
      });
    } else if (filters.quickFilter === 'recently-rated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculatePublicRating(s));
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
          // Use nmr as proxy for when it was added (higher nmr = newer)
          return Number(b.nmr) - Number(a.nmr);
        default:
          return ratingB - ratingA;
      }
    });

    return filtered;
  }, [profileSeries, filters]);

  // Filter and sort movies
  const ratedMovies = useMemo(() => {
    let filtered = profileMovies;

    // Apply filters (same logic as series)
    if (filters.genre && filters.genre !== 'All') {
      filtered = filtered.filter((movie) => {
        const genres = movie.genres || movie.genre?.genres || [];
        if (Array.isArray(genres)) {
          return genres.some(
            (g: string) => g.toLowerCase() === filters.genre!.toLowerCase()
          );
        }
        return false;
      });
    }

    if (filters.provider && filters.provider !== 'All') {
      filtered = filtered.filter((movie) => {
        if (
          movie.provider?.provider &&
          Array.isArray(movie.provider.provider)
        ) {
          return movie.provider.provider.some(
            (p: any) => p.name === filters.provider
          );
        }
        return false;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((movie) =>
        movie.title?.toLowerCase().includes(searchLower)
      );
    }

    // Apply quick filters for movies
    if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculatePublicRating(m));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'best-rated') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculatePublicRating(m));
        return !isNaN(rating) && rating >= 8;
      });
    } else if (filters.quickFilter === 'worst-rated') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculatePublicRating(m));
        return !isNaN(rating) && rating > 0 && rating <= 6;
      });
    } else if (filters.quickFilter === 'recently-rated') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculatePublicRating(m));
        return !isNaN(rating) && rating > 0;
      });
    } else if (filters.quickFilter === 'recently-added') {
      // Show all items, sorting will handle the "recently added" part
    }

    // Apply sorting (same logic as series)
    const sortBy =
      filters.quickFilter === 'recently-rated'
        ? 'date-desc'
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

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-background-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-primary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-primary)',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p>Lade öffentliches Profil...</p>
        </div>
      </div>
    );
  }

  if (!profileExists) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-background-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-primary)',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <Public
          style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.3 }}
        />
        <h2 style={{ marginBottom: '16px' }}>Profil nicht gefunden</h2>
        <p
          style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}
        >
          Dieses öffentliche Profil existiert nicht oder ist nicht mehr
          öffentlich zugänglich.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            background: 'var(--color-primary)',
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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background-default)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--color-background-default)E6',
          backdropFilter: 'blur(20px)',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowBack />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Public style={{ fontSize: '20px', opacity: 0.7 }} />
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                {profileName}
              </h1>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
              }}
            >
              Öffentliches Profil
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        <MobileQuickFilter
          onFilterChange={(newFilters) => {
            setFilters((prev) => ({ ...prev, ...newFilters }));
          }}
          isMovieMode={activeTab === 'movies'}
          hasBottomNav={false}
        />
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 16px',
          marginBottom: '24px',
          maxWidth: '1200px',
          margin: '0 auto 24px',
        }}
      >
        <button
          onClick={() => setActiveTab('series')}
          style={{
            flex: 1,
            padding: '12px',
            background:
              activeTab === 'series'
                ? 'var(--color-primary)'
                : 'var(--color-background-surface)',
            border:
              activeTab === 'series'
                ? 'none'
                : '1px solid var(--color-border-default)',
            borderRadius: '12px',
            color:
              activeTab === 'series' ? 'white' : 'var(--color-text-secondary)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <TvIcon style={{ fontSize: '18px' }} />
          Serien ({ratedSeries.length})
        </button>
        <button
          onClick={() => setActiveTab('movies')}
          style={{
            flex: 1,
            padding: '12px',
            background:
              activeTab === 'movies'
                ? 'var(--color-primary)'
                : 'var(--color-background-surface)',
            border:
              activeTab === 'movies'
                ? 'none'
                : '1px solid var(--color-border-default)',
            borderRadius: '12px',
            color:
              activeTab === 'movies' ? 'white' : 'var(--color-text-secondary)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <MovieIcon style={{ fontSize: '18px' }} />
          Filme ({ratedMovies.length})
        </button>
      </div>

      {/* Items Grid */}
      <div
        style={{
          padding: window.innerWidth >= 768 ? '0 40px' : '0 20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {currentItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Star
              style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}
            />
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>
              Keine {activeTab === 'series' ? 'Serien' : 'Filme'} vorhanden
            </h3>
            <p
              style={{
                fontSize: '16px',
                opacity: 0.7,
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              {profileName || 'Dieser Nutzer'} hat noch keine{' '}
              {activeTab === 'series' ? 'Serien' : 'Filme'} zu seiner Liste
              hinzugefügt oder bewertet
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
              paddingBottom: '40px',
            }}
          >
            {currentItems.map((item) => {
              const rating = parseFloat(calculatePublicRating(item));
              const isMovie = 'release_date' in item;

              // Calculate progress for series
              let progress = 0;
              if (!isMovie && item.seasons) {
                const today = new Date();
                let totalAiredEpisodes = 0;
                let watchedEpisodes = 0;

                item.seasons.forEach((season: any) => {
                  if (season.episodes) {
                    season.episodes.forEach((episode: any) => {
                      const airDate = new Date(episode.airDate);
                      if (airDate <= today) {
                        totalAiredEpisodes++;
                        if (episode.watched) {
                          watchedEpisodes++;
                        }
                      }
                    });
                  }
                });

                progress =
                  totalAiredEpisodes > 0
                    ? (watchedEpisodes / totalAiredEpisodes) * 100
                    : 0;
              }

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'relative',
                    aspectRatio: '2/3',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--color-background-surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    // Navigate to series/movie detail if needed
                    // navigate(`/${isMovie ? 'movie' : 'series'}/${item.id}`);
                  }}
                >
                  {/* Poster Image */}
                  <img
                    src={getImageUrl(item.poster)}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.jpg';
                    }}
                  />

                  {/* Provider Badges */}
                  {item.provider?.provider &&
                    item.provider.provider.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          display: 'flex',
                          gap: '4px',
                        }}
                      >
                        {Array.from(
                          new Set(
                            item.provider.provider.map((p: any) => p.name)
                          )
                        )
                          .slice(0, 2)
                          .map((name) => {
                            const provider = item.provider?.provider.find(
                              (p: any) => p.name === name
                            );
                            return provider ? (
                              <div
                                key={provider.id}
                                style={{
                                  background:
                                    'var(--color-background-default)99',
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
                        background: 'var(--color-background-default)DD',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '20px',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <Star style={{ fontSize: '12px', color: '#ffd700' }} />
                      {rating.toFixed(1)}
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
                        background: 'rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: 'var(--color-primary)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}

                  {/* Title Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      background:
                        'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                      padding: '32px 8px 8px',
                      color: 'white',
                    }}
                  >
                    <p
                      style={{
                        margin: '0',
                        fontSize: '12px',
                        fontWeight: 600,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </p>
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

export default MobilePublicProfilePage;
