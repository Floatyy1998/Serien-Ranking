import {
  AutoAwesome,
  CalendarToday,
  CheckCircle,
  ChevronRight,
  EmojiEvents,
  Group,
  LocalFireDepartment,
  Movie as MovieIcon,
  NewReleases,
  Notifications,
  PlayCircle,
  Search,
  Star,
  TrendingUp,
  Check,
} from '@mui/icons-material';
import { Badge, Chip } from '@mui/material';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { calculateOverallRating } from '../../lib/rating/rating';
import { MobileStatsGrid } from '../components/MobileStatsGrid';
import { useTheme } from '../../contexts/ThemeContext';

export const MobileHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { unreadActivitiesCount } = useOptimizedFriends();
  const { currentTheme, getMobilePageStyle } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  // const [selectedCategory, setSelectedCategory] = useState<
  //   'all' | 'series' | 'movies'
  // >('all');
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper functions
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // const getUserRating = (rating: any): number => {
  //   if (!rating || !user?.uid) return 0;
  //   return rating[user.uid] || 0;
  // };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 17) return 'Guten Tag';
    if (hour < 22) return 'Guten Abend';
    return 'Gute Nacht';
  };

  // Quick stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Series statistics
    let totalSeries = 0;
    let watchlistCount = 0;
    let watchedEpisodes = 0;
    let totalAiredEpisodes = 0;
    let todayEpisodesCount = 0;
    let todayUnwatchedEpisodes = 0;
    
    seriesList.forEach(series => {
      if (series && series.nmr) { // Only count valid series
        totalSeries++;
        
        if (series.watchlist === true) {
          watchlistCount++;
        }
        
        // Count episodes - only aired ones
        series.seasons?.forEach(season => {
          season.episodes?.forEach(episode => {
            if (episode.air_date) {
              const airDate = new Date(episode.air_date);
              
              // Only count episodes that have aired
              if (!isNaN(airDate.getTime())) {
                airDate.setHours(0, 0, 0, 0);
                if (airDate <= today) {
                  totalAiredEpisodes++;
                  if (episode.watched === true) {
                    watchedEpisodes++;
                  }
                }
              }
              
              // Count today's episodes
              if (!isNaN(airDate.getTime())) {
                const normalizedAirDate = new Date(airDate);
                normalizedAirDate.setHours(0, 0, 0, 0);
                if (normalizedAirDate.getTime() === today.getTime()) {
                  todayEpisodesCount++;
                  if (!episode.watched) {
                    todayUnwatchedEpisodes++;
                  }
                }
              }
            }
          });
        });
      }
    });
    
    // Movie statistics - "watched" means "rated" for movies
    let totalMovies = 0;
    let watchedMovies = 0;
    
    movieList.forEach(movie => {
      if (movie && movie.nmr) { // Only count valid movies
        totalMovies++;
        
        // For movies: watched = has a rating from the user
        if (movie.rating && user) {
          const userRating = movie.rating[user.uid];
          if (userRating && userRating > 0) {
            watchedMovies++;
          }
        }
      }
    });
    
    // Calculate progress only for aired episodes
    const progress = totalAiredEpisodes > 0 
      ? Math.round((watchedEpisodes / totalAiredEpisodes) * 100)
      : 0;

    return {
      totalSeries,
      totalMovies,
      watchedEpisodes,
      totalEpisodes: totalAiredEpisodes, // Only count aired episodes
      watchedMovies,
      watchlistCount,
      todayEpisodes: todayUnwatchedEpisodes, // Only show unwatched episodes from today
      progress,
    };
  }, [seriesList, movieList, user]);

  // Continue watching with better logic
  const continueWatching = useMemo(() => {
    const items: any[] = [];

    // Get series with next episodes
    seriesList.forEach((series) => {
      // Only include series that are on the watchlist
      if (!series.watchlist) return;

      const today = new Date();
      
      // Find next unwatched episode that has already aired
      for (const season of series.seasons || []) {
        for (const [index, episode] of (season.episodes || []).entries()) {
          // Check if episode has aired and is not watched
          if (!episode.watched && episode.air_date) {
            const airDate = new Date(episode.air_date);
            if (airDate <= today) {
              // This episode has aired but not watched - add to continue watching
              
              // Calculate progress for this series (only aired episodes)
              let totalAiredEpisodes = 0;
              let watchedEpisodes = 0;
              
              series.seasons?.forEach((s) => {
                s.episodes?.forEach((ep) => {
                  if (ep.air_date) {
                    const epAirDate = new Date(ep.air_date);
                    if (epAirDate <= today) {
                      totalAiredEpisodes++;
                      if (ep.watched) watchedEpisodes++;
                    }
                  }
                });
              });
              
              const percentage = totalAiredEpisodes > 0 
                ? (watchedEpisodes / totalAiredEpisodes) * 100 
                : 0;
              
              items.push({
                type: 'series',
                id: series.id,
                title: series.title,
                poster: getImageUrl(series.poster),
                progress: percentage,
                nextEpisode: {
                  season: season.seasonNumber,
                  episode: index + 1,
                  name: episode.name,
                },
                airDate: episode.air_date,
              });
              return; // Stop after finding the first unwatched aired episode
            }
          }
        }
      }
    });

    return items.slice(0, 10);
  }, [seriesList]);

  // Today's episodes - only unwatched
  const todayEpisodes = useMemo(() => {
    // Use same logic as MobileNewEpisodesPage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const episodes: any[] = [];
    
    // Debug: Log today's date
    console.log('Today (normalized):', today);

    seriesList.forEach((series) => {
      series.seasons?.forEach((season) => {
        season.episodes?.forEach((episode, index) => {
          // Debug: Log episode dates
          if (episode.air_date) {
            const episodeDate = new Date(episode.air_date);
            if (!isNaN(episodeDate.getTime())) {
              episodeDate.setHours(0, 0, 0, 0);
              console.log(`Episode "${episode.name || 'Unnamed'}" air_date:`, episode.air_date, 'normalized:', episodeDate, 'matches today:', episodeDate.getTime() === today.getTime());
              
                // Only show episodes from today that are NOT watched
                if (episodeDate.getTime() === today.getTime() && !episode.watched) {
                  episodes.push({
                    seriesId: series.id,
                    seriesNmr: series.nmr, // Add nmr for Firebase update
                    seriesTitle: series.title,
                    poster: getImageUrl(series.poster),
                    seasonNumber: season.seasonNumber || 1,
                    episodeNumber: index + 1,
                    seasonIndex: season.seasonNumber ? season.seasonNumber - 1 : 0,  // 0-based for Firebase
                    episodeIndex: index,  // Already 0-based
                    episodeId: episode.id,
                    episodeName: episode.name,
                    watched: episode.watched,
                  });
                }
              }
            }
        });
      });
    });

    return episodes;
  }, [seriesList]);
  
  // Handle episode swipe to complete
  const handleEpisodeComplete = async (episode: any) => {
    const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;
    
    // Add to completing set for animation
    setCompletingEpisodes(prev => new Set(prev).add(episodeKey));
    
    // Mark episode as watched in Firebase directly (like in MobileNewEpisodesPage)
    if (user) {
      try {
        // Use the pre-calculated 0-based indexes
        const seasonIndex = episode.seasonIndex;
        const episodeIndex = episode.episodeIndex;
        
        const ref = firebase.database()
          .ref(`${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/watched`);
        await ref.set(true);
        
        // Also update watchCount if needed
        const watchCountRef = firebase.database()
          .ref(`${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/watchCount`);
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);
        
        // Update firstWatchedAt if this is the first time
        if (currentCount === 0) {
          const firstWatchedRef = firebase.database()
            .ref(`${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/firstWatchedAt`);
          await firstWatchedRef.set(new Date().toISOString());
        }
        
      } catch (error) {
        console.error('Error marking episode as watched:', error);
      }
    }
    
    // After animation, hide the episode
    setTimeout(() => {
      setHiddenEpisodes(prev => new Set(prev).add(episodeKey));
      setCompletingEpisodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  // Trending (most watched recently)
  const trending = useMemo(() => {
    const items: any[] = [];

    // Get recently watched series
    const recentSeries = seriesList.filter((series) => {
      const hasRecent = series.seasons?.some((season) =>
        season.episodes?.some((ep) => {
          if (!ep.firstWatchedAt) return false;
          const watchDate = new Date(ep.firstWatchedAt);
          const daysSince =
            (Date.now() - watchDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince <= 7;
        })
      );
      return hasRecent;
    });

    recentSeries.forEach((series) => {
      items.push({
        type: 'series',
        id: series.id,
        title: series.title,
        poster: getImageUrl(series.poster),
        rating: parseFloat(calculateOverallRating(series)),
      });
    });

    return items.slice(0, 10);
  }, [seriesList]);

  // Top rated
  const topRated = useMemo(() => {
    const items: any[] = [];

    // Add top series
    seriesList
      .filter((s) => parseFloat(calculateOverallRating(s)) > 0)
      .sort(
        (a, b) =>
          parseFloat(calculateOverallRating(b)) -
          parseFloat(calculateOverallRating(a))
      )
      .slice(0, 5)
      .forEach((series) => {
        items.push({
          type: 'series',
          id: series.id,
          title: series.title,
          poster: getImageUrl(series.poster),
          rating: parseFloat(calculateOverallRating(series)),
        });
      });

    // Add top movies
    movieList
      .filter((m) => parseFloat(calculateOverallRating(m)) > 0)
      .sort(
        (a, b) =>
          parseFloat(calculateOverallRating(b)) -
          parseFloat(calculateOverallRating(a))
      )
      .slice(0, 5)
      .forEach((movie) => {
        items.push({
          type: 'movie',
          id: movie.id,
          title: movie.title,
          poster: getImageUrl(movie.poster),
          rating: parseFloat(calculateOverallRating(movie)),
        });
      });

    return items.sort((a, b) => b.rating - a.rating).slice(0, 10);
  }, [seriesList, movieList]);

  // Recommendations (unwatched highly rated)
  const recommendations = useMemo(() => {
    const items: any[] = [];

    // Get unwatched series with high TMDB rating
    seriesList
      .filter((s) => {
        const progress =
          s.seasons?.reduce((acc, season) => {
            const watched =
              season.episodes?.filter((e) => e.watched).length || 0;
            return acc + watched;
          }, 0) || 0;
        return progress === 0 && s.vote_average > 7;
      })
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 10)
      .forEach((series) => {
        items.push({
          type: 'series',
          id: series.id,
          title: series.title,
          poster: getImageUrl(series.poster),
          tmdbRating: series.vote_average,
        });
      });

    return items;
  }, [seriesList]);

  return (
    <div
      style={{
        ...getMobilePageStyle(),
        overflowY: 'auto',
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          background:
            'linear-gradient(180deg, rgba(102, 126, 234, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
          padding: '20px',
          paddingTop: 'calc(30px + env(safe-area-inset-top))',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 800,
                margin: '0 0 4px 0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {getGreeting()}, {user?.displayName?.split(' ')[0] || 'User'}!
            </h1>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: 0,
              }}
            >
              {currentTime.toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Badge badgeContent={unreadActivitiesCount} color='error'>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/activity')}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Notifications style={{ fontSize: '20px' }} />
              </motion.button>
            </Badge>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile')}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `url(${user?.photoURL}) center/cover`,
                border: '2px solid var(--color-primary, #667eea)',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/search')}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Search
            style={{ fontSize: '20px', color: currentTheme.text.muted }}
          />
          <span style={{ color: currentTheme.text.muted, fontSize: '14px' }}>
            Suche nach Serien oder Filmen
          </span>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 20px',
          marginBottom: '20px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <Chip
          icon={<PlayCircle />}
          label={`${stats.watchedEpisodes} Episoden`}
          onClick={() => navigate('/stats')}
          style={{
            background: 'rgba(0, 212, 170, 0.1)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            color: '#00d4aa',
          }}
        />
        <Chip
          icon={<MovieIcon />}
          label={`${stats.totalMovies} Filme`}
          onClick={() => navigate('/ratings?tab=movies')}
          style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            color: '#ff6b6b',
          }}
        />
        <Chip
          icon={<TrendingUp />}
          label={`${stats.progress}% Fortschritt`}
          onClick={() => navigate('/stats')}
          style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            color: '#667eea',
          }}
        />
        {stats.todayEpisodes > 0 && (
          <Chip
            icon={<NewReleases />}
            label={`${stats.todayEpisodes} Heute`}
            onClick={() => navigate('/today-episodes')}
            style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#ffd700',
            }}
          />
        )}
      </div>

      {/* Main Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          padding: '0 20px',
          marginBottom: '24px',
        }}
      >
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/watchlist')}
          style={{
            background:
              'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 180, 216, 0.2) 100%)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'rgba(0, 212, 170, 0.2)',
              borderRadius: '50%',
              filter: 'blur(30px)',
            }}
          />

          <PlayCircle
            style={{ fontSize: '32px', color: currentTheme.status.success, marginBottom: '8px' }}
          />
          <h3
            style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}
          >
            Weiterschauen
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
            }}
          >
            {continueWatching.length} Serien bereit
          </p>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/discover')}
          style={{
            background:
              'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'rgba(102, 126, 234, 0.2)',
              borderRadius: '50%',
              filter: 'blur(30px)',
            }}
          />

          <AutoAwesome
            style={{ fontSize: '32px', color: currentTheme.primary, marginBottom: '8px' }}
          />
          <h3
            style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}
          >
            Entdecken
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
            }}
          >
            Neue Inhalte finden
          </p>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '0 20px',
          marginBottom: '32px',
        }}
      >
        {[
          {
            icon: <Star />,
            label: 'Ratings',
            path: '/ratings',
            color: '#ffd700',
          },
          {
            icon: <CalendarToday />,
            label: 'Kalender',
            path: '/today-episodes',
            color: '#4cd137',
          },
          {
            icon: <EmojiEvents />,
            label: 'Badges',
            path: '/badges',
            color: '#ff6b6b',
          },
          {
            icon: <Group />,
            label: 'Freunde',
            path: '/activity',
            color: '#00b4d8',
          },
        ].map((action, index) => (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(action.path)}
            style={{
              padding: '16px 8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              color: action.color,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {React.cloneElement(action.icon, { style: { fontSize: '22px' } })}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <PlayCircle style={{ fontSize: '24px', color: currentTheme.status.success }} />
              Weiterschauen
            </h2>
            <button
              onClick={() => navigate('/watchlist')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Alle{' '}
              <ChevronRight
                style={{ fontSize: '16px', verticalAlign: 'middle' }}
              />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '0 20px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {continueWatching.map((item, index) => (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/series/${item.id}`)}
                style={{
                  minWidth: '140px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <img
                    src={item.poster}
                    alt={item.title}
                    style={{
                      width: '100%',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                  />

                  {/* Progress Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '4px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '0 0 12px 12px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.progress}%`,
                        background: 'linear-gradient(90deg, #00d4aa, #00b4d8)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Play Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '50%',
                      padding: '6px',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <PlayCircle
                      style={{ fontSize: '20px', color: currentTheme.status.success }}
                    />
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    margin: '0 0 2px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </h4>

                {item.nextEpisode && (
                  <p
                    style={{
                      fontSize: '11px',
                      margin: 0,
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    S{item.nextEpisode.season + 1} E{item.nextEpisode.episode}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Today's Episodes */}
      {todayEpisodes.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <NewReleases style={{ fontSize: '24px', color: currentTheme.status.warning }} />
              Heute Neu
            </h2>
            <button
              onClick={() => navigate('/new-episodes')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Alle{' '}
              <ChevronRight
                style={{ fontSize: '16px', verticalAlign: 'middle' }}
              />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '0 20px',
              position: 'relative',
            }}
          >
            <AnimatePresence mode="popLayout">
              {todayEpisodes
                .filter(ep => !hiddenEpisodes.has(`${ep.seriesId}-${ep.seasonNumber}-${ep.episodeNumber}`))
                .slice(0, 5)
                .map((episode) => {
                  const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;
                  const isCompleting = completingEpisodes.has(episodeKey);
                  const isSwiping = swipingEpisodes.has(episodeKey);
                  
                  return (
                    <motion.div
                      key={episodeKey}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: isCompleting ? 0.5 : 1, 
                        y: 0,
                        scale: isCompleting ? 0.95 : 1,
                      }}
                      exit={{ 
                        opacity: 0, 
                        x: 300,
                        transition: { duration: 0.3 }
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragStart={() => {
                        setSwipingEpisodes(prev => new Set(prev).add(episodeKey));
                      }}
                      onDragEnd={(_event, info: PanInfo) => {
                        setSwipingEpisodes(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(episodeKey);
                          return newSet;
                        });
                        
                        // If swiped more than 100px to the right, mark as complete
                        if (info.offset.x > 100 && !episode.watched) {
                          handleEpisodeComplete(episode);
                        }
                      }}
                      whileDrag={{ scale: 1.02 }}
                      onClick={() => !isSwiping && navigate(`/series/${episode.seriesId}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: isCompleting 
                          ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(255, 215, 0, 0.05))'
                          : episode.watched 
                          ? 'rgba(76, 209, 55, 0.1)'
                          : 'rgba(255, 215, 0, 0.05)',
                        border: `1px solid ${
                          isCompleting 
                            ? 'rgba(76, 209, 55, 0.5)' 
                            : episode.watched 
                            ? 'rgba(76, 209, 55, 0.3)'
                            : 'rgba(255, 215, 0, 0.2)'
                        }`,
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Swipe Indicator Background */}
                      <motion.div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))',
                          opacity: 0,
                        }}
                        animate={{
                          opacity: isSwiping ? 1 : 0,
                        }}
                      />
                      
                      <img
                        src={episode.poster}
                        alt={episode.seriesTitle}
                        style={{
                          width: '50px',
                          height: '75px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          pointerEvents: 'none',
                        }}
                      />
                      <div style={{ flex: 1, pointerEvents: 'none' }}>
                        <h4
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            margin: '0 0 2px 0',
                          }}
                        >
                          {episode.seriesTitle}
                        </h4>
                        <p style={{ 
                          fontSize: '12px', 
                          margin: 0, 
                          color: episode.watched ? '#4cd137' : '#ffd700' 
                        }}>
                          S{episode.seasonNumber + 1} E{episode.episodeNumber} •{' '}
                          {episode.episodeName}
                        </p>
                      </div>
                      
                      <AnimatePresence mode="wait">
                        {isCompleting ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                          >
                            <Check style={{ fontSize: '24px', color: currentTheme.status.success }} />
                          </motion.div>
                        ) : episode.watched ? (
                          <CheckCircle style={{ fontSize: '20px', color: currentTheme.status.success }} />
                        ) : (
                          <motion.div
                            animate={{ x: isSwiping ? 10 : 0 }}
                          >
                            <PlayCircle style={{ fontSize: '20px', color: currentTheme.status.warning }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Trending Section */}
      {trending.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <LocalFireDepartment
                style={{ fontSize: '24px', color: currentTheme.status.error }}
              />
              Trending diese Woche
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '0 20px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {trending.map((item, index) => (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  minWidth: '100px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  <img
                    src={item.poster}
                    alt={item.title}
                    style={{
                      width: '100%',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: '10px',
                    }}
                  />

                  {/* Trending Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: 'linear-gradient(135deg, #ff6b6b, #ff4757)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <TrendingUp style={{ fontSize: '10px' }} />#{index + 1}
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </h4>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Star style={{ fontSize: '24px', color: currentTheme.status.warning }} />
              Bestbewertet
            </h2>
            <button
              onClick={() => navigate('/ratings')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Alle{' '}
              <ChevronRight
                style={{ fontSize: '16px', verticalAlign: 'middle' }}
              />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '0 20px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {topRated.map((item, index) => (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  minWidth: '100px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  <img
                    src={item.poster}
                    alt={item.title}
                    style={{
                      width: '100%',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: '10px',
                    }}
                  />

                  {/* Rating Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '8px',
                      padding: '4px 6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Star style={{ fontSize: '11px', color: currentTheme.status.warning }} />
                    {item.rating.toFixed(1)}
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </h4>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AutoAwesome style={{ fontSize: '24px', color: currentTheme.primary }} />
              Empfehlungen für dich
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '0 20px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {recommendations.map((item, index) => (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  minWidth: '120px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  <img
                    src={item.poster}
                    alt={item.title}
                    style={{
                      width: '100%',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: '10px',
                    }}
                  />

                  {/* TMDB Rating */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '8px',
                      padding: '4px',
                      fontSize: '10px',
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    TMDB {item.tmdbRating.toFixed(1)} ⭐
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.title}
                </h4>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats Component */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <MobileStatsGrid />
      </div>
    </div>
  );
};
