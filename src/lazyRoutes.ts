import { createElement, lazy, type ComponentType } from 'react';
import { t } from './services/i18n';

// Nach Chunk-Fehler: Reload erst, wenn die App im Hintergrund ist
let backgroundReloadArmed = false;
function armBackgroundReload() {
  if (backgroundReloadArmed) return;
  backgroundReloadArmed = true;
  const apply = () => {
    if (document.visibilityState === 'hidden') window.location.reload();
  };
  document.addEventListener('visibilitychange', apply);
  window.addEventListener('pagehide', apply);
}

const ChunkFailedPage: ComponentType = () =>
  createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        gap: '16px',
        padding: '32px',
        textAlign: 'center',
      },
    },
    createElement(
      'h2',
      {
        style: {
          color: 'var(--theme-primary, #00d123)',
          fontFamily: 'var(--font-display, inherit)',
          margin: 0,
        },
      },
      t('Seite konnte nicht geladen werden')
    ),
    createElement(
      'p',
      {
        style: {
          color: 'var(--color-text-secondary, rgba(255,255,255,0.7))',
          maxWidth: '340px',
          margin: 0,
          lineHeight: 1.5,
          fontSize: '15px',
        },
      },
      t(
        'Wahrscheinlich gibt es eine neue App-Version. Sie wird automatisch übernommen, sobald die App kurz im Hintergrund war — oder direkt hier:'
      )
    ),
    createElement(
      'button',
      {
        onClick: () => window.location.reload(),
        style: {
          border: 'none',
          borderRadius: '999px',
          padding: '12px 24px',
          fontWeight: 700,
          fontSize: '15px',
          cursor: 'pointer',
          color: '#000',
          background: 'var(--theme-primary, #00d123)',
        },
      },
      t('Jetzt aktualisieren')
    )
  );

// React.lazy itself constrains T to ComponentType<any>; we mirror that so the
// retry wrapper accepts the same shapes (FC<{}>, ComponentType<Props>, ...).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        return await factory();
      } catch {
        armBackgroundReload();
        return { default: ChunkFailedPage as unknown as T };
      }
    }
  });
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
export const RatingEditorPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "rating" */ './pages/RatingEditor').then((m) => ({
    default: m.RatingEditorPage,
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
export const SubscriptionsPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "subscriptions" */ './pages/Subscriptions').then((m) => ({
    default: m.SubscriptionsPage,
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

export const AnimeSeasonPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "anime-season" */ './pages/AnimeSeason').then((m) => ({
    default: m.AnimeSeasonPage,
  }))
);

export const SerienKalenderPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "serien-kalender" */ './pages/SerienKalender').then((m) => ({
    default: m.SerienKalenderPage,
  }))
);

export const FilmKalenderPage = lazyWithRetry(() =>
  import(/* webpackChunkName: "film-kalender" */ './pages/FilmKalender').then((m) => ({
    default: m.FilmKalenderPage,
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
    () => import('./pages/SeriesDetail'),
    () => import('./pages/MovieDetail'),
    () => import('./pages/Manga'),
    () => import('./pages/Activity'),
    () => import('./pages/Discover'),
    () => import('./pages/RecentlyWatched'),
    () => import('./pages/Calendar'),
    () => import('./pages/EpisodeManagement'),
    () => import('./pages/FriendProfile'),
    () => import('./pages/Settings'),
    () => import('./pages/Pets'),
    () => import('./pages/Leaderboard'),
    () => import('./pages/Badges'),
  ];

  const extendedRoutes = [
    () => import('./pages/Countdown'),
    () => import('./pages/Stats'),
    () => import('./pages/EpisodeDiscussion'),
    () => import('./pages/CatchUp'),
    () => import('./pages/Subscriptions'),
    () => import('./pages/RatingEditor'),
    () => import('./pages/Manga/MangaDetailPage'),
    () => import('./pages/Manga/MangaSearchPage'),
    () => import('./pages/Manga/MangaRatingsPage'),
    () => import('./pages/Manga/MangaCatchUpPage'),
    () => import('./pages/Manga/RecentlyReadPage'),
    () => import('./pages/Manga/MangaStatsPage'),
    () => import('./pages/Manga/MangaDiscoverPage'),
    () => import('./pages/Manga/MangaReadJourneyPage'),
    () => import('./pages/Manga/MangaReadingListPage'),
    () => import('./pages/Manga/HiddenMangaPage'),
    () => import('./pages/AnimeSeason'),
    () => import('./pages/SerienKalender'),
    () => import('./pages/FilmKalender'),
    () => import('./pages/Wrapped'),
    () => import('./pages/WatchJourney'),
    () => import('./pages/TasteMatch'),
    () => import('./pages/TasteProfile'),
    () => import('./pages/ActorUniverse'),
    () => import('./pages/DiscussionFeed'),
    () => import('./pages/HiddenSeries'),
    () => import('./pages/Theme'),
    () => import('./pages/HomeLayout'),
    () => import('./pages/PatchNotes'),
    () => import('./pages/BugReport'),
    () => import('./pages/Impressum'),
    () => import('./pages/Privacy'),
  ];

  const adminRoutes = [() => import('./pages/AdminDashboard')];

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
    routes[i++]().finally(() => idle(loadNext, 3000));
  }

  idle(loadNext, 5000);
}
