import { useCallback, useEffect, useState } from 'react';
import type { BundledTitle } from '../../lib/social/activityBundles';
import {
  fetchStaticCatalogMovies,
  fetchStaticCatalogSeries,
} from '../../services/catalog/staticCatalog';
import type { CatalogMovie, CatalogSeries } from '../../types/CatalogTypes';

interface CatalogMaps {
  series: Record<string, CatalogSeries> | null;
  movies: Record<string, CatalogMovie> | null;
}

/** Poster für Freundes-Aktivitäten: gespeichert oder aus dem (ohnehin geladenen) Katalog. */
export function useActivityPosters(enabled: boolean): (title: BundledTitle) => string | undefined {
  const [maps, setMaps] = useState<CatalogMaps>({ series: null, movies: null });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void Promise.all([fetchStaticCatalogSeries(), fetchStaticCatalogMovies()])
      .then(([series, movies]) => {
        if (alive) setMaps({ series, movies });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);

  return useCallback(
    (title: BundledTitle) => {
      if (title.poster) return title.poster;
      const key = String(title.id ?? '');
      if (title.media === 'series') return maps.series?.[key]?.poster || undefined;
      if (title.media === 'movie') return maps.movies?.[key]?.poster || undefined;
      return undefined;
    },
    [maps]
  );
}
