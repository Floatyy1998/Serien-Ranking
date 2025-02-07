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
import { useAuth } from '../../App'; // Assuming you have an AuthContext
import { Series } from '../../interfaces/Series';
import { calculateOverallRating } from '../../utils/rating';
import LoadingCard from '../common/LoadingCard';
import SeriesDialog from '../dialogs/SeriesDialog';
import SeriesEpisodesDialog from '../dialogs/SeriesEpisodesDialog';
import SeriesWatchedDialog from '../dialogs/SeriesWatchedDialog';

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
  const shadowColor = !series.production.production ? '#a855f7' : '#22c55e';
  const auth = useAuth(); // Assuming useAuth provides currentUser
  const user = auth?.user;
  const location = useLocation();
  const isSharedListPage = location.pathname.startsWith('/shared-list');

  const uniqueProviders = series.provider
    ? Array.from(new Set(series.provider.provider.map((p) => p.name))).map(
        (name) => series.provider?.provider.find((p) => p.name === name)
      )
    : [];

  const rating = calculateOverallRating(series);

  const nextEpisodeDate = new Date(series.nextEpisode.nextEpisode);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  let dateString = formatDate(nextEpisodeDate);
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

  const timeString = nextEpisodeDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

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
  const [openWatchedDialog, setOpenWatchedDialog] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogCallback, setConfirmDialogCallback] = useState<
    (() => void) | null
  >(null);

  const allGenres = [
    'All',
    'Action & Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Drama',
    'Documentary',
    'Family',
    'Kids',
    'Mystery',
    'Reality',
    'Sci-Fi & Fantasy',
    'Talk',
    'War & Politics',
    'Western',
  ];

  const handleClickOpen = () => {
    setOpen(true);
    const initialRatings: { [key: string]: number } = {};
    allGenres.forEach((g) => {
      initialRatings[g] = series.rating?.[g] || 0;
    });
    setRatings(initialRatings);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDeleteSeries = () => {
    const ref = firebase.database().ref(`${user?.uid}/serien/${series.nmr}`);
    ref.remove();
    setOpen(false);
  };

  const handleUpdateRatings = async () => {
    const ref = firebase
      .database()
      .ref(`${user?.uid}/serien/${series.nmr}/rating`);
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
        `https://watchradar.konrad-dinges.de?query=${series.title}`,
        '_blank'
      );
    } else {
      setOpenEpisodes(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleTitleClick = () => {
    setOpenWatchedDialog(true);
  };

  const handleRatingClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClickOpen();
  };

  const handleWatchedToggle = async (
    seasonNumber: number,
    episodeId: number
  ) => {
    const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) return;

    const episodeIndex = season.episodes.findIndex((e) => e.id === episodeId);
    if (episodeIndex === -1) return;

    const updatedEpisodes = season.episodes.map((episode, index) => {
      if (index <= episodeIndex) {
        return { ...episode, watched: true };
      }
      return episode;
    });

    const updatedSeasons = series.seasons.map((s) => {
      if (s.seasonNumber < seasonNumber) {
        return {
          ...s,
          episodes: s.episodes.map((e) => ({ ...e, watched: true })),
        };
      }
      if (s.seasonNumber === seasonNumber) {
        return { ...s, episodes: updatedEpisodes };
      }
      return s;
    });

    try {
      await firebase
        .database()
        .ref(`${user?.uid}/serien/${series.nmr}/seasons`)
        .set(updatedSeasons);
    } catch (error) {
      console.error('Error updating watched status:', error);
    }
  };

  const handleConfirmDialogOpen = (callback: () => void) => {
    setConfirmDialogCallback(() => callback);
    setConfirmDialogOpen(true);
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

  const handleWatchedToggleWithConfirmation = async (
    seasonNumber: number,
    episodeId: number,
    forceWatched: boolean = false
  ) => {
    if (!user) {
      setSnackbarMessage('Bitte melden Sie sich an, um den Status zu ändern.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) return;

    if (episodeId === -1) {
      // Für die gesamte Staffel:
      let updatedEpisodes;
      if (forceWatched) {
        // Setze alle Episoden auf watched=true
        updatedEpisodes = season.episodes.map((e) => ({ ...e, watched: true }));
      } else {
        const allWatched = season.episodes.every((e) => e.watched);
        updatedEpisodes = season.episodes.map((e) => ({
          ...e,
          watched: !allWatched,
        }));
      }

      const updatedSeasons = series.seasons.map((s) => {
        if (s.seasonNumber === seasonNumber) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });

      try {
        await firebase
          .database()
          .ref(`${user?.uid}/serien/${series.nmr}/seasons`)
          .set(updatedSeasons);
      } catch (error) {
        console.error('Error updating watched status:', error);
      }
      return;
    }

    const episodeIndex = season.episodes.findIndex((e) => e.id === episodeId);
    if (episodeIndex === -1) return;

    const episode = season.episodes[episodeIndex];
    const previousEpisodesUnwatched = season.episodes
      .slice(0, episodeIndex)
      .some((e) => !e.watched);

    if (!episode.watched && previousEpisodesUnwatched) {
      handleConfirmDialogOpen(async () => {
        await handleWatchedToggle(seasonNumber, episodeId);
      });
    } else {
      const updatedEpisodes = season.episodes.map((e) => {
        if (e.id === episodeId) {
          return { ...e, watched: !e.watched };
        }
        return e;
      });

      const updatedSeasons = series.seasons.map((s) => {
        if (s.seasonNumber === seasonNumber) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });

      try {
        await firebase
          .database()
          .ref(`${user?.uid}/serien/${series.nmr}/seasons`)
          .set(updatedSeasons);
      } catch (error) {
        console.error('Error updating watched status:', error);
      }
    }
  };

  const handleCloseWatchedDialog = () => {
    setOpenWatchedDialog(false);
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
        .ref(`${user?.uid}/serien/${series.nmr}/watchlist`);
      const newWatchlistStatus = !series.watchlist;
      try {
        await ref.set(newWatchlistStatus);
      } catch (error) {
        console.error('Error updating watchlist status:', error);
      }
    }
  };

  // Neue Funktion für das Batch‑Update aller Staffeln bis zu einer bestimmten Staffel:
  const handleBatchWatchedToggle = async (confirmSeason: number) => {
    if (!user) {
      setSnackbarMessage('Bitte melden Sie sich an, um den Status zu ändern.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    const updatedSeasons = series.seasons.map((s) => {
      if (s.seasonNumber <= confirmSeason) {
        return {
          ...s,
          episodes: s.episodes.map((e) => ({ ...e, watched: true })),
        };
      }
      return s;
    });
    try {
      await firebase
        .database()
        .ref(`${user?.uid}/serien/${series.nmr}/seasons`)
        .set(updatedSeasons);
    } catch (error) {
      console.error('Error updating watched status in batch:', error);
    }
  };

  return (
    <Suspense fallback={<LoadingCard />}>
      <Card
        className='h-full transition-shadow duration-300 flex flex-col'
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
            image={series.poster.poster}
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
          {typeof series.nextEpisode.episode === 'number' && (
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
                  Staffel {series.nextEpisode.season} Episode{' '}
                  {series.nextEpisode.episode}
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
                  {series.nextEpisode.title}
                </Typography>
              </Box>
            </>
          )}
          <Tooltip title={series.beschreibung} arrow>
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
                    color: series.watchlist ? '#22c55e' : '#9e9e9e',
                    width: '24px',
                    height: '24px',
                  }}
                />
              </Box>
            </Tooltip>
          )}
        </Box>
        <CardContent className='grow flex items-center justify-center '>
          <Tooltip title={series.title} arrow>
            <Typography
              variant='body1' // Geänderte Größe
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
              {series.title}
            </Typography>
          </Tooltip>
        </CardContent>
      </Card>
      <SeriesDialog
        open={open}
        onClose={handleClose}
        series={series}
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
        series={series}
      />
      <SeriesWatchedDialog
        open={openWatchedDialog}
        onClose={handleCloseWatchedDialog}
        series={series}
        user={user}
        handleWatchedToggleWithConfirmation={
          handleWatchedToggleWithConfirmation
        }
        handleBatchWatchedToggle={handleBatchWatchedToggle} // neuer Prop
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
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        <DialogTitle
          sx={{ textAlign: 'center', position: 'relative', fontSize: '1.5rem' }}
        >
          Bestätigung
        </DialogTitle>
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
