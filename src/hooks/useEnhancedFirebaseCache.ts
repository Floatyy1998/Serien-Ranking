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
  /** Use child_changed/added/removed instead of onValue for Record-type data.
   *  Dramatically reduces bandwidth: only changed children are downloaded, not the entire dataset. */
  useDeltaSync?: boolean;
  /** When set, child_changed listeners are placed on this sub-key of each child instead of on the child itself.
   *  E.g. 'seasons' → listens on {path}/{childKey}/seasons → only the changed season is downloaded. */
  deltaSubKey?: string;
  /** Firebase path to a version counter (e.g. '{uid}/serienVersion').
   *  On load: read this single number and compare with cached version.
   *  Match → skip full load. Mismatch → full load. Handles multi-device correctly. */
  versionPath?: string;
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
export function useEnhancedFirebaseCache<T = unknown>(
  path: string,
  options: EnhancedCacheOptions = {}
): EnhancedCacheResult<T> {
  const {
    ttl = 5 * 60 * 1000, // 5 Minuten default
    useRealtimeListener = false,
    useDeltaSync = false,
    deltaSubKey,
    versionPath,
    enableOfflineSupport = true,
    syncOnReconnect = true,
    cacheInServiceWorker = true,
  } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path); // Nur loading wenn es einen path gibt
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
        return cachedData as T;
      }
      // 2. Fallback: Memory Cache (falls implementiert)
      // Hier könnte ein Memory-Cache implementiert werden
      return null;
    } catch {
      // console.error('❌ Cache loading failed:', error);
      return null;
    }
  }, [path, enableOfflineSupport]);
  /**
   * 💾 Daten in alle Caches speichern
   */
  const versionRef = useRef<number | undefined>(undefined);
  const saveToCache = useCallback(
    async (newData: T): Promise<void> => {
      if (!enableOfflineSupport) return;
      try {
        // IndexedDB Cache (mit Version falls vorhanden)
        await offlineFirebaseService.cacheData(path, newData, ttl, versionRef.current);
        // Service Worker Cache (falls aktiviert)
        if (cacheInServiceWorker && 'serviceWorker' in navigator) {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_FIREBASE_DATA',
              data: { path, data: newData },
            });
          }
        }
      } catch {
        // console.error('❌ Cache saving failed:', error);
      }
    },
    [path, ttl, enableOfflineSupport, cacheInServiceWorker]
  );
  /**
   * 🌐 Daten aus Firebase laden
   */
  const fetchFromFirebase = useCallback(async (): Promise<T | null> => {
    if (!path) return null;
    const ref = firebase.database().ref(path);
    const snapshot = await ref.once('value');
    if (snapshot.exists()) {
      const firebaseData = snapshot.val();
      // Cache aktualisieren
      await saveToCache(firebaseData);
      return firebaseData;
    }
    return null;
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
          // console.warn(`⚠️ Realtime listener error for ${path}:`, error);
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
      // console.error('❌ Realtime listener setup failed:', error);
      setError(error instanceof Error ? error.message : 'Realtime setup failed');
      setLoading(false);
    }
  }, [path, useRealtimeListener, saveToCache, loadFromCache]);
  /**
   * 🔄 Delta Sync Listener einrichten (child_changed/added/removed)
   * Spart massiv Bandbreite: Nur geänderte Kinder werden heruntergeladen, nicht der gesamte Datensatz.
   */
  /**
   * Hilfsfunktion: Delta-Listener auf Basis von initialData aufsetzen.
   * Wird sowohl beim initialen Setup als auch nach Full-Load verwendet.
   */
  const attachDeltaListeners = useCallback(
    (ref: firebase.database.Reference, initialData: T) => {
      const cleanups: (() => void)[] = [];

      // Deep delta: Listener pro Child auf deren Sub-Key (z.B. seasons)
      const subKeyName = deltaSubKey ?? '';
      const attachSubListener = (childKey: string) => {
        const subRef = firebase.database().ref(`${path}/${childKey}/${subKeyName}`);
        const onSubChanged = subRef.on('child_changed', (snap) => {
          const subChildKey = snap.key;
          if (!subChildKey) return;
          setData((prev) => {
            const prevRecord = prev as Record<string, Record<string, unknown>>;
            const child = prevRecord[childKey];
            if (!child) return prev;
            const subCollection = child[subKeyName];
            let updatedSub: unknown;
            if (Array.isArray(subCollection)) {
              updatedSub = [...subCollection];
              (updatedSub as unknown[])[Number(subChildKey)] = snap.val();
            } else {
              updatedSub = {
                ...(subCollection as Record<string, unknown>),
                [subChildKey]: snap.val(),
              };
            }
            const updated = {
              ...prevRecord,
              [childKey]: { ...child, [subKeyName]: updatedSub },
            } as T;
            saveToCache(updated);
            return updated;
          });
          setLastUpdated(Date.now());
        });
        cleanups.push(() => subRef.off('child_changed', onSubChanged));
      };

      if (deltaSubKey) {
        for (const childKey of Object.keys(initialData as Record<string, unknown>)) {
          attachSubListener(childKey);

          // Property-Level Listener: fängt rating, hidden, watchlist etc.
          // Überspringt deltaSubKey (z.B. seasons) — das deckt der Deep-Listener ab.
          const propRef = firebase.database().ref(`${path}/${childKey}`);
          const onPropChanged = propRef.on('child_changed', (snap) => {
            const propKey = snap.key;
            if (!propKey || propKey === subKeyName) return;
            setData((prev) => {
              const prevRecord = prev as Record<string, Record<string, unknown>>;
              const child = prevRecord[childKey];
              if (!child) return prev;
              const updated = {
                ...prevRecord,
                [childKey]: { ...child, [propKey]: snap.val() },
              } as T;
              saveToCache(updated);
              return updated;
            });
            setLastUpdated(Date.now());
          });
          cleanups.push(() => propRef.off('child_changed', onPropChanged));
        }
      } else {
        const onChanged = ref.on('child_changed', (snap) => {
          const key = snap.key;
          if (!key) return;
          setData((prev) => {
            const updated = {
              ...(prev as Record<string, unknown>),
              [key]: snap.val(),
            } as T;
            saveToCache(updated);
            return updated;
          });
          setLastUpdated(Date.now());
        });
        cleanups.push(() => ref.off('child_changed', onChanged));
      }

      // child_added: Fängt neue Kinder (z.B. neu hinzugefügte Serien vom Server).
      // Initiale Kinder werden übersprungen (knownKeys), nur echte Neueinträge laden.
      const knownKeys = new Set<string>(
        initialData && typeof initialData === 'object' ? Object.keys(initialData) : []
      );
      const onAdded = ref.on('child_added', (snap) => {
        const key = snap.key;
        if (!key) return;
        if (knownKeys.has(key)) {
          knownKeys.delete(key);
          return;
        }
        setData((prev) => {
          const updated = {
            ...(prev as Record<string, unknown>),
            [key]: snap.val(),
          } as T;
          saveToCache(updated);
          return updated;
        });
        setLastUpdated(Date.now());
        if (deltaSubKey) {
          attachSubListener(key);
          // Property-Level Listener für neues Kind
          const propRef = firebase.database().ref(`${path}/${key}`);
          const onPropChanged = propRef.on('child_changed', (snap) => {
            const propKey = snap.key;
            if (!propKey || propKey === subKeyName) return;
            setData((prev) => {
              const prevRecord = prev as Record<string, Record<string, unknown>>;
              const child = prevRecord[key];
              if (!child) return prev;
              const updated = {
                ...prevRecord,
                [key]: { ...child, [propKey]: snap.val() },
              } as T;
              saveToCache(updated);
              return updated;
            });
            setLastUpdated(Date.now());
          });
          cleanups.push(() => propRef.off('child_changed', onPropChanged));
        }
      });
      cleanups.push(() => ref.off('child_added', onAdded));

      const onRemoved = ref.on('child_removed', (snap) => {
        const key = snap.key;
        if (!key) return;
        setData((prev) => {
          if (!prev || typeof prev !== 'object') return prev;
          const copy = { ...(prev as Record<string, unknown>) };
          delete copy[key];
          const updated = copy as T;
          saveToCache(updated);
          return updated;
        });
        setLastUpdated(Date.now());
      });
      cleanups.push(() => ref.off('child_removed', onRemoved));

      listenerRef.current = () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    [path, deltaSubKey, saveToCache]
  );

  const doFullLoadAndAttach = useCallback(
    async (ref: firebase.database.Reference) => {
      try {
        // Version von Firebase lesen und speichern
        if (versionPath) {
          const vSnap = await firebase.database().ref(versionPath).once('value');
          versionRef.current = vSnap.val() ?? undefined;
        }
        const snapshot = await ref.once('value');
        const initialData = (snapshot.val() || {}) as T;
        setData(initialData);
        setLastUpdated(Date.now());
        setIsStale(false);
        setError(null);
        setLoading(false);
        await saveToCache(initialData);
        attachDeltaListeners(ref, initialData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : err?.toString?.() || 'Firebase Fehler';
        const isNetworkError =
          errorMessage.includes('network') ||
          errorMessage.includes('NETWORK') ||
          errorMessage.includes('ERR_INTERNET_DISCONNECTED');
        if (isNetworkError) {
          setIsOffline(true);
          const cached = await loadFromCache();
          if (cached) {
            setData(cached);
            setIsStale(true);
          } else {
            setError('Keine Offline-Daten verfügbar');
          }
        } else {
          setError(errorMessage);
        }
        setLoading(false);
      }
    },
    [versionPath, attachDeltaListeners, saveToCache, loadFromCache]
  );

  const setupDeltaListener = useCallback(
    async (existingCacheData?: T | null) => {
      if (!path || !useDeltaSync) return;
      const ref = firebase.database().ref(path);

      // Kein Cache → Full-Load
      if (!existingCacheData || typeof existingCacheData !== 'object') {
        await doFullLoadAndAttach(ref);
        return;
      }

      // Cache vorhanden + Version-Check konfiguriert → nur eine Zahl lesen
      if (versionPath) {
        try {
          const [remoteVersionSnap, cachedVersion] = await Promise.all([
            firebase.database().ref(versionPath).once('value'),
            offlineFirebaseService.getCacheVersion(path),
          ]);
          const remoteVersion: number | null = remoteVersionSnap.val();
          versionRef.current = remoteVersion ?? undefined;

          if (remoteVersion !== null && cachedVersion !== null && remoteVersion === cachedVersion) {
            // Version stimmt überein → Cache ist aktuell, kein Full-Load nötig
            attachDeltaListeners(ref, existingCacheData);
            return;
          }

          // Version unterschiedlich → Daten haben sich auf anderem Gerät geändert → Full-Load
          await doFullLoadAndAttach(ref);
        } catch {
          // Version-Check fehlgeschlagen → sicherheitshalber Full-Load
          await doFullLoadAndAttach(ref);
        }
        return;
      }

      // Kein versionPath konfiguriert → Cache vertrauen, direkt Listener aufsetzen
      attachDeltaListeners(ref, existingCacheData);
    },
    [path, useDeltaSync, versionPath, attachDeltaListeners, doFullLoadAndAttach]
  );
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
      // console.error('❌ Refetch failed:', error);
      // Fallback auf Cache bei Netzwerkfehler
      const cachedData = await loadFromCache();
      if (cachedData) {
        setData(cachedData);
        setIsStale(true);
        setError('Netzwerkfehler - zeige gecachte Daten');
      } else {
        setError(error instanceof Error ? error.message : 'Laden fehlgeschlagen');
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
    } catch {
      // console.error('❌ Cache clearing failed:', error);
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
        }
        // 2. Nur wenn online - Realtime Listener oder Fetch versuchen
        if (navigator.onLine) {
          if (useDeltaSync) {
            setupDeltaListener(cachedData);
          } else if (useRealtimeListener) {
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
            } catch {
              // console.warn(`⚠️ Firebase fetch failed, using cache: ${firebaseError}`);
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
        // console.error(`❌ Initial load failed for ${path}:`, error);
        // Letzter Versuch: Cache laden
        const fallbackCache = await loadFromCache();
        if (fallbackCache) {
          setData(fallbackCache);
          setIsStale(true);
          setError('Fehler beim Laden - zeige gecachte Daten');
        } else {
          setError(error instanceof Error ? error.message : 'Laden fehlgeschlagen');
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
    useDeltaSync,
    loadFromCache,
    setupRealtimeListener,
    setupDeltaListener,
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
