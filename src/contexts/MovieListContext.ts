import { createContext, useContext } from 'react';
import type { Movie } from '../types/Movie';

interface MovieListContextType {
  movieList: Movie[];
  loading: boolean;
  refetchMovies: () => void;
  isOffline: boolean;
  isStale: boolean;
}

export const MovieListContext = createContext<MovieListContextType>({
  movieList: [],
  loading: true,
  refetchMovies: () => {},
  isOffline: false,
  isStale: false,
});

export const useMovieList = () => useContext(MovieListContext);
