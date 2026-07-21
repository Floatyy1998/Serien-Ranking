import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import type { Movie } from '../types/Movie';
import type { CatalogMovie, UserMovieRef } from '../types/CatalogTypes';
import { mergeToMovieView } from '../lib/seriesAdapter';
import { MovieListContext } from './MovieListContext';
import {
  fetchStaticCatalogMovies,
  fetchStaticCatalogMoviesFresh,
  subscribeCatalogChange,
} from '../services/staticCatalog';

export const MovieListProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth() || {};

  // 1. User-Referenzen (welche Filme hat der User + Ratings)
  const {
    data: userMovieRefs,
    loading: refsLoading,
    refetch: refetchRefs,
    isStale,
    isOffline,
  } = useEnhancedFirebaseCache<Record<string, UserMovieRef>>(
    user ? `users/${user.uid}/movies` : '',
    {
      ttl: 24 * 60 * 60 * 1000,
      useRealtimeListener: true,
      // Delta-Sync: bei Rating-Updates oder Watch-Status-Aenderungen nur das
      // betroffene Movie ueber den Wire schicken statt die komplette Map. Bei
      // Usern mit 500+ Filmen spart das spuerbar Bandbreite und CPU.
      useDeltaSync: true,
      enableOfflineSupport: true,
      syncOnReconnect: true,
    }
  );

  // 2. Catalog (shared): Static-File vom Server, Firebase-Fallback. Spart Egress.
  const [catalogData, setCatalogData] = useState<Record<string, CatalogMovie> | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const refetchCatalog = useCallback(
    async (forceFresh: boolean = false) => {
      if (!userMovieRefs || Object.keys(userMovieRefs).length === 0) return;
      setCatalogLoading(true);

      // forceFresh: gezielt moviesMeta frisch (no-store) — bewusst OHNE
      // clearStaticCatalogCache(): das nukte alle Katalog-Caches und löste
      // beim Onboarding einen Refetch-Sturm über alle Konsumenten aus.
      let merged: Record<string, CatalogMovie> | null = null;
      if (forceFresh) {
        try {
          merged = await fetchStaticCatalogMoviesFresh();
        } catch {
          // weiter mit Cache-Pfad
        }
      }

      // Static-File (Stale-While-Revalidate liefert Cache sofort)
      if (!merged) {
        try {
          merged = await fetchStaticCatalogMovies();
        } catch {
          // ignore
        }
      }

      // Wenn komplett leer: einmal force-fresh
      if (!merged) {
        try {
          merged = await fetchStaticCatalogMoviesFresh();
        } catch (e) {
          console.warn('[catalog] retry fresh fetch failed', e);
        }
      }

      setCatalogData(merged || {});
      setCatalogLoading(false);
    },
    [userMovieRefs]
  );
  useEffect(() => {
    // refetchCatalog macht intern setState - hier bewusst, weil es der initial
    // load ist. Der Alternative waere ein separater Kontext oder ein Store,
    // beides overkill fuer einen single network fetch beim mount.

    refetchCatalog();
  }, [refetchCatalog]);

  // Auto-Refetch: Wenn ein neuer Film in userRefs auftaucht der nicht im Catalog ist
  const prevRefKeysRef = useRef<string>('');
  useEffect(() => {
    if (!userMovieRefs || !catalogData) return;
    const currentKeys = Object.keys(userMovieRefs).sort().join(',');
    if (currentKeys === prevRefKeysRef.current) return;
    prevRefKeysRef.current = currentKeys;

    const missingInCatalog = Object.keys(userMovieRefs).some((id) => !catalogData[id]);
    if (missingInCatalog) {
      refetchCatalog(true);
    }
  }, [userMovieRefs, catalogData, refetchCatalog]);

  // Auto-Refresh: silent refetch, getrieben vom zentralen Versions-Watcher in
  // staticCatalog (subscribeCatalogChange). Ein tab-globaler Poll fuer alle
  // Consumer; userRefs via Ref gelesen, damit RTDB-Deltas das Abo nicht neu
  // aufsetzen. Parallel zum gleichen Mechanismus im SeriesListProvider.
  const userMovieRefsRef = useRef(userMovieRefs);
  useEffect(() => {
    userMovieRefsRef.current = userMovieRefs;
  }, [userMovieRefs]);

  useEffect(() => {
    const unsubscribe = subscribeCatalogChange(() => {
      void (async () => {
        const refs = userMovieRefsRef.current;
        if (!refs || Object.keys(refs).length === 0) return;
        try {
          const newMovies = await fetchStaticCatalogMovies();
          if (newMovies) setCatalogData(newMovies);
        } catch {
          // silent fail
        }
      })();
    });
    return unsubscribe;
  }, []);

  const loading = refsLoading || catalogLoading;

  // Merge: Catalog + UserRefs → Movie[]
  const movieList: Movie[] = useMemo(() => {
    if (!userMovieRefs || !catalogData) return [];

    const merged: Movie[] = [];
    for (const [tmdbIdStr, userRef] of Object.entries(userMovieRefs)) {
      const tmdbId = Number(tmdbIdStr);
      const catalog = catalogData[tmdbIdStr];
      if (!catalog) continue;
      merged.push(mergeToMovieView(tmdbId, catalog, userRef));
    }
    return merged;
  }, [userMovieRefs, catalogData]);

  // Memoize the context value so consumers (Ratings, HomePage, BottomNav, …)
  // only re-render when the actual data changes, not on every provider render.
  const contextValue = useMemo(
    () => ({ movieList, loading, refetchMovies: refetchRefs, isOffline, isStale }),
    [movieList, loading, refetchRefs, isOffline, isStale]
  );

  return <MovieListContext.Provider value={contextValue}>{children}</MovieListContext.Provider>;
};
