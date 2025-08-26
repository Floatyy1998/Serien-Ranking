import {
  ArrowBack,
  CalendarToday,
  ExpandLess,
  ExpandMore,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  Dialog,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import MovieGrid from '../components/domain/movies/MovieGrid';
import SeriesGrid from '../components/domain/series/SeriesGrid';
import { QuickFilterChips } from '../components/ui/QuickFilterChips';
import { ScrollArrows } from '../components/ui/ScrollArrows';
import { calculateCorrectAverageRating } from '../lib/rating/rating';
import { colors } from '../theme';

interface UserProfileData {
  profile: {
    username: string;
    displayName?: string;
    photoURL?: string;
    isOnline: boolean;
    lastActive?: number;
    isPublic?: boolean;
  };
  isFriend: boolean;
  stats: {
    seriesCount: number;
    moviesCount: number;
    averageRating: number;
    totalWatchedEpisodes: number;
  };
  seriesStats: {
    count: number;
    totalWatchedEpisodes: number;
    totalWatchtime: number;
    averageRating: number;
    favoriteGenre: string;
    favoriteProvider: string;
  };
  movieStats: {
    count: number;
    watchedCount: number;
    averageRating: number;
    favoriteGenre: string;
    unreleasedCount: number;
    favoriteProvider: string;
  };
}

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
      id={`user-profile-tabpanel-${index}`}
      aria-labelledby={`user-profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const PublicListPage: React.FC = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuth()!;
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [mobileStatsExpanded, setMobileStatsExpanded] = useState(false);
  const [selectedSpecialFilter, setSelectedSpecialFilter] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  // Zugriff verweigern, wenn man selbst eingeloggt ist (eigene UID)
  if (user && friendId === user.uid) {
    return (
      <Container
        maxWidth={false}
        sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 4 } }}
      >
        <Card
          sx={{
            background: `var(--theme-primary)`,
            color: 'var(--theme-primary)',
            fontWeight: 'bold',
            borderRadius: 2,
            boxShadow: `0 4px 12px ${colors.overlay.medium}`,
            '&:hover': {
              background: 'var(--theme-accent)',
              boxShadow: `0 6px 16px ${colors.overlay.medium}`,
              transform: 'translateY(-2px)',
            },
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            padding: { xs: '8px 16px', md: '10px 20px' },
            transition: 'all 0.3s ease',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 7 }}>
            <Avatar
              sx={{
                bgcolor: colors.text.secondary,
                color: 'var(--theme-accent)',
                width: 70,
                height: 70,
                mx: 'auto',
                mb: 2,
                boxShadow: `0 2px 12px ${colors.overlay.dark}`,
              }}
            >
              <Star sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant='h5' fontWeight='bold' gutterBottom>
              Eigene öffentliche Seite
            </Typography>
            <Typography variant='body1' sx={{ mb: 3, opacity: 0.9 }}>
              Du kannst deine eigene öffentliche Seite nicht aufrufen.
            </Typography>
            <Button
              variant='contained'
              onClick={() => navigate('/')}
              startIcon={<ArrowBack />}
              sx={{
                background: `var(--theme-primary)`,
                color: colors.background.default,
                fontWeight: 'bold',
                borderRadius: 2,
                boxShadow: `0 4px 12px ${colors.overlay.medium}`,
                '&:hover': {
                  background: 'var(--theme-accent)',
                  boxShadow: `0 6px 16px ${colors.overlay.medium}`,
                  transform: 'translateY(-2px)',
                },
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                padding: { xs: '8px 16px', md: '10px 20px' },
                transition: 'all 0.3s ease',
              }}
            >
              Zurück zur Startseite
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Profildaten zurücksetzen wenn friendId sich ändert
  useEffect(() => {
    setProfileData(null);
    setLoading(true);
    setError('');
  }, [friendId]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!friendId) return;

      try {
        setLoading(true);

        // Benutzer-Profil laden - initial
        const userRef = firebase.database().ref(`users/${friendId}`);
        const userSnapshot = await userRef.once('value');

        if (!userSnapshot.exists()) {
          setError('Benutzer nicht gefunden');
          return;
        }

        const userProfile = userSnapshot.val();

        // Seite nur anzeigen, wenn Profil public ist
        if (!userProfile.isPublic) {
          setError('Diese Liste ist nicht öffentlich.');
          setProfileData(null);
          return;
        }

        // Statistiken laden
        const seriesRef = firebase.database().ref(`${friendId}/serien`);
        const moviesRef = firebase.database().ref(`${friendId}/filme`);

        const [seriesSnapshot, moviesSnapshot] = await Promise.all([
          seriesRef.once('value'),
          moviesRef.once('value'),
        ]);

        const seriesData = seriesSnapshot.val() || {};
        const moviesData = moviesSnapshot.val() || {};

        const seriesList = Object.values(seriesData) as any[];
        const moviesList = Object.values(moviesData) as any[];

        // Serien-spezifische Statistiken berechnen (inkl. Rewatches)
        const totalWatchedEpisodes = seriesList.reduce((total, series) => {
          if (series.seasons) {
            Object.values(series.seasons).forEach((season: any) => {
              if (season.episodes) {
                Object.values(season.episodes).forEach((ep: any) => {
                  if (ep.watched) {
                    total += ep.watchCount || 1;
                  }
                });
              }
            });
          }
          return total;
        }, 0);

        const totalSeriesWatchtime = seriesList.reduce((total, series) => {
          if (series.seasons && series.episodeRuntime) {
            let watchedEpisodeTime = 0;
            Object.values(series.seasons).forEach((season: any) => {
              if (season.episodes) {
                Object.values(season.episodes).forEach((ep: any) => {
                  if (ep.watched) {
                    watchedEpisodeTime +=
                      (ep.watchCount || 1) * (series.episodeRuntime || 0);
                  }
                });
              }
            });
            total += watchedEpisodeTime;
          }
          return total;
        }, 0);

        // Lieblings-Genre für Serien
        const seriesGenreCounts = seriesList.reduce((acc, series) => {
          if (series.genre?.genres) {
            series.genre.genres.forEach((g: string) => {
              acc[g] = (acc[g] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>);

        const favoriteSeriesGenre =
          Object.entries(seriesGenreCounts).sort(
            ([, a], [, b]) => (b as number) - (a as number)
          )[0]?.[0] || 'Keine';

        // Lieblings-Provider für Serien ermitteln
        const seriesProviderCounts: { [key: string]: number } = {};
        seriesList.forEach((series) => {
          if (series.provider?.provider) {
            series.provider.provider.forEach(
              (prov: { id: number; logo: string; name: string }) => {
                seriesProviderCounts[prov.name] =
                  (seriesProviderCounts[prov.name] || 0) + 1;
              }
            );
          }
        });
        const favoriteSeriesProvider =
          Object.entries(seriesProviderCounts).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0] || 'Keine';

        // Film-spezifische Statistiken berechnen
        const ratedMovies = moviesList.filter((movie) => {
          const rating = calculateCorrectAverageRating([movie]);
          return rating > 0;
        });

        const movieUnreleasedCount = moviesList.filter(
          (movie) => movie.status !== 'Released'
        ).length;

        // Lieblings-Genre für Filme
        const movieGenreCounts = moviesList.reduce((acc, movie) => {
          if (movie.genre?.genres) {
            movie.genre.genres.forEach((g: string) => {
              acc[g] = (acc[g] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>);

        const favoriteMovieGenre =
          Object.entries(movieGenreCounts).sort(
            ([, a], [, b]) => (b as number) - (a as number)
          )[0]?.[0] || 'Keine';

        // Lieblings-Provider für Filme ermitteln
        const movieProviderCounts: { [key: string]: number } = {};
        moviesList.forEach((movie) => {
          if (movie.provider?.provider) {
            movie.provider.provider.forEach(
              (prov: { id: number; logo: string; name: string }) => {
                movieProviderCounts[prov.name] =
                  (movieProviderCounts[prov.name] || 0) + 1;
              }
            );
          }
        });
        const favoriteMovieProvider =
          Object.entries(movieProviderCounts).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0] || 'Keine';

        // Korrekte Bewertungsberechnung verwenden
        const allContent = [...seriesList, ...moviesList];
        const averageRating = calculateCorrectAverageRating(allContent);
        const seriesAverageRating = calculateCorrectAverageRating(seriesList);
        const movieAverageRating = calculateCorrectAverageRating(moviesList);

        setProfileData({
          profile: {
            username: userProfile.username,
            displayName: userProfile.displayName,
            photoURL: userProfile.photoURL,
            isOnline: userProfile.isOnline || false,
            lastActive: userProfile.lastActive,
            isPublic: userProfile.isPublic || false,
          },
          isFriend: false,
          stats: {
            seriesCount: seriesList.length,
            moviesCount: moviesList.length,
            averageRating,
            totalWatchedEpisodes,
          },
          seriesStats: {
            count: seriesList.length,
            totalWatchedEpisodes,
            totalWatchtime: Math.round(totalSeriesWatchtime),
            averageRating: seriesAverageRating,
            favoriteGenre: favoriteSeriesGenre,
            favoriteProvider: favoriteSeriesProvider,
          },
          movieStats: {
            count: moviesList.length,
            watchedCount: ratedMovies.length,
            averageRating: movieAverageRating,
            favoriteGenre: favoriteMovieGenre,
            unreleasedCount: movieUnreleasedCount,
            favoriteProvider: favoriteMovieProvider,
          },
        });
      } catch (error) {
        setError('Fehler beim Laden des Profils');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [friendId]);

  // Keine Filter-Reset-Logik nötig für Public-View

  // Kein Realtime-Status für Public-View

  // Public-View: Zugriff nur, wenn Profil geladen und public
  const canViewProfile = () => {
    if (!profileData) return false;
    return profileData.profile.isPublic;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSpecialFilterChange = (value: string) => {
    setSelectedSpecialFilter(value);
  };

  if (loading) {
    return (
      <Container
        maxWidth={false}
        sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 4 } }}
      >
        <Typography variant='h6' textAlign='center'>
          Lade öffentliche Liste...
        </Typography>
      </Container>
    );
  }

  if (error || !profileData) {
    return (
      <Container
        maxWidth={false}
        sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 4 } }}
      >
        <Card
          sx={{
            background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%)`,
            color: colors.text.secondary,
            borderRadius: 3,
            boxShadow: `0 4px 24px ${colors.overlay.medium}`,
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 7 }}>
            <Avatar
              sx={{
                bgcolor: colors.text.secondary,
                color: 'var(--theme-accent)',
                width: 70,
                height: 70,
                mx: 'auto',
                mb: 2,
                boxShadow: `0 2px 12px ${colors.overlay.dark}`,
              }}
            >
              <Star sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography
              variant='h5'
              fontWeight='bold'
              gutterBottom
              sx={{ color: colors.status.error }}
            >
              Fehler beim Laden
            </Typography>
            <Typography
              variant='body1'
              sx={{ mb: 3, opacity: 0.9, color: 'var(--theme-primary)' }}
            >
              {error || 'Es ist ein unbekannter Fehler aufgetreten.'}
            </Typography>
            <Button
              variant='contained'
              onClick={() => navigate('/')}
              startIcon={<ArrowBack />}
              sx={{
                background: `var(--theme-primary)`,
                color: colors.background.default,
                fontWeight: 'bold',
                borderRadius: 2,
                boxShadow: `0 4px 12px ${colors.overlay.medium}`,
                '&:hover': {
                  background: 'var(--theme-accent)',
                  boxShadow: `0 6px 16px ${colors.overlay.medium}`,
                  transform: 'translateY(-2px)',
                },
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                padding: { xs: '8px 16px', md: '10px 20px' },
                transition: 'all 0.3s ease',
              }}
            >
              Zurück zur Startseite
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!canViewProfile()) {
    return (
      <Container
        maxWidth={false}
        sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 4 } }}
      >
        <Card
          sx={{
            background: `linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-primary) 100%)`,
            color: colors.text.secondary,
            borderRadius: 3,
            boxShadow: `0 4px 24px ${colors.overlay.medium}`,
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 7 }}>
            <Avatar
              src={profileData?.profile.photoURL}
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                cursor: profileData?.profile.photoURL ? 'pointer' : 'default',
                '&:hover': profileData?.profile.photoURL
                  ? {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    }
                  : {},
                transition: 'all 0.2s ease',
                mb: 2,
                bgcolor: colors.text.secondary,
                color: 'var(--theme-accent)',
                boxShadow: `0 2px 12px ${colors.overlay.dark}`,
              }}
              onClick={() =>
                profileData?.profile.photoURL && setImageModalOpen(true)
              }
            >
              {(
                profileData?.profile.displayName ||
                profileData?.profile.username
              )
                ?.charAt(0)
                .toUpperCase()}
            </Avatar>
            <Typography variant='h5' fontWeight='bold' gutterBottom>
              @
              {profileData?.profile.displayName ||
                profileData?.profile.username}
            </Typography>
            <Box display='flex' justifyContent='center' mb={2}>
              <Chip
                label='Nicht öffentlich'
                size='small'
                sx={{
                  backgroundColor: `${colors.text.accent}20`,
                  borderColor: colors.text.accent,
                  color: colors.text.accent,
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  px: 1.5,
                }}
              />
            </Box>
            <Typography variant='body1' sx={{ mb: 3, opacity: 0.9 }}>
              Diese Liste ist nicht öffentlich.
            </Typography>
            <Button
              variant='contained'
              onClick={() => navigate('/')}
              startIcon={<ArrowBack />}
              sx={{
                background: `var(--theme-primary)`,
                color: colors.background.default,
                fontWeight: 'bold',
                borderRadius: 2,
                boxShadow: `0 4px 12px ${colors.overlay.medium}`,
                '&:hover': {
                  background: 'var(--theme-accent)',
                  boxShadow: `0 6px 16px ${colors.overlay.medium}`,
                  transform: 'translateY(-2px)',
                },
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                padding: { xs: '8px 16px', md: '10px 20px' },
                transition: 'all 0.3s ease',
              }}
            >
              Zurück zur Startseite
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ p: 0 }}>
      {/* Header - ähnlich wie UserProfilePage aber als öffentliche Ansicht */}
      <Box
        className='main-page-header'
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--theme-background)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          p: { xs: 2, sm: 2, md: 3 },
          color: colors.text.secondary,
          mb: { xs: 2, md: 4 },
        }}
      >
        {/* Mobile Layout */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Avatar
              src={profileData.profile.photoURL}
              sx={{
                width: { xs: 60, sm: 70, md: 80 },
                height: { xs: 60, sm: 70, md: 80 },
                cursor: profileData.profile.photoURL ? 'pointer' : 'default',
                '&:hover': profileData.profile.photoURL
                  ? {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    }
                  : {},
                transition: 'all 0.2s ease',
                border: {
                  xs: `2px solid var(--theme-primary)`,
                  md: `3px solid var(--theme-primary)`,
                },
                boxShadow: `0 0 15px ${colors.overlay.medium}`,
                mx: 'auto',
                mb: 1,
              }}
              onClick={() =>
                profileData.profile.photoURL && setImageModalOpen(true)
              }
            >
              {(profileData.profile.displayName || profileData.profile.username)
                ?.charAt(0)
                .toUpperCase()}
            </Avatar>

            <Typography
              variant='h5'
              component='h1'
              fontWeight='bold'
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
                mb: { xs: 0.25, md: 0.5 },
                lineHeight: 1.2,
              }}
            >
              🌍{' '}
              {profileData.profile.displayName || profileData.profile.username}s
              öffentliche Liste
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                justifyContent: 'center',
                flexWrap: 'wrap',
                mt: 0.5,
              }}
            >
              <Chip
                label='Öffentlich'
                size='small'
                sx={{
                  backgroundColor: `${colors.text.accent}20`,
                  borderColor: colors.text.accent,
                  color: colors.text.accent,
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  height: { xs: 14, md: 20 },
                  minHeight: { xs: 14, md: 20 },
                  '& .MuiChip-label': {
                    px: { xs: 0.5, md: 1 },
                    py: { xs: 0, md: 0.25 },
                  },
                }}
              />
              {profileData.profile.isOnline && (
                <Chip
                  label='Online'
                  size='small'
                  variant='outlined'
                  sx={{
                    backgroundColor: `${colors.text.accent}20`,
                    borderColor: colors.text.accent,
                    color: colors.text.accent,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    height: { xs: 18, md: 24 },
                    minHeight: { xs: 18, md: 24 },
                    '& .MuiChip-label': {
                      px: { xs: 0.5, md: 1 },
                      py: { xs: 0, md: 0.25 },
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Desktop Layout */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box display='flex' alignItems='center' gap={3}>
            <Avatar
              src={profileData.profile.photoURL}
              sx={{
                width: 80,
                height: 80,
                cursor: profileData.profile.photoURL ? 'pointer' : 'default',
                '&:hover': profileData.profile.photoURL
                  ? {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    }
                  : {},
                transition: 'all 0.2s ease',
                border: `2px solid var(--theme-primary)`,
                boxShadow: `0 0 10px ${colors.overlay.medium}`,
              }}
              onClick={() =>
                profileData.profile.photoURL && setImageModalOpen(true)
              }
            >
              {(profileData.profile.displayName || profileData.profile.username)
                ?.charAt(0)
                .toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                variant='h4'
                component='h1'
                gutterBottom
                fontWeight='bold'
                sx={{ fontSize: '2.125rem', mb: 1 }}
              >
                🌍{' '}
                {profileData.profile.displayName ||
                  profileData.profile.username}
                s öffentliche Liste
              </Typography>
              <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
                <Chip
                  label='Öffentlich'
                  size='small'
                  sx={{
                    backgroundColor: `${colors.text.accent}20`,
                    borderColor: colors.text.accent,
                    color: colors.text.accent,
                    fontWeight: 'bold',
                  }}
                />
                {profileData.profile.isOnline && (
                  <Chip
                    label='Online'
                    size='small'
                    variant='outlined'
                    sx={{
                      backgroundColor: `${colors.text.accent}20`,
                      borderColor: colors.text.accent,
                      color: colors.text.accent,
                    }}
                  />
                )}
              </Box>
              {!profileData.profile.isOnline &&
                profileData.profile.lastActive && (
                  <Typography
                    variant='body2'
                    sx={{ opacity: 0.7, mt: 1, fontSize: '0.875rem' }}
                  >
                    Zuletzt online:{' '}
                    {new Date(
                      profileData.profile.lastActive
                    ).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                )}
            </Box>
          </Box>

          <Button
            variant='contained'
            onClick={() => navigate('/')}
            startIcon={<ArrowBack />}
            sx={{
              background: `var(--theme-primary)`,
              color: '#ffffff',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: `0 4px 12px ${colors.overlay.medium}`,
              '&:hover': {
                background: 'var(--theme-accent)',
                boxShadow: `0 6px 16px ${colors.overlay.medium}`,
                transform: 'translateY(-2px)',
              },
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              padding: { xs: '8px 16px', md: '10px 20px' },
              transition: 'all 0.3s ease',
            }}
          >
            Zurück zur Startseite
          </Button>
        </Box>

        {/* Mobile Back Button */}
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            textAlign: 'center',
            mt: 1.5,
          }}
        >
          <Button
            variant='contained'
            onClick={() => navigate('/')}
            startIcon={<ArrowBack />}
            sx={{
              background: colors.status.success,
              color: colors.background.default,
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: `0 4px 12px ${colors.overlay.medium}`,
              '&:hover': {
                background: colors.text.accent,
                boxShadow: `0 6px 16px ${colors.overlay.medium}`,
                transform: 'translateY(-2px)',
              },
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              padding: { xs: '6px 16px', md: '10px 24px' },
              transition: 'all 0.3s ease',
              width: 'auto',
              minWidth: { xs: '120px', md: '150px' },
            }}
          >
            Zurück zur Startseite
          </Button>
        </Box>
      </Box>

      {/* Mobile Stats Toggle Button */}
      <Box
        sx={{ display: { xs: 'block', sm: 'none' }, mt: 3, px: '8px', mb: 2 }}
      >
        <Button
          onClick={() => setMobileStatsExpanded(!mobileStatsExpanded)}
          variant='outlined'
          fullWidth
          startIcon={<TrendingUp />}
          endIcon={mobileStatsExpanded ? <ExpandLess /> : <ExpandMore />}
          sx={{
            justifyContent: 'space-between',
            height: '48px',
            fontSize: '0.875rem',
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-primary)',
            color: 'var(--theme-text-secondary)',
            '&:hover': {
              backgroundColor:
                'color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface))',
              borderColor: 'var(--theme-primary)',
            },
          }}
        >
          Statistiken anzeigen
        </Button>
      </Box>

      {/* Desktop Stats - always visible */}
      <Box
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
          // Serien-spezifische Stats Desktop
          <>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  gutterBottom
                  color='info.main'
                  sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                >
                  {profileData.seriesStats.count}
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
                    color='warning.main'
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {profileData.seriesStats.totalWatchedEpisodes}
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
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
                    color='secondary'
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {profileData.seriesStats.averageRating > 0
                      ? profileData.seriesStats.averageRating.toFixed(2)
                      : '0.00'}
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                >
                  Ø Bewertung
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                <Tooltip
                  title={(() => {
                    const totalMinutes = profileData.seriesStats.totalWatchtime;
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
                    color='warning.main'
                    gutterBottom
                    sx={{
                      fontSize: { sm: '1.75rem', md: '2.125rem' },
                      cursor: 'help',
                    }}
                  >
                    {(() => {
                      const totalHours = Math.floor(
                        profileData.seriesStats.totalWatchtime / 60
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
                </Tooltip>
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
                  {profileData.seriesStats.favoriteGenre}
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
                  {profileData.seriesStats.favoriteProvider}
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
          // Film-spezifische Stats Desktop
          <>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  color='secondary'
                  gutterBottom
                  sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                >
                  {profileData.movieStats.count}
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
                    {profileData.movieStats.watchedCount}
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
                    color='secondary'
                    sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                  >
                    {profileData.movieStats.averageRating > 0
                      ? profileData.movieStats.averageRating.toFixed(2)
                      : '0.00'}
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                >
                  Ø Bewertung
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: { sm: 2, md: 3 } }}>
                <Typography
                  variant='h4'
                  gutterBottom
                  sx={{ fontSize: { sm: '1.75rem', md: '2.125rem' } }}
                >
                  {profileData.movieStats.unreleasedCount}
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
                  {profileData.movieStats.favoriteGenre}
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
                  {profileData.movieStats.favoriteProvider}
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
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <Collapse in={mobileStatsExpanded}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.5,
              px: 1,
              mb: 2,
              backgroundColor:
                'color-mix(in srgb, var(--theme-surface) 50%, transparent)',
              borderRadius: 2,
              border: '1px solid var(--theme-primary)',
              borderColor:
                'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
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
                      gutterBottom
                      sx={{ fontSize: '1.25rem' }}
                    >
                      {profileData.seriesStats.count}
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
                      color='warning.main'
                      sx={{ fontSize: '1.25rem' }}
                    >
                      {profileData.seriesStats.totalWatchedEpisodes}
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
                      {profileData.seriesStats.averageRating > 0
                        ? profileData.seriesStats.averageRating.toFixed(2)
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
                      color='warning.main'
                      gutterBottom
                      sx={{ fontSize: '1.25rem' }}
                    >
                      {(() => {
                        const totalHours = Math.floor(
                          profileData.seriesStats.totalWatchtime / 60
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
                      {profileData.seriesStats.favoriteGenre}
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
                      {profileData.seriesStats.favoriteProvider}
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
                      {profileData.movieStats.count}
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
                      {profileData.movieStats.watchedCount}
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
                      gutterBottom
                      color='secondary'
                      sx={{ fontSize: '1.25rem' }}
                    >
                      {profileData.movieStats.averageRating > 0
                        ? profileData.movieStats.averageRating.toFixed(2)
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
                      {profileData.movieStats.unreleasedCount}
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
                      {profileData.movieStats.favoriteGenre}
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
                      {profileData.movieStats.favoriteProvider}
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
            label={`Serien (${profileData.stats.seriesCount})`}
            icon={
              <CalendarToday sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
            }
            iconPosition='start'
            disableRipple
          />
          <Tab
            label={`Filme (${profileData.stats.moviesCount})`}
            icon={<Star sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />}
            iconPosition='start'
            disableRipple
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: { xs: 1, md: 2 } }} className='quickfilter-container'>
            <QuickFilterChips
              activeFilter={selectedSpecialFilter}
              onFilterChange={handleSpecialFilterChange}
              isMovieMode={false}
            />
          </Box>
          <SeriesGrid
            searchValue={''}
            selectedGenre={'All'}
            selectedProvider={'All'}
            selectedSpecialFilter={selectedSpecialFilter}
            viewOnlyMode={true}
            targetUserId={friendId}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: { xs: 1, md: 2 } }} className='quickfilter-container'>
            <QuickFilterChips
              activeFilter={selectedSpecialFilter}
              onFilterChange={handleSpecialFilterChange}
              isMovieMode={true}
            />
          </Box>
          <MovieGrid
            searchValue={''}
            selectedGenre={'All'}
            selectedProvider={'All'}
            selectedSpecialFilter={selectedSpecialFilter}
            viewOnlyMode={true}
            targetUserId={friendId}
          />
        </TabPanel>
      </Card>

      {/* Scroll Arrows */}
      <ScrollArrows />

      {/* Profilbild Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            background: 'none',
            overflow: 'visible',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={() => setImageModalOpen(false)}
            sx={{
              position: 'absolute',
              top: { xs: 10, sm: -40 },
              right: { xs: 10, sm: -40 },
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {profileData?.profile.photoURL && (
            <Box
              sx={{
                border: '3px solid var(--theme-primary)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 0 30px var(--theme-primary)',
              }}
            >
              <img
                src={profileData.profile.photoURL}
                alt={
                  profileData.profile.displayName ||
                  profileData.profile.username
                }
                style={{
                  maxWidth: '85vw',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </Box>
          )}
        </Box>
      </Dialog>
    </Container>
  );
};
