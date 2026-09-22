// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { LeaderboardTotals } from '../../types/Leaderboard';

const state = vi.hoisted(() => ({
  uid: 'me' as string | undefined,
  friends: [] as { uid: string }[],
  totals: {} as Record<string, LeaderboardTotals | null>,
  ownMinutes: 0,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: state.uid ? { uid: state.uid } : null }),
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ friends: state.friends }),
}));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: [] }),
}));
vi.mock('../../contexts/MovieListContext', () => ({ useMovieList: () => ({ movieList: [] }) }));
vi.mock('../../lib/stats/libraryTotals', () => ({
  computeLibraryTotals: () => ({ watchtimeMinutes: state.ownMinutes }),
}));
vi.mock('../../services/social/userTotalsService', () => ({
  fetchLibraryTotals: (uids: string[]) => {
    const map: Record<string, LeaderboardTotals | null> = {};
    for (const uid of uids) map[uid] = state.totals[uid] ?? null;
    return Promise.resolve(map);
  },
}));

import { useFriendTotalsRank } from './useFriendTotalsRank';

const snapshot = (watchtimeMinutes: number): LeaderboardTotals => ({
  watchtimeMinutes,
  episodes: 0,
  seriesStarted: 0,
  seriesCompleted: 0,
  movies: 0,
  updatedAt: 1,
  v: 1,
});

beforeEach(() => {
  state.uid = 'me';
  state.friends = [];
  state.totals = {};
  state.ownMinutes = 0;
});

afterEach(() => cleanup());

describe('useFriendTotalsRank', () => {
  it('ohne Freunde gibt es nichts einzuordnen', async () => {
    const { result } = renderHook(() => useFriendTotalsRank());
    await waitFor(() => expect(result.current).toEqual({ rank: null, of: 0 }));
  });

  it('zaehlt nur Freunde mit Schnappschuss mit', async () => {
    state.friends = [{ uid: 'a' }, { uid: 'b' }];
    state.totals = { a: snapshot(100) };
    state.ownMinutes = 50;

    const { result } = renderHook(() => useFriendTotalsRank());
    await waitFor(() => expect(result.current.of).toBe(2));
    expect(result.current.rank).toBe(2);
  });

  it('wer mehr Zeit hat, steht vorne', async () => {
    state.friends = [{ uid: 'a' }, { uid: 'b' }];
    state.totals = { a: snapshot(10), b: snapshot(20) };
    state.ownMinutes = 999;

    const { result } = renderHook(() => useFriendTotalsRank());
    await waitFor(() => expect(result.current).toEqual({ rank: 1, of: 3 }));
  });

  it('Gleichstand zaehlt nicht als Rueckstand', async () => {
    state.friends = [{ uid: 'a' }];
    state.totals = { a: snapshot(500) };
    state.ownMinutes = 500;

    const { result } = renderHook(() => useFriendTotalsRank());
    await waitFor(() => expect(result.current).toEqual({ rank: 1, of: 2 }));
  });

  it('ohne angemeldeten Nutzer bleibt die Zeile leer', async () => {
    state.uid = undefined;
    state.friends = [{ uid: 'a' }];

    const { result } = renderHook(() => useFriendTotalsRank());
    await waitFor(() => expect(result.current.rank).toBeNull());
  });
});
