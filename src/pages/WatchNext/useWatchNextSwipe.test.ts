// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PanInfo } from 'framer-motion';
import type { Series } from '../../types/Series';
import type { NextEpisode } from '../../hooks/useWatchNextEpisodes';
import { useWatchNextSwipe } from './useWatchNextSwipe';

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

// ── side-effect mocks ─────────────────────────────────────────────────
const trackEpisodeWatched = vi.fn<(...a: unknown[]) => void>();
vi.mock('../../services/firebase/analytics', () => ({
  trackEpisodeWatched: (...a: unknown[]) => trackEpisodeWatched(...a),
}));

const runEpisodeWatchFanout = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: (...a: unknown[]) => runEpisodeWatchFanout(...a),
}));

const applyUserUpdate = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../services/offline/queuedUpdate', () => ({
  applyUserUpdate: (...a: unknown[]) => applyUserUpdate(...a),
}));

const showToast = vi.fn();
const undoOpts = vi.hoisted(() => ({
  current: null as { onUndo: () => Promise<void>; onCommit: () => Promise<void> } | null,
}));
const showUndoToast = vi.fn((_msg: string, opts: unknown) => {
  undoOpts.current = opts as { onUndo: () => Promise<void>; onCommit: () => Promise<void> };
});
vi.mock('../../lib/toast', () => ({
  showToast: (...a: unknown[]) => showToast(...a),
  showUndoToast: (msg: string, opts: unknown) => showUndoToast(msg, opts),
}));

const hapticSuccess = vi.fn();
vi.mock('../../lib/haptics', () => ({ hapticSuccess: () => hapticSuccess() }));

// ── fixtures ──────────────────────────────────────────────────────────
const series = {
  id: 1,
  title: 'Bravo',
  name: 'Bravo',
  episodeRuntime: 40,
  genre: { genres: ['Drama'] },
  provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] },
  seasons: [{ seasonNumber: 0, episodes: [{ id: 101, name: 'Pilot' }, { id: 102 }] }],
} as unknown as Series;

const nextEp = (o: Partial<NextEpisode> = {}): NextEpisode =>
  ({
    seriesId: 1,
    seriesTitle: 'Bravo',
    seasonIndex: 0,
    episodeIndex: 1,
    isRewatch: false,
    runtime: 40,
    airDate: '2026-01-01',
    ...o,
  }) as NextEpisode;

const pan = (offsetX: number, velocityX: number): PanInfo =>
  ({
    offset: { x: offsetX, y: 0 },
    velocity: { x: velocityX, y: 0 },
    point: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
  }) as PanInfo;

const dragEvent = () => ({ stopPropagation: vi.fn() }) as unknown as MouseEvent;

function render(user: { uid: string } | null = { uid: 'u1' }) {
  return renderHook(() => useWatchNextSwipe({ user, seriesList: [series] }));
}

describe('useWatchNextSwipe', () => {
  beforeEach(() => {
    fb.state.snapshot = null;
    fb.setSpy.mockClear();
    fb.removeSpy.mockClear();
    fb.onceSpy.mockClear();
    fb.refMock.mockClear();
    trackEpisodeWatched.mockClear();
    runEpisodeWatchFanout.mockClear();
    applyUserUpdate.mockClear();
    showToast.mockClear();
    showUndoToast.mockClear();
    hapticSuccess.mockClear();
    undoOpts.current = null;
  });
  afterEach(() => cleanup());

  it('builds a stable episode key', () => {
    const { result } = render();
    expect(result.current.getEpisodeKey(nextEp())).toBe('1-0-1');
  });

  it('tracks swipe start and drag offset', () => {
    const { result } = render();
    act(() => result.current.handleSwipeDragStart('1-0-1'));
    expect(result.current.swipingEpisodes.has('1-0-1')).toBe(true);
    act(() => result.current.handleSwipeDrag('1-0-1', pan(40, 0)));
    expect(result.current.dragOffsets['1-0-1']).toBe(40);
  });

  it('does NOT complete below the swipe threshold', async () => {
    const { result } = render();
    await act(async () => {
      result.current.handleSwipeDragEnd(nextEp(), '1-0-1', dragEvent(), pan(50, 10));
    });
    expect(applyUserUpdate).not.toHaveBeenCalled();
    // drag state cleared
    expect(result.current.swipingEpisodes.has('1-0-1')).toBe(false);
    expect(result.current.dragOffsets['1-0-1']).toBeUndefined();
  });

  it('completes above the threshold (distance + velocity) and persists the mark', async () => {
    const { result } = render();
    await act(async () => {
      result.current.handleSwipeDragEnd(nextEp(), '1-0-1', dragEvent(), pan(150, 80));
    });
    await waitFor(() => expect(applyUserUpdate).toHaveBeenCalled());
    const updates = applyUserUpdate.mock.calls[0][1] as Record<string, unknown>;
    const epPath = 'users/u1/seriesWatch/1/seasons/0/eps/102';
    expect(updates[`${epPath}/w`]).toBe(1);
    expect(updates[`${epPath}/c`]).toBe(1);
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(hapticSuccess).toHaveBeenCalled();
    expect(result.current.swipeDirections['1-0-1']).toBe('right');
  });

  it('runs analytics + fanout only after the undo window commits', async () => {
    const { result } = render();
    await act(async () => {
      await result.current.handleEpisodeComplete(nextEp(), 'left');
    });
    await waitFor(() => expect(undoOpts.current).not.toBeNull());
    // Side effects deferred to onCommit
    expect(trackEpisodeWatched).not.toHaveBeenCalled();
    expect(runEpisodeWatchFanout).not.toHaveBeenCalled();

    await act(async () => {
      await undoOpts.current?.onCommit();
    });
    expect(trackEpisodeWatched).toHaveBeenCalled();
    expect(runEpisodeWatchFanout).toHaveBeenCalledWith(
      expect.objectContaining({ seriesId: 1, seasonNumber: 1, episodeNumber: 2, isRewatch: false })
    );
  });

  it('onUndo removes a freshly-created entry (no prior watch state)', async () => {
    const { result } = render();
    await act(async () => {
      await result.current.handleEpisodeComplete(nextEp(), 'right');
    });
    await waitFor(() => expect(undoOpts.current).not.toBeNull());
    await act(async () => {
      await undoOpts.current?.onUndo();
    });
    expect(fb.removeSpy).toHaveBeenCalled();
    // hidden set reverted for the episode
    expect(result.current.hiddenEpisodes.has('1-0-1')).toBe(false);
  });

  it('onUndo restores prior counters when the episode already had watch state', async () => {
    fb.state.snapshot = { w: 1, c: 2, f: 111, l: 222 };
    const { result } = render();
    await act(async () => {
      await result.current.handleEpisodeComplete(nextEp({ isRewatch: true }), 'right');
    });
    await waitFor(() => expect(undoOpts.current).not.toBeNull());
    await act(async () => {
      await undoOpts.current?.onUndo();
    });
    expect(fb.setSpy).toHaveBeenCalledWith({ w: 1, c: 2, f: 111, l: 222 });
  });

  it('hides the episode after the exit animation but skips persistence without a user', async () => {
    vi.useFakeTimers();
    const { result } = render(null);
    await act(async () => {
      await result.current.handleEpisodeComplete(nextEp(), 'right');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.hiddenEpisodes.has('1-0-1')).toBe(true);
    expect(applyUserUpdate).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('surfaces an error toast when the episode id is missing', async () => {
    const { result } = render();
    await act(async () => {
      await result.current.handleEpisodeComplete(nextEp({ episodeIndex: 9 }), 'right');
    });
    expect(showToast).toHaveBeenCalledWith('Episode-ID fehlt', 2000, 'error');
    expect(applyUserUpdate).not.toHaveBeenCalled();
  });

  it('cleanup clears swipe + drag state for a key', () => {
    const { result } = render();
    act(() => {
      result.current.handleSwipeDragStart('1-0-1');
      result.current.handleSwipeDrag('1-0-1', pan(30, 0));
    });
    act(() => result.current.handleSwipeCleanup('1-0-1'));
    expect(result.current.swipingEpisodes.has('1-0-1')).toBe(false);
    expect(result.current.dragOffsets['1-0-1']).toBeUndefined();
  });
});
