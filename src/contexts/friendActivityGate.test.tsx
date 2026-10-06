// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedCacheResult } from '../hooks/data/firebaseCache/types';

/**
 * Die Freigabe gilt nur noch fuer den Kalender. Der Aktivitaets-Feed liest fuer
 * jeden Freund `activities` mit Titel — unabhaengig davon, ob er freigegeben hat.
 */

interface Snap {
  val: () => unknown;
  exists: () => boolean;
}

const fb = vi.hoisted(() => {
  const gelesen: string[] = [];
  /** Listener je Pfad, damit der Test eine Freigabe nachtraeglich senden kann. */
  const listener = new Map<string, (snap: Snap) => void>();
  const werte = new Map<string, unknown>();
  /** Pfade, deren once() erst auf Zuruf antwortet (langsame Abfrage). */
  const verzoegert = new Map<string, () => void>();

  const snap = (value: unknown): Snap => ({
    val: () => value,
    exists: () => value != null,
  });

  const makeRef = (path: string) => {
    const ref = {
      orderByChild: () => ref,
      equalTo: () => ref,
      limitToLast: () => ref,
      startAt: () => ref,
      on: (_event: string, cb: (s: Snap) => void) => {
        listener.set(path, cb);
        cb(snap(werte.get(path) ?? null));
        return cb;
      },
      off: () => {},
      once: async () => {
        gelesen.push(path);
        if (verzoegert.has(path)) {
          await new Promise<void>((resolve) => verzoegert.set(path, resolve));
        }
        return snap(werte.get(path) ?? null);
      },
      update: async () => {},
      set: async () => {},
      remove: async () => {},
      child: () => makeRef(path),
      push: () => makeRef(`${path}/neu`),
    };
    return ref;
  };

  return {
    gelesen,
    listener,
    werte,
    verzoegert,
    database: () => ({ ref: (path: string) => makeRef(path) }),
  };
});

const cacheResult = vi.hoisted(
  () =>
    ({
      data: { f1: { uid: 'f1', displayName: 'Flo', email: 'flo@x.de' } },
      loading: false,
      isSyncing: false,
      error: null,
      isStale: false,
      isOffline: false,
      lastUpdated: 0,
      refetch: vi.fn<() => Promise<void>>(async () => {}),
      clearCache: vi.fn<() => Promise<void>>(async () => {}),
    }) as unknown as EnhancedCacheResult<Record<string, unknown>>
);

vi.mock('../hooks/data/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => cacheResult,
}));
// Stabile Identitaet: ein frisches Objekt je Render laesst die Effekte, die an
// `user` haengen, endlos neu laufen.
const authValue = vi.hoisted(() => ({ user: { uid: 'me' } }));
vi.mock('./AuthContext', () => ({ useAuth: () => authValue }));
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
vi.mock('./shareOperations', () => ({
  requestShareOp: vi.fn(async () => true),
  acceptShareOp: vi.fn(async () => {}),
  declineShareOp: vi.fn(async () => {}),
  revokeShareOp: vi.fn(async () => {}),
  shareWithAllOp: vi.fn(async () => {}),
  withdrawShareRequestOp: vi.fn(async () => {}),
}));

import { OptimizedFriendsProvider } from './OptimizedFriendsProvider';
import { useOptimizedFriends } from './OptimizedFriendsContext';

afterEach(() => {
  cleanup();
  fb.gelesen.length = 0;
  fb.listener.clear();
  fb.werte.clear();
  fb.verzoegert.clear();
  localStorage.clear();
});

const renderProvider = () =>
  render(
    <OptimizedFriendsProvider>
      <div />
    </OptimizedFriendsProvider>
  );

describe('Aktivitaets-Feed ohne Freigabe-Sperre', () => {
  it('zeigt die Titel auch ohne Kalender-Freigabe', async () => {
    // readTimes muessen gesetzt sein, sonst startet der Lader nicht.
    fb.werte.set('users/me/readTimes', { requests: 1, activities: 1 });
    fb.werte.set('users/f1/activities', {
      a1: { type: 'series_added', itemTitle: 'Dark', timestamp: Date.now() },
    });
    const seen: { current: { itemTitle?: string }[] } = { current: [] };
    const Probe = () => {
      seen.current = useOptimizedFriends().friendActivities;
      return null;
    };
    render(
      <OptimizedFriendsProvider>
        <Probe />
      </OptimizedFriendsProvider>
    );

    await waitFor(() => expect(seen.current.map((a) => a.itemTitle)).toEqual(['Dark']));
    expect(fb.gelesen.some((p) => p.includes('activityTeaser'))).toBe(false);
  });

  it('laedt den Feed nicht neu, wenn eine Freigabe eintrifft', async () => {
    fb.werte.set('users/me/readTimes', { requests: 1, activities: 1 });
    renderProvider();

    await waitFor(() => expect(fb.gelesen).toContain('users/f1/activities'));
    fb.gelesen.length = 0;

    await act(async () => {
      fb.listener.get('users/f1/shares/me')?.({ val: () => true, exists: () => true });
    });
    expect(fb.gelesen).not.toContain('users/f1/activities');
  });
});
