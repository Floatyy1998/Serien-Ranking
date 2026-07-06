import type { Movie } from '../../types/Movie';

/**
 * Ein Film gilt als bewertet, sobald irgendein positiver Genre-Wert existiert.
 * Film-`rating` ist genre-keyed (`{ Action: 8, General: 7, ... }`), NICHT
 * `{ uid: wert }` — daher über die Werte iterieren, nie `rating[uid]`.
 */
export function isMovieRated(movie: Movie): boolean {
  if (!movie.rating || typeof movie.rating !== 'object') return false;
  return Object.values(movie.rating).some((r) => typeof r === 'number' && r > 0);
}

/**
 * Findet Filme, die explizit als „gesehen" markiert (F1: `watched === true`)
 * aber noch nicht bewertet wurden. Anders als bei Serien gibt es keine
 * 7-Tage-Heuristik — das explizite Gesehen-Flag ist bereits ein klares Signal.
 *
 * Rein (kein Firebase, keine Nebenwirkungen) → einfach testbar; Dismiss/Skip
 * verwaltet die Queue selbst.
 */
export function detectUnratedMovies(movieList: Movie[]): Movie[] {
  return movieList.filter((movie) => movie.watched === true && !isMovieRated(movie));
}
