import { armBackgroundReload, lazyWithRetry } from './lazyWithRetry';

export { lazyWithRetry };

// All other pages: lazy loaded
export const SeriesDetailPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "series-detail" */ '../pages/SeriesDetail').then((m) => ({
    default: m.SeriesDetailPage,
  }))
);
export const MovieDetailPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "movie-detail" */ '../pages/MovieDetail').then((m) => ({
    default: m.MovieDetailPage,
  }))
);
export const PersonPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "person" */ '../pages/Person').then((m) => ({
    default: m.PersonPage,
  }))
);
export const DiscoverPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "discover" */ '../pages/Discover').then((m) => ({
    default: m.DiscoverPage,
  }))
);
export const ActivityPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "activity" */ '../pages/Activity').then((m) => ({
    default: m.ActivityPage,
  }))
);
export const StatsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "stats" */ '../pages/Stats').then((m) => ({ default: m.StatsPage }))
);
export const RecentlyWatchedPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "recently-watched" */ '../pages/RecentlyWatched').then((m) => ({
    default: m.RecentlyWatchedPage,
  }))
);
export const BadgesPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "badges" */ '../pages/Badges').then((m) => ({
    default: m.BadgesPage,
  }))
);
export const PetsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "pets" */ '../pages/Pets').then((m) => ({ default: m.PetsPage }))
);
export const ThemePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "theme" */ '../pages/Theme').then((m) => ({ default: m.ThemePage }))
);
export const HomeLayoutPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "home-layout" */ '../pages/HomeLayout').then((m) => ({
    default: m.HomeLayoutPage,
  }))
);
export const WrappedPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "wrapped" */ '../pages/Wrapped').then((m) => ({
    default: m.WrappedPage,
  }))
);
export const ActorUniversePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "actor-universe" */ '../pages/ActorUniverse').then((m) => ({
    default: m.ActorUniversePage,
  }))
);
export const SettingsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "settings" */ '../pages/Settings').then((m) => ({
    default: m.SettingsPage,
  }))
);
export const EpisodeManagementPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "episode-management" */ '../pages/EpisodeManagement').then((m) => ({
    default: m.EpisodeManagementPage,
  }))
);
export const EpisodeDiscussionPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "episode-discussion" */ '../pages/EpisodeDiscussion').then((m) => ({
    default: m.EpisodeDiscussionPage,
  }))
);
export const RatingEditorPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "rating" */ '../pages/RatingEditor').then((m) => ({
    default: m.RatingEditorPage,
  }))
);
export const FriendProfilePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "friend-profile" */ '../pages/FriendProfile').then((m) => ({
    default: m.FriendProfilePage,
  }))
);
export const TasteMatchPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "taste-match" */ '../pages/TasteMatch').then((m) => ({
    default: m.TasteMatchPage,
  }))
);
export const WatchJourneyPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "watch-journey" */ '../pages/WatchJourney').then((m) => ({
    default: m.WatchJourneyPage,
  }))
);
export const CatchUpPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "catch-up" */ '../pages/CatchUp').then((m) => ({
    default: m.CatchUpPage,
  }))
);
export const HiddenSeriesPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "hidden-series" */ '../pages/HiddenSeries').then((m) => ({
    default: m.HiddenSeriesPage,
  }))
);
export const ImpressumPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "impressum" */ '../pages/Impressum').then((m) => ({
    default: m.ImpressumPage,
  }))
);
export const PrivacyPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "privacy" */ '../pages/Privacy').then((m) => ({
    default: m.PrivacyPage,
  }))
);
export const DiscussionFeedPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "discussion-feed" */ '../pages/DiscussionFeed').then((m) => ({
    default: m.DiscussionFeedPage,
  }))
);
export const CountdownPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "countdown" */ '../pages/Countdown').then((m) => ({
    default: m.CountdownPage,
  }))
);
export const CalendarPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "calendar" */ '../pages/Calendar').then((m) => ({
    default: m.CalendarPage,
  }))
);
export const OnboardingPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "onboarding" */ '../pages/Onboarding').then((m) => ({
    default: m.OnboardingPage,
  }))
);
export const LeaderboardPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "leaderboard" */ '../pages/Leaderboard').then((m) => ({
    default: m.LeaderboardPage,
  }))
);
export const PatchNotesPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "patch-notes" */ '../pages/PatchNotes').then((m) => ({
    default: m.PatchNotesPage,
  }))
);
export const TasteProfilePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "taste-profile" */ '../pages/TasteProfile').then((m) => ({
    default: m.TasteProfilePage,
  }))
);
export const AdminDashboardPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "admin-dashboard" */ '../pages/AdminDashboard').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
export const BugReportPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "bug-report" */ '../pages/BugReport').then((m) => ({
    default: m.BugReportPage,
  }))
);
export const SubscriptionsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "subscriptions" */ '../pages/Subscriptions').then((m) => ({
    default: m.SubscriptionsPage,
  }))
);
export const ReadingPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "reading" */ '../pages/Reading').then((m) => ({
    default: m.ReadingPage,
  }))
);
export const MangaDetailPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-detail" */ '../pages/Manga/MangaDetailPage').then((m) => ({
    default: m.MangaDetailPage,
  }))
);
export const MangaSearchPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "manga-search" */ '../pages/Manga/MangaSearchPage').then((m) => ({
    default: m.MangaSearchPage,
  }))
);

export const ReadingListPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "reading-list" */ '../pages/Reading/list/ReadingListPage').then(
    (m) => ({
      default: m.ReadingListPage,
    })
  )
);
export const ReadingCatchUpPage = lazyWithRetry(() =>
  import(
    /* webpackChunkName: "reading-catch-up" */ '../pages/Reading/list/ReadingCatchUpPage'
  ).then((m) => ({
    default: m.ReadingCatchUpPage,
  }))
);
export const ReadingRatingsPage = lazyWithRetry(() =>
  import(
    /* webpackChunkName: "reading-ratings" */ '../pages/Reading/ratings/ReadingRatingsPage'
  ).then((m) => ({
    default: m.ReadingRatingsPage,
  }))
);
export const ReadingHistoryPage = lazyWithRetry(() =>
  import(
    /* webpackChunkName: "reading-history" */ '../pages/Reading/history/ReadingHistoryPage'
  ).then((m) => ({
    default: m.ReadingHistoryPage,
  }))
);
export const ReadingStatsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "reading-stats" */ '../pages/Reading/stats/ReadingStatsPage').then(
    (m) => ({
      default: m.ReadingStatsPage,
    })
  )
);
export const ReadingLibraryPage = lazyWithRetry(() =>
  import(
    /* webpackChunkName: "reading-library" */ '../pages/Reading/library/ReadingLibraryPage'
  ).then((m) => ({
    default: m.ReadingLibraryPage,
  }))
);
export const ReadingDiscoverPage = lazyWithRetry(() =>
  import(
    /* webpackChunkName: "reading-discover" */ '../pages/Reading/discover/ReadingDiscoverPage'
  ).then((m) => ({
    default: m.ReadingDiscoverPage,
  }))
);
export const ReadingGenrePage = lazyWithRetry(() =>
  import(/* webpackChunkName: "reading-genre" */ '../pages/Reading/ReadingGenrePage').then((m) => ({
    default: m.ReadingGenrePage,
  }))
);
export const ReadingLayoutPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "reading-layout" */ '../pages/Reading/ReadingLayoutPage').then(
    (m) => ({
      default: m.ReadingLayoutPage,
    })
  )
);

export const BookSearchPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "book-search" */ '../pages/Books/BookSearchPage').then((m) => ({
    default: m.BookSearchPage,
  }))
);
export const BookDetailPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "book-detail" */ '../pages/Books/BookDetailPage').then((m) => ({
    default: m.BookDetailPage,
  }))
);
export const BookImportPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "book-import" */ '../pages/Books/BookImportPage').then((m) => ({
    default: m.BookImportPage,
  }))
);

export const AnimeSeasonPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "anime-season" */ '../pages/AnimeSeason').then((m) => ({
    default: m.AnimeSeasonPage,
  }))
);

export const SerienKalenderPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "serien-kalender" */ '../pages/SerienKalender').then((m) => ({
    default: m.SerienKalenderPage,
  }))
);

export const FilmKalenderPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "film-kalender" */ '../pages/FilmKalender').then((m) => ({
    default: m.FilmKalenderPage,
  }))
);

export const ChatsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "chats" */ '../pages/Chats').then((m) => ({
    default: m.ChatsPage,
  }))
);

export const ChatThreadPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "chats" */ '../pages/Chats').then((m) => ({
    default: m.ChatThreadPage,
  }))
);

export const SharedListPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "shared-list" */ '../pages/SharedList').then((m) => ({
    default: m.SharedListPage,
  }))
);

// Routen-Chunks im Leerlauf vorladen — importierte Module überleben Deploys.
//
// iOS-Shell (kein Service Worker!) braucht den VOLL-Preload aller Routen als
// Deploy-Schutz — neue Lazy-Routen müssen dort weiterhin eingetragen werden.
// Im Web/PWA precached der Service Worker ohnehin alle Chunks; dort reicht das
// Warmladen der meistbesuchten Seiten (spart Idle-CPU auf Low-End-Geräten).
export function preloadRoutes(opts: { isAdmin?: boolean } = {}) {
  const coreRoutes = [
    () => import('../pages/SeriesDetail'),
    () => import('../pages/MovieDetail'),
    () => import('../pages/Reading'),
    () => import('../pages/Activity'),
    () => import('../pages/Discover'),
    () => import('../pages/RecentlyWatched'),
    () => import('../pages/Calendar'),
    () => import('../pages/EpisodeManagement'),
    () => import('../pages/FriendProfile'),
    () => import('../pages/Settings'),
    () => import('../pages/Pets'),
    () => import('../pages/Leaderboard'),
    () => import('../pages/Badges'),
  ];

  const extendedRoutes = [
    () => import('../pages/Countdown'),
    () => import('../pages/Stats'),
    () => import('../pages/EpisodeDiscussion'),
    () => import('../pages/CatchUp'),
    () => import('../pages/Subscriptions'),
    () => import('../pages/RatingEditor'),
    () => import('../pages/Person'),
    () => import('../pages/Manga/MangaDetailPage'),
    () => import('../pages/Manga/MangaSearchPage'),
    () => import('../pages/Reading/ReadingLayoutPage'),
    () => import('../pages/Reading/list/ReadingListPage'),
    () => import('../pages/Reading/list/ReadingCatchUpPage'),
    () => import('../pages/Reading/ratings/ReadingRatingsPage'),
    () => import('../pages/Reading/history/ReadingHistoryPage'),
    () => import('../pages/Reading/stats/ReadingStatsPage'),
    () => import('../pages/Reading/library/ReadingLibraryPage'),
    () => import('../pages/Reading/discover/ReadingDiscoverPage'),
    () => import('../pages/Reading/ReadingGenrePage'),
    () => import('../pages/Books/BookSearchPage'),
    () => import('../pages/Books/BookDetailPage'),
    () => import('../pages/Books/BookImportPage'),
    () => import('../pages/AnimeSeason'),
    () => import('../pages/SerienKalender'),
    () => import('../pages/FilmKalender'),
    () => import('../pages/Chats'),
    () => import('../pages/SharedList'),
    () => import('../pages/Wrapped'),
    () => import('../pages/WatchJourney'),
    () => import('../pages/TasteMatch'),
    () => import('../pages/TasteProfile'),
    () => import('../pages/ActorUniverse'),
    () => import('../pages/DiscussionFeed'),
    () => import('../pages/HiddenSeries'),
    () => import('../pages/Theme'),
    () => import('../pages/HomeLayout'),
    () => import('../pages/PatchNotes'),
    () => import('../pages/BugReport'),
    () => import('../pages/Impressum'),
    () => import('../pages/Privacy'),
  ];

  const adminRoutes = [() => import('../pages/AdminDashboard')];

  const isNativeShell =
    typeof window !== 'undefined' && !!(window as unknown as { Capacitor?: unknown }).Capacitor;
  const hasServiceWorker =
    typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;

  const routes = [
    ...coreRoutes,
    // Ohne SW (iOS-Shell, Erstbesuch) alles vorladen — Deploy-Schutz.
    ...(isNativeShell || !hasServiceWorker ? extendedRoutes : []),
    ...(opts.isAdmin ? adminRoutes : []),
  ];

  // WKWebView/ältere Safari haben kein requestIdleCallback
  const idle = (cb: () => void, timeout: number) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(cb, { timeout });
    } else {
      setTimeout(cb, Math.min(timeout, 1000));
    }
  };

  let i = 0;
  function loadNext() {
    if (i >= routes.length) return;
    // .catch VOR .finally: finally reicht eine Ablehnung durch, der Fehler
    // waere sonst eine unbehandelte Promise-Rejection ("'text/html' is not a
    // valid JavaScript MIME type" — nach einem Deploy liefert Hosting fuer den
    // verschwundenen Chunk die index.html). Zugleich der einzige Ort, an dem
    // ein veralteter Tab das ueberhaupt bemerkt: Hintergrund-Reload scharf
    // machen, damit er sich beim naechsten Wegblenden erneuert.
    routes[i++]()
      .then((mod) => {
        // Leerer Namespace = der Chunk kam an, lief aber nicht durch. Dann
        // faende React.lazy spaeter nur undefined vor (Fehler #306).
        if (!mod || Object.keys(mod).length === 0) armBackgroundReload();
      })
      .catch(() => armBackgroundReload())
      .finally(() => idle(loadNext, 3000));
  }

  // Nicht im Hintergrund vorladen: iOS kappt der unsichtbaren WebView die
  // Verbindungen, die Vorlade-Anfragen brechen also nur ab und kosten
  // Bandbreite. Startet die App im Hintergrund (z. B. Aufwaermen nach einem
  // Push), warten wir auf den ersten sichtbaren Moment.
  const start = () => idle(loadNext, 5000);
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVisible);
      start();
    };
    document.addEventListener('visibilitychange', onVisible);
  } else {
    start();
  }
}
