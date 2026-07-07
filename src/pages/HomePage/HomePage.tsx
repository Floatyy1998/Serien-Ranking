import AutoAwesome from '@mui/icons-material/AutoAwesome';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dbGet, dbRef, paths } from '../../services/db/ref';
import { SectionHeader } from '../../components/ui';
import { SeriesNotificationHub } from './SeriesNotificationHub';
import { CaseOpeningOverlay } from '../../components/pet/CaseOpeningOverlay';
import { QuickRatingSheet } from '../../components/ui/QuickRatingSheet';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useEpisodeSwipeHandlers } from '../../hooks/useEpisodeSwipeHandlers';
import { useProactiveRecaps } from '../../hooks/useProactiveRecaps';
import { useSeasonalRecommendations } from '../../hooks/useSeasonalRecommendations';
import { useSeriesCountdowns } from '../../hooks/useSeriesCountdowns';
import { useUnsubscribedNewSeasons } from '../../hooks/useUnsubscribedNewSeasons';
import { useTMDBTrending } from '../../hooks/useTMDBTrending';
import { useTopRated } from '../../hooks/useTopRated';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';
import { CatchUpCard } from './CatchUpCard';
import { RatingQueueCard } from './RatingQueueCard';
import { CountdownBanner } from './CountdownBanner';
import { HiddenSeriesCard } from './HiddenSeriesCard';
import { QuickActionsSection, SecondaryActionsSection } from './HomeActionSections';
import { NotificationSheet } from './NotificationSheet';
import { PosterNavSheet } from './PosterNavSheet';
import { StatsGrid } from './StatsGrid';
import { TasteMatchCard } from './TasteMatchCard';
import { TasteProfileCard } from './TasteProfileCard';
import { WatchJourneyCard } from './WatchJourneyCard';
import { WatchStreakCard } from './WatchStreakCard';
import { DailySpinCard } from './DailySpinCard';
import { StreamingReminderCard } from './StreamingReminderCard';
import { ActivityMarquee } from './ActivityMarquee';
import { MilestoneBoxCard } from './MilestoneBoxCard';
import { WrappedNotification } from './WrappedNotification';
import { useHomeConfig } from './useHomeConfig';
import { useRewatchHandler } from './useRewatchHandler';
import { useUnifiedNotifications } from './useUnifiedNotifications';
import { GreetingSection } from './sections/GreetingSection';
import { ContinueWatchingSection } from './sections/ContinueWatchingSection';
import { RewatchSection } from './sections/RewatchSection';
import { TodayEpisodesSection } from './sections/TodayEpisodesSection';
import { MediaCarouselSection } from './sections/MediaCarouselSection';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user ?? null;

  // All hooks must be called unconditionally (before any return)
  const [dbDisplayName, setDbDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      dbGet<string>(paths.displayName(user.uid))
        .then((name) => {
          if (name) setDbDisplayName(name);
        })
        .catch(() => {}); // bewusst still: Begrüßung fällt auf den Auth-Displaynamen zurück
    }
  }, [user]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const {
    seriesWithNewSeasons,
    inactiveSeries,
    inactiveRewatches,
    completedSeries,
    clearNewSeasons,
    clearInactiveSeries,
    clearInactiveRewatches,
    clearCompletedSeries,
    unratedSeries,
    clearUnratedSeries,
    providerChanges,
    clearProviderChanges,
    animeMangaHandoffs,
    clearAnimeMangaHandoffs,
  } = useSeriesList();
  const { currentTheme } = useTheme();
  const { countdowns } = useSeriesCountdowns();
  const proactiveRecaps = useProactiveRecaps();
  const config = useHomeConfig(user?.uid ?? '');
  const notifs = useUnifiedNotifications();
  const { entries: unsubscribedNewSeasons, dismiss: dismissUnsubscribedNewSeasons } =
    useUnsubscribedNewSeasons(seriesWithNewSeasons);

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
    quickRatingOpen,
    quickRatingSeries,
    quickRatingSeasonNumber,
    closeQuickRating,
    saveQuickRating,
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
  const onRatedCallbackRef = useRef<(() => void) | null>(null);
  const [caseOpeningDrop, setCaseOpeningDrop] = useState<{
    dropId: string;
    accessoryId: string;
    rarity: string;
  } | null>(null);

  // Data hooks
  const stats = useWebWorkerStatsOptimized();
  const { trending, loading: trendingLoading } = useTMDBTrending();
  const seasonal = useSeasonalRecommendations();
  const topRated = useTopRated();

  // React 19: defer the heavy below-the-fold lists so they don't block the
  // above-the-fold paint. When trending/topRated arrive, the render is
  // interruptible — user interactions (scroll, tap) stay snappy even if the
  // posters lists are mid-render.
  const deferredTrending = useDeferredValue(trending);
  const deferredTopRated = useDeferredValue(topRated);
  const deferredSeasonalItems = useDeferredValue(seasonal.items);

  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = dbRef(`admin/userMessages/${user.uid}/text`);
    ref.on('value', (snap) => setAdminMessage(snap.val() || null));
    return () => ref.off('value');
  }, [user]);

  // Early returns after all hooks
  if (!authContext || !user) {
    return <div>Redirecting...</div>;
  }

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
      case 'activity-marquee':
        return <ActivityMarquee key="activity-marquee" />;

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
          'daily-spin': <DailySpinCard key="daily-spin" />,
          'milestone-box': <MilestoneBoxCard key="milestone-box" />,
          'taste-profile': <TasteProfileCard key="taste-profile" />,
          'taste-match': <TasteMatchCard key="taste-match" />,
          'watch-journey': <WatchJourneyCard key="watch-journey" />,
          'rating-queue': <RatingQueueCard key="rating-queue" />,
          'catch-up': <CatchUpCard key="catch-up" />,
          'streaming-reminder': <StreamingReminderCard key="streaming-reminder" />,
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
            items={deferredSeasonalItems}
            title={seasonal.title}
            iconColor={seasonal.iconColor}
            loading={seasonal.loading}
          />
        );

      case 'trending':
        return (
          <MediaCarouselSection
            key="trending"
            variant="trending"
            items={deferredTrending}
            title="Trending diese Woche"
            loading={trendingLoading}
          />
        );

      case 'top-rated':
        return (
          <MediaCarouselSection
            key="top-rated"
            variant="top-rated"
            items={deferredTopRated}
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

      {adminMessage && (
        <div
          style={{
            margin: '16px',
            padding: '16px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${currentTheme.background.surface}, ${currentTheme.background.default})`,
            border: `1px solid ${currentTheme.accent || currentTheme.primary}30`,
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: 600,
            color: currentTheme.accent || currentTheme.primary,
          }}
        >
          {adminMessage}
        </div>
      )}

      {/* Unified Series-Notification Hub — Tab-Bar + Mini-Mode + alle Kategorien */}
      <SeriesNotificationHub
        proactiveRecaps={proactiveRecaps}
        unsubscribedNewSeasons={unsubscribedNewSeasons}
        onDismissUnsubscribed={dismissUnsubscribedNewSeasons}
        providerChanges={providerChanges}
        onDismissProvider={clearProviderChanges}
        seriesWithNewSeasons={seriesWithNewSeasons}
        onDismissNewSeasons={clearNewSeasons}
        inactiveSeries={inactiveSeries}
        onDismissInactive={clearInactiveSeries}
        inactiveRewatches={inactiveRewatches}
        onDismissInactiveRewatch={clearInactiveRewatches}
        completedSeries={completedSeries}
        onDismissCompleted={clearCompletedSeries}
        unratedSeries={unratedSeries}
        onDismissUnrated={clearUnratedSeries}
        animeMangaHandoffs={animeMangaHandoffs}
        onDismissAnimeManga={clearAnimeMangaHandoffs}
      />

      <GreetingSection
        displayName={dbDisplayName || user.displayName || undefined}
        photoURL={user.photoURL ?? undefined}
        totalUnreadBadge={notifs.totalUnreadBadge}
        onNotificationsOpen={() => {
          setShowNotifications(true);
          notifs.handleMarkAllNotificationsRead();
        }}
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
        onAcceptRecommendation={notifs.acceptRecommendation}
        onDeclineRecommendation={notifs.declineRecommendation}
        onOpenCaseOpening={setCaseOpeningDrop}
      />

      <CaseOpeningOverlay dropData={caseOpeningDrop} onClose={() => setCaseOpeningDrop(null)} />

      <QuickRatingSheet
        isOpen={quickRatingOpen}
        onClose={() => {
          closeQuickRating();
          onRatedCallbackRef.current = null;
        }}
        seriesTitle={quickRatingSeries?.title || ''}
        seasonNumber={quickRatingSeasonNumber}
        onRate={async (rating) => {
          await saveQuickRating(rating);
          onRatedCallbackRef.current?.();
          onRatedCallbackRef.current = null;
        }}
      />
    </div>
  );
};
