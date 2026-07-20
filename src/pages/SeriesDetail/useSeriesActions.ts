/**
 * useSeriesActions - Extracts all Firebase action handlers from SeriesDetailPage
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbRef, dbUpdate, paths, serverTimestamp } from '../../services/db/ref';
import { logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { runEpisodeWatchFanout } from '../../lib/episode/episodeWatchFanout';
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
} from '../../services/firebase/analytics';
import { backendFetch } from '../../services/backendApi';
import { bumpSeriesVersion } from '../../services/firebase/seriesVersionBump';
import { autoWatchlistUpdates, shouldAutoEnableWatchlist } from '../../lib/series/autoWatchlist';
import { applyUserUpdate } from '../../services/offline/queuedUpdate';
import { showToast, showUndoToast } from '../../lib/toast';
import { hapticSuccess } from '../../lib/haptics';
import { t } from '../../services/i18n';

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
        showSnackbar(t('Serie erfolgreich hinzugefügt!'));
        navigate(`/series/${series.id}`, { replace: true });
      } else {
        const data = await response.json();
        if (data.error === 'Serie bereits vorhanden') {
          setDialog({
            open: true,
            message: t('Serie ist bereits in deiner Liste!'),
            type: 'warning',
          });
        } else {
          throw new Error('Fehler beim Hinzufügen');
        }
      }
    } catch {
      setDialog({ open: true, message: t('Fehler beim Hinzufügen der Serie.'), type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [series, userId, tmdbSeries, navigate, showSnackbar, refetchAfterAdd]);

  const handleDeleteSeries = useCallback(() => {
    if (!series || !userId) return;
    setDialog({
      open: true,
      message: t('Möchtest du diese Serie wirklich löschen?'),
      type: 'warning',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await dbRef(paths.seriesItem(userId, series.id)).remove();
          await dbRef(paths.seriesWatchItem(userId, series.id)).remove();
          bumpSeriesVersion(userId);
          trackSeriesDeleted(String(series.id), series.title || '');
          showSnackbar(t('Serie erfolgreich gelöscht!'));
        } catch {
          setDialog({ open: true, message: t('Fehler beim Löschen der Serie.'), type: 'error' });
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
      await dbRef(`${paths.seriesItem(userId, series.id)}/watchlist`).set(newWatchlistStatus);
      if (newWatchlistStatus) {
        const { logWatchlistAdded } = await import('../../features/badges/minimalActivityLogger');
        await logWatchlistAdded(userId, series.title, series.id);
      }
    } catch {
      setDialog({
        open: true,
        message: t('Fehler beim Aktualisieren der Watchlist.'),
        type: 'error',
      });
    }
  }, [series, userId]);

  const handleHideToggle = useCallback(async () => {
    if (!series || !userId) return;
    const newHiddenStatus = !series.hidden;
    try {
      await toggleHideSeries(series.id, newHiddenStatus);
      showSnackbar(newHiddenStatus ? t('Nicht weiterschauen') : t('Serie wieder aktiv'));
    } catch {
      setDialog({ open: true, message: t('Fehler beim Ändern des Status.'), type: 'error' });
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

        const epId = episode.id;
        if (!epId) throw new Error('Episode-ID fehlt');
        const epPath = `${paths.seriesWatchItem(userId, series.id)}/seasons/${seasonIndex}/eps/${epId}`;

        // DB-Snapshot lesen statt nur lokalen State, damit `w` immer korrekt
        // gesetzt wird (Edge-Case: lokal watched=true aber DB-Wert ohne `w`,
        // z.B. nach Catalog-Reorganization mit verwaister rewatchedEps-Map).
        const rewatchLastWatchedAtPath = `${paths.seriesItem(userId, series.id)}/rewatch/lastWatchedAt`;
        const [epSnap, rewatchLastSnap] = await Promise.all([
          dbRef(epPath).once('value'),
          dbRef(rewatchLastWatchedAtPath).once('value'),
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
        const rewatchEpsPath = `${paths.seriesItem(userId, series.id)}/rewatch/rewatchedEps/${epId}`;
        const hadRewatch = !!series.rewatch?.active;

        // Atomarer Multi-Path Update — w und f defensiv setzen falls fehlend.
        // serienVersion-Bump direkt im Update-Map (statt separatem
        // bumpSeriesVersion), damit er beim Offline-Queueing mitpersistiert
        // wird und erst beim Replay vom Server aufgelöst wird.
        const updates: Record<string, unknown> = {
          [`${epPath}/c`]: newWatchCount,
          [`${epPath}/l`]: nowUnix,
          [paths.serienVersion(userId)]: serverTimestamp(),
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

        const seasonNumber = (series.seasons?.[seasonIndex]?.seasonNumber || 0) + 1;

        await applyUserUpdate(
          userId,
          updates,
          `${series.title || series.name || ''} S${seasonNumber} Rewatch-Mark`
        );

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
            await dbRef(`${paths.seriesItem(userId, series.id)}/rewatch`).remove();
            bumpSeriesVersion(userId);
            showSnackbar(t('Rewatch #{n} abgeschlossen!', { n: series.rewatch?.round ?? '' }));
            rewatchRemoved = true;
          }
        }
        setShowRewatchDialog({ show: false, type: 'episode', item: null });

        showUndoToast(t('S{s}E{e} Rewatch markiert', { s: seasonNumber, e: episodeIndex + 1 }), {
          onUndo: async () => {
            try {
              const undoUpdates: Record<string, unknown> = {
                [`${epPath}/c`]: prevWatchCount || null,
                [`${epPath}/l`]: prevLast || null,
                // Undo ist eine Watch-Daten-Änderung → serienVersion bumpen,
                // sonst überspringt ein zweites Gerät den Delta-Reload (versionsMatch).
                [paths.serienVersion(userId)]: serverTimestamp(),
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
              await dbUpdate(undoUpdates);
            } catch {
              showToast(t('Undo fehlgeschlagen'), 2000, 'error');
            }
          },
          onCommit: async () => {
            await runEpisodeWatchFanout({
              userId,
              seriesId: series.id,
              seriesTitle: series.title || series.name || 'Unbekannte Serie',
              seasonNumber,
              episodeNumber: episodeIndex + 1,
              runtimeMinutes:
                episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
              isRewatch: true,
              genres: series.genre?.genres,
              providers: series.provider?.provider?.map((p) => p.name),
              episodeAirDate: episode.air_date,
            });
          },
        });
      } catch {
        setDialog({ open: true, message: t('Fehler beim Rewatch der Episode.'), type: 'error' });
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

        const epId = episode.id;
        if (!epId) throw new Error('Episode-ID fehlt');
        const epPath = `${paths.seriesWatchItem(userId, series.id)}/seasons/${seasonIndex}/eps/${epId}`;

        const snap = await dbRef(epPath).once('value');
        const val = (snap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
        const prevWatchCount: number = val.c || 0;
        const prevFirst: number = val.f || 0;
        const prevLast: number = val.l || 0;
        const prevWatched: number = val.w || 0;

        const seasonNumber = (series.seasons?.[seasonIndex]?.seasonNumber || 0) + 1;
        const queueLabel = `${series.title} S${seasonNumber}E${episodeIndex + 1} Unwatch`;

        // Über die Offline-Queue (wie Quick-Toggle): ein Offline-„Entmarkieren"
        // ginge sonst verloren. Dekrement basiert auf dem frisch gelesenen
        // prevWatchCount, nicht auf dem evtl. stalen episode.watchCount-Prop
        // (ein paralleler Mark auf einem anderen Gerät würde sonst überschrieben).
        if (prevWatchCount > 1) {
          await applyUserUpdate(
            userId,
            {
              [`${epPath}/c`]: prevWatchCount - 1,
              [paths.serienVersion(userId)]: serverTimestamp(),
            },
            queueLabel
          );
        } else {
          await applyUserUpdate(
            userId,
            {
              [epPath]: null,
              [paths.serienVersion(userId)]: serverTimestamp(),
            },
            queueLabel
          );
        }
        setShowRewatchDialog({ show: false, type: 'episode', item: null });

        showUndoToast(
          t('S{s}E{e} als nicht gesehen markiert', { s: seasonNumber, e: episodeIndex + 1 }),
          async () => {
            try {
              const undoUpdates: Record<string, unknown> = {
                // Undo ist eine Watch-Daten-Änderung → serienVersion bumpen.
                [paths.serienVersion(userId)]: serverTimestamp(),
              };
              if (!prevWatched && prevWatchCount === 0 && !prevFirst && !prevLast) {
                undoUpdates[epPath] = null;
              } else {
                // null löscht den Teilschlüssel — entspricht dem alten Voll-.set().
                undoUpdates[`${epPath}/w`] = prevWatched || null;
                undoUpdates[`${epPath}/c`] = prevWatchCount || null;
                undoUpdates[`${epPath}/f`] = prevFirst || null;
                undoUpdates[`${epPath}/l`] = prevLast || null;
              }
              await dbUpdate(undoUpdates);
            } catch {
              showToast(t('Undo fehlgeschlagen'), 2000, 'error');
            }
          }
        );
      } catch {
        setDialog({
          open: true,
          message: t('Fehler beim Markieren als nicht gesehen.'),
          type: 'error',
        });
      }
    },
    [series, userId]
  );

  const handleEpisodeQuickToggle = useCallback(
    async (seasonIndex: number, episodeIndex: number) => {
      if (!series || !userId) return;
      // Nicht getrackte Serie (TMDB-Fallback-Ansicht): erst regulär via /add
      // hinzufügen — der TMDB-Staffelaufbau kann vom Katalog abweichen
      // (z. B. One Piece), direkte Watch-Writes würden falsch landen.
      if (series === tmdbSeries) {
        setDialog({
          open: true,
          message: t(
            'Diese Serie ist noch nicht in deiner Liste. Füge sie zuerst hinzu, um Folgen abzuhaken.'
          ),
          type: 'info',
          onConfirm: () => void handleAddSeries(),
        });
        return;
      }
      const season = series.seasons?.[seasonIndex];
      const episode = season?.episodes?.[episodeIndex];
      if (!season || !episode) return;
      const epId = episode.id;
      if (!epId) {
        showToast(t('Episode-ID fehlt'), 2000, 'error');
        return;
      }

      const epPath = `${paths.seriesWatchItem(userId, series.id)}/seasons/${seasonIndex}/eps/${epId}`;
      const prevWatched = !!episode.watched;
      const prevWatchCount = episode.watchCount || 0;
      const prevFirstWatchedAt = episode.firstWatchedAt;
      const prevLastWatchedAt = episode.lastWatchedAt;
      const seasonNumber = (season.seasonNumber ?? 0) + 1;
      const epNumber = episodeIndex + 1;
      const willAutoAddToWatchlist = !prevWatched && shouldAutoEnableWatchlist(series);
      const queueLabel = `${series.title} S${seasonNumber}E${epNumber} Quick-Toggle`;

      try {
        // Beide Toggle-Richtungen laufen über die Offline-Queue: würde nur
        // das Markieren gequeued, ginge ein Offline-„Entmarkieren" verloren
        // und der gequeute Mark würde nach Reconnect trotzdem angewendet.
        if (prevWatched) {
          await applyUserUpdate(
            userId,
            {
              [epPath]: null,
              ...(willAutoAddToWatchlist ? autoWatchlistUpdates(userId, series) : {}),
              [paths.serienVersion(userId)]: serverTimestamp(),
            },
            queueLabel
          );
        } else {
          const nowUnix = Math.floor(Date.now() / 1000);
          const updates: Record<string, unknown> = {
            [`${epPath}/w`]: 1,
            [`${epPath}/c`]: 1,
            [`${epPath}/l`]: nowUnix,
            ...autoWatchlistUpdates(userId, series),
            [paths.serienVersion(userId)]: serverTimestamp(),
          };
          if (!prevFirstWatchedAt) {
            updates[`${epPath}/f`] = nowUnix;
          }
          await applyUserUpdate(userId, updates, queueLabel);
        }

        const newWatched = !prevWatched;
        if (newWatched) hapticSuccess();
        const label = `S${seasonNumber}E${epNumber}`;
        const actionLabel = newWatched
          ? t('als gesehen markiert')
          : t('als nicht gesehen markiert');

        showUndoToast(`${series.title} ${label} ${actionLabel}`, {
          onUndo: async () => {
            try {
              const undoUpdates: Record<string, unknown> = {
                [paths.serienVersion(userId)]: serverTimestamp(),
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
              await dbUpdate(undoUpdates);
            } catch {
              showToast(t('Undo fehlgeschlagen'), 2000, 'error');
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
              await runEpisodeWatchFanout({
                userId,
                seriesId: series.id,
                seriesTitle: series.title || series.name || 'Unbekannte Serie',
                seasonNumber,
                episodeNumber: epNumber,
                runtimeMinutes:
                  episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                isRewatch: false,
                genres: series.genre?.genres,
                providers: series.provider?.provider?.map((p) => p.name),
                episodeAirDate: episode.air_date,
              });
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
        setDialog({ open: true, message: t('Fehler beim Speichern.'), type: 'error' });
      }
    },
    [series, userId, tmdbSeries, handleAddSeries]
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

        const seriesPath = paths.seriesItem(userId, series.id);
        await dbRef(`${seriesPath}/rewatch`).set({
          active: true,
          round: newRound,
          startedAt: new Date().toISOString(),
          rewatchedEps: {},
        });

        if (!series.watchlist) {
          await dbRef(`${seriesPath}/watchlist`).set(true);
        }

        showSnackbar(
          continueExisting
            ? t('Rewatch #{n} fortgesetzt!', { n: newRound })
            : t('Rewatch #{n} gestartet!', { n: newRound })
        );
      } catch {
        setDialog({
          open: true,
          message: t('Fehler beim Starten des Rewatches.'),
          type: 'error',
        });
      }
    },
    [series, userId, showSnackbar]
  );

  const handleStopRewatch = useCallback(async () => {
    if (!series || !userId) return;
    try {
      await dbRef(`${paths.seriesItem(userId, series.id)}/rewatch`).remove();
      bumpSeriesVersion(userId);
      showSnackbar(t('Rewatch beendet.'));
    } catch {
      setDialog({ open: true, message: t('Fehler beim Beenden des Rewatches.'), type: 'error' });
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
