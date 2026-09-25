import {
  findEpisodeById,
  markEpisodeWatched,
  markNextEpisodeWatched,
} from '../../hooks/watch/markNextEpisode';
import { hapticSuccess } from '../../lib/interaction/haptics';
import { showToast, showUndoToast } from '../../lib/interaction/toast';
import type { ResolvedWatchPlanEntry } from '../../lib/watch/watchPlan';
import { paths, updateWithSeriesVersion } from '../../services/db/ref';
import { t } from '../../services/i18n';
import { markMovieWatched } from '../../services/rating/quickRating';

/** Hakt Folge bzw. Film eines Plan-Eintrags ab; ohne bestimmte Folge die nächste ungesehene. */
export async function markPlanEntryWatched(
  uid: string,
  item: ResolvedWatchPlanEntry
): Promise<boolean> {
  const { entry, series, movie, done } = item;
  if (done) return false;

  if (entry.kind === 'movie') {
    if (!movie) {
      showToast(t('Der Film ist nicht mehr in deiner Liste'), 2500, 'error');
      return false;
    }
    try {
      await markMovieWatched(uid, movie.id);
      hapticSuccess();
      const base = paths.movieItem(uid, movie.id);
      showUndoToast(t('{title} als gesehen markiert', { title: movie.title }), () => {
        void updateWithSeriesVersion(uid, {
          [`${base}/watched`]: null,
          [`${base}/watchedAt`]: movie.watchedAt ?? null,
        }).catch(() => showToast(t('Undo fehlgeschlagen'), 2000, 'error'));
      });
      return true;
    } catch {
      showToast(t('Fehler beim Speichern'), 3000, 'error');
      return false;
    }
  }

  if (!series) {
    showToast(t('Die Serie ist nicht mehr in deiner Liste'), 2500, 'error');
    return false;
  }
  if (!entry.seasonNumber || !entry.episodeNumber) {
    const marked = await markNextEpisodeWatched(uid, series);
    if (!marked) showToast(t('Keine offene Folge mehr'), 2000);
    return marked;
  }
  const episodeId = item.episode?.episode.id ?? entry.episodeId;
  const info = episodeId ? findEpisodeById(series, episodeId) : null;
  if (!info) {
    showToast(t('Folge nicht gefunden'), 2500, 'error');
    return false;
  }
  return markEpisodeWatched(uid, series, info, 'watch_plan');
}
