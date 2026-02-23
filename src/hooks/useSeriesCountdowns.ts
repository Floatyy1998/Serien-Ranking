import { useMemo } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';

export interface SeriesCountdown {
  seriesId: number;
  title: string;
  posterUrl: string;
  nextDate: string;
  daysUntil: number;
  seasonNumber: number;
}

export function useSeriesCountdowns() {
  const { seriesList } = useSeriesList();

  const countdowns = useMemo(() => {
    if (seriesList.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const results: SeriesCountdown[] = [];

    for (const series of seriesList) {
      if (!series.id || !series.seasons) continue;

      let best: SeriesCountdown | null = null;

      for (const season of series.seasons) {
        const seasonNum = season.seasonNumber || season.season_number || 0;
        if (seasonNum < 0 || !season.episodes?.length) continue;

        // Use first episode's air_date as season start date
        const firstEp = season.episodes[0];
        const dateStr = firstEp?.air_date || firstEp?.airDate || firstEp?.firstAired;
        if (!dateStr) continue;

        const airDate = new Date(dateStr);
        airDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.round((airDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil > 0 && (!best || daysUntil < best.daysUntil)) {
          best = {
            seriesId: series.id,
            title: series.title,
            posterUrl: series.poster?.poster || '',
            nextDate: dateStr,
            daysUntil,
            seasonNumber: seasonNum + 1,
          };
        }
      }

      if (best) {
        results.push(best);
      }
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [seriesList]);

  const loading = seriesList.length === 0;

  return { countdowns, loading };
}
