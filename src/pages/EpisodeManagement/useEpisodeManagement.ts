import { useEffect, useRef, useState } from 'react';
import { dbUpdate, paths, serverTimestamp, updateWithSeriesVersion } from '../../services/db/ref';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useEpisodeDiscussionCounts } from '../../hooks/discussionCountHooks';
import { shouldTriggerQuickRate, useQuickSeasonRating } from '../../hooks/useQuickSeasonRating';
import { runEpisodeWatchFanout } from '../../lib/episode/episodeWatchFanout';
import { adjustBulkExcludedEpisodes } from '../../services/pet/mysteryBoxService';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import type { Series } from '../../types/Series';
import { trackEpisodeWatched, trackEpisodeUnwatched } from '../../services/firebase/analytics';
import { autoWatchlistUpdates, shouldAutoEnableWatchlist } from '../../lib/series/autoWatchlist';
import { applyUserUpdate } from '../../services/offline/queuedUpdate';
import { t } from '../../services/i18n';
import { showActionToast, showToast, showUndoToast } from '../../lib/toast';
import { hapticSuccess } from '../../lib/haptics';

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

  // Quick Rating
  const {
    quickRatingOpen,
    quickRatingSeries,
    quickRatingSeasonNumber,
    showQuickRating,
    closeQuickRating,
    saveQuickRating,
  } = useQuickSeasonRating();

  // State
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWatchDialog, setShowWatchDialog] = useState(false);
  const [showCatchUpDialog, setShowCatchUpDialog] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);

  // Pull-to-refresh refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  // Derived data
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

  // Effects

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

  // Pull-to-refresh handlers

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

  // Season navigation

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

  // Episode toggle logic

  const handleEpisodeToggle = async (
    seasonIndex: number,
    episodeIndex: number,
    longPress = false
  ) => {
    if (!series || !user) return;

    const season = series.seasons[seasonIndex];
    const episode = season.episodes[episodeIndex];

    try {
      // `|| 1`, nicht `|| 0`: currentWatchCount wird nur in den isWatched-Zweigen
      // benutzt. Ein Legacy-`{w:1}`-Row liefert vom Adapter watchCount:0 — ohne
      // den Default würde ein Rewatch auf c:1 statt c:2 zählen (zählt die frühere
      // Ansicht nicht). Deckungsgleich zu useRewatchHandler/handleSeasonToggle/useSeriesActions.
      const currentWatchCount = episode.watchCount || 1;
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

      const epId = episode.id;
      if (!epId) {
        showToast(t('Episode-ID fehlt'), 2000, 'error');
        return;
      }
      const epPath = `${paths.seriesWatchItem(user.uid, series.id)}/seasons/${seasonIndex}/eps/${epId}`;

      const willAutoAddToWatchlist = newWatched && shouldAutoEnableWatchlist(series);
      const queueLabel = `${series.title} S${season.seasonNumber + 1}E${episodeIndex + 1} Toggle`;

      // Beide Toggle-Richtungen über die persistente Offline-Queue —
      // sonst würde ein Offline-„Entmarkieren" verloren gehen, während der
      // gequeute Mark nach Reconnect trotzdem angewendet wird.
      if (newWatched) {
        const nowUnix = Math.floor(Date.now() / 1000);
        const updates: Record<string, unknown> = {
          [`${epPath}/w`]: 1,
          [`${epPath}/c`]: newWatchCount,
          [`${epPath}/l`]: nowUnix,
          ...autoWatchlistUpdates(user.uid, series),
          [paths.serienVersion(user.uid)]: serverTimestamp(),
        };
        if (!episode.firstWatchedAt) {
          updates[`${epPath}/f`] = nowUnix;
        }
        await applyUserUpdate(user.uid, updates, queueLabel);
        hapticSuccess();
      } else {
        // Komplett loeschen statt Nullen schreiben
        await applyUserUpdate(
          user.uid,
          {
            [epPath]: null,
            [paths.serienVersion(user.uid)]: serverTimestamp(),
          },
          queueLabel
        );
      }

      // Quick-Rate: letzte Episode der letzten Staffel markiert.
      // F4 — nicht blockierend: statt das Modal automatisch zu öffnen (bricht
      // den Binge ab) zeigen wir einen wegwischbaren Hinweis. Erst ein Tap auf
      // „Bewerten" öffnet die Schnellbewertung — die Markierung läuft normal weiter.
      if (newWatched && shouldTriggerQuickRate(series, seasonIndex, episodeIndex)) {
        const quickRateSeasonNumber = series.seasons[seasonIndex].seasonNumber + 1;
        showActionToast(t('{title} fertig — jetzt bewerten?', { title: series.title }), {
          actionLabel: t('Bewerten'),
          onAction: () => showQuickRating(series, quickRateSeasonNumber),
        });
      }

      const label = `S${season.seasonNumber + 1}E${episodeIndex + 1}`;
      const action = newWatched ? t('als gesehen markiert') : t('als nicht gesehen markiert');
      showUndoToast(`${series.title} ${label} ${action}`, {
        onUndo: async () => {
          try {
            const prevEp = prevSeasons[seasonIndex].episodes[episodeIndex] as {
              watched?: boolean;
              watchCount?: number;
              firstWatchedAt?: string;
              lastWatchedAt?: string;
            };
            // Bump mitschreiben — sonst überspringt ein zweites Gerät den
            // Delta-Reload (versionMatch) und zeigt den zurückgenommenen Stand
            // weiter an. Konsistent zu useSeriesActions-Undo (das bumpt).
            if (!prevEp.watched && !(prevEp.watchCount && prevEp.watchCount > 0)) {
              await updateWithSeriesVersion(user.uid, { [epPath]: null });
            } else {
              await updateWithSeriesVersion(user.uid, {
                [epPath]: {
                  w: prevEp.watched ? 1 : 0,
                  c: prevEp.watchCount || 0,
                  ...(prevEp.firstWatchedAt
                    ? { f: Math.floor(new Date(prevEp.firstWatchedAt).getTime() / 1000) }
                    : {}),
                  ...(prevEp.lastWatchedAt
                    ? { l: Math.floor(new Date(prevEp.lastWatchedAt).getTime() / 1000) }
                    : {}),
                },
              });
            }
          } catch {
            showToast(t('Undo fehlgeschlagen'), 2000, 'error');
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
            await runEpisodeWatchFanout({
              userId: user.uid,
              seriesId: series.id,
              seriesTitle: series.title,
              seasonNumber: season.seasonNumber + 1,
              episodeNumber: episodeIndex + 1,
              runtimeMinutes: getEpisodeRuntime(series, episode),
              isRewatch: false,
              genres: series.genre?.genres,
              providers: [...new Set(series.provider?.provider?.map((p) => p.name))],
              episodeAirDate: episode.air_date,
            });
            if (willAutoAddToWatchlist) {
              const { logWatchlistAdded } =
                await import('../../features/badges/minimalActivityLogger');
              await logWatchlistAdded(user.uid, series.title, series.id);
            }
          } else if (isWatched && newWatched && newWatchCount > currentWatchCount) {
            // Kein Pet-XP beim Hochzählen des Watchcounts (bestehendes Verhalten beibehalten).
            await runEpisodeWatchFanout({
              userId: user.uid,
              seriesId: series.id,
              seriesTitle: series.title,
              seasonNumber: season.seasonNumber + 1,
              episodeNumber: episodeIndex + 1,
              runtimeMinutes: getEpisodeRuntime(series, episode),
              isRewatch: true,
              genres: series.genre?.genres,
              providers: [...new Set(series.provider?.provider?.map((p) => p.name))],
              episodeAirDate: episode.air_date,
              petXp: false,
            });
          }
        },
      });
    } catch (error) {
      console.error('Failed to toggle episode watch status:', error);
      showToast(t('Fehler beim Speichern'), 3000, 'error');
    }
  };

  // Episode click (show dialog or toggle)

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

  // Catch-up logic

  const handleCatchUp = async (targetSeasonIndex: number, targetEpisodeIndex: number) => {
    if (!series || !user) return;

    try {
      const nowUnix = Math.floor(Date.now() / 1000);
      const basePath = `${paths.seriesWatchItem(user.uid, series.id)}/seasons`;
      const updates: Record<string, unknown> = {};
      const markedEpPaths: string[] = []; // fuer Undo: alle neu-gemarkten Eps

      series.seasons.forEach((season, sIdx) => {
        const eps = Array.isArray(season.episodes)
          ? season.episodes
          : season.episodes
            ? (Object.values(season.episodes) as typeof season.episodes)
            : [];

        eps.forEach((ep, eIdx) => {
          if (ep.watched) return;
          if (!ep.id) return;
          const shouldMark =
            sIdx < targetSeasonIndex || (sIdx === targetSeasonIndex && eIdx < targetEpisodeIndex);
          if (!shouldMark) return;

          const epBase = `${basePath}/${sIdx}/eps/${ep.id}`;
          updates[`${epBase}/w`] = 1;
          updates[`${epBase}/c`] = 1;
          updates[`${epBase}/f`] = nowUnix;
          updates[`${epBase}/l`] = nowUnix;
          markedEpPaths.push(epBase);
        });
      });

      updates[paths.serienVersion(user.uid)] = serverTimestamp();
      // Bulk-Mark als EIN Queue-Eintrag (eine Multi-Path-Map) über die
      // persistente Offline-Queue; Undo bleibt direkt.
      await applyUserUpdate(
        user.uid,
        updates,
        `${series.title} Catch-Up bis S${targetSeasonIndex + 1}E${targetEpisodeIndex}`
      );
      // Catch-Up ist Massen-Abhaken → zählt nicht für Mystery-Boxen.
      if (markedEpPaths.length > 0) void adjustBulkExcludedEpisodes(user.uid, markedEpPaths.length);
      setSelectedSeason(targetSeasonIndex);

      showUndoToast(
        t('Catch-Up bis S{s}E{e}', { s: targetSeasonIndex + 1, e: targetEpisodeIndex }),
        async () => {
          try {
            // Undo: alle neu-gemarkten Eps wieder entfernen (waren zuvor unwatched)
            const undoUpdates: Record<string, unknown> = {};
            for (const epBase of markedEpPaths) {
              undoUpdates[epBase] = null;
            }
            undoUpdates[paths.serienVersion(user.uid)] = serverTimestamp();
            await dbUpdate(undoUpdates);
            if (markedEpPaths.length > 0)
              void adjustBulkExcludedEpisodes(user.uid, -markedEpPaths.length);
          } catch {
            showToast(t('Undo fehlgeschlagen'), 2000, 'error');
          }
        }
      );
    } catch (error) {
      console.error('Failed to catch up episodes:', error);
      showToast(t('Fehler beim Speichern'), 3000, 'error');
    }
  };

  // Season bulk toggle

  const handleSeasonToggle = async (
    seasonIndex: number,
    mode: 'watch' | 'unwatch' | 'rewatch' = 'watch'
  ) => {
    if (!series || !user) return;

    const season = series.seasons[seasonIndex];
    const allWatched = season.episodes?.every((ep) => ep.watched);
    const willAutoAddToWatchlist = mode !== 'unwatch' && shouldAutoEnableWatchlist(series);

    // Massen-Abhaken zählt nicht für Mystery-Boxen (kein Box-Schwall beim
    // Eintragen bereits geschauter Serien). Delta = Änderung der Unique-Watched.
    const seasonEps = season.episodes ?? [];
    let bulkDelta = 0;
    if (mode === 'watch') {
      bulkDelta = allWatched
        ? -seasonEps.filter((ep) => ep.id && ep.watched).length
        : seasonEps.filter((ep) => ep.id && !ep.watched).length;
    } else if (mode === 'unwatch') {
      bulkDelta = -seasonEps.filter((ep) => ep.id && ep.watched).length;
    }

    try {
      const nowUnix = Math.floor(Date.now() / 1000);
      const seasonPath = `${paths.seriesWatchItem(user.uid, series.id)}/seasons/${seasonIndex}`;
      const updates: Record<string, unknown> = {
        ...(willAutoAddToWatchlist ? autoWatchlistUpdates(user.uid, series) : {}),
      };

      (season.episodes ?? []).forEach((ep) => {
        if (!ep.id) return;
        const epBase = `${seasonPath}/eps/${ep.id}`;
        if (mode === 'unwatch') {
          updates[epBase] = null;
        } else if (mode === 'rewatch') {
          updates[`${epBase}/w`] = 1;
          updates[`${epBase}/c`] = (ep.watchCount || 1) + 1;
          updates[`${epBase}/f`] = ep.firstWatchedAt
            ? Math.floor(new Date(ep.firstWatchedAt).getTime() / 1000)
            : nowUnix;
          updates[`${epBase}/l`] = nowUnix;
        } else {
          if (!allWatched) {
            updates[`${epBase}/w`] = 1;
            updates[`${epBase}/c`] = 1;
            updates[`${epBase}/f`] = ep.firstWatchedAt
              ? Math.floor(new Date(ep.firstWatchedAt).getTime() / 1000)
              : nowUnix;
            updates[`${epBase}/l`] = nowUnix;
          } else {
            updates[epBase] = null;
          }
        }
      });

      // Fuer Undo: Zustand pro Episode snapshotten (inkl. ep.id)
      type PrevEpisodeState = {
        epId: number;
        watched: boolean;
        watchCount: number;
        firstUnix: number;
        lastUnix: number;
      };
      const prevEpisodes: PrevEpisodeState[] = (season.episodes ?? [])
        .filter((ep) => ep.id)
        .map((ep) => ({
          epId: ep.id as number,
          watched: ep.watched ?? false,
          watchCount: ep.watchCount || 0,
          firstUnix: ep.firstWatchedAt
            ? Math.floor(new Date(ep.firstWatchedAt).getTime() / 1000)
            : 0,
          lastUnix: ep.lastWatchedAt ? Math.floor(new Date(ep.lastWatchedAt).getTime() / 1000) : 0,
        }));

      updates[paths.serienVersion(user.uid)] = serverTimestamp();
      // Staffel-Bulk-Mark als EIN Queue-Eintrag über die persistente
      // Offline-Queue; Undo bleibt direkt.
      await applyUserUpdate(
        user.uid,
        updates,
        `${series.title} Staffel ${season.seasonNumber + 1} (${mode})`
      );

      if (bulkDelta !== 0) void adjustBulkExcludedEpisodes(user.uid, bulkDelta);

      // Quick-Rate: letzte Staffel komplett markiert.
      // F4 — nicht blockierend (siehe handleEpisodeToggle): wegwischbarer
      // Hinweis statt Auto-Modal; öffnet die Schnellbewertung erst auf Tap.
      if (mode !== 'unwatch') {
        const lastSeasonIndex = series.seasons.length - 1;
        if (seasonIndex === lastSeasonIndex) {
          const lastEpisodeIndex = (season.episodes?.length || 1) - 1;
          if (shouldTriggerQuickRate(series, seasonIndex, lastEpisodeIndex)) {
            const quickRateSeasonNumber = season.seasonNumber + 1;
            showActionToast(t('{title} fertig — jetzt bewerten?', { title: series.title }), {
              actionLabel: t('Bewerten'),
              onAction: () => showQuickRating(series, quickRateSeasonNumber),
            });
          }
        }
      }

      const seasonLabel = t('Staffel {n}', { n: season.seasonNumber + 1 });
      const modeLabel =
        mode === 'unwatch'
          ? t('als nicht gesehen markiert')
          : mode === 'rewatch'
            ? t('Rewatch markiert')
            : t('als gesehen markiert');
      showUndoToast(`${series.title} ${seasonLabel} ${modeLabel}`, async () => {
        try {
          const undoUpdates: Record<string, unknown> = {};
          prevEpisodes.forEach((ep) => {
            const epBase = `${seasonPath}/eps/${ep.epId}`;
            if (!ep.watched && ep.watchCount === 0) {
              undoUpdates[epBase] = null;
            } else {
              undoUpdates[`${epBase}/w`] = ep.watched ? 1 : 0;
              undoUpdates[`${epBase}/c`] = ep.watchCount;
              undoUpdates[`${epBase}/f`] = ep.firstUnix;
              undoUpdates[`${epBase}/l`] = ep.lastUnix;
            }
          });
          // Bump mitschreiben — sonst überspringt ein zweites Gerät den
          // Delta-Reload (versionMatch) und zeigt den zurückgenommenen Stand weiter.
          await updateWithSeriesVersion(user.uid, undoUpdates);
          if (bulkDelta !== 0) void adjustBulkExcludedEpisodes(user.uid, -bulkDelta);
        } catch {
          showToast(t('Undo fehlgeschlagen'), 2000, 'error');
        }
      });

      if (willAutoAddToWatchlist) {
        const { logWatchlistAdded } = await import('../../features/badges/minimalActivityLogger');
        await logWatchlistAdded(user.uid, series.title, series.id);
      }
    } catch (error) {
      console.error('Failed to toggle season watch status:', error);
      showToast(t('Fehler beim Speichern'), 3000, 'error');
    }
  };

  // Watch dialog actions

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
