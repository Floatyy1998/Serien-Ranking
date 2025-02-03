import BookmarkIcon from '@mui/icons-material/Bookmark';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  DialogContentText,
  Snackbar,
  useTheme,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '../App'; // Assuming you have an AuthContext
import { Series } from '../interfaces/Series';
import {
  clearOfflineRatings,
  getOfflineRatings,
  saveOfflineRating,
} from '../utils/db';
import { calculateOverallRating } from '../utils/rating';
import LoadingCard from './LoadingCard';

const Dialog = lazy(() => import('@mui/material/Dialog'));
const DialogActions = lazy(() => import('@mui/material/DialogActions'));
const DialogContent = lazy(() => import('@mui/material/DialogContent'));
const DialogTitle = lazy(() => import('@mui/material/DialogTitle'));
const Tooltip = lazy(() => import('@mui/material/Tooltip'));
const Typography = lazy(() => import('@mui/material/Typography'));
const Box = lazy(() => import('@mui/material/Box'));
const Button = lazy(() => import('@mui/material/Button'));
const Card = lazy(() => import('@mui/material/Card'));
const CardContent = lazy(() => import('@mui/material/CardContent'));
const CardMedia = lazy(() => import('@mui/material/CardMedia'));
const Chip = lazy(() => import('@mui/material/Chip'));
const Divider = lazy(() => import('@mui/material/Divider'));
const TextField = lazy(() => import('@mui/material/TextField'));

interface SeriesCardProps {
  series: Series;
  genre: string;
  index: number;
}

export const SeriesCard = ({ series, genre, index }: SeriesCardProps) => {
  const shadowColor = !series.production.production ? '#a855f7' : '#22c55e';
  const theme = useTheme();
  const auth = useAuth(); // Assuming useAuth provides currentUser
  const user = auth?.user;

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

  const formatDateWithLeadingZeros = (date: Date) => {
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

  const handleRatingChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    genre: string
  ) => {
    const value = event.target.value;
    setRatings({ ...ratings, [genre]: value === '' ? '' : parseFloat(value) });
  };

  const handleDeleteSeries = () => {
    const ref = firebase.database().ref(`/serien/${series.nmr}`);
    ref.remove();
    setOpen(false);
  };

  const handleUpdateRatings = async () => {
    const ref = firebase.database().ref(`/serien/${series.nmr}/rating`);
    const updatedRatings = Object.fromEntries(
      Object.entries(ratings).map(([k, value]) => [k, value === '' ? 0 : value])
    );

    if (navigator.onLine) {
      try {
        await ref.set(updatedRatings);
        setOpen(false);
      } catch (error) {
        console.error('Error updating ratings online:', error);
        await saveOfflineRating({ id: series.nmr, ratings });
        setSnackbarMessage(
          'Sie sind offline. Rating-Änderungen werden gecached und nach erneuter Verbindung ausgeführt.'
        );
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        setOpen(false);
      }
    } else {
      await saveOfflineRating({ id: series.nmr, ratings: updatedRatings });
      setSnackbarMessage(
        'Sie sind offline. Rating-Änderungen werden gecached und nach erneuter Verbindung ausgeführt.'
      );
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      setOpen(false);
    }
  };

  const syncRatings = async () => {
    const offlineRatings = await getOfflineRatings();
    if (offlineRatings.length > 0) {
      for (const ratingData of offlineRatings) {
        try {
          const ref = firebase
            .database()
            .ref(`/serien/${ratingData.id}/rating`);
          await ref.set(ratingData.ratings);
        } catch (error) {
          console.error('Error sending offline rating to server:', error);
        }
      }
      await clearOfflineRatings();
    }
  };

  useEffect(() => {
    window.addEventListener('online', syncRatings);
    return () => {
      window.removeEventListener('online', syncRatings);
    };
  }, []);

  const handleChipClick = (genre: string) => {
    const input = document.getElementById(`rating-input-${genre}`);
    if (input) {
      input.focus();
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
      window.open(`${series.wo.wo}`, '_blank');
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
      if (s.seasonNumber === seasonNumber) {
        return { ...s, episodes: updatedEpisodes };
      }
      return s;
    });

    try {
      await firebase
        .database()
        .ref(`/serien/${series.nmr}/seasons`)
        .set(updatedSeasons);
    } catch (error) {
      console.error('Error updating watched status:', error);
    }
  };

  const handleWatchedToggleWithConfirmation = async (
    seasonNumber: number,
    episodeId: number
  ) => {
    if (!user) {
      setSnackbarMessage('Bitte melden Sie sich an, um den Status zu ändern.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) return;

    const episodeIndex = season.episodes.findIndex((e) => e.id === episodeId);
    if (episodeIndex === -1) return;

    const previousEpisodesUnwatched = season.episodes
      .slice(0, episodeIndex)
      .some((episode) => !episode.watched);

    if (previousEpisodesUnwatched) {
      const confirm = window.confirm(
        'Es gibt vorherige Episoden, die nicht als gesehen markiert sind. Möchten Sie alle vorherigen Episoden auch als gesehen markieren?'
      );
      if (confirm) {
        await handleWatchedToggle(seasonNumber, episodeId);
      } else {
        const updatedEpisodes = season.episodes.map((episode) => {
          if (episode.id === episodeId) {
            return { ...episode, watched: !episode.watched };
          }
          return episode;
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
            .ref(`/serien/${series.nmr}/seasons`)
            .set(updatedSeasons);
        } catch (error) {
          console.error('Error updating watched status:', error);
        }
      }
    } else {
      const updatedEpisodes = season.episodes.map((episode) => {
        if (episode.id === episodeId) {
          return { ...episode, watched: !episode.watched };
        }
        return episode;
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
          .ref(`/serien/${series.nmr}/seasons`)
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
    event.stopPropagation();
    if (!user) {
      setSnackbarMessage(
        'Bitte melden Sie sich an, um die Watchlist zu ändern.'
      );
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    const ref = firebase.database().ref(`/serien/${series.nmr}/watchlist`);
    const newWatchlistStatus = !series.watchlist;
    try {
      await ref.set(newWatchlistStatus);
    } catch (error) {
      console.error('Error updating watchlist status:', error);
    }
  };

  const uniqueSeasons = series?.seasons?.filter(
    (season, index, self) =>
      index === self.findIndex((s) => s.seasonNumber === season.seasonNumber)
  );

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
                <Typography variant='h5' className=' text-center'>
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
                  variant='h5'
                  className=' text-center'
                  sx={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
            >
              <Typography variant='body1' className='text-white'>
                {rating}
              </Typography>
            </Box>
          </Tooltip>
          <Box
            className='absolute bottom-2 right-2 bg-black/50 backdrop-blur-xs rounded-lg p-1 cursor-pointer'
            onClick={handleWatchlistToggle}
          >
            <BookmarkIcon
              sx={{
                color: series.watchlist ? '#22c55e' : '#9e9e9e',
                width: '24px',
                height: '24px',
              }}
            />
          </Box>
        </Box>
        <CardContent className='grow flex items-center justify-center '>
          <Tooltip title={series.title} arrow>
            <Typography
              variant='h4' // Increased size
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
              }}
              onClick={handleTitleClick}
            >
              {shouldNumber && `${index}. `}
              {series.title}
            </Typography>
          </Tooltip>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={handleClose} fullWidth>
        <DialogTitle variant='h2'>
          {series.title} bearbeiten/löschen
        </DialogTitle>
        <DialogContent>
          <Typography className='m-3' variant='h3'>
            Genre
          </Typography>
          <Box className='flex flex-wrap gap-2 mb-4 justify-center'>
            {series.genre.genres.map((g) => (
              <Chip
                key={g}
                label={g}
                onClick={() => handleChipClick(g)}
                sx={{
                  fontSize: '1rem',
                  borderRadius: theme.shape.borderRadius,
                }}
              />
            ))}
          </Box>
          <Typography variant='h3'>Rating</Typography>
          {allGenres.map((g) => (
            <TextField
              key={g}
              id={`rating-input-${g}`}
              label={g}
              type='number'
              value={ratings[g] === 0 ? '' : ratings[g]}
              onChange={(e) => handleRatingChange(e, g)}
              fullWidth
              margin='normal'
              inputMode='decimal'
            />
          ))}
        </DialogContent>
        <DialogActions className='flex justify-between'>
          <Button onClick={handleDeleteSeries} variant='outlined' color='error'>
            Serie löschen
          </Button>
          <Button
            onClick={handleUpdateRatings}
            variant='outlined'
            color='primary'
          >
            Rating ändern
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openEpisodes} onClose={handleCloseEpisodes} fullWidth>
        <DialogTitle variant='h2' className='bg-[#090909]'>
          Kommende Episoden von {series.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <ul id='serienRecs'>
              {Array.isArray(series.nextEpisode.nextEpisodes) &&
                series.nextEpisode.nextEpisodes.map((episode) => (
                  <>
                    <li
                      key={episode.id}
                      className='episodes flex gap-3 items-center p-3'
                    >
                      <img
                        className='episodeBild w-[92px]'
                        src={series.poster.poster}
                        alt={episode.name}
                      />
                      <div className='episodeBox flex flex-col gap-5'>
                        <Chip
                          className='text-white'
                          sx={{
                            height: 'fit-content !important',
                            width: 'fit-content !important',
                            borderRadius: '50px !important',
                            fontSize: '.8rem !important',
                            minWidth: 'fit-content !important',
                            minHeight: 'fit-content !important',
                          }}
                          label={series.title}
                        ></Chip>
                        <Typography variant='body2' className='text-white'>
                          S{episode.season} | E{episode.number}
                        </Typography>
                        <Typography variant='body2' className='text-white'>
                          {episode.name}
                        </Typography>
                      </div>
                      <div className='flex flex-col items-end ml-auto'>
                        <Typography variant='body2' className='text-white'>
                          {new Date(episode.airstamp).toLocaleDateString()} |{' '}
                          {new Date(episode.airstamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </div>
                    </li>
                    <Divider></Divider>
                  </>
                ))}
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseEpisodes}
            variant='outlined'
            color='primary'
          >
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openWatchedDialog}
        onClose={handleCloseWatchedDialog}
        fullWidth
      >
        <DialogTitle variant='h2'>
          Gesehene Episoden von {series.title}
        </DialogTitle>
        <DialogContent>
          {uniqueSeasons?.map((season) => (
            <Accordion
              key={season.seasonNumber}
              sx={{
                marginBottom: '20px',
                borderRadius: '8px',
                fontSize: '1rem',
                boxShadow:
                  '#00fed7 3px 3px 4px 0px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px',
                backgroundColor: '#1a1a1a',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: '#1f1f1f',
                  textAlign: 'center',
                }}
              >
                <Typography variant='h4' textAlign={'center'} margin={'auto'}>
                  Staffel {season.seasonNumber + 1}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  borderRadius: '8px',
                  backgroundColor: '#1a1a1a',
                }}
              >
                {season.episodes &&
                  season.episodes.map((episode, episodeIndex) => (
                    <Box
                      key={episode.id}
                      display='flex'
                      alignItems='center'
                      justifyContent='space-between'
                      sx={{
                        backgroundColor:
                          episodeIndex % 2 === 0
                            ? theme.palette.action.hover
                            : 'inherit',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '4px',
                      }}
                    >
                      <Box>
                        <Typography variant='h5'>
                          {episodeIndex + 1}. {episode.name}
                        </Typography>
                        <Typography
                          textAlign={'left'}
                          marginLeft={'16px'}
                          variant='body2'
                          color='textSecondary'
                        >
                          {formatDateWithLeadingZeros(
                            new Date(episode.air_date)
                          )}
                        </Typography>
                      </Box>
                      <CheckCircleIcon
                        onClick={() =>
                          handleWatchedToggleWithConfirmation(
                            season.seasonNumber,
                            episode.id
                          )
                        }
                        sx={{
                          cursor: 'pointer',
                          width: '30px',
                          height: '30px',
                          color: episode.watched
                            ? theme.palette.success.main
                            : theme.palette.action.disabled,
                        }}
                      />
                    </Box>
                  ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseWatchedDialog}
            variant='outlined'
            color='primary'
          >
            Schließen
          </Button>
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
    </Suspense>
  );
};
export default SeriesCard;
