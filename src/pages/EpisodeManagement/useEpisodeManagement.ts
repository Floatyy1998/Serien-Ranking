import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useEpisodeDiscussionCounts } from '../../hooks/useDiscussionCounts';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { Series } from '../../types/Series';
import { trackEpisodeWatched, trackEpisodeUnwatched } from '../../firebase/analytics';

type Episode = Series['seasons'][number]['episodes'][number];

function getEpisodeRuntime(series: Series, episode: Episode): number {
  return episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;
}

export interface SelectedEpisode {
  seasonIndex: number;
  episodeIndex: number;
  episode: Episode;
}

export interface SeasonProgress {
  watchedCount: number;
  totalCount: number;
  allWatched: boolean;
  seasonMinWatchCount: number;
  progress: number;
}

export const useEpisodeManagement = () => {
  const { id } = useParams();
  const { user } = useAuth()!;
  const { allSeriesList: seriesList } = useSeriesList();

  // --- State ---
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWatchDialog, setShowWatchDialog] = useState(false);
  const [showCatchUpDialog, setShowCatchUpDialog] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);

  // --- Pull-to-refresh refs ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  // --- Derived data ---
  const series = seriesList.find((s: Series) => s.id === Number(id));
  const currentSeason = series?.seasons?.[selectedSeason];

  // Discussion counts for current season
  const currentSeasonEpisodeCount = currentSeason?.episodes?.length || 0;
  const episodeDiscussionCounts = useEpisodeDiscussionCounts(
    Number(id) || 0,
    (currentSeason?.seasonNumber || 0) + 1,
    currentSeasonEpisodeCount
  );

  // Season progress
  const seasonProgress: SeasonProgress = (() => {
    const watchedCount = currentSeason?.episodes?.filter((ep) => ep.watched).length || 0;
    const totalCount = currentSeason?.episodes?.length || 0;
    const allWatched = watchedCount === totalCount && totalCount > 0;
    const seasonMinWatchCount = allWatched
      ? Math.min(...(currentSeason?.episodes?.map((ep) => ep.watchCount || 1) || [1]))
      : 0;
    const progress = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;
    return { watchedCount, totalCount, allWatched, seasonMinWatchCount, progress };
  })();

  // --- Effects ---

  // Auto-select first unwatched season
  useEffect(() => {
    if (series) {
      const firstUnwatchedSeason = series.seasons?.findIndex((season) =>
        season.episodes?.some((ep) => !ep.watched)
      );
      if (firstUnwatchedSeason !== undefined && firstUnwatchedSeason !== -1) {
        setSelectedSeason(firstUnwatchedSeason);
      }
    }
  }, [series]);

  // --- Pull-to-refresh handlers ---

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
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  // --- Season navigation ---

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

  // --- Episode toggle logic ---

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
        if (currentWatchCount > 1) {
          newWatched = true;
          newWatchCount = currentWatchCount - 1;
        } else {
          newWatched = false;
          newWatchCount = 0;
        }
      } else if (isWatched) {
        newWatched = true;
        newWatchCount = currentWatchCount + 1;
      } else {
        newWatched = true;
        newWatchCount = 1;
      }

      const updatedEpisodes = season.episodes!.map((e, idx) => {
        if (idx === episodeIndex) {
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

      const seasonsRef = firebase.database().ref(`${user.uid}/serien/${series.nmr}/seasons`);
      await seasonsRef.set(updatedSeasons);

      // Analytics & badge system logging for episode changes
      if (newWatched) {
        trackEpisodeWatched(series.title, season.seasonNumber + 1, episodeIndex + 1, {
          tmdbId: series.id,
          genres: series.genre?.genres,
          runtime: getEpisodeRuntime(series, episode),
          isRewatch: (episode as Record<string, unknown>).watchCount
            ? Number((episode as Record<string, unknown>).watchCount) > 0
            : false,
          source: 'episode_management',
        });
      } else {
        trackEpisodeUnwatched(series.title, season.seasonNumber + 1, episodeIndex + 1);
      }
      if (!episode.watched && newWatched) {
        const { updateEpisodeCounters } =
          await import('../../features/badges/minimalActivityLogger');
        await updateEpisodeCounters(user.uid, false, episode.air_date);

        await petService.watchedSeriesWithGenreAllPets(user.uid, series?.genre?.genres || []);

        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title,
          season.seasonNumber + 1,
          episodeIndex + 1,
          getEpisodeRuntime(series, episode),
          false,
          series.genre?.genres,
          [...new Set(series.provider?.provider?.map((p) => p.name))]
        );
      } else if (isWatched && newWatched && newWatchCount > currentWatchCount) {
        const { updateEpisodeCounters } =
          await import('../../features/badges/minimalActivityLogger');
        await updateEpisodeCounters(user.uid, true, episode.air_date);

        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title,
          season.seasonNumber + 1,
          episodeIndex + 1,
          getEpisodeRuntime(series, episode),
          true,
          series.genre?.genres,
          [...new Set(series.provider?.provider?.map((p) => p.name))]
        );
      }
    } catch (error) {
      console.error('Failed to toggle episode watch status:', error);
    }
  };

  // --- Episode click (show dialog or toggle) ---

  const handleEpisodeClick = (seasonIndex: number, episodeIndex: number) => {
    const episode = series?.seasons[seasonIndex]?.episodes?.[episodeIndex];
    if (!episode) return;

    if (episode.watched) {
      setSelectedEpisode({ seasonIndex, episodeIndex, episode });
      setShowWatchDialog(true);
    } else {
      handleEpisodeToggle(seasonIndex, episodeIndex);
    }
  };

  // --- Catch-up logic ---

  const handleCatchUp = async (targetSeasonIndex: number, targetEpisodeIndex: number) => {
    if (!series || !user) return;

    try {
      const now = new Date().toISOString();
      const updatedSeasons = series.seasons.map((season, sIdx) => {
        const eps = Array.isArray(season.episodes)
          ? season.episodes
          : season.episodes
            ? (Object.values(season.episodes) as typeof season.episodes)
            : [];

        if (sIdx < targetSeasonIndex) {
          return {
            ...season,
            episodes: eps.map((ep) =>
              ep.watched
                ? ep
                : {
                    ...ep,
                    watched: true,
                    watchCount: 1,
                    firstWatchedAt: now,
                    lastWatchedAt: now,
                  }
            ),
          };
        } else if (sIdx === targetSeasonIndex) {
          return {
            ...season,
            episodes: eps.map((ep, eIdx) =>
              eIdx < targetEpisodeIndex && !ep.watched
                ? {
                    ...ep,
                    watched: true,
                    watchCount: 1,
                    firstWatchedAt: now,
                    lastWatchedAt: now,
                  }
                : ep
            ),
          };
        }
        return season;
      });

      const seasonsRef = firebase.database().ref(`${user.uid}/serien/${series.nmr}/seasons`);
      await seasonsRef.set(updatedSeasons);

      setSelectedSeason(targetSeasonIndex);
    } catch (error) {
      console.error('Failed to catch up episodes:', error);
    }
  };

  // --- Season bulk toggle ---

  const handleSeasonToggle = async (
    seasonIndex: number,
    mode: 'watch' | 'unwatch' | 'rewatch' = 'watch'
  ) => {
    if (!series || !user) return;

    const season = series.seasons[seasonIndex];
    const allWatched = season.episodes?.every((ep) => ep.watched);

    try {
      const updatedEpisodes = season.episodes?.map((ep) => {
        if (mode === 'unwatch') {
          const { watchCount, firstWatchedAt, lastWatchedAt, ...episodeWithoutFields } = ep;
          return { ...episodeWithoutFields, watched: false };
        } else if (mode === 'rewatch') {
          return {
            ...ep,
            watched: true,
            watchCount: (ep.watchCount || 1) + 1,
            firstWatchedAt: ep.firstWatchedAt || new Date().toISOString(),
            lastWatchedAt: new Date().toISOString(),
          };
        } else {
          if (!allWatched) {
            return {
              ...ep,
              watched: true,
              watchCount: 1,
              firstWatchedAt: ep.firstWatchedAt || new Date().toISOString(),
              lastWatchedAt: new Date().toISOString(),
            };
          } else {
            const { watchCount, firstWatchedAt, lastWatchedAt, ...episodeWithoutFields } = ep;
            return { ...episodeWithoutFields, watched: false };
          }
        }
      });

      const updatedSeasons = series.seasons.map((s, idx) => {
        if (idx === seasonIndex) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });

      const seasonsRef = firebase.database().ref(`${user.uid}/serien/${series.nmr}/seasons`);
      await seasonsRef.set(updatedSeasons);
    } catch (error) {
      console.error('Failed to toggle season watch status:', error);
    }
  };

  // --- Watch dialog actions ---

  const handleWatchDialogIncrease = () => {
    if (selectedEpisode) {
      handleEpisodeToggle(selectedEpisode.seasonIndex, selectedEpisode.episodeIndex);
      setShowWatchDialog(false);
    }
  };

  const handleWatchDialogDecrease = () => {
    if (selectedEpisode) {
      handleEpisodeToggle(selectedEpisode.seasonIndex, selectedEpisode.episodeIndex, true);
      setShowWatchDialog(false);
    }
  };

  const closeWatchDialog = () => {
    setShowWatchDialog(false);
  };

  return {
    // Series data
    series,
    currentSeason,
    seriesId: id,

    // Season selection
    selectedSeason,
    setSelectedSeason,
    handleSwipeLeft,
    handleSwipeRight,

    // Season progress
    seasonProgress,

    // Episode discussion counts
    episodeDiscussionCounts,

    // Pull-to-refresh
    isRefreshing,
    scrollContainerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Episode actions
    handleEpisodeClick,
    handleEpisodeToggle,

    // Bulk actions
    handleSeasonToggle,
    handleCatchUp,

    // Catch-up dialog
    showCatchUpDialog,
    setShowCatchUpDialog,

    // Watch count dialog
    showWatchDialog,
    selectedEpisode,
    handleWatchDialogIncrease,
    handleWatchDialogDecrease,
    closeWatchDialog,
  };
};
