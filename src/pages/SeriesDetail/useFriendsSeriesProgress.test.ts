// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';

// ── firebase compat ───────────────────────────────────────────────────
const fb = vi.hoisted(() => {
  const onceMock = vi.fn(
    (): Promise<{ val: () => unknown }> => Promise.resolve({ val: () => null })
  );
  const refMock = vi.fn((_p?: string) => ({ once: onceMock }));
  const database = () => ({ ref: refMock });
  return { onceMock, refMock, database };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// ── friends context ───────────────────────────────────────────────────
interface Friend {
  uid: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
}
const ctx = vi.hoisted(() => ({ friends: [] as Friend[] }));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ friends: ctx.friends }),
}));

import { useFriendsSeriesProgress } from './useFriendsSeriesProgress';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];
const ep = (o: Partial<Episode> & { id: number }): Episode =>
  ({
    air_date: '2020-01-01',
    name: `Ep ${o.id}`,
    watched: false,
    episode_number: o.id,
    ...o,
  }) as Episode;

// two seasons, ids 11,12 (season 0) and 21 (season 1) → 3 episodes total
const SEASONS: Series['seasons'] = [
  { seasonNumber: 0, episodes: [ep({ id: 11 }), ep({ id: 12 })] },
  { seasonNumber: 1, episodes: [ep({ id: 21 })] },
];

// Map friend-uid → seriesWatch snapshot value.
function routeSnapshots(byUid: Record<string, unknown>) {
  fb.onceMock.mockImplementation(() => {
    // determine uid from the most recent ref() call (ref() is called right before once())
    const calls = fb.refMock.mock.calls;
    const lastRef = calls.length > 0 ? (calls[calls.length - 1][0] as string) : '';
    const uid = lastRef.split('/')[1] ?? '';
    return Promise.resolve({ val: () => byUid[uid] ?? null });
  });
}

beforeEach(() => {
  ctx.friends = [];
  fb.onceMock.mockReset();
  fb.refMock.mockClear();
  fb.onceMock.mockResolvedValue({ val: () => null });
});

afterEach(() => {
  cleanup();
});

describe('useFriendsSeriesProgress', () => {
  it('returns empty and not-loading when there is no series id', async () => {
    ctx.friends = [{ uid: 'f1' }];
    const { result } = renderHook(() => useFriendsSeriesProgress(undefined, 3, SEASONS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(fb.onceMock).not.toHaveBeenCalled();
  });

  it('returns empty when the friend list is empty', async () => {
    ctx.friends = [];
    const { result } = renderHook(() => useFriendsSeriesProgress(5, 3, SEASONS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it('counts watched episodes (compact {eps} format) and tracks the latest position', async () => {
    ctx.friends = [{ uid: 'f1', displayName: 'Fiona' }];
    routeSnapshots({
      f1: {
        seasons: {
          '0': { eps: { '11': { w: 1 }, '12': { w: 1 } } },
          '1': { eps: { '21': { w: 1 } } },
        },
      },
    });

    const { result } = renderHook(() => useFriendsSeriesProgress(5, 3, SEASONS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries).toHaveLength(1);
    const entry = result.current.entries[0];
    expect(entry).toMatchObject({
      uid: 'f1',
      displayName: 'Fiona',
      watched: 3,
      percentage: 100,
      completed: true,
      hasStarted: true,
      latestSeason: 2, // season index 1 → seasonNumber 2
      latestEpisode: 1,
    });
  });

  it('supports the legacy {w[]} array format keyed by within-season position', async () => {
    ctx.friends = [{ uid: 'f1', username: 'legacyfan' }];
    routeSnapshots({
      f1: { seasons: { '0': { w: [1, 0] } } }, // only first episode of season 0 watched
    });

    const { result } = renderHook(() => useFriendsSeriesProgress(5, 3, SEASONS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({
      displayName: 'legacyfan',
      watched: 1,
      percentage: 33, // round(1/3*100)
      completed: false,
      latestSeason: 1,
      latestEpisode: 1,
    });
  });

  it('drops friends who have watched nothing and sorts the rest by progress', async () => {
    ctx.friends = [
      { uid: 'none' },
      { uid: 'low', displayName: 'Low' },
      { uid: 'high', displayName: 'High' },
    ];
    routeSnapshots({
      none: { seasons: {} },
      low: { seasons: { '0': { eps: { '11': { w: 1 } } } } }, // 1/3
      high: { seasons: { '0': { eps: { '11': { w: 1 }, '12': { w: 1 } } } } }, // 2/3
    });

    const { result } = renderHook(() => useFriendsSeriesProgress(5, 3, SEASONS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries.map((e) => e.uid)).toEqual(['high', 'low']);
  });

  it('recovers from a per-friend read failure without dropping the batch', async () => {
    ctx.friends = [{ uid: 'boom' }];
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fb.onceMock.mockRejectedValue(new Error('read failed'));

    const { result } = renderHook(() => useFriendsSeriesProgress(5, 3, SEASONS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
    errSpy.mockRestore();
  });
});
