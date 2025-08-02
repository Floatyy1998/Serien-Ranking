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
}

/**
 * Intelligenter Firebase Cache Hook
 * - Cached Daten lokal zwischen
 * - Reduziert Firebase-Reads durch TTL und Intervall-Checks
 * - Unterstützt sowohl realtime als auch einmalige Abfragen
 */
export function useFirebaseCache<T>(path: string, options: CacheOptions = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 Minuten default
    checkInterval = 30 * 1000, // 30 Sekunden default
    forceRefresh = false,
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

  // Periodische Updates ohne realtime listener
  const startPeriodicCheck = useCallback(() => {
    if (checkTimerRef.current) {
      clearInterval(checkTimerRef.current);
    }

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

        // Update lastCheck time
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

  // Initial fetch
  useEffect(() => {
    if (path) {
      fetchData();
      startPeriodicCheck();
    }
  }, [path, fetchData, startPeriodicCheck]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    clearCache: () => cacheRef.current.delete(path),
  };
}
