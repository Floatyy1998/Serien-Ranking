import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../App';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';

interface Stats {
  totalSeries: number;
  totalMovies: number;
  watchedEpisodes: number;
  totalEpisodes: number;
  watchedMovies: number;
  watchlistCount: number;
  todayEpisodes: number;
  progress: number;
}

export const useWebWorkerStatsOptimized = (): Stats => {
  const { user } = useAuth()!;
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  
  const workerRef = useRef<Worker | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>('');
  
  const [stats, setStats] = useState<Stats>({
    totalSeries: 0,
    totalMovies: 0,
    watchedEpisodes: 0,
    totalEpisodes: 0,
    watchedMovies: 0,
    watchlistCount: 0,
    todayEpisodes: 0,
    progress: 0,
  });
  
  // Create dependency string for comparison
  const depsString = useMemo(() => {
    return `${seriesList.length}-${movieList.length}-${user?.uid}`;
  }, [seriesList.length, movieList.length, user?.uid]);
  
  useEffect(() => {
    // Initialize worker only once
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/stats.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      workerRef.current.addEventListener('message', (event) => {
        if (event.data.type === 'STATS_RESULT') {
          requestAnimationFrame(() => {
            setStats(event.data.data);
          });
        }
      });
    }
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Skip if no data or same as last update
    if (!seriesList.length || depsString === lastUpdateRef.current) {
      return;
    }
    
    // Debounce worker updates by 500ms
    debounceTimerRef.current = setTimeout(() => {
      if (workerRef.current) {
        lastUpdateRef.current = depsString;
        workerRef.current.postMessage({
          type: 'CALCULATE_STATS',
          data: {
            seriesList,
            movieList,
            userId: user?.uid,
          },
        });
      }
    }, 500);
    
    // Cleanup function - only terminate worker on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [depsString, seriesList, movieList, user?.uid]);
  
  // Terminate worker only when component fully unmounts
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  return stats;
};