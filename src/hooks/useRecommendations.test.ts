// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Firebase compat mock ──────────────────────────────────────────────
// Captures the 'value' listener per path so tests can push snapshots, and
// records push/set/off calls for assertions.
const fb = vi.hoisted(() => {
  const handlers: Record<string, (snap: { val: () => unknown }) => void> = {};
  const onMock = vi.fn<(path: string, evt: string) => void>();
  const offMock = vi.fn<(path: string, evt: string, cb: unknown) => void>();
  const pushMock = vi.fn<(path: string, val: unknown) => Promise<void>>(async () => {});
  const setMock = vi.fn<(path: string, val: unknown) => Promise<void>>(async () => {});
  const refMock = vi.fn((path: string) => ({
    on: (evt: string, cb: (snap: { val: () => unknown }) => void) => {
      handlers[path] = cb;
      onMock(path, evt);
    },
    off: (evt: string, cb: unknown) => offMock(path, evt, cb),
    push: (val: unknown) => pushMock(path, val),
    set: (val: unknown) => setMock(path, val),
  }));
  const database = Object.assign(() => ({ ref: refMock }), {});
  const emit = (path: string, value: unknown) => {
    const cb = handlers[path];
    if (cb) cb({ val: () => value });
  };
  return { handlers, onMock, offMock, pushMock, setMock, refMock, database, emit };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// ── Auth mock ─────────────────────────────────────────────────────────
interface FakeUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}
const authState = vi.hoisted(() => ({ user: null as FakeUser | null }));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

import { useRecommendations } from './useRecommendations';

const REC_PATH = 'users/u1/recommendations';

beforeEach(() => {
  authState.user = null;
  for (const k of Object.keys(fb.handlers)) delete fb.handlers[k];
  fb.onMock.mockClear();
  fb.offMock.mockClear();
  fb.pushMock.mockClear();
  fb.setMock.mockClear();
  fb.refMock.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useRecommendations', () => {
  it('returns empty + not loading when no user is signed in', () => {
    const { result } = renderHook(() => useRecommendations());
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.pendingCount).toBe(0);
    expect(fb.onMock).not.toHaveBeenCalled();
  });

  it('transitions loading→data and sorts by timestamp descending', () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useRecommendations());
    expect(result.current.loading).toBe(true);
    expect(fb.onMock).toHaveBeenCalledWith(REC_PATH, 'value');

    act(() => {
      fb.emit(REC_PATH, {
        a: { mediaId: 1, mediaTitle: 'Old', timestamp: 100, status: 'accepted' },
        b: { mediaId: 2, mediaTitle: 'New', timestamp: 300, status: 'pending' },
        c: { mediaId: 3, mediaTitle: 'Mid', timestamp: 200, status: 'pending' },
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.recommendations.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(result.current.recommendations[0].mediaTitle).toBe('New');
    expect(result.current.pendingCount).toBe(2);
  });

  it('handles an empty snapshot (null value) gracefully', () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useRecommendations());
    act(() => {
      fb.emit(REC_PATH, null);
    });
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('detaches the listener on unmount', () => {
    authState.user = { uid: 'u1' };
    const { unmount } = renderHook(() => useRecommendations());
    unmount();
    expect(fb.offMock).toHaveBeenCalledWith(REC_PATH, 'value', expect.any(Function));
  });

  it('send() pushes to every recipient and returns the recipient count', async () => {
    authState.user = { uid: 'u1', displayName: 'Alice', email: 'alice@x.de', photoURL: 'p.png' };
    const { result } = renderHook(() => useRecommendations());

    let count = 0;
    await act(async () => {
      count = await result.current.send({
        recipientUids: ['r1', 'r2'],
        media: { id: 42, type: 'series', title: 'Dexter', posterPath: '/d.jpg' },
        message: 'schau das',
      });
    });

    expect(count).toBe(2);
    expect(fb.pushMock).toHaveBeenCalledTimes(2);
    expect(fb.pushMock.mock.calls[0][0]).toBe('users/r1/recommendations');
    expect(fb.pushMock.mock.calls[1][0]).toBe('users/r2/recommendations');
    const payload = fb.pushMock.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.mediaId).toBe(42);
    expect(payload.mediaTitle).toBe('Dexter');
    expect(payload.senderName).toBe('Alice');
    expect(payload.status).toBe('pending');
    expect(payload.message).toBe('schau das');
  });

  it('send() is a no-op without recipients or user', async () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useRecommendations());
    let count = 1;
    await act(async () => {
      count = await result.current.send({
        recipientUids: [],
        media: { id: 1, type: 'movie', title: 'X' },
      });
    });
    expect(count).toBe(0);
    expect(fb.pushMock).not.toHaveBeenCalled();
  });

  it('accept()/decline() write the new status to the recommendation node', async () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useRecommendations());

    await act(async () => {
      await result.current.accept('rec1');
    });
    expect(fb.setMock).toHaveBeenCalledWith('users/u1/recommendations/rec1/status', 'accepted');

    await act(async () => {
      await result.current.decline('rec2');
    });
    expect(fb.setMock).toHaveBeenCalledWith('users/u1/recommendations/rec2/status', 'declined');
  });
});
