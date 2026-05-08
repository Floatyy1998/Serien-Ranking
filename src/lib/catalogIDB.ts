/**
 * IndexedDB-Wrapper fuer den Static-Catalog-Cache.
 *
 * Hintergrund: Der Catalog (seriesMeta + moviesMeta + N seasons) kann mehrere
 * Megabyte gross werden. iOS Safari speichert localStorage als UTF-16 mit
 * Quota ~5 MB und wirft dann QuotaExceededError, was alle weiteren setItem-
 * Aufrufe (Theme, HomeConfig etc.) lahmlegt. IndexedDB hat ein viel hoeheres
 * Quota (typisch 50 MB+) und ist die richtige Stelle fuer Datenmengen dieser
 * Groesse.
 */

interface VersionedRecord {
  key: string;
  v: number;
  data: unknown;
}

const DB_NAME = 'CatalogStaticDB';
const DB_VERSION = 1;
const STORE = 'catalog';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => resolve(null);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      };
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function idbGetVersioned<T>(
  key: string,
  expectedVersion: number | null
): Promise<T | null> {
  const db = await openDB();
  if (!db) return null;
  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction([STORE], 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result as VersionedRecord | undefined;
        if (!result) {
          resolve(null);
          return;
        }
        if (expectedVersion != null && result.v === expectedVersion) {
          resolve(result.data as T);
          return;
        }
        resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbSetVersioned<T>(
  key: string,
  version: number | null,
  data: T
): Promise<void> {
  if (version == null) return;
  const db = await openDB();
  if (!db) return;
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE], 'readwrite');
      const store = tx.objectStore(STORE);
      const record: VersionedRecord = { key, v: version, data };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function idbRemove(key: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE], 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function idbRemovePrefix(prefix: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE], 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve();
          return;
        }
        if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
