import BookmarkIcon from '@mui/icons-material/Bookmark';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Star, Warning } from '@mui/icons-material';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Tooltip,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { allGenres } from '../../../../constants/seriesCard.constants';
import { useAuth } from '../../../App';
import notFound from '../../../assets/notFound.jpg';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../../../contexts/OptimizedSeriesListProvider';
import { logRatingAdded } from '../../../features/badges/minimalActivityLogger';
import { getUnifiedEpisodeDateTime } from '../../../lib/date/episodeDate.utils';
import { calculateOverallRating } from '../../../lib/rating/rating';
import '../../../styles/animations.css';
import { colors } from '../../../theme';
import { Series } from '../../../types/Series';
import ThreeDotMenu, {
  DeleteIcon,
  PlaylistPlayIcon,
  StarIcon,
} from '../../ui/ThreeDotMenu';
import SeriesDialog from '../dialogs/SeriesDialog';
import TmdbDialog from '../dialogs/TmdbDialog';
import WatchedEpisodesDialog from '../dialogs/WatchedEpisodesDialog';
const Typography = lazy(() => import('@mui/material/Typography'));
const Box = lazy(() => import('@mui/material/Box'));
const Card = lazy(() => import('@mui/material/Card'));
const CardContent = lazy(() => import('@mui/material/CardContent'));
const CardMedia = lazy(() => import('@mui/material/CardMedia'));
interface SeriesCardProps {
  series: Series;
  genre: string;
  index: number;
  disableRatingDialog?: boolean;
  forceReadOnlyDialogs?: boolean;
  disableDeleteDialog?: boolean;
}
export const SeriesCard = ({
  series,
  genre,
  index,
  disableRatingDialog = false,
  forceReadOnlyDialogs = false,
  disableDeleteDialog = false,
}: SeriesCardProps) => {
  // Hole aktuelle Serie-Daten aus dem Provider
  const { seriesList } = useSeriesList();
  const location = useLocation();
  const isUserProfilePage =
    location.pathname.includes('/user/') ||
    location.pathname.includes('/profile/');

  // Für User Profile verwende die übergebenen Daten, sonst die aktuellen aus dem Context
  const currentSeries = isUserProfilePage
    ? series
    : seriesList.find((s) => s.nmr === series.nmr) || series;

  const shadowColor = !currentSeries.production?.production
    ? '#a855f7'
    : '#22c55e';

  // Memoize expensive style calculations
  const shadowColors = useMemo(() => {
    const isProduction = shadowColor === '#22c55e';
    return {
      rgb: isProduction ? '34, 197, 94' : '168, 85, 247',
      hex: shadowColor,
    };
  }, [shadowColor]);

  const cardStyles = useMemo(
    () => ({
      background: `linear-gradient(145deg, ${colors.background.default} 0%, ${colors.background.surface} 50%, ${colors.background.default} 100%)`,
      borderRadius: '20px',
      border: `1px solid ${colors.overlay.white}`,
      overflow: 'hidden',
      position: 'relative',
      contain: 'layout style paint',
      boxShadow: `0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(${shadowColors.rgb}, 0.5), 0 0 60px rgba(${shadowColors.rgb}, 0.2), 0 0 0 2px rgba(${shadowColors.rgb}, 0.3)`,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '@media (min-width: 768px)': {
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(${shadowColors.rgb}, 0.6), 0 0 80px rgba(${shadowColors.rgb}, 0.2), 0 0 0 2px rgba(${shadowColors.rgb}, 0.4)`,
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
        transition: 'opacity 0.2s ease',
      },
      '&:hover::before': {
        opacity: 1,
      },
    }),
    [shadowColors.rgb, shadowColor]
  );

  const auth = useAuth();
  const user = auth?.user;
  const {} = useOptimizedFriends();
  const uniqueProviders = currentSeries.provider
    ? Array.from(
        new Set(currentSeries.provider.provider.map((p) => p.name))
      ).map((name) =>
        currentSeries.provider?.provider.find((p) => p.name === name)
      )
    : [];
  const rating = calculateOverallRating(currentSeries);

  // Einheitliche Episode-Datum Formatierung
  let dateString = '';
  let timeString = '';

  if (currentSeries.nextEpisode?.nextEpisode) {
    const { dateString: unifiedDate, timeString: unifiedTime } =
      getUnifiedEpisodeDateTime(currentSeries.nextEpisode.nextEpisode);
    dateString = unifiedDate;
    timeString = unifiedTime;
  }
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
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('');
  const [providerTooltipOpen, setProviderTooltipOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const hoverTimeoutRef = useState<NodeJS.Timeout | null>(null)[0];

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
      document.addEventListener('click', handleClickOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [providerTooltipOpen, isDesktop]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef) {
        clearTimeout(hoverTimeoutRef);
      }
    };
  }, [hoverTimeoutRef]);

  // React 19: Automatische Memoization - kein useCallback nötig
  const handleTitleClick = () => {
    window.dispatchEvent(
      new CustomEvent('openWatchedDialog', {
        detail: {
          series: currentSeries,
          isReadOnly: forceReadOnlyDialogs,
        },
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
  const handleDeleteSeries = async () => {
    const ref = firebase
      .database()
      .ref(`${user?.uid}/serien/${currentSeries.nmr}`);
    await ref.remove();

    setOpen(false);
  };

  const handleDeleteConfirmation = () => {
    setConfirmDialogMessage(
      `Möchten Sie die Serie "${
        currentSeries.title || currentSeries.original_name
      }" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
    );
    setConfirmDialogCallback(() => handleDeleteSeries);
    setConfirmDialogOpen(true);
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

        // Activity für Badge-System loggen (ersetzt Friend-Activity)
        const seriesWithUpdatedRating = {
          ...currentSeries,
          rating: Object.fromEntries(
            Object.entries(updatedRatings).map(([k, v]) => [k, Number(v)])
          ),
        };
        const overallRating = calculateOverallRating(seriesWithUpdatedRating);
        const ratingValue = parseFloat(overallRating);

        if (user?.uid && ratingValue > 0) {
          await logRatingAdded(
            user.uid,
            currentSeries.title ||
              currentSeries.original_name ||
              'Unbekannte Serie',
            'series',
            ratingValue,
            currentSeries.id || 0
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
  const handleCloseEpisodes = () => {
    setOpenEpisodes(false);
  };
  const shouldNumber = ![
    'Zuletzt Hinzugefügt',
    'Ohne Bewertung',
    'Neue Episoden',
  ].includes(genre);
  // TMDB Dialog State
  const [tmdbDialogOpen, setTmdbDialogOpen] = useState(false);
  const [tmdbData, setTmdbData] = useState<any>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchTMDBData = async (tmdbId: number) => {
    try {
      setTmdbLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=de-DE`;
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

  const handleAddSeries = async () => {
    if (!user || !tmdbData) return;

    try {
      setAdding(true);

      const seriesData = {
        user: import.meta.env.VITE_USER,
        id: tmdbData.id,
        uuid: user.uid,
      };

      const res = await fetch(`https://serienapi.konrad-dinges.de/add`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(seriesData),
      });

      if (res.ok) {
        // Activity-Logging für Friend + Badge-System
        const { logSeriesAdded } = await import(
          '../../../features/badges/minimalActivityLogger'
        );
        await logSeriesAdded(
          user.uid,
          tmdbData.name || tmdbData.title || 'Unbekannte Serie',
          tmdbData.id
        );

        setSnackbarMessage('Serie erfolgreich hinzugefügt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTmdbDialogOpen(false);
      } else {
        const msgJson = await res.json();
        if (msgJson.error === 'Serie bereits vorhanden') {
          setSnackbarMessage('Serie bereits vorhanden');
          setSnackbarSeverity('error');
        } else {
          throw new Error('Fehler beim Hinzufügen der Serie.');
        }
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Fehler beim Hinzufügen der Serie');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAdding(false);
    }
  };

  const handlePosterClick = () => {
    if (genre !== 'Neue Episoden') {
      if (currentSeries.id) {
        fetchTMDBData(currentSeries.id);
      }
    } else {
      setOpenEpisodes(true);
    }
  };
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  const handleRatingClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!disableRatingDialog) {
      handleClickOpen();
    }
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

      // Social Badges nutzen jetzt Friends statt Watchlist - kein Logging mehr nötig
      if (newWatchlistStatus) {
        // Watchlist-Logging entfernt - Social Badges nutzen jetzt Friends
      }
    } catch (error) {
      console.error('Error updating watchlist status:', error);
    }
  };

  return (
    <Suspense fallback={<div />}>
      <Card
        className='h-full transition-all duration-500 flex flex-col series-card group'
        sx={cardStyles}
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
              currentSeries.poster?.poster &&
              currentSeries.poster.poster.substring(
                currentSeries.poster.poster.length - 4
              ) !== 'null'
                ? currentSeries.poster.poster
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
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    p: 0.25,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition:
                      'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
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
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition:
                        'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                      '@media (min-width: 768px)': {
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
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
          {/* Watchlist Button */}
          {!forceReadOnlyDialogs && (
            <Box
              className='absolute bottom-2 left-2'
              onClick={handleWatchlistToggle}
              sx={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                p: 1,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition:
                  'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                '@media (min-width: 768px)': {
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)',
                  },
                },
              }}
            >
              <BookmarkIcon
                sx={{
                  color: currentSeries.watchlist ? '#22c55e' : '#9e9e9e',
                  fontSize: 24,
                }}
              />
            </Box>
          )}

          {typeof currentSeries.nextEpisode?.episode === 'number' &&
            currentSeries.nextEpisode?.nextEpisode &&
            new Date(currentSeries.nextEpisode.nextEpisode).getTime() >=
              new Date().setHours(0, 0, 0, 0) && (
              <Box
                className='absolute bottom-16 left-0 right-0'
                onClick={() => setOpenEpisodes(true)}
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
                  S{currentSeries.nextEpisode?.season}E
                  {currentSeries.nextEpisode?.episode} • {dateString} um{' '}
                  {timeString}
                </Typography>
              </Box>
            )}
          <Box
            className='absolute top-3 right-1'
            sx={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              px: 2,
              py: 1,
              transition:
                'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
              '@media (min-width: 768px)': {
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                },
              },
            }}
            aria-label='Bewertung anzeigen'
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.9rem',
                color: '#ffffff',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              <Star sx={{ fontSize: '1rem', color: '#fbbf24' }} />
              {rating}
            </Box>
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
                  label:
                    forceReadOnlyDialogs || isUserProfilePage
                      ? 'Gesehene Episoden ansehen'
                      : 'Gesehene Episoden bearbeiten',
                  icon: <CheckCircleIcon />,
                  onClick: handleTitleClick,
                },
                ...(typeof currentSeries.nextEpisode?.episode === 'number'
                  ? [
                      {
                        label: 'Kommende Episoden anzeigen',
                        icon: <PlaylistPlayIcon />,
                        onClick: () => setOpenEpisodes(true),
                      },
                    ]
                  : []),
                {
                  label: 'Serie löschen',
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
              'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 100%) !important',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Tooltip title={currentSeries.title} arrow>
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
              {shouldNumber && `${index}. `}
              {currentSeries.title}
            </Typography>
          </Tooltip>
          {/* Genre-Anzeige Beispiel */}
          {/* <span>{genreDisplayNames[genre] ?? genre}</span> */}
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
        isReadOnly={false}
      />
      <WatchedEpisodesDialog
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
          <Warning sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
          Bestätigung
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

      {/* TMDB Dialog */}
      <TmdbDialog
        open={tmdbDialogOpen}
        loading={tmdbLoading}
        data={tmdbData}
        type='tv'
        viewOnlyMode={forceReadOnlyDialogs}
        onAdd={handleAddSeries}
        adding={adding}
        onClose={() => {
          setTmdbDialogOpen(false);
          setTmdbData(null);
          setAdding(false);
        }}
      />
    </Suspense>
  );
};
export default SeriesCard;
