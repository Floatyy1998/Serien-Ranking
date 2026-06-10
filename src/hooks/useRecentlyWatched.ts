import { useMemo, useState } from 'react';
import { useSeriesList } from '../contexts/SeriesListContext';
import { HOME_CAROUSEL_MAX_ITEMS, SEVEN_DAYS_MS } from '../lib/episode/constants';
import { calculateOverallRating } from '../lib/rating/rating';
import { getImageUrl } from '../utils/imageUrl';

export interface RecentlyWatchedItem {
  type: 'series';
  id: number;
  title: string;
  poster: string;
  rating: number;
}

export const useRecentlyWatched = (): RecentlyWatchedItem[] => {
  const { seriesList } = useSeriesList();
  // Use state initializer to avoid impure Date.now() during render
  const [sevenDaysAgo] = useState(() => Date.now() - SEVEN_DAYS_MS);

  return useMemo(() => {
    const items: RecentlyWatchedItem[] = [];

    for (const series of seriesList) {
      const seasons = series.seasons;
      if (!seasons) continue;

      let hasRecent = false;

      outer: for (const season of seasons) {
        const episodes = season.episodes;
        if (!episodes) continue;
        for (const ep of episodes) {
          if (ep.firstWatchedAt && new Date(ep.firstWatchedAt).getTime() >= sevenDaysAgo) {
            hasRecent = true;
            break outer;
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

    return items.slice(0, HOME_CAROUSEL_MAX_ITEMS);
  }, [seriesList, sevenDaysAgo]);
};
