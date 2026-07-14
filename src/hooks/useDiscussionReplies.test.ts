// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock (analog useDiscussions.test): on/off/once/push/update/set/
// remove + chainbares orderByChild + ServerValue.increment.
type ValueCb = (snap: FbSnapshot) => void;
type ErrCb = (err: Error) => void;
interface FbSnapshot {
  exists: () => boolean;
  val: () => unknown;
}

const mocks = vi.hoisted(() => {
  const auth = { user: { uid: 'u1' } as { uid: string } | null };
  const state = {
    dataByPath: {} as Record<string, unknown>,
    listeners: [] as Array<{ path: string; event: string; cb: ValueCb; err?: ErrCb }>,
    offCalls: [] as Array<{ path: string; event: string }>,
    pushCalls: [] as Array<{ path: string; value: unknown }>,
    updateCalls: [] as Array<{ path: string; value: unknown }>,
    setCalls: [] as Array<{ path: string; value: unknown }>,
    removeCalls: [] as string[],
  };
  const snap = (data: unknown): FbSnapshot => ({
    exists: () =>
      data !== null &&
      data !== undefined &&
      (typeof data !== 'object' || Object.keys(data as object).length > 0),
    val: () => data ?? null,
  });
  const makeRef = (path: string) => {
    const refObj = {
      path,
      orderByChild: () => refObj,
      on: (event: string, cb: ValueCb, err?: ErrCb) => {
        state.listeners.push({ path, event, cb, err });
        return cb;
      },
      off: (event: string) => {
        state.offCalls.push({ path, event });
      },
      once: async (_event: string) => snap(state.dataByPath[path]),
      push: async (value: unknown) => {
        state.pushCalls.push({ path, value });
        return { key: 'reply-id' };
      },
      update: async (value: unknown) => {
        state.updateCalls.push({ path, value });
      },
      set: async (value: unknown) => {
        state.setCalls.push({ path, value });
      },
      remove: async () => {
        state.removeCalls.push(path);
      },
    };
    return refObj;
  };
  const ref = (path: string) => makeRef(path);
  return { auth, state, snap, ref };
});

vi.mock('firebase/compat/app', () => ({
  default: {
    database: Object.assign(() => ({ ref: mocks.ref }), {
      ServerValue: { increment: (n: number) => ({ __inc: n }) },
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.auth.user }) }));
vi.mock('../services/firebase/userDisplayData', () => ({
  getUserDisplayData: vi.fn(async () => ({ username: 'Tester', photoURL: 'photo.png' })),
}));
vi.mock('../services/discussionFeedService', () => ({
  writeDiscussionFeedEntry: vi.fn(async () => 'feed-id'),
}));

import { useDiscussionReplies } from './useDiscussionReplies';

const DPATH = 'discussions/series/1';

beforeEach(() => {
  mocks.auth.user = { uid: 'u1' };
  mocks.state.dataByPath = {};
  mocks.state.listeners = [];
  mocks.state.offCalls = [];
  mocks.state.pushCalls = [];
  mocks.state.updateCalls = [];
  mocks.state.setCalls = [];
  mocks.state.removeCalls = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDiscussionReplies — realtime listener', () => {
  it('lädt Antworten und sortiert älteste zuerst', async () => {
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    expect(result.current.loading).toBe(true);
    const cb = mocks.state.listeners[0]?.cb;
    act(() =>
      cb?.(
        mocks.snap({
          r1: { userId: 'a', content: 'zweite', createdAt: 200 },
          r2: { userId: 'b', content: 'erste', createdAt: 100 },
        })
      )
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.replies.map((r) => r.id)).toEqual(['r2', 'r1']);
  });

  it('mappt likes-Objekt in ein Array', async () => {
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    const cb = mocks.state.listeners[0]?.cb;
    act(() =>
      cb?.(mocks.snap({ r1: { userId: 'a', content: 'x', createdAt: 1, likes: { u1: true } } }))
    );
    await waitFor(() => expect(result.current.replies).toHaveLength(1));
    expect(result.current.replies[0]?.likes).toEqual(['u1']);
  });

  it('subscribed nicht wenn shouldFetch=false (Guard)', () => {
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH, false));
    expect(result.current.loading).toBe(false);
    expect(mocks.state.listeners).toHaveLength(0);
  });

  it('subscribed nicht ohne discussionId (Guard)', () => {
    renderHook(() => useDiscussionReplies(null, DPATH));
    expect(mocks.state.listeners).toHaveLength(0);
  });

  it('meldet einen Fehler über den Error-Callback', async () => {
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    const err = mocks.state.listeners[0]?.err;
    act(() => err?.(new Error('denied')));
    await waitFor(() => expect(result.current.error).toBe('Fehler beim Laden der Antworten'));
  });

  it('hängt den Listener bei Unmount ab (off)', () => {
    const { unmount } = renderHook(() => useDiscussionReplies('d1', DPATH));
    unmount();
    expect(mocks.state.offCalls).toContainEqual({ path: 'discussionReplies/d1', event: 'value' });
  });
});

describe('useDiscussionReplies — mutations', () => {
  it('createReply: pusht Antwort und erhöht replyCount + lastReplyAt', async () => {
    mocks.state.dataByPath[`${DPATH}/d1`] = { userId: 'u1', title: 'T' };
    mocks.state.dataByPath['discussionReplies/d1'] = { r1: { userId: 'u1' } };
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    let ok = false;
    await act(async () => {
      ok = await result.current.createReply('Meine Antwort');
    });
    expect(ok).toBe(true);
    expect(mocks.state.pushCalls.some((c) => c.path === 'discussionReplies/d1')).toBe(true);
    const upd = mocks.state.updateCalls.find((c) => c.path === `${DPATH}/d1`);
    expect(upd).toBeDefined();
    expect((upd?.value as Record<string, unknown>).lastReplyAt).toBeTypeOf('number');
  });

  it('createReply: verweigert ohne User', async () => {
    mocks.auth.user = null;
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    let ok = true;
    await act(async () => {
      ok = await result.current.createReply('x');
    });
    expect(ok).toBe(false);
    expect(mocks.state.pushCalls).toHaveLength(0);
  });

  it('editReply: Owner darf Content ändern (update aufgerufen)', async () => {
    mocks.state.dataByPath['discussionReplies/d1/r1'] = { userId: 'u1', content: 'alt' };
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    let ok = false;
    await act(async () => {
      ok = await result.current.editReply('r1', { content: 'neu' });
    });
    expect(ok).toBe(true);
    const upd = mocks.state.updateCalls.find((c) => c.path === 'discussionReplies/d1/r1');
    expect((upd?.value as Record<string, unknown>).content).toBe('neu');
  });

  it('editReply: Nicht-Owner darf Content NICHT ändern', async () => {
    mocks.state.dataByPath['discussionReplies/d1/r1'] = { userId: 'other', content: 'alt' };
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    let ok = true;
    await act(async () => {
      ok = await result.current.editReply('r1', { content: 'hack' });
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Du kannst nur eigene Antworten bearbeiten');
    expect(mocks.state.updateCalls).toHaveLength(0);
  });

  it('deleteReply: Owner löscht + verringert replyCount', async () => {
    mocks.state.dataByPath['discussionReplies/d1/r1'] = { userId: 'u1', content: 'x' };
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    let ok = false;
    await act(async () => {
      ok = await result.current.deleteReply('r1');
    });
    expect(ok).toBe(true);
    expect(mocks.state.removeCalls).toContain('discussionReplies/d1/r1');
    expect(mocks.state.updateCalls.some((c) => c.path === `${DPATH}/d1`)).toBe(true);
  });

  it('deleteReply: Nicht-Owner wird abgelehnt', async () => {
    mocks.state.dataByPath['discussionReplies/d1/r1'] = { userId: 'other', content: 'x' };
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    let ok = true;
    await act(async () => {
      ok = await result.current.deleteReply('r1');
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Du kannst nur eigene Antworten löschen');
    expect(mocks.state.removeCalls).toHaveLength(0);
  });

  it('toggleReplyLike: setzt ein Like wenn noch keins existiert', async () => {
    mocks.state.dataByPath['discussionReplies/d1/r1'] = { userId: 'u1', content: 'x' };
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    await act(async () => {
      await result.current.toggleReplyLike('r1');
    });
    const likePath = 'discussionReplies/d1/r1/likes/u1';
    expect(mocks.state.setCalls.some((c) => c.path === likePath && c.value === true)).toBe(true);
  });

  it('toggleReplyLike: entfernt ein bestehendes Like', async () => {
    mocks.state.dataByPath['discussionReplies/d1/r1/likes/u1'] = true;
    const { result } = renderHook(() => useDiscussionReplies('d1', DPATH));
    await act(async () => {
      await result.current.toggleReplyLike('r1');
    });
    expect(mocks.state.removeCalls).toContain('discussionReplies/d1/r1/likes/u1');
    expect(mocks.state.setCalls).toHaveLength(0);
  });
});
