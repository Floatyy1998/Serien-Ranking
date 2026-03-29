import { lazy } from 'react';

// All other pages: lazy loaded
export const SeriesDetailPage = lazy(() =>
  import(/* webpackChunkName: "series-detail" */ './pages/SeriesDetail').then((m) => ({
    default: m.SeriesDetailPage,
  }))
);
export const MovieDetailPage = lazy(() =>
  import(/* webpackChunkName: "movie-detail" */ './pages/MovieDetail').then((m) => ({
    default: m.MovieDetailPage,
  }))
);
export const DiscoverPage = lazy(() =>
  import(/* webpackChunkName: "discover" */ './pages/Discover').then((m) => ({
    default: m.DiscoverPage,
  }))
);
export const ActivityPage = lazy(() =>
  import(/* webpackChunkName: "activity" */ './pages/Activity').then((m) => ({
    default: m.ActivityPage,
  }))
);
export const StatsPage = lazy(() =>
  import(/* webpackChunkName: "stats" */ './pages/Stats').then((m) => ({ default: m.StatsPage }))
);
export const RecentlyWatchedPage = lazy(() =>
  import(/* webpackChunkName: "recently-watched" */ './pages/RecentlyWatched').then((m) => ({
    default: m.RecentlyWatchedPage,
  }))
);
export const BadgesPage = lazy(() =>
  import(/* webpackChunkName: "badges" */ './pages/Badges').then((m) => ({
    default: m.BadgesPage,
  }))
);
export const PetsPage = lazy(() =>
  import(/* webpackChunkName: "pets" */ './pages/Pets').then((m) => ({ default: m.PetsPage }))
);
export const ThemePage = lazy(() =>
  import(/* webpackChunkName: "theme" */ './pages/Theme').then((m) => ({ default: m.ThemePage }))
);
export const HomeLayoutPage = lazy(() =>
  import(/* webpackChunkName: "home-layout" */ './pages/HomeLayout').then((m) => ({
    default: m.HomeLayoutPage,
  }))
);
export const WrappedPage = lazy(() =>
  import(/* webpackChunkName: "wrapped" */ './pages/Wrapped').then((m) => ({
    default: m.WrappedPage,
  }))
);
export const ActorUniversePage = lazy(() =>
  import(/* webpackChunkName: "actor-universe" */ './pages/ActorUniverse').then((m) => ({
    default: m.ActorUniversePage,
  }))
);
export const SettingsPage = lazy(() =>
  import(/* webpackChunkName: "settings" */ './pages/Settings').then((m) => ({
    default: m.SettingsPage,
  }))
);
export const ProfileSettingsPage = lazy(() =>
  import(/* webpackChunkName: "profile-settings" */ './pages/ProfileSettings').then((m) => ({
    default: m.ProfileSettingsPage,
  }))
);
export const EpisodeManagementPage = lazy(() =>
  import(/* webpackChunkName: "episode-management" */ './pages/EpisodeManagement').then((m) => ({
    default: m.EpisodeManagementPage,
  }))
);
export const EpisodeDiscussionPage = lazy(() =>
  import(/* webpackChunkName: "episode-discussion" */ './pages/EpisodeDiscussion').then((m) => ({
    default: m.EpisodeDiscussionPage,
  }))
);
export const RatingPage = lazy(() =>
  import(/* webpackChunkName: "rating" */ './pages/Rating').then((m) => ({
    default: m.RatingPage,
  }))
);
export const FriendProfilePage = lazy(() =>
  import(/* webpackChunkName: "friend-profile" */ './pages/FriendProfile').then((m) => ({
    default: m.FriendProfilePage,
  }))
);
export const TasteMatchPage = lazy(() =>
  import(/* webpackChunkName: "taste-match" */ './pages/TasteMatch').then((m) => ({
    default: m.TasteMatchPage,
  }))
);
export const WatchJourneyPage = lazy(() =>
  import(/* webpackChunkName: "watch-journey" */ './pages/WatchJourney').then((m) => ({
    default: m.WatchJourneyPage,
  }))
);
export const CatchUpPage = lazy(() =>
  import(/* webpackChunkName: "catch-up" */ './pages/CatchUp').then((m) => ({
    default: m.CatchUpPage,
  }))
);
export const HiddenSeriesPage = lazy(() =>
  import(/* webpackChunkName: "hidden-series" */ './pages/HiddenSeries').then((m) => ({
    default: m.HiddenSeriesPage,
  }))
);
export const ImpressumPage = lazy(() =>
  import(/* webpackChunkName: "impressum" */ './pages/Impressum').then((m) => ({
    default: m.ImpressumPage,
  }))
);
export const PrivacyPage = lazy(() =>
  import(/* webpackChunkName: "privacy" */ './pages/Privacy').then((m) => ({
    default: m.PrivacyPage,
  }))
);
export const DiscussionFeedPage = lazy(() =>
  import(/* webpackChunkName: "discussion-feed" */ './pages/DiscussionFeed').then((m) => ({
    default: m.DiscussionFeedPage,
  }))
);
export const CountdownPage = lazy(() =>
  import(/* webpackChunkName: "countdown" */ './pages/Countdown').then((m) => ({
    default: m.CountdownPage,
  }))
);
export const CalendarPage = lazy(() =>
  import(/* webpackChunkName: "calendar" */ './pages/Calendar').then((m) => ({
    default: m.CalendarPage,
  }))
);
export const OnboardingPage = lazy(() =>
  import(/* webpackChunkName: "onboarding" */ './pages/Onboarding').then((m) => ({
    default: m.OnboardingPage,
  }))
);
export const LeaderboardPage = lazy(() =>
  import(/* webpackChunkName: "leaderboard" */ './pages/Leaderboard').then((m) => ({
    default: m.LeaderboardPage,
  }))
);
export const PatchNotesPage = lazy(() =>
  import(/* webpackChunkName: "patch-notes" */ './pages/PatchNotes').then((m) => ({
    default: m.PatchNotesPage,
  }))
);
export const TasteProfilePage = lazy(() =>
  import(/* webpackChunkName: "taste-profile" */ './pages/TasteProfile').then((m) => ({
    default: m.TasteProfilePage,
  }))
);
export const AdminDashboardPage = lazy(() =>
  import(/* webpackChunkName: "admin-dashboard" */ './pages/AdminDashboard').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
export const BugReportPage = lazy(() =>
  import(/* webpackChunkName: "bug-report" */ './pages/BugReport').then((m) => ({
    default: m.BugReportPage,
  }))
);

// Preload all lazy route chunks when the browser is idle
// so that first navigation to any page feels instant
export function preloadRoutes() {
  const routes = [
    () => import('./pages/SeriesDetail'),
    () => import('./pages/MovieDetail'),
    () => import('./pages/Activity'),
    () => import('./pages/Discover'),
    () => import('./pages/RecentlyWatched'),
    () => import('./pages/Calendar'),
    () => import('./pages/Countdown'),
    () => import('./pages/Stats'),
    () => import('./pages/EpisodeManagement'),
    () => import('./pages/EpisodeDiscussion'),
    () => import('./pages/FriendProfile'),
    () => import('./pages/Badges'),
    () => import('./pages/Settings'),
  ];

  let i = 0;
  function loadNext() {
    if (i >= routes.length) return;
    routes[i++]().finally(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadNext, { timeout: 3000 });
      }
    });
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadNext, { timeout: 5000 });
  } else {
    // Fallback for Safari
    setTimeout(loadNext, 2000);
  }
}
