import { useMemo } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { SEASON_BREAK_GAP_DAYS } from '../lib/episode/constants';
import { getEpisodeAirDate, getEpisodeAirDateStr } from '../utils/episodeDate';

export type CountdownType = 'season-start' | 'mid-season-return';

export interface SeriesCountdown {
  seriesId: number;
  title: string;
  posterUrl: string;
  nextDate: string;
  daysUntil: number;
  seasonNumber: number;
  type: CountdownType;
}

export function useSeriesCountdowns() {
  const { seriesList } = useSeriesList();

  const countdowns = useMemo(() => {
    if (seriesList.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const results: SeriesCountdown[] = [];

    const GAP_THRESHOLD_DAYS = SEASON_BREAK_GAP_DAYS;

    for (const series of seriesList) {
      if (!series.id || !series.seasons) continue;

      let best: SeriesCountdown | null = null;
      const seriesTitle = series.title || series.name || series.original_name || '';
      const posterUrl = series.poster?.poster || '';

      for (const season of series.seasons) {
        if (!season) continue;
        const seasonNum = season.seasonNumber ?? season.season_number ?? 0;
        if (seasonNum < 0 || !season.episodes?.length) continue;

        const episodes = season.episodes;

        // Check season start (first episode in the future)
        const firstEp = episodes[0];
        const firstDateStr = getEpisodeAirDateStr(firstEp);
        if (firstDateStr) {
          const firstAirDate = getEpisodeAirDate(firstEp);
          if (firstAirDate) {
            firstAirDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.round(
              (firstAirDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysUntil >= 0 && (!best || daysUntil < best.daysUntil)) {
              best = {
                seriesId: series.id,
                title: seriesTitle,
                posterUrl,
                nextDate: firstDateStr,
                daysUntil,
                seasonNumber: seasonNum + 1,
                type: 'season-start',
              };
            }
          }
        }

        // Check for mid-season returns (episode after a >14 day gap, in the future)
        for (let i = 1; i < episodes.length; i++) {
          const ep = episodes[i];
          const prevEp = episodes[i - 1];
          const epDate = getEpisodeAirDate(ep);
          const prevDate = getEpisodeAirDate(prevEp);
          if (!epDate || !prevDate) continue;

          epDate.setHours(0, 0, 0, 0);
          prevDate.setHours(0, 0, 0, 0);

          const gapDays = (epDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          if (gapDays <= GAP_THRESHOLD_DAYS) continue;

          const daysUntil = Math.round(
            (epDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntil >= 0 && (!best || daysUntil < best.daysUntil)) {
            const dateStr = getEpisodeAirDateStr(ep);
            if (dateStr) {
              best = {
                seriesId: series.id,
                title: seriesTitle,
                posterUrl,
                nextDate: dateStr,
                daysUntil,
                seasonNumber: seasonNum + 1,
                type: 'mid-season-return',
              };
            }
          }
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
