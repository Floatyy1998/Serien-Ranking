import { lazy } from 'react';

// Retry wrapper for lazy imports: on chunk load failure (e.g. after deploy),
// reload the page once to fetch fresh asset hashes.
const RELOAD_KEY = 'chunk-reload';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((error: unknown) => {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(RELOAD_KEY);
      throw error;
    })
  );
}

// Clear the reload flag on successful page load
if (sessionStorage.getItem(RELOAD_KEY)) {
  sessionStorage.removeItem(RELOAD_KEY);
}

// All other pages: lazy loaded
export const SeriesDetailPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "series-detail" */ './pages/SeriesDetail').then((m) => ({
    default: m.SeriesDetailPage,
  }))
);
export const MovieDetailPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "movie-detail" */ './pages/MovieDetail').then((m) => ({
    default: m.MovieDetailPage,
  }))
);
export const DiscoverPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "discover" */ './pages/Discover').then((m) => ({
    default: m.DiscoverPage,
  }))
);
export const ActivityPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "activity" */ './pages/Activity').then((m) => ({
    default: m.ActivityPage,
  }))
);
export const StatsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "stats" */ './pages/Stats').then((m) => ({ default: m.StatsPage }))
);
export const RecentlyWatchedPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "recently-watched" */ './pages/RecentlyWatched').then((m) => ({
    default: m.RecentlyWatchedPage,
  }))
);
export const BadgesPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "badges" */ './pages/Badges').then((m) => ({
    default: m.BadgesPage,
  }))
);
export const PetsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "pets" */ './pages/Pets').then((m) => ({ default: m.PetsPage }))
);
export const ThemePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "theme" */ './pages/Theme').then((m) => ({ default: m.ThemePage }))
);
export const HomeLayoutPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "home-layout" */ './pages/HomeLayout').then((m) => ({
    default: m.HomeLayoutPage,
  }))
);
export const WrappedPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "wrapped" */ './pages/Wrapped').then((m) => ({
    default: m.WrappedPage,
  }))
);
export const ActorUniversePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "actor-universe" */ './pages/ActorUniverse').then((m) => ({
    default: m.ActorUniversePage,
  }))
);
export const SettingsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "settings" */ './pages/Settings').then((m) => ({
    default: m.SettingsPage,
  }))
);
export const ProfileSettingsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "profile-settings" */ './pages/ProfileSettings').then((m) => ({
    default: m.ProfileSettingsPage,
  }))
);
export const EpisodeManagementPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "episode-management" */ './pages/EpisodeManagement').then((m) => ({
    default: m.EpisodeManagementPage,
  }))
);
export const EpisodeDiscussionPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "episode-discussion" */ './pages/EpisodeDiscussion').then((m) => ({
    default: m.EpisodeDiscussionPage,
  }))
);
export const RatingPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "rating" */ './pages/Rating').then((m) => ({
    default: m.RatingPage,
  }))
);
export const FriendProfilePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "friend-profile" */ './pages/FriendProfile').then((m) => ({
    default: m.FriendProfilePage,
  }))
);
export const TasteMatchPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "taste-match" */ './pages/TasteMatch').then((m) => ({
    default: m.TasteMatchPage,
  }))
);
export const WatchJourneyPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "watch-journey" */ './pages/WatchJourney').then((m) => ({
    default: m.WatchJourneyPage,
  }))
);
export const CatchUpPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "catch-up" */ './pages/CatchUp').then((m) => ({
    default: m.CatchUpPage,
  }))
);
export const HiddenSeriesPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "hidden-series" */ './pages/HiddenSeries').then((m) => ({
    default: m.HiddenSeriesPage,
  }))
);
export const ImpressumPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "impressum" */ './pages/Impressum').then((m) => ({
    default: m.ImpressumPage,
  }))
);
export const PrivacyPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "privacy" */ './pages/Privacy').then((m) => ({
    default: m.PrivacyPage,
  }))
);
export const DiscussionFeedPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "discussion-feed" */ './pages/DiscussionFeed').then((m) => ({
    default: m.DiscussionFeedPage,
  }))
);
export const CountdownPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "countdown" */ './pages/Countdown').then((m) => ({
    default: m.CountdownPage,
  }))
);
export const CalendarPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "calendar" */ './pages/Calendar').then((m) => ({
    default: m.CalendarPage,
  }))
);
export const OnboardingPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "onboarding" */ './pages/Onboarding').then((m) => ({
    default: m.OnboardingPage,
  }))
);
export const LeaderboardPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "leaderboard" */ './pages/Leaderboard').then((m) => ({
    default: m.LeaderboardPage,
  }))
);
export const PatchNotesPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "patch-notes" */ './pages/PatchNotes').then((m) => ({
    default: m.PatchNotesPage,
  }))
);
export const TasteProfilePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "taste-profile" */ './pages/TasteProfile').then((m) => ({
    default: m.TasteProfilePage,
  }))
);
export const AdminDashboardPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "admin-dashboard" */ './pages/AdminDashboard').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
export const BugReportPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "bug-report" */ './pages/BugReport').then((m) => ({
    default: m.BugReportPage,
  }))
);
export const MangaPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga" */ './pages/Manga').then((m) => ({
    default: m.MangaPage,
  }))
);
export const MangaDetailPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-detail" */ './pages/Manga/MangaDetailPage').then((m) => ({
    default: m.MangaDetailPage,
  }))
);
export const MangaRatingsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-ratings" */ './pages/Manga/MangaRatingsPage').then((m) => ({
    default: m.MangaRatingsPage,
  }))
);
export const MangaSearchPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-search" */ './pages/Manga/MangaSearchPage').then((m) => ({
    default: m.MangaSearchPage,
  }))
);
export const MangaCatchUpPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-catch-up" */ './pages/Manga/MangaCatchUpPage').then((m) => ({
    default: m.MangaCatchUpPage,
  }))
);
export const HiddenMangaPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "hidden-manga" */ './pages/Manga/HiddenMangaPage').then((m) => ({
    default: m.HiddenMangaPage,
  }))
);
export const RecentlyReadPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "recently-read" */ './pages/Manga/RecentlyReadPage').then((m) => ({
    default: m.RecentlyReadPage,
  }))
);
export const MangaStatsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-stats" */ './pages/Manga/MangaStatsPage').then((m) => ({
    default: m.MangaStatsPage,
  }))
);
export const MangaDiscoverPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-discover" */ './pages/Manga/MangaDiscoverPage').then((m) => ({
    default: m.MangaDiscoverPage,
  }))
);
export const MangaReadJourneyPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-journey" */ './pages/Manga/MangaReadJourneyPage').then(
    (m) => ({
      default: m.MangaReadJourneyPage,
    })
  )
);

export const MangaReadingListPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-reading-list" */ './pages/Manga/MangaReadingListPage').then(
    (m) => ({
      default: m.MangaReadingListPage,
    })
  )
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
