// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Discussion } from '../types/Discussion';

// ---------------------------------------------------------------------------
// Firebase-Mock. ref(path) mit on/off/once/push/update/set/remove und
// chainbarem orderByChild. Realtime-Callbacks werden erfasst; Mutationen in
// call-Arrays protokolliert. `dataByPath` steuert once()-Rückgaben.
// ---------------------------------------------------------------------------
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
    pushKey: 'new-id' as string | null,
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
        return { key: state.pushKey };
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
vi.mock('../AuthContext', () => ({ useAuth: () => ({ user: mocks.auth.user }) }));
vi.mock('../lib/firebase/userDisplayData', () => ({
  getUserDisplayData: vi.fn(async () => ({ username: 'Tester', photoURL: 'photo.png' })),
}));
vi.mock('../services/discussionFeedService', () => ({
  writeDiscussionFeedEntry: vi.fn(async () => 'feed-id'),
  deleteDiscussionFeedEntries: vi.fn(() => undefined),
}));

import { useDiscussions } from './useDiscussions';
import {
  writeDiscussionFeedEntry,
  deleteDiscussionFeedEntries,
} from '../services/discussionFeedService';

const mockedWriteFeed = vi.mocked(writeDiscussionFeedEntry);
const mockedDeleteFeed = vi.mocked(deleteDiscussionFeedEntries);

function discussionRecord(): Record<string, Partial<Discussion>> {
  return {
    d1: { userId: 'other', title: 'Alt', content: 'x', createdAt: 100, isPinned: false },
    d2: { userId: 'u1', title: 'Pinned', content: 'y', createdAt: 50, isPinned: true },
    d3: { userId: 'u1', title: 'Neu', content: 'z', createdAt: 300, isPinned: false },
  };
}

beforeEach(() => {
  mocks.auth.user = { uid: 'u1' };
  mocks.state.dataByPath = {};
  mocks.state.listeners = [];
  mocks.state.offCalls = [];
  mocks.state.pushCalls = [];
  mocks.state.updateCalls = [];
  mocks.state.setCalls = [];
  mocks.state.removeCalls = [];
  mocks.state.pushKey = 'new-id';
  mockedWriteFeed.mockClear();
  mockedDeleteFeed.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDiscussions — realtime listener', () => {
  it('lädt Diskussionen und sortiert gepinnte zuerst, dann neueste', async () => {
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    expect(result.current.loading).toBe(true);

    const cb = mocks.state.listeners[0]?.cb;
    act(() => cb?.(mocks.snap(discussionRecord())));

    await waitFor(() => expect(result.current.loading).toBe(false));
    // d2 gepinnt zuerst, dann d3 (createdAt 300) vor d1 (100)
    expect(result.current.discussions.map((d) => d.id)).toEqual(['d2', 'd3', 'd1']);
    expect(result.current.error).toBeNull();
  });

  it('mappt likes-Objekt in ein Array von userIds', async () => {
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    const cb = mocks.state.listeners[0]?.cb;
    act(() =>
      cb?.(
        mocks.snap({
          d1: { userId: 'u1', title: 't', content: 'c', createdAt: 1, likes: { a: true, b: true } },
        })
      )
    );
    await waitFor(() => expect(result.current.discussions).toHaveLength(1));
    expect(result.current.discussions[0]?.likes).toEqual(['a', 'b']);
  });

  it('setzt discussions=[] bei leerem Snapshot', async () => {
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    const cb = mocks.state.listeners[0]?.cb;
    act(() => cb?.(mocks.snap(null)));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.discussions).toEqual([]);
  });

  it('meldet einen Fehler über den Error-Callback', async () => {
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    const err = mocks.state.listeners[0]?.err;
    act(() => err?.(new Error('denied')));
    await waitFor(() => expect(result.current.error).toBe('Fehler beim Laden der Diskussionen'));
  });

  it('subscribed nicht ohne itemId (Guard) und startet nicht im Loading', () => {
    const { result } = renderHook(() => useDiscussions({ itemId: 0, itemType: 'series' }));
    expect(result.current.loading).toBe(false);
    expect(mocks.state.listeners).toHaveLength(0);
  });

  it('hängt den Listener bei Unmount ab (off)', () => {
    const { unmount } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    unmount();
    expect(mocks.state.offCalls).toContainEqual({ path: 'discussions/series/1', event: 'value' });
  });
});

describe('useDiscussions — createDiscussion', () => {
  it('pusht eine neue Diskussion und gibt den Key zurück', async () => {
    const { result } = renderHook(() =>
      useDiscussions({ itemId: 1, itemType: 'series', feedMetadata: { itemTitle: 'Show' } })
    );
    let key: string | null = null;
    await act(async () => {
      key = await result.current.createDiscussion({ title: 'Titel', content: 'Inhalt' });
    });
    expect(key).toBe('new-id');
    expect(mocks.state.pushCalls.some((c) => c.path === 'discussions/series/1')).toBe(true);
    expect(mockedWriteFeed).toHaveBeenCalledTimes(1);
  });

  it('verweigert das Erstellen ohne eingeloggten User', async () => {
    mocks.auth.user = null;
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    let key: string | null = 'x';
    await act(async () => {
      key = await result.current.createDiscussion({ title: 't', content: 'c' });
    });
    expect(key).toBeNull();
    expect(result.current.error).toBe('Du musst eingeloggt sein um zu diskutieren');
    expect(mocks.state.pushCalls).toHaveLength(0);
  });
});

describe('useDiscussions — edit / delete / like', () => {
  it('editDiscussion: Owner darf Titel/Content ändern (update aufgerufen)', async () => {
    mocks.state.dataByPath['discussions/series/1/d1'] = { userId: 'u1', title: 'Alt' };
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    let ok = false;
    await act(async () => {
      ok = await result.current.editDiscussion('d1', { title: 'Neu' });
    });
    expect(ok).toBe(true);
    const upd = mocks.state.updateCalls.find((c) => c.path === 'discussions/series/1/d1');
    expect((upd?.value as Record<string, unknown>).title).toBe('Neu');
  });

  it('editDiscussion: Nicht-Owner darf Titel/Content NICHT ändern', async () => {
    mocks.state.dataByPath['discussions/series/1/d1'] = { userId: 'other', title: 'Alt' };
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    let ok = true;
    await act(async () => {
      ok = await result.current.editDiscussion('d1', { content: 'Hack' });
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Du kannst nur eigene Diskussionen bearbeiten');
    expect(mocks.state.updateCalls).toHaveLength(0);
  });

  it('deleteDiscussion: Owner löscht Diskussion + Replies', async () => {
    mocks.state.dataByPath['discussions/series/1/d1'] = { userId: 'u1', title: 'x' };
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    let ok = false;
    await act(async () => {
      ok = await result.current.deleteDiscussion('d1');
    });
    expect(ok).toBe(true);
    expect(mocks.state.removeCalls).toContain('discussions/series/1/d1');
    expect(mocks.state.removeCalls).toContain('discussionReplies/d1');
    expect(mockedDeleteFeed).toHaveBeenCalledWith('d1');
  });

  it('deleteDiscussion: Nicht-Owner wird abgelehnt', async () => {
    mocks.state.dataByPath['discussions/series/1/d1'] = { userId: 'other', title: 'x' };
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    let ok = true;
    await act(async () => {
      ok = await result.current.deleteDiscussion('d1');
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Du kannst nur eigene Diskussionen löschen');
    expect(mocks.state.removeCalls).toHaveLength(0);
  });

  it('toggleLike: setzt ein Like wenn noch keins existiert', async () => {
    // like-Ref liefert nichts → set(true); Diskussion gehört dem User selbst → keine Notification
    mocks.state.dataByPath['discussions/series/1/d1'] = { userId: 'u1', title: 'x' };
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    await act(async () => {
      await result.current.toggleLike('d1');
    });
    const likePath = 'discussions/series/1/d1/likes/u1';
    expect(mocks.state.setCalls.some((c) => c.path === likePath && c.value === true)).toBe(true);
  });

  it('toggleLike: entfernt ein bestehendes Like', async () => {
    mocks.state.dataByPath['discussions/series/1/d1/likes/u1'] = true;
    const { result } = renderHook(() => useDiscussions({ itemId: 1, itemType: 'series' }));
    await act(async () => {
      await result.current.toggleLike('d1');
    });
    expect(mocks.state.removeCalls).toContain('discussions/series/1/d1/likes/u1');
    expect(mocks.state.setCalls).toHaveLength(0);
  });
});
