import { Movie as MovieIcon, Public, Star, Tv as TvIcon } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { BackButton, GradientText, LoadingSpinner, PageLayout, QuickFilter, TabSwitcher } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';

interface PublicUserData {
  publicProfileId?: string;
  isPublicProfile?: boolean;
  username?: string;
  displayName?: string;
}

interface PublicProvider {
  id: number;
  logo: string;
  name: string;
}

interface PublicEpisode {
  air_date?: string;
  id: number;
  name?: string;
  watched?: boolean;
  watchCount?: number;
  episode_number?: number;
}

interface PublicSeason {
  seasonNumber?: number;
  season_number?: number;
  rating?: number;
  episodes?: PublicEpisode[];
}

interface PublicItem {
  id: number;
  nmr: number;
  title: string;
  poster: string | { poster: string };
  rating: Record<string, number> | number;
  genre?: { genres?: string[] };
  genres?: string[];
  provider?: { provider: PublicProvider[] };
  seasons?: PublicSeason[];
  release_date?: string;
  status?: string;
  production?: {
    production: boolean;
  };
}

export const PublicProfilePage: React.FC = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Try to use theme, but fallback to default if not in ThemeProvider
  interface FallbackTheme {
    primary: string;
    background: {
      default: string;
      surface: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    border: {
      default: string;
    };
  }

  type PublicTheme = ReturnType<typeof useTheme>['currentTheme'] | FallbackTheme;

  let currentTheme: PublicTheme;
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

        let foundUser: PublicUserData | null = null;
        let foundUserId: string | null = null;

        if (users) {
          for (const [userId, userData] of Object.entries(users)) {
            const user = userData as PublicUserData;
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
          const seriesArray = Object.entries(series).map(([key, value]) => {
            const data = value as PublicItem;
            return {
              id: data.id || parseInt(key),
              nmr: data.nmr || parseInt(key),
              title: data.title,
              poster: data.poster,
              rating: data.rating,
              genre: data.genre,
              genres: data.genres,
              provider: data.provider,
              seasons: Array.isArray(data.seasons) ? data.seasons : data.seasons ? Object.values(data.seasons) as PublicSeason[] : [],
            };
          });

          setProfileSeries(seriesArray);
        }

        // Load user's movies
        const moviesRef = firebase.database().ref(`${foundUserId}/filme`);
        const moviesSnapshot = await moviesRef.once('value');
        const movies = moviesSnapshot.val();

        if (movies) {
          const moviesArray = Object.entries(movies).map(([key, value]) => {
            const data = value as PublicItem;
            return {
              id: data.id || parseInt(key),
              nmr: data.nmr || parseInt(key),
              title: data.title,
              poster: data.poster,
              rating: data.rating,
              genre: data.genre,
              genres: data.genres,
              provider: data.provider,
              release_date: data.release_date,
            };
          });

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
      item.seasons.forEach((season: PublicSeason) => {
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
          return series.provider.provider.some((p: PublicProvider) => p.name === filters.provider);
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

        s.seasons.forEach((season: PublicSeason) => {
          if (season.episodes) {
            season.episodes.forEach((ep: PublicEpisode) => {
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

        s.seasons.forEach((season: PublicSeason) => {
          if (season.episodes) {
            season.episodes.forEach((ep: PublicEpisode) => {
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
          return movie.provider.provider.some((p: PublicProvider) => p.name === filters.provider);
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

  // Restore scroll position only when coming back from detail pages
  useEffect(() => {
    // Check if we should restore scroll position
    const shouldRestore = sessionStorage.getItem('shouldRestorePublicProfileScroll');

    if (shouldRestore === 'true' && currentItems.length > 0) {
      // Clear the flag immediately
      sessionStorage.removeItem('shouldRestorePublicProfileScroll');

      // Use public profile specific scroll position
      const scrollKey = `publicProfilePageScroll_${publicId}_${activeTab}`;
      const position = sessionStorage.getItem(scrollKey);
      const scrollSource = sessionStorage.getItem(`publicProfilePageScrollSource_${publicId}_${activeTab}`);

      if (position) {
        const scrollTop = parseInt(position, 10);
        if (scrollTop > 0) {
          // Wait for DOM to be fully rendered
          const restoreScroll = () => {
            // Find the correct parent element
            if (scrollSource && scrollSource.startsWith('parent-')) {
              const parentIndex = parseInt(scrollSource.split('-')[1], 10);
              let element = scrollRef.current?.parentElement;
              for (let i = 0; i < parentIndex && element; i++) {
                element = element.parentElement;
              }
              if (element) {
                // Wait for the element to be scrollable
                if (element.scrollHeight > element.clientHeight) {
                  element.scrollTop = scrollTop;

                  // Verify it worked and retry if needed
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
  }, [publicId, activeTab, currentItems.length]); // Trigger when publicId, items are loaded and tab changes

  // Save scroll position before navigating away
  const handleItemClick = (item: PublicItem, type: 'series' | 'movie') => {
    // Try to get scroll position from multiple sources
    let position = 0;
    let scrollSource = '';

    // Check all possible parents for scroll
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

    // If no parent scroll found, try the usual suspects
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
        // Save public profile specific scroll position
        const scrollKey = `publicProfilePageScroll_${publicId}_${activeTab}`;
        sessionStorage.setItem(scrollKey, position.toString());
        sessionStorage.setItem(`publicProfilePageScrollSource_${publicId}_${activeTab}`, scrollSource);
        // Set flag that we're navigating to a detail page
        sessionStorage.setItem('shouldRestorePublicProfileScroll', 'true');
      } catch (error) {
        console.error('Error saving scroll position:', error);
      }
    }

    navigate(type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
  };

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


  // Premium loading state
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${currentTheme.primary}20, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <LoadingSpinner size={60} text="Lade Profil..." />
        </div>
      </div>
    );
  }

  // Premium not found state
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '10%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${currentTheme.primary}15, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Public style={{ fontSize: '48px', opacity: 0.4 }} />
        </motion.div>
        <h2 style={{ marginBottom: '12px', fontSize: '22px', fontWeight: 700 }}>
          Profil nicht gefunden
        </h2>
        <p style={{ color: currentTheme.text.secondary, marginBottom: '32px', fontSize: '14px', lineHeight: 1.5 }}>
          Dieses öffentliche Profil existiert nicht<br />oder ist nicht mehr öffentlich zugänglich.
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          style={{
            padding: '14px 32px',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: `0 4px 20px ${currentTheme.primary}40`,
          }}
        >
          Zur Startseite
        </motion.button>
      </div>
    );
  }

  return (
    <PageLayout>
      <div ref={scrollRef}>

      {/* Premium Glassmorphism Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          background: `${currentTheme.background.default}90`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BackButton />

          <div style={{ flex: 1 }}>
            <GradientText as="h1" to="#8b5cf6" style={{
                fontSize: '22px',
                fontWeight: 800,
                margin: 0,
              }}
            >
              {profileName}
            </GradientText>
            <div
              style={{
                color: currentTheme.text.secondary,
                fontSize: '12px',
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Public style={{ fontSize: '13px', color: currentTheme.primary }} />
                Öffentlich
              </span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>{itemsWithRating.length} bewertet</span>
            </div>
          </div>

          {/* Rating Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(255, 215, 0, 0.15)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.25)',
            }}
          >
            <Star style={{ fontSize: 16, color: '#FFD700' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFD700' }}>
              Ø {averageRating.toFixed(1)}
            </span>
          </div>
        </div>
      </motion.header>

      {/* Quick Filter */}
      <QuickFilter
        onFilterChange={setFilters}
        isMovieMode={activeTab === 'movies'}
        isRatingsMode={true}
        hasBottomNav={false}
      />

      {/* Premium Tab Switcher */}
      <TabSwitcher
        tabs={[
          { id: 'series', label: 'Serien', icon: TvIcon, count: ratedSeries.length },
          { id: 'movies', label: 'Filme', icon: MovieIcon, count: ratedMovies.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'series' | 'movies')}
      />

      {/* Items Grid */}
      <div style={{ padding: '0 16px 100px 16px', position: 'relative', zIndex: 1 }}>
        {currentItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 30px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `${currentTheme.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Star style={{ fontSize: '36px', color: currentTheme.primary, opacity: 0.5 }} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: currentTheme.text.primary, fontWeight: 700 }}>
              Keine {activeTab === 'series' ? 'Serien' : 'Filme'} gefunden
            </h3>
            <p style={{ fontSize: '14px', color: currentTheme.text.secondary, margin: 0 }}>
              Versuche andere Filter oder entferne sie.
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

                item.seasons.forEach((season: PublicSeason) => {
                  if (season.episodes) {
                    season.episodes.forEach((ep: PublicEpisode) => {
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
                  onClick={() => handleItemClick(item, isMovie ? 'movie' : 'series')}
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getImageUrl(item.poster, 'w500')}
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
                        {Array.from(new Set(item.provider.provider.map((p: PublicProvider) => p.name)))
                          .slice(0, 2)
                          .map((name) => {
                            const provider = item.provider?.provider.find(
                              (p: PublicProvider) => p.name === name
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
    </PageLayout>
  );
};
