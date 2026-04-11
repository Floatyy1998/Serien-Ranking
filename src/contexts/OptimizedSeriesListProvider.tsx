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
import {
  fetchStaticCatalogSeries,
  fetchStaticCatalogSeasons,
  clearStaticCatalogCache,
  checkForCatalogVersionBump,
} from '../lib/staticCatalog';

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

  // 3. Catalog-Meta (shared, ~350KB): aus Static-File vom eigenen Server,
  //    Firebase als Fallback. Spart Firebase Download-Egress.
  const [catalogMeta, setCatalogMeta] = useState<Record<string, CatalogSeries> | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const refetchCatalog = useCallback(
    async (forceFresh: boolean = false) => {
      if (!userSeriesRefs || Object.keys(userSeriesRefs).length === 0) return;
      setCatalogLoading(true);
      if (forceFresh) clearStaticCatalogCache();
      let merged: Record<string, CatalogSeries> | null = null;

      // 1) Static-File versuchen
      try {
        const staticData = await fetchStaticCatalogSeries();
        if (staticData) merged = staticData;
      } catch {
        // ignore, firebase fallback unten
      }

      // 2) Fehlende IDs einzeln von Firebase nachholen. Deckt den Fall ab dass
      //    der Server-Export noch nicht gelaufen ist (z.B. direkt nach /add).
      const userIds = Object.keys(userSeriesRefs);
      const missingIds = userIds.filter((id) => !merged || !merged[id]);
      if (merged && missingIds.length > 0 && missingIds.length < 20) {
        try {
          const db = firebase.database();
          const results = await Promise.all(
            missingIds.map((id) => db.ref(`catalog/seriesMeta/${id}`).once('value'))
          );
          const patched: Record<string, CatalogSeries> = { ...merged };
          for (let i = 0; i < missingIds.length; i++) {
            const val = results[i].val();
            if (val) patched[missingIds[i]] = val as CatalogSeries;
          }
          merged = patched;
        } catch (e) {
          console.warn('[catalog] missing-id firebase fallback failed', e);
        }
      }

      // 3) Wenn static komplett versagt hat, voller Firebase-Fallback
      if (!merged) {
        try {
          const snap = await firebase.database().ref('catalog/seriesMeta').once('value');
          merged = snap.val() || {};
        } catch (e) {
          console.warn('[catalog] full firebase fallback failed', e);
        }
      }

      setCatalogMeta(merged || {});
      setCatalogLoading(false);
    },
    [userSeriesRefs]
  );
  useEffect(() => {
    refetchCatalog();
  }, [refetchCatalog]);

  // Auto-Refetch: Wenn eine neue Serie in userRefs auftaucht die nicht im Catalog ist.
  // Nach einem /add auf dem Server exportiert hello.js den Catalog sofort als
  // statische Files neu, aber unser lokaler Cache (memory + localStorage) ist stale.
  // WICHTIG: triggert NUR bei Aenderung der userRef-Keys, nicht bei jedem
  // catalogMeta-Update, sonst Endlosschleife wenn der Server noch nicht fertig ist.
  const lastRefetchKeysRef = useRef<string>('');
  useEffect(() => {
    if (!userSeriesRefs || !catalogMeta) return;
    const currentKeys = Object.keys(userSeriesRefs).sort().join(',');
    if (currentKeys === lastRefetchKeysRef.current) return;
    const missingInCatalog = Object.keys(userSeriesRefs).some((id) => !catalogMeta[id]);
    if (missingInCatalog) {
      lastRefetchKeysRef.current = currentKeys;
      refetchCatalog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSeriesRefs]);

  // 4. Catalog-Seasons nur für User-Serien (on-demand, parallel)
  const [catalogSeasons, setCatalogSeasons] = useState<
    Record<string, Record<string, CatalogSeason>>
  >({});
  const seasonsLoadedRef = useRef(false);
  useEffect(() => {
    if (!userSeriesRefs || !user) return;
    const tmdbIds = Object.keys(userSeriesRefs);
    if (tmdbIds.length === 0) {
      seasonsLoadedRef.current = true;
      return;
    }

    let cancelled = false;
    const db = firebase.database();

    Promise.all(
      tmdbIds.map(async (tmdbId) => {
        // static first
        try {
          const data = await fetchStaticCatalogSeasons(tmdbId);
          if (data) return [tmdbId, data] as const;
        } catch {
          // ignore, fallback to firebase
        }
        try {
          const snap = await db.ref(`catalog/seasons/${tmdbId}`).once('value');
          return [tmdbId, snap.val() || {}] as const;
        } catch {
          return [tmdbId, {}] as const;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const seasons: Record<string, Record<string, CatalogSeason>> = {};
      for (const [tmdbId, data] of results) {
        seasons[tmdbId] = data as Record<string, CatalogSeason>;
      }
      seasonsLoadedRef.current = true;
      setCatalogSeasons(seasons);
    });

    return () => {
      cancelled = true;
    };
  }, [userSeriesRefs, user]);

  // Auto-Refresh bei visibilitychange: Wenn der Tab nach laengerer
  // Inaktivitaet wieder sichtbar wird, prueft der Client ob serverseitig
  // ein neuer Catalog vorliegt. Falls ja → silent refetch (ohne
  // catalogLoading-Flag, also ohne UI-Flackern/Splashscreen).
  // Im Hintergrund laufende Cron-Updates werden so ohne App-Reload sichtbar.
  useEffect(() => {
    if (!user || !userSeriesRefs) return;
    let lastCheck = 0;
    const handler = async () => {
      if (document.visibilityState !== 'visible') return;
      // Debounce: max alle 30s pruefen
      const now = Date.now();
      if (now - lastCheck < 30 * 1000) return;
      lastCheck = now;
      try {
        const bumped = await checkForCatalogVersionBump();
        if (!bumped) return;
        // Neue Version: silent refetch ohne catalogLoading-Flag.
        const tmdbIds = Object.keys(userSeriesRefs);
        if (tmdbIds.length === 0) return;
        const [newMeta, ...seasonResults] = await Promise.all([
          fetchStaticCatalogSeries(),
          ...tmdbIds.map(async (tmdbId) => {
            const data = await fetchStaticCatalogSeasons(tmdbId);
            return [tmdbId, data || {}] as const;
          }),
        ]);
        if (newMeta) setCatalogMeta(newMeta);
        const newSeasons: Record<string, Record<string, CatalogSeason>> = {};
        for (const [tmdbId, data] of seasonResults) {
          newSeasons[tmdbId] = data as Record<string, CatalogSeason>;
        }
        setCatalogSeasons(newSeasons);
      } catch {
        // silent fail — nicht das haupt-flow stoeren
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [user, userSeriesRefs]);

  const loading = refsLoading || watchLoading || catalogLoading;

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

  // Sequentielle Detection — einmal nach dem Laden (warte auf Seasons!)
  const hasSeasons = seriesList.some((s) => s.seasons && s.seasons.length > 0);
  useEffect(() => {
    if (!user || !seriesList.length || !hasSeasons || isOffline || detectionRunRef.current) return;

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
  }, [user, seriesList, hasSeasons, isOffline]);

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
