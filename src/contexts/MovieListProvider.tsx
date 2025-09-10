import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import apiService from '../services/api.service';
import { Movie } from '../types/Movie';

interface MovieListContextType {
  movieList: Movie[];
  loading: boolean;
  refetchMovies: () => void;
  isOffline: boolean;
  isStale: boolean;
  updateMovie: (movieId: string, updates: Partial<Movie>) => Promise<void>;
  deleteMovie: (movieId: string) => Promise<void>;
  addMovie: (tmdbId: number, data?: any) => Promise<void>;
}

export const MovieListContext = createContext<MovieListContextType>({
  movieList: [],
  loading: true,
  refetchMovies: () => {},
  isOffline: false,
  isStale: false,
  updateMovie: async () => {},
  deleteMovie: async () => {},
  addMovie: async () => {},
});

export const MovieListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isOffline } = useAuth();
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  // Fetch movies from API
  const fetchMovies = useCallback(async () => {
    if (!user) {
      setMovieList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.getMovies();
      setMovieList(data);
      setIsStale(false);
      
      // Cache data for offline use
      if (typeof window !== 'undefined') {
        localStorage.setItem(`movies_${user.uid}`, JSON.stringify(data));
        localStorage.setItem(`movies_${user.uid}_timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      
      // Try to load from cache if offline
      if (isOffline && typeof window !== 'undefined') {
        const cached = localStorage.getItem(`movies_${user.uid}`);
        const cacheTimestamp = localStorage.getItem(`movies_${user.uid}_timestamp`);
        
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setMovieList(data);
            
            // Check if cache is stale (older than 24 hours)
            if (cacheTimestamp) {
              const age = Date.now() - parseInt(cacheTimestamp);
              setIsStale(age > 24 * 60 * 60 * 1000);
            }
          } catch (e) {
            console.error('Failed to parse cached movies:', e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, isOffline]);

  // Initial fetch
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Setup WebSocket listeners for real-time updates
  useEffect(() => {
    if (!user) return;

    const socket = apiService.getSocket();
    if (!socket) return;

    const handleMovieUpdate = (data: any) => {
      if (data.userId === user.uid) {
        fetchMovies(); // Refetch to get updated data
      }
    };

    socket.on('movieUpdate', handleMovieUpdate);
    socket.on('movieWatched', handleMovieUpdate);

    return () => {
      socket.off('movieUpdate', handleMovieUpdate);
      socket.off('movieWatched', handleMovieUpdate);
    };
  }, [user, fetchMovies]);

  const updateMovie = useCallback(async (movieId: string, updates: Partial<Movie>) => {
    try {
      const updatedMovie = await apiService.updateMovie(movieId, updates);
      setMovieList(prev => prev.map(m => m.id.toString() === movieId ? updatedMovie : m));
      
      // Update cache
      if (typeof window !== 'undefined' && user) {
        const updated = movieList.map(m => m.id.toString() === movieId ? updatedMovie : m);
        localStorage.setItem(`movies_${user.uid}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to update movie:', error);
      throw error;
    }
  }, [movieList, user]);

  const deleteMovie = useCallback(async (movieId: string) => {
    try {
      await apiService.deleteMovie(movieId);
      setMovieList(prev => prev.filter(m => m.id.toString() !== movieId));
      
      // Update cache
      if (typeof window !== 'undefined' && user) {
        const updated = movieList.filter(m => m.id.toString() !== movieId);
        localStorage.setItem(`movies_${user.uid}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to delete movie:', error);
      throw error;
    }
  }, [movieList, user]);

  const addMovie = useCallback(async (tmdbId: number, data?: any) => {
    try {
      const newMovie = await apiService.addMovie(tmdbId, data);
      setMovieList(prev => [...prev, newMovie]);
      
      // Update cache
      if (typeof window !== 'undefined' && user) {
        const updated = [...movieList, newMovie];
        localStorage.setItem(`movies_${user.uid}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to add movie:', error);
      throw error;
    }
  }, [movieList, user]);

  return (
    <MovieListContext.Provider
      value={{
        movieList,
        loading,
        refetchMovies: fetchMovies,
        isOffline,
        isStale,
        updateMovie,
        deleteMovie,
        addMovie,
      }}
    >
      {children}
    </MovieListContext.Provider>
  );
};

export const useMovieList = () => {
  const context = useContext(MovieListContext);
  if (!context) {
    throw new Error('useMovieList must be used within a MovieListProvider');
  }
  return context;
};