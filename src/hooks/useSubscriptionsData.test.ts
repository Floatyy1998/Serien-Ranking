// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubscriptionsData } from './useSubscriptionsData';
import { getYearlyActivity } from '../services/watchActivity/shared';
import { invalidateActiveSubscriptions } from './useActiveSubscriptions';
import type { Series } from '../types/Series';
import type { ActivityEvent } from '../types/WatchActivity';

const authState = vi.hoisted(() => ({ uid: 'u1' as string | undefined }));
const seriesState = vi.hoisted(() => ({
  seriesList: [] as unknown[],
  allSeriesList: [] as unknown[],
  seriesWithNewSeasons: [] as unknown[],
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.uid ? { uid: authState.uid } : null }),
}));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => seriesState,
}));

vi.mock('../services/watchActivity/shared', () => ({
  getYearlyActivity: vi.fn(),
}));

vi.mock('./useActiveSubscriptions', () => ({
  invalidateActiveSubscriptions: vi.fn(),
}));

// Firebase-Mock: once('value') für die subscriptions-Node, set() für persist.
const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const setMock = vi.fn((_p: string, _v: unknown) => {});
  const makeSnap = (val: unknown) => ({ val: () => val });
  const refMock = vi.fn((path: string) => ({
    once: vi.fn(async () => makeSnap(store[path] ?? null)),
    set: vi.fn(async (v: unknown) => {
      store[path] = v;
      setMock(path, v);
    }),
  }));
  const database = () => ({ ref: refMock });
  const reset = () => {
    for (const k of Object.keys(store)) delete store[k];
    setMock.mockClear();
    refMock.mockClear();
  };
  return { store, setMock, refMock, database, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const mockedGetYearlyActivity = vi.mocked(getYearlyActivity);
const mockedInvalidate = vi.mocked(invalidateActiveSubscriptions);
const subsPath = 'users/u1/subscriptions';
const YEAR = new Date().getFullYear();

function episodeEvent(providers: string[], daysAgo: number): ActivityEvent {
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    type: 'episode_watch',
    timestamp: ts,
    month: 1,
    dayOfWeek: 1,
    hour: 12,
    seriesId: 1,
    seriesTitle: 'Show',
    seasonNumber: 1,
    episodeNumber: 1,
    isRewatch: false,
    providers,
  } as ActivityEvent;
}

function makeSeries(id: number, providerNames: string[], watchlist: boolean): Series {
  return {
    id,
    title: `Series ${id}`,
    watchlist,
    provider: { provider: providerNames.map((name, i) => ({ id: i, logo: '', name })) },
  } as unknown as Series;
}

function setActivity(current: ActivityEvent[]): void {
  mockedGetYearlyActivity.mockImplementation((_uid: string, year: number) =>
    Promise.resolve(year === YEAR ? current : [])
  );
}

beforeEach(() => {
  authState.uid = 'u1';
  seriesState.seriesList = [];
  seriesState.allSeriesList = [];
  seriesState.seriesWithNewSeasons = [];
  fb.reset();
  mockedGetYearlyActivity.mockReset();
  mockedInvalidate.mockClear();
  setActivity([]);
});

afterEach(() => {
  cleanup();
});

describe('useSubscriptionsData', () => {
  it('meldet loading=false ohne User', () => {
    authState.uid = undefined;
    const { result } = renderHook(() => useSubscriptionsData());
    expect(result.current.loading).toBe(false);
  });

  it('lädt die Config und berechnet aktive Insights + monatliche Kosten', async () => {
    fb.store[subsPath] = { providers: { Netflix: { active: true, monthlyPrice: 10 } } };
    setActivity([episodeEvent(['Netflix'], 1)]);

    const { result } = renderHook(() => useSubscriptionsData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    const netflix = result.current.insights.find((i) => i.name === 'Netflix');
    expect(netflix?.active).toBe(true);
    expect(netflix?.monthlyPrice).toBe(10);
    expect(netflix?.recentCount).toBeGreaterThan(0);
    expect(netflix?.isUnused).toBe(false);
    expect(result.current.activeInsights.map((i) => i.name)).toContain('Netflix');
    expect(result.current.totalMonthlySpend).toBe(10);
  });

  it('markiert ein aktives, aber ungenutztes Abo als unused und zählt die Kosten als wasted', async () => {
    fb.store[subsPath] = {
      providers: { Netflix: { active: true, monthlyPrice: 12, cancelIfUnused: true } },
    };
    setActivity([]); // keine Watch-Events → kein recentCount

    const { result } = renderHook(() => useSubscriptionsData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    const netflix = result.current.insights.find((i) => i.name === 'Netflix');
    expect(netflix?.isUnused).toBe(true);
    expect(result.current.unusedInsights.map((i) => i.name)).toContain('Netflix');
    expect(result.current.wastedMonthlySpend).toBe(12);
  });

  it('berechnet watchlistGaps für Serien ohne aktives Abo', async () => {
    fb.store[subsPath] = { providers: { Netflix: { active: true } } };
    seriesState.seriesList = [makeSeries(1, ['Amazon Prime Video'], true)];
    seriesState.allSeriesList = seriesState.seriesList;

    const { result } = renderHook(() => useSubscriptionsData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.watchlistGaps).toHaveLength(1);
    expect(result.current.watchlistGaps[0].series.id).toBe(1);
  });

  it('updateProvider schreibt nach Firebase und invalidiert den Cache', async () => {
    fb.store[subsPath] = { providers: {} };
    const { result } = renderHook(() => useSubscriptionsData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let p: Promise<void> = Promise.resolve();
    act(() => {
      p = result.current.updateProvider('Netflix', { active: true, monthlyPrice: 8 });
    });
    await p;

    expect(fb.setMock).toHaveBeenCalledTimes(1);
    const [, written] = fb.setMock.mock.calls[0];
    expect((written as { providers: Record<string, unknown> }).providers.Netflix).toEqual({
      active: true,
      monthlyPrice: 8,
    });
    expect(mockedInvalidate).toHaveBeenCalledWith('u1');
  });

  it('setUnusedThreshold clamped auf 7..365', async () => {
    fb.store[subsPath] = { providers: {} };
    const { result } = renderHook(() => useSubscriptionsData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let p: Promise<void> = Promise.resolve();
    act(() => {
      p = result.current.setUnusedThreshold(1000);
    });
    await p;

    expect(result.current.unusedThresholdDays).toBe(365);
  });

  it('setSeriesOverride speichert und entfernt einen Serien-Override', async () => {
    fb.store[subsPath] = { providers: {} };
    const { result } = renderHook(() => useSubscriptionsData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let p: Promise<void> = Promise.resolve();
    act(() => {
      p = result.current.setSeriesOverride(42, 'HBO Max');
    });
    await p;
    expect(result.current.seriesOverrides['42']).toBe('HBO Max');

    act(() => {
      p = result.current.setSeriesOverride(42, null);
    });
    await p;
    expect(result.current.seriesOverrides['42']).toBeUndefined();
  });
});
