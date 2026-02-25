import { useMemo } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { hasActiveRewatch, getNextRewatchEpisode, getRewatchProgress } from '../lib/validation/rewatch.utils';
import { getImageUrl } from '../utils/imageUrl';
import type { Series } from '../types/Series';

export interface RewatchItem {
  id: number;
  nmr: number;
  title: string;
  poster: string;
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  currentWatchCount: number;
  targetWatchCount: number;
  progress: number;
  progressCurrent: number;
  progressTotal: number;
  genre: Series['genre'];
  provider: Series['provider'];
  episodeRuntime: number;
}

export const useRewatchEpisodes = (): RewatchItem[] => {
  const { seriesList } = useSeriesList();

  return useMemo(() => {
    const items: RewatchItem[] = [];

    for (const series of seriesList) {
      if (!series.watchlist) continue;
      if (!series.seasons?.length) continue;
      if (!hasActiveRewatch(series)) continue;

      const nextEp = getNextRewatchEpisode(series);
      if (!nextEp) continue;

      const seasonsArray: Series['seasons'] = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons) as Series['seasons'];
      const seasonIndex = seasonsArray.findIndex(s => s.seasonNumber === nextEp.seasonNumber);
      if (seasonIndex === -1) continue;

      const ep = seasonsArray[seasonIndex]?.episodes?.[nextEp.episodeIndex];
      const progress = getRewatchProgress(series);
      const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

      items.push({
        id: series.id,
        nmr: series.nmr,
        title: series.title,
        poster: getImageUrl(series.poster),
        seasonIndex,
        episodeIndex: nextEp.episodeIndex,
        seasonNumber: nextEp.seasonNumber + 1,
        episodeNumber: nextEp.episodeIndex + 1,
        episodeName: nextEp.name || `Episode ${nextEp.episodeIndex + 1}`,
        currentWatchCount: nextEp.currentWatchCount,
        targetWatchCount: nextEp.targetWatchCount,
        progress: percent,
        progressCurrent: progress.current,
        progressTotal: progress.total,
        genre: series.genre,
        provider: series.provider,
        episodeRuntime: ep?.runtime || series.episodeRuntime || 45,
      });
    }

    return items;
  }, [seriesList]);
};
