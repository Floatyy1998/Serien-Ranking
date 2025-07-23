import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { calculateOverallRating } from '../../utils/rating';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  searchValue: string;
  selectedGenre: string;
  selectedProvider: string;
  viewOnlyMode?: boolean;
  targetUserId?: string;
}

// React 19: Automatische Memoization - kein memo nötig
export const MovieGrid = ({
  searchValue,
  selectedGenre,
  selectedProvider,
  viewOnlyMode = false,
  targetUserId,
}: MovieGridProps) => {
  const { movieList: contextMovieList } = useMovieList();
  const [friendMovieList, setFriendMovieList] = useState<any[]>([]);
  const [friendMoviesLoading, setFriendMoviesLoading] = useState(false);

  // Verwende Freund-Filme oder eigene Filme
  // Aber nur wenn Freund-Daten geladen wurden oder kein targetUserId gesetzt ist
  const movieList = targetUserId
    ? friendMoviesLoading
      ? []
      : friendMovieList
    : contextMovieList;

  const debouncedSearchValue = useDebounce(searchValue, 300);
  const [visibleCount, setVisibleCount] = useState(20);

  // Stabilisiere die Liste mit einem Ref um Re-Rendering zu vermeiden
  const stableFilteredMovies = useRef<any[]>([]);

  // Lade Freund-Filme wenn targetUserId gesetzt ist
  useEffect(() => {
    if (!targetUserId) {
      setFriendMovieList([]);
      setFriendMoviesLoading(false);
      return;
    }

    setFriendMoviesLoading(true);
    const friendMoviesRef = firebase.database().ref(`${targetUserId}/filme`);

    friendMoviesRef
      .once('value')
      .then((snapshot) => {
        const data = snapshot.val() || {};

        if (data === null && !snapshot.exists()) {
          setFriendMovieList([]);
        } else if (data && typeof data === 'object') {
          const movies = Object.values(data) as any[];
          setFriendMovieList(movies);
        } else {
          setFriendMovieList([]);
        }
      })
      .catch((error) => {
        console.error('Error loading friend movies:', error);
        setFriendMovieList([]);
      })
      .finally(() => {
        setFriendMoviesLoading(false);
      });
  }, [targetUserId]);

  // Filtere und sortiere die Filme basierend auf den Suchkriterien
  useEffect(() => {
    const filtered = (movieList || [])
      .filter((movie) => {
        const matchesSearch = movie.title
          .toLowerCase()
          .includes(debouncedSearchValue.toLowerCase());
        const matchesGenre =
          selectedGenre === 'All' ||
          (selectedGenre === 'Ohne Bewertung' &&
            calculateOverallRating(movie) === '0.00') ||
          selectedGenre === 'Zuletzt Hinzugefügt' ||
          (selectedGenre === 'Watchlist' && movie.watchlist) ||
          (selectedGenre === 'Noch nicht Veröffentlicht' &&
            movie.status !== 'Released') ||
          movie.genre.genres.includes(selectedGenre);
        const matchesProvider =
          selectedProvider === 'All' ||
          (movie.provider?.provider &&
            movie.provider.provider.some(
              (p: any) => p.name === selectedProvider
            ));
        return matchesSearch && matchesGenre && matchesProvider;
      })
      .sort((a, b) => {
        if (selectedGenre === 'Zuletzt Hinzugefügt') {
          return b.nmr - a.nmr;
        }
        if (selectedGenre === 'Noch nicht Veröffentlicht') {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateA - dateB;
        }
        const ratingA = parseFloat(calculateOverallRating(a));
        const ratingB = parseFloat(calculateOverallRating(b));
        return ratingB - ratingA;
      });

    stableFilteredMovies.current = filtered;
  }, [movieList, debouncedSearchValue, selectedGenre, selectedProvider]);

  // React 19: Automatische Memoization - kein useCallback nötig
  const handleWindowScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.offsetHeight;

    const currentMovies =
      stableFilteredMovies.current?.length > 0
        ? stableFilteredMovies.current
        : movieList || [];

    if (
      scrollTop + windowHeight >= fullHeight - 1000 &&
      visibleCount < currentMovies?.length
    ) {
      const cardWidth = 230;
      const gap = 75;
      let columns = Math.floor(window.innerWidth / (cardWidth + gap));
      if (columns < 1) columns = 1;
      const remainder = visibleCount % columns;
      const itemsToAdd = remainder === 0 ? columns : columns - remainder;
      setVisibleCount((prev) =>
        Math.min(prev + itemsToAdd, currentMovies?.length)
      );
    }
  }, [visibleCount, movieList]);

  useEffect(() => {
    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [handleWindowScroll]);

  useEffect(() => {
    const cardWidth = 230;
    const gap = 75;
    let columns = Math.floor(window.innerWidth / (cardWidth + gap));
    if (columns < 1) columns = 1;
    const base = 20;
    let initialVisible = Math.ceil(base / columns) * columns;

    const currentMovies =
      stableFilteredMovies.current?.length > 0
        ? stableFilteredMovies.current
        : movieList || [];

    if (initialVisible > currentMovies?.length) {
      initialVisible = currentMovies?.length;
    }
    setVisibleCount(initialVisible);
  }, [debouncedSearchValue, selectedGenre, selectedProvider, movieList]);

  // Loading state für Freund-Filme
  if (targetUserId && friendMoviesLoading) {
    return (
      <Box className='flex justify-center items-center w-full h-full'>
        <Typography variant='h6' className='text-center'>
          Lade Filme...
        </Typography>
      </Box>
    );
  }

  // Überprüfe sowohl die gefilterte Liste als auch die ursprüngliche movieList
  if (
    (stableFilteredMovies.current?.length === 0 ||
      (movieList && movieList.length === 0)) &&
    selectedGenre === 'All'
  ) {
    return (
      <Box className='flex justify-center items-center w-full h-full'>
        <Typography variant='h2' className='text-center'>
          {targetUserId
            ? 'Dieser Benutzer hat noch keine Filme hinzugefügt.'
            : 'Noch keine Filme vorhanden. Füge einen Film über das Menü hinzu.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', m: 0, p: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '75px',
          justifyContent: 'center',
          p: 2,
          boxSizing: 'border-box',
        }}
      >
        {(stableFilteredMovies.current?.length > 0
          ? stableFilteredMovies.current
          : movieList || []
        )
          ?.slice(0, visibleCount)
          .map((movie, index) => (
            <Box key={index} sx={{ width: '230px', height: '444px' }}>
              <MovieCard
                movie={movie}
                genre={selectedGenre}
                index={index + 1}
                disableRatingDialog={viewOnlyMode}
              />
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default MovieGrid;
