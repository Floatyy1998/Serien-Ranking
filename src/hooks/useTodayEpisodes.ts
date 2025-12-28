import { useMemo, useRef } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';

const getImageUrl = (posterObj: any): string => {
  if (!posterObj) return '/placeholder.jpg';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
};

export const useTodayEpisodes = () => {
  const { seriesList } = useSeriesList();
  const cacheRef = useRef<{ episodes: any[] | null; deps: string; date: string }>({ 
    episodes: null, 
    deps: '', 
    date: '' 
  });
  
  const todayEpisodes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const todayString = today.toDateString();
    const depsString = `${seriesList.length}`;
    
    if (cacheRef.current.episodes && 
        cacheRef.current.deps === depsString && 
        cacheRef.current.date === todayString) {
      return cacheRef.current.episodes;
    }
    
    const episodes: any[] = [];
    
    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      const seasons = series.seasons;
      if (!seasons) continue;
      
      for (let j = 0; j < seasons.length; j++) {
        const season = seasons[j];
        const seasonEpisodes = season.episodes;
        if (!seasonEpisodes) continue;
        
        for (let k = 0; k < seasonEpisodes.length; k++) {
          const episode = seasonEpisodes[k];
          if (!episode.air_date || episode.watched) continue;
          
          const episodeDate = new Date(episode.air_date);
          if (isNaN(episodeDate.getTime())) continue;
          
          episodeDate.setHours(0, 0, 0, 0);
          
          if (episodeDate.getTime() === todayTime) {
            const actualSeasonIndex = series.seasons?.findIndex(s => s.seasonNumber === season.seasonNumber) ?? 0;
            
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
            });
          }
        }
      }
    }
    
    cacheRef.current = { episodes, deps: depsString, date: todayString };
    return episodes;
  }, [seriesList]);
  
  return todayEpisodes;
};