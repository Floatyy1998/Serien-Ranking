// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ values: new Map<string, unknown>(), get: vi.fn() }));
vi.mock('../../services/db/ref', () => ({
  dbGet: (path: string) => {
    db.get(path);
    return Promise.resolve(db.values.get(path) ?? null);
  },
  paths: {
    series: (uid: string) => `users/${uid}/series`,
    seriesWatch: (uid: string) => `users/${uid}/seriesWatch`,
  },
}));

const catalog = vi.hoisted(() => ({
  meta: {} as Record<string, unknown> | null,
  seasons: {} as Record<string, unknown> | null,
}));
vi.mock('../../services/catalog/staticCatalog', () => ({
  fetchStaticCatalogSeries: () => Promise.resolve(catalog.meta),
  fetchStaticCatalogSeasonsBulk: () => Promise.resolve(catalog.seasons),
}));

import { clearFriendSeriesCache, useFriendSeriesList } from './useFriendSeriesList';

beforeEach(() => {
  clearFriendSeriesCache();
  db.values.clear();
  db.get.mockClear();
  catalog.meta = {
    '42': { id: 42, title: 'Kalte Küste', genre: { genres: ['Drama'] } },
    '43': { id: 43, title: 'Nachtschicht' },
  };
  catalog.seasons = {
    '42': { '0': { seasonNumber: 0, episodes: [{ id: 11, name: 'Eins', airDate: '2026-06-03' }] } },
  };
});
afterEach(cleanup);

describe('useFriendSeriesList', () => {
  it('does nothing without a friend', () => {
    const { result } = renderHook(() => useFriendSeriesList(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.seriesList).toEqual([]);
    expect(db.get).not.toHaveBeenCalled();
  });

  it('merges the friends refs with the shared catalog', async () => {
    db.values.set('users/f1/series', { '42': { watchlist: true, rating: { Drama: 8 } } });

    const { result } = renderHook(() => useFriendSeriesList('f1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.seriesList).toHaveLength(1);
    expect(result.current.seriesList[0]).toMatchObject({ id: 42, title: 'Kalte Küste' });
    // Genau zwei Firebase-Reads — der Katalog kommt aus dem Speicher.
    expect(db.get.mock.calls.map(([p]) => p)).toEqual(['users/f1/series', 'users/f1/seriesWatch']);
  });

  it('skips titles the catalog does not know', async () => {
    db.values.set('users/f1/series', { '999': { watchlist: true } });
    const { result } = renderHook(() => useFriendSeriesList('f1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.seriesList).toEqual([]);
  });

  it('carries the friends watch state into the merged view', async () => {
    db.values.set('users/f1/series', { '42': {} });
    db.values.set('users/f1/seriesWatch', {
      '42': { seasons: { '0': { eps: { '11': { w: 1 } } } } },
    });

    const { result } = renderHook(() => useFriendSeriesList('f1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.seriesList[0].seasons[0].episodes[0].watched).toBe(true);
  });

  it('serves a repeat visit from the cache', async () => {
    db.values.set('users/f1/series', { '42': {} });
    const first = renderHook(() => useFriendSeriesList('f1'));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    const calls = db.get.mock.calls.length;

    const second = renderHook(() => useFriendSeriesList('f1'));
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(db.get.mock.calls.length).toBe(calls);
  });

  it('reports an error instead of hanging', async () => {
    catalog.meta = null;
    db.values.set('users/f1/series', { '42': {} });
    const { result } = renderHook(() => useFriendSeriesList('f1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.seriesList).toEqual([]);
  });
});
