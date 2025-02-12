import 'firebase/compat/database';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { StatsData } from '../interfaces/StatsData';
import { calculateOverallRating } from '../utils/rating';
import { useSeriesList } from './SeriesListProvider';
interface StatsContextType {
  statsData: StatsData | null;
}
export const StatsContext = createContext<StatsContextType>({
  statsData: null,
});
export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()!;
  const [, setSeriesList] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const { seriesList } = useSeriesList();
  function secondsToString(minutes: number) {
    let value = minutes;
    const units: { [key: string]: number } = {
      Jahre: 24 * 60 * 365,
      Monate: 24 * 60 * 30,
      Tage: 24 * 60,
      Stunden: 60,
      Minuten: 1,
    };
    const result: string[] = [];
    for (const name in units) {
      const p = Math.floor(value / units[name]);
      if (p > 0) result.push(p + ' ' + name);
      value %= units[name];
    }
    return result;
  }
  const computeStats = (seriesList: any[]): StatsData => {
    const genres: {
      [key: string]: {
        count: number;
        totalRating: number;
        averageRating: number;
      };
    } = {};
    const providers: {
      [key: string]: {
        count: number;
        totalRating: number;
        averageRating: number;
      };
    } = {};
    let watchtime = 0;
    let seriesRated = 0;
    let episodesWatched = 0;
    seriesList.forEach((series) => {
      const ratingStr = calculateOverallRating(series);
      const rating = parseFloat(ratingStr);
      if (rating !== 0) {
        seriesRated += 1;
      }
      episodesWatched +=
        series.seasons?.reduce(
          (count: number, season: any) =>
            count +
            (season.episodes?.filter((episode: any) => episode.watched)
              ?.length || 0),
          0
        ) || 0;
      watchtime +=
        series.seasons?.reduce(
          (time: number, season: any) =>
            time +
            (season.episodes?.filter((episode: any) => episode.watched)
              ?.length || 0) *
              series.episodeRuntime,
          0
        ) || 0;
      series.genre?.genres?.forEach((genre: string) => {
        if (genre !== 'All') {
          if (!genres[genre]) {
            genres[genre] = { count: 0, totalRating: 0, averageRating: 0 };
          }
          genres[genre].count++;
          genres[genre].totalRating += rating;
        }
      });
      series.provider?.provider?.forEach((provider: { name: string }) => {
        if (!providers[provider.name]) {
          providers[provider.name] = {
            count: 0,
            totalRating: 0,
            averageRating: 0,
          };
        }
        providers[provider.name].count++;
        providers[provider.name].totalRating += rating;
      });
    });
    Object.keys(genres).forEach((key) => {
      genres[key].averageRating =
        genres[key].count > 0 ? genres[key].totalRating / genres[key].count : 0;
    });
    Object.keys(providers).forEach((key) => {
      providers[key].averageRating =
        providers[key].count > 0
          ? providers[key].totalRating / providers[key].count
          : 0;
    });
    return {
      genres: Object.keys(genres).map((key) => ({ name: key, ...genres[key] })),
      providers: Object.keys(providers).map((key) => ({
        name: key,
        ...providers[key],
      })),
      userStats: {
        watchtime: secondsToString(watchtime),
        episodesWatched,
        seriesRated,
        watchtimeTotal: watchtime,
      },
    };
  };
  useEffect(() => {
    if (user) {
      if (seriesList) {
        const seriesArray = Object.values(seriesList);
        setSeriesList(seriesArray);
        setStatsData(computeStats(seriesArray));
      }
    }
  }, [user, seriesList]);
  return (
    <StatsContext.Provider value={{ statsData }}>
      {children}
    </StatsContext.Provider>
  );
};
export const useStats = () => useContext(StatsContext);
