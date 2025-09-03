import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DynamicThemeProvider } from '../contexts/ThemeContext';
import { MobileHomePage } from './pages/MobileHomePage';
import { MobileSeriesDetailPage } from './pages/MobileSeriesDetailPage';
import { MobileMovieDetailPage } from './pages/MobileMovieDetailPage';
import { MobileEpisodeManagementPage } from './pages/MobileEpisodeManagementPage';
import { MobileRatingPage } from './pages/MobileRatingPage';
import { MobileDiscoverPage } from './pages/MobileDiscoverPage';
import { MobileWatchNextPage } from './pages/MobileWatchNextPage';
import { MobileRatingsPage } from './pages/MobileRatingsPage';
import { MobileMoviesPage } from './pages/MobileMoviesPage';
import { MobileActivityPage } from './pages/MobileActivityPage';
import { MobileProfilePage } from './pages/MobileProfilePage';
import { MobileSearchPage } from './pages/MobileSearchPage';
import { MobileBadgesPage } from './pages/MobileBadgesPage';
import { MobileThemePage } from './pages/MobileThemePage';
import { MobileStatsPage } from './pages/MobileStatsPage';
import { MobileSettingsPage } from './pages/MobileSettingsPage';
import { MobileNewEpisodesPage } from './pages/MobileNewEpisodesPage';
import { MobileProfileSettingsPage } from './pages/MobileProfileSettingsPage';
import { MobileLayout } from './components/MobileLayout';
import './styles/MobileApp.css';

export const MobileApp: React.FC = () => {
  return (
    <DynamicThemeProvider>
      <div className="mobile-app">
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<MobileLayout><MobileHomePage /></MobileLayout>} />
          <Route path="/watchlist" element={<MobileLayout><MobileWatchNextPage /></MobileLayout>} />
          <Route path="/today-episodes" element={<MobileLayout><MobileNewEpisodesPage /></MobileLayout>} />
          <Route path="/movies" element={<MobileLayout><MobileMoviesPage /></MobileLayout>} />
          <Route path="/ratings" element={<MobileLayout><MobileRatingsPage /></MobileLayout>} />
          <Route path="/profile" element={<MobileLayout><MobileProfilePage /></MobileLayout>} />
          
          {/* Additional Pages */}
          <Route path="/new-episodes" element={<MobileLayout><MobileNewEpisodesPage /></MobileLayout>} />
          <Route path="/discover" element={<MobileLayout><MobileDiscoverPage /></MobileLayout>} />
          <Route path="/activity" element={<MobileLayout><MobileActivityPage /></MobileLayout>} />
          <Route path="/search" element={<MobileLayout><MobileSearchPage /></MobileLayout>} />
          <Route path="/badges" element={<MobileLayout hideNav><MobileBadgesPage /></MobileLayout>} />
          <Route path="/theme" element={<MobileLayout hideNav><MobileThemePage /></MobileLayout>} />
          <Route path="/stats" element={<MobileLayout hideNav><MobileStatsPage /></MobileLayout>} />
          <Route path="/settings" element={<MobileLayout hideNav><MobileProfileSettingsPage /></MobileLayout>} />
          
          {/* Detail Pages */}
          <Route path="/series/:id" element={<MobileLayout hideNav><MobileSeriesDetailPage /></MobileLayout>} />
          <Route path="/episodes/:id" element={<MobileLayout hideNav><MobileEpisodeManagementPage /></MobileLayout>} />
          <Route path="/rating/:type/:id" element={<MobileLayout hideNav><MobileRatingPage /></MobileLayout>} />
          <Route path="/movie/:id" element={<MobileLayout hideNav><MobileMovieDetailPage /></MobileLayout>} />
          
          {/* Redirect old routes */}
          <Route path="/profile/:id" element={<Navigate to="/profile" />} />
          <Route path="/friends" element={<Navigate to="/activity" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </DynamicThemeProvider>
  );
};