import { createContext, useContext } from 'react';
import { useAuth } from '../App';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { Movie } from '../types/Movie';

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

export const MovieListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;

  // 🚀 Enhanced Cache mit Offline-Support für Filme
  const {
    data: movieData,
    loading,
    refetch,
    isStale,
    isOffline,
  } = useEnhancedFirebaseCache<Record<string, Movie>>(
    user ? `${user.uid}/filme` : '',
    {
      ttl: 24 * 60 * 60 * 1000, // 24h Cache - offline kann eh nichts geändert werden
      useRealtimeListener: true, // Realtime für sofortige Updates
      enableOfflineSupport: true, // Offline-First Unterstützung
      syncOnReconnect: true, // Auto-Sync bei Reconnect
    }
  );

  // Konvertiere Object zu Array
  const movieList: Movie[] = movieData ? Object.values(movieData) : [];

  return (
    <MovieListContext.Provider
      value={{
        movieList,
        loading,
        refetchMovies: refetch,
        isOffline,
        isStale,
      }}
    >
      {children}
    </MovieListContext.Provider>
  );
};

export const useMovieList = () => useContext(MovieListContext);
