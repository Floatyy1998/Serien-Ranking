import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// serviceWorkerManager wird komplett gemockt (kein echter SW im node-env).
const swm = vi.hoisted(() => ({
  cacheFirebaseData: vi.fn(),
  registerBackgroundSync: vi.fn(async () => {}),
  clearCache: vi.fn(async () => {}),
  getCacheStatistics: vi.fn(async () => ({ totalSize: 7 })),
}));
vi.mock('./serviceWorkerManager', () => ({ serviceWorkerManager: swm }));

// Minimaler In-Memory-IndexedDB-Fake (fake-indexeddb ist NICHT installiert).
// Deckt die von OfflineFirebaseService genutzten Operationen ab:
// open (mit onupgradeneeded/onsuccess), transaction → objectStore →
// get/put/delete/clear/count/getAll. Requests feuern asynchron via queueMicrotask.
interface Req {
  result?: unknown;
  error?: unknown;
  onsuccess?: (ev?: unknown) => void;
  onerror?: (ev?: unknown) => void;
  onupgradeneeded?: (ev: { target: { result: unknown } }) => void;
}
function fire(req: Req, resultFn: () => unknown) {
  queueMicrotask(() => {
    try {
      req.result = resultFn();
      req.onsuccess?.({ target: req });
    } catch (e) {
      req.error = e;
      req.onerror?.({ target: req });
    }
  });
}

function createFakeIndexedDB() {
  const stores = new Map<string, Map<string, Record<string, unknown>>>();
  const keyPaths: Record<string, string> = {
    firebaseCache: 'path',
    offlineQueue: 'id',
    userActivities: 'id',
  };
  const getMap = (name: string) => {
    const existing = stores.get(name);
    if (existing) return existing;
    const created = new Map<string, Record<string, unknown>>();
    stores.set(name, created);
    return created;
  };
  const makeStore = (name: string) => {
    const kp = keyPaths[name] || 'id';
    return {
      createIndex: () => ({}),
      get: (key: string): Req => {
        const r: Req = {};
        fire(r, () => getMap(name).get(key));
        return r;
      },
      put: (value: Record<string, unknown>): Req => {
        const r: Req = {};
        fire(r, () => {
          getMap(name).set(value[kp] as string, value);
          return value[kp];
        });
        return r;
      },
      delete: (key: string): Req => {
        const r: Req = {};
        fire(r, () => void getMap(name).delete(key));
        return r;
      },
      clear: (): Req => {
        const r: Req = {};
        fire(r, () => void getMap(name).clear());
        return r;
      },
      count: (): Req => {
        const r: Req = {};
        fire(r, () => getMap(name).size);
        return r;
      },
      getAll: (): Req => {
        const r: Req = {};
        fire(r, () => [...getMap(name).values()]);
        return r;
      },
    };
  };
  const db = {
    objectStoreNames: { contains: (n: string) => stores.has(n) },
    createObjectStore: (name: string) => {
      stores.set(name, new Map());
      return makeStore(name);
    },
    transaction: () => ({ objectStore: (n: string) => makeStore(n) }),
  };
  return {
    _stores: stores,
    open: (): Req => {
      const req: Req = {};
      queueMicrotask(() => {
        req.result = db;
        req.onupgradeneeded?.({ target: { result: db } });
        req.onsuccess?.({ target: req });
      });
      return req;
    },
  };
}

function makeLocalStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}

let winHandlers: Record<string, Array<() => void>>;

async function loadService() {
  vi.resetModules();
  const mod = await import('./offlineFirebaseService');
  return mod.offlineFirebaseService;
}

beforeEach(() => {
  swm.cacheFirebaseData.mockClear();
  swm.registerBackgroundSync.mockClear();
  swm.clearCache.mockClear();
  swm.getCacheStatistics.mockClear();
  winHandlers = {};
  vi.stubGlobal('indexedDB', createFakeIndexedDB());
  vi.stubGlobal('localStorage', makeLocalStorage());
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('window', {
    addEventListener: (t: string, cb: () => void) => {
      (winHandlers[t] ||= []).push(cb);
    },
    removeEventListener: () => {},
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const fireWin = (type: string) => {
  for (const h of winHandlers[type] || []) h();
};

describe('Konstruktion & Getter', () => {
  it('startet online mit leerer Queue', async () => {
    const svc = await loadService();
    expect(svc.isOffline).toBe(false);
    expect(svc.queueSize).toBe(0);
  });
});

describe('cacheData / getCachedData', () => {
  it('speichert und liest Daten zurück und spiegelt sie an den Service Worker', async () => {
    const svc = await loadService();
    await svc.cacheData('foo/bar', { a: 1 });
    await expect(svc.getCachedData('foo/bar')).resolves.toEqual({ a: 1 });
    expect(swm.cacheFirebaseData).toHaveBeenCalledWith('foo/bar', { a: 1 });
  });

  it('liefert null und räumt auf, wenn der Eintrag abgelaufen ist', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0));
    const svc = await loadService();
    await svc.cacheData('exp', { v: 1 }, 1000);
    vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 5)); // +5s > ttl
    await expect(svc.getCachedData('exp')).resolves.toBeNull();
    vi.useRealTimers();
  });

  it('liefert null für unbekannte Pfade', async () => {
    const svc = await loadService();
    await expect(svc.getCachedData('nope')).resolves.toBeNull();
  });
});

describe('getCacheVersion', () => {
  it('liefert die gespeicherte Version', async () => {
    const svc = await loadService();
    await svc.cacheData('v/path', { x: 1 }, 60_000, 42);
    await expect(svc.getCacheVersion('v/path')).resolves.toBe(42);
  });

  it('liefert null ohne Version bzw. bei abgelaufenem Eintrag', async () => {
    const svc = await loadService();
    await svc.cacheData('nov', { x: 1 }, 60_000);
    await expect(svc.getCacheVersion('nov')).resolves.toBeNull();
    await expect(svc.getCacheVersion('missing')).resolves.toBeNull();
  });
});

describe('removeCachedData', () => {
  it('entfernt einen Eintrag', async () => {
    const svc = await loadService();
    await svc.cacheData('rm', { x: 1 });
    await svc.removeCachedData('rm');
    await expect(svc.getCachedData('rm')).resolves.toBeNull();
  });
});

describe('queueOperation & processOfflineQueue', () => {
  it('verarbeitet online sofort und leert die Queue (set → cacheData)', async () => {
    const svc = await loadService();
    await svc.queueOperation('q/set', 'set', { hello: 1 });
    expect(svc.queueSize).toBe(0);
    await expect(svc.getCachedData('q/set')).resolves.toEqual({ hello: 1 });
  });

  it('delete-Operation entfernt den gecachten Eintrag', async () => {
    const svc = await loadService();
    await svc.cacheData('q/del', { a: 1 });
    await svc.queueOperation('q/del', 'delete', null);
    await expect(svc.getCachedData('q/del')).resolves.toBeNull();
  });

  it('offline: hält die Operation in der Queue und registriert Background-Sync; online-Event drainiert', async () => {
    const svc = await loadService();
    fireWin('offline'); // isOnline = false
    await svc.queueOperation('q/off', 'set', { z: 9 });

    expect(svc.queueSize).toBe(1);
    expect(swm.registerBackgroundSync).toHaveBeenCalledWith('firebase-sync');

    fireWin('online'); // isOnline = true + processOfflineQueue
    await vi.waitFor(() => expect(svc.queueSize).toBe(0));
    await expect(svc.getCachedData('q/off')).resolves.toEqual({ z: 9 });
  });
});

describe('clearAllCaches', () => {
  it('leert den IndexedDB-Store und den Service-Worker-Cache', async () => {
    const svc = await loadService();
    await svc.cacheData('c1', { a: 1 });
    await svc.clearAllCaches();
    await expect(svc.getCachedData('c1')).resolves.toBeNull();
    expect(swm.clearCache).toHaveBeenCalled();
  });
});

describe('getCacheStatistics', () => {
  it('zählt IndexedDB-Einträge und liest die SW-Größe', async () => {
    const svc = await loadService();
    await svc.cacheData('s1', { a: 1 });
    await svc.cacheData('s2', { b: 2 });
    const stats = await svc.getCacheStatistics();
    expect(stats.indexedDBSize).toBe(2);
    expect(stats.serviceWorkerSize).toBe(7);
    expect(stats.offlineQueueSize).toBe(0);
  });
});

describe('User-Cache (delegiert an offlineUserCache)', () => {
  it('cacheUser → getCachedUser Roundtrip über localStorage', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0));
    const svc = await loadService();
    await svc.cacheUser({
      uid: 'u1',
      email: 'a@b.de',
      displayName: 'Alice',
      photoURL: null,
      emailVerified: true,
      metadata: {},
    });
    const cached = await svc.getCachedUser();
    expect(cached).toMatchObject({ uid: 'u1', email: 'a@b.de' });
    vi.useRealTimers();
  });

  it('clearCachedUser entfernt den zwischengespeicherten User', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0));
    const svc = await loadService();
    await svc.cacheUser({
      uid: 'u1',
      email: 'a@b.de',
      displayName: 'Alice',
      photoURL: null,
      emailVerified: true,
      metadata: {},
    });
    await svc.clearCachedUser();
    await expect(svc.getCachedUser()).resolves.toBeNull();
    vi.useRealTimers();
  });
});
