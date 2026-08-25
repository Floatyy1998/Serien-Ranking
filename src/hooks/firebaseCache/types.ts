/**
 * Öffentliche Typen des Enhanced-Firebase-Cache-Hooks.
 * Aus useEnhancedFirebaseCache.ts extrahiert — Feldbedeutung unverändert.
 */
export interface EnhancedCacheOptions {
  ttl?: number;
  useRealtimeListener?: boolean;
  /** Use child_changed/added/removed instead of onValue for Record-type data.
   *  Dramatically reduces bandwidth: only changed children are downloaded, not the entire dataset. */
  useDeltaSync?: boolean;
  /** When set, child_changed listeners are placed on this sub-key of each child instead of on the child itself.
   *  E.g. 'seasons' → listens on {path}/{childKey}/seasons → only the changed season is downloaded.
   *
   *  ACHTUNG — derzeit von keinem Aufrufer genutzt, und das mit Absicht: die
   *  Option haengt pro Kind ZWEI Listener an (Kind + Sub-Key), Firebase
   *  synchronisiert daraufhin beide Teilbaeume. Bei 433 Serien gemessen 4357 kB
   *  statt 1847 kB empfangen pro App-Start, ohne die Startzeit zu verbessern.
   *  Vor dem Wiedereinschalten messen, nicht schaetzen. */
  deltaSubKey?: string;
  /** Firebase path to a version counter (e.g. 'users/{uid}/meta/serienVersion').
   *  On load: read this single number and compare with cached version.
   *  Match → skip full load. Mismatch → full load. Handles multi-device correctly. */
  versionPath?: string;
  enableOfflineSupport?: boolean;
  syncOnReconnect?: boolean;
  cacheInServiceWorker?: boolean;
}

export interface EnhancedCacheResult<T> {
  data: T | null;
  loading: boolean;
  /** True solange ein Delta-Sync-Full-Load laeuft (Cache steht, ist aber veraltet). */
  isSyncing: boolean;
  error: string | null;
  isStale: boolean;
  isOffline: boolean;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
}
