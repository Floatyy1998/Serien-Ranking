// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedCacheResult } from '../hooks/data/firebaseCache/types';

/**
 * Der Aktivitaets-Feed liest fuer Freunde MIT Freigabe `activities` (mit Titel)
 * und sonst `activityTeaser` (ohne). Die Freigaben kommen aber ueber eigene
 * Abos und treffen erst NACH dem ersten Laden ein — ohne erneutes Laden bliebe
 * der Feed titellos, obwohl jemand laengst freigegeben hat.
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

afterEach(() => {
  cleanup();
  fb.gelesen.length = 0;
  fb.listener.clear();
  fb.werte.clear();
  localStorage.clear();
});

const renderProvider = () =>
  render(
    <OptimizedFriendsProvider>
      <div />
    </OptimizedFriendsProvider>
  );

describe('Aktivitaets-Feed und Freigabe', () => {
  it('liest ohne Freigabe den titellosen Teaser', async () => {
    // readTimes muessen gesetzt sein, sonst startet der Lader nicht.
    fb.werte.set('users/me/readTimes', { requests: 1, activities: 1 });
    renderProvider();

    await waitFor(() => expect(fb.gelesen.some((p) => p.includes('activityTeaser'))).toBe(true));
    expect(fb.gelesen).not.toContain('users/f1/activities');
  });

  it('laedt neu und nimmt die Titel, sobald die Freigabe eintrifft', async () => {
    fb.werte.set('users/me/readTimes', { requests: 1, activities: 1 });
    renderProvider();

    await waitFor(() => expect(fb.gelesen.some((p) => p.includes('activityTeaser'))).toBe(true));
    fb.gelesen.length = 0;

    // Die Freigabe trifft erst jetzt ein — genau der reale Ablauf.
    const cb = fb.listener.get('users/f1/shares/me');
    expect(cb).toBeTypeOf('function');
    await act(async () => {
      cb?.({ val: () => true, exists: () => true });
    });

    await waitFor(() => expect(fb.gelesen.some((p) => p === 'users/f1/activities')).toBe(true));
  });
});
