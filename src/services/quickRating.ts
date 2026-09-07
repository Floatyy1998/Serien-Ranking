/**
 * Schnellbewertung und Gesehen-Markierung direkt aus der Suche (Seite + Overlay).
 * Schreibt dieselben Felder wie Bewertungseditor bzw. Film-Detailseite.
 */
import { logRatingAdded } from '../features/badges/minimalActivityLogger';
import { buildGenreRatingMap } from '../lib/rating/rating';
import type { Movie } from '../types/Movie';
import type { Series } from '../types/Series';
import { dbRef, paths, updateWithSeriesVersion } from './db/ref';
import { trackRatingSaved } from './firebase/analytics';
import { WatchActivityService } from './watchActivityService';

export interface QuickRatingItem {
  id: number;
  type: 'series' | 'movie';
  title: string;
}

/** Film als gesehen markieren (ohne Bewertung), atomar mit serienVersion-Bump. */
export const markMovieWatched = (uid: string, movieId: number): Promise<void> => {
  const base = paths.movieItem(uid, movieId);
  return updateWithSeriesVersion(uid, {
    [`${base}/watched`]: true,
    [`${base}/watchedAt`]: new Date().toISOString(),
  });
};

/**
 * Serien: genre-gefächertes Rating wie das Staffel-Quick-Rating. Filme: dazu
 * ratedAt/watched/watchedAt und das Wrapped-Ereignis wie im Bewertungseditor.
 * `owned` liefert Genres, Laufzeit und Anbieter; fehlt es (Katalog noch nicht
 * nachgeladen), landet die Bewertung unter `General`.
 */
export async function saveQuickRating(
  uid: string,
  item: QuickRatingItem,
  rating: number,
  owned?: Series | Movie
): Promise<void> {
  const genres = owned?.genre?.genres ?? [];
  const ratings = buildGenreRatingMap(genres, rating);

  if (item.type === 'series') {
    await dbRef(paths.seriesRating(uid, item.id)).set(ratings);
  } else {
    const movie = owned as Movie | undefined;
    const base = paths.movieItem(uid, item.id);
    const now = new Date().toISOString();
    await updateWithSeriesVersion(uid, {
      [`${base}/rating`]: ratings,
      [`${base}/ratedAt`]: now,
      [`${base}/watched`]: true,
      [`${base}/watchedAt`]: movie?.watchedAt || now,
    });
    void WatchActivityService.logMovieWatch(
      uid,
      item.id,
      item.title,
      movie?.runtime,
      rating,
      genres,
      movie?.provider?.provider?.map((p) => p.name)
    );
  }

  trackRatingSaved(String(item.id), item.type, rating);
  await logRatingAdded(uid, item.title, item.type, rating, item.id);
}
