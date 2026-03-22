import { useMemo } from 'react';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { calculateOverallRating } from '../../lib/rating/rating';
import { getImageUrl } from '../../utils/imageUrl';

export interface RecentlyWatchedItem {
  type: 'series';
  id: number;
  title: string;
  poster: string;
  rating: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 10;

export const useRecentlyWatched = (): RecentlyWatchedItem[] => {
  const { seriesList } = useSeriesList();

  return useMemo(() => {
    const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
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

    return items.slice(0, MAX_ITEMS);
  }, [seriesList]);
};
