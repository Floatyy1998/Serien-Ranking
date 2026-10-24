/**
 * markSeasonWatched – Staffel-Sammelaktion (abhaken / Rewatch / entfernen).
 *
 * Gemeinsam genutzt von der Episodenübersicht (/episodes/:id), der
 * Serien-Detailseite und dem „Rest abhaken"-Tipp.
 */

import type { Series } from '../../types/Series';
import { paths, serverTimestamp, updateWithSeriesVersion } from '../../services/db/ref';
import { shouldTriggerQuickRate } from '../rating/useQuickSeasonRating';
import { adjustBulkExcludedEpisodes } from '../../services/pet/mysteryBoxService';
import { filterBulkMarkable } from '../../lib/episode/releaseState';
import { trackEpisodesBulkMarked } from '../../services/firebase/analytics';
import { autoUnhideUpdates, shouldAutoUnhide } from '../../lib/series/autoUnhide';
import { autoWatchlistUpdates, shouldAutoEnableWatchlist } from '../../lib/series/autoWatchlist';
import { applyUserUpdate } from '../../services/offline/queuedUpdate';
import { t } from '../../services/i18n';
import { showActionToast, showToast, showUndoToast } from '../../lib/interaction/toast';
import { noteBulkMarkUsed } from './bulkMarkNudge';

export type SeasonMarkMode = 'watch' | 'unwatch' | 'rewatch';

interface MarkSeasonOptions {
  source: string;
  onQuickRate?: (series: Series, seasonNumber: number) => void;
}

export async function markSeasonWatched(
  uid: string,
  series: Series,
  seasonIndex: number,
  mode: SeasonMarkMode,
  { source, onQuickRate }: MarkSeasonOptions
): Promise<void> {
  const season = series.seasons?.[seasonIndex];
  if (!season) {
    showToast(t('Folgen werden noch geladen'), 2500, 'info');
    return;
  }
  const allEps = season.episodes ?? [];
  // Bulk markiert nie unveröffentlichte Folgen — einzeln bleibt das erlaubt.
  // Ausnahme: bereits markierte Folgen bleiben in Rewatch/Unwatch drin.
  const seasonEps = mode === 'unwatch' ? allEps : filterBulkMarkable(allEps);
  const allWatched = seasonEps.length > 0 && seasonEps.every((ep) => ep.watched);
  if (seasonEps.length === 0) {
    showToast(t('Noch keine Folgen dieser Staffel veröffentlicht'), 2500, 'info');
    return;
  }
  const willAutoAddToWatchlist = mode !== 'unwatch' && shouldAutoEnableWatchlist(series);
  const willAutoUnhide = mode !== 'unwatch' && shouldAutoUnhide(series);

  // Massen-Abhaken zählt nicht für Mystery-Boxen (kein Box-Schwall beim
  // Eintragen bereits geschauter Serien). Delta = Änderung der Unique-Watched.
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
    const seasonPath = `${paths.seriesWatchItem(uid, series.id)}/seasons/${seasonIndex}`;
    const updates: Record<string, unknown> = {
      ...(willAutoAddToWatchlist ? autoWatchlistUpdates(uid, series) : {}),
      ...(willAutoUnhide ? autoUnhideUpdates(uid, series) : {}),
    };

    seasonEps.forEach((ep) => {
      if (!ep.id) return;
      // Schon gesehene Folgen behalten ihren Zähler (Rewatches nie auf 1 zurücksetzen).
      if (mode === 'watch' && !allWatched && ep.watched) return;
      const epBase = `${seasonPath}/eps/${ep.id}`;
      // Folgennummer mitschreiben, ausser beim Entfernen des Eintrags.
      if (mode !== 'unwatch') {
        if (ep.episode_number != null) updates[`${epBase}/n`] = ep.episode_number;
        if (ep.absoluteNumber != null) updates[`${epBase}/a`] = ep.absoluteNumber;
      }
      if (mode === 'unwatch') {
        updates[epBase] = null;
      } else if (mode === 'rewatch') {
        updates[`${epBase}/w`] = 1;
        updates[`${epBase}/c`] = (ep.watchCount || 1) + 1;
        updates[`${epBase}/f`] = ep.firstWatchedAt
          ? Math.floor(new Date(ep.firstWatchedAt).getTime() / 1000)
          : nowUnix;
        updates[`${epBase}/l`] = nowUnix;
      } else if (!allWatched) {
        updates[`${epBase}/w`] = 1;
        updates[`${epBase}/c`] = 1;
        updates[`${epBase}/f`] = ep.firstWatchedAt
          ? Math.floor(new Date(ep.firstWatchedAt).getTime() / 1000)
          : nowUnix;
        updates[`${epBase}/l`] = nowUnix;
      } else {
        updates[epBase] = null;
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
    const prevEpisodes: PrevEpisodeState[] = seasonEps
      .filter((ep) => ep.id)
      .map((ep) => ({
        epId: ep.id as number,
        watched: ep.watched ?? false,
        watchCount: ep.watchCount || 0,
        firstUnix: ep.firstWatchedAt ? Math.floor(new Date(ep.firstWatchedAt).getTime() / 1000) : 0,
        lastUnix: ep.lastWatchedAt ? Math.floor(new Date(ep.lastWatchedAt).getTime() / 1000) : 0,
      }));

    updates[paths.serienVersion(uid)] = serverTimestamp();
    // Staffel-Bulk-Mark als EIN Queue-Eintrag über die persistente
    // Offline-Queue; Undo bleibt direkt.
    await applyUserUpdate(
      uid,
      updates,
      `${series.title} Staffel ${season.seasonNumber + 1} (${mode})`
    );

    if (bulkDelta !== 0) void adjustBulkExcludedEpisodes(uid, bulkDelta);

    const effectiveMode = mode === 'watch' && allWatched ? 'unwatch' : mode;
    trackEpisodesBulkMarked(series.title, season.seasonNumber + 1, {
      tmdbId: series.id,
      count: Math.abs(bulkDelta) || seasonEps.length,
      mode: effectiveMode,
      source,
    });
    if (effectiveMode !== 'unwatch') noteBulkMarkUsed();

    // Quick-Rate: letzte Staffel komplett markiert — wegwischbarer Hinweis
    // statt Auto-Modal; öffnet die Schnellbewertung erst auf Tap.
    if (onQuickRate && mode !== 'unwatch' && seasonEps.length === allEps.length) {
      const lastSeasonIndex = (series.seasons?.length ?? 0) - 1;
      if (seasonIndex === lastSeasonIndex) {
        const lastEpisodeIndex = (season.episodes?.length || 1) - 1;
        if (shouldTriggerQuickRate(series, seasonIndex, lastEpisodeIndex)) {
          const quickRateSeasonNumber = season.seasonNumber + 1;
          showActionToast(t('{title} fertig — jetzt bewerten?', { title: series.title }), {
            actionLabel: t('Bewerten'),
            onAction: () => onQuickRate(series, quickRateSeasonNumber),
          });
        }
      }
    }

    const seasonLabel = t('Staffel {n}', { n: season.seasonNumber + 1 });
    const modeLabel =
      effectiveMode === 'unwatch'
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
        await updateWithSeriesVersion(uid, undoUpdates);
        if (bulkDelta !== 0) void adjustBulkExcludedEpisodes(uid, -bulkDelta);
      } catch {
        showToast(t('Undo fehlgeschlagen'), 2000, 'error');
      }
    });

    if (willAutoAddToWatchlist) {
      const { logWatchlistAdded } = await import('../../features/badges/minimalActivityLogger');
      await logWatchlistAdded(uid, series.title, series.id);
    }
    if (willAutoUnhide) {
      showToast(t('„{title}" wird wieder angezeigt', { title: series.title }), 2500, 'info');
    }
  } catch (error) {
    console.error('Failed to toggle season watch status:', error);
    showToast(t('Fehler beim Speichern'), 3000, 'error');
  }
}
