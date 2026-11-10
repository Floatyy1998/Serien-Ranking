import { filterBulkMarkable } from '../../lib/episode/releaseState';
import { wasMovieWatched } from '../../lib/watch/movieWatchLog';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { dbUpdate, paths, updateWithSeriesVersion } from '../db/ref';
import { adjustBulkExcludedEpisodes } from '../pet/mysteryBoxService';
import { logMovieWatchIfNew } from '../watchActivity/movieWatchLogging';

export interface MediaRef {
  type: 'series' | 'movie';
  id: number;
}

const itemPath = (uid: string, ref: MediaRef) =>
  ref.type === 'movie' ? paths.movieItem(uid, ref.id) : paths.seriesItem(uid, ref.id);

const CHUNK = 150;

/** „Im Besitz" (DVD, Blu-ray …) für viele Serien/Filme setzen oder entfernen. */
export async function setMediaOwned(uid: string, refs: MediaRef[], owned: boolean): Promise<void> {
  const value = owned ? new Date().toISOString() : null;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const updates: Record<string, unknown> = {};
    for (const ref of refs.slice(i, i + CHUNK)) updates[`${itemPath(uid, ref)}/ownedAt`] = value;
    await updateWithSeriesVersion(uid, updates);
  }
}

/**
 * Filme als gesehen markieren. `earlier`: früher gesehen — ohne Datum und ohne Eintrag im Jahresrückblick,
 * sonst wie ein einzelnes „Gesehen" heute (mit Wrapped-Ereignis).
 */
export async function markMoviesWatched(
  uid: string,
  movies: Movie[],
  earlier: boolean
): Promise<number> {
  const fresh = movies.filter((m) => !wasMovieWatched(m));
  const now = new Date().toISOString();
  for (let i = 0; i < fresh.length; i += CHUNK) {
    const updates: Record<string, unknown> = {};
    for (const movie of fresh.slice(i, i + CHUNK)) {
      const base = paths.movieItem(uid, movie.id);
      updates[`${base}/watched`] = true;
      if (!earlier) updates[`${base}/watchedAt`] = movie.watchedAt || now;
    }
    if (i + CHUNK >= fresh.length) await updateWithSeriesVersion(uid, updates);
    else await dbUpdate(updates);
  }
  if (!earlier) {
    for (const movie of fresh) {
      void logMovieWatchIfNew(uid, movie.id, movie, undefined, {
        title: movie.title,
        runtime: movie.runtime,
        genres: movie.genre?.genres,
        providers: movie.provider?.provider?.map((p) => p.name),
      });
    }
  }
  return fresh.length;
}

/** Watch-Einträge für alle erschienenen, noch offenen Folgen einer Serie (Staffel-Regel wie beim Abhaken). */
export function seriesWatchAllUpdates(
  uid: string,
  series: Series,
  nowUnix: number
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  (series.seasons ?? []).forEach((season, seasonIndex) => {
    const base = `${paths.seriesWatchItem(uid, series.id)}/seasons/${seasonIndex}/eps`;
    for (const ep of filterBulkMarkable(season.episodes ?? [])) {
      if (!ep.id || ep.watched) continue;
      const epBase = `${base}/${ep.id}`;
      updates[`${epBase}/w`] = 1;
      updates[`${epBase}/c`] = 1;
      updates[`${epBase}/f`] = nowUnix;
      updates[`${epBase}/l`] = nowUnix;
      if (ep.episode_number != null) updates[`${epBase}/n`] = ep.episode_number;
      if (ep.absoluteNumber != null) updates[`${epBase}/a`] = ep.absoluteNumber;
    }
  });
  return updates;
}

/**
 * Alle erschienenen Folgen vieler Serien abhaken — nie Zukunfts-Folgen, schon gesehene behalten ihren Zähler.
 * Zählt wie jedes Massen-Abhaken nicht für Mystery-Boxen. Gibt die Zahl der neu markierten Folgen zurück.
 */
export async function markSeriesWatched(uid: string, list: Series[]): Promise<number> {
  const nowUnix = Math.floor(Date.now() / 1000);
  let pending: Record<string, unknown> = {};
  let marked = 0;
  const flush = async (last: boolean) => {
    if (!Object.keys(pending).length && !last) return;
    if (last) await updateWithSeriesVersion(uid, pending);
    else await dbUpdate(pending);
    pending = {};
  };
  for (const series of list) {
    const updates = seriesWatchAllUpdates(uid, series, nowUnix);
    marked += Object.keys(updates).filter((k) => k.endsWith('/w')).length;
    Object.assign(pending, updates);
    if (Object.keys(pending).length > 3000) await flush(false);
  }
  await flush(true);
  if (marked) void adjustBulkExcludedEpisodes(uid, marked);
  return marked;
}
