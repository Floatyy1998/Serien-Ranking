import { useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useMovieList } from '../contexts/MovieListContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import type { Movie } from '../types/Movie';
import type { Series } from '../types/Series';
import { useWebWorker } from './useWebWorker';

export interface WorkerStats {
  totalSeries: number;
  totalMovies: number;
  watchedEpisodes: number;
  watchedEpisodesActive: number;
  totalEpisodes: number;
  watchedMovies: number;
  watchlistCount: number;
  todayEpisodes: number;
  progress: number;
}

interface StatsWorkerInput {
  seriesList: Series[];
  movieList: Movie[];
  userId: string | undefined;
}

const INITIAL_STATS: WorkerStats = {
  totalSeries: 0,
  totalMovies: 0,
  watchedEpisodes: 0,
  watchedEpisodesActive: 0,
  totalEpisodes: 0,
  watchedMovies: 0,
  watchlistCount: 0,
  todayEpisodes: 0,
  progress: 0,
};

const createStatsWorker = () =>
  new Worker(new URL('../workers/stats.worker.ts', import.meta.url), { type: 'module' });

// Modul-level Cache: letzte berechnete Stats bleiben bei SPA-Navigation erhalten
let _cachedStats: WorkerStats = INITIAL_STATS;

export const useWebWorkerStatsOptimized = (): WorkerStats => {
  const { user } = useAuth() || {};
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const depsKey = `${seriesList.length}-${movieList.length}-${user?.uid}`;

  const workerInput = useMemo<StatsWorkerInput>(
    () => ({ seriesList, movieList, userId: user?.uid }),
    [seriesList, movieList, user?.uid]
  );

  const { data: stats } = useWebWorker<StatsWorkerInput, WorkerStats>(_cachedStats, {
    workerFactory: createStatsWorker,
    messageType: 'CALCULATE_STATS',
    resultType: 'STATS_RESULT',
    data: workerInput,
    depsKey,
    debounceMs: 300,
    enabled: seriesList.length > 0,
  });

  // Cache aktualisieren sobald echte Daten kommen
  useEffect(() => {
    if (stats.totalSeries > 0) _cachedStats = stats;
  }, [stats]);

  return stats;
};
