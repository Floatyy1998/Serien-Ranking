import { useEffect, useRef, useState } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';

interface TodayEpisode {
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
}

export const useWebWorkerTodayEpisodes = (): TodayEpisode[] => {
  const { seriesList } = useSeriesList();
  const workerRef = useRef<Worker | null>(null);
  const [episodes, setEpisodes] = useState<TodayEpisode[]>([]);

  useEffect(() => {
    // Initialize worker
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/stats.worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.addEventListener('message', (event) => {
        if (event.data.type === 'EPISODES_RESULT') {
          setEpisodes(event.data.data);
        }
      });
    }

    // Send data to worker
    if (workerRef.current && seriesList.length > 0) {
      workerRef.current.postMessage({
        type: 'PROCESS_EPISODES',
        data: { seriesList },
      });
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [seriesList]);

  return episodes;
};
