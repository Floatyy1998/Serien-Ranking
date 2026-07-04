import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Minimales In-Memory-IndexedDB (kein fake-indexeddb installiert). Deckt genau
// die von catalogIDB genutzten Operationen ab: open/onupgradeneeded,
// transaction → objectStore → get/put/delete/openCursor. Requests feuern ihre
// onsuccess-Callbacks per Microtask, damit der Code sie erst zuweisen kann.
// ---------------------------------------------------------------------------
function createFakeIndexedDB() {
  const databases = new Map<string, ReturnType<typeof makeDB>>();

  function makeStoreHandle(store: { keyPath: string; map: Map<unknown, Record<string, unknown>> }) {
    return {
      get(key: unknown) {
        const req: Record<string, unknown> = {};
        const val = store.map.has(key) ? store.map.get(key) : undefined;
        queueMicrotask(() => {
          req.result = val;
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
      openCursor() {
        const req: Record<string, unknown> = {};
        const keys = [...store.map.keys()];
        let i = 0;
        const step = () => {
          if (i >= keys.length) {
            req.result = null;
            (req.onsuccess as (() => void) | undefined)?.();
            return;
          }
          const k = keys[i];
          req.result = {
            key: k,
            value: store.map.get(k),
            delete: () => store.map.delete(k),
            continue: () => {
              i++;
              queueMicrotask(step);
            },
          };
          (req.onsuccess as (() => void) | undefined)?.();
        };
        queueMicrotask(step);
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

async function load() {
  vi.resetModules();
  return import('./catalogIDB');
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', createFakeIndexedDB());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('catalogIDB — versionierter Roundtrip', () => {
  it('idbSetVersioned + idbGetVersioned bei passender Version', async () => {
    const { idbSetVersioned, idbGetVersioned } = await load();
    await idbSetVersioned('k1', 5, { title: 'A' });
    await expect(idbGetVersioned('k1', 5)).resolves.toEqual({ title: 'A' });
  });

  it('idbGetVersioned bei abweichender Version → null', async () => {
    const { idbSetVersioned, idbGetVersioned } = await load();
    await idbSetVersioned('k1', 5, { title: 'A' });
    await expect(idbGetVersioned('k1', 6)).resolves.toBeNull();
  });

  it('idbGetVersioned mit expectedVersion null → null (auch bei vorhandenem Record)', async () => {
    const { idbSetVersioned, idbGetVersioned } = await load();
    await idbSetVersioned('k1', 5, { title: 'A' });
    await expect(idbGetVersioned('k1', null)).resolves.toBeNull();
  });

  it('idbGetVersioned fuer fehlenden Key → null', async () => {
    const { idbGetVersioned } = await load();
    await expect(idbGetVersioned('missing', 1)).resolves.toBeNull();
  });

  it('idbSetVersioned mit version null ist ein No-op', async () => {
    const { idbSetVersioned, idbGetAny } = await load();
    await idbSetVersioned('k1', null, { title: 'A' });
    await expect(idbGetAny('k1')).resolves.toBeNull();
  });
});

describe('catalogIDB — idbGetAny (ohne Versions-Check)', () => {
  it('liefert v + data unabhaengig von der Version', async () => {
    const { idbSetVersioned, idbGetAny } = await load();
    await idbSetVersioned('k1', 9, { x: 1 });
    await expect(idbGetAny('k1')).resolves.toEqual({ v: 9, data: { x: 1 } });
  });

  it('fehlender Key → null', async () => {
    const { idbGetAny } = await load();
    await expect(idbGetAny('nope')).resolves.toBeNull();
  });
});

describe('catalogIDB — remove & removePrefix', () => {
  it('idbRemove loescht einen Eintrag', async () => {
    const { idbSetVersioned, idbRemove, idbGetAny } = await load();
    await idbSetVersioned('k1', 1, { a: 1 });
    await idbRemove('k1');
    await expect(idbGetAny('k1')).resolves.toBeNull();
  });

  it('idbRemovePrefix loescht nur Keys mit passendem Prefix', async () => {
    const { idbSetVersioned, idbRemovePrefix, idbGetAny } = await load();
    await idbSetVersioned('catalog:seasons:1', 1, { a: 1 });
    await idbSetVersioned('catalog:seasons:2', 1, { b: 2 });
    await idbSetVersioned('catalog:seriesMeta', 1, { c: 3 });
    await idbRemovePrefix('catalog:seasons:');
    await expect(idbGetAny('catalog:seasons:1')).resolves.toBeNull();
    await expect(idbGetAny('catalog:seasons:2')).resolves.toBeNull();
    await expect(idbGetAny('catalog:seriesMeta')).resolves.toEqual({ v: 1, data: { c: 3 } });
  });
});

describe('catalogIDB — Degradation ohne IndexedDB', () => {
  beforeEach(() => {
    vi.stubGlobal('indexedDB', undefined);
  });

  it('alle Reads liefern null, Writes/Removes sind No-ops und werfen nie', async () => {
    const { idbGetVersioned, idbGetAny, idbSetVersioned, idbRemove, idbRemovePrefix } =
      await load();
    await expect(idbGetVersioned('k', 1)).resolves.toBeNull();
    await expect(idbGetAny('k')).resolves.toBeNull();
    await expect(idbSetVersioned('k', 1, {})).resolves.toBeUndefined();
    await expect(idbRemove('k')).resolves.toBeUndefined();
    await expect(idbRemovePrefix('p')).resolves.toBeUndefined();
  });
});
