/**
 * markNextEpisode – gemeinsamer „nächste Folge als gesehen"-Helfer.
 *
 * Bündelt die exakt gleiche Mark-Pipeline wie die Swipe-Handler (Firebase-Write +
 * Pet-XP + Badge-Counter + Watch-Activity + Haptik + Undo-Toast), damit
 * Direkt-Markieren aus mehreren Screens (CatchUp-Karte, Serien-Detail-Hero)
 * konsistent und ohne Season-Index-Off-by-one funktioniert.
 *
 * Die Season/Episode-Ermittlung spiegelt useContinueWatching (Ground Truth):
 *   seasonIndex = Array-Index in series.seasons, episodeId = episode.id.
 */

import type { Series } from '../types/Series';
import { dbRef, dbUpdate, paths } from '../services/db/ref';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../lib/episode/seriesMetrics';
import { buildEpisodeWatchedUpdates, buildEpisodeUnwatchUpdates } from '../lib/compactWatch';
import { hapticSuccess } from '../lib/haptics';
import { applyUserUpdate } from '../services/offline/queuedUpdate';
import { showToast, showUndoToast } from '../lib/toast';
import { runEpisodeWatchFanout } from '../lib/episode/episodeWatchFanout';
import { requestEpisodeRating } from '../lib/episodeRatingPrompt';
import { trackEpisodeWatched } from '../services/firebase/analytics';
import { getEpisodeAirDateStr, hasEpisodeAired } from '../utils/episodeDate';
import { t } from '../services/i18n';

interface NextEpisodeInfo {
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeId: number;
  episodeName?: string;
  runtime: number;
  airDate: string;
}

/**
 * Findet die erste ungesehene, bereits ausgestrahlte Episode einer Serie.
 * Gibt null zurück, wenn die Serie durchgeschaut ist.
 */
export function findNextEpisode(series: Series): NextEpisodeInfo | null {
  const seasons = series.seasons;
  if (!seasons) return null;

  for (let j = 0; j < seasons.length; j++) {
    const season = seasons[j];
    const episodes = season.episodes;
    if (!episodes) continue;

    for (let k = 0; k < episodes.length; k++) {
      const episode = episodes[k];
      if (!episode?.watched && hasEpisodeAired(episode)) {
        return {
          seasonIndex: j,
          episodeIndex: k,
          seasonNumber: (season.seasonNumber ?? 0) + 1,
          episodeNumber: episode.episode_number || k + 1,
          episodeId: episode.id ?? 0,
          episodeName: episode.name,
          runtime: episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
          airDate: getEpisodeAirDateStr(episode) || episode.air_date || '',
        };
      }
    }
  }
  return null;
}

/**
 * Markiert die nächste ungesehene Folge einer Serie als gesehen – inkl. Haptik,
 * Undo-Toast und der drei nachgelagerten Systeme (Pet-XP, Badge-Counter,
 * Watch-Activity). Gibt true zurück, wenn eine Folge markiert wurde.
 */
export async function markNextEpisodeWatched(uid: string, series: Series): Promise<boolean> {
  const next = findNextEpisode(series);
  if (!next || !next.episodeId) return false;

  const { seasonIndex, seasonNumber, episodeNumber, episodeId, runtime, airDate } = next;
  const base = `${paths.seriesWatchItem(uid, series.id)}/seasons/${seasonIndex}/eps/${episodeId}`;

  try {
    const snap = await dbRef(base).once('value');
    const val = (snap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
    const previousWatched = (val.w ?? 0) === 1;
    const previousCount = val.c ?? 0;
    const hadFirstWatched = !!(val.f && val.f > 0);
    const previousLastWatchedAt = val.l && val.l > 0 ? new Date(val.l * 1000).toISOString() : null;

    const nowIso = new Date().toISOString();
    const label = `S${seasonNumber}E${episodeNumber}`;
    // Primärer Mark-Write über die persistente Offline-Queue (Undo unten
    // bleibt bewusst direkt).
    await applyUserUpdate(
      uid,
      buildEpisodeWatchedUpdates(
        uid,
        series.id,
        seasonIndex,
        episodeId,
        previousCount + 1,
        nowIso,
        !hadFirstWatched
      ),
      `${series.title} ${label} (Quick-Mark)`
    );

    hapticSuccess();
    const providers = series.provider?.provider?.map((p: { name: string }) => p.name);

    showUndoToast(t('{title} {label} als gesehen markiert', { title: series.title, label }), {
      onUndo: async () => {
        try {
          const updates = buildEpisodeUnwatchUpdates(
            uid,
            series.id,
            seasonIndex,
            episodeId,
            previousWatched,
            previousCount,
            null,
            previousLastWatchedAt
          );
          if (hadFirstWatched) {
            delete (updates as Record<string, unknown>)[`${base}/f`];
          }
          await dbUpdate(updates);
        } catch {
          showToast(t('Undo fehlgeschlagen'), 2000, 'error');
        }
      },
      onCommit: async () => {
        // Bewertungs-Prompt erst nach Ablauf des Undo-Fensters (Toast weg,
        // Mark bleibt bestehen); gedrosselt auf max. 1×/Minute.
        requestEpisodeRating({
          seriesId: series.id,
          seriesTitle: series.title,
          seasonIndex,
          episodeId,
          label: next.episodeName ? `${label} · ${next.episodeName}` : label,
        });
        trackEpisodeWatched(series.title, seasonNumber, episodeNumber, {
          tmdbId: series.id,
          genres: series.genre?.genres,
          runtime,
          isRewatch: previousCount > 0,
          source: 'quick_mark',
        });
        // Wrapped-Event nur beim Erstwatch (previousCount === 0) — dann ist
        // isRewatch ohnehin false, wie zuvor hart kodiert.
        await runEpisodeWatchFanout({
          userId: uid,
          seriesId: series.id,
          seriesTitle: series.title,
          seasonNumber,
          episodeNumber,
          runtimeMinutes: runtime,
          isRewatch: previousCount > 0,
          genres: series.genre?.genres,
          providers,
          episodeAirDate: airDate,
          wrappedEvent: previousCount === 0,
        });
      },
    });

    return true;
  } catch (error) {
    console.error('Error marking next episode as watched:', error);
    showToast(t('Fehler beim Speichern'), 3000, 'error');
    return false;
  }
}
