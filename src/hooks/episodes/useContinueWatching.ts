import { useMemo } from 'react';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { getImageUrl } from '../../utils/imageUrl';
import { hasEpisodeAired, getEpisodeAirDateStr } from '../../utils/episodeDate';
import { calculateSeriesMetrics, getSeriesLastWatchedAt } from '../../lib/episode/seriesMetrics';
import type { Series } from '../../types/Series';

export const useContinueWatching = () => {
  const { seriesList } = useSeriesList();
  interface ContinueWatchingItem {
    type: 'series';
    id: number;
    nmr: number;
    title: string;
    poster: string;
    progress: number;
    nextEpisode: {
      seasonNumber: number;
      episodeNumber: number;
      name: string;
      seasonIndex: number;
      episodeIndex: number;
    };
    airDate: string;
    lastWatchedAt: string;
    genre: Series['genre'];
    provider: Series['provider'];
    episodeRuntime: number;
    seasons: Series['seasons'];
  }

  const continueWatching = useMemo(() => {
    const items: ContinueWatchingItem[] = [];

    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      if (!series.watchlist) continue;

      const lastWatchedAt = getSeriesLastWatchedAt(series);
      const { progress } = calculateSeriesMetrics(series);
      const seasons = series.seasons;

      if (seasons) {
        let foundNext = false;
        for (let j = 0; j < seasons.length && !foundNext; j++) {
          const season = seasons[j];
          const episodes2 = season.episodes;
          if (!episodes2) continue;

          for (let k = 0; k < episodes2.length; k++) {
            const episode = episodes2[k];
            if (!episode?.watched && hasEpisodeAired(episode)) {
              items.push({
                type: 'series',
                id: series.id,
                nmr: series.nmr,
                title: series.title,
                poster: getImageUrl(series.poster),
                progress,
                nextEpisode: {
                  seasonNumber: (season.seasonNumber ?? 0) + 1,
                  episodeNumber: k + 1,
                  name: episode.name,
                  seasonIndex: j,
                  episodeIndex: k,
                },
                airDate: getEpisodeAirDateStr(episode) || episode.air_date,
                lastWatchedAt,
                genre: series.genre,
                seasons: series.seasons,
                provider: series.provider,
                episodeRuntime: episode.runtime || series.episodeRuntime,
              });
              foundNext = true;
              break;
            }
          }
        }
      }
    }

    items.sort((a, b) => {
      const dateA = new Date(a.lastWatchedAt).getTime();
      const dateB = new Date(b.lastWatchedAt).getTime();
      return dateB - dateA;
    });

    return items.slice(0, 10);
  }, [seriesList]);

  return continueWatching;
};
