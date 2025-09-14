import { Navigate, Route, Routes } from 'react-router-dom';
import { DynamicThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ActivityPage } from './pages/ActivityPage';
import { BadgesPage } from './pages/BadgesPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { EpisodeManagementPage } from './pages/EpisodeManagementPage';
import { FriendProfilePage } from './pages/FriendProfilePage';
import { HomePage } from './pages/HomePage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { NewEpisodesPage } from './pages/NewEpisodesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { RatingPage } from './pages/RatingPage';
import { RatingsPage } from './pages/RatingsPage';
import { SearchPage } from './pages/SearchPage';
import { SeriesDetailPage } from './pages/SeriesDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import { ThemePage } from './pages/ThemePage';
import { WatchNextPage } from './pages/WatchNextPage';
import { ImpressumPage } from './pages/ImpressumPage';
import { PrivacyPage } from './pages/PrivacyPage';
import './styles/App.css';

export const MobileApp = () => {
  return (
    <DynamicThemeProvider>
      <div className="mobile-app">
        <ScrollToTop />
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
      </div>
    </DynamicThemeProvider>
  );
};