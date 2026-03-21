import { useMemo } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import type { Series } from '../types/Series';
import { useWebWorker } from './useWebWorker';

/** Episode die heute ausgestrahlt wird oder ausgestrahlt wurde und noch nicht gesehen wurde */
export interface TodayEpisode {
  seriesId: string;
  seriesNmr: string;
  seriesTitle: string;
  poster: string;
  seasonNumber: number;
  episodeNumber: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeId: string;
  episodeName: string;
  watched: boolean;
  runtime: number;
  seriesGenre?: string[];
  seriesProviders?: string[];
}

interface EpisodesWorkerInput {
  seriesList: Series[];
}

const INITIAL_EPISODES: TodayEpisode[] = [];

const createEpisodesWorker = () =>
  new Worker(new URL('../workers/stats.worker.ts', import.meta.url), { type: 'module' });

export const useWebWorkerTodayEpisodes = (): TodayEpisode[] => {
  const { seriesList } = useSeriesList();

  const depsKey = `${seriesList.length}`;

  const workerInput = useMemo<EpisodesWorkerInput>(() => ({ seriesList }), [seriesList]);

  const { data: episodes } = useWebWorker<EpisodesWorkerInput, TodayEpisode[]>(INITIAL_EPISODES, {
    workerFactory: createEpisodesWorker,
    messageType: 'PROCESS_EPISODES',
    resultType: 'EPISODES_RESULT',
    data: workerInput,
    depsKey,
    enabled: seriesList.length > 0,
  });

  return episodes;
};
