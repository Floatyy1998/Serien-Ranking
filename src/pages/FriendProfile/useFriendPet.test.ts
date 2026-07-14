// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * Firebase-Mock: ref(path).on('value', handler) / off('value', handler).
 * Handler werden per Pfad in einer Map gehalten, sodass Tests Snapshots
 * synchron emittieren können. off-Calls werden für Cleanup-Assertions geloggt.
 */
type Snap = { val: () => unknown };
type Handler = (s: Snap) => void;

const fb = vi.hoisted(() => {
  const state = {
    handlers: new Map<string, Set<Handler>>(),
    offCalls: [] as string[],
  };
  const emit = (path: string, val: unknown) => {
    const set = state.handlers.get(path);
    if (set) set.forEach((h) => h({ val: () => val }));
  };
  const makeRef = (path: string) => ({
    on: (_e: string, handler: Handler) => {
      const set = state.handlers.get(path) ?? new Set<Handler>();
      set.add(handler);
      state.handlers.set(path, set);
      return handler;
    },
    off: (_e: string, handler: Handler) => {
      state.offCalls.push(path);
      state.handlers.get(path)?.delete(handler);
    },
  });
  return { state, emit, ref: (path: string) => makeRef(path) };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { useFriendPet } from './useFriendPet';

const UID = 'friend1';
const ACTIVE = `users/${UID}/petWidget/activePetId`;
const petPath = (id: string) => `users/${UID}/pets/${id}`;

beforeEach(() => {
  fb.state.handlers.clear();
  fb.state.offCalls = [];
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useFriendPet', () => {
  it('gibt ohne friendUid direkt not-loading / kein Pet zurück (Guard)', () => {
    const { result } = renderHook(() => useFriendPet(undefined));
    expect(result.current.loading).toBe(false);
    expect(result.current.pet).toBeNull();
    expect(fb.state.handlers.size).toBe(0);
  });

  it('startet im Loading-Zustand und abonniert die activePetId', () => {
    const { result } = renderHook(() => useFriendPet(UID));
    expect(result.current.loading).toBe(true);
    expect(fb.state.handlers.has(ACTIVE)).toBe(true);
  });

  it('setzt Pet auf null wenn keine activePetId gesetzt ist', () => {
    const { result } = renderHook(() => useFriendPet(UID));
    act(() => fb.emit(ACTIVE, null));
    expect(result.current.pet).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('lädt das aktive Pet und konvertiert Zeitfelder in Date-Objekte', () => {
    const { result } = renderHook(() => useFriendPet(UID));
    act(() => fb.emit(ACTIVE, 'p1'));
    expect(fb.state.handlers.has(petPath('p1'))).toBe(true);
    act(() =>
      fb.emit(petPath('p1'), {
        name: 'Rex',
        type: 'dog',
        lastFed: 1000,
        createdAt: 2000,
        deathTime: 3000,
      })
    );
    const pet = result.current.pet;
    expect(pet?.id).toBe('p1');
    expect(pet?.lastFed).toBeInstanceOf(Date);
    expect(pet?.createdAt).toBeInstanceOf(Date);
    expect(pet?.deathTime).toBeInstanceOf(Date);
    expect((pet?.lastFed as Date).getTime()).toBe(1000);
    expect(result.current.loading).toBe(false);
  });

  it('nutzt Fallback-Daten wenn Zeitfelder fehlen (deathTime bleibt undefined)', () => {
    const { result } = renderHook(() => useFriendPet(UID));
    act(() => fb.emit(ACTIVE, 'p2'));
    act(() => fb.emit(petPath('p2'), { name: 'Bello', type: 'cat' }));
    const pet = result.current.pet;
    expect(pet?.id).toBe('p2');
    expect(pet?.lastFed).toBeInstanceOf(Date);
    expect(pet?.deathTime).toBeUndefined();
  });

  it('setzt Pet auf null wenn der Pet-Node leer ist', () => {
    const { result } = renderHook(() => useFriendPet(UID));
    act(() => fb.emit(ACTIVE, 'p3'));
    act(() => fb.emit(petPath('p3'), null));
    expect(result.current.pet).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('räumt alle Listener beim Unmount auf', () => {
    const { unmount } = renderHook(() => useFriendPet(UID));
    act(() => fb.emit(ACTIVE, 'p4'));
    unmount();
    expect(fb.state.offCalls).toContain(ACTIVE);
    expect(fb.state.offCalls).toContain(petPath('p4'));
  });
});
