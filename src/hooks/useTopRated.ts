import { useMemo } from 'react';
import { useMovieList } from '../contexts/MovieListContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { calculateOverallRating } from '../lib/rating/rating';
import type { Movie } from '../types/Movie';
import type { Series } from '../types/Series';
import { getImageUrl } from '../utils/imageUrl';

export interface TopRatedItem {
  type: 'series' | 'movie';
  id: number;
  title: string;
  poster: string;
  rating: number;
}

const TOP_N = 10;
const MAX_COMBINED = 20;

function collectTopRated<T extends Series | Movie>(
  list: T[],
  type: 'series' | 'movie',
  limit: number
): TopRatedItem[] {
  const rated: Array<{ item: T; rating: number }> = [];
  for (const item of list) {
    const rating = parseFloat(calculateOverallRating(item));
    if (rating > 0) {
      rated.push({ item, rating });
    }
  }
  rated.sort((a, b) => b.rating - a.rating);
  return rated.slice(0, limit).map(({ item, rating }) => ({
    type,
    id: item.id,
    title: item.title,
    poster: getImageUrl(item.poster),
    rating,
  }));
}

export const useTopRated = (): TopRatedItem[] => {
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  return useMemo(() => {
    const combined = [
      ...collectTopRated(seriesList, 'series', TOP_N),
      ...collectTopRated(movieList, 'movie', TOP_N),
    ];
    combined.sort((a, b) => b.rating - a.rating);
    return combined.slice(0, MAX_COMBINED);
  }, [seriesList, movieList]);
};
