/**
 * 🚀 Enhanced useFirebaseCache Hook with Offline Support
 * Erweitert den ursprünglichen Hook um Service Worker und IndexedDB Integration
 *
 * Komponierender Hook — die Einzelteile leben in ./firebaseCache/:
 * - cacheIO.ts          IndexedDB/SW-Cache lesen/schreiben/leeren
 * - deltaListener.ts    child_added/changed/removed-Wiring (Delta-Sync)
 * - deltaMerge.ts       pure Merge-Logik der Delta-Events
 * - realtimeListener.ts einzelner .on('value')-Listener
 * - versionCheck.ts     serienVersion-Vergleich (versionPath-Skip)
 * - guards.ts           Snapshot-/Netzwerkfehler-Guards
 * - reconnect.ts        Online/Offline-Reconnect-Sync
 */
import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearCachedPath,
  loadFromCache as loadFromCacheIO,
  saveToCache as saveToCacheIO,
} from './firebaseCache/cacheIO';
import { attachDeltaListeners } from './firebaseCache/deltaListener';
import {
  isEmptySnapshot,
  isNetworkErrorMessage,
  shouldKeepPreviousData,
} from './firebaseCache/guards';
import { attachRealtimeListener } from './firebaseCache/realtimeListener';
import { useReconnectSync } from './firebaseCache/reconnect';
import type { EnhancedCacheOptions, EnhancedCacheResult } from './firebaseCache/types';
import {
  fetchRemoteVersion,
  fetchVersionPair,
  normalizeVersion,
  versionsMatch,
} from './firebaseCache/versionCheck';

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
  const loadFromCache = useCallback(
    (): Promise<T | null> => loadFromCacheIO<T>(path, enableOfflineSupport),
    [path, enableOfflineSupport]
  );
  /**
   * 💾 Daten in alle Caches speichern
   */
  const versionRef = useRef<number | undefined>(undefined);
  const saveToCache = useCallback(
    (newData: T): Promise<void> =>
      saveToCacheIO<T>(path, newData, {
        ttl,
        version: versionRef.current,
        enableOfflineSupport,
        cacheInServiceWorker,
      }),
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
    // Detach any previous listener before attaching a new one to avoid duplicates
    if (listenerRef.current) {
      try {
        listenerRef.current();
      } catch {
        // ignore
      }
      listenerRef.current = null;
    }
    listenerRef.current = attachRealtimeListener<T>(path, {
      setData,
      setLastUpdated,
      setIsStale,
      setIsOffline,
      setError,
      setLoading,
      saveToCache,
      loadFromCache,
    });
  }, [path, useRealtimeListener, saveToCache, loadFromCache]);
  /**
   * 🔄 Delta Sync Listener einrichten (child_changed/added/removed)
   * Spart massiv Bandbreite: Nur geänderte Kinder werden heruntergeladen, nicht der gesamte Datensatz.
   */
  /**
   * Hilfsfunktion: Delta-Listener auf Basis von initialData aufsetzen.
   * Wird sowohl beim initialen Setup als auch nach Full-Load verwendet.
   */
  const attachDelta = useCallback(
    (ref: firebase.database.Reference, initialData: T) => {
      listenerRef.current = attachDeltaListeners<T>(ref, initialData, {
        path,
        deltaSubKey,
        setData,
        setLastUpdated,
        saveToCache,
      });
    },
    [path, deltaSubKey, saveToCache]
  );

  const doFullLoadAndAttach = useCallback(
    async (ref: firebase.database.Reference) => {
      try {
        // Version von Firebase lesen und speichern
        if (versionPath) {
          versionRef.current = await fetchRemoteVersion(versionPath);
        }
        const snapshot = await ref.once('value');
        const initialData = (snapshot.val() || {}) as T;
        // Bei einem Reconnect-Glitch kann snapshot.val() null sein obwohl
        // der User echte Daten hat → bestehenden State NICHT durch leeres
        // Object ersetzen, sonst wirken alle Episoden ploetzlich "ungesehen".
        const isEmpty = isEmptySnapshot(snapshot.exists(), initialData as object);
        setData((prev) => (shouldKeepPreviousData(isEmpty, prev) ? prev : initialData));
        setLastUpdated(Date.now());
        setIsStale(false);
        setError(null);
        setLoading(false);
        if (!isEmpty) await saveToCache(initialData);
        attachDelta(ref, initialData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : err?.toString?.() || 'Firebase Fehler';
        if (isNetworkErrorMessage(errorMessage)) {
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
    [versionPath, attachDelta, saveToCache, loadFromCache]
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
          const { remoteVersion, cachedVersion } = await fetchVersionPair(versionPath, path);
          versionRef.current = normalizeVersion(remoteVersion);

          if (versionsMatch(remoteVersion, cachedVersion)) {
            // Version stimmt überein → Cache ist aktuell, kein Full-Load nötig
            attachDelta(ref, existingCacheData);
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
      attachDelta(ref, existingCacheData);
    },
    [path, useDeltaSync, versionPath, attachDelta, doFullLoadAndAttach]
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
        // Wenn Firebase nichts zurueckliefert (transient empty snapshot bei
        // einem Reconnect-Glitch), bestehenden State NICHT auf null setzen —
        // sonst sieht der User ploetzlich "keine Serien". Echte Empty-Cases
        // kommen via Realtime-Listener durch.
        if (firebaseData !== null) {
          setData(firebaseData);
          setLastUpdated(Date.now());
          setIsStale(false);
        }
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
  const clearCache = useCallback(
    (): Promise<void> => clearCachedPath(path, enableOfflineSupport),
    [path, enableOfflineSupport]
  );
  /**
   * 🎧 Online/Offline Event Handler
   */
  useReconnectSync<T>({ syncOnReconnect, isStale, data, refetch, setIsOffline, setIsStale });
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
              // Firebase fetch failed — cached data stays in place
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
