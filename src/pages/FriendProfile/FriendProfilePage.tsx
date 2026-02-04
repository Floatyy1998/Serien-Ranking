import { CompareArrows, Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Series } from '../../types/Series';
import { LoadingSpinner, PageHeader, PageLayout, QuickFilter, TabSwitcher } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';

interface FriendProvider {
  id: number;
  logo: string;
  name: string;
}

interface FriendEpisode {
  air_date?: string;
  id: number;
  name?: string;
  watched?: boolean;
  watchCount?: number;
  episode_number?: number;
}

interface FriendSeason {
  seasonNumber?: number;
  season_number?: number;
  rating?: number;
  episodes?: FriendEpisode[];
}

interface FriendItem {
  id: number;
  nmr: number;
  title: string;
  poster: string | { poster: string };
  rating: Record<string, number> | number;
  genre?: { genres?: string[] };
  genres?: string[];
  provider?: { provider: FriendProvider[] };
  seasons?: FriendSeason[];
  release_date?: string;
  status?: string;
  production?: { production: boolean };
}

export const FriendProfilePage: React.FC = () => {
  const { id: friendId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const loadFriendData = async () => {
      if (!friendId) return;

      try {
        setLoading(true);

        const userRef = firebase.database().ref(`users/${friendId}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();
        setFriendName(userData?.displayName || 'User');

        const seriesRef = firebase.database().ref(`${friendId}/serien`);
        const seriesSnapshot = await seriesRef.once('value');
        const seriesData = seriesSnapshot.val() || {};

        const seriesList: FriendItem[] = [];
        for (const [key, value] of Object.entries(seriesData)) {
          const series = value as FriendItem;
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
            status: series.status,
            production: series.production,
          });
        }
        setFriendSeries(seriesList);

        const moviesRef = firebase.database().ref(`${friendId}/filme`);
        const moviesSnapshot = await moviesRef.once('value');
        const moviesData = moviesSnapshot.val() || {};

        const moviesList: FriendItem[] = [];
        for (const [key, value] of Object.entries(moviesData)) {
          const movie = value as FriendItem;
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
            status: movie.status,
            production: movie.production,
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

  const calculateFriendRating = (item: FriendItem): string => {
    if (!item.rating) return '0.00';
    return calculateOverallRating(item as unknown as Series);
  };


  const ratedSeries = useMemo(() => {
    let filtered = friendSeries;

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
          return series.provider.provider.some((p: FriendProvider) => p.name === filters.provider);
        }
        return false;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((series) => series.title?.toLowerCase().includes(searchLower));
    }

    if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((s) => {
        const rating = parseFloat(calculateFriendRating(s));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'started') {
      filtered = filtered.filter((s) => {
        if (!s.seasons) return false;
        let watchedEpisodes = 0;
        let totalAiredEpisodes = 0;
        const today = new Date();

        s.seasons.forEach((season: FriendSeason) => {
          if (season.episodes) {
            season.episodes.forEach((ep: FriendEpisode) => {
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
        if (!s.seasons) return true;
        let watchedEpisodes = 0;
        const today = new Date();

        s.seasons.forEach((season: FriendSeason) => {
          if (season.episodes) {
            season.episodes.forEach((ep: FriendEpisode) => {
              if (ep.air_date) {
                const airDate = new Date(ep.air_date);
                if (airDate <= today && ep.watched) watchedEpisodes++;
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

    const sortBy =
      filters.quickFilter === 'ongoing'
        ? 'rating-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';

    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateFriendRating(a));
      const ratingB = parseFloat(calculateFriendRating(b));

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
  }, [friendSeries, filters]);

  const ratedMovies = useMemo(() => {
    let filtered = friendMovies;

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
          return movie.provider.provider.some((p: FriendProvider) => p.name === filters.provider);
        }
        return false;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((movie) => movie.title?.toLowerCase().includes(searchLower));
    }

    if (filters.quickFilter === 'unrated') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculateFriendRating(m));
        return isNaN(rating) || rating === 0;
      });
    } else if (filters.quickFilter === 'not-started') {
      filtered = filtered.filter((m) => {
        const rating = parseFloat(calculateFriendRating(m));
        return isNaN(rating) || rating === 0;
      });
    }

    const sortBy =
      filters.quickFilter === 'ongoing'
        ? 'rating-desc'
        : filters.quickFilter === 'recently-added'
          ? 'date-desc'
          : filters.sortBy || 'rating-desc';

    filtered.sort((a, b) => {
      const ratingA = parseFloat(calculateFriendRating(a));
      const ratingB = parseFloat(calculateFriendRating(b));

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
  }, [friendMovies, filters]);

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('shouldRestoreFriendProfileScroll');

    if (shouldRestore === 'true' && currentItems.length > 0) {
      sessionStorage.removeItem('shouldRestoreFriendProfileScroll');

      const scrollKey = `friendProfilePageScroll_${friendId}_${activeTab}`;
      const position = sessionStorage.getItem(scrollKey);
      const scrollSource = sessionStorage.getItem(`friendProfilePageScrollSource_${friendId}_${activeTab}`);

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
  }, [friendId, activeTab, currentItems.length]);

  const itemsWithRating = currentItems.filter((item) => {
    const rating = parseFloat(calculateFriendRating(item));
    return !isNaN(rating) && rating > 0;
  });

  const averageRating =
    itemsWithRating.length > 0
      ? itemsWithRating.reduce((acc, item) => acc + parseFloat(calculateFriendRating(item)), 0) / itemsWithRating.length
      : 0;

  const handleItemClick = (item: FriendItem, type: 'series' | 'movie') => {
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
      }
    }

    if (position > 0) {
      try {
        const scrollKey = `friendProfilePageScroll_${friendId}_${activeTab}`;
        sessionStorage.setItem(scrollKey, position.toString());
        sessionStorage.setItem(`friendProfilePageScrollSource_${friendId}_${activeTab}`, scrollSource);
        sessionStorage.setItem('shouldRestoreFriendProfileScroll', 'true');
      } catch (error) {
        console.error('Error saving scroll position:', error);
      }
    }

    navigate(type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
  };

  if (loading) {
    return (
      <PageLayout style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={50} text="Lade Profil..." />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div ref={scrollRef}>

      {/* Premium Header */}
      <PageHeader
        title={friendName}
        gradientTo="#8b5cf6"
        sticky={false}
        subtitle={`Ø ${averageRating.toFixed(1)} | ${itemsWithRating.length} bewertet`}
        actions={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/taste-match/${friendId}`)}
            style={{
              padding: '12px 18px',
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 4px 15px ${currentTheme.primary}40`,
            }}
          >
            <CompareArrows style={{ fontSize: 20 }} />
            Match
          </motion.button>
        }
      />

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
      <div style={{ padding: window.innerWidth >= 768 ? '0 40px 40px' : '0 20px 100px', position: 'relative', zIndex: 5 }}>
        <AnimatePresence mode="wait">
          {currentItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: currentTheme.background.card,
                borderRadius: '20px',
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <Star style={{ fontSize: '56px', marginBottom: '16px', color: currentTheme.text.muted }} />
              <h3 style={{ color: currentTheme.text.primary, margin: '0 0 8px 0', fontWeight: 700 }}>
                Keine {activeTab === 'series' ? 'Serien' : 'Filme'} gefunden
              </h3>
              <p style={{ color: currentTheme.text.muted, margin: 0, fontSize: '14px' }}>
                {friendName} hat noch keine {activeTab === 'series' ? 'Serien' : 'Filme'} bewertet
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'grid',
                gridTemplateColumns:
                  window.innerWidth >= 1200
                    ? 'repeat(8, 1fr)'
                    : window.innerWidth >= 768
                      ? 'repeat(5, 1fr)'
                      : 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: window.innerWidth >= 768 ? '20px' : '16px',
              }}
            >
              {currentItems.map((item, index) => {
                const rating = parseFloat(calculateFriendRating(item));
                const isMovie = 'release_date' in item;

                let progress = 0;
                if (!isMovie && item.seasons) {
                  const today = new Date();
                  let totalAiredEpisodes = 0;
                  let watchedEpisodes = 0;

                  item.seasons.forEach((season) => {
                    if (season.episodes) {
                      const episodes = Array.isArray(season.episodes) ? season.episodes : Object.values(season.episodes || {}) as FriendEpisode[];
                      episodes.forEach((ep: FriendEpisode) => {
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleItemClick(item, isMovie ? 'movie' : 'series')}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img
                        src={getImageUrl(item.poster)}
                        alt={item.title}
                        style={{
                          width: '100%',
                          aspectRatio: '2/3',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          background: currentTheme.background.surface,
                          boxShadow: `0 6px 16px ${currentTheme.background.default}60`,
                        }}
                      />

                      {/* Provider Badges */}
                      {item.provider?.provider && item.provider.provider.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          display: 'flex',
                          gap: '4px',
                        }}>
                          {Array.from(new Set(item.provider.provider.map((p: FriendProvider) => p.name)))
                            .slice(0, 2)
                            .map((name) => {
                              const provider = item.provider?.provider.find((p: FriendProvider) => p.name === name);
                              return provider ? (
                                <div
                                  key={provider.id}
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(20,20,40,0.8))',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '3px',
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
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '4px',
                                      objectFit: 'cover',
                                    }}
                                  />
                                </div>
                              ) : null;
                            })}
                        </div>
                      )}

                      {/* Premium Rating Badge */}
                      {rating > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,40,0.9))',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                          <Star style={{ fontSize: '14px', color: '#ffc107' }} />
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#fff',
                          }}>
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Premium Progress Bar */}
                      {!isMovie && progress > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          height: '5px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '0 0 12px 12px',
                          overflow: 'hidden',
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: index * 0.02 }}
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

                    <h3 style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      margin: '10px 0 0 0',
                      color: currentTheme.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3',
                      minHeight: '34px',
                    }}>
                      {item.title}
                    </h3>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </PageLayout>
  );
};
