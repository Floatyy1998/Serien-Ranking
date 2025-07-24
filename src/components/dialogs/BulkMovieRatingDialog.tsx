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
import { useMovieList } from '../../contexts/MovieListProvider';
import {
  calculateGenreRatingsFromIMDB,
  calculateOverallRating,
  fetchIMDBRating,
} from '../../utils/rating';

interface BulkMovieRatingDialogProps {
  open: boolean;
  onClose: () => void;
}

const BulkMovieRatingDialog: React.FC<BulkMovieRatingDialogProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { user } = useAuth()!;
  const { movieList } = useMovieList();
  const { updateUserActivity } = useFriends();

  // State für die Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [unratedMovieIds, setUnratedMovieIds] = useState<number[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: number | string }>(
    {}
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');

  // Initialisiere die Liste der unbewerteten Film-IDs einmal beim Öffnen
  useEffect(() => {
    if (open) {
      const unratedIds = movieList
        .filter((movie) => {
          const overallRating = calculateOverallRating(movie);
          return parseFloat(overallRating) === 0;
        })
        .map((movie) => movie.nmr);
      setUnratedMovieIds(unratedIds);
      setCurrentIndex(0);
    }
  }, [open]); // Entferne movieList aus dependencies

  // Finde das aktuelle Movie basierend auf der gespeicherten ID
  const currentMovie =
    unratedMovieIds.length > 0
      ? movieList.find((movie) => movie.nmr === unratedMovieIds[currentIndex])
      : undefined;

  const totalMovies = unratedMovieIds.length;
  const progress =
    totalMovies > 0 ? ((currentIndex + 1) / totalMovies) * 100 : 0;

  // Initialisiere Ratings für den aktuellen Film
  useEffect(() => {
    if (currentMovie) {
      const initialRatings: { [key: string]: number | string } = {};
      currentMovie.genre.genres.forEach((genre) => {
        initialRatings[genre] = currentMovie.rating?.[genre] || '';
      });
      setRatings(initialRatings);
    }
  }, [currentMovie]);

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
    if (!currentMovie) return;

    try {
      setSnackbarMessage('Lade TMDB-Bewertung...');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);

      const tmdbRating = await fetchIMDBRating(currentMovie.id, 'movie');

      if (tmdbRating && tmdbRating > 0) {
        const autoRatings = calculateGenreRatingsFromIMDB(
          tmdbRating,
          currentMovie.genre.genres
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
    if (!currentMovie || !user) return false;

    const ref = firebase
      .database()
      .ref(`${user.uid}/filme/${currentMovie.nmr}/rating`);
    const updatedRatings = Object.fromEntries(
      Object.entries(ratings).map(([k, value]) => [k, value === '' ? 0 : value])
    );

    if (navigator.onLine) {
      try {
        await ref.set(updatedRatings);

        // Activity tracken für Freunde
        const movieWithUpdatedRating = {
          ...currentMovie,
          rating: Object.fromEntries(
            Object.entries(updatedRatings).map(([k, v]) => [k, Number(v)])
          ),
        };
        const overallRating = calculateOverallRating(movieWithUpdatedRating);
        const ratingValue = parseFloat(overallRating);

        if (ratingValue > 0) {
          await updateUserActivity({
            type: 'rating_updated',
            itemTitle: currentMovie.title || 'Unbekannter Film',
            itemId: currentMovie.nmr,
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
  }, [currentMovie, user, ratings, updateUserActivity]);

  const handleNext = async () => {
    // Nur weiter gehen ohne zu speichern
    if (currentIndex < totalMovies - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Alle Filme durchgegangen
      setSnackbarMessage('Alle unbewerteten Filme durchgegangen!');
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
    if (currentIndex < totalMovies - 1) {
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

      if (currentIndex < totalMovies - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSnackbarMessage('Alle unbewerteten Filme durchgegangen!');
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

  if (totalMovies === 0) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          Massenbewerung - Filme
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
              Alle Filme sind bereits bewertet! 🎉
            </Typography>
            <Typography color='text.secondary'>
              Du hast keine unbewerteten Filme mehr.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentMovie) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>
          Massenbewerung - Filme ({currentIndex + 1} von {totalMovies})
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

          {/* Film Card */}
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
                  currentMovie.poster.poster.substring(
                    currentMovie.poster.poster.length - 4
                  ) !== 'null'
                    ? currentMovie.poster.poster
                    : notFound
                }
                alt={currentMovie.title}
              />
              <CardContent sx={{ flex: 1 }}>
                <Typography variant='h5' gutterBottom>
                  {currentMovie.title}
                </Typography>
                {currentMovie.release_date && (
                  <Typography color='text.secondary' gutterBottom>
                    Erscheinungsdatum:{' '}
                    {new Date(currentMovie.release_date).toLocaleDateString(
                      'de-DE'
                    )}
                  </Typography>
                )}
                {currentMovie.beschreibung && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    {currentMovie.beschreibung}
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
            {currentMovie.genre.genres.map((genre) => (
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
            {currentMovie.genre.genres.map((genre) => (
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

export default BulkMovieRatingDialog;
