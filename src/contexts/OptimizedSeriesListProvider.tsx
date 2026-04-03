import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import type { Series } from '../types/Series';

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  fixMissingFirstWatchedAt,
  runSequentialDetections,
  type ProviderChangeInfo,
  type DetectionResults,
} from './seriesListDetection';
import { checkSeriesIntegrity } from './dataIntegrityChecker';
import { SeriesListContext } from './SeriesListContext';

export const SeriesListProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth() || {};

  const [seriesWithNewSeasons, setSeriesWithNewSeasons] = useState<Series[]>([]);
  const [inactiveSeries, setInactiveSeries] = useState<Series[]>([]);
  const [inactiveRewatches, setInactiveRewatches] = useState<Series[]>([]);
  const [completedSeries, setCompletedSeries] = useState<Series[]>([]);
  const [unratedSeries, setUnratedSeries] = useState<Series[]>([]);
  const [providerChanges, setProviderChanges] = useState<ProviderChangeInfo[]>([]);

  const detectionRunRef = useRef(false);

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
      (window as unknown as Record<string, unknown>).fixFirstWatchedAt = () => {
        fixMissingFirstWatchedAt(user.uid, seriesData);
      };
    } else {
      delete (window as unknown as Record<string, unknown>).fixFirstWatchedAt;
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

  // Sequentielle Detection — einmal nach dem Laden
  useEffect(() => {
    if (!user || !seriesList.length || isOffline || detectionRunRef.current) return;

    detectionRunRef.current = true;
    const abortController = new AbortController();

    runSequentialDetections(
      seriesList,
      user.uid,
      (partial: Partial<DetectionResults>) => {
        if (partial.seriesWithNewSeasons) setSeriesWithNewSeasons(partial.seriesWithNewSeasons);
        if (partial.inactiveSeries) setInactiveSeries(partial.inactiveSeries);
        if (partial.inactiveRewatches) setInactiveRewatches(partial.inactiveRewatches);
        if (partial.completedSeries) setCompletedSeries(partial.completedSeries);
        if (partial.unratedSeries) setUnratedSeries(partial.unratedSeries);
        if (partial.providerChanges) setProviderChanges(partial.providerChanges);
      },
      abortController.signal
    );

    return () => {
      abortController.abort();
    };
  }, [user, seriesList, isOffline]);

  // Reset bei User-Wechsel
  useEffect(() => {
    if (!user) return;

    return () => {
      setSeriesWithNewSeasons([]);
      setInactiveSeries([]);
      setInactiveRewatches([]);
      setCompletedSeries([]);
      setUnratedSeries([]);
      setProviderChanges([]);
      detectionRunRef.current = false;
    };
  }, [user]);

  const clearNewSeasons = useCallback(() => {
    setSeriesWithNewSeasons([]);
  }, []);

  const clearInactiveSeries = useCallback(() => {
    setInactiveSeries([]);
  }, []);

  const clearInactiveRewatches = useCallback(() => {
    setInactiveRewatches([]);
  }, []);

  const clearCompletedSeries = useCallback(() => {
    setCompletedSeries([]);
  }, []);

  const clearUnratedSeries = useCallback(() => {
    setUnratedSeries([]);
  }, []);

  const clearProviderChanges = useCallback(() => {
    setProviderChanges([]);
  }, []);

  const recheckForNewSeasons = useCallback(() => {
    detectionRunRef.current = false;
    setSeriesWithNewSeasons([]);
    setInactiveSeries([]);
    setInactiveRewatches([]);
    setCompletedSeries([]);
    setUnratedSeries([]);
    setProviderChanges([]);

    if (user && seriesList.length > 0) {
      detectionRunRef.current = true;
      const abortController = new AbortController();
      runSequentialDetections(
        seriesList,
        user.uid,
        (partial: Partial<DetectionResults>) => {
          if (partial.seriesWithNewSeasons) setSeriesWithNewSeasons(partial.seriesWithNewSeasons);
          if (partial.inactiveSeries) setInactiveSeries(partial.inactiveSeries);
          if (partial.inactiveRewatches) setInactiveRewatches(partial.inactiveRewatches);
          if (partial.completedSeries) setCompletedSeries(partial.completedSeries);
          if (partial.unratedSeries) setUnratedSeries(partial.unratedSeries);
          if (partial.providerChanges) setProviderChanges(partial.providerChanges);
        },
        abortController.signal
      );
    }
  }, [user, seriesList]);

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
      }
    },
    [seriesList]
  );

  const forceDetection = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;
    recheckForNewSeasons();
  }, [recheckForNewSeasons]);

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
        providerChanges,
        clearNewSeasons,
        clearInactiveSeries,
        clearInactiveRewatches,
        clearCompletedSeries,
        clearUnratedSeries,
        clearProviderChanges,
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
