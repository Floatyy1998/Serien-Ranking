// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import { useCalendarData, toDateKey, formatDate, WEEKDAYS_SHORT } from './useCalendarData';

// ── firebase compat mock ──────────────────────────────────────────────
const fb = vi.hoisted(() => {
  const state = { snapshot: null as unknown };
  const setSpy = vi.fn(async () => {});
  const removeSpy = vi.fn(async () => {});
  const onceSpy = vi.fn(async () => ({ val: () => state.snapshot }));
  const refMock = vi.fn(() => ({ once: onceSpy, set: setSpy, remove: removeSpy }));
  return { state, setSpy, removeSpy, onceSpy, refMock };
});
vi.mock('firebase/compat/app', () => {
  const database = Object.assign(() => ({ ref: fb.refMock }), {
    ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
  });
  return { default: { database } };
});
vi.mock('firebase/compat/database', () => ({}));

// ── contexts / side-effects ───────────────────────────────────────────
const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  user: { uid: 'u1' } as { uid: string } | null,
}));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList, allSeriesList: ctx.seriesList }),
}));

const trackEpisodeWatched = vi.fn<(...a: unknown[]) => void>();
vi.mock('../../firebase/analytics', () => ({
  trackEpisodeWatched: (...a: unknown[]) => trackEpisodeWatched(...a),
}));
const runEpisodeWatchFanout = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: (...a: unknown[]) => runEpisodeWatchFanout(...a),
}));
const applyUserUpdate = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../lib/offline/queuedUpdate', () => ({
  applyUserUpdate: (...a: unknown[]) => applyUserUpdate(...a),
}));
const showToast = vi.fn<(...a: unknown[]) => void>();
const showUndoToast = vi.fn<(...a: unknown[]) => void>();
vi.mock('../../lib/toast', () => ({
  showToast: (...a: unknown[]) => showToast(...a),
  showUndoToast: (...a: unknown[]) => showUndoToast(...a),
}));

// ── fixtures ──────────────────────────────────────────────────────────
// System time pinned to Wed 01 Jul 2026 12:00 local. Episode air_date lands
// in that ISO week regardless of the host timezone.
const AIR = '2026-07-01';

const mkSeries = (o: Partial<Series> & { id: number }): Series =>
  ({
    title: `Series ${o.id}`,
    episodeRuntime: 40,
    provider: { provider: [] },
    genre: { genres: ['Drama'] },
    seasons: [
      {
        seasonNumber: 0,
        episodes: [{ id: o.id * 10, name: 'Folge', air_date: AIR, watched: false, runtime: 40 }],
      },
    ],
    ...o,
  }) as unknown as Series;

describe('useCalendarData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 12, 0, 0));
    ctx.user = { uid: 'u1' };
    ctx.seriesList = [mkSeries({ id: 1, watchlist: true })];
    fb.state.snapshot = null;
    fb.setSpy.mockClear();
    fb.removeSpy.mockClear();
    fb.refMock.mockClear();
    trackEpisodeWatched.mockClear();
    runEpisodeWatchFanout.mockClear();
    applyUserUpdate.mockClear();
    showToast.mockClear();
    showUndoToast.mockClear();
    localStorage.clear();
    // No TMDB key → backdrop effect is skipped.
    vi.stubEnv('VITE_API_TMDB', '');
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    cleanup();
  });

  it('groups the weekly schedule by series and exposes totals', () => {
    const { result } = renderHook(() => useCalendarData());
    expect(result.current.totalEpisodes).toBe(1);
    expect(result.current.watchedCount).toBe(0);

    const groups = Array.from(result.current.groupedSchedule.values()).flat();
    const group = groups.find((g) => g.seriesId === 1);
    expect(group).toBeDefined();
    expect(group?.episodes.length).toBe(1);
    expect(typeof result.current.kwNumber).toBe('number');
    expect(result.current.backdrops).toEqual({});
  });

  it('counts watched episodes', () => {
    ctx.seriesList = [
      mkSeries({
        id: 2,
        watchlist: true,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [{ id: 20, name: 'F', air_date: AIR, watched: true, runtime: 40 }],
          },
        ] as Series['seasons'],
      }),
    ];
    const { result } = renderHook(() => useCalendarData());
    expect(result.current.watchedCount).toBe(1);
  });

  it('watchlistOnly filter persists to localStorage and prunes non-watchlist series', () => {
    ctx.seriesList = [mkSeries({ id: 1, watchlist: true }), mkSeries({ id: 2, watchlist: false })];
    const { result } = renderHook(() => useCalendarData());
    expect(result.current.totalEpisodes).toBe(2);

    act(() => result.current.toggleWatchlistOnly(true));
    expect(result.current.watchlistOnly).toBe(true);
    expect(localStorage.getItem('calendarWatchlistOnly')).toBe('true');
    expect(result.current.totalEpisodes).toBe(1);
  });

  it('reads the initial watchlistOnly flag from localStorage', () => {
    localStorage.setItem('calendarWatchlistOnly', 'true');
    const { result } = renderHook(() => useCalendarData());
    expect(result.current.watchlistOnly).toBe(true);
  });

  it('navigates weeks and resets to the current week', () => {
    const { result } = renderHook(() => useCalendarData());
    expect(result.current.weekOffset).toBe(0);
    act(() => result.current.goToNextWeek());
    expect(result.current.weekOffset).toBe(1);
    act(() => result.current.goToPrevWeek());
    act(() => result.current.goToPrevWeek());
    expect(result.current.weekOffset).toBe(-1);
    act(() => result.current.goToCurrentWeek());
    expect(result.current.weekOffset).toBe(0);
  });

  it('toggles episode group expansion', () => {
    const { result } = renderHook(() => useCalendarData());
    act(() => result.current.toggleGroup('2026-07-01-1'));
    expect(result.current.expandedGroups.has('2026-07-01-1')).toBe(true);
    act(() => result.current.toggleGroup('2026-07-01-1'));
    expect(result.current.expandedGroups.has('2026-07-01-1')).toBe(false);
  });

  it('handleMarkWatched writes the mark with a serienVersion bump and shows an undo toast', async () => {
    const { result } = renderHook(() => useCalendarData());
    await act(async () => {
      await result.current.handleMarkWatched(1, 0, 0);
    });
    expect(applyUserUpdate).toHaveBeenCalled();
    const updates = applyUserUpdate.mock.calls[0][1] as Record<string, unknown>;
    const base = 'users/u1/seriesWatch/1/seasons/0/eps/10';
    expect(updates[`${base}/w`]).toBe(1);
    expect(updates[`${base}/c`]).toBe(1);
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(showUndoToast).toHaveBeenCalled();
  });

  it('handleMarkWatched errors when the episode id is missing', async () => {
    ctx.seriesList = [
      mkSeries({
        id: 3,
        watchlist: true,
        seasons: [
          { seasonNumber: 0, episodes: [{ name: 'x', air_date: AIR }] },
        ] as unknown as Series['seasons'],
      }),
    ];
    const { result } = renderHook(() => useCalendarData());
    await act(async () => {
      await result.current.handleMarkWatched(3, 0, 0);
    });
    expect(showToast).toHaveBeenCalledWith('Episode-ID fehlt', 2000, 'error');
    expect(applyUserUpdate).not.toHaveBeenCalled();
  });

  it('handleMarkWatched is a no-op without a signed-in user', async () => {
    ctx.user = null;
    const { result } = renderHook(() => useCalendarData());
    await act(async () => {
      await result.current.handleMarkWatched(1, 0, 0);
    });
    expect(applyUserUpdate).not.toHaveBeenCalled();
    expect(showUndoToast).not.toHaveBeenCalled();
  });
});

describe('calendar utilities', () => {
  it('toDateKey formats YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('formatDate returns a localized string and WEEKDAYS_SHORT has 7 entries', () => {
    expect(typeof formatDate(new Date(2026, 6, 1))).toBe('string');
    expect(WEEKDAYS_SHORT).toHaveLength(7);
  });
});
