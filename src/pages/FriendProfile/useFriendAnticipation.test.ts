// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * Firebase once für users/$uid/series + static catalog (series meta + seasons
 * bulk) + useSeriesList (eigene Watchlist). findNextUpcoming bleibt echt.
 */
const fb = vi.hoisted(() => {
  const state = { series: null as unknown };
  const makeRef = (_path: string) => ({
    once: async (_e: string) => ({ val: () => state.series }),
  });
  return { state, ref: (path: string) => makeRef(path) };
});

const cat = vi.hoisted(() => ({
  series: {} as Record<string, unknown> | null,
  bulk: {} as Record<string, unknown> | null,
}));
const ctx = vi.hoisted(() => ({ seriesList: [] as unknown[] }));

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));
vi.mock('../../services/staticCatalog', () => ({
  fetchStaticCatalogSeries: () => Promise.resolve(cat.series),
  fetchStaticCatalogSeasonsBulk: () => Promise.resolve(cat.bulk),
  fetchStaticCatalogSeasons: () => Promise.resolve(null),
  subscribeCatalogChange: () => () => {},
}));

import { useFriendAnticipation } from './useFriendAnticipation';

const inDays = (n: number) => {
  const d = new Date(Date.now() + n * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
};

beforeEach(() => {
  fb.state.series = null;
  cat.series = {};
  cat.bulk = {};
  ctx.seriesList = [];
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useFriendAnticipation', () => {
  it('bleibt ohne friendUid im Loading und liefert keine Items', async () => {
    const { result } = renderHook(() => useFriendAnticipation(undefined));
    // Katalog-Effekt läuft trotzdem; watchlistIds bleibt null → loading
    await waitFor(() => expect(cat.bulk).toBeTruthy());
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('sammelt die nächste kommende Episode je Serie und sortiert nach Air-Date', async () => {
    fb.state.series = { '1': { watchlist: true }, '2': { watchlist: true } };
    cat.series = {
      '1': { title: 'Sooner', poster: 's.jpg' },
      '2': { title: 'Later', poster: 'l.jpg' },
    };
    cat.bulk = {
      '1': {
        s1: {
          season_number: 1,
          episodes: [
            { air_date: inDays(-5), episode_number: 1, name: 'Past' },
            { air_date: inDays(10), episode_number: 2, name: 'Next1' },
          ],
        },
      },
      '2': {
        s1: {
          season_number: 2,
          episodes: [{ air_date: inDays(3), episode_number: 1, name: 'Next2' }],
        },
      },
    };

    const { result } = renderHook(() => useFriendAnticipation('friend'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    // nach Air-Date aufsteigend: Later(3d) vor Sooner(10d)
    expect(result.current.items.map((i) => i.title)).toEqual(['Later', 'Sooner']);
    const first = result.current.items[0];
    expect(first.episodeTitle).toBe('Next2');
    expect(first.daysUntil).toBeGreaterThan(0);
    expect(first.bothWaiting).toBe(false);
  });

  it('markiert bothWaiting wenn die Serie auch in der eigenen Watchlist steht', async () => {
    fb.state.series = { '1': { watchlist: true } };
    cat.series = { '1': { title: 'Shared', poster: '' } };
    cat.bulk = {
      '1': {
        s1: { season_number: 1, episodes: [{ air_date: inDays(4), episode_number: 1 }] },
      },
    };
    ctx.seriesList = [{ id: 1, watchlist: true }];

    const { result } = renderHook(() => useFriendAnticipation('friend'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].bothWaiting).toBe(true);
  });

  it('ignoriert Serien ohne kommende Episoden', async () => {
    fb.state.series = { '1': { watchlist: true } };
    cat.series = { '1': { title: 'AllPast' } };
    cat.bulk = {
      '1': {
        s1: { season_number: 1, episodes: [{ air_date: inDays(-2), episode_number: 1 }] },
      },
    };
    const { result } = renderHook(() => useFriendAnticipation('friend'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});
