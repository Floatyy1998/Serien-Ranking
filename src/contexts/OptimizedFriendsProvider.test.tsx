// @vitest-environment jsdom
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedCacheResult } from '../hooks/firebaseCache/types';

interface FakeSnapshot {
  val: () => unknown;
  exists: () => boolean;
}
interface FakeRef {
  orderByChild: () => FakeRef;
  equalTo: () => FakeRef;
  limitToLast: () => FakeRef;
  startAt: () => FakeRef;
  on: (event: string, cb: (snap: FakeSnapshot) => void) => (snap: FakeSnapshot) => void;
  off: () => void;
  once: () => Promise<FakeSnapshot>;
  update: () => Promise<void>;
  set: () => Promise<void>;
  remove: () => Promise<void>;
}

const fb = vi.hoisted(() => {
  const emptySnap: FakeSnapshot = { val: () => null, exists: () => false };
  const sets: string[] = [];
  const makeRef = (path: string): FakeRef => {
    const ref: FakeRef = {
      orderByChild: () => ref,
      equalTo: () => ref,
      limitToLast: () => ref,
      startAt: () => ref,
      on: (_event, cb) => {
        cb(emptySnap);
        return cb;
      },
      off: () => {},
      once: async () => emptySnap,
      update: async () => {},
      set: async () => {
        sets.push(path);
      },
      remove: async () => {},
    };
    return ref;
  };
  return { database: () => ({ ref: (path: string) => makeRef(path) }), sets };
});

const cacheResult = vi.hoisted(
  () =>
    ({
      data: {},
      loading: false,
      isSyncing: false,
      error: null,
      isStale: false,
      isOffline: false,
      lastUpdated: 0,
      refetch: vi.fn<() => Promise<void>>(async () => {}),
      clearCache: vi.fn<() => Promise<void>>(async () => {}),
    }) as EnhancedCacheResult<Record<string, unknown>>
);

vi.mock('../hooks/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => cacheResult,
}));

const authUser = vi.hoisted(() => ({ uid: 'u1' }));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('./friendOperations', () => ({
  sendFriendRequestOp: vi.fn(async () => false),
  acceptFriendRequestOp: vi.fn(async () => {}),
  declineFriendRequestOp: vi.fn(async () => {}),
  cancelFriendRequestOp: vi.fn(async () => {}),
  removeFriendOp: vi.fn(async () => {}),
  updateUserActivityOp: vi.fn(async () => {}),
}));

import { OptimizedFriendsProvider } from './OptimizedFriendsProvider';
import { useOptimizedFriends } from './OptimizedFriendsContext';
import { beginAccountDeletion, endAccountDeletion } from '../services/accountDeletionState';

const Consumer = () => {
  const { friends, loading, unreadRequestsCount } = useOptimizedFriends();
  return (
    <div data-testid="friends">{`${friends.length}|${String(loading)}|${unreadRequestsCount}`}</div>
  );
};

afterEach(() => {
  cleanup();
  fb.sets.length = 0;
  endAccountDeletion();
});

describe('OptimizedFriendsProvider', () => {
  it('mounts, exposes the friends context and renders children', async () => {
    render(
      <OptimizedFriendsProvider>
        <Consumer />
      </OptimizedFriendsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('friends').textContent).toBe('0|false|0');
    });
  });

  it('legt ohne readTimes eine Baseline an', async () => {
    render(
      <OptimizedFriendsProvider>
        <Consumer />
      </OptimizedFriendsProvider>
    );

    await waitFor(() => {
      expect(fb.sets.filter((p) => p.endsWith('readTimes'))).toHaveLength(1);
    });
  });

  it('schreibt die Baseline nicht, während das Konto gelöscht wird', async () => {
    // Sonst legt der value-Listener den gerade entfernten users/$uid-Knoten
    // wieder an und readTimes bleibt als Rest stehen.
    beginAccountDeletion('u1');

    render(
      <OptimizedFriendsProvider>
        <Consumer />
      </OptimizedFriendsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('friends').textContent).toBe('0|false|0');
    });
    expect(fb.sets.filter((p) => p.endsWith('readTimes'))).toHaveLength(0);
  });
});
