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
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { allGenresForMovies } from '../../../constants/seriesCard.constants';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import { Movie } from '../../interfaces/Movie';
import '../../styles/animations.css';
import { getFormattedDate } from '../../utils/date.utils';
import { calculateOverallRating } from '../../utils/rating';
import MovieDialog from '../dialogs/MovieDialog';

interface MovieCardProps {
  movie: Movie;
  genre: string;
  index: number;
}

export const MovieCard = ({ movie, index }: MovieCardProps) => {
  const shadowColor = movie.status === 'Released' ? '#a855f7' : '#22c55e';
  const auth = useAuth();
  const user = auth?.user;
  const location = useLocation();
  const isSharedListPage = location.pathname.startsWith('/shared-list');
  const uniqueProviders = movie.provider
    ? Array.from(new Set(movie.provider.provider.map((p) => p.name))).map(
        (name) => movie.provider?.provider.find((p) => p.name === name)
      )
    : [];
  const rating = calculateOverallRating(movie);
  const releaseDate = new Date(movie.release_date || '');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  let dateString = getFormattedDate(movie.release_date || '');
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
      initialRatings[g] = movie.rating?.[g] || 0;
    });
    setRatings(initialRatings);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDeleteMovie = () => {
    const ref = firebase.database().ref(`${user?.uid}/filme/${movie.nmr}`);
    ref.remove();
    setOpen(false);
  };

  const handleUpdateRatings = async () => {
    const ref = firebase
      .database()
      .ref(`${user?.uid}/filme/${movie.nmr}/rating`);
    const updatedRatings = Object.fromEntries(
      Object.entries(ratings).map(([k, value]) => [k, value === '' ? 0 : value])
    );
    if (navigator.onLine) {
      try {
        await ref.set(updatedRatings);
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
            movie.poster.poster.substring(movie.poster.poster.length - 4) !==
            'null'
              ? movie.poster.poster
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
        {movie.status !== 'Released' && (
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
        <Tooltip title={movie.beschreibung} arrow>
          <Box
            className='absolute top-2 right-2 bg-black/50 backdrop-blur-xs rounded-lg px-2 py-1 cursor-pointer '
            onClick={handleClickOpen}
            aria-label='Bewertung anzeigen'
          >
            <Typography variant='body1' className='text-white'>
              {rating}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
      <CardContent className='grow flex items-center justify-center '>
        <Tooltip title={movie.title} arrow>
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
            {index}. {movie.title}
          </Typography>
        </Tooltip>
      </CardContent>
      <MovieDialog
        open={open}
        onClose={handleClose}
        movie={movie}
        allGenres={allGenresForMovies}
        ratings={ratings}
        setRatings={setRatings}
        handleDeleteMovie={handleDeleteMovie}
        handleUpdateRatings={handleUpdateRatings}
        isReadOnly={isSharedListPage}
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
