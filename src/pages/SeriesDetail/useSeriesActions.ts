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
import {
  trackEpisodeUnwatched,
  trackEpisodeWatched,
  trackSeriesAdded,
  trackSeriesDeleted,
} from '../../firebase/analytics';
import { backendFetch } from '../../lib/backendApi';
import { bumpSeriesVersion } from '../../lib/firebase/seriesVersionBump';
import { autoWatchlistUpdates, shouldAutoEnableWatchlist } from '../../lib/series/autoWatchlist';
import { showToast, showUndoToast } from '../../lib/toast';
import { hapticSuccess } from '../../lib/haptics';

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
  const { toggleHideSeries, refetchAfterAdd } = useSeriesList();

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
      const response = await backendFetch('/add', {
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
        await refetchAfterAdd(series.id);
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
  }, [series, userId, tmdbSeries, navigate, showSnackbar, refetchAfterAdd]);

  const handleDeleteSeries = useCallback(() => {
    if (!series || !userId) return;
    setDialog({
      open: true,
      message: 'Möchtest du diese Serie wirklich löschen?',
      type: 'warning',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await firebase.database().ref(`users/${userId}/series/${series.id}`).remove();
          await firebase.database().ref(`users/${userId}/seriesWatch/${series.id}`).remove();
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
        .ref(`users/${userId}/series/${series.id}/watchlist`)
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
      await toggleHideSeries(series.id, newHiddenStatus);
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
        const epId = episode.id;
        if (!epId) throw new Error('Episode-ID fehlt');
        const epPath = `users/${userId}/seriesWatch/${series.id}/seasons/${seasonIndex}/eps/${epId}`;

        // DB-Snapshot lesen statt nur lokalen State, damit `w` immer korrekt
        // gesetzt wird (Edge-Case: lokal watched=true aber DB-Wert ohne `w`,
        // z.B. nach Catalog-Reorganization mit verwaister rewatchedEps-Map).
        const rewatchLastWatchedAtPath = `users/${userId}/series/${series.id}/rewatch/lastWatchedAt`;
        const [epSnap, rewatchLastSnap] = await Promise.all([
          db.ref(epPath).once('value'),
          db.ref(rewatchLastWatchedAtPath).once('value'),
        ]);
        const epVal =
          (epSnap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
        const prevWatched: number = epVal.w || 0;
        const prevWatchCount: number = epVal.c || episode.watchCount || 1;
        const prevFirst: number = epVal.f || 0;
        const prevLast: number = epVal.l || 0;
        const prevRewatchLastWatchedAt: string | null = rewatchLastSnap.val() || null;

        const nowUnix = Math.floor(Date.now() / 1000);
        const nowIso = new Date().toISOString();
        const newWatchCount = prevWatchCount + 1;
        const rewatchEpsPath = `users/${userId}/series/${series.id}/rewatch/rewatchedEps/${epId}`;
        const hadRewatch = !!series.rewatch?.active;

        // Atomarer Multi-Path Update — w und f defensiv setzen falls fehlend.
        const updates: Record<string, unknown> = {
          [`${epPath}/c`]: newWatchCount,
          [`${epPath}/l`]: nowUnix,
        };
        if (!prevWatched) {
          updates[`${epPath}/w`] = 1;
          if (!prevFirst) {
            updates[`${epPath}/f`] = nowUnix;
          }
        }
        if (hadRewatch) {
          updates[rewatchEpsPath] = true;
          updates[rewatchLastWatchedAtPath] = nowIso;
        }
        await db.ref().update(updates);
        bumpSeriesVersion(userId);

        const seasonNumber = (series.seasons?.[seasonIndex]?.seasonNumber || 0) + 1;

        let rewatchRemoved = false;
        if (hadRewatch) {
          const rewatchedEps = { ...(series.rewatch?.rewatchedEps || {}), [String(epId)]: true };
          const targetCount = Math.max(2, (series.rewatch?.round || 0) + 1);
          let allDone = true;
          for (const s of series.seasons || []) {
            for (const ep of s.episodes || []) {
              if (!ep.watched) continue;
              if (!ep.id) continue;
              const explicit = !!rewatchedEps[String(ep.id)];
              const implied = (ep.watchCount || 1) >= targetCount;
              if (!explicit && !implied) {
                allDone = false;
                break;
              }
            }
            if (!allDone) break;
          }
          if (allDone) {
            await db.ref(`users/${userId}/series/${series.id}/rewatch`).remove();
            bumpSeriesVersion(userId);
            showSnackbar(`Rewatch #${series.rewatch?.round} abgeschlossen!`);
            rewatchRemoved = true;
          }
        }
        setShowRewatchDialog({ show: false, type: 'episode', item: null });

        showUndoToast(`S${seasonNumber}E${episodeIndex + 1} Rewatch markiert`, {
          onUndo: async () => {
            try {
              const undoUpdates: Record<string, unknown> = {
                [`${epPath}/c`]: prevWatchCount || null,
                [`${epPath}/l`]: prevLast || null,
              };
              if (!prevWatched) {
                undoUpdates[`${epPath}/w`] = null;
                if (!prevFirst) {
                  undoUpdates[`${epPath}/f`] = null;
                }
              }
              if (rewatchRemoved && series.rewatch) {
                undoUpdates[`users/${userId}/series/${series.id}/rewatch`] = series.rewatch;
              } else if (hadRewatch) {
                undoUpdates[rewatchEpsPath] = null;
                undoUpdates[rewatchLastWatchedAtPath] = prevRewatchLastWatchedAt;
              }
              await db.ref().update(undoUpdates);
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
        const epId = episode.id;
        if (!epId) throw new Error('Episode-ID fehlt');
        const epPath = `users/${userId}/seriesWatch/${series.id}/seasons/${seasonIndex}/eps/${epId}`;

        const snap = await db.ref(epPath).once('value');
        const val = (snap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
        const prevWatchCount: number = val.c || 0;
        const prevFirst: number = val.f || 0;
        const prevLast: number = val.l || 0;
        const prevWatched: number = val.w || 0;

        if (episode.watchCount && episode.watchCount > 1) {
          await db.ref(`${epPath}/c`).set(episode.watchCount - 1);
        } else {
          await db.ref(epPath).remove();
        }
        bumpSeriesVersion(userId);
        setShowRewatchDialog({ show: false, type: 'episode', item: null });

        const seasonNumber = (series.seasons?.[seasonIndex]?.seasonNumber || 0) + 1;
        showUndoToast(
          `S${seasonNumber}E${episodeIndex + 1} als nicht gesehen markiert`,
          async () => {
            try {
              if (!prevWatched && prevWatchCount === 0 && !prevFirst && !prevLast) {
                await db.ref(epPath).remove();
              } else {
                await db.ref(epPath).set({
                  ...(prevWatched ? { w: prevWatched } : {}),
                  ...(prevWatchCount ? { c: prevWatchCount } : {}),
                  ...(prevFirst ? { f: prevFirst } : {}),
                  ...(prevLast ? { l: prevLast } : {}),
                });
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

  const handleEpisodeQuickToggle = useCallback(
    async (seasonIndex: number, episodeIndex: number) => {
      if (!series || !userId) return;
      const season = series.seasons?.[seasonIndex];
      const episode = season?.episodes?.[episodeIndex];
      if (!season || !episode) return;
      const epId = episode.id;
      if (!epId) {
        showToast('Episode-ID fehlt', 2000, 'error');
        return;
      }

      const db = firebase.database();
      const epPath = `users/${userId}/seriesWatch/${series.id}/seasons/${seasonIndex}/eps/${epId}`;
      const prevWatched = !!episode.watched;
      const prevWatchCount = episode.watchCount || 0;
      const prevFirstWatchedAt = episode.firstWatchedAt;
      const prevLastWatchedAt = episode.lastWatchedAt;
      const seasonNumber = (season.seasonNumber ?? 0) + 1;
      const epNumber = episodeIndex + 1;
      const willAutoAddToWatchlist = !prevWatched && shouldAutoEnableWatchlist(series);

      try {
        if (prevWatched) {
          await db.ref().update({
            [epPath]: null,
            ...(willAutoAddToWatchlist ? autoWatchlistUpdates(userId, series) : {}),
            [`users/${userId}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
          });
        } else {
          const nowUnix = Math.floor(Date.now() / 1000);
          const updates: Record<string, unknown> = {
            [`${epPath}/w`]: 1,
            [`${epPath}/c`]: 1,
            [`${epPath}/l`]: nowUnix,
            ...autoWatchlistUpdates(userId, series),
            [`users/${userId}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
          };
          if (!prevFirstWatchedAt) {
            updates[`${epPath}/f`] = nowUnix;
          }
          await db.ref().update(updates);
        }

        const newWatched = !prevWatched;
        if (newWatched) hapticSuccess();
        const label = `S${seasonNumber}E${epNumber}`;
        const actionLabel = newWatched ? 'als gesehen markiert' : 'als nicht gesehen markiert';

        showUndoToast(`${series.title} ${label} ${actionLabel}`, {
          onUndo: async () => {
            try {
              const undoUpdates: Record<string, unknown> = {
                [`users/${userId}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
              };
              if (!prevWatched && prevWatchCount === 0) {
                undoUpdates[epPath] = null;
              } else {
                undoUpdates[`${epPath}/w`] = prevWatched ? 1 : 0;
                undoUpdates[`${epPath}/c`] = prevWatchCount;
                undoUpdates[`${epPath}/f`] = prevFirstWatchedAt
                  ? Math.floor(new Date(prevFirstWatchedAt).getTime() / 1000)
                  : 0;
                undoUpdates[`${epPath}/l`] = prevLastWatchedAt
                  ? Math.floor(new Date(prevLastWatchedAt).getTime() / 1000)
                  : 0;
              }
              await db.ref().update(undoUpdates);
            } catch {
              showToast('Undo fehlgeschlagen', 2000, 'error');
            }
          },
          onCommit: async () => {
            if (newWatched) {
              trackEpisodeWatched(series.title, seasonNumber, epNumber, {
                tmdbId: series.id,
                genres: series.genre?.genres,
                runtime:
                  episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                isRewatch: false,
                source: 'series_detail_quick_toggle',
              });
              await petService.watchedSeriesWithGenreAllPets(userId, series.genre?.genres || []);
              const { updateEpisodeCounters } =
                await import('../../features/badges/minimalActivityLogger');
              await updateEpisodeCounters(userId, false, episode.air_date);
              WatchActivityService.logEpisodeWatch(
                userId,
                series.id,
                series.title || series.name || 'Unbekannte Serie',
                seasonNumber,
                epNumber,
                episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                false,
                series.genre?.genres,
                series.provider?.provider?.map((p) => p.name)
              );
              if (willAutoAddToWatchlist) {
                const { logWatchlistAdded } =
                  await import('../../features/badges/minimalActivityLogger');
                await logWatchlistAdded(userId, series.title, series.id);
              }
            } else {
              trackEpisodeUnwatched(series.title, seasonNumber, epNumber);
            }
          },
        });
      } catch {
        setDialog({ open: true, message: 'Fehler beim Speichern.', type: 'error' });
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

        const seriesPath = `users/${userId}/series/${series.id}`;
        await firebase.database().ref(`${seriesPath}/rewatch`).set({
          active: true,
          round: newRound,
          startedAt: new Date().toISOString(),
          rewatchedEps: {},
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
      await firebase.database().ref(`users/${userId}/series/${series.id}/rewatch`).remove();
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
    handleEpisodeQuickToggle,
    handleStartRewatch,
    handleStopRewatch,
  };
}
