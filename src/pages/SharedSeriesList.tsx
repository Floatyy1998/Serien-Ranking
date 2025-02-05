import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SearchFilters from '../components/SearchFilters';
import { SeriesCard } from '../components/SeriesCard';
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

  useEffect(() => {
    const fetchSeriesList = async () => {
      try {
        const shareRef = firebase.database().ref(`sharedLists/${linkId}`);
        const snapshot = await shareRef.once('value');
        const data = snapshot.val();
        if (data) {
          console.log(`${data.userId}/serien`);

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

  const filteredSeries = seriesList.filter((series) => {
    const matchesSearch = series.title
      .toLowerCase()
      .includes(searchValue.toLowerCase());
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

  const sortedSeries = filteredSeries.sort((a, b) => {
    return (
      parseFloat(calculateOverallRating(b)) -
      parseFloat(calculateOverallRating(a))
    );
  });

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!linkValid) {
    return <Typography>Dieser Link ist ungültig oder abgelaufen.</Typography>;
  }

  return (
    <Box>
      <SearchFilters
        onSearchChange={handleSearchChange}
        onGenreChange={handleGenreChange}
        onProviderChange={handleProviderChange}
      />
      <Box className='flex-row flex flex-wrap justify-center gap-20'>
        {sortedSeries.map((series, index) => (
          <Box key={`${series.id}-${index}`} className='w-[230px]'>
            <SeriesCard series={series} genre='All' index={index + 1} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SharedSeriesList;
