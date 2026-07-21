// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LeaderboardStats, MonthlyTrophy } from '../../types/Leaderboard';

const fb = vi.hoisted(() => {
  const state = { dataByPath: {} as Record<string, unknown> };
  const ref = vi.fn((path: string) => ({
    once: async () => ({ val: () => state.dataByPath[path] ?? null }),
    set: async (v: unknown) => {
      state.dataByPath[path] = v;
    },
  }));
  const database = Object.assign(() => ({ ref }), {});
  return { state, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const friendsState = vi.hoisted(() => ({ friends: [] as Array<{ uid: string }> }));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ friends: friendsState.friends }),
}));

const svc = vi.hoisted(() => ({
  checkAndArchiveMonth: vi.fn(async () => {}),
  fetchGlobalLeaderboard: vi.fn(async () => [] as unknown[]),
  fetchLeaderboardData: vi.fn(async () => ({}) as Record<string, LeaderboardStats>),
  fetchLeaderboardProfiles: vi.fn(async () => ({}) as Record<string, unknown>),
  fetchTrophyHistory: vi.fn(async () => [] as MonthlyTrophy[]),
  forceRebuildArchive: vi.fn(async () => {}),
  seedLeaderboardStats: vi.fn(async () => {}),
}));
vi.mock('../../services/leaderboardService', () => svc);

import { useLeaderboardData } from './useLeaderboardData';

beforeEach(() => {
  fb.state.dataByPath = {};
  fb.ref.mockClear();
  authState.user = { uid: 'u1' };
  friendsState.friends = [{ uid: 'f1' }];
  for (const fn of Object.values(svc)) fn.mockReset();
  svc.fetchLeaderboardData.mockResolvedValue({});
  svc.fetchLeaderboardProfiles.mockResolvedValue({});
  svc.fetchGlobalLeaderboard.mockResolvedValue([]);
  svc.fetchTrophyHistory.mockResolvedValue([]);
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useLeaderboardData – friends mode', () => {
  it('lädt Freundes-Statistiken und berechnet Rankings', async () => {
    svc.fetchLeaderboardData.mockResolvedValue({
      u1: { episodesThisMonth: 10 } as unknown as LeaderboardStats,
      f1: { episodesThisMonth: 5 } as unknown as LeaderboardStats,
    });
    svc.fetchLeaderboardProfiles.mockResolvedValue({
      u1: { displayName: 'Me' },
      f1: { displayName: 'Friend' },
    });
    const { result } = renderHook(() => useLeaderboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rankings).toHaveLength(2);
    expect(result.current.rankings[0]?.uid).toBe('u1');
    expect(result.current.rankings[0]?.rank).toBe(1);
    expect(result.current.rankings[0]?.value).toBe(10);
    expect(result.current.rankings[0]?.isCurrentUser).toBe(true);
    expect(result.current.rankings[1]?.rank).toBe(2);
  });
});

describe('useLeaderboardData – global mode', () => {
  it('wechselt in den globalen Modus und lädt globale Einträge', async () => {
    svc.fetchGlobalLeaderboard.mockResolvedValue([
      { uid: 'x', displayName: 'X', episodesThisMonth: 20 },
      { uid: 'u1', displayName: 'Me', episodesThisMonth: 3 },
    ] as unknown[]);
    const { result } = renderHook(() => useLeaderboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setMode('global'));
    await waitFor(() => expect(svc.fetchGlobalLeaderboard).toHaveBeenCalled());
    await waitFor(() => expect(result.current.rankings.length).toBe(2));
    expect(result.current.rankings[0]?.uid).toBe('x');
    expect(result.current.rankings[0]?.value).toBe(20);
    expect(svc.seedLeaderboardStats).toHaveBeenCalledWith('u1', ['f1']);
  });
});

describe('useLeaderboardData – trophies', () => {
  it('lädt Trophäen und feiert eine eigene Top-Platzierung', async () => {
    svc.fetchTrophyHistory.mockResolvedValue([
      {
        monthKey: '2026-06',
        first: { uid: 'u1', score: 100 },
        second: { uid: 'f1', score: 50 },
        third: { uid: 'z', score: 10 },
      } as unknown as MonthlyTrophy,
    ]);
    const { result } = renderHook(() => useLeaderboardData());
    await waitFor(() => expect(result.current.trophies.length).toBe(1));
    await waitFor(() => expect(result.current.celebration).not.toBeNull());
    expect(result.current.celebration?.place).toBe(1);
    expect(result.current.celebration?.monthLabel).toBe('Juni');
    expect(result.current.celebration?.score).toBe(100);
    // Archivierung läuft serverseitig (Backend-Cron), nicht mehr im Client
    expect(svc.checkAndArchiveMonth).not.toHaveBeenCalled();
  });
});
