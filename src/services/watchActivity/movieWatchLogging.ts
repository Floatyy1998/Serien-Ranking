/** Film-Ereignisse für Wrapped aus allen Gesehen-/Bewertungs-Wegen — einmal pro Film, im Jahr des ersten Sehens. */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { shouldLogMovieWatch, type MovieWatchState } from '../../lib/watch/movieWatchLog';
import { fetchStaticCatalogMovies } from '../catalog/staticCatalog';
import { getEventsPath } from './shared';
import { logMovieWatch } from './watchActivityCore';

export interface MovieWatchInfo {
  title?: string;
  runtime?: number;
  genres?: string[];
  providers?: string[];
}

export async function logMovieWatchIfNew(
  userId: string,
  movieId: number,
  before: MovieWatchState | null | undefined,
  rating?: number,
  info: MovieWatchInfo = {}
): Promise<void> {
  if (!shouldLogMovieWatch(before)) return;
  let { title, runtime, genres, providers } = info;
  if (!title || !runtime || !genres) {
    const catalog = await fetchStaticCatalogMovies().catch(() => null);
    const entry = catalog?.[String(movieId)];
    title = title || entry?.title || '';
    runtime = runtime || entry?.runtime || undefined;
    genres = genres?.length ? genres : entry?.genres;
    providers = providers?.length ? providers : entry?.providers?.map((p) => p.name);
  }
  await logMovieWatch(userId, movieId, title || '', runtime, rating, genres, providers);
}

/** „Gesehen" zurückgenommen: das Ereignis dieses Jahres wieder entfernen. */
export async function removeMovieWatchEvent(userId: string, movieId: number): Promise<void> {
  const ref = firebase.database().ref(getEventsPath(userId, new Date().getFullYear()));
  const snapshot = await ref.once('value');
  const events = (snapshot.val() || {}) as Record<string, Record<string, unknown>>;
  const updates: Record<string, null> = {};
  for (const [eventId, raw] of Object.entries(events)) {
    const isMovie =
      ((raw.t === 'mv' || raw.t === 'mr') && raw.s === movieId) ||
      ((raw.type === 'movie_watch' || raw.type === 'movie_rating') && raw.movieId === movieId);
    if (isMovie) updates[eventId] = null;
  }
  if (Object.keys(updates).length > 0) await ref.update(updates);
}
