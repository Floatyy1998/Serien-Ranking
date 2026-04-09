import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import type { Series } from '../types/Series';
import type {
  CatalogSeries,
  CatalogSeason,
  UserSeriesRef,
  SeriesWatchData,
} from '../types/CatalogTypes';
import { mergeToSeriesView } from '../lib/seriesAdapter';

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { bumpSeriesVersion } from '../lib/firebase/seriesVersionBump';
import {
  fixMissingFirstWatchedAt,
  runSequentialDetections,
  type ProviderChangeInfo,
  type DetectionResults,
} from './seriesListDetection';
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

  // 1. User-Referenzen (klein, welche Serien hat der User + Ratings)
  const {
    data: userSeriesRefs,
    loading: refsLoading,
    refetch: refetchRefs,
    isStale,
    isOffline,
  } = useEnhancedFirebaseCache<Record<string, UserSeriesRef>>(
    user ? `users/${user.uid}/series` : '',
    {
      ttl: 24 * 60 * 60 * 1000,
      useRealtimeListener: true,
      enableOfflineSupport: true,
      syncOnReconnect: true,
    }
  );

  // 2. Watch-Daten (delta-sync auf seasons)
  const {
    data: watchDataMap,
    loading: watchLoading,
    refetch: refetchWatch,
  } = useEnhancedFirebaseCache<Record<string, SeriesWatchData>>(
    user ? `users/${user.uid}/seriesWatch` : '',
    {
      ttl: 24 * 60 * 60 * 1000,
      useDeltaSync: true,
      deltaSubKey: 'seasons',
      versionPath: user ? `users/${user.uid}/meta/serienVersion` : undefined,
      enableOfflineSupport: true,
      syncOnReconnect: true,
    }
  );

  // 3. Catalog-Meta (shared, klein ~350KB für alle Serien, OHNE Seasons)
  const {
    data: catalogMeta,
    loading: catalogLoading,
    refetch: refetchCatalog,
  } = useEnhancedFirebaseCache<Record<string, CatalogSeries>>(
    userSeriesRefs && Object.keys(userSeriesRefs).length > 0 ? 'catalog/seriesMeta' : '',
    {
      ttl: 24 * 60 * 60 * 1000,
      versionPath: 'catalog/version',
      enableOfflineSupport: true,
      syncOnReconnect: true,
    }
  );

  // Auto-Refetch: Wenn eine neue Serie in userRefs auftaucht die nicht im Catalog ist
  useEffect(() => {
    if (!userSeriesRefs || !catalogMeta) return;
    const missingInCatalog = Object.keys(userSeriesRefs).some((id) => !catalogMeta[id]);
    if (missingInCatalog) {
      refetchCatalog();
    }
  }, [userSeriesRefs, catalogMeta, refetchCatalog]);

  // 4. Catalog-Seasons nur für User-Serien (on-demand, parallel)
  const [catalogSeasons, setCatalogSeasons] = useState<
    Record<string, Record<string, CatalogSeason>>
  >({});
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const loadedSeasonsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userSeriesRefs || !user) return;
    const tmdbIds = Object.keys(userSeriesRefs);
    const toLoad = tmdbIds.filter((id) => !loadedSeasonsRef.current.has(id));
    if (toLoad.length === 0) return;

    setSeasonsLoading(true);
    const db = firebase.database();

    Promise.all(
      toLoad.map(async (tmdbId) => {
        try {
          const snap = await db.ref(`catalog/seasons/${tmdbId}`).once('value');
          return [tmdbId, snap.val() || {}] as const;
        } catch {
          return [tmdbId, {}] as const;
        }
      })
    ).then((results) => {
      const newSeasons: Record<string, Record<string, CatalogSeason>> = {};
      for (const [tmdbId, data] of results) {
        newSeasons[tmdbId] = data as Record<string, CatalogSeason>;
        loadedSeasonsRef.current.add(tmdbId);
      }
      setCatalogSeasons((prev) => ({ ...prev, ...newSeasons }));
      setSeasonsLoading(false);
    });
  }, [userSeriesRefs, user]);

  const loading = refsLoading || watchLoading || catalogLoading || seasonsLoading;

  // Merge: CatalogMeta + CatalogSeasons + UserRefs + WatchData → Series[]
  const allSeries: Series[] = useMemo(() => {
    if (!userSeriesRefs || !catalogMeta || !user) return [];

    const merged: Series[] = [];
    for (const [tmdbIdStr, userRef] of Object.entries(userSeriesRefs)) {
      const tmdbId = Number(tmdbIdStr);
      const meta = catalogMeta[tmdbIdStr];
      if (!meta) continue;
      // Merge meta + seasons back into CatalogSeries shape
      const catalogWithSeasons: CatalogSeries = {
        ...meta,
        seasons: catalogSeasons[tmdbIdStr] || undefined,
      };
      const watchData = watchDataMap?.[tmdbIdStr];
      merged.push(mergeToSeriesView(tmdbId, catalogWithSeasons, userRef, watchData));
    }
    return merged;
  }, [userSeriesRefs, catalogMeta, catalogSeasons, watchDataMap, user]);
  const seriesList = useMemo(() => allSeries.filter((s) => !s.hidden), [allSeries]);
  const hiddenSeriesList = useMemo(() => allSeries.filter((s) => s.hidden === true), [allSeries]);

  // Make fix function available globally for manual execution
  useEffect(() => {
    if (user && watchDataMap && !loading) {
      (window as unknown as Record<string, unknown>).fixFirstWatchedAt = () => {
        fixMissingFirstWatchedAt(user.uid, watchDataMap as unknown as Record<string, Series>);
      };
    } else {
      delete (window as unknown as Record<string, unknown>).fixFirstWatchedAt;
    }
  }, [user, watchDataMap, loading]);

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
    refetchRefs();
    refetchWatch();
  }, [refetchRefs, refetchWatch]);

  const toggleHideSeries = useCallback(
    async (nmr: number, hidden: boolean) => {
      if (!user) return;
      // Finde tmdbId anhand von nmr (legacyNmr) oder direkt aus seriesList
      const series = allSeries.find((s) => s.nmr === nmr || s.id === nmr);
      if (!series) return;
      const ref = firebase.database().ref(`users/${user.uid}/series/${series.id}/hidden`);
      if (hidden) {
        await ref.set(true);
      } else {
        await ref.remove();
      }
      bumpSeriesVersion(user.uid);
    },
    [user, allSeries]
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
