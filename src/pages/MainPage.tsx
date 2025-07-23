import {
  CalendarToday,
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
  Container,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Legend from '../components/common/Legend';
import { ProfileDialog } from '../components/dialogs/ProfileDialog';
import MovieSearchFilters from '../components/filters/MovieSearchFilters';
import SearchFilters from '../components/filters/SearchFilters';
import MovieGrid from '../components/movies/MovieGrid';
import SeriesGrid from '../components/series/SeriesGrid';
import { useFriends } from '../contexts/FriendsProvider';
import { useMovieList } from '../contexts/MovieListProvider';
import { useNotifications } from '../contexts/NotificationProvider';
import { useSeriesList } from '../contexts/SeriesListProvider';
import { calculateCorrectAverageRating } from '../utils/rating';

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
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { totalUnreadActivities } = useNotifications();
  const { friendRequests } = useFriends();
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [tabValue, setTabValue] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Separate states für Filme
  const [movieSearchValue, setMovieSearchValue] = useState('');
  const [movieSelectedGenre, setMovieSelectedGenre] = useState('All');
  const [movieSelectedProvider, setMovieSelectedProvider] = useState('All');

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleGenreChange = useCallback((value: string) => {
    setSelectedGenre(value);
  }, []);

  const handleProviderChange = useCallback((value: string) => {
    setSelectedProvider(value);
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
              (season.episodes || []).filter((ep: any) => ep.watched).length
            );
          }, 0)
        );
      }
      return total;
    }, 0);

    const totalWatchtime = seriesList.reduce((total, series) => {
      if (series.seasons && series.episodeRuntime) {
        const watchedEpisodes = series.seasons.reduce(
          (seasonTotal: number, season: any) => {
            return (
              seasonTotal +
              (season.episodes || []).filter((ep: any) => ep.watched).length
            );
          },
          0
        );
        return total + watchedEpisodes * series.episodeRuntime;
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
    ratedSeries.forEach((series) => {
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
    ratedMovies.forEach((movie) => {
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
  }, [user]);

  return (
    <Container
      maxWidth={false}
      sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 4 } }}
    >
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={4}
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
          borderRadius: 2,
          p: { xs: 1.5, sm: 2, md: 3 },
          color: 'white',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 1.5, md: 0 },
          minHeight: { xs: 'auto', md: '120px' },
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
            sx={{
              width: { xs: 50, sm: 60, md: 80 },
              height: { xs: 50, sm: 60, md: 80 },
              cursor: 'pointer',
              border: '3px solid #00fed7',
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
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
                mb: { xs: 0.5, md: 1 },
              }}
            >
              📺 Meine Serien & Filme
            </Typography>
            {/* Username und Display Name entfernt - redundant auf eigener Seite */}
            <Typography
              variant='body2'
              sx={{
                opacity: 0.8,
                mt: 1,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              }}
            >
              Entdecke, bewerte und verwalte deine Lieblingsserien und -filme
            </Typography>
            <Typography
              variant='caption'
              sx={{
                opacity: 0.6,
                mt: 0.5,
                fontSize: { xs: '0.625rem', md: '0.75rem' },
                fontStyle: 'italic',
              }}
            >
              💡 Klicke auf dein Profilbild für Einstellungen
            </Typography>
          </Box>
        </Box>

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
            },
          }}
        >
          <Button
            variant='contained'
            onClick={() => navigate('/friends')}
            startIcon={<People />}
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
              padding: { xs: '8px 16px', md: '10px 20px' },
              transition: 'all 0.3s ease',
            }}
          >
            Freunde
          </Button>
        </Badge>
      </Box>

      {/* Statistiken - je nach Tab unterschiedlich */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(6, 1fr)',
          },
          gap: { xs: 2, md: 3 },

          px: { xs: 0.5, md: 0 },
        }}
      >
        {tabValue === 0 ? (
          // Serien-spezifische Stats
          <>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='primary'
                  gutterBottom
                  sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                >
                  {seriesStats.count}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Serien
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  gap={1}
                >
                  <TrendingUp
                    sx={{
                      color: '#66bb6a',
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  />
                  <Typography
                    variant='h4'
                    gutterBottom
                    sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                  >
                    {seriesStats.totalWatchedEpisodes}
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Episoden gesehen
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  gap={1}
                >
                  <Star
                    sx={{
                      color: '#ffa726',
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  />
                  <Typography
                    variant='h4'
                    gutterBottom
                    sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                  >
                    {seriesStats.averageRating > 0
                      ? seriesStats.averageRating.toFixed(2)
                      : '0.00'}
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Ø Bewertung
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Tooltip
                  title={(() => {
                    const totalMinutes = seriesStats.totalWatchtime;
                    const totalHours = Math.floor(totalMinutes / 60);
                    const days = Math.floor(totalHours / 24);
                    const years = Math.floor(days / 365);
                    const months = Math.floor((days % 365) / 30);
                    const weeks = Math.floor(((days % 365) % 30) / 7);
                    const remainingDays = ((days % 365) % 30) % 7;
                    const remainingHours = totalHours % 24;
                    const remainingMinutes = totalMinutes % 60;

                    const parts = [];
                    if (years > 0)
                      parts.push(`${years} Jahr${years !== 1 ? 'e' : ''}`);
                    if (months > 0)
                      parts.push(`${months} Monat${months !== 1 ? 'e' : ''}`);
                    if (weeks > 0)
                      parts.push(`${weeks} Woche${weeks !== 1 ? 'n' : ''}`);
                    if (remainingDays > 0)
                      parts.push(
                        `${remainingDays} Tag${remainingDays !== 1 ? 'e' : ''}`
                      );
                    if (remainingHours > 0)
                      parts.push(
                        `${remainingHours} Stunde${
                          remainingHours !== 1 ? 'n' : ''
                        }`
                      );
                    if (remainingMinutes > 0)
                      parts.push(
                        `${remainingMinutes} Minute${
                          remainingMinutes !== 1 ? 'n' : ''
                        }`
                      );

                    return parts.length > 0 ? parts.join(', ') : '0 Minuten';
                  })()}
                  arrow
                  placement='top'
                >
                  <Typography
                    variant='h4'
                    color='secondary'
                    gutterBottom
                    sx={{
                      fontSize: { xs: '1.75rem', md: '2.125rem' },
                      cursor: 'help',
                    }}
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
                          const finalDays = remainingDaysAfterYears % 30;
                          return finalDays > 0
                            ? `${years}J ${months}M`
                            : `${years}J ${months}M`;
                        } else if (remainingDaysAfterYears >= 7) {
                          const weeks = Math.floor(remainingDaysAfterYears / 7);
                          const finalDays = remainingDaysAfterYears % 7;
                          return finalDays > 0
                            ? `${years}J ${weeks}W`
                            : `${years}J ${weeks}W`;
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
                </Tooltip>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Watchzeit
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='info.main'
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', md: '1.25rem' },
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
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Top Genre
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='warning.main'
                  gutterBottom
                  sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                >
                  {seriesStats.favoriteProvider}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Top Provider
                </Typography>
              </CardContent>
            </Card>
          </>
        ) : (
          // Film-spezifische Stats
          <>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='secondary'
                  gutterBottom
                  sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                >
                  {movieStats.count}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Filme
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  gap={1}
                >
                  <TrendingUp
                    sx={{
                      color: '#66bb6a',
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  />
                  <Typography
                    variant='h4'
                    gutterBottom
                    sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                  >
                    {movieStats.watchedCount}
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Gesehen
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  gap={1}
                >
                  <Star
                    sx={{
                      color: '#ffa726',
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  />
                  <Typography
                    variant='h4'
                    gutterBottom
                    sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                  >
                    {movieStats.averageRating > 0
                      ? movieStats.averageRating.toFixed(2)
                      : '0.00'}
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Ø Bewertung
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='primary'
                  gutterBottom
                  sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                >
                  {movieStats.unreleasedCount}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Unreleased
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='info.main'
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', md: '1.25rem' },
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
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Top Genre
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='warning.main'
                  gutterBottom
                  sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                >
                  {movieStats.favoriteProvider}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Provider
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* Tabs für Serien und Filme */}
      <Card>
        <Tabs
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
            },
          }}
        >
          <Tab
            label={`Serien (${combinedStats.seriesCount})`}
            icon={
              <CalendarToday sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
            }
            iconPosition='start'
          />
          <Tab
            label={`Filme (${combinedStats.moviesCount})`}
            icon={<Movie sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />}
            iconPosition='start'
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <Box sx={{ mb: { xs: 2, md: 3 } }}>
              <SearchFilters
                onSearchChange={handleSearchChange}
                onGenreChange={handleGenreChange}
                onProviderChange={handleProviderChange}
              />
            </Box>
            <Box sx={{ mb: { xs: 2, md: 3 } }}>
              <Legend />
            </Box>
            <SeriesGrid
              searchValue={searchValue}
              selectedGenre={selectedGenre}
              selectedProvider={selectedProvider}
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <Box sx={{ mb: { xs: 2, md: 3 } }}>
              <MovieSearchFilters
                onSearchChange={handleMovieSearchChange}
                onGenreChange={handleMovieGenreChange}
                onProviderChange={handleMovieProviderChange}
              />
            </Box>
            <MovieGrid
              searchValue={movieSearchValue}
              selectedGenre={movieSelectedGenre}
              selectedProvider={movieSelectedProvider}
            />
          </Box>
        </TabPanel>
      </Card>

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </Container>
  );
};

export default MainPage;
