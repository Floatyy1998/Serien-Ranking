import { useEffect, useMemo, useState } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import type { Series } from '../types/Series';
import { getEpisodeAirDate } from '../utils/episodeDate';
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

function getTodayKey() {
  return new Date().toDateString();
}

export const useTodayEpisodes = () => {
  const { seriesList } = useSeriesList();
  const [todayKey, setTodayKey] = useState(getTodayKey);

  // Check for date change every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getTodayKey();
      setTodayKey((prev) => (prev !== now ? now : prev));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const todayEpisodes = useMemo(() => {
    void todayKey;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTime = tomorrow.getTime();

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
          if (episode.watched) continue;

          const airDate = getEpisodeAirDate(episode);
          if (!airDate) continue;

          // Compare date portion in local timezone
          const epDay = new Date(airDate);
          epDay.setHours(0, 0, 0, 0);
          const epTime = epDay.getTime();

          if (epTime >= todayTime && epTime < tomorrowTime) {
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
  }, [seriesList, todayKey]);

  return todayEpisodes;
};
