import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Snackbar,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import { useFriends } from '../../contexts/FriendsProvider';
import { useSeriesList } from '../../contexts/SeriesListProvider';
import {
  calculateGenreRatingsFromIMDB,
  calculateOverallRating,
  fetchIMDBRating,
} from '../../utils/rating';

interface BulkSeriesRatingDialogProps {
  open: boolean;
  onClose: () => void;
}

const BulkSeriesRatingDialog: React.FC<BulkSeriesRatingDialogProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { updateUserActivity } = useFriends();

  // State für die Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [unratedSeriesIds, setUnratedSeriesIds] = useState<number[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: number | string }>(
    {}
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');

  // Initialisiere die Liste der unbewerteten Serien-IDs einmal beim Öffnen
  useEffect(() => {
    if (open) {
      const unratedIds = seriesList
        .filter((series) => {
          const overallRating = calculateOverallRating(series);
          return parseFloat(overallRating) === 0;
        })
        .map((series) => series.nmr);
      setUnratedSeriesIds(unratedIds);
      setCurrentIndex(0);
    }
  }, [open]); // Entferne seriesList aus dependencies

  // Finde die aktuelle Serie basierend auf der gespeicherten ID
  const currentSeries =
    unratedSeriesIds.length > 0
      ? seriesList.find(
          (series) => series.nmr === unratedSeriesIds[currentIndex]
        )
      : undefined;

  const totalSeries = unratedSeriesIds.length;
  const progress =
    totalSeries > 0 ? ((currentIndex + 1) / totalSeries) * 100 : 0;

  // Initialisiere Ratings für die aktuelle Serie
  useEffect(() => {
    if (currentSeries) {
      const initialRatings: { [key: string]: number | string } = {};
      currentSeries.genre.genres.forEach((genre) => {
        initialRatings[genre] = currentSeries.rating?.[genre] || '';
      });
      setRatings(initialRatings);
    }
  }, [currentSeries]);

  const handleRatingChange = (genre: string, value: string) => {
    setRatings((prev) => ({
      ...prev,
      [genre]: value === '' ? '' : parseFloat(value),
    }));
  };

  const handleChipClick = (genre: string) => {
    const input = document.getElementById(`rating-input-${genre}`);
    if (input) {
      input.focus();
    }
  };

  const handleAutoFillFromTMDB = async () => {
    if (!currentSeries) return;

    try {
      setSnackbarMessage('Lade TMDB-Bewertung...');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);

      const tmdbRating = await fetchIMDBRating(currentSeries.id, 'tv');

      if (tmdbRating && tmdbRating > 0) {
        const autoRatings = calculateGenreRatingsFromIMDB(
          tmdbRating,
          currentSeries.genre.genres
        );
        setRatings(autoRatings);

        setSnackbarMessage(
          `Auto-Bewertung basierend auf TMDB: ${tmdbRating}/10`
        );
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Keine TMDB-Bewertung gefunden');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der TMDB-Bewertung:', error);
      setSnackbarMessage('Fehler beim Laden der TMDB-Bewertung');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const saveCurrentRatings = useCallback(async () => {
    if (!currentSeries || !user) return false;

    const ref = firebase
      .database()
      .ref(`${user.uid}/serien/${currentSeries.nmr}/rating`);
    const updatedRatings = Object.fromEntries(
      Object.entries(ratings).map(([k, value]) => [k, value === '' ? 0 : value])
    );

    if (navigator.onLine) {
      try {
        await ref.set(updatedRatings);

        // Activity tracken für Freunde
        const seriesWithUpdatedRating = {
          ...currentSeries,
          rating: Object.fromEntries(
            Object.entries(updatedRatings).map(([k, v]) => [k, Number(v)])
          ),
        };
        const overallRating = calculateOverallRating(seriesWithUpdatedRating);
        const ratingValue = parseFloat(overallRating);

        if (ratingValue > 0) {
          await updateUserActivity({
            type: 'rating_updated',
            itemTitle:
              currentSeries.title ||
              currentSeries.original_name ||
              'Unbekannte Serie',
            itemId: currentSeries.nmr,
            rating: ratingValue,
          });
        }

        return true;
      } catch (error) {
        console.error('Error updating ratings:', error);
        setSnackbarMessage('Fehler beim Speichern der Bewertung.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return false;
      }
    } else {
      setSnackbarMessage(
        'Sie sind offline. Rating-Änderungen können nicht durchgeführt werden.'
      );
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return false;
    }
  }, [currentSeries, user, ratings, updateUserActivity]);

  const handleNext = async () => {
    // Nur weiter gehen ohne zu speichern
    if (currentIndex < totalSeries - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Alle Serien durchgegangen
      setSnackbarMessage('Alle unbewerteten Serien durchgegangen!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < totalSeries - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleSaveAndNext = async () => {
    const saved = await saveCurrentRatings();
    if (saved) {
      setSnackbarMessage('Bewertung gespeichert!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      if (currentIndex < totalSeries - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSnackbarMessage('Alle unbewerteten Serien durchgegangen!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        onClose();
      }
    }
  };

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (totalSeries === 0) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          Massenbewerung - Serien
          <IconButton
            aria-label='close'
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant='h6' gutterBottom>
              Alle Serien sind bereits bewertet! 🎉
            </Typography>
            <Typography color='text.secondary'>
              Du hast keine unbewerteten Serien mehr.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentSeries) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>
          Massenbewerung - Serien ({currentIndex + 1} von {totalSeries})
          <IconButton
            aria-label='close'
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant='body2' color='text.secondary'>
                Fortschritt
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Serie Card */}
          <Card sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <CardMedia
                component='img'
                sx={{
                  width: { xs: '100%', sm: 200 },
                  height: { xs: 200, sm: 300 },
                  objectFit: 'cover',
                }}
                image={
                  currentSeries.poster.poster.substring(
                    currentSeries.poster.poster.length - 4
                  ) !== 'null'
                    ? currentSeries.poster.poster
                    : notFound
                }
                alt={currentSeries.title || currentSeries.original_name}
              />
              <CardContent sx={{ flex: 1 }}>
                <Typography variant='h5' gutterBottom>
                  {currentSeries.title || currentSeries.original_name}
                </Typography>
                {currentSeries.beschreibung && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    {currentSeries.beschreibung}
                  </Typography>
                )}
              </CardContent>
            </Box>
          </Card>

          {/* Genre Chips */}
          <Typography sx={{ fontSize: '1.4rem', mb: 2 }}>Genres:</Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 3,
              justifyContent: 'center',
            }}
          >
            {currentSeries.genre.genres.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                onClick={() => handleChipClick(genre)}
                sx={{
                  fontSize: '1rem',
                  borderRadius: theme.shape.borderRadius,
                  cursor: 'pointer',
                }}
              />
            ))}
          </Box>

          {/* Rating Inputs */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography sx={{ fontSize: '1.4rem' }}>
              Bewertungen (1-10):
            </Typography>
            <Button
              variant='outlined'
              size='small'
              onClick={handleAutoFillFromTMDB}
              sx={{ ml: 2 }}
            >
              📊 Auto-Bewertung (TMDB)
            </Button>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 2,
            }}
          >
            {currentSeries.genre.genres.map((genre) => (
              <TextField
                key={genre}
                id={`rating-input-${genre}`}
                label={genre}
                type='number'
                value={ratings[genre] === 0 ? '' : ratings[genre]}
                onChange={(e) => handleRatingChange(genre, e.target.value)}
                fullWidth
                inputProps={{ min: 1, max: 10, step: 0.1 }}
                inputMode='decimal'
                placeholder='1-10'
              />
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              startIcon={<ArrowBackIcon />}
            >
              Zurück
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleSkip}
              startIcon={<SkipNextIcon />}
              color='secondary'
            >
              Überspringen
            </Button>
            <Button
              onClick={handleSaveAndNext}
              variant='contained'
              startIcon={<SaveIcon />}
              disabled={
                !Object.values(ratings).some(
                  (rating) => rating !== '' && rating !== 0
                )
              }
            >
              Speichern & Weiter
            </Button>
            <Button
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              color='primary'
            >
              Weiter
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BulkSeriesRatingDialog;
