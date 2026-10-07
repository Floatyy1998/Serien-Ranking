/** Wann ein Film-Ereignis für Wrapped geschrieben werden darf — jeder Film zählt einmal, im Jahr des ersten Sehens. */

import type { Movie } from '../../types/Movie';
import { isMovieWatched } from '../rating/rating';

export interface MovieWatchState {
  watched?: boolean;
  watchedAt?: string;
  rating?: Movie['rating'];
}

/** Galt der Film vor dieser Aktion schon als gesehen (Haken oder Bewertung)? */
export function wasMovieWatched(before: MovieWatchState | null | undefined): boolean {
  if (!before) return false;
  return !!before.watchedAt || isMovieWatched(before as Movie);
}

/**
 * Erstes Sehen → loggen. Schon gesehen und `watchedAt` im laufenden Jahr → loggen
 * (das Ereignis wird dann nur aktualisiert oder nachgetragen). Früher gesehen → nicht,
 * sonst zählt Neubewerten eines alten Films als neuer Film dieses Jahres.
 */
export function shouldLogMovieWatch(
  before: MovieWatchState | null | undefined,
  now: Date = new Date()
): boolean {
  if (!wasMovieWatched(before)) return true;
  if (!before?.watchedAt) return false;
  const watchedAt = new Date(before.watchedAt);
  return Number.isFinite(watchedAt.getTime()) && watchedAt.getFullYear() === now.getFullYear();
}
