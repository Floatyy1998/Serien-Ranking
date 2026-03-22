import AutoAwesome from '@mui/icons-material/AutoAwesome';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { SectionHeader } from '../../components/ui';
import { CarouselNotification } from '../../components/ui/CarouselNotification';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useEpisodeSwipeHandlers } from '../../hooks/useEpisodeSwipeHandlers';
import { useSeasonalRecommendations } from '../../hooks/useSeasonalRecommendations';
import { useSeriesCountdowns } from '../../hooks/useSeriesCountdowns';
import { useTMDBTrending } from '../../hooks/useTMDBTrending';
import { useTopRated } from '../../hooks/useTopRated';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';
import { CatchUpCard } from './CatchUpCard';
import { CountdownBanner } from './CountdownBanner';
import { HiddenSeriesCard } from './HiddenSeriesCard';
import {
  MainActionsSection,
  QuickActionsSection,
  SecondaryActionsSection,
} from './HomeActionSections';
import { NotificationSheet } from './NotificationSheet';
import { PosterNavSheet } from './PosterNavSheet';
import { StatsGrid } from './StatsGrid';
import { TasteMatchCard } from './TasteMatchCard';
import { WatchJourneyCard } from './WatchJourneyCard';
import { WatchStreakCard } from './WatchStreakCard';
import { WrappedNotification } from './WrappedNotification';
import { useHomeConfig } from './useHomeConfig';
import { useRewatchHandler } from './useRewatchHandler';
import { useUnifiedNotifications } from './useUnifiedNotifications';
import { GreetingSection } from './sections/GreetingSection';
import { ContinueWatchingSection } from './sections/ContinueWatchingSection';
import { RewatchSection } from './sections/RewatchSection';
import { TodayEpisodesSection } from './sections/TodayEpisodesSection';
import { MediaCarouselSection } from './sections/MediaCarouselSection';
import { normalizeSeasons, normalizeEpisodes } from '../../lib/episode/seriesMetrics';
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

  // Rewatch
  const {
    rewatchEpisodes,
    completingRewatches,
    hiddenRewatches,
    swipingRewatches,
    dragOffsetsRewatches,
    rewatchSwipeDirections,
    handleRewatchComplete,
    handleRewatchSwipeStart,
    handleRewatchSwipeDrag,
    handleRewatchSwipeEnd,
  } = useRewatchHandler();

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
      let hasUnwatched = false;
      for (const season of normalizeSeasons(series.seasons)) {
        if (!season?.episodes) continue;
        for (const episode of normalizeEpisodes(season.episodes)) {
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

  // renderSection for all configurable sections
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'main-actions':
        return (
          <MainActionsSection
            key="main-actions"
            config={config}
            totalSeriesWithUnwatched={totalSeriesWithUnwatched}
            featuredSeries={continueWatching[0]}
            navigate={navigate}
          />
        );

      case 'quick-actions':
        return <QuickActionsSection key="quick-actions" config={config} navigate={navigate} />;

      case 'secondary-actions':
        return (
          <SecondaryActionsSection key="secondary-actions" config={config} navigate={navigate} />
        );

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

      <PosterNavSheet
        posterNav={posterNav}
        onClose={() => setPosterNav((prev) => ({ ...prev, open: false }))}
      />

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
