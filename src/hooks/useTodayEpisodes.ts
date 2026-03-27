import { useMemo } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import type { Series } from '../types/Series';
import { getImageUrl } from '../utils/imageUrl';

interface TodayEpisode {
  seriesId: number;
  seriesNmr: number;
  seriesTitle: string;
  poster: string;
  seasonNumber: number;
  episodeNumber: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeId: number;
  episodeName: string;
  watched: boolean;
  provider: Series['provider'];
}

export const useTodayEpisodes = () => {
  const { seriesList } = useSeriesList();

  const todayEpisodes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const episodes: TodayEpisode[] = [];

    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      if (series.hidden) continue;
      const seasons = series.seasons;
      if (!seasons) continue;

      for (let j = 0; j < seasons.length; j++) {
        const season = seasons[j];
        const seasonEpisodes = season.episodes;
        if (!seasonEpisodes) continue;

        for (let k = 0; k < seasonEpisodes.length; k++) {
          const episode = seasonEpisodes[k];
          if (!episode.air_date || episode.watched) continue;

          // Parse air_date as local date (not UTC) to avoid timezone offset issues
          const parts = episode.air_date.split('-');
          const episodeDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
          if (isNaN(episodeDate.getTime())) continue;

          if (episodeDate.getTime() === todayTime) {
            const actualSeasonIndex =
              series.seasons?.findIndex((s) => s.seasonNumber === season.seasonNumber) ?? 0;

            episodes.push({
              seriesId: series.id,
              seriesNmr: series.nmr,
              seriesTitle: series.title,
              poster: getImageUrl(series.poster),
              seasonNumber: season.seasonNumber || 1,
              episodeNumber: k + 1,
              seasonIndex: actualSeasonIndex,
              episodeIndex: k,
              episodeId: episode.id,
              episodeName: episode.name,
              watched: episode.watched,
              provider: series.provider,
            });
          }
        }
      }
    }

    return episodes;
  }, [seriesList]);

  return todayEpisodes;
};
