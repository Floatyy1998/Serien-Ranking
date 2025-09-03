import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DynamicThemeProvider } from '../contexts/ThemeContext';
import { MobileLayout } from './components/MobileLayout';
import { ScrollToTop } from './components/ScrollToTop';
import { MobileActivityPage } from './pages/MobileActivityPage';
import { MobileBadgesPage } from './pages/MobileBadgesPage';
import { MobileDiscoverPage } from './pages/MobileDiscoverPage';
import { MobileEpisodeManagementPage } from './pages/MobileEpisodeManagementPage';
import { MobileFriendProfilePage } from './pages/MobileFriendProfilePage';
import { MobileHomePage } from './pages/MobileHomePage';
import { MobileMovieDetailPage } from './pages/MobileMovieDetailPage';
import { MobileNewEpisodesPage } from './pages/MobileNewEpisodesPage';
import { MobileProfilePage } from './pages/MobileProfilePage';
import { MobileProfileSettingsPage } from './pages/MobileProfileSettingsPage';
import { MobileRatingPage } from './pages/MobileRatingPage';
import { MobileRatingsPage } from './pages/MobileRatingsPage';
import { MobileSearchPage } from './pages/MobileSearchPage';
import { MobileSeriesDetailPage } from './pages/MobileSeriesDetailPage';
import { MobileSettingsPage } from './pages/MobileSettingsPage';
import { MobileStatsPage } from './pages/MobileStatsPage';
import { MobileThemePage } from './pages/MobileThemePage';
import { MobileWatchNextPage } from './pages/MobileWatchNextPage';
import './styles/MobileApp.css';

export const MobileApp: React.FC = () => {
  return (
    <DynamicThemeProvider>
      <div className='mobile-app'>
        <ScrollToTop />
        <Routes>
          {/* Main Pages */}
          <Route
            path='/'
            element={
              <MobileLayout>
                <MobileHomePage />
              </MobileLayout>
            }
          />
          <Route
            path='/watchlist'
            element={
              <MobileLayout>
                <MobileWatchNextPage />
              </MobileLayout>
            }
          />
          <Route
            path='/today-episodes'
            element={
              <MobileLayout>
                <MobileNewEpisodesPage />
              </MobileLayout>
            }
          />
          <Route
            path='/ratings'
            element={
              <MobileLayout>
                <MobileRatingsPage />
              </MobileLayout>
            }
          />
          <Route
            path='/profile'
            element={
              <MobileLayout>
                <MobileProfilePage />
              </MobileLayout>
            }
          />

          {/* Additional Pages */}
          <Route
            path='/new-episodes'
            element={
              <MobileLayout>
                <MobileNewEpisodesPage />
              </MobileLayout>
            }
          />
          <Route
            path='/discover'
            element={
              <MobileLayout>
                <MobileDiscoverPage />
              </MobileLayout>
            }
          />
          <Route
            path='/activity'
            element={
              <MobileLayout hideNav>
                <MobileActivityPage />
              </MobileLayout>
            }
          />
          <Route
            path='/search'
            element={
              <MobileLayout>
                <MobileSearchPage />
              </MobileLayout>
            }
          />
          <Route
            path='/badges'
            element={
              <MobileLayout hideNav>
                <MobileBadgesPage />
              </MobileLayout>
            }
          />
          <Route
            path='/theme'
            element={
              <MobileLayout hideNav>
                <MobileThemePage />
              </MobileLayout>
            }
          />
          <Route
            path='/stats'
            element={
              <MobileLayout hideNav>
                <MobileStatsPage />
              </MobileLayout>
            }
          />
          <Route
            path='/settings'
            element={
              <MobileLayout hideNav>
                <MobileSettingsPage />
              </MobileLayout>
            }
          />
          <Route
            path='/profile-settings'
            element={
              <MobileLayout hideNav>
                <MobileProfileSettingsPage />
              </MobileLayout>
            }
          />

          {/* Detail Pages */}
          <Route
            path='/series/:id'
            element={
              <MobileLayout hideNav>
                <MobileSeriesDetailPage />
              </MobileLayout>
            }
          />
          <Route
            path='/episodes/:id'
            element={
              <MobileLayout hideNav>
                <MobileEpisodeManagementPage />
              </MobileLayout>
            }
          />
          <Route
            path='/rating/:type/:id'
            element={
              <MobileLayout hideNav>
                <MobileRatingPage />
              </MobileLayout>
            }
          />
          <Route
            path='/movie/:id'
            element={
              <MobileLayout hideNav>
                <MobileMovieDetailPage />
              </MobileLayout>
            }
          />
          <Route
            path='/friend/:id'
            element={
              <MobileLayout hideNav>
                <MobileFriendProfilePage />
              </MobileLayout>
            }
          />

          {/* Redirect old routes */}
          <Route path='/profile/:id' element={<MobileFriendProfilePage />} />
          <Route path='/friends' element={<Navigate to='/activity' />} />
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </div>
    </DynamicThemeProvider>
  );
};
