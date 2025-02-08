import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import { useAuth } from '../../App';
import { useDebounce } from '../../hooks/useDebounce';
import { Series } from '../../interfaces/Series';
import { TodayEpisode } from '../../interfaces/TodayEpisode';
import { calculateOverallRating } from '../../utils/rating';
import TodayEpisodesDialog from '../dialogs/TodayEpisodesDialog';
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

    const debouncedSearchValue = useDebounce(searchValue, 300);

    // Neuer State für inkrementelles Rendering
    const [visibleCount, setVisibleCount] = useState(20);
    const [showTodayDialog, setShowTodayDialog] = useState(false);
    const [todayEpisodes, setTodayEpisodes] = useState<TodayEpisode[]>([]);

    // Verschobene useMemo-Deklaration: filteredSeries wird hier definiert
    const filteredSeries = useMemo(() => {
      return seriesList
        .filter((series) => {
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
              series.provider.provider.some(
                (p) => p.name === selectedProvider
              ));
          return matchesSearch && matchesGenre && matchesProvider;
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
    }, [seriesList, debouncedSearchValue, selectedGenre, selectedProvider]);

    // Neuer useEffect: Berechne visibleCount neu als Vielfaches der Spaltenzahl
    useEffect(() => {
      const cardWidth = 230;
      const gap = 75;
      let columns = Math.floor(window.innerWidth / (cardWidth + gap));
      if (columns < 1) columns = 1;
      const base = 20;
      // initialVisible als kleinstes Vielfaches, das >= base liegt
      let initialVisible = Math.ceil(base / columns) * columns;
      // Falls gefilterte Serien weniger haben, nutze filteredSeries.length
      if (initialVisible > filteredSeries.length) {
        initialVisible = filteredSeries.length;
      }
      setVisibleCount(initialVisible);
    }, [debouncedSearchValue, selectedGenre, selectedProvider, filteredSeries]);

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

    // Ersetzter useEffect zur Überprüfung auf heutige Folgen:
    useEffect(() => {
      if (!seriesList.length || !user) return;

      const now = Date.now();
      const storedHideUntil = localStorage.getItem('todayDontShow');
      // Nur anzeigen, wenn kein Hide-Timestamp vorhanden ist oder dieser bereits überschritten wurde.
      if (storedHideUntil && now < parseInt(storedHideUntil)) return;

      const episodesToday: TodayEpisode[] = seriesList.reduce<TodayEpisode[]>(
        (acc, series) => {
          if (series.nextEpisode && series.nextEpisode.nextEpisode) {
            const episodeDate = new Date(series.nextEpisode.nextEpisode);
            if (
              new Date().getFullYear() === episodeDate.getFullYear() &&
              new Date().getMonth() === episodeDate.getMonth() &&
              new Date().getDate() === episodeDate.getDate()
            ) {
              acc.push({
                id: series.id,
                seriesTitle: series.title,
                episodeTitle: series.nextEpisode.title,
                releaseTime: episodeDate.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                poster: series.poster.poster,
                seasonNumber: series.nextEpisode.season,
                episodeNumber: series.nextEpisode.episode,
              });
            }
          }
          return acc;
        },
        []
      );

      if (episodesToday.length > 0) {
        setTimeout(() => {
          setTodayEpisodes(episodesToday);
          setShowTodayDialog(true);
        }, 1000);
      }
    }, [seriesList, user]);

    // Aktualisierte handleDialogClose: Entferne das Setzen des alten Flags.
    const handleDialogClose = () => {
      // ...kein localStorage-Schreibzugriff hier mehr...
      setShowTodayDialog(false);
    };

    // Window-scroll-Listener zum Laden weiterer Serien
    const handleWindowScroll = useCallback(() => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.body.offsetHeight;
      if (
        scrollTop + windowHeight >= fullHeight - 1000 &&
        visibleCount < filteredSeries.length
      ) {
        const cardWidth = 230;
        const gap = 75;
        let columns = Math.floor(window.innerWidth / (cardWidth + gap));
        if (columns < 1) columns = 1;

        const remainder = visibleCount % columns;
        // Falls letzte Zeile unvollständig ist, fülle sie auf, ansonsten füge eine komplette Zeile hinzu.
        const itemsToAdd = remainder === 0 ? columns : columns - remainder;
        setVisibleCount((prev) =>
          Math.min(prev + itemsToAdd, filteredSeries.length)
        );
      }
    }, [filteredSeries.length, visibleCount]);

    useEffect(() => {
      window.addEventListener('scroll', handleWindowScroll);
      return () => window.removeEventListener('scroll', handleWindowScroll);
    }, [handleWindowScroll]);

    if (loading) {
      return (
        <Box className='flex justify-center items-center'>
          <InfinitySpin color='#00fed7' />
        </Box>
      );
    }

    if (filteredSeries.length === 0 && selectedGenre === 'All') {
      return (
        <Box className='flex justify-center items-center'>
          <Typography variant='h2' className='text-center'>
            Noch keine Serien vorhanden. Füge eine Serie über das Menü hinzu.
          </Typography>
        </Box>
      );
    }

    return (
      <>
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
            {filteredSeries.slice(0, visibleCount).map((series, index) => (
              <Box key={index} sx={{ width: '230px', height: '444px' }}>
                <SeriesCard
                  series={series}
                  genre={selectedGenre}
                  index={index + 1}
                />
              </Box>
            ))}
          </Box>
        </Box>
        <TodayEpisodesDialog
          open={showTodayDialog}
          onClose={handleDialogClose}
          episodes={todayEpisodes}
        />
      </>
    );
  }
);
export default SeriesGrid;
