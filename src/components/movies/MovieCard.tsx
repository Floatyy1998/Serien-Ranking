import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { allGenresForMovies } from '../../../constants/seriesCard.constants';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { Movie } from '../../interfaces/Movie';
import '../../styles/animations.css';
import { getFormattedDate } from '../../utils/date.utils';
import { logRatingAdded } from '../../utils/minimalActivityLogger';
import { calculateOverallRating } from '../../utils/rating';
import ThreeDotMenu, { DeleteIcon, StarIcon } from '../common/ThreeDotMenu';
import MovieDialog from '../dialogs/MovieDialog';
import TmdbDialog from '../dialogs/TmdbDialog';

interface MovieCardProps {
  movie: Movie;
  genre: string;
  index: number;
  disableRatingDialog?: boolean;
  disableDeleteDialog?: boolean;
  forceReadOnlyDialogs?: boolean;
}

export const MovieCard = ({
  movie,
  index,
  disableRatingDialog = false,
  disableDeleteDialog = false,
  forceReadOnlyDialogs = false,
}: MovieCardProps) => {
  const { movieList } = useMovieList();
  const auth = useAuth();
  const user = auth?.user;
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
  const {} = useOptimizedFriends();
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogCallback, setConfirmDialogCallback] = useState<
    (() => void) | null
  >(null);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('');
  const [providerTooltipOpen, setProviderTooltipOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if desktop
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close tooltip when clicking anywhere (mobile only)
  useEffect(() => {
    if (isDesktop) return; // Don't add click listener on desktop

    const handleClickOutside = () => {
      if (providerTooltipOpen) {
        setProviderTooltipOpen(false);
      }
    };

    if (providerTooltipOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [providerTooltipOpen, isDesktop]);

  const handleClickOpen = () => {
    setOpen(true);
    const initialRatings: { [key: string]: number } = {};
    allGenresForMovies.forEach((g) => {
      initialRatings[g] = currentMovie.rating?.[g] || 0;
    });
    setRatings(initialRatings);
  };

  // TMDB Dialog State
  const [tmdbDialogOpen, setTmdbDialogOpen] = useState(false);
  const [tmdbData, setTmdbData] = useState<any>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchTMDBData = async (tmdbId: number) => {
    try {
      setTmdbLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=de-DE`;
      const response = await fetch(url);
      const data = await response.json();
      setTmdbData(data);
      setTmdbDialogOpen(true);
    } catch (error) {
      setSnackbarMessage('Fehler beim Laden der TMDB-Daten');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleAddMovie = async () => {
    if (!user || !tmdbData) return;

    try {
      setAdding(true);

      const movieData = {
        user: import.meta.env.VITE_USER,
        id: tmdbData.id,
        uuid: user.uid,
      };

      const res = await fetch(`https://serienapi.konrad-dinges.de/addMovie`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(movieData),
      });

      if (res.ok) {
        // Activity-Logging für Friend + Badge-System
        const { logMovieAdded } = await import(
          '../../utils/minimalActivityLogger'
        );
        await logMovieAdded(
          user.uid,
          tmdbData.title || 'Unbekannter Film',
          tmdbData.id
        );

        setSnackbarMessage('Film erfolgreich hinzugefügt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTmdbDialogOpen(false);
      } else {
        const msgJson = await res.json();
        if (msgJson.error === 'Film bereits vorhanden') {
          setSnackbarMessage('Film bereits vorhanden');
          setSnackbarSeverity('error');
        } else {
          throw new Error('Fehler beim Hinzufügen des Films.');
        }
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Fehler beim Hinzufügen des Films');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAdding(false);
    }
  };

  const handlePosterClick = () => {
    if (currentMovie.id) {
      fetchTMDBData(currentMovie.id);
    }
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

        // Activity für Badge-System loggen (ersetzt Friend-Activity)
        const movieWithUpdatedRating = {
          ...currentMovie,
          rating: Object.fromEntries(
            Object.entries(ratings).map(([k, v]) => [k, Number(v)])
          ),
        };
        const overallRating = calculateOverallRating(movieWithUpdatedRating);
        const ratingValue = parseFloat(overallRating);

        if (user?.uid && ratingValue > 0) {
          await logRatingAdded(
            user.uid,
            currentMovie.title || 'Unbekannter Film',
            'movie',
            ratingValue,
            currentMovie.id || 0
          );

          // Badge rating handled by clean logger
        }

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

  const handleDeleteConfirmation = () => {
    setConfirmDialogMessage(
      `Möchten Sie den Film "${currentMovie.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
    );
    setConfirmDialogCallback(() => handleDeleteMovie);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmDialogCallback(null);
    setConfirmDialogMessage('');
  };

  const handleConfirmDialogConfirm = () => {
    if (confirmDialogCallback) {
      confirmDialogCallback();
    }
    handleConfirmDialogClose();
  };

  return (
    <>
      <Card
        className='h-full transition-all duration-500 flex flex-col series-card group'
        sx={{
          background:
            'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          position: 'relative',
          contain: 'layout style paint',
          willChange: 'transform, box-shadow',
          boxShadow: `0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(${
            shadowColor === '#a855f7' ? '168, 85, 247' : '34, 197, 94'
          }, 0.5), 0 0 60px rgba(${
            shadowColor === '#a855f7' ? '168, 85, 247' : '34, 197, 94'
          }, 0.2), 0 0 0 2px rgba(${
            shadowColor === '#a855f7' ? '168, 85, 247' : '34, 197, 94'
          }, 0.3)`,
          '@media (min-width: 768px)': {
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: `0 25px 80px rgba(0, 0, 0, 0.6), 0 0 50px rgba(${
                shadowColor === '#a855f7' ? '168, 85, 247' : '34, 197, 94'
              }, 0.7), 0 0 100px rgba(${
                shadowColor === '#a855f7' ? '168, 85, 247' : '34, 197, 94'
              }, 0.3), 0 0 0 2px rgba(${
                shadowColor === '#a855f7' ? '168, 85, 247' : '34, 197, 94'
              }, 0.4)`,
              willChange: 'transform, box-shadow',
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background:
              shadowColor === '#a855f7'
                ? 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.8), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.8), transparent)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 1,
          },
        }}
      >
        <Box
          className='relative aspect-2/3 overflow-hidden'
          sx={{
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-2px',
              left: '-2px',
              right: '-2px',
              height: '65px',
              background:
                'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
              pointerEvents: 'none',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: 'center bottom',
            },
            '@media (min-width: 768px)': {
              '.group:hover &::after': {
                transform: 'scale(1.06)',
              },
            },
          }}
        >
          <CardMedia
            onClick={handlePosterClick}
            sx={{
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backfaceVisibility: 'hidden',
              cursor: 'pointer',
              '@media (min-width: 768px)': {
                '.group:hover &': {
                  transform: 'scale(1.05)',
                },
              },
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
            <Box
              className='absolute top-3 left-1 flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300'
              sx={{
                transform: 'translateY(-10px)',
                '@media (min-width: 768px)': {
                  '.group:hover &': {
                    transform: 'translateY(0)',
                  },
                },
                '@media (max-width: 767px)': {
                  transform: 'translateY(0)',
                },
              }}
            >
              {uniqueProviders.slice(0, 2).map((provider) => (
                <Box
                  key={provider?.id}
                  sx={{
                    background:
                      'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '10px',
                    p: 0.25,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <img
                    src={provider?.logo}
                    alt={provider?.name}
                    style={{
                      height: '32px',
                      width: '32px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
              {uniqueProviders.length > 2 && (
                <Tooltip
                  title={
                    <Box sx={{ p: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {uniqueProviders.slice(2).map((provider, index) => (
                          <Box
                            key={provider?.id || index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1,
                              borderRadius: '12px',
                              background:
                                'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background:
                                  'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                transform: 'translateX(2px)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <img
                                src={provider?.logo}
                                alt={provider?.name}
                                style={{
                                  height: '24px',
                                  width: '24px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>
                            <Typography
                              variant='body2'
                              sx={{
                                fontSize: '0.875rem',
                                color: '#ffffff',
                                fontWeight: 500,
                                letterSpacing: '0.01em',
                              }}
                            >
                              {provider?.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  }
                  arrow
                  placement='bottom-start'
                  open={providerTooltipOpen}
                  onClose={() => setProviderTooltipOpen(false)}
                  disableHoverListener={!isDesktop}
                  disableFocusListener
                  disableTouchListener={isDesktop}
                  PopperProps={{
                    disablePortal: false,
                    modifiers: [
                      {
                        name: 'preventOverflow',
                        enabled: true,
                        options: {
                          altAxis: true,
                          altBoundary: true,
                          tether: true,
                          rootBoundary: 'viewport',
                        },
                      },
                      {
                        name: 'flip',
                        enabled: true,
                        options: {
                          altBoundary: true,
                          rootBoundary: 'viewport',
                          padding: 8,
                        },
                      },
                    ],
                  }}
                  componentsProps={{
                    tooltip: {
                      sx: {
                        background:
                          'linear-gradient(145deg, rgba(0,0,0,0.98) 0%, rgba(15,15,15,0.95) 50%, rgba(0,0,0,0.98) 100%)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '16px',
                        maxWidth: '280px',
                        boxShadow:
                          '0 20px 60px rgba(0,0,0,0.4), 0 8px 25px rgba(0,0,0,0.15)',
                        p: 1.5,
                      },
                    },
                  }}
                >
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDesktop) {
                        setProviderTooltipOpen(!providerTooltipOpen);
                      }
                    }}
                    onMouseEnter={() => {
                      if (isDesktop) {
                        setProviderTooltipOpen(true);
                      }
                    }}
                    onMouseLeave={() => {
                      if (isDesktop) {
                        setProviderTooltipOpen(false);
                      }
                    }}
                    sx={{
                      background:
                        'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '10px',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '@media (min-width: 768px)': {
                        '&:hover': {
                          transform: 'scale(1.1)',
                          background:
                            'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
                        },
                      },
                    }}
                  >
                    <Typography
                      variant='caption'
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      +{uniqueProviders.length - 2}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          )}
          {currentMovie.status !== 'Released' && (
            <Box
              className='absolute bottom-16 left-0 right-0'
              sx={{
                background:
                  'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                backdropFilter: 'blur(15px)',
                borderRadius: '0px',
                p: 1.5,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '@media (min-width: 768px)': {
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
                  },
                },
              }}
            >
              <Typography
                variant='body2'
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  textAlign: 'center',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                🎬 {dateString}
              </Typography>
            </Box>
          )}
          <Box
            className='absolute top-3 right-1'
            sx={{
              background:
                'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              px: 2,
              py: 1,
              transition: 'all 0.3s ease',
              '@media (min-width: 768px)': {
                '&:hover': {
                  background:
                    'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
                  transform: 'scale(1.05)',
                },
              },
            }}
            aria-label='Bewertung anzeigen'
          >
            <Typography
              variant='body1'
              sx={{
                fontSize: '0.9rem',
                color: '#ffffff',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              ⭐ {rating}
            </Typography>
          </Box>
          <Box
            className={`absolute bottom-3 right-3 transition-all duration-300 ${
              isMenuOpen
                ? 'opacity-100'
                : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
            }`}
            sx={{
              transform: 'translateY(10px)',
              '@media (min-width: 768px)': {
                '.group:hover &': {
                  transform: 'translateY(0)',
                },
              },
              '@media (max-width: 767px)': {
                transform: 'translateY(0)',
              },
            }}
          >
            <ThreeDotMenu
              onMenuStateChange={setIsMenuOpen}
              options={[
                {
                  label: 'Rating anpassen',
                  icon: <StarIcon />,
                  onClick: handleRatingClick,
                  disabled: disableRatingDialog,
                },
                {
                  label: 'Film löschen',
                  icon: <DeleteIcon sx={{ color: '#f87171' }} />,
                  onClick: (event: React.MouseEvent) => {
                    event.stopPropagation();
                    handleDeleteConfirmation();
                  },
                  disabled: disableDeleteDialog,
                },
              ]}
            />
          </Box>
        </Box>
        <CardContent
          className='grow flex items-center justify-center p-4'
          sx={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Tooltip title={currentMovie.title} arrow>
            <Typography
              variant='body1'
              className='text-white text-center'
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
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 600,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: shadowColor === '#a855f7' ? '#c084fc' : '#4ade80',
                },
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

      {/* TMDB Dialog */}
      <TmdbDialog
        open={tmdbDialogOpen}
        loading={tmdbLoading}
        data={tmdbData}
        type='movie'
        viewOnlyMode={forceReadOnlyDialogs}
        onAdd={handleAddMovie}
        adding={adding}
        onClose={() => {
          setTmdbDialogOpen(false);
          setTmdbData(null);
          setAdding(false);
        }}
      />

      {/* Bestätigungs Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmDialogClose}
        maxWidth='sm'
        sx={{
          '& .MuiDialog-paper': {
            background:
              'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow:
              '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 152, 0, 0.3), 0 0 60px rgba(255, 152, 0, 0.1)',
            color: '#ffffff',
          },
        }}
      >
        <DialogTitle
          sx={{
            background:
              'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(9, 24, 21, 1) 100%)',
            backdropFilter: 'blur(15px)',
            borderBottom: '1px solid rgba(255, 152, 0, 0.2)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1.25rem',
            textAlign: 'center',
          }}
        >
          ⚠️ Bestätigung
        </DialogTitle>
        <DialogContent
          sx={{
            background:
              'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(9, 24, 21, 1) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: '#ffffff',
            padding: '24px',
          }}
        >
          <DialogContentText
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              lineHeight: '1.5',
            }}
          >
            {confirmDialogMessage ||
              'Es gibt vorherige Episoden, die nicht als gesehen markiert sind. Möchten Sie alle vorherigen Episoden auch als gesehen markieren?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            padding: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background:
              'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(9, 24, 21, 1) 100%)',
          }}
        >
          <Button
            onClick={handleConfirmDialogClose}
            sx={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#ffffff',
              padding: '10px 20px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              '&:hover': {
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                transform: 'translateX(2px)',
              },
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirmDialogConfirm}
            variant='contained'
            autoFocus
            sx={{
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(244, 67, 54, 0.4)',
              },
            }}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MovieCard;
