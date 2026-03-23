import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../App';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { Series } from '../types/Series';

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  getSessionStorageJSON,
  fixMissingFirstWatchedAt,
  createNewSeasonDetectionRunner,
  createInactiveSeriesDetectionRunner,
  createCompletedSeriesDetectionRunner,
  createUnratedSeriesDetectionRunner,
} from './seriesListDetection';
import { checkSeriesIntegrity } from './dataIntegrityChecker';

interface SeriesListContextType {
  seriesList: Series[];
  allSeriesList: Series[];
  hiddenSeriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  inactiveSeries: Series[];
  inactiveRewatches: Series[];
  completedSeries: Series[];
  unratedSeries: Series[];
  clearNewSeasons: () => void;
  clearInactiveSeries: () => void;
  clearInactiveRewatches: () => void;
  clearCompletedSeries: () => void;
  clearUnratedSeries: () => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
  toggleHideSeries: (nmr: number, hidden: boolean) => Promise<void>;
  isOffline: boolean;
  isStale: boolean;
  // Test functions for development
  simulateNewSeason?: (seriesId: number) => void;
  forceDetection?: () => void;
}

export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  allSeriesList: [],
  hiddenSeriesList: [],
  loading: true,
  seriesWithNewSeasons: [],
  inactiveSeries: [],
  inactiveRewatches: [],
  completedSeries: [],
  unratedSeries: [],
  clearNewSeasons: () => {},
  clearInactiveSeries: () => {},
  clearInactiveRewatches: () => {},
  clearCompletedSeries: () => {},
  clearUnratedSeries: () => {},
  recheckForNewSeasons: () => {},
  refetchSeries: () => {},
  toggleHideSeries: async () => {},
  isOffline: false,
  isStale: false,
});

export const SeriesListProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()!;

  // Verwende sessionStorage um State zwischen Re-Renders zu behalten
  const [seriesWithNewSeasons, setSeriesWithNewSeasons] = useState<Series[]>(() =>
    getSessionStorageJSON('seriesWithNewSeasons', [])
  );

  // Listen for sessionStorage updates from other tabs via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'seriesWithNewSeasons' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.length > 0 && seriesWithNewSeasons.length === 0) {
            setSeriesWithNewSeasons(parsed);
          }
        } catch (e) {
          console.error('Failed to parse seriesWithNewSeasons from storage event:', e);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [seriesWithNewSeasons.length]);

  const [hasCheckedForNewSeasons, setHasCheckedForNewSeasons] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForNewSeasons') === 'true';
    }
    return false;
  });

  // State für inaktive Serien
  const [inactiveSeries, setInactiveSeries] = useState<Series[]>(() =>
    getSessionStorageJSON('inactiveSeries', [])
  );

  const [inactiveRewatches, setInactiveRewatches] = useState<Series[]>(() =>
    getSessionStorageJSON('inactiveRewatches', [])
  );

  const [hasCheckedForInactive, setHasCheckedForInactive] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForInactive') === 'true';
    }
    return false;
  });

  // State für komplett geschaute Serien
  const [completedSeries, setCompletedSeries] = useState<Series[]>(() =>
    getSessionStorageJSON('completedSeries', [])
  );

  const [hasCheckedForCompleted, setHasCheckedForCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForCompleted') === 'true';
    }
    return false;
  });

  // State für unbewertete Serien
  const [unratedSeries, setUnratedSeries] = useState<Series[]>(() =>
    getSessionStorageJSON('unratedSeries', [])
  );

  const [hasCheckedForUnrated, setHasCheckedForUnrated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForUnrated') === 'true';
    }
    return false;
  });

  const detectionRunRef = useRef(false);
  const inactiveDetectionRunRef = useRef(false);
  const completedDetectionRunRef = useRef(false);
  const unratedDetectionRunRef = useRef(false);
  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactiveDetectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedDetectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unratedDetectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstWatchedAtFixedRef = useRef(false);

  const {
    data: seriesData,
    loading,
    refetch,
    isStale,
    isOffline,
  } = useEnhancedFirebaseCache<Record<string, Series>>(user ? `${user.uid}/serien` : '', {
    ttl: 24 * 60 * 60 * 1000,
    useRealtimeListener: true,
    enableOfflineSupport: true,
    syncOnReconnect: true,
  });

  // Konvertiere Object zu Array, sanitize kaputte Daten, logge Probleme ins Admin-Panel
  const allSeries: Series[] = useMemo(() => {
    if (!seriesData || !user) return [];

    const { sanitized, issues } = checkSeriesIntegrity(seriesData, user.uid);

    if (issues.length > 0) {
      firebase
        .database()
        .ref(`admin/dataIntegrityIssues/${user.uid}`)
        .set({
          timestamp: new Date().toISOString(),
          userName: user.displayName || user.email || user.uid,
          issueCount: issues.length,
          issues,
        });
    } else {
      firebase.database().ref(`admin/dataIntegrityIssues/${user.uid}`).remove();
    }

    return sanitized;
  }, [seriesData, user]);
  const seriesList = useMemo(() => allSeries.filter((s) => !s.hidden), [allSeries]);
  const hiddenSeriesList = useMemo(() => allSeries.filter((s) => s.hidden === true), [allSeries]);

  // Make fix function available globally for manual execution
  useEffect(() => {
    if (user && seriesData && !loading) {
      (window as any).fixFirstWatchedAt = () => {
        fixMissingFirstWatchedAt(user.uid, seriesData);
      };
    } else {
      delete (window as any).fixFirstWatchedAt;
    }
  }, [user, seriesData, loading]);

  // Signal when initial data is loaded
  useEffect(() => {
    if (!user) {
      window.setAppReady?.('initialData', true);
      return;
    }

    if (!loading) {
      window.setAppReady?.('initialData', true);
    }
  }, [user, loading]);

  // Debounced detection functions (extracted to seriesListDetection.ts)
  const runNewSeasonDetection = useCallback(
    createNewSeasonDetectionRunner(
      { detectionRunRef, detectionTimeoutRef },
      setSeriesWithNewSeasons,
      setHasCheckedForNewSeasons
    ),
    []
  );

  const runInactiveSeriesDetection = useCallback(
    createInactiveSeriesDetectionRunner(
      { inactiveDetectionRunRef, inactiveDetectionTimeoutRef },
      setInactiveSeries,
      setInactiveRewatches,
      setHasCheckedForInactive
    ),
    []
  );

  const runCompletedSeriesDetection = useCallback(
    createCompletedSeriesDetectionRunner(
      { completedDetectionRunRef, completedDetectionTimeoutRef },
      setCompletedSeries,
      setHasCheckedForCompleted
    ),
    []
  );

  const runUnratedSeriesDetection = useCallback(
    createUnratedSeriesDetectionRunner(
      { unratedDetectionRunRef, unratedDetectionTimeoutRef },
      setUnratedSeries,
      setHasCheckedForUnrated
    ),
    []
  );

  // New season detection nur beim ersten Load und wenn online
  useEffect(() => {
    if (seriesWithNewSeasons.length > 0) {
      return;
    }

    if (!user || !seriesList.length || hasCheckedForNewSeasons || isOffline) {
      return;
    }

    runNewSeasonDetection(seriesList, user.uid);
  }, [
    user,
    seriesList.length,
    hasCheckedForNewSeasons,
    isOffline,
    seriesWithNewSeasons.length,
    runNewSeasonDetection,
  ]);

  // Inactive series detection
  useEffect(() => {
    if (inactiveSeries.length > 0) {
      return;
    }

    if (!user || !seriesList.length || hasCheckedForInactive || isOffline) {
      return;
    }

    runInactiveSeriesDetection(seriesList, user.uid);
  }, [
    user,
    seriesList.length,
    hasCheckedForInactive,
    isOffline,
    inactiveSeries.length,
    runInactiveSeriesDetection,
  ]);

  // Completed series detection
  useEffect(() => {
    if (completedSeries.length > 0) {
      return;
    }

    if (!user || !seriesList.length || hasCheckedForCompleted || isOffline) {
      return;
    }

    runCompletedSeriesDetection(seriesList, user.uid);
  }, [
    user,
    seriesList.length,
    hasCheckedForCompleted,
    isOffline,
    completedSeries.length,
    runCompletedSeriesDetection,
  ]);

  // Unrated series detection
  useEffect(() => {
    if (unratedSeries.length > 0) {
      return;
    }

    if (!user || !seriesList.length || hasCheckedForUnrated || isOffline) {
      return;
    }

    runUnratedSeriesDetection(seriesList, user.uid);
  }, [
    user,
    seriesList.length,
    hasCheckedForUnrated,
    isOffline,
    unratedSeries.length,
    runUnratedSeriesDetection,
  ]);

  // Reset bei User-Wechsel
  useEffect(() => {
    if (!user) {
      setSeriesWithNewSeasons([]);
      setHasCheckedForNewSeasons(false);
      setInactiveSeries([]);
      setInactiveRewatches([]);
      setHasCheckedForInactive(false);
      setCompletedSeries([]);
      setHasCheckedForCompleted(false);
      setUnratedSeries([]);
      setHasCheckedForUnrated(false);
      detectionRunRef.current = false;
      inactiveDetectionRunRef.current = false;
      completedDetectionRunRef.current = false;
      firstWatchedAtFixedRef.current = false;

      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
      if (inactiveDetectionTimeoutRef.current) {
        clearTimeout(inactiveDetectionTimeoutRef.current);
        inactiveDetectionTimeoutRef.current = null;
      }
      if (completedDetectionTimeoutRef.current) {
        clearTimeout(completedDetectionTimeoutRef.current);
        completedDetectionTimeoutRef.current = null;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('seriesWithNewSeasons');
        sessionStorage.removeItem('hasCheckedForNewSeasons');
        sessionStorage.removeItem('inactiveSeries');
        sessionStorage.removeItem('inactiveRewatches');
        sessionStorage.removeItem('hasCheckedForInactive');
        sessionStorage.removeItem('completedSeries');
        sessionStorage.removeItem('hasCheckedForCompleted');
      }
    }
  }, [user]);

  const clearNewSeasons = useCallback(() => {
    setSeriesWithNewSeasons([]);
    setHasCheckedForNewSeasons(true);
    detectionRunRef.current = false;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('seriesWithNewSeasons');
      sessionStorage.setItem('hasCheckedForNewSeasons', 'true');
    }
  }, []);

  const clearInactiveSeries = useCallback(() => {
    setInactiveSeries([]);
    setHasCheckedForInactive(true);
    inactiveDetectionRunRef.current = false;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('inactiveSeries');
      sessionStorage.setItem('hasCheckedForInactive', 'true');
    }
  }, []);

  const clearInactiveRewatches = useCallback(() => {
    setInactiveRewatches([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('inactiveRewatches');
    }
  }, []);

  const clearCompletedSeries = useCallback(() => {
    setCompletedSeries([]);
    setHasCheckedForCompleted(true);
    completedDetectionRunRef.current = false;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('completedSeries');
      sessionStorage.setItem('hasCheckedForCompleted', 'true');
    }
  }, []);

  const clearUnratedSeries = useCallback(() => {
    setUnratedSeries([]);
    setHasCheckedForUnrated(true);
    unratedDetectionRunRef.current = false;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('unratedSeries');
      sessionStorage.setItem('hasCheckedForUnrated', 'true');
    }
  }, []);

  const recheckForNewSeasons = useCallback(() => {
    detectionRunRef.current = false;
    setHasCheckedForNewSeasons(false);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hasCheckedForNewSeasons');
      sessionStorage.removeItem('seriesWithNewSeasons');
    }

    if (user && seriesList.length > 0) {
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [user, seriesList, runNewSeasonDetection]);

  const refetchSeries = useCallback(() => {
    refetch();
  }, [refetch]);

  const toggleHideSeries = useCallback(
    async (nmr: number, hidden: boolean) => {
      if (!user) return;
      const ref = firebase.database().ref(`${user.uid}/serien/${nmr}/hidden`);
      if (hidden) {
        await ref.set(true);
      } else {
        await ref.remove();
      }
    },
    [user]
  );

  // TEST FUNCTIONS - Only available in development
  const simulateNewSeason = useCallback(
    (seriesId: number) => {
      if (process.env.NODE_ENV !== 'development') return;

      const series = seriesList.find((s) => s.id === seriesId);
      if (series) {
        const testSeries = {
          ...series,
          seasonCount: (series.seasonCount || 0) + 1,
        };

        setSeriesWithNewSeasons((prev) => [...prev, testSeries]);

        if (typeof window !== 'undefined') {
          const newList = [...seriesWithNewSeasons, testSeries];
          sessionStorage.setItem('seriesWithNewSeasons', JSON.stringify(newList));
        }
      }
    },
    [seriesList, seriesWithNewSeasons]
  );

  const forceDetection = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;

    detectionRunRef.current = false;
    setHasCheckedForNewSeasons(false);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hasCheckedForNewSeasons');
      sessionStorage.removeItem('seriesWithNewSeasons');
    }

    if (user && seriesList.length > 0) {
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [user, seriesList, runNewSeasonDetection]);

  return (
    <SeriesListContext.Provider
      value={{
        seriesList,
        allSeriesList: allSeries,
        hiddenSeriesList,
        loading,
        seriesWithNewSeasons,
        inactiveSeries,
        inactiveRewatches,
        completedSeries,
        unratedSeries,
        clearNewSeasons,
        clearInactiveSeries,
        clearInactiveRewatches,
        clearCompletedSeries,
        clearUnratedSeries,
        recheckForNewSeasons,
        refetchSeries,
        toggleHideSeries,
        isOffline,
        isStale,
        ...(process.env.NODE_ENV === 'development'
          ? {
              simulateNewSeason,
              forceDetection,
            }
          : {}),
      }}
    >
      {children}
    </SeriesListContext.Provider>
  );
};

export const useSeriesList = () => useContext(SeriesListContext);
