import { useMemo, useRef } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { calculateOverallRating } from '../lib/rating/rating';
import { getImageUrl } from '../utils/imageUrl';

export const useRecentlyWatched = () => {
  const { seriesList } = useSeriesList();
  interface RecentlyWatchedItem {
    type: 'series';
    id: number;
    title: string;
    poster: string;
    rating: number;
  }

  const cacheRef = useRef<{ items: RecentlyWatchedItem[] | null; deps: string }>({ items: null, deps: '' });
  
  const recentlyWatched = useMemo(() => {
    const depsString = `${seriesList.length}`;
    
    if (cacheRef.current.items && cacheRef.current.deps === depsString) {
      return cacheRef.current.items;
    }
    
    const items: RecentlyWatchedItem[] = [];
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