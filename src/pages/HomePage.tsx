import {
  AutoAwesome,
  CalendarToday,
  Check,
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
  Tv,
} from '@mui/icons-material';
import { Badge, Chip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { cloneElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGreeting } from '../utils/greetings';
import { useAuth } from '../App';
import { useOptimizedFriends } from '../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useTMDBTrending } from '../hooks/useTMDBTrending';
import { useTopRated } from '../hooks/useTopRated';
import { useWebWorkerStatsOptimized } from '../hooks/useWebWorkerStatsOptimized';
import { useWebWorkerTodayEpisodes } from '../hooks/useWebWorkerTodayEpisodes';
import { HorizontalScrollContainer } from '../components/HorizontalScrollContainer';
import { StatsGrid } from '../components/StatsGrid';
import { NewSeasonNotification } from '../components/NewSeasonNotification';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useAuth();

  // Handle case where auth context might be null
  if (!authContext) {
    return <div>Loading...</div>;
  }

  const { user } = authContext;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }
  const { unreadActivitiesCount } = useOptimizedFriends();
  const { seriesWithNewSeasons, clearNewSeasons } = useSeriesList();
  const { currentTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  // const [selectedCategory, setSelectedCategory] = useState<
  //   'all' | 'series' | 'movies'
  // >('all');
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsetsEpisodes, setDragOffsetsEpisodes] = useState<{
    [key: string]: number;
  }>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());
  const [swipingContinueEpisodes, setSwipingContinueEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsetsContinue, setDragOffsetsContinue] = useState<{
    [key: string]: number;
  }>({});
  const [completingContinueEpisodes, setCompletingContinueEpisodes] = useState<Set<string>>(
    new Set()
  );
  const [hiddenContinueEpisodes, setHiddenContinueEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [greetingInfo, setGreetingInfo] = useState<string | null>(null);
  
  // Close tooltip when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.greeting-text') && !target.closest('.greeting-tooltip')) {
        setGreetingInfo(null);
      }
    };
    
    if (greetingInfo) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [greetingInfo]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update time every second for clock display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // const getUserRating = (rating: any): number => {
  //   if (!rating || !user?.uid) return 0;
  //   return rating[user.uid] || 0;
  // };

  // Use the imported greeting function
  const greeting = useMemo(() => getGreeting(currentTime.getHours()), [currentTime]);

  // Use optimized hooks for heavy computations
  const stats = useWebWorkerStatsOptimized();
  const continueWatching = useContinueWatching();
  const todayEpisodes = useWebWorkerTodayEpisodes();
  const { trending } = useTMDBTrending(); // Use actual TMDB trending data
  const topRated = useTopRated();
  const recommendations: any[] = []; // TODO: Create separate hook if needed

  // Get the total count of series with unwatched episodes in watchlist
  const { seriesList } = useSeriesList();
  const totalSeriesWithUnwatched = useMemo(() => {
    const today = new Date();
    let count = 0;

    for (const series of seriesList) {
      if (!series.watchlist) continue;
      if (!series.seasons) continue;

      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);

      let hasUnwatchedEpisode = false;
      for (const season of seasonsArray as any[]) {
        if (!season?.episodes) continue;
        const episodesArray = Array.isArray(season.episodes)
          ? season.episodes
          : Object.values(season.episodes);

        for (const episode of episodesArray as any[]) {
          if (!episode?.watched && episode?.air_date) {
            const airDate = new Date(episode.air_date);
            if (airDate <= today) {
              hasUnwatchedEpisode = true;
              break;
            }
          }
        }
        if (hasUnwatchedEpisode) break;
      }

      if (hasUnwatchedEpisode) count++;
    }

    return count;
  }, [seriesList]);

  // Handle continue watching episode complete
  const handleContinueEpisodeComplete = async (
    item: any,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const episodeKey = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingContinueEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase
    if (user && item.nmr !== undefined) {
      try {
        const ref = firebase
          .database()
          .ref(
            `${user.uid}/serien/${item.nmr}/seasons/${item.nextEpisode.seasonIndex}/episodes/${item.nextEpisode.episodeIndex}/watched`
          );
        await ref.set(true);

        // Also update watchCount if needed
        const watchCountRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${item.nmr}/seasons/${item.nextEpisode.seasonIndex}/episodes/${item.nextEpisode.episodeIndex}/watchCount`
          );
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);

        // Update firstWatchedAt if this is the first time
        if (currentCount === 0) {
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${item.nmr}/seasons/${item.nextEpisode.seasonIndex}/episodes/${item.nextEpisode.episodeIndex}/firstWatchedAt`
            );
          await firstWatchedRef.set(new Date().toISOString());
        }
      } catch (error) {
        console.error('Error marking episode as watched:', error);
      }
    }

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenContinueEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingContinueEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  // Handle episode swipe to complete
  const handleEpisodeComplete = async (
    episode: any,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase directly (like in MobileNewEpisodesPage)
    if (user) {
      try {
        // Use the pre-calculated 0-based indexes
        const seasonIndex = episode.seasonIndex;
        const episodeIndex = episode.episodeIndex;

        const ref = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/watched`
          );
        await ref.set(true);

        // Also update watchCount if needed
        const watchCountRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/watchCount`
          );
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);

        // Update firstWatchedAt if this is the first time
        if (currentCount === 0) {
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/firstWatchedAt`
            );
          await firstWatchedRef.set(new Date().toISOString());
        }
      } catch (error) {
        console.error('Error marking episode as watched:', error);
      }
    }

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  return (
    <div
      style={{
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* New Season Notification */}
      {seriesWithNewSeasons && seriesWithNewSeasons.length > 0 && (
        <NewSeasonNotification
          series={seriesWithNewSeasons}
          onDismiss={clearNewSeasons}
        />
      )}
      {/* Tooltip - shows language info and is clickable */}
      {greetingInfo && (
        <div
          className="greeting-tooltip"
          onClick={async (e) => {
            e.stopPropagation();
            if (greeting.title && greeting.type) {
              try {
                const apiKey = import.meta.env.VITE_API_TMDB;
                const searchUrl = `https://api.themoviedb.org/3/search/${greeting.type}?api_key=${apiKey}&query=${encodeURIComponent(greeting.title)}&language=de-DE`;
                const response = await fetch(searchUrl);
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                  const result = data.results[0];
                  navigate(`/${greeting.type}/${result.id}`);
                  setGreetingInfo(null);
                }
              } catch (error) {
                console.error('Error searching TMDB:', error);
              }
            }
          }}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 99999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            color: '#ffffff',
            pointerEvents: 'auto',
            cursor: greeting.title ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ color: '#ffffff' }}>
            {greetingInfo}
            {greeting.title && ' →'}
          </span>
        </div>
      )}
      
      {/* Premium Header */}
      <header
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
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
                fontSize: '24px',
                fontWeight: 800,
                margin: '0 0 4px 0',
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <span 
                className="greeting-text"
                onClick={(e) => {
                  e.stopPropagation();
                  setGreetingInfo(greetingInfo ? null : greeting.lang);
                }}
                style={{ 
                  cursor: 'pointer',
                  textDecoration: greeting.title ? 'underline dotted' : 'none',
                  textDecorationColor: currentTheme.primary,
                  textUnderlineOffset: '3px',
                }}
              >
                {greeting.text}
              </span>
              , {user?.displayName?.split(' ')[0] || 'User'}!
            </h1>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: 0,
              }}
            >
              {currentTime.toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })} • {currentTime.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })} Uhr
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Badge badgeContent={unreadActivitiesCount} color="error">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/activity')}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${currentTheme.primary}1A`,
                  border: `1px solid ${currentTheme.primary}33`,
                  color: currentTheme.text.primary,
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
                border: `2px solid ${currentTheme.primary}`,
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
            background: `${currentTheme.background.surface}`,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Search style={{ fontSize: '20px', color: currentTheme.text.muted }} />
          <span style={{ color: currentTheme.text.muted, fontSize: '14px' }}>
            Suche nach Serien oder Filmen
          </span>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <HorizontalScrollContainer
        gap={8}
        style={{
          padding: '0 20px',
          marginBottom: '20px',
        }}
      >
        <Chip
          icon={<PlayCircle />}
          label={`${stats.watchedEpisodes} Episoden`}
          onClick={() => navigate('/stats')}
          style={{
            background: `${currentTheme.status.success}1A`,
            border: `1px solid ${currentTheme.status.success}4D`,
            color: currentTheme.status.success,
          }}
        />
        <Chip
          icon={<MovieIcon />}
          label={`${stats.totalMovies} Filme`}
          onClick={() => navigate('/ratings?tab=movies')}
          style={{
            background: `${currentTheme.status.error}1A`,
            border: `1px solid ${currentTheme.status.error}4D`,
            color: currentTheme.status.error,
          }}
        />
        <Chip
          icon={<TrendingUp />}
          label={`${stats.progress}% Fortschritt`}
          onClick={() => navigate('/stats')}
          style={{
            background: `${currentTheme.primary}1A`,
            border: `1px solid ${currentTheme.primary}4D`,
            color: currentTheme.primary,
          }}
        />
        {stats.todayEpisodes > 0 && (
          <Chip
            icon={<NewReleases />}
            label={`${stats.todayEpisodes} Heute`}
            onClick={() => navigate('/new-episodes')}
            style={{
              background: `${currentTheme.status.warning}1A`,
              border: `1px solid ${currentTheme.status.warning}4D`,
              color: currentTheme.status.warning,
            }}
          />
        )}
      </HorizontalScrollContainer>

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
            borderRadius: isDesktop ? '16px' : '16px',
            padding: isDesktop ? '12px' : '14px',
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
              width: isDesktop ? '60px' : '80px',
              height: isDesktop ? '60px' : '80px',
              background: `${currentTheme.status.success}33`,
              borderRadius: '50%',
              filter: 'blur(30px)',
            }}
          />

          <PlayCircle
            style={{
              fontSize: isDesktop ? '24px' : '24px',
              color: currentTheme.status.success,
              marginBottom: isDesktop ? '4px' : '8px',
            }}
          />
          <h3 style={{ fontSize: isDesktop ? '14px' : '14px', fontWeight: 700, margin: '0 0 2px 0' }}>Weiterschauen</h3>
          <p
            style={{
              fontSize: isDesktop ? '11px' : '12px',
              color: currentTheme.text.secondary,
              margin: 0,
            }}
          >
            {totalSeriesWithUnwatched} Serien bereit
          </p>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/discover')}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}33 0%, ${currentTheme.accent}33 100%)`,
            border: `1px solid ${currentTheme.primary}4D`,
            borderRadius: isDesktop ? '16px' : '16px',
            padding: isDesktop ? '12px' : '14px',
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
              width: isDesktop ? '60px' : '80px',
              height: isDesktop ? '60px' : '80px',
              background: `${currentTheme.primary}33`,
              borderRadius: '50%',
              filter: 'blur(30px)',
            }}
          />

          <AutoAwesome
            style={{
              fontSize: isDesktop ? '24px' : '24px',
              color: currentTheme.primary,
              marginBottom: isDesktop ? '4px' : '8px',
            }}
          />
          <h3 style={{ fontSize: isDesktop ? '14px' : '14px', fontWeight: 700, margin: '0 0 2px 0' }}>Entdecken</h3>
          <p
            style={{
              fontSize: isDesktop ? '11px' : '12px',
              color: currentTheme.text.secondary,
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
            color: currentTheme.status.warning,
          },
          {
            icon: <CalendarToday />,
            label: 'Kalender',
            path: '/new-episodes',
            color: currentTheme.status.success,
          },
          {
            icon: <EmojiEvents />,
            label: 'Badges',
            path: '/badges',
            color: currentTheme.status.error,
          },
          {
            icon: <Group />,
            label: 'Freunde',
            path: '/activity',
            color: currentTheme.status.info.main,
          },
        ].map((action, index) => (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(action.path)}
            style={{
              padding: isDesktop ? '10px 6px' : '10px 8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: isDesktop ? '12px' : '12px',
              color: action.color,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isDesktop ? '4px' : '6px',
            }}
          >
            {cloneElement(action.icon, { style: { fontSize: isDesktop ? '18px' : '18px' } })}
            <span
              style={{
                fontSize: isDesktop ? '11px' : '11px',
                fontWeight: 600,
                color: currentTheme.text.primary,
              }}
            >
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Continue Watching Section - Like Today New */}
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
                color: currentTheme.text.secondary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Alle <ChevronRight style={{ fontSize: '16px', verticalAlign: 'middle' }} />
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
              {continueWatching
                .filter(
                  (item) =>
                    !hiddenContinueEpisodes.has(
                      `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`
                    )
                )
                .slice(0, 4) // Max 4 episodes like requested
                .map((item) => {
                  const episodeKey = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;
                  const isCompleting = completingContinueEpisodes.has(episodeKey);
                  const isSwiping = swipingContinueEpisodes.has(episodeKey);

                  return (
                    <motion.div
                      key={episodeKey}
                      data-block-swipe
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isCompleting ? 0.5 : 1,
                        y: 0,
                        scale: isCompleting ? 0.95 : 1,
                      }}
                      exit={{
                        opacity: 0,
                        x: swipeDirections[episodeKey] === 'left' ? -300 : 300,
                        transition: { duration: 0.3 },
                      }}
                      style={{
                        position: 'relative',
                      }}
                    >
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        dragSnapToOrigin
                        onDragStart={() => {
                          setSwipingContinueEpisodes((prev) => new Set(prev).add(episodeKey));
                        }}
                        onDrag={(_event, info: PanInfo) => {
                          setDragOffsetsContinue((prev) => ({
                            ...prev,
                            [episodeKey]: info.offset.x,
                          }));
                        }}
                        onDragEnd={(event, info: PanInfo) => {
                          event.stopPropagation();
                          setSwipingContinueEpisodes((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(episodeKey);
                            return newSet;
                          });
                          setDragOffsetsContinue((prev) => {
                            const newOffsets = { ...prev };
                            delete newOffsets[episodeKey];
                            return newOffsets;
                          });

                          if (Math.abs(info.offset.x) > 100) {
                            const direction = info.offset.x > 0 ? 'right' : 'left';
                            handleContinueEpisodeComplete(item, direction);
                          }
                        }}
                        whileDrag={{ scale: 1.02 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '70px', // Start after the poster
                          right: 0,
                          bottom: 0,
                          zIndex: 1,
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isCompleting
                            ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(0, 212, 170, 0.05))'
                            : `rgba(76, 209, 55, ${Math.min(
                                (Math.abs(dragOffsetsContinue[episodeKey] || 0) / 100) * 0.15,
                                0.15
                              )})`,
                          border: `1px solid ${
                            isCompleting
                              ? 'rgba(76, 209, 55, 0.5)'
                              : `rgba(76, 209, 55, ${
                                  0.2 +
                                  Math.min(
                                    (Math.abs(dragOffsetsContinue[episodeKey] || 0) / 100) * 0.3,
                                    0.3
                                  )
                                })`
                          }`,
                          transition: dragOffsetsContinue[episodeKey] ? 'none' : 'all 0.3s ease',
                          borderRadius: '12px',
                          padding: '12px',
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
                            background:
                              'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))',
                            opacity: 0,
                          }}
                          animate={{
                            opacity: isSwiping ? 1 : 0,
                          }}
                        />

                        <img
                          src={item.poster}
                          alt={item.title}
                          onClick={() => navigate(`/series/${item.id}`)}
                          style={{
                            width: '50px',
                            height: '75px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            pointerEvents: 'none',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        >
                          <h4
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              margin: '0 0 2px 0',
                            }}
                          >
                            {item.title}
                          </h4>
                          <p
                            style={{
                              fontSize: '12px',
                              margin: 0,
                              color: '#00d4aa',
                            }}
                          >
                            S{item.nextEpisode.seasonNumber} E{item.nextEpisode.episodeNumber} •{' '}
                            {item.nextEpisode.name}
                          </p>
                          <div
                            style={{
                              marginTop: '4px',
                              height: '3px',
                              background: currentTheme.border.default,
                              borderRadius: '1.5px',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${item.progress}%`,
                                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.status.success})`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {isCompleting ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                            >
                              <Check
                                style={{
                                  fontSize: '24px',
                                  color: currentTheme.status.success,
                                }}
                              />
                            </motion.div>
                          ) : (
                            <motion.div animate={{ x: isSwiping ? 10 : 0 }}>
                              <PlayCircle
                                style={{
                                  fontSize: '20px',
                                  color: currentTheme.status.success,
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
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
                color: currentTheme.text.secondary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Alle <ChevronRight style={{ fontSize: '16px', verticalAlign: 'middle' }} />
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
                .filter(
                  (ep) =>
                    !hiddenEpisodes.has(`${ep.seriesId}-${ep.seasonNumber}-${ep.episodeNumber}`)
                )
                .slice(0, 5)
                .map((episode) => {
                  const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;
                  const isCompleting = completingEpisodes.has(episodeKey);
                  const isSwiping = swipingEpisodes.has(episodeKey);

                  return (
                    <motion.div
                      key={episodeKey}
                      data-block-swipe
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isCompleting ? 0.5 : 1,
                        y: 0,
                        scale: isCompleting ? 0.95 : 1,
                      }}
                      exit={{
                        opacity: 0,
                        x: swipeDirections[episodeKey] === 'left' ? -300 : 300,
                        transition: { duration: 0.3 },
                      }}
                      style={{
                        position: 'relative',
                      }}
                    >
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        dragSnapToOrigin
                        onDragStart={() => {
                          setSwipingEpisodes((prev) => new Set(prev).add(episodeKey));
                        }}
                        onDrag={(_event, info: PanInfo) => {
                          setDragOffsetsEpisodes((prev) => ({
                            ...prev,
                            [episodeKey]: info.offset.x,
                          }));
                        }}
                        onDragEnd={(event, info: PanInfo) => {
                          event.stopPropagation();
                          setSwipingEpisodes((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(episodeKey);
                            return newSet;
                          });
                          setDragOffsetsEpisodes((prev) => {
                            const newOffsets = { ...prev };
                            delete newOffsets[episodeKey];
                            return newOffsets;
                          });

                          if (Math.abs(info.offset.x) > 100 && !episode.watched) {
                            const direction = info.offset.x > 0 ? 'right' : 'left';
                            handleEpisodeComplete(episode, direction);
                          }
                        }}
                        whileDrag={{ scale: 1.02 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '70px', // Start after the poster
                          right: 0,
                          bottom: 0,
                          zIndex: 1,
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isCompleting
                            ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(255, 215, 0, 0.05))'
                            : episode.watched
                              ? 'rgba(76, 209, 55, 0.1)'
                              : `rgba(76, 209, 55, ${Math.min(
                                  (Math.abs(dragOffsetsEpisodes[episodeKey] || 0) / 100) * 0.15,
                                  0.15
                                )})`,
                          border: `1px solid ${
                            isCompleting
                              ? 'rgba(76, 209, 55, 0.5)'
                              : episode.watched
                                ? 'rgba(76, 209, 55, 0.3)'
                                : `rgba(76, 209, 55, ${
                                    0.2 +
                                    Math.min(
                                      (Math.abs(dragOffsetsEpisodes[episodeKey] || 0) / 100) * 0.3,
                                      0.3
                                    )
                                  })`
                          }`,
                          transition: dragOffsetsEpisodes[episodeKey] ? 'none' : 'all 0.3s ease',
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
                            background:
                              'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))',
                            opacity: 0,
                          }}
                          animate={{
                            opacity: isSwiping ? 1 : 0,
                          }}
                        />

                        <img
                          src={episode.poster}
                          alt={episode.seriesTitle}
                          onClick={() => navigate(`/series/${episode.seriesId}`)}
                          style={{
                            width: '50px',
                            height: '75px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 2,
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
                          <p
                            style={{
                              fontSize: '12px',
                              margin: 0,
                              color: episode.watched ? '#4cd137' : '#ffd700',
                            }}
                          >
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
                              <Check
                                style={{
                                  fontSize: '24px',
                                  color: currentTheme.status.success,
                                }}
                              />
                            </motion.div>
                          ) : episode.watched ? (
                            <CheckCircle
                              style={{
                                fontSize: '20px',
                                color: currentTheme.status.success,
                              }}
                            />
                          ) : (
                            <motion.div animate={{ x: isSwiping ? 10 : 0 }}>
                              <PlayCircle
                                style={{
                                  fontSize: '20px',
                                  color: currentTheme.status.warning,
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
              <LocalFireDepartment style={{ fontSize: '24px', color: currentTheme.status.error }} />
              Trending diese Woche
            </h2>
          </div>

          <HorizontalScrollContainer
            gap={12}
            style={{
              padding: '0 20px',
            }}
          >
            {trending.map((item, index) => (
              <motion.div
                key={`trending-${item.type}-${item.id}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  minWidth: window.innerWidth >= 768 ? '240px' : '140px',
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
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      zIndex: 1,
                    }}
                  >
                    <TrendingUp style={{ fontSize: '12px' }} />#{index + 1}
                  </div>

                  {/* Type Badge (Movie/Series) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      background:
                        item.type === 'movie'
                          ? 'rgba(255, 193, 7, 0.9)'
                          : 'rgba(102, 126, 234, 0.9)',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {item.type === 'movie' ? (
                      <>
                        <MovieIcon style={{ fontSize: '10px' }} />
                        Film
                      </>
                    ) : (
                      <>
                        <Tv style={{ fontSize: '10px' }} />
                        Serie
                      </>
                    )}
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </h4>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    color: currentTheme.text.muted,
                    marginTop: '2px',
                  }}
                >
                  <Star style={{ fontSize: '14px', color: '#ffd43b' }} />
                  <span>{item.rating ? item.rating.toFixed(1) : 'N/A'}</span>
                </div>
              </motion.div>
            ))}
          </HorizontalScrollContainer>
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
                color: currentTheme.text.secondary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Alle <ChevronRight style={{ fontSize: '16px', verticalAlign: 'middle' }} />
            </button>
          </div>

          <HorizontalScrollContainer
            gap={12}
            style={{
              padding: '0 20px',
            }}
          >
            {topRated.map((item, index) => (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  minWidth: window.innerWidth >= 768 ? '240px' : '140px',
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
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Star
                      style={{
                        fontSize: '13px',
                        color: currentTheme.status.warning,
                      }}
                    />
                    {item.rating.toFixed(1)}
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: '14px',
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
          </HorizontalScrollContainer>
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

          <HorizontalScrollContainer
            gap={12}
            style={{
              padding: '0 20px',
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
          </HorizontalScrollContainer>
        </section>
      )}

      {/* Quick Stats Component */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <StatsGrid />
      </div>
    </div>
  );
};
