import { useMemo, useRef } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { calculateOverallRating } from '../lib/rating/rating';

const getImageUrl = (posterObj: any): string => {
  if (!posterObj) return '/placeholder.jpg';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
};

export const useRecentlyWatched = () => {
  const { seriesList } = useSeriesList();
  const cacheRef = useRef<{ items: any[] | null; deps: string }>({ items: null, deps: '' });
  
  const recentlyWatched = useMemo(() => {
    const depsString = `${seriesList.length}`;
    
    if (cacheRef.current.items && cacheRef.current.deps === depsString) {
      return cacheRef.current.items;
    }
    
    const items: any[] = [];
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      const seasons = series.seasons;
      if (!seasons) continue;
      
      let hasRecent = false;
      
      for (let j = 0; j < seasons.length && !hasRecent; j++) {
        const episodes = seasons[j].episodes;
        if (!episodes) continue;
        
        for (let k = 0; k < episodes.length; k++) {
          const ep = episodes[k];
          if (ep.firstWatchedAt) {
            const watchTime = new Date(ep.firstWatchedAt).getTime();
            if (watchTime >= sevenDaysAgo) {
              hasRecent = true;
              break;
            }
          }
        }
      }
      
      if (hasRecent) {
        items.push({
          type: 'series',
          id: series.id,
          title: series.title,
          poster: getImageUrl(series.poster),
          rating: parseFloat(calculateOverallRating(series)),
        });
      }
    }
    
    const result = items.slice(0, 10);
    cacheRef.current = { items: result, deps: depsString };
    return result;
  }, [seriesList]);
  
  return recentlyWatched;
};