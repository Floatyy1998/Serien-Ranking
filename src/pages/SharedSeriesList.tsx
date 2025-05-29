import { Box, Tab, Tabs, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import { useParams } from 'react-router-dom';
import MovieSearchFilters from '../components/filters/MovieSearchFilters';
import SearchFilters from '../components/filters/SearchFilters';
import { MovieCard } from '../components/movies/MovieCard';
import { SeriesCard } from '../components/series/SeriesCard';
import { useDebounce } from '../hooks/useDebounce';
import { Movie } from '../interfaces/Movie';
import { Series } from '../interfaces/Series';
import { calculateOverallRating } from '../utils/rating';

const SharedSeriesList = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [linkValid, setLinkValid] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [tabValue, setTabValue] = useState('series');
  const debouncedSearchValue = useDebounce(searchValue, 300);

  useEffect(() => {
    const fetchSharedList = async () => {
      try {
        const shareRef = firebase
          .database()
          .ref(`sharedLists/${linkId}`)
          .orderByChild('userId');
        const snapshot = await shareRef.once('value');
        const data = snapshot.val();
        if (data) {
          const userSeriesRef = firebase
            .database()
            .ref(`${data.userId}/serien`);
          const userSeriesSnapshot = await userSeriesRef.once('value');
          const userSeriesData = userSeriesSnapshot.val();

          const userMoviesRef = firebase.database().ref(`${data.userId}/filme`);
          const userMoviesSnapshot = await userMoviesRef.once('value');
          const userMoviesData = userMoviesSnapshot.val();

          setSeriesList(userSeriesData ? Object.values(userSeriesData) : []);
          setMovieList(userMoviesData ? Object.values(userMoviesData) : []);
          setLinkValid(Date.now() < data.expiresAt);
        } else {
          throw new Error('Fehler beim Abrufen der Listen.');
        }
      } catch (error) {
        console.error('Error fetching shared list:', error);
        setLinkValid(false);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedList();
  }, [linkId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };
  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
  };
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
  };

  const sortedSeries = useMemo(() => {
    const filtered = (seriesList || []).filter((series) => {
      const matchesSearch = series.title
        .toLowerCase()
        .includes(debouncedSearchValue.toLowerCase());
      const matchesGenre =
        selectedGenre === 'All' ||
        (selectedGenre === 'Neue Episoden' &&
          typeof series.nextEpisode.episode === 'number') ||
        (selectedGenre === 'Ohne Bewertung' &&
          calculateOverallRating(series) === '0.00') ||
        selectedGenre === 'Zuletzt Hinzugefügt' ||
        (selectedGenre === 'Watchlist' && series.watchlist) ||
        series.genre.genres.includes(selectedGenre);
      const matchesProvider =
        selectedProvider === 'All' ||
        (series.provider?.provider &&
          series.provider.provider.some((p) => p.name === selectedProvider));
      return matchesSearch && matchesGenre && matchesProvider;
    });
    if (selectedGenre === 'Neue Episoden') {
      return filtered.sort((a, b) => {
        const dateA = new Date(
          a.nextEpisode.nextEpisodes[0].airstamp
        ).getTime();
        const dateB = new Date(
          b.nextEpisode.nextEpisodes[0].airstamp
        ).getTime();
        return dateA - dateB;
      });
    } else if (selectedGenre === 'Zuletzt Hinzugefügt') {
      return filtered.reverse();
    } else {
      return filtered.sort((a, b) => {
        return (
          parseFloat(calculateOverallRating(b)) -
          parseFloat(calculateOverallRating(a))
        );
      });
    }
  }, [seriesList, debouncedSearchValue, selectedGenre, selectedProvider]);

  const sortedMovies = useMemo(() => {
    const filtered = (movieList || []).filter((movie) => {
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
    });
    return filtered?.sort((a, b) => {
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
  }, [movieList, debouncedSearchValue, selectedGenre, selectedProvider]);

  useEffect(() => {
    const cardWidth = 230;
    const gap = 75;
    let columns = Math.floor(window.innerWidth / (cardWidth + gap));
    if (columns < 1) columns = 1;
    const base = 20;
    let initialVisible = Math.ceil(base / columns) * columns;
    if (tabValue === 'series' && initialVisible > sortedSeries?.length) {
      initialVisible = sortedSeries?.length;
    } else if (tabValue === 'movies' && initialVisible > sortedMovies?.length) {
      initialVisible = sortedMovies?.length;
    }
    setVisibleCount(initialVisible);
  }, [
    debouncedSearchValue,
    selectedGenre,
    selectedProvider,
    sortedSeries,
    sortedMovies,
    tabValue,
  ]);

  const handleWindowScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.offsetHeight;
    if (scrollTop + windowHeight >= fullHeight - 1000) {
      if (tabValue === 'series' && visibleCount < sortedSeries?.length) {
        const cardWidth = 230;
        const gap = 75;
        let columns = Math.floor(window.innerWidth / (cardWidth + gap));
        if (columns < 1) columns = 1;
        const remainder = visibleCount % columns;
        const itemsToAdd = remainder === 0 ? columns : columns - remainder;
        setVisibleCount((prev) =>
          Math.min(prev + itemsToAdd, sortedSeries?.length)
        );
      } else if (tabValue === 'movies' && visibleCount < sortedMovies?.length) {
        const cardWidth = 230;
        const gap = 75;
        let columns = Math.floor(window.innerWidth / (cardWidth + gap));
        if (columns < 1) columns = 1;
        const remainder = visibleCount % columns;
        const itemsToAdd = remainder === 0 ? columns : columns - remainder;
        setVisibleCount((prev) =>
          Math.min(prev + itemsToAdd, sortedMovies?.length)
        );
      }
    }
  }, [sortedSeries?.length, sortedMovies?.length, visibleCount, tabValue]);

  useEffect(() => {
    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [handleWindowScroll]);

  if (loading) {
    return (
      <Box
        sx={{ width: '90vw', height: '80vh', backgroundColor: '#000' }}
        className='flex justify-center items-center '
      >
        <InfinitySpin color='#00fed7' />
      </Box>
    );
  }

  if (!linkValid) {
    return (
      <Typography
        sx={{ margin: 'auto', fontSize: '2rem', textAlign: 'center' }}
      >
        Dieser Link ist ungültig oder abgelaufen.
      </Typography>
    );
  }

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label='Serien' value='series' />
        <Tab label='Filme' value='movies' />
      </Tabs>
      <Box sx={{ marginTop: 2 }}>
        {tabValue === 'series' && (
          <>
            <SearchFilters
              onSearchChange={handleSearchChange}
              onGenreChange={handleGenreChange}
              onProviderChange={handleProviderChange}
            />
            <Box className='flex-row flex flex-wrap justify-center gap-20'>
              {sortedSeries?.slice(0, visibleCount).map((series, index) => (
                <Box key={`${series.id}-${index}`} className='w-[230px]'>
                  <SeriesCard series={series} genre='All' index={index + 1} />
                </Box>
              ))}
            </Box>
          </>
        )}
        {tabValue === 'movies' && (
          <>
            <MovieSearchFilters
              onSearchChange={handleSearchChange}
              onGenreChange={handleGenreChange}
              onProviderChange={handleProviderChange}
            />
            <Box className='flex-row flex flex-wrap justify-center gap-20'>
              {sortedMovies && sortedMovies.length > 0 ? (
                sortedMovies?.slice(0, visibleCount).map((movie, index) => (
                  <Box key={`${movie.id}-${index}`} className='w-[230px]'>
                    <MovieCard
                      movie={movie}
                      genre={selectedGenre}
                      index={index + 1}
                    />
                  </Box>
                ))
              ) : (
                <Typography
                  sx={{ margin: 'auto', fontSize: '2rem', textAlign: 'center' }}
                >
                  Keine Filme gefunden.
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default SharedSeriesList;
