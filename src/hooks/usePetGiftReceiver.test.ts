// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePetGiftReceiver } from './usePetGiftReceiver';

const authState = vi.hoisted(() => ({ uid: 'u1' as string | undefined }));

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: authState.uid ? { uid: authState.uid } : null }),
}));

// Firebase-Mock mit Store (once), Listenern (on/off) und geteilten
// set/update-Spies inkl. Pfad, damit wir die geschriebenen Werte prüfen können.
const fb = vi.hoisted(() => {
  type Listener = (snap: { val: () => unknown }) => void;
  const store: Record<string, unknown> = {};
  const listeners: Record<string, Listener[]> = {};
  const setMock = vi.fn();
  const updateMock = vi.fn();
  const offMock = vi.fn();
  const makeSnap = (val: unknown) => ({ val: () => val });
  const makeRef = (path: string) => {
    const ref = {
      path,
      orderByChild: vi.fn(() => ref),
      limitToLast: vi.fn(() => ref),
      once: vi.fn(async () => makeSnap(store[path] ?? null)),
      set: vi.fn(async (v: unknown) => {
        store[path] = v;
        setMock(path, v);
      }),
      update: vi.fn(async (v: unknown) => {
        updateMock(path, v);
      }),
      on: vi.fn((_ev: string, cb: Listener) => {
        (listeners[path] ??= []).push(cb);
        return cb;
      }),
      off: vi.fn((ev: string) => offMock(path, ev)),
    };
    return ref;
  };
  const refMock = vi.fn((path: string) => makeRef(path));
  const database = Object.assign(() => ({ ref: refMock }), {
    ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
  });
  const emit = (path: string, val: unknown) => {
    store[path] = val;
    (listeners[path] ?? []).forEach((cb) => cb(makeSnap(val)));
  };
  const reset = () => {
    for (const k of Object.keys(store)) delete store[k];
    for (const k of Object.keys(listeners)) delete listeners[k];
    setMock.mockClear();
    updateMock.mockClear();
    offMock.mockClear();
    refMock.mockClear();
  };
  return { store, refMock, database, emit, setMock, updateMock, offMock, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const notifPath = 'users/u1/notifications';
const activePath = 'users/u1/petWidget/activePetId';
const petPath = 'users/u1/pets/pet-a';

beforeEach(() => {
  authState.uid = 'u1';
  fb.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePetGiftReceiver', () => {
  it('registriert ohne User keinen Listener', () => {
    authState.uid = undefined;
    renderHook(() => usePetGiftReceiver());
    expect(fb.refMock).not.toHaveBeenCalled();
  });

  it('abonniert die notifications-Node mit orderByChild/limitToLast', () => {
    renderHook(() => usePetGiftReceiver());
    expect(fb.refMock).toHaveBeenCalledWith(notifPath);
  });

  it('wendet ein pet_gift auf das aktive Pet an und markiert es als applied', async () => {
    fb.store[activePath] = 'pet-a';
    fb.store[petPath] = { hunger: 50, happiness: 50, isAlive: true };
    renderHook(() => usePetGiftReceiver());

    fb.emit(notifPath, {
      n1: { type: 'pet_gift', data: { hungerDelta: 20, happinessDelta: 10 } },
    });

    await waitFor(() =>
      expect(fb.updateMock).toHaveBeenCalledWith(petPath, { hunger: 70, happiness: 60 })
    );
    expect(fb.setMock).toHaveBeenCalledWith(`${notifPath}/n1/applied`, true);
  });

  it('clamped die Werte auf 0..100', async () => {
    fb.store[activePath] = 'pet-a';
    fb.store[petPath] = { hunger: 95, happiness: 5, isAlive: true };
    renderHook(() => usePetGiftReceiver());

    fb.emit(notifPath, {
      n1: { type: 'pet_gift', data: { hungerDelta: 50, happinessDelta: -50 } },
    });

    await waitFor(() =>
      expect(fb.updateMock).toHaveBeenCalledWith(petPath, { hunger: 100, happiness: 0 })
    );
  });

  it('markiert das Gift bei totem Pet als applied, ohne die Werte zu ändern', async () => {
    fb.store[activePath] = 'pet-a';
    fb.store[petPath] = { hunger: 50, happiness: 50, isAlive: false };
    renderHook(() => usePetGiftReceiver());

    fb.emit(notifPath, {
      n1: { type: 'pet_gift', data: { hungerDelta: 20, happinessDelta: 10 } },
    });

    await waitFor(() => expect(fb.setMock).toHaveBeenCalledWith(`${notifPath}/n1/applied`, true));
    expect(fb.updateMock).not.toHaveBeenCalled();
  });

  it('überspringt bereits angewendete Gifts', async () => {
    fb.store[activePath] = 'pet-a';
    fb.store[petPath] = { hunger: 50, happiness: 50, isAlive: true };
    renderHook(() => usePetGiftReceiver());

    fb.emit(notifPath, {
      n1: { type: 'pet_gift', applied: true, data: { hungerDelta: 20, happinessDelta: 10 } },
    });

    // Kurz warten und sicherstellen, dass nichts geschrieben wurde.
    await Promise.resolve();
    expect(fb.updateMock).not.toHaveBeenCalled();
    expect(fb.setMock).not.toHaveBeenCalled();
  });

  it('ignoriert Nicht-Gift-Benachrichtigungen', async () => {
    fb.store[activePath] = 'pet-a';
    fb.store[petPath] = { hunger: 50, happiness: 50, isAlive: true };
    renderHook(() => usePetGiftReceiver());

    fb.emit(notifPath, {
      n1: { type: 'friend_request' },
    });

    await Promise.resolve();
    expect(fb.updateMock).not.toHaveBeenCalled();
  });

  it('entfernt den Listener beim Unmount', () => {
    const { unmount } = renderHook(() => usePetGiftReceiver());
    unmount();
    expect(fb.offMock).toHaveBeenCalledWith(notifPath, 'value');
  });
});
