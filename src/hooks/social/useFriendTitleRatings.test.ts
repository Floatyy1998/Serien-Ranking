// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Friend } from '../../types/Friend';

const ctx = vi.hoisted(() => ({
  favoriteFriends: [] as Friend[],
  /** Stabiles Set — ein frisch gebautes je Render dreht die Effekte im Kreis. */
  grantedToMe: new Set<string>(),
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({
    favoriteFriends: ctx.favoriteFriends,
    grantedToMe: ctx.grantedToMe,
  }),
}));

const db = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  get: vi.fn(),
}));
vi.mock('../../services/db/ref', () => ({
  dbGet: (path: string) => {
    db.get(path);
    return Promise.resolve(db.values.get(path) ?? null);
  },
  paths: {
    seriesWatchItem: (uid: string, id: string | number) => `users/${uid}/seriesWatch/${id}`,
  },
  userPath: (uid: string, ...segments: (string | number)[]) =>
    ['users', uid, ...segments].join('/'),
}));

const catalog = vi.hoisted(() => ({ seasons: null as unknown }));
vi.mock('../../services/catalog/staticCatalog', () => ({
  fetchStaticCatalogSeasons: () => Promise.resolve(catalog.seasons),
}));

import { clearFriendTitleRatingsCache, useFriendTitleRatings } from './useFriendTitleRatings';

const friend = (uid: string, displayName: string): Friend =>
  ({ uid, displayName, username: displayName.toLowerCase(), email: '' }) as Friend;

beforeEach(() => {
  clearFriendTitleRatingsCache();
  db.values.clear();
  db.get.mockClear();
  ctx.favoriteFriends = [friend('f1', 'Flo'), friend('f2', 'Anna')];
  ctx.grantedToMe = new Set(['f1', 'f2']);
  catalog.seasons = { '0': { episodes: [{ id: 11 }, { id: 12 }] } };
});
afterEach(cleanup);

describe('useFriendTitleRatings', () => {
  it('reads nothing while disabled', () => {
    const { result } = renderHook(() => useFriendTitleRatings(42, 'series', false));
    expect(result.current.entries).toEqual([]);
    expect(db.get).not.toHaveBeenCalled();
  });

  it('reads one targeted path per favorite and sorts by rating', async () => {
    db.values.set('users/f1/series/42', { rating: { Drama: 7 } });
    db.values.set('users/f2/series/42', { rating: { Drama: 9 } });

    const { result } = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries.map((e) => e.displayName)).toEqual(['Anna', 'Flo']);
    expect(result.current.entries[0].rating).toBe(9);
    // Punkt-Reads, nie die ganze Fremdliste.
    expect(db.get).toHaveBeenCalledWith('users/f1/series/42');
    expect(db.get).not.toHaveBeenCalledWith('users/f1/series');
  });

  it('skips favorites who do not have the title', async () => {
    db.values.set('users/f1/series/42', { rating: { Drama: 8 } });
    const { result } = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toHaveLength(1);
  });

  it('derives progress from the friends watch node', async () => {
    db.values.set('users/f1/series/42', { rating: { Drama: 8 } });
    db.values.set('users/f1/seriesWatch/42', { seasons: { '0': { eps: { '11': { w: 1 } } } } });
    ctx.favoriteFriends = [friend('f1', 'Flo')];
    ctx.grantedToMe = new Set(['f1']);

    const { result } = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries[0]).toMatchObject({
      percentage: 50,
      latestSeason: 1,
      latestEpisode: 1,
      completed: false,
    });
  });

  it('marks a fully watched series as completed', async () => {
    db.values.set('users/f1/series/42', { rating: { Drama: 8 } });
    db.values.set('users/f1/seriesWatch/42', {
      seasons: { '0': { eps: { '11': { w: 1 }, '12': { w: 1 } } } },
    });
    ctx.favoriteFriends = [friend('f1', 'Flo')];
    ctx.grantedToMe = new Set(['f1']);

    const { result } = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries[0]).toMatchObject({ percentage: 100, completed: true });
  });

  it('leaves progress out for movies and reads the movies node', async () => {
    db.values.set('users/f1/movies/7', { rating: { Action: 6 } });
    ctx.favoriteFriends = [friend('f1', 'Flo')];
    ctx.grantedToMe = new Set(['f1']);

    const { result } = renderHook(() => useFriendTitleRatings(7, 'movie', true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries[0]).toMatchObject({ rating: 6, percentage: null });
    expect(db.get).toHaveBeenCalledWith('users/f1/movies/7');
  });

  it('stays empty without favorites', async () => {
    ctx.favoriteFriends = [];
    ctx.grantedToMe = new Set();
    const { result } = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(db.get).not.toHaveBeenCalled();
  });

  it('serves a second mount from the session cache', async () => {
    db.values.set('users/f1/series/42', { rating: { Drama: 8 } });
    ctx.favoriteFriends = [friend('f1', 'Flo')];
    ctx.grantedToMe = new Set(['f1']);

    const first = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    const callsAfterFirst = db.get.mock.calls.length;

    const second = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(db.get.mock.calls.length).toBe(callsAfterFirst);
  });

  it('ignoriert Favoriten ohne Freigabe', async () => {
    db.values.set('users/f1/series/42', { rating: { Drama: 8 } });
    ctx.favoriteFriends = [friend('f1', 'Flo')];
    ctx.grantedToMe = new Set();

    const { result } = renderHook(() => useFriendTitleRatings(42, 'series', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(db.get).not.toHaveBeenCalled();
  });
});
