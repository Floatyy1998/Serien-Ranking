/**
 * 🚀 Enhanced useFirebaseCache Hook with Offline Support
 * Erweitert den ursprünglichen Hook um Service Worker und IndexedDB Integration
 */
import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useRef, useState } from 'react';
import { offlineFirebaseService } from '../services/offlineFirebaseService';
interface EnhancedCacheOptions {
  ttl?: number;
  useRealtimeListener?: boolean;
  enableOfflineSupport?: boolean;
  syncOnReconnect?: boolean;
  cacheInServiceWorker?: boolean;
}
interface EnhancedCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  isOffline: boolean;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
}
/**
 * Enhanced useFirebaseCache Hook with Offline-First capabilities
 */
export function useEnhancedFirebaseCache<T = any>(
  path: string,
  options: EnhancedCacheOptions = {}
): EnhancedCacheResult<T> {
  const {
    ttl = 5 * 60 * 1000, // 5 Minuten default
    useRealtimeListener = false,
    enableOfflineSupport = true,
    syncOnReconnect = true,
    cacheInServiceWorker = true,
  } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const listenerRef = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  /**
   * 📦 Daten aus allen verfügbaren Caches laden
   */
  const loadFromCache = useCallback(async (): Promise<T | null> => {
    if (!enableOfflineSupport) return null;
    try {
      // 1. Versuche IndexedDB Cache
      const cachedData = await offlineFirebaseService.getCachedData(path);
      if (cachedData) {
        return cachedData;
      }
      // 2. Fallback: Memory Cache (falls implementiert)
      // Hier könnte ein Memory-Cache implementiert werden
      return null;
    } catch (error) {
      console.error('❌ Cache loading failed:', error);
      return null;
    }
  }, [path, enableOfflineSupport]);
  /**
   * 💾 Daten in alle Caches speichern
   */
  const saveToCache = useCallback(
    async (newData: T): Promise<void> => {
      if (!enableOfflineSupport) return;
      try {
        // IndexedDB Cache
        await offlineFirebaseService.cacheData(path, newData, ttl);
        // Service Worker Cache (falls aktiviert)
        if (cacheInServiceWorker && 'serviceWorker' in navigator) {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_FIREBASE_DATA',
              data: { path, data: newData },
            });
          }
        }
      } catch (error) {
        console.error('❌ Cache saving failed:', error);
      }
    },
    [path, ttl, enableOfflineSupport, cacheInServiceWorker]
  );
  /**
   * 🌐 Daten aus Firebase laden
   */
  const fetchFromFirebase = useCallback(async (): Promise<T | null> => {
    if (!path) return null;
    try {
      const ref = firebase.database().ref(path);
      const snapshot = await ref.once('value');
      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        // Cache aktualisieren
        await saveToCache(firebaseData);
        return firebaseData;
      }
      return null;
    } catch (error) {
      console.error(`❌ Firebase fetch failed for ${path}:`, error);
      throw error;
    }
  }, [path, saveToCache]);
  /**
   * 🔄 Realtime Listener einrichten
   */
  const setupRealtimeListener = useCallback(() => {
    if (!path || !useRealtimeListener) return;
    try {
      const ref = firebase.database().ref(path);
      const listener = ref.on(
        'value',
        async (snapshot) => {
          if (snapshot.exists()) {
            const newData = snapshot.val();
            setData(newData);
            setLastUpdated(Date.now());
            setIsStale(false);
            setError(null);
            setIsOffline(false); // Successful realtime = online
            // Cache aktualisieren
            await saveToCache(newData);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (error) => {
          console.warn(`⚠️ Realtime listener error for ${path}:`, error);
          // Bei Netzwerkfehlern auf Cache zurückfallen
          const errorMessage = error?.message || error?.toString() || '';
          const isNetworkError =
            errorMessage.includes('network') ||
            errorMessage.includes('NETWORK') ||
            errorMessage.includes('ERR_INTERNET_DISCONNECTED');
          if (isNetworkError) {
            setIsOffline(true);
            loadFromCache().then((cachedData) => {
              if (cachedData) {
                setData(cachedData);
                setIsStale(true);
                setError('Offline - zeige gecachte Daten');
              } else {
                setError('Keine Offline-Daten verfügbar');
              }
              setLoading(false);
            });
          } else {
            setError(errorMessage || 'Firebase Fehler');
            setLoading(false);
          }
        }
      );
      listenerRef.current = () => ref.off('value', listener);
    } catch (error) {
      console.error('❌ Realtime listener setup failed:', error);
      setError(
        error instanceof Error ? error.message : 'Realtime setup failed'
      );
      setLoading(false);
    }
  }, [path, useRealtimeListener, saveToCache, loadFromCache]);
  /**
   * 🔄 Daten neu laden (Refetch)
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        // Online: Firebase laden
        const firebaseData = await fetchFromFirebase();
        setData(firebaseData);
        setLastUpdated(Date.now());
        setIsStale(false);
      } else {
        // Offline: Cache laden
        const cachedData = await loadFromCache();
        if (cachedData) {
          setData(cachedData);
          setIsStale(true); // Markiere als potentially stale
        } else {
          setError('Keine Offline-Daten verfügbar');
        }
      }
    } catch (error) {
      console.error('❌ Refetch failed:', error);
      // Fallback auf Cache bei Netzwerkfehler
      const cachedData = await loadFromCache();
      if (cachedData) {
        setData(cachedData);
        setIsStale(true);
        setError('Netzwerkfehler - zeige gecachte Daten');
      } else {
        setError(
          error instanceof Error ? error.message : 'Laden fehlgeschlagen'
        );
      }
    }
    setLoading(false);
  }, [path, fetchFromFirebase, loadFromCache]);
  /**
   * 🗑️ Cache leeren
   */
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      if (enableOfflineSupport) {
        await offlineFirebaseService.removeCachedData(path);
      }
    } catch (error) {
      console.error('❌ Cache clearing failed:', error);
    }
  }, [path, enableOfflineSupport]);
  /**
   * 🎧 Online/Offline Event Handler
   */
  useEffect(() => {
    if (!syncOnReconnect) return;
    const handleOnline = () => {
      setIsOffline(false);
      if (isStale || !data) {
        refetch();
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      setIsStale(true);
    };
    // Initiale Offline-Status setzen
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOnReconnect, isStale, data, refetch]);
  /**
   * 🚀 Initial Load Effect
   */
  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. SOFORT Cache laden für bessere UX (auch offline)
        const cachedData = await loadFromCache();
        if (cachedData) {
          setData(cachedData);
          setIsStale(!navigator.onLine); // Nur stale wenn offline
          setLoading(false); // Wichtig: Loading sofort beenden!
        } else {
        }
        // 2. Nur wenn online - Realtime Listener oder Fetch versuchen
        if (navigator.onLine) {
          if (useRealtimeListener) {
            setupRealtimeListener();
          } else {
            // 3. Versuche aktuellen Wert von Firebase zu laden
            try {
              const firebaseData = await fetchFromFirebase();
              // Nur aktualisieren wenn sich Daten geändert haben
              if (JSON.stringify(firebaseData) !== JSON.stringify(cachedData)) {
                setData(firebaseData);
                setIsStale(false);
                setLastUpdated(Date.now());
              }
            } catch (firebaseError) {
              console.warn(
                `⚠️ Firebase fetch failed, using cache: ${firebaseError}`
              );
              // Cache-Daten bleiben bestehen
            }
            setLoading(false);
          }
        } else {
          // Offline Modus
          setIsOffline(true);
          if (!cachedData) {
            setError('Offline - keine Daten verfügbar');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error(`❌ Initial load failed for ${path}:`, error);
        // Letzter Versuch: Cache laden
        const fallbackCache = await loadFromCache();
        if (fallbackCache) {
          setData(fallbackCache);
          setIsStale(true);
          setError('Fehler beim Laden - zeige gecachte Daten');
        } else {
          setError(
            error instanceof Error ? error.message : 'Laden fehlgeschlagen'
          );
        }
        setLoading(false);
      }
    };
    loadData();
    // Cleanup
    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    path,
    useRealtimeListener,
    loadFromCache,
    setupRealtimeListener,
    fetchFromFirebase,
  ]);
  return {
    data,
    loading,
    error,
    isStale,
    isOffline,
    lastUpdated,
    refetch,
    clearCache,
  };
}
export default useEnhancedFirebaseCache;
