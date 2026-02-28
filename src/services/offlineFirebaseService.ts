/**
 * 🚀 Offline-First Firebase Cache Service
 * Erweitert useFirebaseCache um Service Worker Integration
 */

import { serviceWorkerManager } from './serviceWorkerManager';

interface OfflineCacheConfig {
  enableServiceWorker: boolean;
  enableIndexedDB: boolean;
  syncOnReconnect: boolean;
  maxOfflineTime: number; // Milliseconds
}

interface OfflineQueueItem {
  id: string;
  path: string;
  operation: 'set' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

interface CachedUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata: unknown;
  cachedAt: number;
}

interface FirebaseUserLike {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata: unknown;
}

class OfflineFirebaseService {
  private config: OfflineCacheConfig;
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private dbPromise: Promise<IDBDatabase> | null = null;

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

  /**
   * 🔧 Service Initialisierung
   */
  private async init(): Promise<void> {
    try {
      if (this.config.enableIndexedDB) {
        await this.initIndexedDB();
      }

      this.setupEventListeners();

      // Restore offline queue from IndexedDB
      await this.restoreOfflineQueue();
    } catch (error) {
      // Offline Firebase Service Initialisierung fehlgeschlagen
    }
  }

  /**
   * 🗄️ IndexedDB Initialisierung
   */
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

  /**
   * 🎧 Event Listeners Setup
   */
  private setupEventListeners(): void {
    // Online/Offline Status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Service Worker Messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          this.handleSyncComplete(event.data.results);
        }
      });
    }
  }

  /**
   * 📦 Firebase Daten mit Offline Support cachen
   */
  public async cacheData(path: string, data: unknown, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const cacheItem = {
        path,
        data,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl,
      };

      // IndexedDB Cache
      if (this.config.enableIndexedDB) {
        await this.storeInIndexedDB('firebaseCache', cacheItem);
      }

      // Service Worker Cache
      if (this.config.enableServiceWorker) {
        serviceWorkerManager.cacheFirebaseData(path, data);
      }
    } catch (error) {
      // console.error('Cache Speicherung fehlgeschlagen:', error);
    }
  }

  /**
   * 🔍 Cached Daten abrufen
   */
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

          // Check TTL
          if (Date.now() > result.expiresAt) {
            // Expired, remove from cache
            this.removeCachedData(path);
            resolve(null);
            return;
          }

          resolve(result.data);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // console.error('Cache Abruf fehlgeschlagen:', error);
      return null;
    }
  }

  /**
   * 🗑️ Cached Daten entfernen
   */
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
    } catch (error) {
      // console.error('Cache Löschung fehlgeschlagen:', error);
    }
  }

  /**
   * 📤 Firebase Operation in Offline Queue
   */
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

    // Speichere in IndexedDB für Persistenz
    if (this.config.enableIndexedDB) {
      await this.storeInIndexedDB('offlineQueue', queueItem);
    }

    // Versuche sofort zu synchronisieren falls online
    if (this.isOnline) {
      await this.processOfflineQueue();
    } else {
      // Registriere Background Sync
      await serviceWorkerManager.registerBackgroundSync('firebase-sync');
    }
  }

  /**
   * 🔄 Offline Queue abarbeiten
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const processedItems: string[] = [];

    for (const item of this.offlineQueue) {
      try {
        await this.executeQueuedOperation(item);
        processedItems.push(item.id);
      } catch (error) {
        // console.error(`Operation fehlgeschlagen: ${item.operation} ${item.path}`, error);

        // Erhöhe Retry Count
        item.retryCount += 1;

        // Entferne nach 3 Versuchen oder wenn zu alt
        const isExpired = Date.now() - item.timestamp > this.config.maxOfflineTime;
        if (item.retryCount >= 3 || isExpired) {
          processedItems.push(item.id);
        }
      }
    }

    // Entferne verarbeitete Items
    this.offlineQueue = this.offlineQueue.filter((item) => !processedItems.includes(item.id));

    // Update IndexedDB
    if (this.config.enableIndexedDB) {
      for (const itemId of processedItems) {
        await this.removeFromIndexedDB('offlineQueue', itemId);
      }
    }
  }

  /**
   * ⚡ Einzelne Operation ausführen
   */
  private async executeQueuedOperation(item: OfflineQueueItem): Promise<void> {
    // Hier würde die tatsächliche Firebase Operation ausgeführt
    // Diese Implementierung hängt von Ihrer Firebase-Konfiguration ab

    const { path, operation, data } = item;

    switch (operation) {
      case 'set':
        // await firebase.database().ref(path).set(data);
        break;
      case 'update':
        // await firebase.database().ref(path).update(data);
        break;
      case 'delete':
        // await firebase.database().ref(path).remove();
        break;
    }

    // Nach erfolgreicher Operation: Cache aktualisieren
    if (operation === 'delete') {
      await this.removeCachedData(path);
    } else {
      await this.cacheData(path, data);
    }
  }

  /**
   * 🔄 Offline Queue aus IndexedDB wiederherstellen
   */
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
        // Entferne abgelaufene Items
        return Date.now() - item.timestamp < this.config.maxOfflineTime;
      });
    } catch (error) {
      // console.error('❌ Offline Queue Wiederherstellung fehlgeschlagen:', error);
    }
  }

  /**
   * ✅ Sync Complete Handler
   */
  private handleSyncComplete(_results: unknown): void {
    // Hier können Sie UI Updates oder weitere Aktionen durchführen
  }

  /**
   * 🗄️ IndexedDB Helper Funktionen
   */
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
    } catch (error) {
      // console.error(`❌ IndexedDB Speicherung fehlgeschlagen (${storeName}):`, error);
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
    } catch (error) {
      // console.error(`❌ IndexedDB Löschung fehlgeschlagen (${storeName}):`, error);
    }
  }

  /**
   * 📊 Public API für Cache Management
   */
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
    } catch (error) {
      // console.error('❌ Cache-Löschung fehlgeschlagen:', error);
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
      // IndexedDB Size
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

      // Service Worker Size
      if (this.config.enableServiceWorker) {
        const swStats = await serviceWorkerManager.getCacheStatistics();
        stats.serviceWorkerSize = swStats.totalSize;
      }
    } catch (error) {
      // console.error('❌ Statistik-Abruf fehlgeschlagen:', error);
    }

    return stats;
  }

  /**
   * 🔌 Online/Offline Status
   */
  public get isOffline(): boolean {
    return !this.isOnline;
  }

  public get queueSize(): number {
    return this.offlineQueue.length;
  }

  /**
   * 👤 User Cache Management
   */
  public async cacheUser(user: FirebaseUserLike): Promise<void> {
    if (!user) return;

    try {
      const userData: CachedUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        metadata: user.metadata,
        cachedAt: Date.now(),
      };

      // Store in localStorage for quick access
      localStorage.setItem('cachedUser', JSON.stringify(userData));

      // Also store in IndexedDB for persistence
      if (this.config.enableIndexedDB) {
        await this.cacheData(`user_${user.uid}`, userData);
      }
    } catch (error) {
      console.error('Failed to cache user:', error);
    }
  }

  public async getCachedUser(): Promise<CachedUserData | null> {
    try {
      // Try localStorage first
      const cached = localStorage.getItem('cachedUser');
      if (cached) {
        const userData = JSON.parse(cached);
        // Check if cache is not too old (24 hours)
        if (Date.now() - userData.cachedAt < 24 * 60 * 60 * 1000) {
          return userData;
        }
      }

      // Fallback to IndexedDB
      if (this.config.enableIndexedDB) {
        const db = await this.initIndexedDB();
        const transaction = db.transaction(['firebaseCache'], 'readonly');
        const store = transaction.objectStore('firebaseCache');

        return new Promise((resolve, reject) => {
          const request = store.get('user_*');
          request.onsuccess = () => resolve(request.result?.data || null);
          request.onerror = () => reject(request.error);
        });
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached user:', error);
      return null;
    }
  }

  public async clearCachedUser(): Promise<void> {
    try {
      localStorage.removeItem('cachedUser');

      if (this.config.enableIndexedDB) {
        const db = await this.initIndexedDB();
        const transaction = db.transaction(['firebaseCache'], 'readwrite');
        const store = transaction.objectStore('firebaseCache');

        await new Promise<void>((resolve, reject) => {
          const request = store.delete('user_*');
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Failed to clear cached user:', error);
    }
  }
}

// Singleton Instance
export const offlineFirebaseService = new OfflineFirebaseService();

// Type Exports
export type { OfflineCacheConfig, OfflineQueueItem };
