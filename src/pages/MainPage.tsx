import {
  CalendarToday,
  ExpandLess,
  ExpandMore,
  Movie,
  People,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Container,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import NewSeasonNotificationDialog from '../components/domain/dialogs/NewSeasonNotificationDialog';
import { ProfileDialog } from '../components/domain/dialogs/ProfileDialog';
import MovieGrid from '../components/domain/movies/MovieGrid';
import SeriesGrid from '../components/domain/series/SeriesGrid';
import MovieSearchFilters from '../components/forms/MovieSearchFilters';
import SearchFilters from '../components/forms/SearchFilters';
import { WelcomeTour } from '../components/tour/WelcomeTour';
import Legend from '../components/ui/Legend';
import { QuickFilterChips } from '../components/ui/QuickFilterChips';
import { ScrollArrows } from '../components/ui/ScrollArrows';
import { useMovieList } from '../contexts/MovieListProvider';
import { useNotifications } from '../contexts/NotificationProvider';
import { useOptimizedFriends } from '../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import BadgeButton from '../features/badges/BadgeButton';
import { calculateCorrectAverageRating } from '../lib/rating/rating';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`main-page-tabpanel-${index}`}
      aria-labelledby={`main-page-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const MainPage: React.FC = () => {
  const { user } = useAuth()!;
  const navigate = useNavigate();
  const {
    seriesList,
    seriesWithNewSeasons,
    clearNewSeasons,
    isOffline,
    isStale,
  } = useSeriesList();

  const { movieList } = useMovieList();
  const { totalUnreadActivities } = useNotifications();
  const { friendRequests } = useOptimizedFriends();
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [selectedSpecialFilter, setSelectedSpecialFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [, setShowTourComplete] = useState(false);
  const [shouldRestartTour, setShouldRestartTour] = useState(false);
  const [mobileStatsExpanded, setMobileStatsExpanded] = useState(false);

  // Separate states für Filme
  const [movieSearchValue, setMovieSearchValue] = useState('');
  const [movieSelectedGenre, setMovieSelectedGenre] = useState('All');
  const [movieSelectedProvider, setMovieSelectedProvider] = useState('All');
  const [movieSelectedSpecialFilter, setMovieSelectedSpecialFilter] =
    useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleGenreChange = useCallback((value: string) => {
    setSelectedGenre(value);
  }, []);

  const handleProviderChange = useCallback((value: string) => {
    setSelectedProvider(value);
  }, []);

  const handleSpecialFilterChange = useCallback((value: string) => {
    setSelectedSpecialFilter(value);
  }, []);

  // Handler für Filme-Filter
  const handleMovieSearchChange = useCallback((value: string) => {
    setMovieSearchValue(value);
  }, []);

  const handleMovieGenreChange = useCallback((value: string) => {
    setMovieSelectedGenre(value);
  }, []);

  const handleMovieProviderChange = useCallback((value: string) => {
    setMovieSelectedProvider(value);
  }, []);

  const handleMovieSpecialFilterChange = useCallback((value: string) => {
    setMovieSelectedSpecialFilter(value);
  }, []);

  const handleTourComplete = () => {
    setShowTourComplete(true);
    setShouldRestartTour(false);
  };

  const handleRestartTour = () => {
    setShouldRestartTour(true);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Separierte Statistiken für Serien und Filme
  const seriesStats = React.useMemo(() => {
    const totalWatchedEpisodes = seriesList.reduce((total, series) => {
      if (series.seasons) {
        return (
          total +
          series.seasons.reduce((seasonTotal: number, season: any) => {
            return (
              seasonTotal +
              (season.episodes || []).reduce(
                (episodeTotal: number, ep: any) => {
                  if (ep.watched) {
                    return episodeTotal + (ep.watchCount || 1);
                  }
                  return episodeTotal;
                },
                0
              )
            );
          }, 0)
        );
      }
      return total;
    }, 0);

    const totalWatchtime = seriesList.reduce((total, series) => {
      if (series.seasons && series.episodeRuntime) {
        const watchedEpisodeTime = series.seasons.reduce(
          (seasonTotal: number, season: any) => {
            return (
              seasonTotal +
              (season.episodes || []).reduce((episodeTime: number, ep: any) => {
                if (ep.watched) {
                  return (
                    episodeTime + (ep.watchCount || 1) * series.episodeRuntime
                  );
                }
                return episodeTime;
              }, 0)
            );
          },
          0
        );
        return total + watchedEpisodeTime;
      }
      return total;
    }, 0);

    const ratedSeries = seriesList.filter((series) => {
      const rating = calculateCorrectAverageRating([series]);
      return rating > 0;
    });

    const averageRating = calculateCorrectAverageRating(seriesList);

    // Lieblings-Genre berechnen
    const genreCounts = seriesList.reduce((acc, series) => {
      if (series.genre?.genres) {
        series.genre.genres.forEach((genre: string) => {
          if (genre !== 'All') {
            acc[genre] = (acc[genre] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const favoriteGenre =
      Object.entries(genreCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || 'Keine';

    // Lieblings-Provider ermitteln
    const providerCounts: { [key: string]: number } = {};
    seriesList.forEach((series) => {
      if (series.provider?.provider) {
        series.provider.provider.forEach((prov) => {
          providerCounts[prov.name] = (providerCounts[prov.name] || 0) + 1;
        });
      }
    });
    const favoriteProvider =
      Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'Keine';

    return {
      count: seriesList.length,
      totalWatchedEpisodes,
      totalWatchtime: Math.round(totalWatchtime),
      ratedCount: ratedSeries.length,
      averageRating,
      favoriteGenre,
      favoriteProvider,
    };
  }, [seriesList]);

  const movieStats = React.useMemo(() => {
    const ratedMovies = movieList.filter((movie) => {
      const rating = calculateCorrectAverageRating([movie]);
      return rating > 0;
    });

    const averageRating = calculateCorrectAverageRating(movieList);

    // Lieblings-Genre berechnen
    const genreCounts = movieList.reduce((acc, movie) => {
      if (movie.genre?.genres) {
        movie.genre.genres.forEach((genre: string) => {
          if (genre !== 'All') {
            acc[genre] = (acc[genre] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const favoriteGenre =
      Object.entries(genreCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || 'Keine';

    // Unveröffentlichte Filme zählen
    const unreleasedCount = movieList.filter(
      (movie) => movie.status !== 'Released'
    ).length;

    // Lieblings-Provider ermitteln
    const movieProviderCounts: { [key: string]: number } = {};
    movieList.forEach((movie) => {
      if (movie.provider?.provider) {
        movie.provider.provider.forEach((prov) => {
          movieProviderCounts[prov.name] =
            (movieProviderCounts[prov.name] || 0) + 1;
        });
      }
    });
    const favoriteMovieProvider =
      Object.entries(movieProviderCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'Keine';

    // Gesehene Filme (mit Bewertung)
    const watchedCount = ratedMovies.length;

    return {
      count: movieList.length,
      ratedCount: ratedMovies.length,
      averageRating,
      favoriteGenre,
      unreleasedCount,
      watchedCount,
      favoriteProvider: favoriteMovieProvider,
    };
  }, [movieList]);

  // Kombinierte Stats für das Grid
  const combinedStats = React.useMemo(() => {
    const allContent = [...seriesList, ...movieList];
    const averageRating = calculateCorrectAverageRating(allContent);

    return {
      seriesCount: seriesList.length,
      moviesCount: movieList.length,
      averageRating,
      totalWatchedEpisodes: seriesStats.totalWatchedEpisodes,
    };
  }, [seriesList, movieList, seriesStats.totalWatchedEpisodes]);

  const userProfile = React.useMemo(() => {
    if (!user) return undefined;
    return {
      username: user.displayName || user.email?.split('@')[0] || 'User',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isOnline: true,
    };
  }, [user, user?.photoURL]); // Explizit user.photoURL als Dependency hinzufügen

  return (
    <Container maxWidth={false} disableGutters sx={{ p: 0 }}>
      {(isOffline || isStale) && (
        <Box
          sx={{
            backgroundColor: isOffline ? '#ff6b6b' : '#4ecdc4',
            color: 'white',
            padding: 1,
            borderRadius: 1,
            marginBottom: 2,
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          {isOffline
            ? '📱 OFFLINE MODUS - Zeige gecachte Daten'
            : '📦 CACHE MODUS - Daten aus Cache geladen'}{' '}
          ({seriesList.length + movieList.length} Serien und Filme verfügbar)
        </Box>
      )}

      {/* 🚀 Hauptinhalt */}
      <>
        {/* Header */}

        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
            p: { xs: 1, sm: 1.5, md: 3 },
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0 0 8px 8px',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 1, md: 0 },
            minHeight: { xs: 'auto', sm: 'auto', md: '120px' },
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <Box
            display='flex'
            alignItems='center'
            gap={{ xs: 1.5, sm: 2, md: 3 }}
            sx={{
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'center', md: 'flex-start' },
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Avatar
              src={userProfile?.photoURL}
              onClick={() => setProfileDialogOpen(true)}
              className='main-header-avatar'
              sx={{
                width: { xs: 50, sm: 50, md: 80 },
                height: { xs: 50, sm: 50, md: 80 },
                cursor: 'pointer',
                border: { xs: '2px solid #00fed7', md: '3px solid #00fed7' },
                boxShadow: '0 0 10px rgba(0, 254, 215, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 20px rgba(0, 254, 215, 0.5)',
                  borderColor: '#00c5a3',
                },
              }}
            >
              {userProfile?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left', md: 'left' } }}>
              <Typography
                variant='h4'
                component='h1'
                gutterBottom
                fontWeight='bold'
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '2.125rem' },
                  mb: { xs: 0.25, sm: 0.5, md: 1 },
                  lineHeight: { xs: 1.2, md: 1.2 },
                }}
              >
                Meine Serien & Filme
              </Typography>
              {/* Username und Display Name entfernt - redundant auf eigener Seite */}
              <Typography
                variant='body2'
                sx={{
                  opacity: 0.8,
                  mt: { xs: 0.5, md: 1 },
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Entdecke, bewerte und verwalte deine Lieblingsserien und -filme
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  opacity: 0.6,
                  mt: { xs: 0.25, md: 0.5 },
                  fontSize: { xs: '0.6rem', sm: '0.625rem', md: '0.75rem' },
                  fontStyle: 'italic',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                💡 Klicke auf dein Profilbild für Einstellungen
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, md: 2 },
              flexShrink: 0,
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'center', md: 'flex-end' },
              px: { xs: 1, md: 0 },
            }}
          >
            <div data-tour='badge-button'>
              <BadgeButton />
            </div>

            <Badge
              badgeContent={totalUnreadActivities + friendRequests.length}
              color='error'
              invisible={totalUnreadActivities + friendRequests.length === 0}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#ff4444',
                  color: 'white',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  height: '20px',
                  fontSize: '0.75rem',
                  right: { xs: 6, md: 8 },
                  top: { xs: 6, md: 8 },
                },
              }}
            >
              <Button
                variant='contained'
                onClick={() => navigate('/friends')}
                startIcon={<People />}
                className='main-header-button'
                sx={{
                  background: 'linear-gradient(45deg, #00fed7, #00c5a3)',
                  color: '#000',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 254, 215, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00c5a3, #00fed7)',
                    boxShadow: '0 6px 16px rgba(0, 254, 215, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  padding: { xs: '6px 12px', md: '10px 20px' },
                  transition: 'all 0.3s ease',
                  minWidth: 'auto',
                }}
              >
                Freunde
              </Button>
            </Badge>
          </Box>
        </Box>

        {/* Mobile Stats Toggle Button */}
        <Box
          sx={{ display: { xs: 'block', sm: 'none' }, mt: 2, px: 2, mb: 2 }}
        >
          <Button
            onClick={() => setMobileStatsExpanded(!mobileStatsExpanded)}
            variant='outlined'
            fullWidth
            startIcon={<TrendingUp />}
            endIcon={mobileStatsExpanded ? <ExpandLess /> : <ExpandMore />}
            data-tour='mobile-stats-button'
            sx={{
              justifyContent: 'space-between',
              height: '48px',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(0, 254, 215, 0.5)',
              },
            }}
          >
            Statistiken anzeigen
          </Button>
        </Box>

        {/* Desktop Stats - always visible */}
        <Box
          data-tour='stats-grid'
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: {
              sm: 'repeat(6, 1fr)',
            },
            gap: { sm: 2, md: 3 },
            px: { sm: 0.5, md: 0 },
            mb: { sm: 2, md: 3 },
          }}
        >
          {tabValue === 0 ? (
            // Serien Stats
            <>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='primary'
                    gutterBottom
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {seriesStats.count}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Serien
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    gap={1}
                  >
                    <TrendingUp
                      sx={{
                        color: '#66bb6a',
                        fontSize: { sm: '1.25rem', md: '1.5rem' },
                      }}
                    />
                    <Typography
                      variant='h4'
                      gutterBottom
                      sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                    >
                      {seriesStats.totalWatchedEpisodes}
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Episoden
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    gap={1}
                  >
                    <Star
                      sx={{
                        color: '#ffa726',
                        fontSize: { sm: '1.25rem', md: '1.5rem' },
                      }}
                    />
                    <Typography
                      variant='h4'
                      gutterBottom
                      sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                    >
                      {seriesStats.averageRating > 0
                        ? seriesStats.averageRating.toFixed(2)
                        : '0.00'}
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Ø Rating
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='secondary'
                    gutterBottom
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {(() => {
                      const totalHours = Math.floor(
                        seriesStats.totalWatchtime / 60
                      );
                      const days = Math.floor(totalHours / 24);
                      if (days >= 365) {
                        const years = Math.floor(days / 365);
                        const remainingDaysAfterYears = days % 365;
                        if (remainingDaysAfterYears >= 30) {
                          const months = Math.floor(
                            remainingDaysAfterYears / 30
                          );
                          return `${years}J ${months}M`;
                        } else if (remainingDaysAfterYears >= 7) {
                          const weeks = Math.floor(remainingDaysAfterYears / 7);
                          return `${years}J ${weeks}W`;
                        } else {
                          return `${years}J ${remainingDaysAfterYears}T`;
                        }
                      } else if (days >= 30) {
                        const months = Math.floor(days / 30);
                        const remainingDays = days % 30;
                        if (remainingDays >= 7) {
                          const weeks = Math.floor(remainingDays / 7);
                          return `${months}M ${weeks}W`;
                        } else {
                          return `${months}M ${remainingDays}T`;
                        }
                      } else if (days >= 7) {
                        const weeks = Math.floor(days / 7);
                        const remainingDays = days % 7;
                        return remainingDays > 0
                          ? `${weeks}W ${remainingDays}T`
                          : `${weeks}W`;
                      } else if (days > 0) {
                        return `${days}T`;
                      } else {
                        return `${totalHours}h`;
                      }
                    })()}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Watchzeit
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='info.main'
                    gutterBottom
                    sx={{
                      fontSize: { sm: '1.75rem', md: '2.125rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {seriesStats.favoriteGenre}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Top Genre
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='warning.main'
                    gutterBottom
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {seriesStats.favoriteProvider}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Top Provider
                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            // Film Stats
            <>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='secondary'
                    gutterBottom
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {movieStats.count}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Filme
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    gap={1}
                  >
                    <TrendingUp
                      sx={{
                        color: '#66bb6a',
                        fontSize: { sm: '1.25rem', md: '1.5rem' },
                      }}
                    />
                    <Typography
                      variant='h4'
                      gutterBottom
                      sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                    >
                      {movieStats.watchedCount}
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Gesehen
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    gap={1}
                  >
                    <Star
                      sx={{
                        color: '#ffa726',
                        fontSize: { sm: '1.25rem', md: '1.5rem' },
                      }}
                    />
                    <Typography
                      variant='h4'
                      gutterBottom
                      sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                    >
                      {movieStats.averageRating > 0
                        ? movieStats.averageRating.toFixed(2)
                        : '0.00'}
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Ø Rating
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='primary'
                    gutterBottom
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {movieStats.unreleasedCount}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Unveröffentlicht
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='info.main'
                    gutterBottom
                    sx={{
                      fontSize: { sm: '1.75rem', md: '2.125rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {movieStats.favoriteGenre}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Top Genre
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                  <Typography
                    variant='h4'
                    color='warning.main'
                    gutterBottom
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {movieStats.favoriteProvider}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                  >
                    Top Provider
                  </Typography>
                </CardContent>
              </Card>
            </>
          )}
        </Box>

        {/* Mobile Collapsible Stats */}
        <Box
          className='max-w-[1400px] m-auto'
          sx={{ display: { xs: 'block', sm: 'none' }, px: 2 }}
        >
          <Collapse in={mobileStatsExpanded}>
            <Box
              data-tour='stats-grid'
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1.5,
                mb: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                p: 2,
              }}
            >
              {tabValue === 0 ? (
                // Mobile Serien Stats
                <>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        color='primary'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {seriesStats.count}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Serien
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {seriesStats.totalWatchedEpisodes}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Episoden
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        color='secondary'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {seriesStats.averageRating > 0
                          ? seriesStats.averageRating.toFixed(2)
                          : '0.00'}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Ø Rating
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        color='info.main'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {(() => {
                          const totalHours = Math.floor(
                            seriesStats.totalWatchtime / 60
                          );
                          const days = Math.floor(totalHours / 24);
                          if (days >= 365) {
                            const years = Math.floor(days / 365);
                            const remainingDaysAfterYears = days % 365;
                            if (remainingDaysAfterYears >= 30) {
                              const months = Math.floor(
                                remainingDaysAfterYears / 30
                              );
                              return `${years}J ${months}M`;
                            } else if (remainingDaysAfterYears >= 7) {
                              const weeks = Math.floor(
                                remainingDaysAfterYears / 7
                              );
                              return `${years}J ${weeks}W`;
                            } else {
                              return `${years}J ${remainingDaysAfterYears}T`;
                            }
                          } else if (days >= 30) {
                            const months = Math.floor(days / 30);
                            const remainingDays = days % 30;
                            if (remainingDays >= 7) {
                              const weeks = Math.floor(remainingDays / 7);
                              return `${months}M ${weeks}W`;
                            } else {
                              return `${months}M ${remainingDays}T`;
                            }
                          } else if (days >= 7) {
                            const weeks = Math.floor(days / 7);
                            const remainingDays = days % 7;
                            return remainingDays > 0
                              ? `${weeks}W ${remainingDays}T`
                              : `${weeks}W`;
                          } else if (days > 0) {
                            return `${days}T`;
                          } else {
                            return `${totalHours}h`;
                          }
                        })()}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Watchzeit
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h6'
                        color='warning.main'
                        gutterBottom
                        sx={{
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {seriesStats.favoriteGenre}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Top Genre
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h6'
                        color='success.main'
                        gutterBottom
                        sx={{
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {seriesStats.favoriteProvider}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Top Provider
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              ) : (
                // Mobile Film Stats
                <>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        color='secondary'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {movieStats.count}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Filme
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {movieStats.watchedCount}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Gesehen
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        color='primary'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {movieStats.averageRating > 0
                          ? movieStats.averageRating.toFixed(2)
                          : '0.00'}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Ø Rating
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h5'
                        color='error.main'
                        gutterBottom
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {movieStats.unreleasedCount}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Unveröffentlicht
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h6'
                        color='info.main'
                        gutterBottom
                        sx={{
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {movieStats.favoriteGenre}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Top Genre
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography
                        variant='h6'
                        color='warning.main'
                        gutterBottom
                        sx={{
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {movieStats.favoriteProvider}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Top Provider
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </Box>
          </Collapse>
        </Box>

        {/* Trennlinie über den Filtern */}
        <Box
          sx={{
            height: '1px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            mx: { xs: 3, md: 5 },
            mt: { xs: 0, md: 4 },
            mb: { xs: 0, md: 2 },
            display: { xs: 'none', md: 'block' },
          }}
        />

        {/* Filter oberhalb der Tabs */}
        <Box sx={{ mb: { xs: 2, md: 3 }, px: { xs: 2, md: 0 }, mt: { xs: 0, md: 0 } }} data-tour='search-filters'>
          {tabValue === 0 ? (
            <SearchFilters
              onSearchChange={handleSearchChange}
              onGenreChange={handleGenreChange}
              onProviderChange={handleProviderChange}
              onSpecialFilterChange={handleSpecialFilterChange}
            />
          ) : (
            <MovieSearchFilters
              onSearchChange={handleMovieSearchChange}
              onGenreChange={handleMovieGenreChange}
              onProviderChange={handleMovieProviderChange}
            />
          )}
        </Box>

        {/* Trennlinie unter den Filtern */}
        <Box
          sx={{
            height: '1px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            mx: { xs: 3, md: 5 },
            mt: { xs: 0, md: 0 },
            mb: { xs: 2, md: 2 },
            display: { xs: 'none', md: 'block' },
          }}
        />

        {/* Tabs für Serien und Filme */}
        <Card sx={{ mt: { xs: 2, md: 0 } }}>
          <Tabs
            data-tour='tabs'
            value={tabValue}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minHeight: { xs: 48, md: 72 },
                padding: { xs: '6px 8px', md: '12px 16px' },
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'inherit',
                },
              },
              '& .MuiTouchRipple-root': {
                display: 'none',
              },
            }}
          >
            <Tab
              label={`Serien (${combinedStats.seriesCount})`}
              icon={
                <CalendarToday
                  sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                />
              }
              iconPosition='start'
              disableRipple
            />
            <Tab
              label={`Filme (${combinedStats.moviesCount})`}
              icon={<Movie sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />}
              iconPosition='start'
              disableRipple
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: { xs: 1, md: 2 } }}>
              <Box sx={{ mb: { xs: 2, md: 3 } }} data-tour='legend'>
                <Legend />
              </Box>
              <Box
                sx={{ mb: { xs: 1, md: 2 } }}
                className='quickfilter-container'
              >
                <QuickFilterChips
                  activeFilter={selectedSpecialFilter}
                  onFilterChange={handleSpecialFilterChange}
                  isMovieMode={false}
                />
              </Box>
              <Box>
                <div data-tour='series-grid'>
                  <SeriesGrid
                    searchValue={searchValue}
                    selectedGenre={selectedGenre}
                    selectedProvider={selectedProvider}
                    selectedSpecialFilter={selectedSpecialFilter}
                  />
                </div>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: { xs: 1, md: 2 } }}>
              <Box
                sx={{ mb: { xs: 1, md: 2 } }}
                className='quickfilter-container'
              >
                <QuickFilterChips
                  activeFilter={movieSelectedSpecialFilter}
                  onFilterChange={handleMovieSpecialFilterChange}
                  isMovieMode={true}
                />
              </Box>
              <MovieGrid
                searchValue={movieSearchValue}
                selectedGenre={movieSelectedGenre}
                selectedProvider={movieSelectedProvider}
                selectedSpecialFilter={movieSelectedSpecialFilter}
              />
            </Box>
          </TabPanel>
        </Card>

        {/* Profile Dialog */}
        <ProfileDialog
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
          onRestartTour={handleRestartTour}
        />

        {/* New Season Notification Dialog */}
        <NewSeasonNotificationDialog
          open={seriesWithNewSeasons.length > 0}
          onClose={clearNewSeasons}
          seriesWithNewSeasons={seriesWithNewSeasons}
        />

        {/* Welcome Tour */}
        <WelcomeTour
          onTourComplete={handleTourComplete}
          shouldRestart={shouldRestartTour}
        />

        {/* Scroll Arrows */}
        <ScrollArrows />
      </>
    </Container>
  );
};

export default MainPage;
