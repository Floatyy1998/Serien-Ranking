/**
 * Offline-First Firebase Cache Service
 * Erweitert useFirebaseCache um Service Worker Integration
 */

import { serviceWorkerManager } from './serviceWorkerManager';
import type {
  OfflineCacheConfig,
  OfflineQueueItem,
  CachedUserData,
  FirebaseUserLike,
} from './offlineFirebaseTypes';
import {
  cacheUserToStorage,
  getCachedUserFromStorage,
  clearCachedUserFromStorage,
} from './offlineUserCache';

class OfflineFirebaseService {
  private config: OfflineCacheConfig;
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private eventListenersAttached = false;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private swMessageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(config: Partial<OfflineCacheConfig> = {}) {
    this.config = {
      enableServiceWorker: true,
      enableIndexedDB: true,
      syncOnReconnect: true,
      maxOfflineTime: 24 * 60 * 60 * 1000, // 24 Stunden
      ...config,
    };

    this.init();
  }

  private async init(): Promise<void> {
    try {
      if (this.config.enableIndexedDB) {
        await this.initIndexedDB();
      }

      this.setupEventListeners();

      // Restore offline queue from IndexedDB
      await this.restoreOfflineQueue();
    } catch {
      // Offline Firebase Service Initialisierung fehlgeschlagen
    }
  }

  private async initIndexedDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('SerienRankingOfflineDB', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Firebase Cache Store
        if (!db.objectStoreNames.contains('firebaseCache')) {
          const cacheStore = db.createObjectStore('firebaseCache', {
            keyPath: 'path',
          });
          cacheStore.createIndex('timestamp', 'timestamp');
          cacheStore.createIndex('ttl', 'ttl');
        }

        // Offline Queue Store
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', {
            keyPath: 'id',
          });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('path', 'path');
        }

        // User Activities Store
        if (!db.objectStoreNames.contains('userActivities')) {
          const activitiesStore = db.createObjectStore('userActivities', {
            keyPath: 'id',
          });
          activitiesStore.createIndex('timestamp', 'timestamp');
          activitiesStore.createIndex('userId', 'userId');
        }
      };
    });

    return this.dbPromise;
  }

  private setupEventListeners(): void {
    if (this.eventListenersAttached) return;
    this.eventListenersAttached = true;

    this.onlineHandler = () => {
      this.isOnline = true;
      this.processOfflineQueue();
    };
    this.offlineHandler = () => {
      this.isOnline = false;
    };
    this.swMessageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        this.handleSyncComplete(event.data.results);
      }
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.swMessageHandler);
    }
  }

  public async cacheData(
    path: string,
    data: unknown,
    ttl: number = 5 * 60 * 1000,
    version?: number
  ): Promise<void> {
    try {
      const cacheItem = {
        path,
        data,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl,
        ...(version !== undefined && { version }),
      };

      if (this.config.enableIndexedDB) {
        await this.storeInIndexedDB('firebaseCache', cacheItem);
      }

      if (this.config.enableServiceWorker) {
        serviceWorkerManager.cacheFirebaseData(path, data);
      }
    } catch {
      // console.error('Cache Speicherung fehlgeschlagen:', error);
    }
  }

  public async getCachedData(path: string): Promise<unknown | null> {
    try {
      if (!this.config.enableIndexedDB) return null;

      const db = await this.initIndexedDB();
      const transaction = db.transaction(['firebaseCache'], 'readonly');
      const store = transaction.objectStore('firebaseCache');

      return new Promise((resolve, reject) => {
        const request = store.get(path);
        request.onsuccess = () => {
          const result = request.result;

          if (!result) {
            resolve(null);
            return;
          }

          if (Date.now() > result.expiresAt) {
            this.removeCachedData(path);
            resolve(null);
            return;
          }

          resolve(result.data);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      // console.error('Cache Abruf fehlgeschlagen:', error);
      return null;
    }
  }

  public async getCacheVersion(path: string): Promise<number | null> {
    try {
      if (!this.config.enableIndexedDB) return null;
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['firebaseCache'], 'readonly');
      const store = transaction.objectStore('firebaseCache');
      return new Promise((resolve, reject) => {
        const request = store.get(path);
        request.onsuccess = () => {
          const result = request.result;
          if (!result || Date.now() > result.expiresAt) {
            resolve(null);
            return;
          }
          resolve(result.version ?? null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  public async removeCachedData(path: string): Promise<void> {
    try {
      if (!this.config.enableIndexedDB) return;

      const db = await this.initIndexedDB();
      const transaction = db.transaction(['firebaseCache'], 'readwrite');
      const store = transaction.objectStore('firebaseCache');

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(path);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // console.error('Cache Löschung fehlgeschlagen:', error);
    }
  }

  public async queueOperation(
    path: string,
    operation: 'set' | 'update' | 'delete',
    data: unknown
  ): Promise<void> {
    const queueItem: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.push(queueItem);

    if (this.config.enableIndexedDB) {
      await this.storeInIndexedDB('offlineQueue', queueItem);
    }

    if (this.isOnline) {
      await this.processOfflineQueue();
    } else {
      await serviceWorkerManager.registerBackgroundSync('firebase-sync');
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const processedItems: string[] = [];

    for (const item of this.offlineQueue) {
      try {
        await this.executeQueuedOperation(item);
        processedItems.push(item.id);
      } catch {
        item.retryCount += 1;

        const isExpired = Date.now() - item.timestamp > this.config.maxOfflineTime;
        if (item.retryCount >= 3 || isExpired) {
          processedItems.push(item.id);
        }
      }
    }

    this.offlineQueue = this.offlineQueue.filter((item) => !processedItems.includes(item.id));

    if (this.config.enableIndexedDB) {
      for (const itemId of processedItems) {
        await this.removeFromIndexedDB('offlineQueue', itemId);
      }
    }
  }

  private async executeQueuedOperation(item: OfflineQueueItem): Promise<void> {
    const { path, operation, data } = item;

    switch (operation) {
      case 'set':
        break;
      case 'update':
        break;
      case 'delete':
        break;
    }

    if (operation === 'delete') {
      await this.removeCachedData(path);
    } else {
      await this.cacheData(path, data);
    }
  }

  private async restoreOfflineQueue(): Promise<void> {
    try {
      if (!this.config.enableIndexedDB) return;

      const db = await this.initIndexedDB();
      const transaction = db.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');

      const items = await new Promise<OfflineQueueItem[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      this.offlineQueue = items.filter((item) => {
        return Date.now() - item.timestamp < this.config.maxOfflineTime;
      });
    } catch {
      // console.error('Offline Queue Wiederherstellung fehlgeschlagen:', error);
    }
  }

  private handleSyncComplete(_results: unknown): void {
    // Hier können Sie UI Updates oder weitere Aktionen durchführen
  }

  private async storeInIndexedDB(storeName: string, data: unknown): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // console.error(`IndexedDB Speicherung fehlgeschlagen (${storeName}):`, error);
    }
  }

  private async removeFromIndexedDB(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // console.error(`IndexedDB Löschung fehlgeschlagen (${storeName}):`, error);
    }
  }

  public async clearAllCaches(): Promise<void> {
    try {
      if (this.config.enableIndexedDB) {
        const db = await this.initIndexedDB();
        const transaction = db.transaction(['firebaseCache'], 'readwrite');
        const store = transaction.objectStore('firebaseCache');
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      if (this.config.enableServiceWorker) {
        await serviceWorkerManager.clearCache();
      }
    } catch {
      // console.error('Cache-Löschung fehlgeschlagen:', error);
    }
  }

  public async getCacheStatistics(): Promise<{
    indexedDBSize: number;
    serviceWorkerSize: number;
    offlineQueueSize: number;
  }> {
    const stats = {
      indexedDBSize: 0,
      serviceWorkerSize: 0,
      offlineQueueSize: this.offlineQueue.length,
    };

    try {
      if (this.config.enableIndexedDB) {
        const db = await this.initIndexedDB();
        const transaction = db.transaction(['firebaseCache'], 'readonly');
        const store = transaction.objectStore('firebaseCache');

        const count = await new Promise<number>((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        stats.indexedDBSize = count;
      }

      if (this.config.enableServiceWorker) {
        const swStats = await serviceWorkerManager.getCacheStatistics();
        stats.serviceWorkerSize = swStats.totalSize;
      }
    } catch {
      // console.error('Statistik-Abruf fehlgeschlagen:', error);
    }

    return stats;
  }

  public get isOffline(): boolean {
    return !this.isOnline;
  }

  public get queueSize(): number {
    return this.offlineQueue.length;
  }

  public async cacheUser(user: FirebaseUserLike): Promise<void> {
    await cacheUserToStorage(user, this.config.enableIndexedDB, (path, data) =>
      this.cacheData(path, data)
    );
  }

  public async getCachedUser(): Promise<CachedUserData | null> {
    return getCachedUserFromStorage(this.config.enableIndexedDB, () => this.initIndexedDB());
  }

  public async clearCachedUser(): Promise<void> {
    await clearCachedUserFromStorage(this.config.enableIndexedDB, () => this.initIndexedDB());
  }
}

// Singleton Instance
export const offlineFirebaseService = new OfflineFirebaseService();
