import BookmarkIcon from '@mui/icons-material/Bookmark';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { lazy, Suspense, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { allGenres } from '../../../constants/seriesCard.constants';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import { useSeriesList } from '../../contexts/SeriesListProvider';
import { Series } from '../../interfaces/Series';
import '../../styles/animations.css';
import { getFormattedDate, getFormattedTime } from '../../utils/date.utils';
import { calculateOverallRating } from '../../utils/rating';
import SeriesDialog from '../dialogs/SeriesDialog';
import SeriesEpisodesDialog from '../dialogs/SeriesEpisodesDialog';
const Tooltip = lazy(() => import('@mui/material/Tooltip'));
const Typography = lazy(() => import('@mui/material/Typography'));
const Box = lazy(() => import('@mui/material/Box'));
const Card = lazy(() => import('@mui/material/Card'));
const CardContent = lazy(() => import('@mui/material/CardContent'));
const CardMedia = lazy(() => import('@mui/material/CardMedia'));
interface SeriesCardProps {
  series: Series;
  genre: string;
  index: number;
}
export const SeriesCard = ({ series, genre, index }: SeriesCardProps) => {
  // Hole aktuelle Serie-Daten aus dem Provider
  const { seriesList } = useSeriesList();
  const location = useLocation();
  const isSharedListPage = location.pathname.startsWith('/shared-list');

  // Für Shared Lists verwende die übergebenen Daten, sonst die aktuellen aus dem Context
  const currentSeries = isSharedListPage
    ? series
    : seriesList.find((s) => s.nmr === series.nmr) || series;

  const shadowColor = !currentSeries.production?.production
    ? '#a855f7'
    : '#22c55e';
  const auth = useAuth();
  const user = auth?.user;
  const uniqueProviders = currentSeries.provider
    ? Array.from(
        new Set(currentSeries.provider.provider.map((p) => p.name))
      ).map((name) =>
        currentSeries.provider?.provider.find((p) => p.name === name)
      )
    : [];
  const rating = calculateOverallRating(currentSeries);
  const nextEpisodeDate = new Date(currentSeries.nextEpisode.nextEpisode);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  let dateString = getFormattedDate(series.nextEpisode.nextEpisode);
  if (
    nextEpisodeDate.getDate() === today.getDate() &&
    nextEpisodeDate.getMonth() === today.getMonth() &&
    nextEpisodeDate.getFullYear() === today.getFullYear()
  ) {
    dateString = 'Heute';
  } else if (
    nextEpisodeDate.getDate() === tomorrow.getDate() &&
    nextEpisodeDate.getMonth() === tomorrow.getMonth() &&
    nextEpisodeDate.getFullYear() === tomorrow.getFullYear()
  ) {
    dateString = 'Morgen';
  }
  const timeString = getFormattedTime(series.nextEpisode.nextEpisode);
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<{ [key: string]: number | string }>(
    {}
  );
  const [openEpisodes, setOpenEpisodes] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('warning');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogCallback, setConfirmDialogCallback] = useState<
    (() => void) | null
  >(null);

  // React 19: Automatische Memoization - kein useCallback nötig
  const handleTitleClick = () => {
    window.dispatchEvent(
      new CustomEvent('openWatchedDialog', {
        detail: { series: currentSeries, isReadOnly: isSharedListPage },
      })
    );
  };

  const handleClickOpen = () => {
    setOpen(true);
    const initialRatings: { [key: string]: number } = {};
    allGenres.forEach((g) => {
      initialRatings[g] = currentSeries.rating?.[g] || 0;
    });
    setRatings(initialRatings);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDeleteSeries = () => {
    const ref = firebase
      .database()
      .ref(`${user?.uid}/serien/${currentSeries.nmr}`);
    ref.remove();
    setOpen(false);
  };
  const handleUpdateRatings = async () => {
    const ref = firebase
      .database()
      .ref(`${user?.uid}/serien/${currentSeries.nmr}/rating`);
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
  const handleCloseEpisodes = () => {
    setOpenEpisodes(false);
  };
  const shouldNumber = ![
    'Zuletzt Hinzugefügt',
    'Ohne Bewertung',
    'Neue Episoden',
  ].includes(genre);
  const handlePosterClick = () => {
    if (genre !== 'Neue Episoden') {
      window.open(
        `https://watchradar.konrad-dinges.de?query=${currentSeries.title}`,
        '_blank'
      );
    } else {
      setOpenEpisodes(true);
    }
  };
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  const handleRatingClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClickOpen();
  };
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmDialogCallback(null);
  };
  const handleConfirmDialogConfirm = () => {
    if (confirmDialogCallback) {
      confirmDialogCallback();
    }
    handleConfirmDialogClose();
  };
  const handleWatchlistToggle = async (event: React.MouseEvent) => {
    if (!isSharedListPage) {
      event.stopPropagation();
      if (!user) {
        setSnackbarMessage(
          'Bitte melden Sie sich an, um die Watchlist zu ändern.'
        );
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      const ref = firebase
        .database()
        .ref(`${user?.uid}/serien/${currentSeries.nmr}/watchlist`);
      const newWatchlistStatus = !currentSeries.watchlist;
      try {
        await ref.set(newWatchlistStatus);
      } catch (error) {
        console.error('Error updating watchlist status:', error);
      }
    }
  };

  return (
    <Suspense fallback={<div />}>
      <Card
        className='h-full transition-shadow duration-300 flex flex-col series-card hover:animate-rgbShadow'
        sx={{
          boxShadow: ` ${shadowColor} 8px 8px 20px 0px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px;`,
          '&:hover': {
            boxShadow: `${shadowColor} 8px 8px 20px 5px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px;`,
          },
        }}
      >
        <Box className='relative aspect-2/3' onClick={handlePosterClick}>
          <CardMedia
            sx={{
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
            image={
              currentSeries.poster.poster.substring(
                currentSeries.poster.poster.length - 4
              ) !== 'null'
                ? currentSeries.poster.poster
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
          {typeof currentSeries.nextEpisode.episode === 'number' && (
            <>
              <Box
                className='absolute top-20 left-0 w-full bg-black/50 backdrop-blur-xs rounded-lg px-2 py-1 text-center'
                sx={{ height: '50px', cursor: 'pointer' }}
                onClick={() => setOpenEpisodes(true)}
              >
                <Typography
                  variant='body2'
                  className='text-center'
                  sx={{ fontSize: '1rem' }}
                >
                  Staffel {currentSeries.nextEpisode.season} Episode{' '}
                  {currentSeries.nextEpisode.episode}
                  <br></br>
                  {dateString} um {timeString}
                </Typography>
              </Box>
              <Box
                className='absolute bottom-20 left-0 w-full bg-black/50 backdrop-blur-xs rounded-lg px-2 py-1 text-center flex items-center justify-center'
                sx={{ height: '70px', cursor: 'pointer' }}
                onClick={() => setOpenEpisodes(true)}
              >
                <Typography
                  variant='body2'
                  className=' text-center'
                  sx={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '1rem',
                  }}
                >
                  Titel: <br></br>
                  {currentSeries.nextEpisode.title}
                </Typography>
              </Box>
            </>
          )}
          <Tooltip title={currentSeries.beschreibung} arrow>
            <Box
              className='absolute top-2 right-2 bg-black/50 backdrop-blur-xs rounded-lg px-2 py-1 cursor-pointer '
              onClick={handleRatingClick}
              aria-label='Bewertung anzeigen'
            >
              <Typography variant='body1' className='text-white'>
                {rating}
              </Typography>
            </Box>
          </Tooltip>
          {!isSharedListPage && (
            <Tooltip title='Zur Watchlist hinzufügen' arrow>
              <Box
                className='absolute bottom-2 right-2 bg-black/50 backdrop-blur-xs rounded-lg p-1 cursor-pointer'
                onClick={handleWatchlistToggle}
                aria-label='Zur Watchlist hinzufügen'
                role='button'
              >
                <BookmarkIcon
                  sx={{
                    color: currentSeries.watchlist ? '#22c55e' : '#9e9e9e',
                    width: '24px',
                    height: '24px',
                  }}
                />
              </Box>
            </Tooltip>
          )}
        </Box>
        <CardContent className='grow flex items-center justify-center '>
          <Tooltip title={currentSeries.title} arrow>
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
              onClick={handleTitleClick}
            >
              {shouldNumber && `${index}. `}
              {currentSeries.title}
            </Typography>
          </Tooltip>
        </CardContent>
      </Card>
      <SeriesDialog
        open={open}
        onClose={handleClose}
        series={currentSeries}
        allGenres={allGenres}
        ratings={ratings}
        setRatings={setRatings}
        handleDeleteSeries={handleDeleteSeries}
        handleUpdateRatings={handleUpdateRatings}
        isReadOnly={isSharedListPage}
      />
      <SeriesEpisodesDialog
        open={openEpisodes}
        onClose={handleCloseEpisodes}
        series={currentSeries}
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
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        <DialogTitle>Bestätigung</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Es gibt vorherige Episoden, die nicht als gesehen markiert sind.
            Möchten Sie alle vorherigen Episoden auch als gesehen markieren?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose} color='primary'>
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirmDialogConfirm}
            color='primary'
            autoFocus
          >
            Bestätigen
          </Button>
        </DialogActions>
      </Dialog>
    </Suspense>
  );
};
export default SeriesCard;
