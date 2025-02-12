import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import { useParams } from 'react-router-dom';
import SearchFilters from '../components/filters/SearchFilters';
import { SeriesCard } from '../components/series/SeriesCard';
import { useDebounce } from '../hooks/useDebounce';
import { Series } from '../interfaces/Series';
import { calculateOverallRating } from '../utils/rating';
const SharedSeriesList = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [linkValid, setLinkValid] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const debouncedSearchValue = useDebounce(searchValue, 300);
  useEffect(() => {
    const fetchSeriesList = async () => {
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
          if (userSeriesData) {
            setSeriesList(userSeriesData);
            setLinkValid(Date.now() < data.expiresAt);
          } else {
            throw new Error('Fehler beim Abrufen der Serienliste.');
          }
        } else {
          throw new Error('Fehler beim Abrufen der Serienliste.');
        }
      } catch (error) {
        console.error('Error fetching shared series list:', error);
        setLinkValid(false);
      } finally {
        setLoading(false);
      }
    };
    fetchSeriesList();
  }, [linkId]);
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
    const filtered = seriesList.filter((series) => {
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
  useEffect(() => {
    const cardWidth = 230;
    const gap = 75;
    let columns = Math.floor(window.innerWidth / (cardWidth + gap));
    if (columns < 1) columns = 1;
    const base = 20;
    let initialVisible = Math.ceil(base / columns) * columns;
    if (initialVisible > sortedSeries.length) {
      initialVisible = sortedSeries.length;
    }
    setVisibleCount(initialVisible);
  }, [debouncedSearchValue, selectedGenre, selectedProvider, sortedSeries]);
  const handleWindowScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.offsetHeight;
    if (
      scrollTop + windowHeight >= fullHeight - 1000 &&
      visibleCount < sortedSeries.length
    ) {
      const cardWidth = 230;
      const gap = 75;
      let columns = Math.floor(window.innerWidth / (cardWidth + gap));
      if (columns < 1) columns = 1;
      const remainder = visibleCount % columns;
      const itemsToAdd = remainder === 0 ? columns : columns - remainder;
      setVisibleCount((prev) =>
        Math.min(prev + itemsToAdd, sortedSeries.length)
      );
    }
  }, [sortedSeries.length, visibleCount]);
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
      <SearchFilters
        onSearchChange={handleSearchChange}
        onGenreChange={handleGenreChange}
        onProviderChange={handleProviderChange}
      />
      <Box className='flex-row flex flex-wrap justify-center gap-20'>
        {sortedSeries.slice(0, visibleCount).map((series, index) => (
          <Box key={`${series.id}-${index}`} className='w-[230px]'>
            <SeriesCard series={series} genre='All' index={index + 1} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
export default SharedSeriesList;
