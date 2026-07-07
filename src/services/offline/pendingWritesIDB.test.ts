import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingWriteEntry } from './pendingWriteQueue';

// Minimales In-Memory-IndexedDB (kein fake-indexeddb installiert). Deckt genau
// die von pendingWritesIDB genutzten Operationen ab: getAll/put/delete.
function createFakeIndexedDB() {
  const databases = new Map<string, ReturnType<typeof makeDB>>();

  function makeStoreHandle(store: { keyPath: string; map: Map<unknown, Record<string, unknown>> }) {
    return {
      getAll() {
        const req: Record<string, unknown> = {};
        const vals = [...store.map.values()];
        queueMicrotask(() => {
          req.result = vals;
          (req.onsuccess as (() => void) | undefined)?.();
        });
        return req;
      },
      put(value: Record<string, unknown>) {
        const req: Record<string, unknown> = {};
        store.map.set(value[store.keyPath], value);
        queueMicrotask(() => (req.onsuccess as (() => void) | undefined)?.());
        return req;
      },
      delete(key: unknown) {
        const req: Record<string, unknown> = {};
        store.map.delete(key);
        queueMicrotask(() => (req.onsuccess as (() => void) | undefined)?.());
        return req;
      },
    };
  }

  function makeDB() {
    const stores = new Map<
      string,
      { keyPath: string; map: Map<unknown, Record<string, unknown>> }
    >();
    return {
      objectStoreNames: { contains: (n: string) => stores.has(n) },
      createObjectStore: (name: string, opts: { keyPath: string }) => {
        stores.set(name, { keyPath: opts.keyPath, map: new Map() });
      },
      transaction: () => ({
        objectStore: (name: string) =>
          makeStoreHandle(
            stores.get(name) as { keyPath: string; map: Map<unknown, Record<string, unknown>> }
          ),
      }),
    };
  }

  return {
    open(name: string) {
      const req: Record<string, unknown> = {};
      let db = databases.get(name);
      const isNew = !db;
      if (!db) {
        db = makeDB();
        databases.set(name, db);
      }
      queueMicrotask(() => {
        req.result = db;
        if (isNew) (req.onupgradeneeded as (() => void) | undefined)?.();
        (req.onsuccess as (() => void) | undefined)?.();
      });
      return req;
    },
  };
}

function makeEntry(id: string, overrides: Partial<PendingWriteEntry> = {}): PendingWriteEntry {
  return {
    id,
    uid: 'u1',
    updates: { 'users/u1/x': 1 },
    createdAt: 1000,
    attempts: 0,
    ...overrides,
  };
}

async function load() {
  vi.resetModules();
  return import('./pendingWritesIDB');
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', createFakeIndexedDB());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('idbPendingWriteStorage — Roundtrip', () => {
  it('put + getAll gibt die gespeicherten Eintraege zurueck', async () => {
    const { idbPendingWriteStorage } = await load();
    await idbPendingWriteStorage.put(makeEntry('a'));
    await idbPendingWriteStorage.put(makeEntry('b', { label: 'mark' }));
    const all = await idbPendingWriteStorage.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((e) => e.id).sort()).toEqual(['a', 'b']);
    expect(all.find((e) => e.id === 'b')?.label).toBe('mark');
  });

  it('leerer Store → []', async () => {
    const { idbPendingWriteStorage } = await load();
    await expect(idbPendingWriteStorage.getAll()).resolves.toEqual([]);
  });

  it('put mit gleicher id ueberschreibt (keyPath id)', async () => {
    const { idbPendingWriteStorage } = await load();
    await idbPendingWriteStorage.put(makeEntry('a', { attempts: 0 }));
    await idbPendingWriteStorage.put(makeEntry('a', { attempts: 3 }));
    const all = await idbPendingWriteStorage.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].attempts).toBe(3);
  });

  it('remove loescht per id', async () => {
    const { idbPendingWriteStorage } = await load();
    await idbPendingWriteStorage.put(makeEntry('a'));
    await idbPendingWriteStorage.put(makeEntry('b'));
    await idbPendingWriteStorage.remove('a');
    const all = await idbPendingWriteStorage.getAll();
    expect(all.map((e) => e.id)).toEqual(['b']);
  });
});

describe('idbPendingWriteStorage — Degradation ohne IndexedDB', () => {
  beforeEach(() => {
    vi.stubGlobal('indexedDB', undefined);
  });

  it('getAll → [], put/remove sind No-ops und werfen nie', async () => {
    const { idbPendingWriteStorage } = await load();
    await expect(idbPendingWriteStorage.getAll()).resolves.toEqual([]);
    await expect(idbPendingWriteStorage.put(makeEntry('a'))).resolves.toBeUndefined();
    await expect(idbPendingWriteStorage.remove('a')).resolves.toBeUndefined();
    // Auch nach dem No-op-put bleibt der Store leer.
    await expect(idbPendingWriteStorage.getAll()).resolves.toEqual([]);
  });
});
