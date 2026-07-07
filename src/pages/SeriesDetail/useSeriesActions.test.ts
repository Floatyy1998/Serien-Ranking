// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { SeriesEpisode } from './types';

// ── react-router-dom ──────────────────────────────────────────────────
const rr = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => rr.navigate }));

// ── firebase compat ───────────────────────────────────────────────────
const fb = vi.hoisted(() => {
  const onceMock = vi.fn(() => Promise.resolve({ val: () => null as unknown }));
  const setMock = vi.fn(() => Promise.resolve());
  const updateMock = vi.fn(() => Promise.resolve());
  const removeMock = vi.fn(() => Promise.resolve());
  const refMock = vi.fn((_p?: string) => ({
    once: onceMock,
    set: setMock,
    update: updateMock,
    remove: removeMock,
  }));
  const database = Object.assign(() => ({ ref: refMock }), {
    ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
  });
  return { onceMock, setMock, updateMock, removeMock, refMock, database };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// ── context + service mocks ───────────────────────────────────────────
const ctx = vi.hoisted(() => ({
  toggleHideSeries: vi.fn(async () => {}),
  refetchAfterAdd: vi.fn(async () => {}),
}));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({
    toggleHideSeries: ctx.toggleHideSeries,
    refetchAfterAdd: ctx.refetchAfterAdd,
  }),
}));

vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logSeriesAdded: vi.fn(async () => {}),
  logWatchlistAdded: vi.fn(async () => {}),
}));
vi.mock('../../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: vi.fn(async () => {}),
}));
vi.mock('../../services/firebase/analytics', () => ({
  trackEpisodeUnwatched: vi.fn(),
  trackEpisodeWatched: vi.fn(),
  trackSeriesAdded: vi.fn(),
  trackSeriesDeleted: vi.fn(),
}));
const backendFetch = vi.hoisted(() => vi.fn());
vi.mock('../../services/backendApi', () => ({ backendFetch }));
vi.mock('../../services/firebase/seriesVersionBump', () => ({ bumpSeriesVersion: vi.fn() }));
vi.mock('../../services/offline/queuedUpdate', () => ({
  applyUserUpdate: vi.fn(async () => ({ queued: false })),
}));
vi.mock('../../lib/toast', () => ({ showToast: vi.fn(), showUndoToast: vi.fn() }));
vi.mock('../../lib/haptics', () => ({ hapticSuccess: vi.fn() }));

import { logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { runEpisodeWatchFanout } from '../../lib/episode/episodeWatchFanout';
import {
  trackSeriesAdded,
  trackSeriesDeleted,
  trackEpisodeWatched,
} from '../../services/firebase/analytics';
import { bumpSeriesVersion } from '../../services/firebase/seriesVersionBump';
import { applyUserUpdate } from '../../services/offline/queuedUpdate';
import { showUndoToast } from '../../lib/toast';
import { hapticSuccess } from '../../lib/haptics';
import { useSeriesActions } from './useSeriesActions';

type Episode = SeriesEpisode;
const ep = (o: Partial<Episode> & { id: number }): Episode =>
  ({
    air_date: '2020-01-01',
    name: `Ep ${o.id}`,
    watched: false,
    episode_number: o.id,
    ...o,
  }) as Episode;

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 5,
    title: 'Alpha',
    name: 'Alpha',
    episodeRuntime: 30,
    genre: { genres: ['Drama'] },
    provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] },
    poster: { poster: '/p.jpg' },
    seasons: [],
    rating: {},
    ...o,
  }) as unknown as Series;

const withEpisodes = () =>
  makeSeries({
    seasons: [
      {
        seasonNumber: 0,
        episodes: [ep({ id: 11, watched: false }), ep({ id: 12, watched: false })],
      },
    ],
  });

beforeEach(() => {
  vi.clearAllMocks();
  fb.onceMock.mockResolvedValue({ val: () => null });
  vi.stubEnv('VITE_USER', 'flo');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('useSeriesActions', () => {
  it('handleAddSeries: posts to /add, logs, tracks, refetches and navigates', async () => {
    backendFetch.mockResolvedValue({ ok: true });
    const series = makeSeries({ id: 5 });
    const { result } = renderHook(() => useSeriesActions(series, 'u1', null));

    await act(async () => {
      await result.current.handleAddSeries();
    });

    expect(backendFetch).toHaveBeenCalledWith('/add', expect.objectContaining({ method: 'POST' }));
    expect(logSeriesAdded).toHaveBeenCalled();
    expect(trackSeriesAdded).toHaveBeenCalled();
    expect(ctx.refetchAfterAdd).toHaveBeenCalledWith(5);
    expect(rr.navigate).toHaveBeenCalledWith('/series/5', { replace: true });
    expect(result.current.isAdding).toBe(false);
  });

  it('handleAddSeries: shows a warning dialog when the series already exists', async () => {
    backendFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Serie bereits vorhanden' }),
    });
    const { result } = renderHook(() => useSeriesActions(makeSeries(), 'u1', null));

    await act(async () => {
      await result.current.handleAddSeries();
    });

    expect(result.current.dialog).toMatchObject({ open: true, type: 'warning' });
    expect(rr.navigate).not.toHaveBeenCalled();
  });

  it('handleDeleteSeries: opens a confirm dialog whose onConfirm removes both trees + bumps version', async () => {
    const { result } = renderHook(() => useSeriesActions(makeSeries({ id: 5 }), 'u1', null));

    act(() => {
      result.current.handleDeleteSeries();
    });
    expect(result.current.dialog.open).toBe(true);
    expect(typeof result.current.dialog.onConfirm).toBe('function');

    await act(async () => {
      await result.current.dialog.onConfirm?.();
    });

    expect(fb.removeMock).toHaveBeenCalledTimes(2); // series + seriesWatch
    expect(bumpSeriesVersion).toHaveBeenCalledWith('u1');
    expect(trackSeriesDeleted).toHaveBeenCalled();
  });

  it('handleWatchlistToggle: writes the toggled flag and logs the watchlist-add', async () => {
    const series = makeSeries({ id: 5, watchlist: false });
    const { result } = renderHook(() => useSeriesActions(series, 'u1', null));

    await act(async () => {
      await result.current.handleWatchlistToggle();
    });

    expect(fb.setMock).toHaveBeenCalledWith(true);
    const paths = fb.refMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain('users/u1/series/5/watchlist');
  });

  it('handleEpisodeQuickToggle: marks watched via a multi-path update map with a serienVersion bump', async () => {
    const { result } = renderHook(() => useSeriesActions(withEpisodes(), 'u1', null));

    await act(async () => {
      await result.current.handleEpisodeQuickToggle(0, 0);
    });

    expect(applyUserUpdate).toHaveBeenCalledTimes(1);
    const [uid, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(uid).toBe('u1');
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/11';
    expect(updates[`${base}/w`]).toBe(1);
    expect(updates[`${base}/c`]).toBe(1);
    expect(typeof updates[`${base}/l`]).toBe('number');
    expect(updates[`${base}/f`]).toBeDefined();
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(hapticSuccess).toHaveBeenCalledTimes(1);
    expect(showUndoToast).toHaveBeenCalledTimes(1);
  });

  it('handleEpisodeQuickToggle: onCommit fires analytics + the watch fanout', async () => {
    const { result } = renderHook(() => useSeriesActions(withEpisodes(), 'u1', null));
    await act(async () => {
      await result.current.handleEpisodeQuickToggle(0, 0);
    });
    const opts = vi.mocked(showUndoToast).mock.calls[0][1] as {
      onCommit?: () => Promise<void>;
    };
    await act(async () => {
      await opts.onCommit?.();
    });
    expect(trackEpisodeWatched).toHaveBeenCalledTimes(1);
    expect(runEpisodeWatchFanout).toHaveBeenCalledTimes(1);
    expect(vi.mocked(runEpisodeWatchFanout).mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      seriesId: 5,
      isRewatch: false,
    });
  });

  it('handleEpisodeQuickToggle: unmarks a watched episode by nulling the path', async () => {
    const series = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 11, watched: true, watchCount: 1 })] }],
    });
    const { result } = renderHook(() => useSeriesActions(series, 'u1', null));

    await act(async () => {
      await result.current.handleEpisodeQuickToggle(0, 0);
    });

    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/11';
    expect(updates[base]).toBeNull();
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(hapticSuccess).not.toHaveBeenCalled();
  });

  it('handleEpisodeUnwatch: nullt die Row via Offline-Queue + bumpt serienVersion (watchCount 1)', async () => {
    const series = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 11, watched: true, watchCount: 1 })] }],
    });
    fb.onceMock.mockResolvedValue({ val: () => ({ w: 1, c: 1 }) });
    const { result } = renderHook(() => useSeriesActions(series, 'u1', null));

    await act(async () => {
      await result.current.handleEpisodeUnwatch(series.seasons[0].episodes[0]);
    });

    // Läuft jetzt über applyUserUpdate (Offline-Queue), nicht mehr über raw
    // dbRef.remove() + separaten bumpSeriesVersion.
    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/11';
    expect(updates[base]).toBeNull();
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('handleEpisodeUnwatch: dekrementiert c auf den frisch gelesenen prevWatchCount (watchCount 3)', async () => {
    const series = makeSeries({
      // stale Prop absichtlich niedriger als DB, um den Stale-Clobber-Fix zu prüfen
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 11, watched: true, watchCount: 2 })] }],
    });
    fb.onceMock.mockResolvedValue({ val: () => ({ w: 1, c: 3, f: 100, l: 200 }) });
    const { result } = renderHook(() => useSeriesActions(series, 'u1', null));

    await act(async () => {
      await result.current.handleEpisodeUnwatch(series.seasons[0].episodes[0]);
    });

    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/11';
    // 3 (DB) - 1 = 2, NICHT 2 (stale Prop) - 1 = 1.
    expect(updates[`${base}/c`]).toBe(2);
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('handleEpisodeRewatch: writes an incremented watchCount map via applyUserUpdate', async () => {
    const series = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 11, watched: true, watchCount: 1 })] }],
    });
    fb.onceMock.mockResolvedValue({ val: () => ({ w: 1, c: 1, f: 100, l: 200 }) });
    const { result } = renderHook(() => useSeriesActions(series, 'u1', null));

    await act(async () => {
      await result.current.handleEpisodeRewatch(series.seasons[0].episodes[0]);
    });

    expect(applyUserUpdate).toHaveBeenCalledTimes(1);
    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/11';
    expect(updates[`${base}/c`]).toBe(2); // 1 + 1
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('handleStartRewatch: writes an active rewatch object', async () => {
    const series = makeSeries({
      id: 5,
      watchlist: true,
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 11, watched: true, watchCount: 1 })] }],
    });
    const { result } = renderHook(() => useSeriesActions(series, 'u1', null));

    await act(async () => {
      await result.current.handleStartRewatch();
    });

    expect(fb.setMock).toHaveBeenCalledWith(
      expect.objectContaining({ active: true, rewatchedEps: {} })
    );
    const paths = fb.refMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain('users/u1/series/5/rewatch');
  });

  it('handleStopRewatch: removes the rewatch node and bumps the version', async () => {
    const { result } = renderHook(() => useSeriesActions(makeSeries({ id: 5 }), 'u1', null));
    await act(async () => {
      await result.current.handleStopRewatch();
    });
    expect(fb.removeMock).toHaveBeenCalled();
    expect(bumpSeriesVersion).toHaveBeenCalledWith('u1');
  });

  it('all actions no-op without a series or userId', async () => {
    const { result } = renderHook(() => useSeriesActions(null, undefined, null));
    await act(async () => {
      await result.current.handleAddSeries();
      await result.current.handleWatchlistToggle();
      await result.current.handleStopRewatch();
    });
    expect(backendFetch).not.toHaveBeenCalled();
    expect(fb.removeMock).not.toHaveBeenCalled();
  });
});
