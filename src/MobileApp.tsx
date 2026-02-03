import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DynamicThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import './styles/App.css';

// Lazy load all pages for better code splitting
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const WatchNextPage = lazy(() => import('./pages/WatchNextPage').then((m) => ({ default: m.WatchNextPage })));
const RatingsPage = lazy(() => import('./pages/RatingsPage').then((m) => ({ default: m.RatingsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NewEpisodesPage = lazy(() => import('./pages/NewEpisodesPage').then((m) => ({ default: m.NewEpisodesPage })));
const RecentlyWatchedPage = lazy(() => import('./pages/RecentlyWatchedPage').then((m) => ({ default: m.RecentlyWatchedPage })));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage })));
const ActivityPage = lazy(() => import('./pages/ActivityPage').then((m) => ({ default: m.ActivityPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const BadgesPage = lazy(() => import('./pages/BadgesPage').then((m) => ({ default: m.BadgesPage })));
const PetsPage = lazy(() => import('./pages/PetsPage').then((m) => ({ default: m.PetsPage })));
const ThemePage = lazy(() => import('./pages/ThemePage').then((m) => ({ default: m.ThemePage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const WrappedPage = lazy(() => import('./pages/WrappedPage').then((m) => ({ default: m.WrappedPage })));
const ActorUniversePage = lazy(() => import('./pages/ActorUniversePage').then((m) => ({ default: m.ActorUniversePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage').then((m) => ({ default: m.ProfileSettingsPage })));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage').then((m) => ({ default: m.SeriesDetailPage })));
const EpisodeManagementPage = lazy(() => import('./pages/EpisodeManagementPage').then((m) => ({ default: m.EpisodeManagementPage })));
const EpisodeDiscussionPage = lazy(() => import('./pages/EpisodeDiscussionPage').then((m) => ({ default: m.EpisodeDiscussionPage })));
const RatingPage = lazy(() => import('./pages/RatingPage').then((m) => ({ default: m.RatingPage })));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage').then((m) => ({ default: m.MovieDetailPage })));
const FriendProfilePage = lazy(() => import('./pages/FriendProfilePage').then((m) => ({ default: m.FriendProfilePage })));
const TasteMatchPage = lazy(() => import('./pages/TasteMatchPage').then((m) => ({ default: m.TasteMatchPage })));
const WatchJourneyPage = lazy(() => import('./pages/WatchJourneyPage').then((m) => ({ default: m.WatchJourneyPage })));
const CatchUpPage = lazy(() => import('./pages/CatchUpPage').then((m) => ({ default: m.CatchUpPage })));
const ImpressumPage = lazy(() => import('./pages/ImpressumPage').then((m) => ({ default: m.ImpressumPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--theme-background, #000)' }}>
    <div style={{ color: 'var(--theme-primary, #fff)' }}>Loading...</div>
  </div>
);

export const MobileApp = () => {
  return (
    <DynamicThemeProvider>
      <div className="mobile-app">
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
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
            path="/new-episodes"
            element={
              <Layout>
                <NewEpisodesPage />
              </Layout>
            }
          />
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
            path="/stats"
            element={
              <Layout hideNav>
                <StatsPage />
              </Layout>
            }
          />
          {/* Wrapped routes - config wird in WrappedPage aus Firebase geprüft */}
          <Route
            path="/wrapped"
            element={<WrappedPage />}
          />
          <Route
            path="/wrapped/:year"
            element={<WrappedPage />}
          />
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
          <Route
            path="/taste-match/:friendId"
            element={<TasteMatchPage />}
          />
          <Route
            path="/watch-journey"
            element={<WatchJourneyPage />}
          />
          <Route
            path="/catch-up"
            element={<CatchUpPage />}
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
    </DynamicThemeProvider>
  );
};