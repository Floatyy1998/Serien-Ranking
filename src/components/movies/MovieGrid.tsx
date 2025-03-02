import { Box, Typography } from '@mui/material';
import 'firebase/compat/database';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { calculateOverallRating } from '../../utils/rating';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  searchValue: string;
  selectedGenre: string;
  selectedProvider: string;
}

export const MovieGrid = memo(
  ({ searchValue, selectedGenre, selectedProvider }: MovieGridProps) => {
    const { movieList, loading } = useMovieList();

    const debouncedSearchValue = useDebounce(searchValue, 300);
    const [visibleCount, setVisibleCount] = useState(20);

    const filteredMovies = useMemo(() => {
      return movieList
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
              movie.provider.provider.some((p) => p.name === selectedProvider));
          return matchesSearch && matchesGenre && matchesProvider;
        })
        .sort((a, b) => {
          if (selectedGenre === 'Zuletzt Hinzugefügt') {
            return b.nmr - a.nmr;
          }
          if (selectedGenre === 'Noch nicht Veröffentlicht') {
            const dateA = a.release_date
              ? new Date(a.release_date).getTime()
              : 0;
            const dateB = b.release_date
              ? new Date(b.release_date).getTime()
              : 0;
            return dateA - dateB;
          }
          const ratingA = parseFloat(calculateOverallRating(a));
          const ratingB = parseFloat(calculateOverallRating(b));
          return ratingB - ratingA;
        });
    }, [movieList, debouncedSearchValue, selectedGenre, selectedProvider]);

    const handleWindowScroll = useCallback(() => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.body.offsetHeight;
      if (
        scrollTop + windowHeight >= fullHeight - 1000 &&
        visibleCount < filteredMovies.length
      ) {
        const cardWidth = 230;
        const gap = 75;
        let columns = Math.floor(window.innerWidth / (cardWidth + gap));
        if (columns < 1) columns = 1;
        const remainder = visibleCount % columns;
        const itemsToAdd = remainder === 0 ? columns : columns - remainder;
        setVisibleCount((prev) =>
          Math.min(prev + itemsToAdd, filteredMovies.length)
        );
      }
    }, [filteredMovies.length, visibleCount]);

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
      if (initialVisible > filteredMovies.length) {
        initialVisible = filteredMovies.length;
      }
      setVisibleCount(initialVisible);
    }, [debouncedSearchValue, selectedGenre, selectedProvider, filteredMovies]);

    if (loading) {
      return (
        <Box className='flex justify-center items-center w-full h-full'>
          <InfinitySpin color='#00fed7' />
        </Box>
      );
    }

    if (filteredMovies.length === 0 && selectedGenre === 'All') {
      return (
        <Box className='flex justify-center items-center w-full h-full'>
          <Typography variant='h2' className='text-center'>
            Noch keine Filme vorhanden. Füge einen Film über das Menü hinzu.
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
          {filteredMovies.slice(0, visibleCount).map((movie, index) => (
            <Box key={index} sx={{ width: '230px', height: '444px' }}>
              <MovieCard
                movie={movie}
                genre={selectedGenre}
                index={index + 1}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
);

export default MovieGrid;
