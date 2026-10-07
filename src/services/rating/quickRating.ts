/**
 * Schnellbewertung und Gesehen-Markierung direkt aus der Suche (Seite + Overlay).
 * Schreibt dieselben Felder wie Bewertungseditor bzw. Film-Detailseite.
 */
import { logRatingAdded } from '../../features/badges/minimalActivityLogger';
import { buildGenreRatingMap } from '../../lib/rating/rating';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { dbGet, dbRef, paths, updateWithSeriesVersion } from '../db/ref';
import { trackRatingSaved } from '../firebase/analytics';
import { wasMovieWatched, type MovieWatchState } from '../../lib/watch/movieWatchLog';
import { logMovieWatchIfNew } from '../watchActivity/movieWatchLogging';

export interface QuickRatingItem {
  id: number;
  type: 'series' | 'movie';
  title: string;
}

/** Film als gesehen markieren (ohne Bewertung), atomar mit serienVersion-Bump, plus Wrapped-Ereignis. */
export const markMovieWatched = async (uid: string, movieId: number): Promise<void> => {
  const base = paths.movieItem(uid, movieId);
  const before = await dbGet<MovieWatchState>(base).catch(() => null);
  await updateWithSeriesVersion(uid, {
    [`${base}/watched`]: true,
    [`${base}/watchedAt`]: before?.watchedAt || new Date().toISOString(),
  });
  void logMovieWatchIfNew(uid, movieId, before);
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
  owned?: Series | Movie,
  genreRatings?: Record<string, number>
): Promise<void> {
  const genres = owned?.genre?.genres ?? [];
  // Aufgeklappte Detailstufe liefert eigene Werte je Genre.
  const ratings = genreRatings ? { ...genreRatings } : buildGenreRatingMap(genres, rating);

  if (item.type === 'series') {
    await dbRef(paths.seriesRating(uid, item.id)).set(ratings);
  } else {
    const movie = owned as Movie | undefined;
    const base = paths.movieItem(uid, item.id);
    const now = new Date().toISOString();
    const watchedAt = movie?.watchedAt || (wasMovieWatched(movie) ? null : now);
    await updateWithSeriesVersion(uid, {
      [`${base}/rating`]: ratings,
      [`${base}/ratedAt`]: now,
      [`${base}/watched`]: true,
      ...(watchedAt ? { [`${base}/watchedAt`]: watchedAt } : {}),
    });
    void logMovieWatchIfNew(uid, item.id, movie, rating, {
      title: item.title,
      runtime: movie?.runtime,
      genres,
      providers: movie?.provider?.provider?.map((p) => p.name),
    });
  }

  trackRatingSaved(String(item.id), item.type, rating);
  await logRatingAdded(uid, item.title, item.type, rating, item.id);
}
