/**
 * useSeriesActions - Extracts all Firebase action handlers from SeriesDetailPage
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { getMaxWatchCount } from '../../lib/validation/rewatch.utils';
import { useSeriesList } from '../../contexts/SeriesListContext';
import type { Series } from '../../types/Series';
import type { SeriesEpisode, SeriesSeason } from './types';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { trackSeriesAdded, trackSeriesDeleted } from '../../firebase/analytics';
import { bumpSeriesVersion } from '../../lib/firebase/seriesVersionBump';
import { showToast, showUndoToast } from '../../lib/toast';

interface DialogState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
}

export function useSeriesActions(
  series: Series | null | undefined,
  userId: string | undefined,
  tmdbSeries: Series | null | undefined
) {
  const navigate = useNavigate();
  const { toggleHideSeries } = useSeriesList();

  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ open: false, message: '', type: 'info' });
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '' });
  const [showRewatchDialog, setShowRewatchDialog] = useState<{
    show: boolean;
    type: 'episode' | 'season';
    item: SeriesEpisode | null;
    seasonNumber?: number;
    episodeNumber?: number;
  }>({ show: false, type: 'episode', item: null });

  const showSnackbar = useCallback((message: string) => {
    setSnackbar({ open: true, message });
    setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
  }, []);

  const handleAddSeries = useCallback(async () => {
    if (!series || !userId) return;
    setIsAdding(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/add`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: import.meta.env.VITE_USER, id: series.id, uuid: userId }),
      });

      if (response.ok) {
        let posterPath: string | undefined;
        if (series.poster && typeof series.poster === 'object' && series.poster.poster) {
          posterPath = series.poster.poster;
        } else if (tmdbSeries?.poster?.poster) {
          posterPath = tmdbSeries.poster.poster;
        }
        await logSeriesAdded(
          userId,
          series.name || series.title || 'Unbekannte Serie',
          series.id,
          posterPath
        );
        trackSeriesAdded(String(series.id), series.name || series.title || '', 'detail_page');
        showSnackbar('Serie erfolgreich hinzugefügt!');
        navigate(`/series/${series.id}`, { replace: true });
      } else {
        const data = await response.json();
        if (data.error === 'Serie bereits vorhanden') {
          setDialog({ open: true, message: 'Serie ist bereits in deiner Liste!', type: 'warning' });
        } else {
          throw new Error('Fehler beim Hinzufügen');
        }
      }
    } catch {
      setDialog({ open: true, message: 'Fehler beim Hinzufügen der Serie.', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [series, userId, tmdbSeries, navigate, showSnackbar]);

  const handleDeleteSeries = useCallback(() => {
    if (!series || !userId) return;
    setDialog({
      open: true,
      message: 'Möchtest du diese Serie wirklich löschen?',
      type: 'warning',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await firebase.database().ref(`${userId}/serien/${series.nmr}`).remove();
          await firebase.database().ref(`${userId}/seriesIndex/${series.nmr}`).remove();
          bumpSeriesVersion(userId);
          trackSeriesDeleted(String(series.id), series.title || '');
          showSnackbar('Serie erfolgreich gelöscht!');
        } catch {
          setDialog({ open: true, message: 'Fehler beim Löschen der Serie.', type: 'error' });
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [series, userId, showSnackbar]);

  const handleWatchlistToggle = useCallback(async () => {
    if (!series || !userId) return;
    try {
      const newWatchlistStatus = !series.watchlist;
      await firebase
        .database()
        .ref(`${userId}/serien/${series.nmr}/watchlist`)
        .set(newWatchlistStatus);
      if (newWatchlistStatus) {
        const { logWatchlistAdded } = await import('../../features/badges/minimalActivityLogger');
        await logWatchlistAdded(userId, series.title, series.id);
      }
    } catch {
      setDialog({ open: true, message: 'Fehler beim Aktualisieren der Watchlist.', type: 'error' });
    }
  }, [series, userId]);

  const handleHideToggle = useCallback(async () => {
    if (!series || !userId) return;
    const newHiddenStatus = !series.hidden;
    try {
      await toggleHideSeries(series.nmr, newHiddenStatus);
      showSnackbar(newHiddenStatus ? 'Nicht weiterschauen' : 'Serie wieder aktiv');
    } catch {
      setDialog({ open: true, message: 'Fehler beim Ändern des Status.', type: 'error' });
    }
  }, [series, userId, toggleHideSeries, showSnackbar]);

  const handleEpisodeRewatch = useCallback(
    async (episode: SeriesEpisode) => {
      if (!series || !userId) return;
      try {
        const seasonIndex = series.seasons?.findIndex((s: SeriesSeason) =>
          s.episodes?.some((e: SeriesEpisode) => e.id === episode.id)
        );
        const episodeIndex = series.seasons?.[seasonIndex]?.episodes?.findIndex(
          (e: SeriesEpisode) => e.id === episode.id
        );
        if (seasonIndex === -1 || episodeIndex === -1) throw new Error('Episode not found');

        const db = firebase.database();
        const episodePath = `${userId}/serien/${series.nmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
        const prevWatchCount = episode.watchCount || 1;
        const [lastSnap] = await Promise.all([
          db.ref(`${episodePath}/lastWatchedAt`).once('value'),
        ]);
        const prevLastWatchedAt: string | null = lastSnap.val() || null;

        const newWatchCount = prevWatchCount + 1;
        await db.ref(`${episodePath}/watchCount`).set(newWatchCount);
        await db.ref(`${episodePath}/lastWatchedAt`).set(new Date().toISOString());
        bumpSeriesVersion(userId);

        const seasonNumber = (series.seasons?.[seasonIndex]?.seasonNumber || 0) + 1;

        let rewatchRemoved = false;
        if (series.rewatch?.active) {
          const targetCount = Math.max(2, (series.rewatch.round || 0) + 1);
          let allDone = true;
          for (const s of series.seasons || []) {
            for (const ep of s.episodes || []) {
              if (!ep.watched || ep.id === episode.id) continue;
              if ((ep.watchCount || 1) < targetCount) {
                allDone = false;
                break;
              }
            }
            if (!allDone) break;
          }
          if (allDone && newWatchCount >= targetCount) {
            await db.ref(`${userId}/serien/${series.nmr}/rewatch`).remove();
            bumpSeriesVersion(userId);
            showSnackbar(`Rewatch #${series.rewatch.round} abgeschlossen!`);
            rewatchRemoved = true;
          }
        }
        setShowRewatchDialog({ show: false, type: 'episode', item: null });

        showUndoToast(`S${seasonNumber}E${episodeIndex + 1} Rewatch markiert`, {
          onUndo: async () => {
            try {
              await db.ref(`${episodePath}/watchCount`).set(prevWatchCount);
              if (prevLastWatchedAt) {
                await db.ref(`${episodePath}/lastWatchedAt`).set(prevLastWatchedAt);
              } else {
                await db.ref(`${episodePath}/lastWatchedAt`).remove();
              }
              if (rewatchRemoved && series.rewatch) {
                await db.ref(`${userId}/serien/${series.nmr}/rewatch`).set(series.rewatch);
              }
            } catch {
              showToast('Undo fehlgeschlagen', 2000, 'error');
            }
          },
          onCommit: async () => {
            await petService.watchedSeriesWithGenreAllPets(userId, series.genre?.genres || []);
            const { updateEpisodeCounters } =
              await import('../../features/badges/minimalActivityLogger');
            await updateEpisodeCounters(userId, true, episode.air_date);
            WatchActivityService.logEpisodeWatch(
              userId,
              series.id,
              series.title || series.name || 'Unbekannte Serie',
              seasonNumber,
              episodeIndex + 1,
              episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
              true,
              series.genre?.genres,
              series.provider?.provider?.map((p) => p.name)
            );
          },
        });
      } catch {
        setDialog({ open: true, message: 'Fehler beim Rewatch der Episode.', type: 'error' });
      }
    },
    [series, userId, showSnackbar]
  );

  const handleEpisodeUnwatch = useCallback(
    async (episode: SeriesEpisode) => {
      if (!series || !userId) return;
      try {
        const seasonIndex = series.seasons?.findIndex((s: SeriesSeason) =>
          s.episodes?.some((e: SeriesEpisode) => e.id === episode.id)
        );
        const episodeIndex = series.seasons?.[seasonIndex]?.episodes?.findIndex(
          (e: SeriesEpisode) => e.id === episode.id
        );
        if (seasonIndex === -1 || episodeIndex === -1) throw new Error('Episode not found');

        const db = firebase.database();
        const episodePath = `${userId}/serien/${series.nmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;

        // Snapshot vorher
        const [watchCountSnap, firstSnap, lastSnap, watchedSnap] = await Promise.all([
          db.ref(`${episodePath}/watchCount`).once('value'),
          db.ref(`${episodePath}/firstWatchedAt`).once('value'),
          db.ref(`${episodePath}/lastWatchedAt`).once('value'),
          db.ref(`${episodePath}/watched`).once('value'),
        ]);
        const prevWatchCount: number = watchCountSnap.val() || 0;
        const prevFirstWatchedAt: string | null = firstSnap.val() || null;
        const prevLastWatchedAt: string | null = lastSnap.val() || null;
        const prevWatched: boolean = !!watchedSnap.val();

        if (episode.watchCount && episode.watchCount > 1) {
          await db.ref(`${episodePath}/watchCount`).set(episode.watchCount - 1);
        } else {
          await db.ref(`${episodePath}/watched`).remove();
          await db.ref(`${episodePath}/watchCount`).remove();
          await db.ref(`${episodePath}/firstWatchedAt`).remove();
          await db.ref(`${episodePath}/lastWatchedAt`).remove();
        }
        bumpSeriesVersion(userId);
        setShowRewatchDialog({ show: false, type: 'episode', item: null });

        const seasonNumber = (series.seasons?.[seasonIndex]?.seasonNumber || 0) + 1;
        showUndoToast(
          `S${seasonNumber}E${episodeIndex + 1} als nicht gesehen markiert`,
          async () => {
            try {
              await db.ref(`${episodePath}/watched`).set(prevWatched);
              await db.ref(`${episodePath}/watchCount`).set(prevWatchCount);
              if (prevFirstWatchedAt) {
                await db.ref(`${episodePath}/firstWatchedAt`).set(prevFirstWatchedAt);
              }
              if (prevLastWatchedAt) {
                await db.ref(`${episodePath}/lastWatchedAt`).set(prevLastWatchedAt);
              }
            } catch {
              showToast('Undo fehlgeschlagen', 2000, 'error');
            }
          }
        );
      } catch {
        setDialog({
          open: true,
          message: 'Fehler beim Markieren als nicht gesehen.',
          type: 'error',
        });
      }
    },
    [series, userId]
  );

  const handleStartRewatch = useCallback(
    async (continueExisting = false) => {
      if (!series || !userId) return;
      setDialog({ open: false, message: '', type: 'info' });
      try {
        const currentMaxCount = getMaxWatchCount(series);
        const newRound = continueExisting
          ? Math.max(1, currentMaxCount - 1)
          : Math.max(1, currentMaxCount);

        const seriesPath = `${userId}/serien/${series.nmr}`;
        await firebase.database().ref(`${seriesPath}/rewatch`).set({
          active: true,
          round: newRound,
          startedAt: new Date().toISOString(),
        });

        if (!series.watchlist) {
          await firebase.database().ref(`${seriesPath}/watchlist`).set(true);
        }

        showSnackbar(
          continueExisting ? `Rewatch #${newRound} fortgesetzt!` : `Rewatch #${newRound} gestartet!`
        );
      } catch {
        setDialog({
          open: true,
          message: 'Fehler beim Starten des Rewatches.',
          type: 'error',
        });
      }
    },
    [series, userId, showSnackbar]
  );

  const handleStopRewatch = useCallback(async () => {
    if (!series || !userId) return;
    try {
      await firebase.database().ref(`${userId}/serien/${series.nmr}/rewatch`).remove();
      bumpSeriesVersion(userId);
      showSnackbar('Rewatch beendet.');
    } catch {
      setDialog({ open: true, message: 'Fehler beim Beenden des Rewatches.', type: 'error' });
    }
  }, [series, userId, showSnackbar]);

  return {
    isAdding,
    isDeleting,
    dialog,
    setDialog,
    snackbar,
    showRewatchDialog,
    setShowRewatchDialog,
    handleAddSeries,
    handleDeleteSeries,
    handleWatchlistToggle,
    handleHideToggle,
    handleEpisodeRewatch,
    handleEpisodeUnwatch,
    handleStartRewatch,
    handleStopRewatch,
  };
}
