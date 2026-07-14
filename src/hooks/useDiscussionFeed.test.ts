// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock: ref('discussionFeed') mit chainbaren Query-Buildern
// (orderByChild/equalTo/limitToLast → derselbe Ref). on() erfasst den
// Callback, off() wird protokolliert.
type ValueCb = (snap: FeedSnapshot) => void;
type ErrCb = (err: Error) => void;
interface FeedSnapshot {
  exists: () => boolean;
  val: () => unknown;
}

const fb = vi.hoisted(() => {
  const state = {
    listeners: [] as Array<{ path: string; event: string; cb: ValueCb; err?: ErrCb }>,
    offCalls: [] as Array<{ path: string; event: string }>,
    orderByChildArgs: [] as string[],
    equalToArgs: [] as unknown[],
    limitToLastArgs: [] as number[],
  };
  const makeRef = (path: string) => {
    const refObj = {
      path,
      orderByChild: (key: string) => {
        state.orderByChildArgs.push(key);
        return refObj;
      },
      equalTo: (v: unknown) => {
        state.equalToArgs.push(v);
        return refObj;
      },
      limitToLast: (n: number) => {
        state.limitToLastArgs.push(n);
        return refObj;
      },
      on: (event: string, cb: ValueCb, err?: ErrCb) => {
        state.listeners.push({ path, event, cb, err });
        return cb;
      },
      off: (event: string) => {
        state.offCalls.push({ path, event });
      },
    };
    return refObj;
  };
  const ref = (path: string) => makeRef(path);
  return { state, ref };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { useDiscussionFeed } from './useDiscussionFeed';

function makeSnapshot(data: Record<string, unknown> | null): FeedSnapshot {
  return {
    exists: () => data !== null && Object.keys(data).length > 0,
    val: () => data,
  };
}

beforeEach(() => {
  fb.state.listeners = [];
  fb.state.offCalls = [];
  fb.state.orderByChildArgs = [];
  fb.state.equalToArgs = [];
  fb.state.limitToLastArgs = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDiscussionFeed', () => {
  it('startet im Loading-State und ordnet Einträge nach createdAt absteigend', async () => {
    const { result } = renderHook(() => useDiscussionFeed());
    expect(result.current.loading).toBe(true);

    const cb = fb.state.listeners[0]?.cb;
    expect(cb).toBeDefined();
    act(() => {
      cb?.(
        makeSnapshot({
          a: { createdAt: 100, itemType: 'series' },
          b: { createdAt: 300, itemType: 'movie' },
          c: { createdAt: 200, itemType: 'series' },
        })
      );
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries.map((e) => e.id)).toEqual(['b', 'c', 'a']);
    expect(result.current.error).toBeNull();
  });

  it('nutzt orderByChild(createdAt)+limitToLast für den "all"-Filter', () => {
    renderHook(() => useDiscussionFeed('all', 25));
    expect(fb.state.orderByChildArgs).toContain('createdAt');
    expect(fb.state.limitToLastArgs).toContain(25);
    expect(fb.state.equalToArgs).toHaveLength(0);
  });

  it('nutzt orderByChild(itemType).equalTo(filter) für einen typ-spezifischen Filter', () => {
    renderHook(() => useDiscussionFeed('movie', 10));
    expect(fb.state.orderByChildArgs).toContain('itemType');
    expect(fb.state.equalToArgs).toContain('movie');
    expect(fb.state.limitToLastArgs).toContain(10);
  });

  it('setzt entries auf [] bei leerem Snapshot', async () => {
    const { result } = renderHook(() => useDiscussionFeed());
    const cb = fb.state.listeners[0]?.cb;
    act(() => cb?.(makeSnapshot(null)));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it('meldet einen Fehler über den Error-Callback', async () => {
    const { result } = renderHook(() => useDiscussionFeed());
    const err = fb.state.listeners[0]?.err;
    act(() => err?.(new Error('boom')));
    await waitFor(() =>
      expect(result.current.error).toBe('Fehler beim Laden des Diskussions-Feeds')
    );
    expect(result.current.loading).toBe(false);
  });

  it('hängt den Listener bei Unmount ab (off)', () => {
    const { unmount } = renderHook(() => useDiscussionFeed());
    unmount();
    expect(fb.state.offCalls).toContainEqual({ path: 'discussionFeed', event: 'value' });
  });
});
