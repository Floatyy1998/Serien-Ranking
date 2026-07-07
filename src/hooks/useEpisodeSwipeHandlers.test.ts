// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEpisodeSwipeHandlers } from './useEpisodeSwipeHandlers';

// --- Firebase compat (once fuer Snapshot, update fuer Undo/Revert) ---
const fb = vi.hoisted(() => {
  const state: { snapVal: unknown } = { snapVal: { w: 0, c: 0, f: 0, l: 0 } };
  const onceMock = vi.fn(async () => ({ val: () => state.snapVal }));
  const updateMock = vi.fn(async () => {});
  const refMock = vi.fn(() => ({ once: onceMock, update: updateMock }));
  const databaseMock = vi.fn(() => ({ ref: refMock }));
  return { state, onceMock, updateMock, refMock, databaseMock };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.databaseMock } }));
vi.mock('firebase/compat/database', () => ({}));

// --- Auth (konfigurierbar) ---
const auth = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: auth.user }) }));

// --- Write-/Side-effect-Mocks ---
const mocks = vi.hoisted(() => ({
  applyUserUpdate: vi.fn(async () => {}),
  buildEpisodeWatchedUpdates: vi.fn(() => ({ 'some/path/w': 1 })),
  buildEpisodeUnwatchUpdates: vi.fn(() => ({ 'some/path/w': 0 })),
  trackEpisodeWatched: vi.fn(),
  runEpisodeWatchFanout: vi.fn(async () => {}),
  hapticSuccess: vi.fn(),
  showToast: vi.fn(),
  showUndoToast: vi.fn(),
  shouldTriggerQuickRate: vi.fn(() => false),
}));

vi.mock('../services/offline/queuedUpdate', () => ({ applyUserUpdate: mocks.applyUserUpdate }));
vi.mock('../lib/compactWatch', () => ({
  buildEpisodeWatchedUpdates: mocks.buildEpisodeWatchedUpdates,
  buildEpisodeUnwatchUpdates: mocks.buildEpisodeUnwatchUpdates,
}));
vi.mock('../services/firebase/analytics', () => ({
  trackEpisodeWatched: mocks.trackEpisodeWatched,
}));
vi.mock('../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: mocks.runEpisodeWatchFanout,
}));
vi.mock('../lib/episode/seriesMetrics', () => ({ DEFAULT_EPISODE_RUNTIME_MINUTES: 45 }));
vi.mock('../lib/haptics', () => ({ hapticSuccess: mocks.hapticSuccess }));
vi.mock('../lib/toast', () => ({ showToast: mocks.showToast, showUndoToast: mocks.showUndoToast }));

// --- Untergeordnete Hooks (keine echten Firebase-/Worker-Effekte) ---
vi.mock('../contexts/SeriesListContext', () => ({ useSeriesList: () => ({ seriesList: [] }) }));
vi.mock('./useContinueWatching', () => ({ useContinueWatching: () => [] }));
vi.mock('./useWebWorkerTodayEpisodes', () => ({ useWebWorkerTodayEpisodes: () => [] }));
vi.mock('./useQuickSeasonRating', () => ({
  shouldTriggerQuickRate: mocks.shouldTriggerQuickRate,
  useQuickSeasonRating: () => ({
    quickRatingOpen: false,
    quickRatingSeries: null,
    quickRatingSeasonNumber: 0,
    showQuickRating: vi.fn(),
    closeQuickRating: vi.fn(),
    saveQuickRating: vi.fn(async () => {}),
  }),
}));

type SwipeApi = ReturnType<typeof useEpisodeSwipeHandlers>;
type ContinueItem = Parameters<SwipeApi['handleContinueEpisodeComplete']>[0];
type TodayItem = Parameters<SwipeApi['handleEpisodeComplete']>[0];
type UndoOptions = { onUndo: () => Promise<void>; onCommit: () => Promise<void> };

function makeContinueItem(): ContinueItem {
  return {
    type: 'series',
    id: 555,
    title: 'Dark',
    poster: 'p',
    progress: 50,
    nextEpisode: {
      seasonNumber: 2,
      episodeNumber: 3,
      name: 'Ep',
      seasonIndex: 1,
      episodeIndex: 2,
      episodeId: 900,
    },
    airDate: '2024-01-01',
    lastWatchedAt: '2024-01-01',
    genre: { genres: ['Drama'] },
    provider: { provider: [{ name: 'Netflix' }] },
    episodeRuntime: 50,
    seasons: [],
  } as unknown as ContinueItem;
}

function makeTodayItem(): TodayItem {
  return {
    seriesId: '777',
    seriesTitle: 'Today Show',
    poster: 'p',
    seasonNumber: 1,
    episodeNumber: 4,
    seasonIndex: 0,
    episodeIndex: 3,
    episodeId: '1200',
    episodeName: 'Ep',
    watched: false,
    runtime: 30,
    seriesGenre: ['Comedy'],
    seriesProviders: ['Prime'],
  } as unknown as TodayItem;
}

beforeEach(() => {
  vi.useFakeTimers();
  auth.user = { uid: 'u1' };
  fb.state.snapVal = { w: 0, c: 0, f: 0, l: 0 };
  Object.values(mocks).forEach((m) => m.mockClear());
  fb.onceMock.mockClear();
  fb.updateMock.mockClear();
  mocks.shouldTriggerQuickRate.mockReturnValue(false);
  mocks.buildEpisodeWatchedUpdates.mockReturnValue({ 'some/path/w': 1 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useEpisodeSwipeHandlers – handleContinueEpisodeComplete', () => {
  it('marks the episode watched via the offline queue and fires an undo toast', async () => {
    fb.state.snapVal = { w: 0, c: 2, f: 0, l: 0 }; // previousCount = 2 -> Rewatch
    const { result } = renderHook(() => useEpisodeSwipeHandlers());

    await act(async () => {
      await result.current.handleContinueEpisodeComplete(makeContinueItem(), 'left');
    });

    // Snapshot gelesen + build mit previousCount+1 = 3, hadFirstWatched=false -> resetFirst=true
    expect(fb.onceMock).toHaveBeenCalled();
    expect(mocks.buildEpisodeWatchedUpdates).toHaveBeenCalledWith(
      'u1',
      555,
      1,
      900,
      3,
      expect.any(String),
      true
    );
    expect(mocks.applyUserUpdate).toHaveBeenCalledWith(
      'u1',
      { 'some/path/w': 1 },
      expect.stringContaining('Dark')
    );
    expect(mocks.hapticSuccess).toHaveBeenCalled();
    expect(mocks.showUndoToast).toHaveBeenCalledWith(
      expect.stringContaining('Dark S2E3'),
      expect.objectContaining({ onUndo: expect.any(Function), onCommit: expect.any(Function) })
    );
    // Swipe-Richtung wird fuer die Exit-Animation gemerkt
    expect(result.current.swipeDirections['555-2-3']).toBe('left');
  });

  it('onCommit tracks the watch and runs the fanout (rewatch, no wrapped event)', async () => {
    fb.state.snapVal = { w: 0, c: 2, f: 0, l: 0 };
    const { result } = renderHook(() => useEpisodeSwipeHandlers());
    await act(async () => {
      await result.current.handleContinueEpisodeComplete(makeContinueItem());
    });

    const opts = mocks.showUndoToast.mock.calls[0]?.[1] as UndoOptions;
    await act(async () => {
      await opts.onCommit();
    });

    expect(mocks.trackEpisodeWatched).toHaveBeenCalledWith(
      'Dark',
      2,
      3,
      expect.objectContaining({ isRewatch: true, source: 'continue_watching_swipe' })
    );
    expect(mocks.runEpisodeWatchFanout).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', seriesId: 555, isRewatch: true, wrappedEvent: false })
    );
  });

  it('onUndo reverts the write through the update map', async () => {
    const { result } = renderHook(() => useEpisodeSwipeHandlers());
    await act(async () => {
      await result.current.handleContinueEpisodeComplete(makeContinueItem());
    });
    const opts = mocks.showUndoToast.mock.calls[0]?.[1] as UndoOptions;
    await act(async () => {
      await opts.onUndo();
    });
    expect(mocks.buildEpisodeUnwatchUpdates).toHaveBeenCalled();
    expect(fb.updateMock).toHaveBeenCalledWith({ 'some/path/w': 0 });
  });

  it('does not write to Firebase when there is no user', async () => {
    auth.user = null;
    const { result } = renderHook(() => useEpisodeSwipeHandlers());
    await act(async () => {
      await result.current.handleContinueEpisodeComplete(makeContinueItem());
    });
    expect(mocks.applyUserUpdate).not.toHaveBeenCalled();
    expect(mocks.showUndoToast).not.toHaveBeenCalled();
    // UI-State (Completing) wurde trotzdem gesetzt
    expect(result.current.completingContinueEpisodes.has('555-2-3')).toBe(true);
  });

  it('shows an error toast when the write fails', async () => {
    mocks.applyUserUpdate.mockRejectedValueOnce(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useEpisodeSwipeHandlers());
    await act(async () => {
      await result.current.handleContinueEpisodeComplete(makeContinueItem());
    });
    expect(mocks.showToast).toHaveBeenCalledWith('Fehler beim Speichern', 3000, 'error');
  });
});

describe('useEpisodeSwipeHandlers – handleEpisodeComplete (today)', () => {
  it('marks a first watch and flags a wrapped event when previousCount is 0', async () => {
    fb.state.snapVal = { w: 0, c: 0, f: 0, l: 0 };
    const { result } = renderHook(() => useEpisodeSwipeHandlers());
    await act(async () => {
      await result.current.handleEpisodeComplete(makeTodayItem(), 'right');
    });

    expect(mocks.hapticSuccess).toHaveBeenCalled();
    expect(mocks.applyUserUpdate).toHaveBeenCalledWith(
      'u1',
      { 'some/path/w': 1 },
      expect.stringContaining('Today Show')
    );

    const opts = mocks.showUndoToast.mock.calls[0]?.[1] as UndoOptions;
    await act(async () => {
      await opts.onCommit();
    });
    expect(mocks.runEpisodeWatchFanout).toHaveBeenCalledWith(
      expect.objectContaining({
        seriesId: 777,
        isRewatch: false,
        wrappedEvent: true,
        seasonNumber: 1,
        episodeNumber: 4,
      })
    );
    expect(result.current.swipeDirections['777-1-4']).toBe('right');
  });

  it('does not write when logged out but still sets completing state', async () => {
    auth.user = null;
    const { result } = renderHook(() => useEpisodeSwipeHandlers());
    await act(async () => {
      await result.current.handleEpisodeComplete(makeTodayItem());
    });
    expect(mocks.applyUserUpdate).not.toHaveBeenCalled();
    expect(result.current.completingEpisodes.has('777-1-4')).toBe(true);
  });

  it('schedules the episode to hide after the 300ms exit animation', async () => {
    const { result } = renderHook(() => useEpisodeSwipeHandlers());
    await act(async () => {
      await result.current.handleEpisodeComplete(makeTodayItem());
    });
    expect(result.current.hiddenEpisodes.has('777-1-4')).toBe(false);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.hiddenEpisodes.has('777-1-4')).toBe(true);
    expect(result.current.completingEpisodes.has('777-1-4')).toBe(false);
  });
});
