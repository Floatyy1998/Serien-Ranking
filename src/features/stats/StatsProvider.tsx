import 'firebase/compat/database';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { StatsData } from '../../types/StatsData';
import { calculateOverallRating } from '../../lib/rating/rating';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import type { Series } from '../../types/Series';

interface StatsEpisode {
  watched: boolean;
  watchCount?: number;
  runtime?: number;
}

interface StatsSeason {
  episodes?: StatsEpisode[];
}

interface StatsListItem {
  seasons?: StatsSeason[];
  episodeRuntime?: number;
  runtime?: number;
  rating?: Record<string, number>;
  genre?: { genres?: string[] };
  provider?: { provider?: { name: string }[] };
}

interface StatsContextType {
  seriesStatsData: StatsData | null;
  movieStatsData: StatsData | null;
}

export const StatsContext = createContext<StatsContextType>({
  seriesStatsData: null,
  movieStatsData: null,
});

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()!;
  const [, setSeriesList] = useState<StatsListItem[]>([]);
  const [, setMovieList] = useState<StatsListItem[]>([]);
  const [seriesStatsData, setSeriesStatsData] = useState<StatsData | null>(null);
  const [movieStatsData, setMovieStatsData] = useState<StatsData | null>(null);
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

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

  const computeStats = (list: StatsListItem[]): StatsData => {
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
    let ratedItems = 0;
    let episodesWatched = 0;

    list.forEach((item) => {
      const ratingStr = calculateOverallRating(item as unknown as Series);
      const rating = parseFloat(ratingStr);

      const seriesRuntime = item.episodeRuntime || item.runtime || 0;
      // Watchtime und gesehene Episoden für ALLE Serien berechnen (inkl. Rewatches)
      episodesWatched +=
        item.seasons?.reduce(
          (count: number, season: StatsSeason) =>
            count +
            (season.episodes?.reduce((episodeCount: number, episode: StatsEpisode) => {
              if (episode.watched) {
                return episodeCount + (episode.watchCount || 1);
              }
              return episodeCount;
            }, 0) || 0),
          0
        ) || 0;
      watchtime +=
        item.seasons?.reduce(
          (time: number, season: StatsSeason) =>
            time +
            (season.episodes?.reduce((episodeTime: number, episode: StatsEpisode) => {
              if (episode.watched) {
                return episodeTime + (episode.watchCount || 1) * (episode.runtime || seriesRuntime);
              }
              return episodeTime;
            }, 0) || 0),
          0
        ) || 0;

      // Bewertete Serien separat zählen
      if (rating > 0) {
        ratedItems += 1;
        item.genre?.genres?.forEach((genre: string) => {
          if (genre !== 'All') {
            if (!genres[genre]) {
              genres[genre] = { count: 0, totalRating: 0, averageRating: 0 };
            }
            genres[genre].count++;
            genres[genre].totalRating += rating;
          }
        });
        item.provider?.provider?.forEach((provider) => {
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
      }
    });

    Object.keys(genres).forEach((key) => {
      genres[key].averageRating =
        genres[key].count > 0 ? genres[key].totalRating / genres[key].count : 0;
    });
    Object.keys(providers).forEach((key) => {
      providers[key].averageRating =
        providers[key].count > 0 ? providers[key].totalRating / providers[key].count : 0;
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
        seriesRated: ratedItems,
        watchtimeTotal: watchtime,
      },
    };
  };

  useEffect(() => {
    if (user) {
      if (seriesList) {
        const seriesArray = (
          Array.isArray(seriesList) ? seriesList : Object.values(seriesList || {})
        ) as StatsListItem[];
        setSeriesList(seriesArray);
        setSeriesStatsData(computeStats(seriesArray));
      }
      if (movieList) {
        const movieArray = (
          Array.isArray(movieList) ? movieList : Object.values(movieList || {})
        ) as StatsListItem[];
        setMovieList(movieArray);
        setMovieStatsData(computeStats(movieArray));
      }
    }
  }, [user, seriesList, movieList]);

  return (
    <StatsContext.Provider value={{ seriesStatsData, movieStatsData }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => useContext(StatsContext);
