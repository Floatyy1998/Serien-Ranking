import { useEffect, useState } from 'react';
import {
  fetchSeriesAiring,
  getCachedSeriesAiring,
  type SeriesAiring,
} from '../../services/catalog/seriesAiring';

export function useSeriesAiring(type: 'series' | 'movie', id: number): SeriesAiring | null {
  const enabled = type === 'series';
  const [found, setFound] = useState<{ id: number; airing: SeriesAiring | null } | null>(null);
  const cached = enabled ? getCachedSeriesAiring(id) : null;

  useEffect(() => {
    if (!enabled || getCachedSeriesAiring(id) !== undefined) return;
    let alive = true;
    void fetchSeriesAiring(id).then((airing) => {
      if (alive) setFound({ id, airing });
    });
    return () => {
      alive = false;
    };
  }, [enabled, id]);

  if (!enabled) return null;
  if (cached !== undefined) return cached;
  return found?.id === id ? found.airing : null;
}
