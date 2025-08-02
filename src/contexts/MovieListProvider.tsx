import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Movie } from '../interfaces/Movie';

interface MovieListContextType {
  movieList: Movie[];
  loading: boolean;
}

export const MovieListContext = createContext<MovieListContextType>({
  movieList: [],
  loading: true,
});

export const MovieListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMovieList([]);
      setLoading(false);
      return;
    }

    // 🚀 Smart Loading: Erst cached Daten laden, dann Firebase Listener
    let cachedData: Movie[] = [];
    try {
      const cached = localStorage.getItem(`movieCache_${user.uid}`);
      if (cached) {
        cachedData = JSON.parse(cached);
        setMovieList(cachedData);
        setLoading(false);
      }
    } catch (error) {
      console.warn('Failed to load cached movies:', error);
    }

    setLoading(cachedData.length === 0); // Nur loading wenn kein Cache
    const ref = firebase.database().ref(`${user.uid}/filme`);

    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 1000; // Max 1 Update pro Sekunde

    ref.on('value', (snapshot) => {
      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_THROTTLE) return;
      lastUpdateTime = now;

      const data = snapshot.val();
      const newMovieList = data ? (Object.values(data) as Movie[]) : [];

      // Nur Update wenn sich Daten wirklich geändert haben
      if (JSON.stringify(newMovieList) !== JSON.stringify(cachedData)) {
        setMovieList(newMovieList);

        // Cache aktualisieren (async)
        try {
          localStorage.setItem(
            `movieCache_${user.uid}`,
            JSON.stringify(newMovieList)
          );
        } catch (error) {
          console.warn('Failed to cache movies:', error);
        }
      }

      setLoading(false);
    });

    return () => {
      ref.off();
    };
  }, [user]);

  return (
    <MovieListContext.Provider value={{ movieList, loading }}>
      {children}
    </MovieListContext.Provider>
  );
};

export const useMovieList = () => useContext(MovieListContext);
