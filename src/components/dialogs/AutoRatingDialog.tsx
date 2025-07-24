import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useState } from 'react';
import { useAuth } from '../../App';
import { useFriends } from '../../contexts/FriendsProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/SeriesListProvider';
import {
  calculateGenreRatingsFromIMDB,
  calculateOverallRating,
  fetchIMDBRating,
} from '../../utils/rating';

interface AutoRatingDialogProps {
  open: boolean;
  onClose: () => void;
  mediaType: 'movies' | 'series' | 'both';
}

const AutoRatingDialog: React.FC<AutoRatingDialogProps> = ({
  open,
  onClose,
  mediaType,
}) => {
  const { user } = useAuth()!;
  const { movieList } = useMovieList();
  const { seriesList } = useSeriesList();
  const { updateUserActivity } = useFriends();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');

  const getUnratedItems = () => {
    const unratedMovies = movieList.filter((movie) => {
      const overallRating = calculateOverallRating(movie);
      return parseFloat(overallRating) === 0;
    });

    const unratedSeries = seriesList.filter((series) => {
      const overallRating = calculateOverallRating(series);
      return parseFloat(overallRating) === 0;
    });

    switch (mediaType) {
      case 'movies':
        return { movies: unratedMovies, series: [] };
      case 'series':
        return { movies: [], series: unratedSeries };
      case 'both':
        return { movies: unratedMovies, series: unratedSeries };
      default:
        return { movies: [], series: [] };
    }
  };

  const processAutoRating = async () => {
    if (!user) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessed(0);

    const { movies, series } = getUnratedItems();
    const totalItems = movies.length + series.length;
    setTotal(totalItems);

    if (totalItems === 0) {
      setSnackbarMessage('Keine unbewerteten Inhalte gefunden!');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      setIsProcessing(false);
      return;
    }

    let currentIndex = 0;
    let successCount = 0;
    let errorCount = 0;

    // Verarbeite Filme
    for (const movie of movies) {
      currentIndex++;
      setCurrentItem(`Film: ${movie.title}`);
      setProgress((currentIndex / totalItems) * 100);
      setProcessed(currentIndex);

      try {
        const tmdbRating = await fetchIMDBRating(movie.id, 'movie');

        if (tmdbRating && tmdbRating > 0) {
          const autoRatings = calculateGenreRatingsFromIMDB(
            tmdbRating,
            movie.genre.genres
          );

          const ref = firebase
            .database()
            .ref(`${user.uid}/filme/${movie.nmr}/rating`);
          await ref.set(autoRatings);

          // Activity tracken
          await updateUserActivity({
            type: 'rating_updated',
            itemTitle: movie.title || 'Unbekannter Film',
            itemId: movie.nmr,
            rating: tmdbRating,
          });

          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Fehler bei Film ${movie.title}:`, error);
        errorCount++;
      }

      // Kurze Pause um API-Limits zu respektieren
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // Verarbeite Serien
    for (const seriesItem of series) {
      currentIndex++;
      setCurrentItem(`Serie: ${seriesItem.title || seriesItem.original_name}`);
      setProgress((currentIndex / totalItems) * 100);
      setProcessed(currentIndex);

      try {
        const tmdbRating = await fetchIMDBRating(seriesItem.id, 'tv');

        if (tmdbRating && tmdbRating > 0) {
          const autoRatings = calculateGenreRatingsFromIMDB(
            tmdbRating,
            seriesItem.genre.genres
          );

          const ref = firebase
            .database()
            .ref(`${user.uid}/serien/${seriesItem.nmr}/rating`);
          await ref.set(autoRatings);

          // Activity tracken
          await updateUserActivity({
            type: 'rating_updated',
            itemTitle:
              seriesItem.title ||
              seriesItem.original_name ||
              'Unbekannte Serie',
            itemId: seriesItem.nmr,
            rating: tmdbRating,
          });

          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(
          `Fehler bei Serie ${seriesItem.title || seriesItem.original_name}:`,
          error
        );
        errorCount++;
      }

      // Kurze Pause um API-Limits zu respektieren
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    setIsProcessing(false);
    setSnackbarMessage(
      `Fertig! ${successCount} erfolgreich bewertet, ${errorCount} Fehler`
    );
    setSnackbarSeverity(successCount > 0 ? 'success' : 'error');
    setSnackbarOpen(true);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const { movies, series } = getUnratedItems();
  const totalUnratedItems = movies.length + series.length;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          Auto-Bewertung mit TMDB
          {!isProcessing && (
            <IconButton
              aria-label='close'
              onClick={handleClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent>
          {isProcessing ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h6' gutterBottom>
                Verarbeite automatische Bewertungen...
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                {currentItem}
              </Typography>
              <LinearProgress
                variant='determinate'
                value={progress}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Typography variant='body2'>
                {processed} von {total} verarbeitet ({Math.round(progress)}%)
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant='body1' gutterBottom>
                Diese Funktion lädt automatisch TMDB-Bewertungen für alle
                unbewerteten{' '}
                {mediaType === 'movies'
                  ? 'Filme'
                  : mediaType === 'series'
                  ? 'Serien'
                  : 'Inhalte'}{' '}
                und füllt die Genre-Bewertungen entsprechend vor.
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
              >
                <Typography variant='subtitle2' gutterBottom>
                  Gefundene unbewertete Inhalte:
                </Typography>
                {mediaType !== 'series' && (
                  <Typography variant='body2'>
                    📽️ Filme: {movies.length}
                  </Typography>
                )}
                {mediaType !== 'movies' && (
                  <Typography variant='body2'>
                    📺 Serien: {series.length}
                  </Typography>
                )}
                <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
                  Gesamt: {totalUnratedItems} Inhalte
                </Typography>
              </Box>

              {totalUnratedItems === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant='h6' color='success.main'>
                    🎉 Alle Inhalte sind bereits bewertet!
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography variant='body2' color='text.secondary'>
                    ⚠️ Dieser Vorgang kann einige Minuten dauern und wird
                    bestehende Bewertungen überschreiben.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {!isProcessing && (
            <>
              <Button onClick={handleClose}>Abbrechen</Button>
              <Button
                variant='contained'
                onClick={processAutoRating}
                disabled={totalUnratedItems === 0}
                startIcon={<AutoFixHighIcon />}
              >
                Auto-Bewertung starten
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AutoRatingDialog;
