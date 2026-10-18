import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildCrossoverIndex,
  crossoverEpisodeKey,
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

  const index = useMemo(() => indexFor(map), [map]);
  const reload = useCallback(async () => {
    setMap(await loadCrossovers(true));
  }, []);

  return { index, loading: map === null, reload };
}

// Ein Index pro Datenstand — Listen mit vielen Zeilen teilen ihn statt ihn je Zeile neu zu bauen.
let cachedMap: CrossoverMap | null = null;
let cachedIndex: CrossoverIndex | null = null;
function indexFor(map: CrossoverMap | null): CrossoverIndex | null {
  if (!map) return null;
  if (map !== cachedMap) {
    cachedMap = map;
    cachedIndex = buildCrossoverIndex(map);
  }
  return cachedIndex;
}

/** Crossover einer einzelnen Folge (Staffel/Folge 1-basiert wie in den Routen). */
export function useEpisodeCrossovers(
  seriesId: number | string | undefined,
  seasonNumber: number | undefined,
  episodeNumber: number | undefined
): CrossoverRef[] {
  const { index } = useCrossoverIndex();
  const id = Number(seriesId);
  if (!index || !id || !seasonNumber || !episodeNumber) return EMPTY;
  return index.byEpisode.get(crossoverEpisodeKey(id, seasonNumber, episodeNumber)) || EMPTY;
}

const EMPTY: CrossoverRef[] = [];

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
