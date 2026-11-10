import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { markMoviesWatched, seriesWatchAllUpdates, setMediaOwned } from './mediaBulk';

const db = vi.hoisted(() => ({
  dbUpdate: vi.fn(async () => {}),
  updateWithSeriesVersion: vi.fn(async () => {}),
}));
const logMovieWatchIfNew = vi.hoisted(() => vi.fn(async () => {}));

vi.mock('../db/ref', async () => {
  const { paths } = await import('../db/paths');
  return { ...db, paths };
});
vi.mock('../watchActivity/movieWatchLogging', () => ({ logMovieWatchIfNew }));
vi.mock('../pet/mysteryBoxService', () => ({ adjustBulkExcludedEpisodes: vi.fn() }));

const movie = (id: number, over: Partial<Movie> = {}) =>
  ({ id, title: `Film ${id}`, rating: {}, genre: { genres: ['Drama'] }, ...over }) as Movie;

beforeEach(() => {
  db.dbUpdate.mockClear();
  db.updateWithSeriesVersion.mockClear();
  logMovieWatchIfNew.mockClear();
});

describe('setMediaOwned', () => {
  it('setzt ownedAt für Serien und Filme in einem Schreibvorgang mit Versions-Bump', async () => {
    await setMediaOwned(
      'u1',
      [
        { type: 'series', id: 1 },
        { type: 'movie', id: 2 },
      ],
      true
    );
    const [uid, updates] = db.updateWithSeriesVersion.mock.calls[0] as unknown as [
      string,
      Record<string, unknown>,
    ];
    expect(uid).toBe('u1');
    expect(Object.keys(updates).sort()).toEqual([
      'users/u1/movies/2/ownedAt',
      'users/u1/series/1/ownedAt',
    ]);
    expect(typeof updates['users/u1/series/1/ownedAt']).toBe('string');
  });

  it('löscht ownedAt beim Entfernen', async () => {
    await setMediaOwned('u1', [{ type: 'movie', id: 2 }], false);
    const updates = (db.updateWithSeriesVersion.mock.calls[0] as unknown as [string, object])[1];
    expect(updates).toEqual({ 'users/u1/movies/2/ownedAt': null });
  });
});

describe('markMoviesWatched', () => {
  it('lässt schon gesehene Filme aus und loggt heute gesehene für Wrapped', async () => {
    const n = await markMoviesWatched(
      'u1',
      [movie(1), movie(2, { watched: true }), movie(3, { rating: { Drama: 8 } })],
      false
    );
    expect(n).toBe(1);
    const updates = (
      db.updateWithSeriesVersion.mock.calls[0] as unknown as [string, Record<string, unknown>]
    )[1];
    expect(updates['users/u1/movies/1/watched']).toBe(true);
    expect(typeof updates['users/u1/movies/1/watchedAt']).toBe('string');
    expect(Object.keys(updates)).toHaveLength(2);
    expect(logMovieWatchIfNew).toHaveBeenCalledTimes(1);
  });

  it('setzt „früher gesehen" ohne Datum und ohne Wrapped-Ereignis', async () => {
    await markMoviesWatched('u1', [movie(1)], true);
    const updates = (db.updateWithSeriesVersion.mock.calls[0] as unknown as [string, object])[1];
    expect(updates).toEqual({ 'users/u1/movies/1/watched': true });
    expect(logMovieWatchIfNew).not.toHaveBeenCalled();
  });
});

describe('seriesWatchAllUpdates', () => {
  it('hakt nur erschienene, offene Folgen ab und lässt Gesehenes unangetastet', () => {
    const series = {
      id: 9,
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            { id: 11, air_date: '2020-01-01', watched: true, episode_number: 1 },
            { id: 12, air_date: '2020-01-08', watched: false, episode_number: 2 },
            { id: 13, air_date: '2999-01-01', watched: false, episode_number: 3 },
          ],
        },
      ],
    } as unknown as Series;
    const updates = seriesWatchAllUpdates('u1', series, 1000);
    expect(updates).toEqual({
      'users/u1/seriesWatch/9/seasons/0/eps/12/w': 1,
      'users/u1/seriesWatch/9/seasons/0/eps/12/c': 1,
      'users/u1/seriesWatch/9/seasons/0/eps/12/f': 1000,
      'users/u1/seriesWatch/9/seasons/0/eps/12/l': 1000,
      'users/u1/seriesWatch/9/seasons/0/eps/12/n': 2,
    });
  });
});
