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
  fetchStaticCatalogSeriesFresh,
  fetchStaticCatalogSeasons,
  fetchStaticCatalogSeasonsBulk,
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

      // 1) Static-File versuchen (Stale-While-Revalidate liefert Cache sofort)
      let merged: Record<string, CatalogSeries> | null = null;
      try {
        merged = await fetchStaticCatalogSeries();
      } catch {
        // weiter mit Fallback
      }

      // 2) Wenn komplett leer (kein Cache, fetch fehlgeschlagen): einmal force-fresh
      if (!merged) {
        try {
          merged = await fetchStaticCatalogSeriesFresh();
        } catch (e) {
          console.warn('[catalog] retry fresh fetch failed', e);
        }
      }

      // 3) Falls Daten da sind aber User-IDs fehlen UND forceFresh angefordert wurde,
      //    holen wir explizit frisch. Sonst nicht — der periodische Versions-Bump-
      //    Check (visibilitychange / 5min-Poll) zieht stale Daten ohnehin nach,
      //    und der separate Effect unten ruft refetchCatalog(true) bei Bedarf.
      if (forceFresh && merged) {
        const currentMerged = merged;
        const userIds = Object.keys(userSeriesRefs);
        const missingIds = userIds.filter((id) => !currentMerged[id]);
        if (missingIds.length > 0) {
          try {
            const freshData = await fetchStaticCatalogSeriesFresh();
            if (freshData) merged = freshData;
          } catch (e) {
            console.warn('[catalog] fresh refetch failed', e);
          }
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

  // 4. Catalog-Seasons fuer User-Serien.
  //    Primaer: ein einziger Bulk-Request (seasonsAll.json) — vermeidet das
  //    Browser-Limit von 6 parallelen Connections pro Origin bei vielen Serien.
  //    Fallback: einzelne Season-Files, falls Bulk noch nicht auf dem Server liegt.
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

    (async () => {
      // Bulk versuchen
      let bulk: Record<string, Record<string, CatalogSeason>> | null = null;
      try {
        bulk = await fetchStaticCatalogSeasonsBulk();
      } catch {
        // ignore — Fallback unten
      }
      if (cancelled) return;

      if (bulk) {
        const seasons: Record<string, Record<string, CatalogSeason>> = {};
        for (const tmdbId of tmdbIds) {
          seasons[tmdbId] = bulk[tmdbId] || {};
        }
        seasonsLoadedRef.current = true;
        setCatalogSeasons(seasons);
        return;
      }

      // Fallback: einzelne Files
      const results = await Promise.all(
        tmdbIds.map(async (tmdbId) => {
          try {
            const data = await fetchStaticCatalogSeasons(tmdbId);
            return [tmdbId, data || {}] as const;
          } catch {
            return [tmdbId, {}] as const;
          }
        })
      );
      if (cancelled) return;
      const seasons: Record<string, Record<string, CatalogSeason>> = {};
      for (const [tmdbId, data] of results) {
        seasons[tmdbId] = data as Record<string, CatalogSeason>;
      }
      seasonsLoadedRef.current = true;
      setCatalogSeasons(seasons);
    })();

    return () => {
      cancelled = true;
    };
  }, [userSeriesRefs, user]);

  // Auto-Refresh: Silent refetch der Catalog-Daten, wenn serverseitig eine
  // neue Version vorliegt. Zwei Trigger-Wege:
  //   1) visibilitychange (Tab wird wieder sichtbar)
  //   2) Periodischer Poll alle 5 min, solange der Tab sichtbar ist
  // Beide rufen denselben silent-Refetch auf (ohne catalogLoading-Flag, also
  // ohne UI-Flackern). Background-Cron-Updates werden so ganz ohne App-Reload
  // sichtbar — egal ob der User weg war oder die ganze Zeit aktiv war.
  useEffect(() => {
    if (!user || !userSeriesRefs) return;
    let lastCheck = 0;
    let cancelled = false;

    const runCheck = async () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return;
      // Debounce: max alle 30s pruefen, egal welcher Trigger
      const now = Date.now();
      if (now - lastCheck < 30 * 1000) return;
      lastCheck = now;
      try {
        const bumped = await checkForCatalogVersionBump();
        if (!bumped || cancelled) return;
        // Neue Version: silent refetch ohne catalogLoading-Flag.
        const tmdbIds = Object.keys(userSeriesRefs);
        if (tmdbIds.length === 0) return;
        const [newMeta, newBulk] = await Promise.all([
          fetchStaticCatalogSeries(),
          fetchStaticCatalogSeasonsBulk(),
        ]);
        if (cancelled) return;
        if (newMeta) setCatalogMeta(newMeta);
        if (newBulk) {
          const newSeasons: Record<string, Record<string, CatalogSeason>> = {};
          for (const tmdbId of tmdbIds) {
            newSeasons[tmdbId] = newBulk[tmdbId] || {};
          }
          setCatalogSeasons(newSeasons);
        } else {
          // Bulk nicht verfuegbar — Einzel-Fallback (selten)
          const seasonResults = await Promise.all(
            tmdbIds.map(async (tmdbId) => {
              const data = await fetchStaticCatalogSeasons(tmdbId);
              return [tmdbId, data || {}] as const;
            })
          );
          if (cancelled) return;
          const newSeasons: Record<string, Record<string, CatalogSeason>> = {};
          for (const [tmdbId, data] of seasonResults) {
            newSeasons[tmdbId] = data as Record<string, CatalogSeason>;
          }
          setCatalogSeasons(newSeasons);
        }
      } catch {
        // silent fail — nicht das haupt-flow stoeren
      }
    };

    // Trigger 1: Tab wird wieder sichtbar
    document.addEventListener('visibilitychange', runCheck);

    // Trigger 2: Periodischer Poll alle 5 min. Der Check selbst kostet nur
    // einen ~115-byte version.json-Request. Nur bei tatsaechlichem Bump wird
    // der volle Refetch ausgefuehrt.
    const interval = setInterval(runCheck, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', runCheck);
      clearInterval(interval);
    };
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

  // Signal when initial data is loaded.
  // Mehrere Pfade, damit der Splashscreen nicht haengt, wenn Edge-Cases zuschlagen:
  //   1) Kein User eingeloggt → sofort ready
  //   2) seriesList hat schon Eintraege → ready (auch wenn Hintergrund-Loads noch laufen)
  //   3) User-Refs sind geladen und leer → ready (User hat halt keine Serien)
  //   4) Komplett-Loading durch (kein Fetch mehr aktiv) → ready, selbst wenn
  //      catalogMeta leer ist (z.B. Server hat IDs nicht). Lieber Skeleton-State
  //      zeigen als ewig auf Daten warten, die nicht kommen.
  useEffect(() => {
    if (!user) {
      window.setAppReady?.('initialData', true);
      return;
    }
    if (seriesList.length > 0) {
      window.setAppReady?.('initialData', true);
      return;
    }
    const refsKnown = !refsLoading && userSeriesRefs !== null;
    const refCount = userSeriesRefs ? Object.keys(userSeriesRefs).length : 0;
    if (refsKnown && refCount === 0) {
      window.setAppReady?.('initialData', true);
      return;
    }
    if (!loading) {
      // Catalog-Fetch durch — auch wenn nichts da ist: App rendern lassen
      // (Skeleton-State). Sonst haengt der Splash bei broken-catalog ewig.
      window.setAppReady?.('initialData', true);
    }
  }, [user, loading, refsLoading, userSeriesRefs, seriesList]);

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
