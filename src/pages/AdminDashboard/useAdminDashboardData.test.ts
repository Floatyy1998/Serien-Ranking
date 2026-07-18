// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ValueCb = (snap: { val: () => unknown }) => void;

const fb = vi.hoisted(() => {
  const state = {
    dataByPath: {} as Record<string, unknown>,
    listeners: [] as Array<{ path: string; cb: ValueCb }>,
  };
  const ref = vi.fn((path: string) => ({
    once: async () => ({ val: () => state.dataByPath[path] ?? null }),
    on: (_e: string, cb: ValueCb) => {
      state.listeners.push({ path, cb });
      return cb;
    },
    off: () => {},
  }));
  const database = Object.assign(() => ({ ref }), {});
  return { state, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

import { monthKey, useAdminDashboardData } from './useAdminDashboardData';

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TODAY = dateKey(0);
const YESTERDAY = dateKey(1);

beforeEach(() => {
  fb.state.dataByPath = {};
  fb.state.listeners = [];
  fb.ref.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('monthKey', () => {
  it('formatiert den aktuellen Monat als YYYY-MM', () => {
    expect(monthKey(0)).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('useAdminDashboardData', () => {
  function seedAnalytics() {
    fb.state.dataByPath[`analytics/global/daily/${TODAY}`] = {
      totalEvents: 100,
      pageViews: { home: 5, discover: 2 },
      events: { click: 3, view: 7 },
      activeUsers: { a: 1, b: 1 },
      newUsers: 2,
    };
    fb.state.dataByPath[`analytics/global/daily/${YESTERDAY}`] = {
      totalEvents: 50,
      pageViews: {},
      events: {},
      activeUsers: { a: 1 },
      newUsers: 1,
    };
    fb.state.dataByPath['analytics/users'] = {
      userA: {
        meta: { firstSeen: 1, lastSeen: 200, platform: 'both' },
        extension: { sessions: { [TODAY]: { s1: { platform: 'web', episodesWatched: 3 } } } },
        events: { [TODAY]: { batch: { events: [{ e: 'play', t: 5 }] } } },
        daily: { [TODAY]: { events: { play: 1 }, pageViews: {}, lastSeen: 200 } },
      },
      userB: {
        meta: { firstSeen: 2, lastSeen: 100, platform: 'web' },
      },
    };
    fb.state.dataByPath['users/userA'] = { displayName: 'Anna' };
    fb.state.dataByPath['users/userB'] = { displayName: 'Ben' };
    // Direkt-Pfade für die per-User-Loader (eigene once-Reads).
    fb.state.dataByPath[`analytics/users/userA/daily/${TODAY}`] = {
      events: { play: 1 },
      pageViews: {},
      lastSeen: 200,
    };
  }

  it('lädt tägliche Statistiken und berechnet KPIs', async () => {
    seedAnalytics();
    const { result } = renderHook(() => useAdminDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dauToday).toBe(2);
    expect(result.current.eventsToday).toBe(100);
    expect(result.current.eventsDelta).toBe(100); // (100-50)/50 * 100
    expect(result.current.topEvents[0]).toEqual({ name: 'view', count: 7 });
    expect(result.current.topPages[0]).toEqual({ name: 'home', count: 5 });
  });

  it('lädt Nutzer-Metas, Profile und Extension-Sessions', async () => {
    seedAnalytics();
    const { result } = renderHook(() => useAdminDashboardData());
    await waitFor(() => expect(result.current.totalUsers).toBe(2));
    expect(result.current.extensionUserCount).toBe(1);
    expect(result.current.extensionSessions.userA).toHaveLength(1);
    await waitFor(() =>
      expect(result.current.usersList.find((u) => u.uid === 'userA')?.displayName).toBe('Anna')
    );
    // Nach lastSeen absteigend sortiert
    expect(result.current.usersList[0]?.uid).toBe('userA');
  });

  it('aktualisiert Realtime-Nutzer über den Listener', async () => {
    seedAnalytics();
    const { result } = renderHook(() => useAdminDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const entry = fb.state.listeners.find(
      (l) => l.path === 'analytics/global/realtime/activeUsers'
    );
    act(() => entry?.cb({ val: () => ({ userA: { page: '/home', since: 123, ts: Date.now() } }) }));
    await waitFor(() => expect(result.current.realtimeUsers).toHaveLength(1));
    expect(result.current.realtimeUsers[0]).toEqual({ uid: 'userA', page: '/home', since: 123 });
  });

  it('loadUserDailyStats liefert Tages-Statistiken eines Nutzers', async () => {
    seedAnalytics();
    const { result } = renderHook(() => useAdminDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let stats: Awaited<ReturnType<typeof result.current.loadUserDailyStats>> = [];
    await act(async () => {
      stats = await result.current.loadUserDailyStats('userA', 3);
    });
    expect(stats.length).toBeGreaterThanOrEqual(1);
    expect(stats[0]?.events).toEqual({ play: 1 });
  });

  it('loadAllRawEvents aggregiert Events aller Nutzer', async () => {
    seedAnalytics();
    const { result } = renderHook(() => useAdminDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let events: Awaited<ReturnType<typeof result.current.loadAllRawEvents>> = [];
    await act(async () => {
      events = await result.current.loadAllRawEvents(TODAY);
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.e).toBe('play');
    expect(events[0]?.uid).toBe('userA');
  });
});
