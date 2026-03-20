import {
  AutoAwesome,
  CalendarMonth,
  CalendarToday,
  EmojiEvents,
  Group,
  History,
  LocalFireDepartment,
  PlayCircle,
  Star,
  Tv,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { BottomSheet, SectionHeader } from '../../components/ui';
import { CarouselNotification } from '../../components/ui/CarouselNotification';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useEpisodeSwipeHandlers } from '../../hooks/useEpisodeSwipeHandlers';
import { useRewatchEpisodes } from '../../hooks/useRewatchEpisodes';
import { useSeasonalRecommendations } from '../../hooks/useSeasonalRecommendations';
import { useSeriesCountdowns } from '../../hooks/useSeriesCountdowns';
import { useTMDBTrending } from '../../hooks/useTMDBTrending';
import { useTopRated } from '../../hooks/useTopRated';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import type { Series } from '../../types/Series';
import { CatchUpCard } from './CatchUpCard';
import { HiddenSeriesCard } from './HiddenSeriesCard';
import { NotificationSheet } from './NotificationSheet';
import { StatsGrid } from './StatsGrid';
import { TasteMatchCard } from './TasteMatchCard';
import { WatchJourneyCard } from './WatchJourneyCard';
import { WatchStreakCard } from './WatchStreakCard';
import { WrappedNotification } from './WrappedNotification';
import { useHomeConfig } from './useHomeConfig';
import { useUnifiedNotifications } from './useUnifiedNotifications';
import { GreetingSection } from './sections/GreetingSection';
import { ContinueWatchingSection } from './sections/ContinueWatchingSection';
import { RewatchSection } from './sections/RewatchSection';
import { TodayEpisodesSection } from './sections/TodayEpisodesSection';
import { MediaCarouselSection } from './sections/MediaCarouselSection';
import { hasEpisodeAired } from '../../utils/episodeDate';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useAuth();

  if (!authContext) {
    return <div>Loading...</div>;
  }

  const { user } = authContext;

  // Always load displayName from DB (Firebase Auth displayName may be outdated or missing)
  const [dbDisplayName, setDbDisplayName] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      firebase
        .database()
        .ref(`users/${user.uid}/displayName`)
        .once('value')
        .then((snap) => {
          if (snap.val()) setDbDisplayName(snap.val());
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  // Extracted hooks
  const {
    seriesWithNewSeasons,
    inactiveSeries,
    inactiveRewatches,
    completedSeries,
    clearNewSeasons,
    clearInactiveSeries,
    clearInactiveRewatches,
    clearCompletedSeries,
    seriesList,
  } = useSeriesList();
  const { currentTheme } = useTheme();
  const { countdowns } = useSeriesCountdowns();

  const config = useHomeConfig(user.uid);
  const notifs = useUnifiedNotifications();

  // Swipe handlers
  const {
    continueWatching,
    swipingContinueEpisodes,
    setSwipingContinueEpisodes,
    dragOffsetsContinue,
    setDragOffsetsContinue,
    completingContinueEpisodes,
    hiddenContinueEpisodes,
    handleContinueEpisodeComplete,
    todayEpisodes,
    swipingEpisodes,
    setSwipingEpisodes,
    dragOffsetsEpisodes,
    setDragOffsetsEpisodes,
    completingEpisodes,
    hiddenEpisodes,
    handleEpisodeComplete,
    swipeDirections,
  } = useEpisodeSwipeHandlers();

  // Rewatch state
  const rewatchEpisodes = useRewatchEpisodes();
  const [completingRewatches, setCompletingRewatches] = useState<Set<string>>(new Set());
  const [hiddenRewatches, setHiddenRewatches] = useState<Set<string>>(new Set());
  const [swipingRewatches, setSwipingRewatches] = useState<Set<string>>(new Set());
  const [dragOffsetsRewatches, setDragOffsetsRewatches] = useState<Record<string, number>>({});
  const [rewatchSwipeDirections, setRewatchSwipeDirections] = useState<
    Record<string, 'left' | 'right'>
  >({});

  // UI state
  const [posterNav, setPosterNav] = useState<{
    open: boolean;
    seriesId: number;
    title: string;
    episodePath: string;
  }>({ open: false, seriesId: 0, title: '', episodePath: '' });
  const [showNotifications, setShowNotifications] = useState(false);

  // Data hooks
  const stats = useWebWorkerStatsOptimized();
  const { trending } = useTMDBTrending();
  const seasonal = useSeasonalRecommendations();
  const topRated = useTopRated();

  // Total series with unwatched
  const totalSeriesWithUnwatched = useMemo(() => {
    let count = 0;
    for (const series of seriesList) {
      if (!series.watchlist || !series.seasons) continue;
      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);
      let hasUnwatched = false;
      for (const season of seasonsArray as Series['seasons']) {
        if (!season?.episodes) continue;
        const episodesArray = Array.isArray(season.episodes)
          ? season.episodes
          : Object.values(season.episodes);
        for (const episode of episodesArray as Series['seasons'][number]['episodes']) {
          if (!episode?.watched && hasEpisodeAired(episode)) {
            hasUnwatched = true;
            break;
          }
        }
        if (hasUnwatched) break;
      }
      if (hasUnwatched) count++;
    }
    return count;
  }, [seriesList]);

  // Rewatch completion handler
  const handleRewatchComplete = async (
    item: (typeof rewatchEpisodes)[number],
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const key = `rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`;
    setRewatchSwipeDirections((prev) => ({ ...prev, [key]: swipeDirection }));
    setCompletingRewatches((prev) => new Set(prev).add(key));

    if (user) {
      try {
        const episodePath = `${user.uid}/serien/${item.nmr}/seasons/${item.seasonIndex}/episodes/${item.episodeIndex}`;
        const newWatchCount = (item.currentWatchCount || 0) + 1;

        await firebase.database().ref(`${episodePath}/watchCount`).set(newWatchCount);
        await firebase.database().ref(`${episodePath}/lastWatchedAt`).set(new Date().toISOString());

        // Pet XP with genre bonus (rewatches count too)
        await petService.watchedSeriesWithGenreAllPets(user.uid, item.genre?.genres || []);

        if (!item.currentWatchCount) {
          await firebase.database().ref(`${episodePath}/watched`).set(true);
          await firebase
            .database()
            .ref(`${episodePath}/firstWatchedAt`)
            .set(new Date().toISOString());
        }

        WatchActivityService.logEpisodeWatch(
          user.uid,
          item.id,
          item.title,
          item.seasonNumber,
          item.episodeNumber,
          item.episodeRuntime,
          true,
          item.genre?.genres,
          item.provider?.provider?.map((p: { name: string }) => p.name)
        );

        const { updateEpisodeCounters } =
          await import('../../features/badges/minimalActivityLogger');
        await updateEpisodeCounters(user.uid, true);

        // Auto-complete rewatch check
        const series = seriesList.find((s) => s.id === item.id);
        if (series?.rewatch?.active) {
          const targetCount = item.targetWatchCount;
          let allDone = true;
          for (const s of series.seasons || []) {
            for (const ep of s.episodes || []) {
              if (!ep.watched) continue;
              if (
                s.seasonNumber === item.seasonNumber - 1 &&
                s.episodes?.indexOf(ep) === item.episodeIndex
              )
                continue;
              if ((ep.watchCount || 1) < targetCount) {
                allDone = false;
                break;
              }
            }
            if (!allDone) break;
          }
          if (allDone && newWatchCount >= targetCount) {
            await firebase.database().ref(`${user.uid}/serien/${item.nmr}/rewatch`).remove();
          }
        }
      } catch (error) {
        console.error('Error completing rewatch episode:', error);
      }
    }

    setTimeout(() => {
      setHiddenRewatches((prev) => new Set(prev).add(key));
      setCompletingRewatches((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 300);
  };

  // Poster navigation
  const handlePosterClick = (seriesId: number, title: string, episodePath: string) => {
    setPosterNav({ open: true, seriesId, title, episodePath });
  };

  // Swipe helpers for continue-watching
  const handleContinueSwipeStart = (key: string) =>
    setSwipingContinueEpisodes((prev) => new Set(prev).add(key));
  const handleContinueSwipeDrag = (key: string, offset: number) =>
    setDragOffsetsContinue((prev) => ({ ...prev, [key]: offset }));
  const handleContinueSwipeEnd = (key: string) => {
    setSwipingContinueEpisodes((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
    setDragOffsetsContinue((prev) => {
      const o = { ...prev };
      delete o[key];
      return o;
    });
  };

  // Swipe helpers for today-episodes
  const handleTodaySwipeStart = (key: string) =>
    setSwipingEpisodes((prev) => new Set(prev).add(key));
  const handleTodaySwipeDrag = (key: string, offset: number) =>
    setDragOffsetsEpisodes((prev) => ({ ...prev, [key]: offset }));
  const handleTodaySwipeEnd = (key: string) => {
    setSwipingEpisodes((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
    setDragOffsetsEpisodes((prev) => {
      const o = { ...prev };
      delete o[key];
      return o;
    });
  };

  // Swipe helpers for rewatches
  const handleRewatchSwipeStart = (key: string) =>
    setSwipingRewatches((prev) => new Set(prev).add(key));
  const handleRewatchSwipeDrag = (key: string, offset: number) =>
    setDragOffsetsRewatches((prev) => ({ ...prev, [key]: offset }));
  const handleRewatchSwipeEnd = (key: string) => {
    setSwipingRewatches((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
    setDragOffsetsRewatches((prev) => {
      const o = { ...prev };
      delete o[key];
      return o;
    });
  };

  // renderSection for all configurable sections
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'main-actions': {
        const allMainActions: Record<
          string,
          {
            icon: React.ReactNode;
            label: string;
            subtitle: string;
            path: string;
            bg: string;
            border: string;
            color: string;
          }
        > = {
          watchlist: {
            icon: (
              <PlayCircle
                style={{ fontSize: '22px', color: currentTheme.status.success, flexShrink: 0 }}
              />
            ),
            label: 'Weiterschauen',
            subtitle: `${totalSeriesWithUnwatched} Serien`,
            path: '/watchlist',
            bg: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(0, 180, 216, 0.15) 100%)',
            border: '1px solid rgba(0, 212, 170, 0.25)',
            color: currentTheme.status.success,
          },
          discover: {
            icon: (
              <AutoAwesome
                style={{ fontSize: '22px', color: currentTheme.primary, flexShrink: 0 }}
              />
            ),
            label: 'Entdecken',
            subtitle: 'Neue Inhalte',
            path: '/discover',
            bg: `linear-gradient(135deg, ${currentTheme.primary}26 0%, ${currentTheme.accent}26 100%)`,
            border: `1px solid ${currentTheme.primary}40`,
            color: currentTheme.primary,
          },
        };
        const visible = config.mainActionsOrder.filter(
          (id) => !config.hiddenMainActions.includes(id)
        );
        if (visible.length === 0) return null;

        // Featured card: show first continue-watching series as hero
        const featuredSeries = continueWatching[0];

        return (
          <div
            key="main-actions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '0 20px',
              marginBottom: '16px',
            }}
          >
            {/* Featured Hero Card */}
            {featuredSeries && (
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/watchlist')}
                style={{
                  position: 'relative',
                  height: '140px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Blurred backdrop */}
                <img
                  src={featuredSeries.poster}
                  alt=""
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(20px) brightness(0.4)',
                    transform: 'scale(1.2)',
                  }}
                />
                {/* Gradient overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(135deg, rgba(6, 9, 15, 0.7) 0%, rgba(6, 9, 15, 0.3) 50%, rgba(6, 9, 15, 0.8) 100%)',
                  }}
                />
                {/* Content */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '16px',
                    gap: '14px',
                  }}
                >
                  {/* Small poster */}
                  <img
                    src={featuredSeries.poster}
                    alt={featuredSeries.title}
                    style={{
                      width: '68px',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: currentTheme.primary,
                        margin: '0 0 4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Weiterschauen
                    </p>
                    <h2
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-display)',
                        margin: '0 0 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {featuredSeries.title}
                    </h2>
                    <p
                      style={{
                        fontSize: '12px',
                        color: currentTheme.text.secondary,
                        margin: '0 0 8px',
                      }}
                    >
                      S{featuredSeries.nextEpisode.seasonNumber}E
                      {featuredSeries.nextEpisode.episodeNumber}
                      {featuredSeries.nextEpisode.name
                        ? ` · ${featuredSeries.nextEpisode.name}`
                        : ''}
                    </p>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '2px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${featuredSeries.progress}%`,
                          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.status.success})`,
                          borderRadius: '2px',
                          boxShadow: `0 0 8px ${currentTheme.primary}60`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action buttons row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(visible.length, 2)}, 1fr)`,
                gap: '10px',
              }}
            >
              {visible.map((id) => {
                const a = allMainActions[id];
                if (!a) return null;
                return (
                  <motion.div
                    key={id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigate(a.path);
                    }}
                    style={{
                      background: a.bg,
                      border: a.border,
                      borderRadius: '14px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    {a.icon}
                    <div>
                      <h2
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          margin: 0,
                        }}
                      >
                        {a.label}
                      </h2>
                      <p
                        style={{
                          fontSize: '12px',
                          color: currentTheme.text.secondary,
                          margin: 0,
                        }}
                      >
                        {a.subtitle}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'quick-actions': {
        const all: Record<
          string,
          { icon: React.ReactNode; label: string; path: string; color: string }
        > = {
          ratings: {
            icon: <Star style={{ fontSize: '18px' }} />,
            label: 'Ratings',
            path: '/ratings',
            color: currentTheme.status.warning,
          },
          calendar: {
            icon: <CalendarToday style={{ fontSize: '18px' }} />,
            label: 'Kalender',
            path: '/calendar',
            color: currentTheme.status.success,
          },
          history: {
            icon: <History style={{ fontSize: '18px' }} />,
            label: 'Verlauf',
            path: '/recently-watched',
            color: currentTheme.status.error,
          },
          friends: {
            icon: <Group style={{ fontSize: '18px' }} />,
            label: 'Freunde',
            path: '/activity',
            color: currentTheme.status.info.main,
          },
        };
        const visible = config.quickActionsOrder.filter(
          (id) => !config.hiddenQuickActions.includes(id)
        );
        if (visible.length === 0) return null;
        return (
          <div
            key="quick-actions"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${visible.length}, 1fr)`,
              gap: '10px',
              padding: '0 20px',
              marginBottom: '16px',
            }}
          >
            {visible.map((id) => {
              const a = all[id];
              if (!a) return null;
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => {
                    navigate(a.path);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 6px',
                    borderRadius: '12px',
                    background: `${a.color}0D`,
                    border: `1px solid ${a.color}20`,
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: `${a.color}1A`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: a.color,
                    }}
                  >
                    {a.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: currentTheme.text.secondary,
                      letterSpacing: '0.2px',
                    }}
                  >
                    {a.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        );
      }

      case 'secondary-actions': {
        const all: Record<
          string,
          {
            icon: React.ReactElement;
            label: string;
            path: string;
            bg: string;
            border: string;
            color: string;
          }
        > = {
          leaderboard: {
            icon: <EmojiEvents style={{ fontSize: '18px' }} />,
            label: 'Rangliste',
            path: '/leaderboard',
            bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
          },
          badges: {
            icon: <AutoAwesome style={{ fontSize: '18px' }} />,
            label: 'Badges',
            path: '/badges',
            bg: `linear-gradient(135deg, ${currentTheme.primary}1A 0%, ${currentTheme.accent}1A 100%)`,
            border: `1px solid ${currentTheme.primary}33`,
            color: currentTheme.primary,
          },
          pets: {
            icon: <LocalFireDepartment style={{ fontSize: '18px' }} />,
            label: 'Pets',
            path: '/pets',
            bg: `linear-gradient(135deg, ${currentTheme.status.success}1A 0%, ${currentTheme.status.info.main}1A 100%)`,
            border: `1px solid ${currentTheme.status.success}33`,
            color: currentTheme.status.success,
          },
        };
        const visible = config.secondaryActionsOrder.filter(
          (id) => !config.hiddenSecondaryActions.includes(id)
        );
        if (visible.length === 0) return null;
        return (
          <div
            key="secondary-actions"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(visible.length, 3)}, 1fr)`,
              gap: '10px',
              padding: '0 20px',
              marginBottom: '32px',
            }}
          >
            {visible.map((id) => {
              const a = all[id];
              if (!a) return null;
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    navigate(a.path);
                  }}
                  style={{
                    padding: '10px',
                    background: a.bg,
                    border: a.border,
                    borderRadius: '10px',
                    color: a.color,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  {a.icon}
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{a.label}</span>
                </motion.button>
              );
            })}
          </div>
        );
      }

      case 'countdown':
        if (countdowns.length === 0) return null;
        return (
          <CountdownBanner
            key="countdown"
            countdown={countdowns[0]}
            totalCount={countdowns.length}
            navigate={navigate}
          />
        );

      case 'for-you': {
        const comps: Record<string, React.ReactNode> = {
          'watch-streak': <WatchStreakCard key="watch-streak" />,
          'taste-match': <TasteMatchCard key="taste-match" />,
          'watch-journey': <WatchJourneyCard key="watch-journey" />,
          'catch-up': <CatchUpCard key="catch-up" />,
          'hidden-series': <HiddenSeriesCard key="hidden-series" />,
        };
        const visible = config.forYouOrder.filter((id) => !config.hiddenForYou.includes(id));
        if (visible.length === 0) return null;
        return (
          <section key="for-you" style={{ marginBottom: '32px' }}>
            <SectionHeader
              icon={<AutoAwesome />}
              iconColor={currentTheme.primary}
              title="Für dich"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visible.map((id) => comps[id])}
            </div>
          </section>
        );
      }

      case 'stats':
        return (
          <div key="stats" style={{ padding: '0 20px', marginBottom: '20px' }}>
            <StatsGrid />
          </div>
        );

      case 'continue-watching':
        return (
          <ContinueWatchingSection
            key="continue-watching"
            items={continueWatching}
            hiddenEpisodes={hiddenContinueEpisodes}
            completingEpisodes={completingContinueEpisodes}
            swipingEpisodes={swipingContinueEpisodes}
            dragOffsets={dragOffsetsContinue}
            swipeDirections={swipeDirections}
            onSwipeStart={handleContinueSwipeStart}
            onSwipeDrag={handleContinueSwipeDrag}
            onSwipeEnd={handleContinueSwipeEnd}
            onComplete={handleContinueEpisodeComplete}
            onPosterClick={handlePosterClick}
          />
        );

      case 'rewatches':
        return (
          <RewatchSection
            key="rewatches"
            episodes={rewatchEpisodes}
            hiddenRewatches={hiddenRewatches}
            completingRewatches={completingRewatches}
            swipingRewatches={swipingRewatches}
            dragOffsets={dragOffsetsRewatches}
            swipeDirections={rewatchSwipeDirections}
            onSwipeStart={handleRewatchSwipeStart}
            onSwipeDrag={handleRewatchSwipeDrag}
            onSwipeEnd={handleRewatchSwipeEnd}
            onComplete={handleRewatchComplete}
            onPosterClick={handlePosterClick}
          />
        );

      case 'today-episodes':
        return (
          <TodayEpisodesSection
            key="today-episodes"
            episodes={todayEpisodes}
            hiddenEpisodes={hiddenEpisodes}
            completingEpisodes={completingEpisodes}
            swipingEpisodes={swipingEpisodes}
            dragOffsets={dragOffsetsEpisodes}
            swipeDirections={swipeDirections}
            onSwipeStart={handleTodaySwipeStart}
            onSwipeDrag={handleTodaySwipeDrag}
            onSwipeEnd={handleTodaySwipeEnd}
            onComplete={handleEpisodeComplete}
            onPosterClick={handlePosterClick}
          />
        );

      case 'seasonal':
        return (
          <MediaCarouselSection
            key="seasonal"
            variant="seasonal"
            items={seasonal.items}
            title={seasonal.title}
            badgeGradient={seasonal.badgeGradient}
            iconColor={seasonal.iconColor}
          />
        );

      case 'trending':
        return (
          <MediaCarouselSection
            key="trending"
            variant="trending"
            items={trending}
            title="Trending diese Woche"
          />
        );

      case 'top-rated':
        return (
          <MediaCarouselSection
            key="top-rated"
            variant="top-rated"
            items={topRated}
            title="Bestbewertet"
            onSeeAll={() => navigate('/ratings')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ overflowY: 'auto', position: 'relative' }}>
      <WrappedNotification />

      {/* Carousel Notifications */}
      {seriesWithNewSeasons && seriesWithNewSeasons.length > 0 && (
        <CarouselNotification
          variant="new-season"
          series={seriesWithNewSeasons}
          onDismiss={clearNewSeasons}
        />
      )}
      {(!seriesWithNewSeasons || seriesWithNewSeasons.length === 0) &&
        inactiveSeries &&
        inactiveSeries.length > 0 && (
          <CarouselNotification
            variant="inactive"
            series={inactiveSeries}
            onDismiss={clearInactiveSeries}
          />
        )}
      {(!seriesWithNewSeasons || seriesWithNewSeasons.length === 0) &&
        (!inactiveSeries || inactiveSeries.length === 0) &&
        inactiveRewatches &&
        inactiveRewatches.length > 0 && (
          <CarouselNotification
            variant="inactive-rewatch"
            series={inactiveRewatches}
            onDismiss={clearInactiveRewatches}
          />
        )}
      {(!seriesWithNewSeasons || seriesWithNewSeasons.length === 0) &&
        (!inactiveSeries || inactiveSeries.length === 0) &&
        (!inactiveRewatches || inactiveRewatches.length === 0) &&
        completedSeries &&
        completedSeries.length > 0 && (
          <CarouselNotification
            variant="completed"
            series={completedSeries}
            onDismiss={clearCompletedSeries}
          />
        )}

      {/* Greeting / Header */}
      <GreetingSection
        displayName={dbDisplayName || user.displayName || undefined}
        photoURL={user.photoURL ?? undefined}
        totalUnreadBadge={notifs.totalUnreadBadge}
        onNotificationsOpen={() => setShowNotifications(true)}
        watchedEpisodes={stats.watchedEpisodes}
        totalMovies={stats.totalMovies}
        progress={stats.progress}
        todayEpisodes={stats.todayEpisodes}
      />

      {/* Configurable Sections */}
      <AnimatePresence>
        {config.visibleSections.map((sectionId) => {
          const content = renderSection(sectionId);
          if (content === null) return null;
          return (
            <motion.div
              key={sectionId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {content}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Poster Navigation Sheet */}
      <BottomSheet
        isOpen={posterNav.open}
        onClose={() => setPosterNav((prev) => ({ ...prev, open: false }))}
        bottomOffset="calc(90px + env(safe-area-inset-bottom))"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '0 16px 16px',
          }}
        >
          <p
            style={{
              fontSize: '17px',
              fontWeight: '700',
              fontFamily: 'var(--font-display)',
              margin: 0,
              color: currentTheme.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {posterNav.title}
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setPosterNav((prev) => ({ ...prev, open: false }));
              navigate(posterNav.episodePath);
            }}
            style={{
              padding: '14px 16px',
              background: `${currentTheme.primary}26`,
              border: `1px solid ${currentTheme.primary}4D`,
              borderRadius: '12px',
              color: currentTheme.primary,
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <PlayCircle style={{ fontSize: '20px' }} />
            Zur Episode
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setPosterNav((prev) => ({ ...prev, open: false }));
              navigate(`/series/${posterNav.seriesId}`);
            }}
            style={{
              padding: '14px 16px',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '12px',
              color: currentTheme.text.secondary,
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Tv style={{ fontSize: '20px' }} />
            Zur Serie
          </motion.button>
        </div>
      </BottomSheet>

      {/* Notification Sheet */}
      <NotificationSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifs.unifiedNotifications}
        onMarkAllRead={notifs.handleMarkAllNotificationsRead}
        onMarkAsRead={notifs.markAsRead}
        onDismissAnnouncement={notifs.dismissAnnouncement}
        onAcceptRequest={notifs.acceptFriendRequest}
        onDeclineRequest={notifs.declineFriendRequest}
      />
    </div>
  );
};

// Extracted countdown banner
function CountdownBanner({
  countdown,
  totalCount,
  navigate,
}: {
  countdown: { title: string; posterUrl?: string; daysUntil: number; seasonNumber: number };
  totalCount: number;
  navigate: (path: string) => void;
}) {
  const countdownColor = '#a855f7';
  const daysText =
    countdown.daysUntil === 0
      ? 'Heute!'
      : countdown.daysUntil === 1
        ? 'Morgen'
        : `in ${countdown.daysUntil} Tagen`;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/countdowns')}
      style={{
        margin: '0 20px 16px',
        borderRadius: '14px',
        padding: '12px 14px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {countdown.posterUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${countdown.posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.3)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${countdownColor}40 0%, rgba(10, 14, 26, 0.75) 100%)`,
          border: `1px solid ${countdownColor}50`,
          borderRadius: '16px',
        }}
      />
      {countdown.posterUrl && (
        <img
          src={countdown.posterUrl}
          alt=""
          style={{
            position: 'relative',
            width: 44,
            height: 66,
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <CalendarMonth style={{ fontSize: '16px', color: countdownColor }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: countdownColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Countdown
          </span>
          {totalCount > 1 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: countdownColor,
                background: `${countdownColor}25`,
                padding: '1px 6px',
                borderRadius: '6px',
              }}
            >
              +{totalCount - 1}
            </span>
          )}
        </div>
        <h2
          style={{
            margin: '0 0 1px 0',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {countdown.title}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Staffel {countdown.seasonNumber} &middot; {daysText}
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: `${countdownColor}30`,
          border: `2px solid ${countdownColor}80`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {countdown.daysUntil === 0 ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Heute
          </span>
        ) : (
          <>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {countdown.daysUntil}
            </span>
            <span
              style={{
                fontSize: '7px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
              }}
            >
              {countdown.daysUntil === 1 ? 'Tag' : 'Tage'}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
