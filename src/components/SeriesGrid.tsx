import { Box } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import { Series } from '../interfaces/Series';
import { getData, saveData } from '../utils/db';
import { calculateOverallRating } from '../utils/rating';
import { SeriesCard } from './SeriesCard';

interface SeriesGridProps {
  searchValue: string;
  selectedGenre: string;
  selectedProvider: string;
}

export const SeriesGrid = ({
  searchValue,
  selectedGenre,
  selectedProvider,
}: SeriesGridProps) => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (navigator.onLine) {
        try {
          const ref = firebase.database().ref('/serien');
          ref.on('value', async (snapshot) => {
            const data = snapshot.val();
            const seriesArray = Object.values(data) as Series[];
            setSeriesList(seriesArray);
            setLoading(false);
            // Speichern Sie die Daten in IndexedDB
            await saveData({ id: 'series', data: seriesArray });
          });
          return () => ref.off(); // Entfernen Sie den Listener, wenn die Komponente unmountet
        } catch (error) {
          console.error('Fehler beim Abrufen der Daten:', error);
        }
      } else {
        // Wenn offline, versuchen Sie, die Daten aus IndexedDB abzurufen
        const cachedData = await getData('series');
        if (cachedData) {
          setSeriesList(cachedData.data as Series[]);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      const ref = firebase.database().ref('/serien');
      ref.on('value', async (snapshot) => {
        const data = snapshot.val();
        const seriesArray = Object.values(data) as Series[];
        setSeriesList(seriesArray);
        setLoading(false);
        // Speichern Sie die Daten in IndexedDB
        await saveData({ id: 'series', data: seriesArray });
      });
    };

    const handleOffline = async () => {
      const cachedData = await getData('series');
      if (cachedData) {
        setSeriesList(cachedData.data as Series[]);
        setLoading(false);
      }
    };

    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-h-screen'>
        <InfinitySpin color='#00fed7'></InfinitySpin>
      </Box>
    );
  }

  const filteredSeries = seriesList
    .filter((series) => {
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
        series.provider?.provider.some((p) => p.name === selectedProvider);
      const matches = matchesSearch && matchesGenre && matchesProvider;
      return matches;
    })
    .sort((a, b) => {
      if (selectedGenre === 'Neue Episoden') {
        return (
          new Date(a.nextEpisode.nextEpisode).getTime() -
          new Date(b.nextEpisode.nextEpisode).getTime()
        );
      }
      if (selectedGenre === 'Zuletzt Hinzugefügt') {
        return b.nmr - a.nmr; // Sortieren nach nmr in umgekehrter Reihenfolge
      }
      const ratingA = parseFloat(calculateOverallRating(a));
      const ratingB = parseFloat(calculateOverallRating(b));
      return ratingB - ratingA;
    });

  return (
    <Box className='flex-row flex flex-wrap justify-center  gap-20'>
      {filteredSeries.map((series, index) => (
        <Box key={`${series.id}-${index}`} className='w-[230px] '>
          <SeriesCard series={series} genre={selectedGenre} index={index + 1} />
        </Box>
      ))}
    </Box>
  );
};
export default SeriesGrid;
