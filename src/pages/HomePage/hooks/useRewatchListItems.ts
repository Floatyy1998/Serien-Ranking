import { useMemo } from 'react';
import { useMovieList } from '../../../contexts/MovieListContext';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { useRatingFolders } from '../../../hooks/rating/useRatingFolders';
import { folderItemKey, isRewatchFolder } from '../../../lib/rating/ratingFolders';
import type { Movie } from '../../../types/Movie';
import type { Series } from '../../../types/Series';
import { getImageUrl } from '../../../utils/imageUrl';
import { extractProviders, getRating, getSeriesYear } from '../../Ratings/ratingsHelpers';
import type { MediaItem } from '../sections/mediaCarouselTypes';

const toItem = (item: Series | Movie, type: 'series' | 'movie'): MediaItem => {
  const rating = getRating(item);
  const genres = (item.genre?.genres ?? [])
    .filter((g) => g.toLowerCase() !== 'all')
    .slice(0, 2)
    .join(', ');
  const year =
    type === 'series'
      ? getSeriesYear(item as Series)
      : String((item as Movie).release_date ?? '').slice(0, 4);
  return {
    id: item.id,
    title: item.title || '',
    poster: getImageUrl(item.poster, 'w342'),
    type,
    rating: rating > 0 ? rating : undefined,
    genres: genres || undefined,
    year: year || undefined,
    providers: extractProviders(item),
  };
};

export const useRewatchListItems = (): MediaItem[] => {
  const { folders } = useRatingFolders();
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const list = folders.find(isRewatchFolder);

  return useMemo(() => {
    if (!list || list.items.size === 0) return [];
    const items: MediaItem[] = [];
    for (const s of allSeriesList) {
      if (list.items.has(folderItemKey('series', s.id))) items.push(toItem(s, 'series'));
    }
    for (const m of movieList) {
      if (list.items.has(folderItemKey('movie', m.id))) items.push(toItem(m, 'movie'));
    }
    return items.sort((a, b) => a.title.localeCompare(b.title));
  }, [list, allSeriesList, movieList]);
};
