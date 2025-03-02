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

    setLoading(true);
    const ref = firebase.database().ref(`${user.uid}/filme`);
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      setMovieList(data ? (Object.values(data) as Movie[]) : []);
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
