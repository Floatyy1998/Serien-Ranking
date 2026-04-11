import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import type { Movie } from '../types/Movie';
import type { CatalogMovie, UserMovieRef } from '../types/CatalogTypes';
import { mergeToMovieView } from '../lib/seriesAdapter';
import { MovieListContext } from './MovieListContext';
import { fetchStaticCatalogMovies, clearStaticCatalogCache } from '../lib/staticCatalog';

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
      if (forceFresh) clearStaticCatalogCache();
      let merged: Record<string, CatalogMovie> | null = null;

      try {
        const staticData = await fetchStaticCatalogMovies();
        if (staticData) merged = staticData;
      } catch {
        // ignore
      }

      const userIds = Object.keys(userMovieRefs);
      const missingIds = userIds.filter((id) => !merged || !merged[id]);
      if (merged && missingIds.length > 0 && missingIds.length < 20) {
        try {
          const db = firebase.database();
          const results = await Promise.all(
            missingIds.map((id) => db.ref(`catalog/moviesMeta/${id}`).once('value'))
          );
          const patched: Record<string, CatalogMovie> = { ...merged };
          for (let i = 0; i < missingIds.length; i++) {
            const val = results[i].val();
            if (val) patched[missingIds[i]] = val as CatalogMovie;
          }
          merged = patched;
        } catch (e) {
          console.warn('[catalog] missing-id firebase fallback failed', e);
        }
      }

      if (!merged) {
        try {
          const snap = await firebase.database().ref('catalog/moviesMeta').once('value');
          merged = snap.val() || {};
        } catch (e) {
          console.warn('[catalog] full firebase fallback failed', e);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refetchCatalog(true);
    }
  }, [userMovieRefs, catalogData, refetchCatalog]);

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

  return (
    <MovieListContext.Provider
      value={{
        movieList,
        loading,
        refetchMovies: refetchRefs,
        isOffline,
        isStale,
      }}
    >
      {children}
    </MovieListContext.Provider>
  );
};
