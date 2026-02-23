import { useMemo, useRef } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { getImageUrl } from '../utils/imageUrl';
import type { Series } from '../types/Series';

export const useContinueWatching = () => {
  const { seriesList } = useSeriesList();
  interface ContinueWatchingItem {
    type: 'series';
    id: number;
    nmr: number;
    title: string;
    poster: string;
    progress: number;
    nextEpisode: { seasonNumber: number; episodeNumber: number; name: string; seasonIndex: number; episodeIndex: number };
    airDate: string;
    lastWatchedAt: string;
    genre: Series['genre'];
    provider: Series['provider'];
    episodeRuntime: number;
    seasons: Series['seasons'];
  }

  const cacheRef = useRef<{ items: ContinueWatchingItem[] | null; deps: string }>({ items: null, deps: '' });

  const continueWatching = useMemo(() => {
    // Create a more detailed dependency string that includes watched status
    // This will invalidate the cache when episodes are marked as watched
    let watchedCount = 0;
    for (const series of seriesList) {
      if (series.seasons) {
        for (const season of series.seasons) {
          if (season.episodes) {
            watchedCount += season.episodes.filter((ep) => ep.watched).length;
          }
        }
      }
    }
    
    const depsString = `${seriesList.length}-${watchedCount}`;
    
    if (cacheRef.current.items && cacheRef.current.deps === depsString) {
      return cacheRef.current.items;
    }
    
    const items: ContinueWatchingItem[] = [];
    const today = new Date();
    
    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      if (!series.watchlist) continue;
      
      let lastWatchedAt: string | null = null;
      const seasons = series.seasons;
      
      if (seasons) {
        for (let j = 0; j < seasons.length; j++) {
          const episodes = seasons[j].episodes;
          if (!episodes) continue;
          
          for (let k = 0; k < episodes.length; k++) {
            const ep = episodes[k];
            if (ep.firstWatchedAt && ep.watched) {
              if (!lastWatchedAt || new Date(ep.firstWatchedAt) > new Date(lastWatchedAt)) {
                lastWatchedAt = ep.firstWatchedAt;
              }
            }
          }
        }
        
        let foundNext = false;
        for (let j = 0; j < seasons.length && !foundNext; j++) {
          const season = seasons[j];
          const episodes = season.episodes;
          if (!episodes) continue;
          
          for (let k = 0; k < episodes.length; k++) {
            const episode = episodes[k];
            if (!episode.watched && episode.air_date) {
              const airDate = new Date(episode.air_date);
              if (airDate <= today) {
                let totalAiredEpisodes = 0;
                let watchedEpisodes = 0;
                
                for (let s = 0; s < seasons.length; s++) {
                  const sEpisodes = seasons[s].episodes;
                  if (!sEpisodes) continue;
                  
                  for (let e = 0; e < sEpisodes.length; e++) {
                    const ep = sEpisodes[e];
                    if (ep.air_date) {
                      const epAirDate = new Date(ep.air_date);
                      if (epAirDate <= today) {
                        totalAiredEpisodes++;
                        if (ep.watched) watchedEpisodes++;
                      }
                    }
                  }
                }
                
                const percentage = totalAiredEpisodes > 0 
                  ? (watchedEpisodes / totalAiredEpisodes) * 100 
                  : 0;
                
                items.push({
                  type: 'series',
                  id: series.id,
                  nmr: series.nmr,
                  title: series.title,
                  poster: getImageUrl(series.poster),
                  progress: percentage,
                  nextEpisode: {
                    seasonNumber: (season.seasonNumber ?? 0) + 1,
                    episodeNumber: k + 1,
                    name: episode.name,
                    seasonIndex: j,
                    episodeIndex: k,
                  },
                  airDate: episode.air_date,
                  lastWatchedAt: lastWatchedAt || '1900-01-01',
                  genre: series.genre,
                  seasons: series.seasons,
                  provider: series.provider,
                  episodeRuntime: episode.runtime || series.episodeRuntime,
                });
                foundNext = true;
                break;
              }
            }
          }
        }
      }
    }
    
    items.sort((a, b) => {
      const dateA = new Date(a.lastWatchedAt).getTime();
      const dateB = new Date(b.lastWatchedAt).getTime();
      return dateB - dateA;
    });
    
    const result = items.slice(0, 10);
    cacheRef.current = { items: result, deps: depsString };
    return result;
  }, [seriesList]);
  
  return continueWatching;
};