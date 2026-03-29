export interface OfflineCacheConfig {
  enableServiceWorker: boolean;
  enableIndexedDB: boolean;
  syncOnReconnect: boolean;
  maxOfflineTime: number; // Milliseconds
}

export interface OfflineQueueItem {
  id: string;
  path: string;
  operation: 'set' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

export interface CachedUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata: unknown;
  cachedAt: number;
}

export interface FirebaseUserLike {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata: unknown;
}
