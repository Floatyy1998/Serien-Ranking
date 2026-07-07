// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { WatchedEpisode } from './EpisodeDataManager';
import { useRecentlyWatched } from './useRecentlyWatched';

// ── firebase compat mock ──────────────────────────────────────────────
const fb = vi.hoisted(() => {
  const setSpy = vi.fn(async () => {});
  const updateSpy = vi.fn(async () => {});
  const refMock = vi.fn(() => ({ set: setSpy, update: updateSpy }));
  return { setSpy, updateSpy, refMock };
});
vi.mock('firebase/compat/app', () => {
  const database = Object.assign(() => ({ ref: fb.refMock }), {
    ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
  });
  return { default: { database } };
});
vi.mock('firebase/compat/database', () => ({}));

// ── contexts / side-effects ───────────────────────────────────────────
const router = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => router.navigate }));

const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  user: { uid: 'u1' } as { uid: string } | null,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.seriesList, seriesList: ctx.seriesList }),
}));

const runEpisodeWatchFanout = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: (...a: unknown[]) => runEpisodeWatchFanout(...a),
}));

// ── fixtures ──────────────────────────────────────────────────────────
const nowISO = new Date().toISOString();
const mkSeries = (): Series =>
  ({
    id: 1,
    title: 'Alpha',
    poster: { poster: '/p.jpg' },
    genre: { genres: ['Drama'] },
    seasons: [
      {
        seasonNumber: 0,
        episodes: [
          {
            id: 10,
            name: 'Pilot',
            episode_number: 1,
            air_date: '2020-01-01',
            watched: true,
            watchCount: 1,
            firstWatchedAt: nowISO,
            lastWatchedAt: nowISO,
          },
        ],
      },
    ],
  }) as unknown as Series;

const watchedEp = (o: Partial<WatchedEpisode> = {}): WatchedEpisode =>
  ({
    seriesId: 1,
    seriesName: 'Alpha',
    seriesPoster: '/p.jpg',
    seasonIndex: 0,
    episodeIndex: 0,
    episodeName: 'Pilot',
    episodeNumber: 1,
    seasonNumber: 1,
    firstWatchedAt: new Date(),
    watchCount: 1,
    daysAgo: 0,
    dateSource: 'firstWatched',
    ...o,
  }) as WatchedEpisode;

describe('useRecentlyWatched', () => {
  beforeEach(() => {
    ctx.seriesList = [mkSeries()];
    ctx.user = { uid: 'u1' };
    router.navigate.mockReset();
    fb.setSpy.mockClear();
    fb.updateSpy.mockClear();
    fb.refMock.mockClear();
    runEpisodeWatchFanout.mockClear();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('loads recently-watched episodes into date groups', async () => {
    const { result } = renderHook(() => useRecentlyWatched());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalEpisodes).toBe(1);
    expect(result.current.daysToShow).toBe(30);
  });

  it('changes the time range', async () => {
    const { result } = renderHook(() => useRecentlyWatched());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleTimeRangeChange(7));
    expect(result.current.daysToShow).toBe(7);
  });

  it('debounced search with no match empties the loaded groups', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRecentlyWatched());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.totalEpisodes).toBe(1);

    act(() => result.current.setSearchQuery('zzz-nomatch'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.totalEpisodes).toBe(0);
  });

  it('rewatch writes new counters and fans out (pet-only, rewatch flag)', async () => {
    const { result } = renderHook(() => useRecentlyWatched());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleRewatchEpisode(watchedEp({ watchCount: 2 }));
    });
    // Atomarer Multi-Path-Update inkl. serienVersion-Bump (watchCount + 1).
    expect(fb.updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        'users/u1/seriesWatch/1/seasons/0/eps/10/c': 3,
        'users/u1/meta/serienVersion': { '.sv': 'timestamp' },
      })
    );
    expect(runEpisodeWatchFanout).toHaveBeenCalledWith(
      expect.objectContaining({ isRewatch: true, badgeCounters: false, wrappedEvent: false })
    );
    expect(result.current.completingEpisodes.has('1-0-0')).toBe(true);
  });

  it('rewatch is a no-op without a user', async () => {
    ctx.user = null;
    const { result } = renderHook(() => useRecentlyWatched());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.handleRewatchEpisode(watchedEp());
    });
    expect(fb.setSpy).not.toHaveBeenCalled();
    expect(runEpisodeWatchFanout).not.toHaveBeenCalled();
  });

  it('toggles series expansion state per date', () => {
    const { result } = renderHook(() => useRecentlyWatched());
    expect(result.current.isSeriesExpanded('2026-07-01', 1)).toBe(false);
    act(() => result.current.toggleSeriesExpanded('2026-07-01', 1));
    expect(result.current.isSeriesExpanded('2026-07-01', 1)).toBe(true);
    act(() => result.current.toggleSeriesExpanded('2026-07-01', 1));
    expect(result.current.isSeriesExpanded('2026-07-01', 1)).toBe(false);
  });

  it('groups episodes by series id', () => {
    const { result } = renderHook(() => useRecentlyWatched());
    const grouped = result.current.groupEpisodesBySeries([
      watchedEp({ seriesId: 1 }),
      watchedEp({ seriesId: 1 }),
      watchedEp({ seriesId: 2 }),
    ]);
    expect(grouped[1]).toHaveLength(2);
    expect(grouped[2]).toHaveLength(1);
  });

  it('produces relative date labels', () => {
    const { result } = renderHook(() => useRecentlyWatched());
    expect(result.current.getRelativeDateLabel(watchedEp({ daysAgo: 0 }))).toBe('Heute');
    expect(result.current.getRelativeDateLabel(watchedEp({ daysAgo: 1 }))).toBe('Gestern');
    expect(result.current.getRelativeDateLabel(watchedEp({ daysAgo: 2 }))).toBe('Vorgestern');
    expect(result.current.getRelativeDateLabel(watchedEp({ daysAgo: 5 }))).toBe('Vor 5 Tagen');
    expect(result.current.getRelativeDateLabel(watchedEp({ daysAgo: 20 }))).toContain('Wochen');
    expect(result.current.getRelativeDateLabel(watchedEp({ daysAgo: 90 }))).toContain('Monaten');
  });

  it('navigation helpers push the expected routes', () => {
    const { result } = renderHook(() => useRecentlyWatched());
    act(() => result.current.navigateToSeries(1));
    expect(router.navigate).toHaveBeenCalledWith('/series/1');
    act(() => result.current.navigateToEpisode(1, 2, 3));
    expect(router.navigate).toHaveBeenCalledWith('/episode/1/s/2/e/3');
    act(() => result.current.navigateToEpisodeDiscussion(1, 2, 3));
    expect(router.navigate).toHaveBeenCalledWith('/episode/1/s/2/e/3?tab=discussions');
  });
});
