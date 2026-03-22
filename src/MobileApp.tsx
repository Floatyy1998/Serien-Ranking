import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout, ScrollToTop } from './components/layout';
import { useAuth } from './App';
import { useOptimizedFriends } from './contexts/OptimizedFriendsProvider';
import { useNotifications } from './contexts/NotificationContext';
import './styles/App.css';

// Main nav tabs: eager imports — these are always needed and must never show a loading spinner
import { HomePage } from './pages/HomePage';
import { WatchNextPage } from './pages/WatchNext';
import { RatingsPage } from './pages/Ratings';
import { ProfilePage } from './pages/Profile';
import { SearchPage } from './pages/Search';

import {
  SeriesDetailPage,
  MovieDetailPage,
  DiscoverPage,
  ActivityPage,
  StatsPage,
  RecentlyWatchedPage,
  BadgesPage,
  PetsPage,
  ThemePage,
  HomeLayoutPage,
  WrappedPage,
  ActorUniversePage,
  SettingsPage,
  ProfileSettingsPage,
  EpisodeManagementPage,
  EpisodeDiscussionPage,
  RatingPage,
  FriendProfilePage,
  TasteMatchPage,
  WatchJourneyPage,
  CatchUpPage,
  HiddenSeriesPage,
  ImpressumPage,
  PrivacyPage,
  DiscussionFeedPage,
  CountdownPage,
  CalendarPage,
  OnboardingPage,
  LeaderboardPage,
  PatchNotesPage,
  AdminDashboardPage,
  preloadRoutes,
} from './lazyRoutes';

const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--theme-background, #000)',
    }}
  >
    <div style={{ color: 'var(--theme-primary, #fff)' }}>Loading...</div>
  </div>
);

export const MobileApp = () => {
  const { onboardingComplete } = useAuth() || {};
  const location = useLocation();
  const { unreadActivitiesCount, unreadRequestsCount, friendActivities, friendRequests } =
    useOptimizedFriends();
  const { unreadCount: notificationUnreadCount, notifications: generalNotifications } =
    useNotifications();

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

    // Set initial title
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

  // Preload lazy route chunks in the background once app is stable
  useEffect(() => {
    preloadRoutes();
  }, []);

  // Redirect to onboarding if not complete
  if (onboardingComplete === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="mobile-app">
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Onboarding - Full-screen, no Layout */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Main Pages */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/watchlist"
            element={
              <Layout>
                <WatchNextPage />
              </Layout>
            }
          />
          <Route
            path="/ratings"
            element={
              <Layout>
                <RatingsPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProfilePage />
              </Layout>
            }
          />

          {/* Additional Pages */}
          <Route
            path="/recently-watched"
            element={
              <Layout hideNav>
                <RecentlyWatchedPage />
              </Layout>
            }
          />
          <Route
            path="/discover"
            element={
              <Layout>
                <DiscoverPage />
              </Layout>
            }
          />
          <Route
            path="/activity"
            element={
              <Layout hideNav>
                <ActivityPage />
              </Layout>
            }
          />
          <Route
            path="/discussions"
            element={
              <Layout hideNav>
                <DiscussionFeedPage />
              </Layout>
            }
          />
          <Route
            path="/search"
            element={
              <Layout>
                <SearchPage />
              </Layout>
            }
          />
          <Route
            path="/badges"
            element={
              <Layout hideNav>
                <BadgesPage />
              </Layout>
            }
          />
          <Route
            path="/pets"
            element={
              <Layout hideNav>
                <PetsPage />
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
            path="/stats"
            element={
              <Layout hideNav>
                <StatsPage />
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
          <Route
            path="/profile-settings"
            element={
              <Layout hideNav>
                <ProfileSettingsPage />
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
                <RatingPage />
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
          <Route path="/catch-up" element={<CatchUpPage />} />
          <Route path="/hidden-series" element={<HiddenSeriesPage />} />
          <Route
            path="/leaderboard"
            element={
              <Layout hideNav>
                <LeaderboardPage />
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
            path="/calendar"
            element={
              <Layout hideNav>
                <CalendarPage />
              </Layout>
            }
          />
          <Route
            path="/countdowns"
            element={
              <Layout hideNav>
                <CountdownPage />
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
      </Suspense>
    </div>
  );
};
