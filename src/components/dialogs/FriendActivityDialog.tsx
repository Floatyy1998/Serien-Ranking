import {
  CalendarToday,
  Close,
  Delete,
  FastForward,
  Movie as MovieIcon,
  PlayArrow,
  Star,
  Timeline,
  Tv,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  Slide,
  Snackbar,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useFriends } from '../../contexts/FriendsProvider';
import { Movie } from '../../interfaces/Movie';
import { Series } from '../../interfaces/Series';
import MovieDialog from './MovieDialog';
import SeriesDialog from './SeriesDialog';

interface ActivityItem {
  id: string;
  type:
    | 'series_added'
    | 'series_deleted'
    | 'episode_watched'
    | 'episodes_watched'
    | 'series_rated'
    | 'rating_updated'
    | 'movie_added'
    | 'movie_deleted'
    | 'movie_rated'
    | 'rating_updated_movie';
  itemTitle?: string; // Neues universelles Feld
  seriesTitle?: string;
  movieTitle?: string;
  episodeInfo?: string;
  rating?: number;
  timestamp: number;
  tmdbId?: number; // TMDB ID für Serien/Filme (bevorzugt)
}

interface FriendActivityDialogProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
  friendPhotoURL?: string;
}

export const FriendActivityDialog: React.FC<FriendActivityDialogProps> = ({
  open,
  onClose,
  friendId,
  friendName,
  friendPhotoURL,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [movieDialogOpen, setMovieDialogOpen] = useState(false);

  // TMDB Dialog state
  const [tmdbDialogOpen, setTmdbDialogOpen] = useState(false);
  const [tmdbData, setTmdbData] = useState<any>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbType, setTmdbType] = useState<'movie' | 'tv'>('movie');
  const [adding, setAdding] = useState(false);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');

  // Context hooks
  const auth = useAuth();
  const user = auth?.user;
  const { updateUserActivity } = useFriends();

  // Snackbar handler
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Function to fetch TMDB data
  const fetchTMDBData = async (tmdbId: number, type: 'movie' | 'tv') => {
    try {
      setTmdbLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=de-DE`;

      const response = await fetch(url);
      const data = await response.json();

      setTmdbData(data);
      setTmdbType(type);
      setTmdbDialogOpen(true);
    } catch (error) {
      console.error('Fehler beim Laden der TMDB-Daten:', error);
    } finally {
      setTmdbLoading(false);
    }
  };

  // Function to add series/movie to own list using existing API
  const addToOwnList = async () => {
    if (!tmdbData || !user) return;

    try {
      setAdding(true);

      if (tmdbType === 'tv') {
        // Add series using existing API
        const seriesData = {
          id: tmdbData.id.toString(),
          data: {
            user: import.meta.env.VITE_USER,
            id: tmdbData.id,
            uuid: user.uid,
          },
        };

        const res = await fetch(`https://serienapi.konrad-dinges.de/add`, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(seriesData.data),
        });

        if (res.ok) {
          // Activity tracken für Freunde
          await updateUserActivity({
            type: 'series_added',
            itemTitle: tmdbData.name || 'Unbekannte Serie',
            tmdbId: tmdbData.id, // TMDB ID verwenden
          });

          setSnackbarMessage(
            `Serie "${tmdbData.name}" erfolgreich hinzugefügt!`
          );
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          const msgJson = await res.json();
          if (msgJson.error === 'Serie bereits vorhanden') {
            setSnackbarMessage(
              `Serie "${tmdbData.name}" ist bereits in deiner Liste vorhanden`
            );
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            throw new Error('Fehler beim Hinzufügen der Serie.');
          }
        }
      } else {
        // Add movie using existing API
        const movieData = {
          id: tmdbData.id.toString(),
          data: {
            user: import.meta.env.VITE_USER,
            id: tmdbData.id,
            uuid: user.uid,
          },
        };

        const res = await fetch(`https://serienapi.konrad-dinges.de/addMovie`, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(movieData.data),
        });

        if (res.ok) {
          // Activity tracken für Freunde
          await updateUserActivity({
            type: 'movie_added',
            itemTitle: tmdbData.title || 'Unbekannter Film',
            tmdbId: tmdbData.id, // TMDB ID verwenden
          });

          setSnackbarMessage(
            `Film "${tmdbData.title}" erfolgreich hinzugefügt!`
          );
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          const msgJson = await res.json();
          if (msgJson.error === 'Film bereits vorhanden') {
            setSnackbarMessage(
              `Film "${tmdbData.title}" ist bereits in deiner Liste vorhanden`
            );
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
          } else {
            throw new Error('Fehler beim Hinzufügen des Films.');
          }
        }
      }

      // Close dialog after successful addition
      setTmdbDialogOpen(false);
      setTmdbData(null);
    } catch (error) {
      console.error('Fehler beim Hinzufügen zur eigenen Liste:', error);
      setSnackbarMessage(
        `Fehler beim Hinzufügen zur Liste: ${
          error instanceof Error ? error.message : 'Unbekannter Fehler'
        }`
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAdding(false);
    }
  };

  // Handler functions for opening dialogs
  const handleTitleClick = async (activity: ActivityItem) => {
    const tmdbId = activity.tmdbId;
    console.log('Handling title click for activity:', activity);

    if (!tmdbId) return;

    // Öffne Dialog für alle relevanten Typen
    if (
      activity.type.includes('series') ||
      activity.type === 'episode_watched' ||
      activity.type === 'episodes_watched' ||
      activity.type === 'series_rated' ||
      activity.type === 'rating_updated'
    ) {
      console.log('Opening series dialog for activity:', activity);
      console.log('TMDB ID:', tmdbId);

      await fetchTMDBData(tmdbId, 'tv');
      return;
    } else if (
      activity.type.includes('movie') ||
      activity.type === 'movie_rated'
    ) {
      await fetchTMDBData(tmdbId, 'movie');
      return;
    }
  };

  const handleSeriesDialogClose = () => {
    setSeriesDialogOpen(false);
    setSelectedSeries(null);
  };

  const handleMovieDialogClose = () => {
    setMovieDialogOpen(false);
    setSelectedMovie(null);
  };

  const handleTmdbDialogClose = () => {
    setTmdbDialogOpen(false);
    setTmdbData(null);
    setAdding(false);
  };

  useEffect(() => {
    if (!open || !friendId) return;

    const loadActivities = async () => {
      setLoading(true);
      try {
        const activitiesRef = firebase.database().ref(`activities/${friendId}`);
        const snapshot = await activitiesRef
          .orderByChild('timestamp')
          .limitToLast(20)
          .once('value');

        if (snapshot.exists()) {
          const data = snapshot.val();
          const activityList = Object.entries(data).map(
            ([id, activity]: [string, any]) => ({
              id,
              ...activity,
            })
          );

          // Sortiere nach Timestamp (neueste zuerst)
          activityList.sort((a, b) => b.timestamp - a.timestamp);
          setActivities(activityList);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [open, friendId]);

  const getActivityIcon = (type: string) => {
    const iconStyle = { fontSize: 20, color: 'white' };
    switch (type) {
      case 'series_added':
        return <Tv sx={iconStyle} />;
      case 'series_deleted':
        return <Delete sx={iconStyle} />;
      case 'episode_watched':
        return <PlayArrow sx={iconStyle} />;
      case 'episodes_watched':
        return <FastForward sx={iconStyle} />;
      case 'series_rated':
        return <Star sx={iconStyle} />;
      case 'movie_added':
        return <MovieIcon sx={iconStyle} />;
      case 'movie_deleted':
        return <Delete sx={iconStyle} />;
      case 'movie_rated':
        return <Star sx={iconStyle} />;
      default:
        return <Timeline sx={iconStyle} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'series_added':
      case 'movie_added':
        return '#4caf50';
      case 'series_deleted':
      case 'movie_deleted':
        return '#f44336';
      case 'episode_watched':
      case 'episodes_watched':
        return '#00fed7';
      case 'series_rated':
      case 'movie_rated':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getActivityEmoji = (type: string) => {
    switch (type) {
      case 'series_added':
        return '📺';
      case 'series_deleted':
        return '🗑️';
      case 'episode_watched':
        return '▶️';
      case 'episodes_watched':
        return '⏩';
      case 'series_rated':
        return '⭐';
      case 'movie_added':
        return '🎬';
      case 'movie_deleted':
        return '🗑️';
      case 'movie_rated':
        return '⭐';
      default:
        return '📊';
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const title =
      activity.itemTitle ||
      activity.seriesTitle ||
      activity.movieTitle ||
      'Unbekannter Titel';

    const TitleComponent = ({ children }: { children: React.ReactNode }) => (
      <Box
        component='span'
        sx={{
          color: '#00fed7',
          cursor: 'pointer',
          textDecoration: 'underline',
          '&:hover': {
            color: '#00d4b8',
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleTitleClick(activity);
        }}
      >
        {children}
      </Box>
    );

    switch (activity.type) {
      case 'series_added':
        return (
          <>
            hat die Serie "<TitleComponent>{title}</TitleComponent>" hinzugefügt
          </>
        );
      case 'series_deleted':
        return (
          <>
            hat die Serie "<TitleComponent>{title}</TitleComponent>" entfernt
          </>
        );
      case 'episode_watched': {
        // Prüfen ob der Titel bereits Episode-Info enthält (z.B. "Serie - Staffel X Episode Y")
        if (title.includes(' - Staffel ') && title.includes(' Episode ')) {
          const staffelIndex = title.indexOf(' - Staffel ');
          const seriesName = title.substring(0, staffelIndex);
          let episodeInfo = title.substring(staffelIndex + 1); // +1 für das Leerzeichen nach dem Bindestrich
          // Staffelnummer extrahieren und +1 rechnen
          const staffelMatch = episodeInfo.match(/Staffel\s(\d+)/);
          let staffelNum = staffelMatch ? parseInt(staffelMatch[1], 10) : null;
          if (staffelNum !== null) {
            episodeInfo = episodeInfo.replace(
              /Staffel\s\d+/,
              `Staffel ${staffelNum + 1}`
            );
          }
          return (
            <>
              hat "<TitleComponent>{seriesName}</TitleComponent>" {episodeInfo}{' '}
              geschaut
            </>
          );
        } else {
          // Verwende separaten episodeInfo
          return (
            <>
              hat "<TitleComponent>{title}</TitleComponent>"
              {activity.episodeInfo
                ? ` ${activity.episodeInfo}`
                : ' eine Episode'}{' '}
              geschaut
            </>
          );
        }
      }
      case 'episodes_watched': {
        // Prüfen ob der Titel Staffel-Info enthält (z.B. "Serie - Staffel X (n Episoden)")
        if (title.includes(' - Staffel ')) {
          const staffelIndex = title.indexOf(' - Staffel ');
          const seriesName = title.substring(0, staffelIndex);
          let staffelUndRest = title.substring(staffelIndex + 1); // +1 für Leerzeichen nach Bindestrich
          // Staffelnummer extrahieren und +1 rechnen
          const staffelMatch = staffelUndRest.match(/Staffel\s(\d+)/);
          let staffelNum = staffelMatch ? parseInt(staffelMatch[1], 10) : null;
          if (staffelNum !== null) staffelNum += 1;
          staffelUndRest = staffelUndRest.replace(
            /Staffel\s\d+/,
            `Staffel ${staffelNum}`
          );
          return (
            <>
              hat "<TitleComponent>{seriesName}</TitleComponent>"{' '}
              {staffelUndRest} geschaut
            </>
          );
        } else {
          return (
            <>
              hat "<TitleComponent>{title}</TitleComponent>" geschaut
            </>
          );
        }
      }
      case 'series_rated':
      case 'rating_updated':
      case 'rating_updated_movie':
        return (
          <>
            hat "<TitleComponent>{title}</TitleComponent>" bewertet
            {activity.rating ? ` (${activity.rating}/10)` : ''}
          </>
        );
      case 'movie_added':
        return (
          <>
            hat den Film "<TitleComponent>{title}</TitleComponent>" hinzugefügt
          </>
        );
      case 'movie_deleted':
        return (
          <>
            hat den Film "<TitleComponent>{title}</TitleComponent>" entfernt
          </>
        );
      case 'movie_rated':
        return (
          <>
            hat "<TitleComponent>{title}</TitleComponent>" bewertet
            {activity.rating ? ` (${activity.rating}/10)` : ''}
          </>
        );
      default:
        return 'Unbekannte Aktivität';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'vor wenigen Minuten';
    } else if (diffInHours < 24) {
      return `vor ${Math.floor(diffInHours)} Stunden`;
    } else if (diffInHours < 168) {
      // 7 Tage
      const days = Math.floor(diffInHours / 24);
      return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        },
      }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' } as any}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
          color: 'white',
          textAlign: 'center',
          py: 3,
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          <Close />
        </IconButton>

        <Box display='flex' alignItems='center' justifyContent='center' gap={2}>
          <Avatar
            src={friendPhotoURL || undefined}
            sx={{
              width: 50,
              height: 50,
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              bgcolor: '#00fed7',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {friendName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant='h5' fontWeight='700' sx={{ mb: 0.5 }}>
              {getActivityEmoji('default')} {friendName}s Aktivitäten
            </Typography>
            <Chip
              label='Die letzten 20 Aktivitäten'
              size='small'
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: '#1e1e1e' }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              <Timeline sx={{ fontSize: 80, color: '#00fed7', mb: 2 }} />
            </Box>
            <Typography variant='h6' color='#00fed7'>
              Lade Aktivitäten...
            </Typography>
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Timeline
              sx={{ fontSize: 80, color: '#9e9e9e', mb: 3, opacity: 0.5 }}
            />
            <Typography
              variant='h5'
              gutterBottom
              fontWeight='600'
              color='#e0e0e0'
            >
              Keine Aktivitäten
            </Typography>
            <Typography variant='body1' color='#9e9e9e'>
              {friendName} hat noch keine Aktivitäten
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {activities.map((activity, index) => (
              <Fade key={activity.id} in timeout={300 + index * 100}>
                <Card
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    backgroundColor: '#2d2d30',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    border: '1px solid #404040',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                      backgroundColor: '#333333',
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 4,
                      backgroundColor: getActivityColor(activity.type),
                      borderRadius: '2px',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Box display='flex' alignItems='flex-start' gap={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: getActivityColor(activity.type),
                          boxShadow: `0 4px 12px ${getActivityColor(
                            activity.type
                          )}33`,
                          flexShrink: 0,
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Box>

                      <Box flex={1} minWidth={0}>
                        <Typography
                          variant='body1'
                          sx={{
                            mb: 1,
                            fontWeight: 500,
                            lineHeight: 1.4,
                            color: '#e0e0e0',
                          }}
                        >
                          <Box
                            component='span'
                            sx={{ fontWeight: 700, color: '#00fed7' }}
                          >
                            {friendName}
                          </Box>{' '}
                          {getActivityText(activity)}
                        </Typography>

                        <Box display='flex' alignItems='center' gap={1}>
                          <CalendarToday
                            sx={{ fontSize: 16, color: '#9e9e9e' }}
                          />
                          <Chip
                            label={formatTimestamp(activity.timestamp)}
                            size='small'
                            variant='outlined'
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              borderColor: '#404040',
                              color: '#b0b0b0',
                              backgroundColor: '#1a1a1a',
                            }}
                          />
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          fontSize: '1.5rem',
                          opacity: 0.6,
                          flexShrink: 0,
                        }}
                      >
                        {getActivityEmoji(activity.type)}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Box>
        )}
      </DialogContent>

      {/* Series Dialog */}
      {selectedSeries && seriesDialogOpen && (
        <SeriesDialog
          open={seriesDialogOpen}
          onClose={handleSeriesDialogClose}
          series={selectedSeries}
          allGenres={[]}
          ratings={{}}
          setRatings={() => {}}
          handleDeleteSeries={() => {}}
          handleUpdateRatings={() => {}}
          isReadOnly={true}
        />
      )}

      {/* Movie Dialog */}
      {selectedMovie && movieDialogOpen && (
        <MovieDialog
          open={movieDialogOpen}
          onClose={handleMovieDialogClose}
          movie={selectedMovie}
          allGenres={[]}
          ratings={{}}
          setRatings={() => {}}
          handleDeleteMovie={() => {}}
          handleUpdateRatings={() => {}}
          isReadOnly={true}
        />
      )}

      {/* TMDB Dialog */}
      {tmdbDialogOpen && (
        <Dialog
          open={tmdbDialogOpen}
          onClose={handleTmdbDialogClose}
          maxWidth='md'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
              color: 'white',
              maxHeight: '90vh',
              overflow: 'hidden',
            },
          }}
        >
          {tmdbLoading ? (
            <DialogContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='#00fed7'>
                Lade Daten...
              </Typography>
            </DialogContent>
          ) : tmdbData ? (
            <>
              <DialogTitle
                sx={{
                  background:
                    'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
                  color: 'white',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={handleTmdbDialogClose}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'white',
                  }}
                >
                  <Close />
                </IconButton>
                <Box sx={{ pr: 6 }}>
                  <Typography
                    variant='h5'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {tmdbType === 'tv' ? tmdbData.name : tmdbData.title}
                    {tmdbData.first_air_date &&
                      ` (${new Date(tmdbData.first_air_date).getFullYear()})`}
                    {tmdbData.release_date &&
                      ` (${new Date(tmdbData.release_date).getFullYear()})`}
                  </Typography>
                  <Chip
                    label={tmdbType === 'tv' ? '📺 Serie' : '🎬 Film'}
                    size='small'
                    sx={{
                      mt: 1,
                      backgroundColor: '#00fed7',
                      color: '#000',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3, backgroundColor: '#1e1e1e' }}>
                <Box
                  display='flex'
                  gap={3}
                  flexDirection={{ xs: 'column', md: 'row' }}
                >
                  {tmdbData.poster_path && (
                    <Box sx={{ flexShrink: 0 }}>
                      <Box
                        component='img'
                        src={`https://image.tmdb.org/t/p/w300${tmdbData.poster_path}`}
                        alt={tmdbType === 'tv' ? tmdbData.name : tmdbData.title}
                        sx={{
                          width: { xs: '200px', md: '250px' },
                          height: 'auto',
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          mx: { xs: 'auto', md: 0 },
                          display: 'block',
                        }}
                      />
                    </Box>
                  )}

                  <Box flex={1}>
                    {tmdbData.overview && (
                      <Box mb={3}>
                        <Typography
                          variant='h6'
                          gutterBottom
                          sx={{ color: '#00fed7' }}
                        >
                          Beschreibung
                        </Typography>
                        <Typography variant='body1' sx={{ lineHeight: 1.6 }}>
                          {tmdbData.overview}
                        </Typography>
                      </Box>
                    )}

                    <Box display='flex' flexDirection='column' gap={2}>
                      {tmdbData.vote_average && (
                        <Box>
                          <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                            TMDB Bewertung
                          </Typography>
                          <Typography variant='body1'>
                            ⭐ {tmdbData.vote_average.toFixed(1)}/10
                          </Typography>
                        </Box>
                      )}

                      {tmdbData.genres && tmdbData.genres.length > 0 && (
                        <Box>
                          <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                            Genres
                          </Typography>
                          <Box display='flex' gap={1} flexWrap='wrap' mt={1}>
                            {tmdbData.genres.map((genre: any) => (
                              <Chip
                                key={genre.id}
                                label={genre.name}
                                size='small'
                                sx={{
                                  backgroundColor: '#00fed7',
                                  color: '#000',
                                  fontWeight: 'bold',
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {tmdbType === 'tv' && tmdbData.number_of_seasons && (
                        <Box>
                          <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                            Staffeln
                          </Typography>
                          <Typography variant='body1'>
                            {tmdbData.number_of_seasons} Staffel(n) •{' '}
                            {tmdbData.number_of_episodes} Episoden
                          </Typography>
                        </Box>
                      )}

                      {tmdbType === 'movie' && tmdbData.runtime && (
                        <Box>
                          <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                            Laufzeit
                          </Typography>
                          <Typography variant='body1'>
                            {tmdbData.runtime} Minuten
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3, backgroundColor: '#1e1e1e', gap: 2 }}>
                <Button
                  variant='outlined'
                  onClick={handleTmdbDialogClose}
                  sx={{
                    borderColor: '#404040',
                    color: '#e0e0e0',
                    '&:hover': {
                      borderColor: '#00fed7',
                      backgroundColor: 'rgba(0, 254, 215, 0.1)',
                    },
                  }}
                >
                  Schließen
                </Button>
                <Button
                  variant='contained'
                  onClick={addToOwnList}
                  disabled={adding}
                  sx={{
                    backgroundColor: '#00fed7',
                    color: '#000',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#00d4b8',
                    },
                    '&:disabled': {
                      backgroundColor: '#666',
                      color: '#999',
                    },
                  }}
                >
                  {adding
                    ? 'Wird hinzugefügt...'
                    : `${
                        tmdbType === 'tv' ? 'Serie' : 'Film'
                      } zu meiner Liste hinzufügen`}
                </Button>
              </DialogActions>
            </>
          ) : null}
        </Dialog>
      )}

      {/* Snackbar für Erfolgs-/Fehlermeldungen */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{
            backgroundColor:
              snackbarSeverity === 'success'
                ? '#4caf50'
                : snackbarSeverity === 'warning'
                ? '#ff9800'
                : '#f44336',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white',
            },
            '& .MuiAlert-action': {
              color: 'white',
            },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default FriendActivityDialog;
