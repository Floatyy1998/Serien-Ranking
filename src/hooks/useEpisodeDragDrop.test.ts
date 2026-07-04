// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEpisodeDragDrop } from './useEpisodeDragDrop';
import type { NextEpisode } from './useWatchNextEpisodes';

// Firebase compat wird komplett gemockt: on/off fuer den Load-Effekt,
// set fuer das Persistieren der neuen Reihenfolge.
const fb = vi.hoisted(() => {
  const setMock = vi.fn(async () => {});
  const offMock = vi.fn();
  const state: { lastCb: ((snap: { val: () => unknown }) => void) | null } = { lastCb: null };
  const onMock = vi.fn((_event: string, cb: (snap: { val: () => unknown }) => void) => {
    state.lastCb = cb;
  });
  const refMock = vi.fn(() => ({ on: onMock, off: offMock, set: setMock }));
  const databaseMock = vi.fn(() => ({ ref: refMock }));
  return { setMock, offMock, onMock, refMock, databaseMock, state };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.databaseMock } }));
vi.mock('firebase/compat/database', () => ({}));

function makeEpisodes(ids: number[]): NextEpisode[] {
  return ids.map((seriesId) => ({ seriesId })) as unknown as NextEpisode[];
}

function dragEvent(clientY = 400): React.DragEvent {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { effectAllowed: '', dropEffect: '' },
    clientY,
  } as unknown as React.DragEvent;
}

function touchEvent(clientX: number, clientY: number): React.TouchEvent {
  return { touches: [{ clientX, clientY }] } as unknown as React.TouchEvent;
}

const USER = { uid: 'u1' };

beforeEach(() => {
  fb.setMock.mockClear();
  fb.offMock.mockClear();
  fb.onMock.mockClear();
  fb.refMock.mockClear();
  fb.databaseMock.mockClear();
  fb.state.lastCb = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useEpisodeDragDrop – Firebase watchlist order load', () => {
  it('subscribes on mount and unsubscribes on unmount when a user is present', () => {
    const { unmount } = renderHook(() =>
      useEpisodeDragDrop({ nextEpisodes: makeEpisodes([1, 2]), user: USER, editModeActive: true })
    );
    expect(fb.onMock).toHaveBeenCalledWith('value', expect.any(Function));
    unmount();
    expect(fb.offMock).toHaveBeenCalled();
  });

  it('does not subscribe when there is no user', () => {
    renderHook(() =>
      useEpisodeDragDrop({ nextEpisodes: makeEpisodes([1]), user: null, editModeActive: true })
    );
    expect(fb.onMock).not.toHaveBeenCalled();
  });

  it('hydrates watchlistOrder from the Firebase snapshot', () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({
        nextEpisodes: makeEpisodes([1, 2, 3]),
        user: USER,
        editModeActive: true,
      })
    );
    expect(result.current.watchlistOrder).toEqual([]);
    act(() => {
      fb.state.lastCb?.({ val: () => [3, 1, 2] });
    });
    expect(result.current.watchlistOrder).toEqual([3, 1, 2]);
  });

  it('ignores non-array snapshot values', () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({ nextEpisodes: makeEpisodes([1]), user: USER, editModeActive: true })
    );
    act(() => {
      fb.state.lastCb?.({ val: () => null });
    });
    expect(result.current.watchlistOrder).toEqual([]);
  });
});

describe('useEpisodeDragDrop – desktop drag handlers', () => {
  it('handleDragStart sets draggedIndex and effectAllowed', () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({ nextEpisodes: makeEpisodes([1, 2]), user: USER, editModeActive: true })
    );
    const e = dragEvent();
    act(() => result.current.handleDragStart(e, 0));
    expect(result.current.draggedIndex).toBe(0);
    expect(e.dataTransfer.effectAllowed).toBe('move');
  });

  it('handleDragOver marks the hovered target as currentTouchIndex', () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({
        nextEpisodes: makeEpisodes([1, 2, 3]),
        user: USER,
        editModeActive: true,
      })
    );
    act(() => result.current.handleDragStart(dragEvent(), 0));
    act(() => result.current.handleDragOver(dragEvent(), 2));
    expect(result.current.currentTouchIndex).toBe(2);
  });

  it('handleDrop reorders episodes and persists the unique order to Firebase', async () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({
        nextEpisodes: makeEpisodes([10, 20, 30]),
        user: USER,
        editModeActive: true,
      })
    );
    act(() => result.current.handleDragStart(dragEvent(), 0));
    await act(async () => {
      await result.current.handleDrop(dragEvent(), 2);
    });
    // 10 wird von Index 0 an Index 2 verschoben -> [20, 30, 10]
    expect(fb.setMock).toHaveBeenCalledWith([20, 30, 10]);
    expect(result.current.watchlistOrder).toEqual([20, 30, 10]);
    expect(result.current.draggedIndex).toBeNull();
  });

  it('handleDrop is a no-op when dropped on the same index', async () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({
        nextEpisodes: makeEpisodes([10, 20, 30]),
        user: USER,
        editModeActive: true,
      })
    );
    act(() => result.current.handleDragStart(dragEvent(), 1));
    await act(async () => {
      await result.current.handleDrop(dragEvent(), 1);
    });
    expect(fb.setMock).not.toHaveBeenCalled();
  });

  it('handleDrop does not persist when editMode is off', async () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({
        nextEpisodes: makeEpisodes([10, 20]),
        user: USER,
        editModeActive: false,
      })
    );
    act(() => result.current.handleDragStart(dragEvent(), 0));
    await act(async () => {
      await result.current.handleDrop(dragEvent(), 1);
    });
    expect(fb.setMock).not.toHaveBeenCalled();
  });
});

describe('useEpisodeDragDrop – touch drag threshold', () => {
  it('starts the drag only after the 150ms hold delay', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useEpisodeDragDrop({ nextEpisodes: makeEpisodes([1, 2]), user: USER, editModeActive: true })
    );
    act(() => result.current.handleTouchStart(touchEvent(5, 5), 0));
    // Vor Ablauf des Delays: noch kein Drag
    expect(result.current.draggedIndex).toBeNull();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.draggedIndex).toBe(0);
    expect(result.current.currentTouchIndex).toBe(0);
  });

  it('cancels the pending drag when the finger moves past the 10px scroll threshold', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useEpisodeDragDrop({ nextEpisodes: makeEpisodes([1, 2]), user: USER, editModeActive: true })
    );
    act(() => result.current.handleTouchStart(touchEvent(5, 5), 0));
    // Bewegung > 10px -> Drag-Delay wird abgebrochen (User scrollt)
    act(() => result.current.handleTouchMove(touchEvent(5, 40)));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.draggedIndex).toBeNull();
  });

  it('does not arm the drag delay when editMode is off', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useEpisodeDragDrop({ nextEpisodes: makeEpisodes([1, 2]), user: USER, editModeActive: false })
    );
    act(() => result.current.handleTouchStart(touchEvent(5, 5), 0));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.draggedIndex).toBeNull();
  });
});

describe('useEpisodeDragDrop – touch drop', () => {
  it('handleTouchEnd reorders based on currentTouchIndex and persists', async () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({
        nextEpisodes: makeEpisodes([10, 20, 30]),
        user: USER,
        editModeActive: true,
      })
    );
    // draggedIndex via DragStart, currentTouchIndex via DragOver setzen
    act(() => result.current.handleDragStart(dragEvent(), 0));
    act(() => result.current.handleDragOver(dragEvent(), 2));
    await act(async () => {
      await result.current.handleTouchEnd();
    });
    expect(fb.setMock).toHaveBeenCalledWith([20, 30, 10]);
    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.currentTouchIndex).toBeNull();
  });

  it('handleTouchEnd is a no-op when dragged and target index are equal', async () => {
    const { result } = renderHook(() =>
      useEpisodeDragDrop({
        nextEpisodes: makeEpisodes([10, 20]),
        user: USER,
        editModeActive: true,
      })
    );
    act(() => result.current.handleDragStart(dragEvent(), 0));
    // currentTouchIndex bleibt null -> Early return
    await act(async () => {
      await result.current.handleTouchEnd();
    });
    expect(fb.setMock).not.toHaveBeenCalled();
  });
});
