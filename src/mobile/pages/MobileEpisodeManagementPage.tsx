import { Check, DateRange, ExpandLess, ExpandMore, Refresh, Visibility } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import apiService from '../../services/api.service';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import { Series } from '../../types/Series';
import { MobileBackButton } from '../components/MobileBackButton';
import './MobileEpisodeManagementPage.css';

export const MobileEpisodeManagementPage = () => {
  const { id } = useParams();
  const { user } = useAuth()!;
  const { seriesList, updateEpisode, refetchSeries } = useSeriesList();
  const { currentTheme } = useTheme();
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [showWatchDialog, setShowWatchDialog] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<{
    seasonIndex: number;
    episodeIndex: number;
    episode: any;
  } | null>(null);

  const series = seriesList.find((s: Series) => s.id === Number(id) || s._id === id || s.tmdbId === Number(id));

  useEffect(() => {
    if (series) {
      // Find first season with unwatched episodes
      const firstUnwatchedSeason = series.seasons?.findIndex((season) =>
        season.episodes?.some((ep) => !ep.watched)
      );
      if (firstUnwatchedSeason !== undefined && firstUnwatchedSeason !== -1) {
        setSelectedSeason(firstUnwatchedSeason);
      }
    }
  }, [series]);

  // Pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 100 && scrollContainerRef.current?.scrollTop === 0) {
      setIsRefreshing(true);
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing) {
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  // Swipe between seasons
  const handleSwipeLeft = () => {
    if (series && selectedSeason < series.seasons.length - 1) {
      setSelectedSeason(selectedSeason + 1);
    }
  };

  const handleSwipeRight = () => {
    if (selectedSeason > 0) {
      setSelectedSeason(selectedSeason - 1);
    }
  };

  // Handle episode click - show dialog for watched episodes
  const handleEpisodeClick = (seasonIndex: number, episodeIndex: number) => {
    const episode = series?.seasons[seasonIndex]?.episodes?.[episodeIndex];
    if (!episode) return;

    if (episode.watched) {
      // Show dialog for watched episodes
      setSelectedEpisode({ seasonIndex, episodeIndex, episode });
      setShowWatchDialog(true);
    } else {
      // For unwatched episodes, just mark as watched
      handleEpisodeToggle(seasonIndex, episodeIndex);
    }
  };

  const handleEpisodeToggle = async (
    seasonIndex: number,
    episodeIndex: number,
    longPress = false
  ) => {
    if (!series || !user) return;

    const season = series.seasons[seasonIndex];
    const episode = season.episodes![episodeIndex];

    try {
      const currentWatchCount = episode.watchCount || 0;
      const isWatched = episode.watched;

      let newWatched: boolean;
      let newWatchCount: number;

      if (longPress && isWatched) {
        // Long press on watched episode: decrement watch count
        if (currentWatchCount > 1) {
          // If watched multiple times, just decrement
          newWatched = true;
          newWatchCount = currentWatchCount - 1;
        } else {
          // If only watched once, mark as unwatched
          newWatched = false;
          newWatchCount = 0;
        }
      } else if (isWatched) {
        // Normal tap on watched episode: increment watch count (rewatch)
        newWatched = true;
        newWatchCount = currentWatchCount + 1;
      } else {
        // Tap on unwatched episode: mark as watched
        newWatched = true;
        newWatchCount = 1;
      }


      // Update episode using API
      // Use seasonNumber if available, fallback to season_number
      const seasonNum = season.season_number ?? season.seasonNumber;
      const episodeNum = episode.episode_number;
      
      if (newWatched) {
        await updateEpisode(series.id.toString(), {
          seasonNumber: seasonNum,
          episodeNumber: episodeNum,
          watched: true,
          watchCount: newWatchCount,
          firstWatchedAt: episode.firstWatchedAt || new Date().toISOString()
        });
      } else {
        await updateEpisode(series.id.toString(), {
          seasonNumber: seasonNum,
          episodeNumber: episodeNum,
          watched: false,
          watchCount: 0
        });
      }
      
      // Force refresh to ensure UI updates
      setTimeout(() => refetchSeries(), 100);

    } catch (error) {}
  };

  const handleSeasonToggle = async (seasonIndex: number) => {
    if (!series || !user) return;

    const season = series.seasons[seasonIndex];
    const allWatched = season.episodes?.every((ep) => ep.watched);

    try {
      // Update all episodes in the season using API
      const seasonNum = season.season_number ?? season.seasonNumber;
      if (!allWatched) {
        // Mark all as watched
        await apiService.updateSeasonWatched(series.id.toString(), seasonNum, true);
      } else {
        // Mark all as unwatched
        await apiService.updateSeasonWatched(series.id.toString(), seasonNum, false);
      }

      // Refetch the series to update the local state
      await refetchSeries();

    } catch (error) {
      console.error('Failed to update season watched status:', error);
    }
  };

  if (!series) {
    return (
      <div className="mobile-episode-page">
        <div
          className="episode-header"
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          }}
        >
          <MobileBackButton />
          <h1>Serie nicht gefunden</h1>
        </div>
      </div>
    );
  }

  const currentSeason = series.seasons[selectedSeason];
  const watchedCount = currentSeason?.episodes?.filter((ep) => ep.watched).length || 0;
  const totalCount = currentSeason?.episodes?.length || 0;
  const progress = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;

  return (
    <div className="mobile-episode-page">
      {/* Native App Header */}
      <div
        className="episode-header"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <MobileBackButton />
        <div className="header-content">
          <h1>{series.title}</h1>
          <p>Episoden verwalten</p>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            className="refresh-indicator"
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
          >
            <Refresh className="spinning" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Season Tabs with Swipe */}
      <div className="season-tabs">
        <button
          className="tab-nav-button"
          onClick={handleSwipeRight}
          disabled={selectedSeason === 0}
        >
          <ExpandLess />
        </button>

        <div className="tabs-container">
          {series.seasons.map((season, index) => (
            <button
              key={index}
              className={`season-tab ${selectedSeason === index ? 'active' : ''}`}
              onClick={() => setSelectedSeason(index)}
            >
              <span className="season-label">S{season.seasonNumber + 1}</span>
              <span className="season-count">
                {season.episodes?.filter((ep) => ep.watched).length || 0}/
                {season.episodes?.length || 0}
              </span>
            </button>
          ))}
        </div>

        <button
          className="tab-nav-button"
          onClick={handleSwipeLeft}
          disabled={!series || selectedSeason === series.seasons.length - 1}
        >
          <ExpandMore />
        </button>
      </div>

      {/* Season Progress */}
      <div className="season-progress">
        <div className="progress-header">
          <h2>Staffel {currentSeason?.seasonNumber + 1}</h2>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <button className="mark-all-button" onClick={() => handleSeasonToggle(selectedSeason)}>
          {watchedCount === totalCount
            ? 'Alle als ungesehen markieren'
            : 'Alle als gesehen markieren'}
        </button>
      </div>

      {/* Episodes List */}
      <div
        className="episodes-container"
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSeason}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="episodes-list"
          >
            {currentSeason?.episodes?.map((episode, index) => (
              <motion.div
                key={episode.id}
                className={`episode-item ${episode.watched ? 'watched' : ''}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEpisodeClick(selectedSeason, index)}
              >
                <div className="episode-number">{episode.episode_number || index + 1}</div>

                <div className="episode-details">
                  <h3>{episode.name}</h3>
                  <div className="episode-meta">
                    <span className="meta-item">
                      <DateRange fontSize="small" />
                      {getUnifiedEpisodeDate(episode.air_date)}
                    </span>
                    {episode.firstWatchedAt && (
                      <span className="meta-item watched-date">
                        <Visibility fontSize="small" />
                        {getUnifiedEpisodeDate(episode.firstWatchedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="episode-status">
                  {episode.watched ? (
                    <div className="status-watched">
                      <Check />
                      {/* Show watch count only if > 1 */}
                      {(episode.watchCount || 0) > 1 && (
                        <span className="watch-count">{episode.watchCount}x</span>
                      )}
                    </div>
                  ) : (
                    <div className="status-unwatched" />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Watch Count Dialog */}
      {showWatchDialog && selectedEpisode && (
        <div className="watch-dialog-overlay" onClick={() => setShowWatchDialog(false)}>
          <motion.div
            className="watch-dialog"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h3>{selectedEpisode.episode.name}</h3>
              <p>Aktuell: {selectedEpisode.episode.watchCount || 1}x gesehen</p>
            </div>

            <div className="dialog-buttons">
              <button
                className="dialog-button increase"
                onClick={() => {
                  handleEpisodeToggle(selectedEpisode.seasonIndex, selectedEpisode.episodeIndex);
                  setShowWatchDialog(false);
                }}
              >
                +1 (nochmal gesehen)
              </button>

              <button
                className="dialog-button decrease"
                onClick={() => {
                  handleEpisodeToggle(
                    selectedEpisode.seasonIndex,
                    selectedEpisode.episodeIndex,
                    true
                  );
                  setShowWatchDialog(false);
                }}
              >
                -1 (weniger gesehen)
              </button>

              <button className="dialog-button cancel" onClick={() => setShowWatchDialog(false)}>
                Abbrechen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
