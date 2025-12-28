import { useMemo, useRef } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../contexts/MovieListProvider';
import { calculateOverallRating } from '../lib/rating/rating';

const getImageUrl = (posterObj: any): string => {
  if (!posterObj) return '/placeholder.jpg';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
};

export const useTopRated = () => {
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const cacheRef = useRef<{ items: any[] | null; deps: string }>({ items: null, deps: '' });
  
  const topRated = useMemo(() => {
    const depsString = `${seriesList.length}-${movieList.length}`;
    
    if (cacheRef.current.items && cacheRef.current.deps === depsString) {
      return cacheRef.current.items;
    }
    
    const items: any[] = [];
    
    // Process series
    const ratedSeries: Array<{ item: any; rating: number }> = [];
    for (let i = 0; i < seriesList.length; i++) {
      const series = seriesList[i];
      const rating = parseFloat(calculateOverallRating(series));
      if (rating > 0) {
        ratedSeries.push({ item: series, rating });
      }
    }
    
    ratedSeries.sort((a, b) => b.rating - a.rating);
    
    for (let i = 0; i < Math.min(5, ratedSeries.length); i++) {
      const { item: series, rating } = ratedSeries[i];
      items.push({
        type: 'series',
        id: series.id,
        title: series.title,
        poster: getImageUrl(series.poster),
        rating,
      });
    }
    
    // Process movies
    const ratedMovies: Array<{ item: any; rating: number }> = [];
    for (let i = 0; i < movieList.length; i++) {
      const movie = movieList[i];
      const rating = parseFloat(calculateOverallRating(movie));
      if (rating > 0) {
        ratedMovies.push({ item: movie, rating });
      }
    }
    
    ratedMovies.sort((a, b) => b.rating - a.rating);
    
    for (let i = 0; i < Math.min(5, ratedMovies.length); i++) {
      const { item: movie, rating } = ratedMovies[i];
      items.push({
        type: 'movie',
        id: movie.id,
        title: movie.title,
        poster: getImageUrl(movie.poster),
        rating,
      });
    }
    
    items.sort((a, b) => b.rating - a.rating);
    const result = items.slice(0, 10);
    cacheRef.current = { items: result, deps: depsString };
    return result;
  }, [seriesList, movieList]);
  
  return topRated;
};