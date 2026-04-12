import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useEpisodeDiscussionCounts } from '../../hooks/discussionCountHooks';
import { shouldTriggerQuickRate, useQuickSeasonRating } from '../../hooks/useQuickSeasonRating';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import type { Series } from '../../types/Series';
import { trackEpisodeWatched, trackEpisodeUnwatched } from '../../firebase/analytics';
import { showToast, showUndoToast } from '../../lib/toast';

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
  const { user } = useAuth() || {};
  const { allSeriesList: seriesList } = useSeriesList();

  // --- Quick Rating ---
  const {
    quickRatingOpen,
    quickRatingSeries,
    quickRatingSeasonNumber,
    showQuickRating,
    closeQuickRating,
    saveQuickRating,
  } = useQuickSeasonRating();

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
    const episode = season.episodes[episodeIndex];

    try {
      const currentWatchCount = episode.watchCount || 0;
      const isWatched = episode.watched;
      const prevSeasons = JSON.parse(JSON.stringify(series.seasons));

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

      if (newWatched && newWatchCount < 1) {
        newWatchCount = 1;
      }
      if (!newWatched) {
        newWatchCount = 0;
      }

      const basePath = `users/${user.uid}/seriesWatch/${series.id}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
      const db = firebase.database();

      if (newWatched) {
        const now = new Date().toISOString();
        const updates: Record<string, unknown> = {
          [`${basePath}/watched`]: true,
          [`${basePath}/watchCount`]: newWatchCount,
          [`${basePath}/lastWatchedAt`]: now,
          [`users/${user.uid}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
        };
        if (!episode.firstWatchedAt) {
          updates[`${basePath}/firstWatchedAt`] = now;
        }
        await db.ref().update(updates);
      } else {
        await db.ref().update({
          [`${basePath}/watched`]: false,
          [`${basePath}/watchCount`]: null,
          [`${basePath}/firstWatchedAt`]: null,
          [`${basePath}/lastWatchedAt`]: null,
          [`users/${user.uid}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
        });
      }

      // Quick-Rate: Trigger wenn letzte Episode der letzten Staffel markiert
      if (newWatched && shouldTriggerQuickRate(series, seasonIndex, episodeIndex)) {
        setTimeout(() => {
          showQuickRating(series, series.seasons[seasonIndex].seasonNumber + 1);
        }, 500);
      }

      const label = `S${season.seasonNumber + 1}E${episodeIndex + 1}`;
      const action = newWatched ? 'als gesehen markiert' : 'als nicht gesehen markiert';
      showUndoToast(`${series.title} ${label} ${action}`, {
        onUndo: async () => {
          try {
            const undoPath = `users/${user.uid}/seriesWatch/${series.id}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
            const prevEp = prevSeasons[seasonIndex].episodes[episodeIndex] as {
              watched?: boolean;
              watchCount?: number;
              firstWatchedAt?: string;
              lastWatchedAt?: string;
            };
            const undoWatch: Record<string, unknown> = {
              watched: prevEp.watched ?? false,
            };
            if (prevEp.watchCount != null) undoWatch.watchCount = prevEp.watchCount;
            if (prevEp.firstWatchedAt) undoWatch.firstWatchedAt = prevEp.firstWatchedAt;
            if (prevEp.lastWatchedAt) undoWatch.lastWatchedAt = prevEp.lastWatchedAt;
            await firebase.database().ref(undoPath).set(undoWatch);
          } catch {
            showToast('Undo fehlgeschlagen', 2000, 'error');
          }
        },
        onCommit: async () => {
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
        },
      });
    } catch (error) {
      console.error('Failed to toggle episode watch status:', error);
      showToast('Fehler beim Speichern', 3000, 'error');
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
      const prevSeasons = JSON.parse(JSON.stringify(series.seasons));
      const now = new Date().toISOString();
      const basePath = `users/${user.uid}/seriesWatch/${series.id}/seasons`;
      const updates: Record<string, unknown> = {};

      series.seasons.forEach((season, sIdx) => {
        const eps = Array.isArray(season.episodes)
          ? season.episodes
          : season.episodes
            ? (Object.values(season.episodes) as typeof season.episodes)
            : [];

        eps.forEach((ep, eIdx) => {
          if (ep.watched) return;
          const shouldMark =
            sIdx < targetSeasonIndex || (sIdx === targetSeasonIndex && eIdx < targetEpisodeIndex);
          if (!shouldMark) return;

          const epPath = `${basePath}/${sIdx}/episodes/${eIdx}`;
          updates[`${epPath}/watched`] = true;
          updates[`${epPath}/watchCount`] = 1;
          updates[`${epPath}/firstWatchedAt`] = now;
          updates[`${epPath}/lastWatchedAt`] = now;
        });
      });

      updates[`users/${user.uid}/meta/serienVersion`] = firebase.database.ServerValue.TIMESTAMP;
      await firebase.database().ref().update(updates);
      setSelectedSeason(targetSeasonIndex);

      showUndoToast(`Catch-Up bis S${targetSeasonIndex + 1}E${targetEpisodeIndex}`, async () => {
        try {
          // Undo: betroffene Seasons zurückschreiben
          const undoUpdates: Record<string, unknown> = {};
          for (let sIdx = 0; sIdx <= targetSeasonIndex; sIdx++) {
            undoUpdates[`${basePath}/${sIdx}/episodes`] = prevSeasons[sIdx].episodes;
          }
          await firebase.database().ref().update(undoUpdates);
        } catch {
          showToast('Undo fehlgeschlagen', 2000, 'error');
        }
      });
    } catch (error) {
      console.error('Failed to catch up episodes:', error);
      showToast('Fehler beim Speichern', 3000, 'error');
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
      // Nach dem Catalog-Split enthaelt seriesWatch NUR Watch-Felder
      // (watched, watchCount, firstWatchedAt, lastWatchedAt). Episode-
      // Metadaten wie airstamp/name/air_date liegen ausschliesslich im
      // Catalog. Frueher wurde hier das komplette Episode-Objekt mit
      // ...ep gespreaded — das schreibt dann auch undefined-Felder nach
      // Firebase und laesst die Set-Operation fehlschlagen.
      type WatchEpisode = {
        watched: boolean;
        watchCount?: number;
        firstWatchedAt?: string;
        lastWatchedAt?: string;
      };
      const updatedEpisodes: WatchEpisode[] = (season.episodes ?? []).map((ep) => {
        const now = new Date().toISOString();
        if (mode === 'unwatch') {
          return { watched: false, watchCount: 0 };
        } else if (mode === 'rewatch') {
          const result: WatchEpisode = {
            watched: true,
            watchCount: (ep.watchCount || 1) + 1,
            firstWatchedAt: ep.firstWatchedAt || now,
            lastWatchedAt: now,
          };
          return result;
        } else {
          if (!allWatched) {
            return {
              watched: true,
              watchCount: 1,
              firstWatchedAt: ep.firstWatchedAt || now,
              lastWatchedAt: now,
            };
          } else {
            return { watched: false, watchCount: 0 };
          }
        }
      });

      // Fuer Undo: nur Watch-Felder des alten Zustands snapshotten. Keine
      // Metadaten (airstamp/name/air_date), die das Set sonst aufblaehen
      // und mit undefined-Feldern zum Scheitern bringen wuerden.
      const prevEpisodes: WatchEpisode[] = (season.episodes ?? []).map((ep) => {
        const w: WatchEpisode = { watched: ep.watched ?? false };
        if (ep.watchCount != null) w.watchCount = ep.watchCount;
        if (ep.firstWatchedAt) w.firstWatchedAt = ep.firstWatchedAt;
        if (ep.lastWatchedAt) w.lastWatchedAt = ep.lastWatchedAt;
        return w;
      });
      const episodesRef = firebase
        .database()
        .ref(`users/${user.uid}/seriesWatch/${series.id}/seasons/${seasonIndex}/episodes`);
      await episodesRef.set(updatedEpisodes);
      firebase
        .database()
        .ref(`users/${user.uid}/meta/serienVersion`)
        .set(firebase.database.ServerValue.TIMESTAMP);

      // Quick-Rate: Trigger wenn letzte Staffel komplett markiert
      if (mode !== 'unwatch') {
        const lastSeasonIndex = series.seasons.length - 1;
        if (seasonIndex === lastSeasonIndex) {
          const lastEpisodeIndex = (season.episodes?.length || 1) - 1;
          if (shouldTriggerQuickRate(series, seasonIndex, lastEpisodeIndex)) {
            setTimeout(() => {
              showQuickRating(series, season.seasonNumber + 1);
            }, 500);
          }
        }
      }

      const seasonLabel = `Staffel ${season.seasonNumber + 1}`;
      const modeLabel =
        mode === 'unwatch'
          ? 'als nicht gesehen markiert'
          : mode === 'rewatch'
            ? 'Rewatch markiert'
            : 'als gesehen markiert';
      showUndoToast(`${series.title} ${seasonLabel} ${modeLabel}`, async () => {
        try {
          await episodesRef.set(prevEpisodes);
        } catch {
          showToast('Undo fehlgeschlagen', 2000, 'error');
        }
      });
    } catch (error) {
      console.error('Failed to toggle season watch status:', error);
      showToast('Fehler beim Speichern', 3000, 'error');
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

    // Quick rating
    quickRatingOpen,
    quickRatingSeries,
    quickRatingSeasonNumber,
    closeQuickRating,
    saveQuickRating,
  };
};
