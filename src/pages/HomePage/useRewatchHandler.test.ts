// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import type { Series } from '../../types/Series';
import type { RewatchItem } from '../../hooks/useRewatchEpisodes';

// --- Firebase compat mock ---------------------------------------------------
const fb = vi.hoisted(() => {
  const state: { epVal: unknown; rewatchLastVal: unknown } = {
    epVal: null,
    rewatchLastVal: null,
  };
  const once = vi.fn((_ev: string) => Promise.resolve({ val: () => state.epVal }));
  const update = vi.fn((_updates?: Record<string, unknown>) => Promise.resolve());
  const set = vi.fn((_val?: unknown) => Promise.resolve());
  const remove = vi.fn(() => Promise.resolve());
  const ref = vi.fn((_path?: string) => ({ once, update, set, remove }));
  const database = Object.assign(
    vi.fn(() => ({ ref })),
    {
      ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
    }
  );
  return { state, once, update, set, remove, ref, database };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// --- Context / hook mocks ---------------------------------------------------
const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const seriesCtx = vi.hoisted(() => ({ seriesList: [] as Series[] }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: seriesCtx.seriesList }),
}));

const rewatchCtx = vi.hoisted(() => ({ items: [] as RewatchItem[] }));
vi.mock('../../hooks/useRewatchEpisodes', () => ({
  useRewatchEpisodes: () => rewatchCtx.items,
}));

const fanout = vi.hoisted(() => ({
  runEpisodeWatchFanout: vi.fn((_args?: Record<string, unknown>) => Promise.resolve()),
}));
vi.mock('../../lib/episode/episodeWatchFanout', () => fanout);

const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showUndoToast: vi.fn((_msg?: string, _opts?: unknown) => {}),
}));
vi.mock('../../lib/toast', () => toast);

import { useRewatchHandler } from './useRewatchHandler';

const makeItem = (o: Partial<RewatchItem> = {}): RewatchItem =>
  ({
    id: 5,
    title: 'Alpha',
    poster: 'p.jpg',
    seasonIndex: 0,
    episodeIndex: 0,
    seasonNumber: 1,
    episodeNumber: 1,
    episodeName: 'Pilot',
    currentWatchCount: 1,
    targetWatchCount: 2,
    progress: 0,
    progressCurrent: 0,
    progressTotal: 1,
    genre: { genres: ['Drama'] },
    provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] },
    episodeRuntime: 30,
    lastWatchedAt: '2026-01-01T00:00:00Z',
    ...o,
  }) as unknown as RewatchItem;

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 5,
    title: 'Alpha',
    watchlist: true,
    seasons: [{ seasonNumber: 0, episodes: [{ id: 12, watched: true, episode_number: 1 }] }],
    rating: {},
    ...o,
  }) as unknown as Series;

beforeEach(() => {
  fb.state.epVal = null;
  fb.state.rewatchLastVal = null;
  fb.once.mockClear();
  fb.once.mockImplementation(() => Promise.resolve({ val: () => fb.state.epVal }));
  fb.update.mockClear();
  fb.set.mockClear();
  fb.remove.mockClear();
  fb.ref.mockClear();
  fb.database.mockClear();
  fanout.runEpisodeWatchFanout.mockClear();
  toast.showToast.mockClear();
  toast.showUndoToast.mockClear();
  authState.user = { uid: 'u1' };
  seriesCtx.seriesList = [makeSeries()];
  rewatchCtx.items = [makeItem()];
});

afterEach(() => {
  cleanup();
});

describe('useRewatchHandler', () => {
  it('gibt die rewatchEpisodes aus dem Sub-Hook zurück', () => {
    const { result } = renderHook(() => useRewatchHandler());
    expect(result.current.rewatchEpisodes).toHaveLength(1);
    expect(result.current.rewatchEpisodes[0].id).toBe(5);
  });

  it('macht ohne User keine DB-Writes', async () => {
    authState.user = null;
    const { result } = renderHook(() => useRewatchHandler());
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    expect(fb.update).not.toHaveBeenCalled();
    expect(toast.showUndoToast).not.toHaveBeenCalled();
  });

  it('zeigt einen Fehler-Toast wenn die Episode-ID fehlt', async () => {
    // Serie ohne passende Episode am episodeIndex → epId undefined
    seriesCtx.seriesList = [makeSeries({ seasons: [{ seasonNumber: 0, episodes: [] }] })];
    const { result } = renderHook(() => useRewatchHandler());
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    expect(toast.showToast).toHaveBeenCalledWith('Episode-ID fehlt', 2000, 'error');
    expect(fb.update).not.toHaveBeenCalled();
  });

  it('schreibt die Rewatch-Update-Map inkl. serienVersion-Bump und blendet die Episode aus', async () => {
    const { result } = renderHook(() => useRewatchHandler());
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    expect(fb.update).toHaveBeenCalledTimes(1);
    const updates = fb.update.mock.calls[0][0] as Record<string, unknown>;
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/12';
    expect(updates[`${base}/c`]).toBe(1); // prevCount 0 + 1
    expect(updates[`${base}/w`]).toBe(1); // Erstwatch
    expect(typeof updates[`${base}/l`]).toBe('number');
    expect(updates[`${base}/f`]).toBeDefined();
    expect(updates['users/u1/series/5/rewatch/rewatchedEps/12']).toBe(true);
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(toast.showUndoToast).toHaveBeenCalledTimes(1);

    // Episode wird nach 300ms ausgeblendet
    const key = 'rewatch-5-1-1';
    await waitFor(() => expect(result.current.hiddenRewatches.has(key)).toBe(true));
  });

  it('erhöht einen bestehenden watchCount beim Rewatch', async () => {
    fb.state.epVal = { w: 1, c: 2, f: 100, l: 200 };
    const { result } = renderHook(() => useRewatchHandler());
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    const updates = fb.update.mock.calls[0][0] as Record<string, unknown>;
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/12';
    expect(updates[`${base}/c`]).toBe(3); // 2 + 1
    // war schon gewatcht → kein neues w/f
    expect(updates[`${base}/w`]).toBeUndefined();
    expect(updates[`${base}/f`]).toBeUndefined();
  });

  it('onCommit feuert den Watch-Fanout mit isRewatch=true', async () => {
    const { result } = renderHook(() => useRewatchHandler());
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    const opts = toast.showUndoToast.mock.calls[0][1] as { onCommit?: () => Promise<void> };
    await act(async () => {
      await opts.onCommit?.();
    });
    expect(fanout.runEpisodeWatchFanout).toHaveBeenCalledTimes(1);
    expect(fanout.runEpisodeWatchFanout.mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      seriesId: 5,
      isRewatch: true,
    });
  });

  it('onUndo entfernt die frisch geschriebene Episode wieder', async () => {
    const { result } = renderHook(() => useRewatchHandler());
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    fb.remove.mockClear();
    fb.set.mockClear();
    const opts = toast.showUndoToast.mock.calls[0][1] as { onUndo?: () => Promise<void> };
    await act(async () => {
      await opts.onUndo?.();
    });
    // prevWatched/prevCount 0 → Episode wird komplett entfernt
    expect(fb.remove).toHaveBeenCalled();
    // serienVersion wird per set(TIMESTAMP) zurückgesetzt
    expect(fb.set).toHaveBeenCalledWith({ '.sv': 'timestamp' });
  });

  it('zeigt einen Fehler-Toast wenn der DB-Read fehlschlägt', async () => {
    fb.once.mockRejectedValueOnce(new Error('boom'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useRewatchHandler());
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    expect(toast.showToast).toHaveBeenCalledWith('Fehler beim Speichern', 3000, 'error');
    errSpy.mockRestore();
  });

  it('Swipe-Helper aktualisieren swiping- und dragOffset-State', () => {
    const { result } = renderHook(() => useRewatchHandler());
    act(() => {
      result.current.handleRewatchSwipeStart('k1');
    });
    expect(result.current.swipingRewatches.has('k1')).toBe(true);
    act(() => {
      result.current.handleRewatchSwipeDrag('k1', 42);
    });
    expect(result.current.dragOffsetsRewatches.k1).toBe(42);
    act(() => {
      result.current.handleRewatchSwipeEnd('k1');
    });
    expect(result.current.swipingRewatches.has('k1')).toBe(false);
    expect(result.current.dragOffsetsRewatches.k1).toBeUndefined();
  });

  it('räumt veraltete hiddenRewatches-Keys auf wenn sich die Episoden-Liste ändert', async () => {
    const { result, rerender } = renderHook(() => useRewatchHandler());
    // Episode ausblenden
    await act(async () => {
      await result.current.handleRewatchComplete(makeItem());
    });
    const key = 'rewatch-5-1-1';
    await waitFor(() => expect(result.current.hiddenRewatches.has(key)).toBe(true));
    // Liste leeren → stale key wird beim nächsten Render entfernt
    rewatchCtx.items = [];
    rerender();
    await waitFor(() => expect(result.current.hiddenRewatches.has(key)).toBe(false));
  });
});
