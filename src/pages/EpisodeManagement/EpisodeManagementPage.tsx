import { ChatBubbleOutline, Check, DateRange, ExpandLess, ExpandMore, Refresh, Visibility } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import { useEpisodeDiscussionCounts } from '../../hooks/useDiscussionCounts';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { Series } from '../../types/Series';
import { PageHeader } from '../../components/ui';
import './EpisodeManagementPage.css';

export const EpisodeManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { allSeriesList: seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [showWatchDialog, setShowWatchDialog] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<{
    seasonIndex: number;
    episodeIndex: number;
    episode: Series['seasons'][number]['episodes'][number];
  } | null>(null);

  const series = seriesList.find((s: Series) => s.id === Number(id));

  // Get episode discussion counts for the selected season
  const currentSeasonEpisodeCount = series?.seasons?.[selectedSeason]?.episodes?.length || 0;
  const episodeDiscussionCounts = useEpisodeDiscussionCounts(
    Number(id) || 0,
    (series?.seasons?.[selectedSeason]?.seasonNumber || 0) + 1, // Season numbers are 1-based in the discussion path
    currentSeasonEpisodeCount
  );

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

      const updatedEpisodes = season.episodes!.map((e, idx) => {
        if (idx === episodeIndex) {
          // Ensure data consistency: watched episodes must have watchCount >= 1
          if (newWatched && newWatchCount < 1) {
            newWatchCount = 1;
          }
          if (!newWatched) {
            newWatchCount = 0;
          }

          if (newWatched) {
            return {
              ...e,
              watched: true,
              watchCount: newWatchCount,
              firstWatchedAt: e.firstWatchedAt || new Date().toISOString(),
              lastWatchedAt: new Date().toISOString(),
            };
          } else {
            const { watchCount, firstWatchedAt, lastWatchedAt, ...episodeWithoutFields } = e;
            return {
              ...episodeWithoutFields,
              watched: false,
            };
          }
        }
        return e;
      });

      const updatedSeasons = series.seasons.map((s, idx) => {
        if (idx === seasonIndex) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });

      // Use Firebase batch update for better performance
      // Update seasons in Firebase using direct Firebase calls
      const seasonsRef = firebase.database().ref(`${user.uid}/serien/${series.nmr}/seasons`);
      await seasonsRef.set(updatedSeasons);

      // Badge system logging for episode changes
      if (!episode.watched && newWatched) {
        // Episode wird als gesehen markiert
        const { updateEpisodeCounters } = await import(
          '../../features/badges/minimalActivityLogger'
        );
        await updateEpisodeCounters(
          user.uid,
          false, // nicht rewatch
          episode.air_date
        );

        // Pet XP geben
        // Genre-basierter Pet-Boost
        await petService.watchedSeriesWithGenreAllPets(user.uid, series?.genre?.genres || []);

        // Wrapped 2026: Episode-Watch loggen
        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title,
          series.nmr,
          season.seasonNumber + 1,
          episodeIndex + 1,
          episode.name,
          series.episodeRuntime || 45,
          false, // isRewatch
          newWatchCount,
          series.genre?.genres,
          [...new Set(series.provider?.provider?.map(p => p.name))]
        );
      } else if (isWatched && newWatched && newWatchCount > currentWatchCount) {
        // Rewatch case
        const { updateEpisodeCounters } = await import(
          '../../features/badges/minimalActivityLogger'
        );
        await updateEpisodeCounters(
          user.uid,
          true, // rewatch
          episode.air_date
        );

        // Wrapped 2026: Rewatch loggen
        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title,
          series.nmr,
          season.seasonNumber + 1,
          episodeIndex + 1,
          episode.name,
          series.episodeRuntime || 45,
          true, // isRewatch
          newWatchCount,
          series.genre?.genres,
          [...new Set(series.provider?.provider?.map(p => p.name))]
        );
      }
    } catch (error) {
      console.error('Failed to toggle episode watch status:', error);
    }
  };

  const handleSeasonToggle = async (seasonIndex: number) => {
    if (!series || !user) return;

    const season = series.seasons[seasonIndex];
    const allWatched = season.episodes?.every((ep) => ep.watched);

    try {
      const updatedEpisodes = season.episodes?.map((ep) => {
        if (!allWatched) {
          // Mark all as watched
          return {
            ...ep,
            watched: true,
            watchCount: 1,
            firstWatchedAt: ep.firstWatchedAt || new Date().toISOString(),
            lastWatchedAt: new Date().toISOString(),
          };
        } else {
          // Mark all as unwatched
          const { watchCount, firstWatchedAt, lastWatchedAt, ...episodeWithoutFields } = ep;
          return {
            ...episodeWithoutFields,
            watched: false,
          };
        }
      });

      const updatedSeasons = series.seasons.map((s, idx) => {
        if (idx === seasonIndex) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });

      // Use Firebase batch update for better performance
      // Update seasons in Firebase using direct Firebase calls
      const seasonsRef = firebase.database().ref(`${user.uid}/serien/${series.nmr}/seasons`);
      await seasonsRef.set(updatedSeasons);

      // Badge system logging for season changes
      if (!allWatched && updatedEpisodes) {
        const previouslyUnwatched = season.episodes?.filter((ep) => !ep.watched) || [];
        if (previouslyUnwatched.length === season.episodes?.length) {
          // Whole season completed
          const { logSeasonWatchedClean } = await import(
            '../../features/badges/minimalActivityLogger'
          );
          await logSeasonWatchedClean(user.uid, season.episodes?.length || 0);
        } else {
          // Partial season completion - log individual episodes
          const { updateEpisodeCounters } = await import(
            '../../features/badges/minimalActivityLogger'
          );

          for (const episode of previouslyUnwatched) {
            await updateEpisodeCounters(
              user.uid,
              false, // nicht rewatch
              episode.air_date
            );
          }
        }

        // Pet XP für alle neu gesehenen Episoden geben
        const { petService } = await import('../../services/petService');
        for (let i = 0; i < previouslyUnwatched.length; i++) {
          // Genre-basierter Pet-Boost
          await petService.watchedSeriesWithGenreAllPets(user.uid, series?.genre?.genres || []);
        }

        // Wrapped 2026: Alle neu gesehenen Episoden loggen
        for (let i = 0; i < previouslyUnwatched.length; i++) {
          const ep = previouslyUnwatched[i];
          const epIndex = season.episodes?.findIndex((e) => e.id === ep.id) || i;
          WatchActivityService.logEpisodeWatch(
            user.uid,
            series.id,
            series.title,
            series.nmr,
            season.seasonNumber + 1,
            epIndex + 1,
            ep.name,
            series.episodeRuntime || 45,
            false,
            1,
            series.genre?.genres,
            [...new Set(series.provider?.provider?.map(p => p.name))]
          );
        }
      }
    } catch (error) {
      console.error('Failed to toggle season watch status:', error);
    }
  };

  if (!series) {
    return (
      <div className="mobile-episode-page">
        <PageHeader title="Serie nicht gefunden" sticky={false} />
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
      <PageHeader
        title={series.title}
        subtitle="Episoden verwalten"
        sticky={false}
      />

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
        <Tooltip title="Vorherige Staffel" arrow>
          <span>
            <button
              className="tab-nav-button"
              onClick={handleSwipeRight}
              disabled={selectedSeason === 0}
            >
              <ExpandLess />
            </button>
          </span>
        </Tooltip>

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

        <Tooltip title="Nächste Staffel" arrow>
          <span>
            <button
              className="tab-nav-button"
              onClick={handleSwipeLeft}
              disabled={!series || selectedSeason === series.seasons.length - 1}
            >
              <ExpandMore />
            </button>
          </span>
        </Tooltip>
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
                <div className="episode-number">{index + 1}</div>

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

                {/* Discussion Button */}
                <Tooltip title="Diskussion" arrow>
                  <button
                    className="episode-discussion-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/episode/${id}/s/${currentSeason?.seasonNumber + 1}/e/${index + 1}`);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px',
                      cursor: 'pointer',
                      color: episodeDiscussionCounts[index + 1] ? currentTheme.primary : currentTheme.text.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <ChatBubbleOutline style={{ fontSize: '18px' }} />
                    {episodeDiscussionCounts[index + 1] > 0 && (
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>
                        {episodeDiscussionCounts[index + 1]}
                      </span>
                    )}
                  </button>
                </Tooltip>

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
