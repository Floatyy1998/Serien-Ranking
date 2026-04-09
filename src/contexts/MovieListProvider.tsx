import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import type { Movie } from '../types/Movie';
import type { CatalogMovie, UserMovieRef } from '../types/CatalogTypes';
import { mergeToMovieView } from '../lib/seriesAdapter';
import { MovieListContext } from './MovieListContext';

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

  // 2. Catalog (shared, aggressiv gecacht)
  const {
    data: catalogData,
    loading: catalogLoading,
    refetch: refetchCatalog,
  } = useEnhancedFirebaseCache<Record<string, CatalogMovie>>(
    userMovieRefs && Object.keys(userMovieRefs).length > 0 ? 'catalog/moviesMeta' : '',
    {
      ttl: 24 * 60 * 60 * 1000,
      versionPath: 'catalog/version',
      enableOfflineSupport: true,
      syncOnReconnect: true,
    }
  );

  // Auto-Refetch: Wenn ein neuer Film in userRefs auftaucht der nicht im Catalog ist
  const prevRefKeysRef = useRef<string>('');
  useEffect(() => {
    if (!userMovieRefs || !catalogData) return;
    const currentKeys = Object.keys(userMovieRefs).sort().join(',');
    if (currentKeys === prevRefKeysRef.current) return;
    prevRefKeysRef.current = currentKeys;

    const missingInCatalog = Object.keys(userMovieRefs).some((id) => !catalogData[id]);
    if (missingInCatalog) {
      refetchCatalog();
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
