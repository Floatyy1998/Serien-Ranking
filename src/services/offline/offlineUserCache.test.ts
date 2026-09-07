import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cacheUserToStorage,
  clearCachedUserFromStorage,
  getCachedUserFromStorage,
} from './offlineUserCache';
import type { FirebaseUserLike } from './offlineFirebaseTypes';

// In-Memory-localStorage + minimaler IDBDatabase-Fake (nur die von diesen
// Funktionen genutzten Operationen: transaction → objectStore → get/delete).
// Requests feuern onsuccess/onerror asynchron (queueMicrotask), damit die
// Handler wie im echten IndexedDB nach dem Erstellen zugewiesen werden können.
function makeLocalStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    _map: m,
  };
}

interface FakeReq {
  result?: unknown;
  error?: unknown;
  onsuccess?: () => void;
  onerror?: () => void;
}
function fire(req: FakeReq, resultFn: () => unknown) {
  queueMicrotask(() => {
    try {
      req.result = resultFn();
      req.onsuccess?.();
    } catch (e) {
      req.error = e;
      req.onerror?.();
    }
  });
}

function makeFakeDB(opts: { getResult?: () => unknown; onDelete?: (key: string) => void } = {}) {
  const store = {
    get: (_key: string): FakeReq => {
      const req: FakeReq = {};
      fire(req, () => (opts.getResult ? opts.getResult() : undefined));
      return req;
    },
    delete: (key: string): FakeReq => {
      const req: FakeReq = {};
      fire(req, () => {
        opts.onDelete?.(key);
      });
      return req;
    },
  };
  return {
    transaction: () => ({ objectStore: () => store }),
  } as unknown as IDBDatabase;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0));
  vi.stubGlobal('localStorage', makeLocalStorage());
  // jsdom hat kein IndexedDB — der Service nutzt IDBKeyRange.bound für den user_-Prefix-Scan
  vi.stubGlobal('IDBKeyRange', {
    bound: (lower: string, upper: string) => ({ lower, upper }),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const user: FirebaseUserLike = {
  uid: 'u1',
  email: 'a@b.de',
  displayName: 'Alice',
  photoURL: 'p.png',
  emailVerified: true,
  metadata: { creationTime: 'x' },
};

describe('cacheUserToStorage', () => {
  it('schreibt in localStorage und (bei aktivem IDB) über cacheDataFn', async () => {
    const cacheDataFn = vi.fn(async () => {});
    await cacheUserToStorage(user, true, cacheDataFn);

    const raw = JSON.parse(localStorage.getItem('cachedUser') ?? '{}');
    expect(raw).toMatchObject({ uid: 'u1', email: 'a@b.de', cachedAt: Date.now() });
    expect(cacheDataFn).toHaveBeenCalledWith('user_u1', expect.objectContaining({ uid: 'u1' }));
  });

  it('überspringt IDB, wenn enableIndexedDB false ist', async () => {
    const cacheDataFn = vi.fn(async () => {});
    await cacheUserToStorage(user, false, cacheDataFn);
    expect(localStorage.getItem('cachedUser')).toBeTruthy();
    expect(cacheDataFn).not.toHaveBeenCalled();
  });

  it('no-op bei null user', async () => {
    const cacheDataFn = vi.fn(async () => {});
    await cacheUserToStorage(null as unknown as FirebaseUserLike, true, cacheDataFn);
    expect(localStorage.getItem('cachedUser')).toBeNull();
    expect(cacheDataFn).not.toHaveBeenCalled();
  });

  it('fängt Fehler von cacheDataFn ab (console.error, kein throw)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cacheDataFn = vi.fn(async () => {
      throw new Error('boom');
    });
    await expect(cacheUserToStorage(user, true, cacheDataFn)).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('getCachedUserFromStorage', () => {
  it('liefert frische localStorage-Daten (< 24h) ohne IDB-Zugriff', async () => {
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1', cachedAt: Date.now() }));
    const getDB = vi.fn(async () => makeFakeDB());
    const result = await getCachedUserFromStorage(true, getDB);
    expect(result).toMatchObject({ uid: 'u1' });
    expect(getDB).not.toHaveBeenCalled();
  });

  it('fällt bei veraltetem localStorage-Cache (> 24h) auf IDB zurück', async () => {
    const old = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'stale', cachedAt: old }));
    const getDB = vi.fn(async () =>
      makeFakeDB({ getResult: () => ({ data: { uid: 'fromIDB' } }) })
    );
    const result = await getCachedUserFromStorage(true, getDB);
    expect(result).toMatchObject({ uid: 'fromIDB' });
    expect(getDB).toHaveBeenCalled();
  });

  it('null, wenn kein Cache vorhanden und IDB deaktiviert ist', async () => {
    const getDB = vi.fn(async () => makeFakeDB());
    await expect(getCachedUserFromStorage(false, getDB)).resolves.toBeNull();
    expect(getDB).not.toHaveBeenCalled();
  });

  it('IDB liefert null, wenn kein Datensatz existiert', async () => {
    const getDB = vi.fn(async () => makeFakeDB({ getResult: () => undefined }));
    await expect(getCachedUserFromStorage(true, getDB)).resolves.toBeNull();
  });

  it('fängt kaputtes JSON ab und liefert null', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('cachedUser', '{not-json');
    const getDB = vi.fn(async () => makeFakeDB());
    await expect(getCachedUserFromStorage(true, getDB)).resolves.toBeNull();
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('clearCachedUserFromStorage', () => {
  it('entfernt localStorage-Key und löscht den IDB-Datensatz', async () => {
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1', cachedAt: Date.now() }));
    const onDelete = vi.fn();
    const getDB = vi.fn(async () => makeFakeDB({ onDelete }));

    await clearCachedUserFromStorage(true, getDB);

    expect(localStorage.getItem('cachedUser')).toBeNull();
    // Prefix-Range statt Literal-Key: löscht jeden user_<uid>-Eintrag
    expect(onDelete).toHaveBeenCalledWith({ lower: 'user_', upper: 'user_￿' });
  });

  it('löscht nur localStorage, wenn IDB deaktiviert ist', async () => {
    localStorage.setItem('cachedUser', 'x');
    const getDB = vi.fn(async () => makeFakeDB());
    await clearCachedUserFromStorage(false, getDB);
    expect(localStorage.getItem('cachedUser')).toBeNull();
    expect(getDB).not.toHaveBeenCalled();
  });
});
