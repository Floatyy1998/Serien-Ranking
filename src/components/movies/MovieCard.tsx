import {
  Alert,
  Box,
  Card,
  CardContent,
  CardMedia,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { allGenresForMovies } from '../../../constants/seriesCard.constants';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import { useFriends } from '../../contexts/FriendsProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { Movie } from '../../interfaces/Movie';
import '../../styles/animations.css';
import { getFormattedDate } from '../../utils/date.utils';
import { calculateOverallRating } from '../../utils/rating';
import MovieDialog from '../dialogs/MovieDialog';

interface MovieCardProps {
  movie: Movie;
  genre: string;
  index: number;
  disableRatingDialog?: boolean;
}

export const MovieCard = ({
  movie,
  index,
  disableRatingDialog = false,
}: MovieCardProps) => {
  const { movieList } = useMovieList();
  const location = useLocation();
  const isUserProfilePage =
    location.pathname.includes('/user/') ||
    location.pathname.includes('/profile/');

  // Für User Profile verwende die übergebenen Daten, sonst die aktuellen aus dem Context
  const currentMovie = isUserProfilePage
    ? movie
    : movieList.find((m) => m.nmr === movie.nmr) || movie;

  const shadowColor =
    currentMovie.status === 'Released' ? '#a855f7' : '#22c55e';
  const auth = useAuth();
  const user = auth?.user;
  const { updateUserActivity } = useFriends();
  const uniqueProviders = currentMovie.provider
    ? Array.from(
        new Set(currentMovie.provider.provider.map((p) => p.name))
      ).map((name) =>
        currentMovie.provider?.provider.find((p) => p.name === name)
      )
    : [];
  const rating = useMemo(
    () => calculateOverallRating(currentMovie),
    [currentMovie]
  );
  const releaseDate = new Date(currentMovie.release_date || '');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  let dateString = getFormattedDate(currentMovie.release_date || '');
  if (
    releaseDate.getDate() === today.getDate() &&
    releaseDate.getMonth() === today.getMonth() &&
    releaseDate.getFullYear() === today.getFullYear()
  ) {
    dateString = 'Heute';
  } else if (
    releaseDate.getDate() === tomorrow.getDate() &&
    releaseDate.getMonth() === tomorrow.getMonth() &&
    releaseDate.getFullYear() === tomorrow.getFullYear()
  ) {
    dateString = 'Morgen';
  }
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<{ [key: string]: number | string }>(
    {}
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('warning');

  const handleClickOpen = () => {
    setOpen(true);
    const initialRatings: { [key: string]: number } = {};
    allGenresForMovies.forEach((g) => {
      initialRatings[g] = currentMovie.rating?.[g] || 0;
    });
    setRatings(initialRatings);
  };

  const handleRatingClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!disableRatingDialog) {
      handleClickOpen();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDeleteMovie = async () => {
    const ref = firebase
      .database()
      .ref(`${user?.uid}/filme/${currentMovie.nmr}`);
    await ref.remove();

    // Activity tracken für Freunde
    await updateUserActivity({
      type: 'movie_deleted',
      itemTitle: currentMovie.title || 'Unbekannter Film',
      tmdbId: currentMovie.id, // TMDB ID verwenden
      itemId: currentMovie.nmr, // Fallback für ältere Versionen
    });

    setOpen(false);
  };

  const handleUpdateRatings = async () => {
    const ref = firebase
      .database()
      .ref(`${user?.uid}/filme/${currentMovie.nmr}/rating`);
    const updatedRatings = Object.fromEntries(
      Object.entries(ratings).map(([k, value]) => [k, value === '' ? 0 : value])
    );
    if (navigator.onLine) {
      try {
        await ref.set(updatedRatings);

        // Activity tracken für Freunde - mit der aktualisierten Bewertung
        const movieWithUpdatedRating = {
          ...currentMovie,
          rating: Object.fromEntries(
            Object.entries(ratings).map(([k, v]) => [k, Number(v)])
          ),
        };
        const overallRating = calculateOverallRating(movieWithUpdatedRating);
        const ratingValue = parseFloat(overallRating);
        await updateUserActivity({
          type: 'rating_updated',
          itemTitle: currentMovie.title || 'Unbekannter Film',
          tmdbId: currentMovie.id, // TMDB ID verwenden
          itemId: currentMovie.nmr, // Fallback für ältere Versionen
          rating: ratingValue > 0 ? ratingValue : undefined,
        });

        setOpen(false);
      } catch (error) {
        console.error('Error updating ratings online:', error);
        setSnackbarMessage('Fehler beim Aktualisieren der Bewertungen.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setOpen(false);
      }
    } else {
      setSnackbarMessage(
        'Sie sind offline. Rating-Änderungen können nicht durchgeführt werden.'
      );
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      setOpen(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Card
      className='h-full transition-shadow duration-300 flex flex-col series-card hover:animate-rgbShadow'
      sx={{
        boxShadow: ` ${shadowColor} 8px 8px 20px 0px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px;`,
        '&:hover': {
          boxShadow: `${shadowColor} 8px 8px 20px 5px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px;`,
        },
      }}
    >
      <Box className='relative aspect-2/3'>
        <CardMedia
          sx={{
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
          image={
            currentMovie.poster.poster.substring(
              currentMovie.poster.poster.length - 4
            ) !== 'null'
              ? currentMovie.poster.poster
              : notFound
          }
        />
        {uniqueProviders.length > 0 && (
          <Box className='absolute top-2 left-2 flex gap-1'>
            {uniqueProviders.map((provider) => (
              <Box
                key={provider?.id}
                className='bg-black/50 backdrop-blur-xs rounded-lg p-1 w-9 h-9'
              >
                <img
                  src={provider?.logo}
                  alt={provider?.name}
                  className='h-7 rounded-lg'
                />
              </Box>
            ))}
          </Box>
        )}
        {currentMovie.status !== 'Released' && (
          <Box
            className='absolute top-60 left-0 w-full bg-black/50 backdrop-blur-xs rounded-lg px-2 py-1 text-center'
            sx={{
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant='body2'
              className='text-center'
              sx={{ fontSize: '1.1rem' }}
            >
              Erscheint am {dateString}
            </Typography>
          </Box>
        )}
        <Tooltip title={currentMovie.beschreibung} arrow>
          <Box
            className={`absolute top-2 right-2 bg-black/50 backdrop-blur-xs rounded-lg px-2 py-1 ${
              !disableRatingDialog ? 'cursor-pointer' : 'cursor-default'
            }`}
            onClick={handleRatingClick}
            aria-label='Bewertung anzeigen'
          >
            <Typography variant='body1' className='text-white'>
              {rating}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
      <CardContent className='grow flex items-center justify-center '>
        <Tooltip title={currentMovie.title} arrow>
          <Typography
            variant='body1'
            className='text-white text-center cursor-pointer'
            sx={{
              maxWidth: '100%',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              height: '3em',
              lineHeight: '1.5em',
              wordBreak: 'break-word',
              textDecoration: 'underline',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            {index}. {currentMovie.title}
          </Typography>
        </Tooltip>
      </CardContent>
      <MovieDialog
        open={open}
        onClose={handleClose}
        movie={currentMovie}
        allGenres={allGenresForMovies}
        ratings={ratings}
        setRatings={setRatings}
        handleDeleteMovie={handleDeleteMovie}
        handleUpdateRatings={handleUpdateRatings}
        isReadOnly={false}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default MovieCard;
