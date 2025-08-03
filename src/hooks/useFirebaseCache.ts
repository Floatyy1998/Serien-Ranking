import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useRef, useState } from 'react';
import { performanceTracker } from '../components/dev/PerformanceMonitor';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastCheck: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in ms (default: 5 minutes)
  checkInterval?: number; // How often to check for updates in ms (default: 30 seconds)
  forceRefresh?: boolean;
  useRealtimeListener?: boolean; // Use realtime listener instead of periodic checks (default: true)
}

/**
 * Intelligenter Firebase Cache Hook
 * - Cached Daten lokal zwischen
 * - Nutzt standardmäßig Realtime Listener für optimale Performance
 * - Fallback auf periodische Checks bei Bedarf
 * - Reduziert Firebase-Reads durch intelligentes Caching
 * - Unterstützt sowohl realtime als auch einmalige Abfragen
 */
export function useFirebaseCache<T>(path: string, options: CacheOptions = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 Minuten default
    checkInterval = 30 * 1000, // 30 Sekunden default
    forceRefresh = false,
    useRealtimeListener = true, // Default: verwende realtime listener
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, CacheEntry<any>>>(new Map());
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const listenerRef = useRef<firebase.database.Reference | null>(null);

  const getCachedData = useCallback(
    (key: string): T | null => {
      const cached = cacheRef.current.get(key);
      if (!cached) {
        performanceTracker.trackCacheMiss();
        return null;
      }

      const now = Date.now();
      if (now - cached.timestamp > ttl) {
        cacheRef.current.delete(key);
        performanceTracker.trackCacheMiss();
        return null;
      }

      performanceTracker.trackCacheHit();
      return cached.data;
    },
    [ttl]
  );

  const setCachedData = useCallback((key: string, data: T) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      lastCheck: Date.now(),
    });
  }, []);

  const fetchData = useCallback(
    async (skipCache = false) => {
      if (!path) return;

      try {
        setError(null);

        // Prüfe Cache zuerst
        if (!skipCache && !forceRefresh) {
          const cached = getCachedData(path);
          if (cached) {
            setData(cached);
            setLoading(false);
            return;
          }
        }

        setLoading(true);
        const ref = firebase.database().ref(path);
        const snapshot = await ref.once('value');
        const result = snapshot.val();

        performanceTracker.trackFirebaseRead();
        setCachedData(path, result);
        setData(result);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    },
    [path, getCachedData, setCachedData, forceRefresh]
  );

  // Setup realtime listener für bessere Performance
  const setupRealtimeListener = useCallback(() => {
    if (!path) return;

    // Cleanup existing listener
    if (listenerRef.current) {
      listenerRef.current.off();
    }

    const ref = firebase.database().ref(path);
    listenerRef.current = ref;

    // Prüfe erst Cache
    const cached = getCachedData(path);
    if (cached && !forceRefresh) {
      setData(cached);
      setLoading(false);
    }

    // Setup listener für realtime updates
    ref.on(
      'value',
      (snapshot) => {
        const result = snapshot.val();
        performanceTracker.trackFirebaseRead();

        // Nur Update bei tatsächlicher Änderung
        const cached = cacheRef.current.get(path);
        if (!cached || JSON.stringify(result) !== JSON.stringify(cached.data)) {
          setCachedData(path, result);
          setData(result);
        }

        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
  }, [path, getCachedData, setCachedData, forceRefresh]);

  // Fallback: Periodische Updates für spezielle Fälle
  const startPeriodicCheck = useCallback(() => {
    if (checkTimerRef.current) {
      clearInterval(checkTimerRef.current);
    }

    // Nur als Fallback verwenden, normalerweise realtime listener
    checkTimerRef.current = setInterval(async () => {
      const cached = cacheRef.current.get(path);
      if (!cached) return;

      const now = Date.now();
      if (now - cached.lastCheck < checkInterval) return;

      try {
        const ref = firebase.database().ref(path);
        const snapshot = await ref.once('value');
        const newData = snapshot.val();

        performanceTracker.trackFirebaseRead();

        // Nur Update wenn sich Daten geändert haben
        if (JSON.stringify(newData) !== JSON.stringify(cached.data)) {
          setCachedData(path, newData);
          setData(newData);
        }

        cached.lastCheck = now;
      } catch (err) {
        console.warn('Periodic check failed:', err);
      }
    }, checkInterval);
  }, [path, checkInterval, setCachedData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
      }
      if (listenerRef.current) {
        listenerRef.current.off();
      }
    };
  }, []);

  // Initial setup - wähle zwischen realtime listener und periodic checks
  useEffect(() => {
    if (path) {
      if (useRealtimeListener) {
        setupRealtimeListener();
      } else {
        fetchData();
        startPeriodicCheck();
      }
    }
  }, [
    path,
    useRealtimeListener,
    setupRealtimeListener,
    fetchData,
    startPeriodicCheck,
  ]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    clearCache: () => cacheRef.current.delete(path),
    switchToRealtime: () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
        checkTimerRef.current = null;
      }
      setupRealtimeListener();
    },
    switchToPolling: () => {
      if (listenerRef.current) {
        listenerRef.current.off();
        listenerRef.current = null;
      }
      startPeriodicCheck();
    },
  };
}
