import { useMemo, useRef } from 'react';
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

export const useOptimizedStats = (): Stats => {
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  
  const cacheRef = useRef<{ stats: Stats | null; deps: string }>({ stats: null, deps: '' });
  
  const stats = useMemo(() => {
    const depsString = `${seriesList.length}-${movieList.length}-${user?.uid}`;
    
    if (cacheRef.current.stats && cacheRef.current.deps === depsString) {
      return cacheRef.current.stats;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    
    let totalSeries = 0;
    let watchlistCount = 0;
    let watchedEpisodes = 0;
    let totalAiredEpisodes = 0;
    let todayUnwatchedEpisodes = 0;
    
    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      if (!series?.nmr) continue;
      
      totalSeries++;
      
      if (series.watchlist === true) {
        watchlistCount++;
      }
      
      const seasons = series.seasons;
      if (!seasons) continue;
      
      for (let j = 0; j < seasons.length; j++) {
        const season = seasons[j];
        const episodes = season.episodes;
        if (!episodes) continue;
        
        for (let k = 0; k < episodes.length; k++) {
          const episode = episodes[k];
          if (!episode.air_date) continue;
          
          const airDate = new Date(episode.air_date);
          if (isNaN(airDate.getTime())) continue;
          
          airDate.setHours(0, 0, 0, 0);
          const airDateTime = airDate.getTime();
          
          if (airDateTime <= todayTime) {
            totalAiredEpisodes++;
            if (episode.watched === true) {
              watchedEpisodes++;
            }
            
            if (airDateTime === todayTime && !episode.watched) {
              todayUnwatchedEpisodes++;
            }
          }
        }
      }
    }
    
    let totalMovies = 0;
    let watchedMovies = 0;
    
    for (let i = 0; i < movieList.length; i++) {
      const movie = movieList[i];
      if (!movie?.nmr) continue;
      
      totalMovies++;
      
      if (movie.rating && user) {
        const userRating = movie.rating[user.uid];
        if (userRating && userRating > 0) {
          watchedMovies++;
        }
      }
    }
    
    const progress = totalAiredEpisodes > 0 
      ? Math.round((watchedEpisodes / totalAiredEpisodes) * 100)
      : 0;
    
    const result = {
      totalSeries,
      totalMovies,
      watchedEpisodes,
      totalEpisodes: totalAiredEpisodes,
      watchedMovies,
      watchlistCount,
      todayEpisodes: todayUnwatchedEpisodes,
      progress,
    };
    
    cacheRef.current = { stats: result, deps: depsString };
    return result;
  }, [seriesList, movieList, user]);
  
  return stats;
};