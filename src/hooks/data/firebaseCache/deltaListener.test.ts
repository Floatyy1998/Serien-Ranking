import { beforeEach, describe, expect, it, vi } from 'vitest';

type Snap = { key: string | null; val: () => unknown };
type Handler = (snap: Snap) => void;

const registry = vi.hoisted(() => {
  class FakeRef {
    handlers: Record<string, Handler[]> = {};
    on(event: string, cb: unknown): unknown {
      (this.handlers[event] ??= []).push(cb as Handler);
      return cb;
    }
    off(event: string, cb: unknown): void {
      this.handlers[event] = (this.handlers[event] ?? []).filter((f) => f !== cb);
    }
    emit(event: string, key: string | null, value?: unknown): void {
      [...(this.handlers[event] ?? [])].forEach((cb) => cb({ key, val: () => value }));
    }
    listenerCount(): number {
      return Object.values(this.handlers).reduce((sum, arr) => sum + arr.length, 0);
    }
  }
  const refs = new Map<string, InstanceType<typeof FakeRef>>();
  const getRef = (path: string) => {
    let ref = refs.get(path);
    if (!ref) {
      ref = new FakeRef();
      refs.set(path, ref);
    }
    return ref;
  };
  return { refs, getRef };
});

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({ ref: (path: string) => registry.getRef(path) }),
  },
}));

import type firebase from 'firebase/compat/app';
import { attachDeltaListeners } from './deltaListener';

type State = Record<string, Record<string, unknown>>;

/** Simuliert Reacts setState-Updater-Semantik für die Listener. */
function createHarness(initial: State) {
  const harness = {
    state: initial as State | null,
    saveToCache: vi.fn(),
    setLastUpdated: vi.fn(),
    setData: (updater: unknown) => {
      harness.state =
        typeof updater === 'function'
          ? (updater as (prev: State | null) => State | null)(harness.state)
          : (updater as State | null);
    },
  };
  return harness;
}

function attach(path: string, initialData: State, deltaSubKey?: string) {
  const harness = createHarness(initialData);
  const topRef = registry.getRef(path);
  const cleanup = attachDeltaListeners<State>(
    topRef as unknown as firebase.database.Reference,
    initialData,
    {
      path,
      deltaSubKey,
      setData: harness.setData as never,
      setLastUpdated: harness.setLastUpdated as never,
      saveToCache: harness.saveToCache,
    }
  );
  return { harness, topRef, cleanup };
}

beforeEach(() => {
  registry.refs.clear();
});

describe('attachDeltaListeners — flacher Modus (ohne deltaSubKey)', () => {
  const PATH = 'users/u1/movies';

  it('child_changed ersetzt das Child im State und schreibt in den Cache', () => {
    const { harness, topRef } = attach(PATH, { m1: { rating: 5 } });
    topRef.emit('child_changed', 'm1', { rating: 9 });
    expect(harness.state).toEqual({ m1: { rating: 9 } });
    expect(harness.saveToCache).toHaveBeenCalledWith({ m1: { rating: 9 } });
    expect(harness.setLastUpdated).toHaveBeenCalled();
  });

  it('initiale child_added-Events (bekannte Keys) werden genau einmal übersprungen', () => {
    const { harness, topRef } = attach(PATH, { m1: { rating: 5 } });
    // Firebase feuert child_added für alle existierenden Kinder beim Setup
    topRef.emit('child_added', 'm1', { rating: 5 });
    expect(harness.state).toEqual({ m1: { rating: 5 } });
    expect(harness.saveToCache).not.toHaveBeenCalled();
    // Ein SPÄTERES child_added mit demselben Key wird angewendet (Skip nur 1x)
    topRef.emit('child_added', 'm1', { rating: 7 });
    expect(harness.state).toEqual({ m1: { rating: 7 } });
  });

  it('child_added mit neuem Key fügt das Child hinzu', () => {
    const { harness, topRef } = attach(PATH, { m1: { rating: 5 } });
    topRef.emit('child_added', 'm2', { rating: 8 });
    expect(harness.state).toEqual({ m1: { rating: 5 }, m2: { rating: 8 } });
    expect(harness.saveToCache).toHaveBeenCalledWith({ m1: { rating: 5 }, m2: { rating: 8 } });
  });

  it('child_removed entfernt das Child', () => {
    const { harness, topRef } = attach(PATH, { m1: { rating: 5 }, m2: { rating: 8 } });
    topRef.emit('child_removed', 'm2');
    expect(harness.state).toEqual({ m1: { rating: 5 } });
    expect(harness.saveToCache).toHaveBeenCalledWith({ m1: { rating: 5 } });
  });

  it('Events mit key=null werden ignoriert', () => {
    const { harness, topRef } = attach(PATH, { m1: { rating: 5 } });
    topRef.emit('child_changed', null, { rating: 9 });
    topRef.emit('child_added', null, { rating: 9 });
    topRef.emit('child_removed', null);
    expect(harness.state).toEqual({ m1: { rating: 5 } });
    expect(harness.saveToCache).not.toHaveBeenCalled();
    expect(harness.setLastUpdated).not.toHaveBeenCalled();
  });

  it('cleanup hängt alle Listener ab — spätere Events ändern nichts', () => {
    const { harness, topRef, cleanup } = attach(PATH, { m1: { rating: 5 } });
    cleanup();
    expect(topRef.listenerCount()).toBe(0);
    topRef.emit('child_changed', 'm1', { rating: 9 });
    expect(harness.state).toEqual({ m1: { rating: 5 } });
  });
});

describe('attachDeltaListeners — deep delta (deltaSubKey=seasons)', () => {
  const PATH = 'users/u1/seriesWatch';

  it('sub child_changed aktualisiert nur die betroffene Season', () => {
    const initial: State = { s1: { seasons: { '0': { eps: { e1: { w: 1 } } } } } };
    const { harness } = attach(PATH, initial, 'seasons');
    const subRef = registry.getRef(`${PATH}/s1/seasons`);
    subRef.emit('child_changed', '0', { eps: { e1: { w: 1, c: 2 } } });
    expect(harness.state).toEqual({
      s1: { seasons: { '0': { eps: { e1: { w: 1, c: 2 } } } } },
    });
    expect(harness.saveToCache).toHaveBeenCalledTimes(1);
  });

  it('initiale sub child_added-Events werden übersprungen, neue Seasons angewendet', () => {
    const initial: State = { s1: { seasons: { '0': { eps: {} } } } };
    const { harness } = attach(PATH, initial, 'seasons');
    const subRef = registry.getRef(`${PATH}/s1/seasons`);
    // Initiales Replay der bestehenden Season → Skip
    subRef.emit('child_added', '0', { eps: {} });
    expect(harness.saveToCache).not.toHaveBeenCalled();
    // Neue Season (z.B. via Extension markiert) → anwenden
    subRef.emit('child_added', '1', { eps: { e9: { w: 1 } } });
    expect((harness.state as State).s1.seasons).toEqual({
      '0': { eps: {} },
      '1': { eps: { e9: { w: 1 } } },
    });
  });

  it('sub child_removed entfernt die Season (Firebase löscht leere Knoten)', () => {
    const initial: State = { s1: { seasons: { '0': { eps: {} }, '1': { eps: {} } } } };
    const { harness } = attach(PATH, initial, 'seasons');
    registry.getRef(`${PATH}/s1/seasons`).emit('child_removed', '1');
    expect((harness.state as State).s1.seasons).toEqual({ '0': { eps: {} } });
  });

  it('Prop-Listener ignoriert den deltaSubKey selbst, wendet andere Props an', () => {
    const initial: State = { s1: { seasons: {}, rating: 5 } };
    const { harness } = attach(PATH, initial, 'seasons');
    const propRef = registry.getRef(`${PATH}/s1`);
    // seasons-Änderungen deckt der Deep-Listener ab → ignorieren
    propRef.emit('child_changed', 'seasons', { '0': {} });
    expect((harness.state as State).s1.seasons).toEqual({});
    // andere Metadaten-Props werden angewendet
    propRef.emit('child_changed', 'rating', 9);
    expect((harness.state as State).s1.rating).toBe(9);
  });

  it('initiale Prop-child_added-Events werden übersprungen, neue Props angewendet', () => {
    const initial: State = { s1: { seasons: {}, rating: 5 } };
    const { harness } = attach(PATH, initial, 'seasons');
    const propRef = registry.getRef(`${PATH}/s1`);
    propRef.emit('child_added', 'rating', 5);
    expect(harness.saveToCache).not.toHaveBeenCalled();
    propRef.emit('child_added', 'hidden', true);
    expect((harness.state as State).s1.hidden).toBe(true);
  });

  it('Prop-child_removed entfernt die Property', () => {
    const initial: State = { s1: { seasons: {}, rating: 5, hidden: true } };
    const { harness } = attach(PATH, initial, 'seasons');
    registry.getRef(`${PATH}/s1`).emit('child_removed', 'hidden');
    expect((harness.state as State).s1).toEqual({ seasons: {}, rating: 5 });
  });

  it('top-level child_added verdrahtet Sub- und Prop-Listener für das neue Child', () => {
    const initial: State = { s1: { seasons: {} } };
    const { harness, topRef } = attach(PATH, initial, 'seasons');
    // Neue Serie kommt vom Server
    topRef.emit('child_added', 's2', { seasons: { '0': { eps: {} } } });
    expect((harness.state as State).s2).toEqual({ seasons: { '0': { eps: {} } } });
    // Deep-Listener für s2 muss jetzt aktiv sein
    const subRef = registry.getRef(`${PATH}/s2/seasons`);
    expect(subRef.listenerCount()).toBeGreaterThan(0);
    subRef.emit('child_changed', '0', { eps: { e1: { w: 1 } } });
    expect((harness.state as State).s2.seasons).toEqual({ '0': { eps: { e1: { w: 1 } } } });
  });

  it('Merge auf nicht (mehr) existierendes Child ist ein No-Op ohne Cache-Write', () => {
    const initial: State = { s1: { seasons: {} } };
    const { harness } = attach(PATH, initial, 'seasons');
    // s1 wurde zwischenzeitlich aus dem State entfernt
    harness.state = {};
    harness.saveToCache.mockClear();
    registry.getRef(`${PATH}/s1/seasons`).emit('child_changed', '0', { eps: {} });
    expect(harness.state).toEqual({});
    expect(harness.saveToCache).not.toHaveBeenCalled();
    // setLastUpdated feuert trotzdem (wie im Original: außerhalb des Updaters)
    expect(harness.setLastUpdated).toHaveBeenCalled();
  });

  it('cleanup hängt auch alle Sub- und Prop-Listener ab', () => {
    const initial: State = { s1: { seasons: {} }, s2: { seasons: {} } };
    const { topRef, cleanup } = attach(PATH, initial, 'seasons');
    cleanup();
    expect(topRef.listenerCount()).toBe(0);
    expect(registry.getRef(`${PATH}/s1/seasons`).listenerCount()).toBe(0);
    expect(registry.getRef(`${PATH}/s1`).listenerCount()).toBe(0);
    expect(registry.getRef(`${PATH}/s2/seasons`).listenerCount()).toBe(0);
    expect(registry.getRef(`${PATH}/s2`).listenerCount()).toBe(0);
  });
});
