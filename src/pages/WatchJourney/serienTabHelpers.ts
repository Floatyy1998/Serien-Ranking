import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { getTmdbApiKey, tmdbFetch } from '../../services/tmdbClient';
import type { WatchJourneyData } from '../../services/watchJourneyService';
import { isEnglish, t } from '../../services/i18n';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
].map((m) => t(m));

const dateLocale = () => (isEnglish() ? 'en-US' : 'de-DE');

export const formatDateShort = (date: Date) => {
  return date.toLocaleDateString(dateLocale(), { day: '2-digit', month: 'short' });
};

export const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(dateLocale(), { day: '2-digit', month: 'short' });
};

export const useSeriesPosters = (seriesStats: WatchJourneyData['seriesStats']) => {
  const [posters, setPosters] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchPosters = async () => {
      if (!getTmdbApiKey() || seriesStats.length === 0) return;

      const newPosters: Record<number, string> = {};
      const seriesIds = seriesStats.map((s) => s.seriesId);

      const batchSize = 10;
      for (let i = 0; i < seriesIds.length; i += batchSize) {
        const batch = seriesIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (id) => {
            try {
              const tmdbData = await tmdbFetch<{ poster_path?: string | null }>(`tv/${id}`);
              if (tmdbData.poster_path) {
                newPosters[id] = tmdbData.poster_path;
              }
            } catch {
              // Silent fail (auch HTTP-Fehler — tmdbFetch wirft bei !ok)
            }
          })
        );
        setPosters({ ...newPosters });
      }
    };

    fetchPosters();
  }, [seriesStats]);

  return posters;
};

export const useTimelineSeries = (
  seriesStats: WatchJourneyData['seriesStats'],
  year: number,
  monthRangeStart: number,
  monthRangeEnd: number
) => {
  const sortedStats = useMemo(() => {
    return [...seriesStats].sort((a, b) => b.episodes - a.episodes);
  }, [seriesStats]);

  const timelineSeries = useMemo(() => {
    const rangeStart = new Date(year, monthRangeStart - 1, 1).getTime();
    const rangeEnd = new Date(year, monthRangeEnd, 0, 23, 59, 59).getTime();
    const rangeDuration = rangeEnd - rangeStart;

    return sortedStats
      .filter((series) => {
        const first = new Date(series.firstWatched).getTime();
        const last = new Date(series.lastWatched).getTime();
        return first <= rangeEnd && last >= rangeStart;
      })
      .map((series) => {
        const firstDate = new Date(series.firstWatched);
        const lastDate = new Date(series.lastWatched);

        const effectiveStart = Math.max(firstDate.getTime(), rangeStart);
        const effectiveEnd = Math.min(lastDate.getTime(), rangeEnd);

        const startPercent = ((effectiveStart - rangeStart) / rangeDuration) * 100;
        const endPercent = ((effectiveEnd - rangeStart) / rangeDuration) * 100;
        const widthPercent = Math.max(endPercent - startPercent, 2);

        const totalMinutes =
          series.episodes * (series.avgRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES);
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

        return {
          ...series,
          effectiveStart: new Date(effectiveStart),
          effectiveEnd: new Date(effectiveEnd),
          startPercent,
          widthPercent,
          totalHours,
        };
      })
      .sort((a, b) => a.effectiveStart.getTime() - b.effectiveStart.getTime());
  }, [sortedStats, year, monthRangeStart, monthRangeEnd]);

  const totalEpisodes = sortedStats.reduce((sum, s) => sum + s.episodes, 0);
  const uniqueSeriesCount = sortedStats.length;
  const avgEpisodesPerSeries =
    uniqueSeriesCount > 0 ? Math.round((totalEpisodes / uniqueSeriesCount) * 10) / 10 : 0;

  return {
    seriesStats: sortedStats,
    timelineSeries,
    totalEpisodes,
    uniqueSeriesCount,
    avgEpisodesPerSeries,
  };
};
