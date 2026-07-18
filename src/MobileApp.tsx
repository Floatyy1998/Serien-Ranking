import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout, ScrollToTop } from './components/layout';
import { MainTabs } from './components/layout/MainTabs';
import { MAIN_TAB_PATHS } from './config/navItems';
import { useAuth } from './contexts/AuthContext';
import { ADMIN_UID } from './config/admin';
import { useOptimizedFriends } from './contexts/OptimizedFriendsContext';
import { useNotifications } from './contexts/NotificationContext';
import { useAdminHealthAlert } from './hooks/useAdminHealthAlert';
import { usePetGiftReceiver } from './hooks/usePetGiftReceiver';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { PushOptInPrompt } from './components/PushOptInPrompt';
import { WidgetDataSync } from './components/WidgetDataSync';
import './styles/App.css';

// Haupt-Tabs leben in MainTabs (Keep-Alive) — hier nur die übrigen Routen
import {
  SeriesDetailPage,
  MovieDetailPage,
  ThemePage,
  HomeLayoutPage,
  WrappedPage,
  ActorUniversePage,
  SettingsPage,
  EpisodeManagementPage,
  EpisodeDiscussionPage,
  RatingEditorPage,
  FriendProfilePage,
  TasteMatchPage,
  TasteProfilePage,
  WatchJourneyPage,
  HiddenSeriesPage,
  ImpressumPage,
  PrivacyPage,
  DiscussionFeedPage,
  OnboardingPage,
  PatchNotesPage,
  AdminDashboardPage,
  BugReportPage,
  MangaDetailPage,
  MangaRatingsPage,
  MangaSearchPage,
  MangaCatchUpPage,
  HiddenMangaPage,
  RecentlyReadPage,
  MangaStatsPage,
  MangaDiscoverPage,
  MangaReadJourneyPage,
  MangaReadingListPage,
  AnimeSeasonPage,
  SerienKalenderPage,
  preloadRoutes,
} from './lazyRoutes';

// Themed Spinner statt rohem "Loading..."-Text — das hier ist der Suspense-
// Fallback, den Nutzer beim ersten Besuch fast jeder Lazy-Route sehen
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--theme-background, #000000)',
    }}
  >
    <LoadingSpinner />
  </div>
);

export const MobileApp = () => {
  const { onboardingComplete, user } = useAuth() || {};
  const location = useLocation();
  const { unreadActivitiesCount, unreadRequestsCount, friendActivities, friendRequests } =
    useOptimizedFriends();
  const { unreadCount: notificationUnreadCount, notifications: generalNotifications } =
    useNotifications();

  useNetworkStatus();

  const totalUnread = unreadActivitiesCount + unreadRequestsCount + notificationUnreadCount;

  // Build ticker messages from recent activities
  const tickerMessages = useMemo(() => {
    if (totalUnread === 0) return [];
    const messages: string[] = [];

    for (const activity of friendActivities.slice(0, 5)) {
      const name = activity.userName || 'Jemand';
      switch (activity.type) {
        case 'series_added':
        case 'movie_added':
          messages.push(`${name} hat "${activity.itemTitle}" hinzugefügt`);
          break;
        case 'series_rated':
        case 'rating_updated':
        case 'movie_rated':
        case 'rating_updated_movie':
          messages.push(`${name} hat "${activity.itemTitle}" mit ${activity.rating}/10 bewertet`);
          break;
        case 'series_added_to_watchlist':
        case 'movie_added_to_watchlist':
          messages.push(`${name} hat "${activity.itemTitle}" auf die Watchlist gesetzt`);
          break;
      }
    }

    for (const req of friendRequests) {
      messages.push(`${req.fromUsername || 'Jemand'} möchte dein Freund werden`);
    }

    for (const notif of generalNotifications.filter((n) => !n.read).slice(0, 3)) {
      messages.push(notif.title);
    }

    return messages;
  }, [totalUnread, friendActivities, friendRequests, generalNotifications]);

  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerRef = useRef(tickerIndex);

  useEffect(() => {
    tickerRef.current = tickerIndex;
  }, [tickerIndex]);

  // Cycle through ticker messages in the tab title
  useEffect(() => {
    if (totalUnread === 0 || tickerMessages.length === 0) {
      document.title = 'TV-RANK';
      return;
    }

    const safeIndex = tickerRef.current % tickerMessages.length;
    document.title = `(${totalUnread}) ${tickerMessages[safeIndex]} — TV-RANK`;

    if (tickerMessages.length <= 1) return;

    const interval = setInterval(() => {
      setTickerIndex((prev) => {
        const next = (prev + 1) % tickerMessages.length;
        document.title = `(${totalUnread}) ${tickerMessages[next]} — TV-RANK`;
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [totalUnread, tickerMessages]);

  useAdminHealthAlert();
  usePetGiftReceiver();

  // Preload lazy route chunks + cleanup old tickets in the background.
  // Ticket-Cleanup liest die komplette bugTickets-Liste — nach der Regel-
  // Haertung darf das nur der Admin (sonst permission-denied). Deshalb nur
  // fuer den Admin ausloesen.
  useEffect(() => {
    preloadRoutes({ isAdmin: user?.uid === ADMIN_UID });
    if (user?.uid === ADMIN_UID) {
      import('./pages/BugReport/useBugReportData').then((m) => m.cleanupOldTickets());
    }
    if (user?.uid) {
      import('./services/pushNotifications').then((m) => m.initNativePush(user.uid));
    }
  }, [user?.uid]);

  // Redirect to onboarding if not complete
  if (onboardingComplete === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  const isTabPath = MAIN_TAB_PATHS.has(location.pathname);

  return (
    <div className="mobile-app">
      <ScrollToTop />
      <PushOptInPrompt />
      <WidgetDataSync />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <div style={{ display: isTabPath ? undefined : 'none' }}>
            <Layout>
              <MainTabs />
            </Layout>
          </div>
          {!isTabPath && (
            <Routes>
              {/* Onboarding - Full-screen, no Layout */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Additional Pages */}
              <Route
                path="/discussions"
                element={
                  <Layout hideNav>
                    <DiscussionFeedPage />
                  </Layout>
                }
              />
              <Route
                path="/theme"
                element={
                  <Layout hideNav>
                    <ThemePage />
                  </Layout>
                }
              />
              <Route
                path="/home-layout"
                element={
                  <Layout hideNav>
                    <HomeLayoutPage />
                  </Layout>
                }
              />
              <Route
                path="/taste-profile"
                element={
                  <Layout hideNav>
                    <TasteProfilePage />
                  </Layout>
                }
              />
              {/* Wrapped routes - config wird in WrappedPage aus Firebase geprüft */}
              <Route path="/wrapped" element={<WrappedPage />} />
              <Route path="/wrapped/:year" element={<WrappedPage />} />
              <Route
                path="/actor-universe"
                element={
                  <Layout hideNav>
                    <ActorUniversePage />
                  </Layout>
                }
              />
              <Route
                path="/settings"
                element={
                  <Layout hideNav>
                    <SettingsPage />
                  </Layout>
                }
              />

              {/* Detail Pages */}
              <Route
                path="/series/:id"
                element={
                  <Layout hideNav>
                    <SeriesDetailPage />
                  </Layout>
                }
              />
              <Route
                path="/episodes/:id"
                element={
                  <Layout hideNav>
                    <EpisodeManagementPage />
                  </Layout>
                }
              />
              <Route
                path="/episode/:seriesId/s/:seasonNumber/e/:episodeNumber"
                element={
                  <Layout hideNav>
                    <EpisodeDiscussionPage />
                  </Layout>
                }
              />
              <Route
                path="/rating/:type/:id"
                element={
                  <Layout hideNav>
                    <RatingEditorPage />
                  </Layout>
                }
              />
              <Route
                path="/movie/:id"
                element={
                  <Layout hideNav>
                    <MovieDetailPage />
                  </Layout>
                }
              />
              <Route
                path="/friend/:id"
                element={
                  <Layout hideNav>
                    <FriendProfilePage />
                  </Layout>
                }
              />
              <Route path="/taste-match/:friendId" element={<TasteMatchPage />} />
              <Route path="/watch-journey" element={<WatchJourneyPage />} />
              <Route path="/hidden-series" element={<HiddenSeriesPage />} />
              <Route
                path="/anime-season"
                element={
                  <Layout hideNav>
                    <AnimeSeasonPage />
                  </Layout>
                }
              />
              <Route
                path="/serien-kalender"
                element={
                  <Layout hideNav>
                    <SerienKalenderPage />
                  </Layout>
                }
              />
              <Route
                path="/patch-notes"
                element={
                  <Layout hideNav>
                    <PatchNotesPage />
                  </Layout>
                }
              />
              <Route
                path="/admin"
                element={
                  <Layout hideNav>
                    <AdminDashboardPage />
                  </Layout>
                }
              />
              <Route
                path="/bug-report"
                element={
                  <Layout hideNav>
                    <BugReportPage />
                  </Layout>
                }
              />
              {/* Manga Pages - specific routes before :id */}
              <Route
                path="/manga/ratings"
                element={
                  <Layout hideNav>
                    <MangaRatingsPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/search"
                element={
                  <Layout hideNav>
                    <MangaSearchPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/catch-up"
                element={
                  <Layout hideNav>
                    <MangaCatchUpPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/hidden"
                element={
                  <Layout hideNav>
                    <HiddenMangaPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/recently-read"
                element={
                  <Layout hideNav>
                    <RecentlyReadPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/stats"
                element={
                  <Layout hideNav>
                    <MangaStatsPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/discover"
                element={
                  <Layout hideNav>
                    <MangaDiscoverPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/journey"
                element={
                  <Layout hideNav>
                    <MangaReadJourneyPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/reading-list"
                element={
                  <Layout hideNav>
                    <MangaReadingListPage />
                  </Layout>
                }
              />
              <Route
                path="/manga/:id"
                element={
                  <Layout hideNav>
                    <MangaDetailPage />
                  </Layout>
                }
              />

              {/* Legal Pages */}
              <Route
                path="/impressum"
                element={
                  <Layout hideNav>
                    <ImpressumPage />
                  </Layout>
                }
              />
              <Route
                path="/privacy"
                element={
                  <Layout hideNav>
                    <PrivacyPage />
                  </Layout>
                }
              />

              {/* Redirect old routes */}
              <Route path="/profile/:id" element={<FriendProfilePage />} />
              <Route path="/friends" element={<Navigate to="/activity" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
