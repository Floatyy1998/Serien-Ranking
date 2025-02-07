import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { memo, useEffect, useMemo, useState } from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import { useAuth } from '../../App';
import { Series } from '../../interfaces/Series';
import { calculateOverallRating } from '../../utils/rating';
import { SeriesCard } from './SeriesCard';

interface SeriesGridProps {
  searchValue: string;
  selectedGenre: string;
  selectedProvider: string;
}

export const SeriesGrid = memo(
  ({ searchValue, selectedGenre, selectedProvider }: SeriesGridProps) => {
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [loading, setLoading] = useState(true);
    const auth = useAuth();
    const user = auth?.user;

    useEffect(() => {
      const fetchData = async () => {
        if (navigator.onLine) {
          try {
            const ref = firebase.database().ref(`${user?.uid}/serien`);
            ref.on('value', async (snapshot) => {
              const data = snapshot.val();
              if (!data) {
                setLoading(false);
                return;
              }

              const seriesArray = Object.values(data) as Series[];
              setSeriesList(seriesArray);
              setLoading(false);
            });
            return () => ref.off(); // Entfernen Sie den Listener, wenn die Komponente unmountet
          } catch (error) {
            console.error('Fehler beim Abrufen der Daten:', error);
          }
        }
      };

      fetchData();
    }, [user?.uid]);

    const filteredSeries = useMemo(() => {
      return seriesList
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
            (series.provider?.provider &&
              series.provider.provider.some(
                (p) => p.name === selectedProvider
              ));
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
    }, [seriesList, searchValue, selectedGenre, selectedProvider]);

    if (loading) {
      return (
        <Box className='flex justify-center items-center '>
          <InfinitySpin color='#00fed7'></InfinitySpin>
        </Box>
      );
    }

    if (filteredSeries.length === 0 && selectedGenre === 'All') {
      return (
        <Box className='flex justify-center items-center '>
          <Typography variant='h2' className='text-center'>
            Noch keine Serien vorhanden. Füge eine Serie über das Menü hinzu.
          </Typography>
        </Box>
      );
    }

    return (
      <Box className='flex-row flex flex-wrap justify-center  gap-20'>
        {filteredSeries.map((series, index) => (
          <Box key={`${series.id}-${index}`} className='w-[230px] '>
            <SeriesCard
              series={series}
              genre={selectedGenre}
              index={index + 1}
            />
          </Box>
        ))}
      </Box>
    );
  }
);
export default SeriesGrid;
