import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildCrossoverIndex,
  crossoverKeysForSeries,
  type CrossoverIndex,
  type CrossoverRef,
} from '../../lib/crossover/crossoverIndex';
import {
  loadCrossovers,
  peekCrossovers,
  subscribeCrossovers,
} from '../../services/crossover/crossoverService';
import type { CrossoverMap } from '../../types/Crossover';

interface UseCrossoverIndexResult {
  index: CrossoverIndex | null;
  loading: boolean;
  reload: () => Promise<void>;
}

/** Gesamter Crossover-Index — einmal geladen, lebt die Sitzung über im Speicher. */
export function useCrossoverIndex(): UseCrossoverIndexResult {
  const [map, setMap] = useState<CrossoverMap | null>(() => peekCrossovers());

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeCrossovers((next) => {
      if (!cancelled) setMap(next);
    });
    loadCrossovers().then((next) => {
      if (!cancelled) setMap(next);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const index = useMemo(() => (map ? buildCrossoverIndex(map) : null), [map]);
  const reload = useCallback(async () => {
    setMap(await loadCrossovers(true));
  }, []);

  return { index, loading: map === null, reload };
}

interface UseSeriesCrossoversResult {
  refs: CrossoverRef[];
  /** Folgen-Lookup `s1-e9` → Crossover-Referenzen. */
  byEpisodeKey: Map<string, CrossoverRef[]>;
  loading: boolean;
  index: CrossoverIndex | null;
}

export function useSeriesCrossovers(seriesId: number | undefined): UseSeriesCrossoversResult {
  const { index, loading } = useCrossoverIndex();
  const refs = useMemo(
    () => (index && seriesId ? index.bySeries.get(seriesId) || [] : []),
    [index, seriesId]
  );
  const byEpisodeKey = useMemo(() => crossoverKeysForSeries(index, seriesId), [index, seriesId]);
  return { refs, byEpisodeKey, loading, index };
}
