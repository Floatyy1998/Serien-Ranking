import { useMemo } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
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
  providerLogo?: string;
  providerName?: string;
  chipType?: 'season-start' | 'mid-season-return' | 'season-finale' | 'season-break';
}

interface EpisodesWorkerInput {
  seriesList: Series[];
}

const INITIAL_EPISODES: TodayEpisode[] = [];

const createEpisodesWorker = () =>
  new Worker(new URL('../workers/stats.worker.ts', import.meta.url), { type: 'module' });

export const useWebWorkerTodayEpisodes = (): TodayEpisode[] => {
  const { seriesList } = useSeriesList();

  // depsKey muss sich ändern wenn Episoden als watched markiert werden
  const watchedCount = useMemo(() => {
    let count = 0;
    for (const s of seriesList) {
      if (!s.seasons) continue;
      for (const season of s.seasons) {
        if (!season.episodes) continue;
        for (const ep of season.episodes) {
          if (ep.watched) count++;
        }
      }
    }
    return count;
  }, [seriesList]);

  const depsKey = `${seriesList.length}-${watchedCount}`;

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
