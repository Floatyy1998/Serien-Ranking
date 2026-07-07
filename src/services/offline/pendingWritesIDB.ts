/**
 * IndexedDB-Storage für die persistente Offline-Write-Queue.
 *
 * Eigene kleine DB (`PendingWritesDB`), getrennt vom Catalog-Cache
 * (`CatalogStaticDB`, siehe `services/catalogIDB.ts` — gleiches defensives Muster:
 * jede Operation resolved auch bei Fehlern, damit ein kaputtes/fehlendes
 * IndexedDB nie einen Mark-Flow blockiert). Ohne IndexedDB (sehr alte
 * Browser, manche Private-Modes) degradiert die Queue zum No-op — dann gilt
 * wie bisher: Offline-Marks überleben keinen Reload.
 */

import type { PendingWriteEntry, PendingWriteStorage } from './pendingWriteQueue';

const DB_NAME = 'PendingWritesDB';
const DB_VERSION = 1;
const STORE = 'pendingWrites';

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
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function getAll(): Promise<PendingWriteEntry[]> {
  const db = await openDB();
  if (!db) return [];
  return new Promise<PendingWriteEntry[]>((resolve) => {
    try {
      const tx = db.transaction([STORE], 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as PendingWriteEntry[]) || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function put(entry: PendingWriteEntry): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE], 'readwrite');
      const req = tx.objectStore(STORE).put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function remove(id: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE], 'readwrite');
      const req = tx.objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export const idbPendingWriteStorage: PendingWriteStorage = { getAll, put, remove };
