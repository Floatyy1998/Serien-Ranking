import { useEffect, useMemo, useState } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import type { Series } from '../types/Series';
import { getEpisodeAirDate } from '../utils/episodeDate';
import { getBackdropSize, getImageUrl } from '../utils/imageUrl';

interface TodayEpisode {
  seriesId: number;
  seriesTitle: string;
  poster: string;
  /** Volle Backdrop-URL (w1280) fürs Zeilen-Artwork. */
  backdrop?: string;
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

  // Check for date change every minute — but pause when the tab is hidden
  // so background tabs don't burn CPU/wakeups. When the tab becomes visible
  // again we do one immediate check (in case midnight passed while hidden).
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const check = () => {
      const now = getTodayKey();
      setTodayKey((prev) => (prev !== now ? now : prev));
    };
    const start = () => {
      if (interval) return;
      interval = setInterval(check, 60_000);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        check();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
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
              seriesTitle: series.title,
              poster: getImageUrl(series.poster),
              backdrop: series.backdrop
                ? getImageUrl(series.backdrop, getBackdropSize())
                : undefined,
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
