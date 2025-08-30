import {
  ArrowBack,
  CalendarToday,
  ExpandLess,
  ExpandMore,
  FilterList,
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  TextField,
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
import {
  genreMenuItems,
  genreMenuItemsForMovies,
  providerMenuItems,
} from '../config/menuItems';
import { useDebounce } from '../hooks/useDebounce';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { calculateCorrectAverageRating } from '../lib/rating/rating';
import { colors } from '../theme';

interface UserProfileData {
  profile: {
    uid?: string;  // Add uid field
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
    watchedEpisodes?: number;  // Add this field
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

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth()!;
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [mobileStatsExpanded, setMobileStatsExpanded] = useState(false);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // 🚀 Enhanced Online-Status Überwachung mit Cache & Offline-Support
  const { data: onlineStatus } = useEnhancedFirebaseCache<boolean>(
    userId ? `users/${userId}/isOnline` : '',
    {
      ttl: 30 * 1000, // 30 Sekunden Cache für Online-Status
      useRealtimeListener: true, // Realtime für Live-Status
      enableOfflineSupport: true, // Offline-Unterstützung
    }
  );

  const { data: lastActiveTimestamp } = useEnhancedFirebaseCache<number>(
    userId ? `users/${userId}/lastActive` : '',
    {
      ttl: 60 * 1000, // 1 Minute Cache für LastActive
      useRealtimeListener: true,
      enableOfflineSupport: true, // Offline-Unterstützung
    }
  );

  // Filter und Suche States
  const [searchValue, setSearchValue] = useState('');
  const [selectedSeriesGenre, setSelectedSeriesGenre] = useState('All');
  const [selectedMovieGenre, setSelectedMovieGenre] = useState('All');
  const [selectedSeriesProvider, setSelectedSeriesProvider] = useState('All');
  const [selectedMovieProvider, setSelectedMovieProvider] = useState('All');
  const [selectedSpecialFilter, setSelectedSpecialFilter] = useState('');
  const debouncedSearchValue = useDebounce(searchValue, 300);

  const handleSpecialFilterChange = (value: string) => {
    setSelectedSpecialFilter(value);
  };

  // Aktualisiere Profile-Daten wenn sich Online-Status ändert
  useEffect(() => {
    if (!profileData || !userId) return;

    setProfileData((prev) =>
      prev
        ? {
            ...prev,
            profile: {
              ...prev.profile,
              isOnline: onlineStatus || false,
              lastActive: lastActiveTimestamp || undefined,
            },
          }
        : null
    );
  }, [
    onlineStatus,
    lastActiveTimestamp,
    userId,
    profileData?.profile.username,
  ]);

  useEffect(() => {
    // Profildaten zurücksetzen wenn userId sich ändert
    setProfileData(null);
    setError('');
    
    const loadUserProfile = async () => {
      if (!userId || !user) {
        setLoading(false);
        return;
      }

      try {
        console.time('[UserProfile] Total Load Time');
        setLoading(true);

        // Benutzer-Profil laden - initial
        // console.time('[UserProfile] User Data');
        // console.log('[UserProfile] Loading user:', userId);
        
        // Versuche es mit einem Timeout
        const userRef = firebase.database().ref(`users/${userId}`);
        
        const userDataPromise = userRef.once('value');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading user data')), 5000)
        );
        
        let userSnapshot: firebase.database.DataSnapshot;
        try {
          userSnapshot = await Promise.race([userDataPromise, timeoutPromise]) as firebase.database.DataSnapshot;
        } catch (timeoutError) {
          // console.error('[UserProfile] Timeout or error loading user data:', timeoutError);
          // Fallback: Try again without timeout
          userSnapshot = await userRef.once('value');
        }
        
        // console.timeEnd('[UserProfile] User Data');

        if (!userSnapshot.exists()) {
          setError('Benutzer nicht gefunden');
          setLoading(false);
          return;
        }

        const userProfile = userSnapshot.val();

        // Prüfen ob es ein Freund ist
        console.time('[UserProfile] Friend Check');
        const friendsRef = firebase.database().ref('friendRequests');
        const friendsSnapshot = await friendsRef
          .orderByChild('fromUserId')
          .equalTo(user.uid)
          .once('value');
        console.timeEnd('[UserProfile] Friend Check');

        let isFriend = false;
        if (friendsSnapshot.exists()) {
          const requests = Object.values(friendsSnapshot.val()) as any[];
          isFriend = requests.some(
            (req) => req.toUserId === userId && req.status === 'accepted'
          );
        }

        // Rückrichtung prüfen
        if (!isFriend) {
          const backwardSnapshot = await friendsRef
            .orderByChild('fromUserId')
            .equalTo(userId)
            .once('value');

          if (backwardSnapshot.exists()) {
            const requests = Object.values(backwardSnapshot.val()) as any[];
            isFriend = requests.some(
              (req) => req.toUserId === user.uid && req.status === 'accepted'
            );
          }
        }

        // Statistiken laden
        console.time('[UserProfile] Series & Movies Data');
        const seriesRef = firebase.database().ref(`${userId}/serien`);
        const moviesRef = firebase.database().ref(`${userId}/filme`);

        const [seriesSnapshot, moviesSnapshot] = await Promise.all([
          seriesRef.once('value'),
          moviesRef.once('value'),
        ]);
        console.timeEnd('[UserProfile] Series & Movies Data');

        const seriesData = seriesSnapshot.val() || {};
        const moviesData = moviesSnapshot.val() || {};

        const seriesList = Object.values(seriesData) as any[];
        const moviesList = Object.values(moviesData) as any[];

        // Serien-spezifische Statistiken berechnen (inkl. Rewatches)
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

        const totalSeriesWatchtime = seriesList.reduce((total, series) => {
          if (series.seasons && series.episodeRuntime) {
            const watchedEpisodeTime = series.seasons.reduce(
              (seasonTotal: number, season: any) => {
                return (
                  seasonTotal +
                  (season.episodes || []).reduce(
                    (episodeTime: number, ep: any) => {
                      if (ep.watched) {
                        return (
                          episodeTime +
                          (ep.watchCount || 1) * series.episodeRuntime
                        );
                      }
                      return episodeTime;
                    },
                    0
                  )
                );
              },
              0
            );
            return total + watchedEpisodeTime;
          }
          return total;
        }, 0);

        // Lieblings-Genre für Serien
        const seriesGenreCounts = seriesList.reduce((acc, series) => {
          if (series.genre?.genres) {
            series.genre.genres.forEach((genre: string) => {
              if (genre !== 'All') {
                acc[genre] = (acc[genre] || 0) + 1;
              }
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
            movie.genre.genres.forEach((genre: string) => {
              if (genre !== 'All') {
                acc[genre] = (acc[genre] || 0) + 1;
              }
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
            uid: userId,  // Added uid field
            username: userProfile.username || 'Unbekannt',
            displayName: userProfile.displayName || userProfile.username,
            photoURL: userProfile.photoURL,
            isOnline: onlineStatus || false,  // Use onlineStatus from context
            lastActive: lastActiveTimestamp || userProfile.lastActive,  // Use lastActiveTimestamp from context
            isPublic: userProfile.isPublic || false,
          },
          isFriend,
          stats: {
            seriesCount: seriesList.length,
            moviesCount: moviesList.length,
            averageRating,
            totalWatchedEpisodes,
          },
          seriesStats: {
            count: seriesList.length,
            watchedEpisodes: totalWatchedEpisodes, // Added this field
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
        // console.timeEnd('[UserProfile] Total Load Time');
        setLoading(false);
      } catch (error) {
        // console.timeEnd('[UserProfile] Total Load Time');
        // console.error('[UserProfile] Error:', error);
        setError('Fehler beim Laden des Profils');
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, user]); // onlineStatus und lastActiveTimestamp nicht als Dependencies!

  // Filter zurücksetzen bei Tab-Wechsel
  useEffect(() => {
    setSearchValue('');
    setSelectedSeriesGenre('All');
    setSelectedMovieGenre('All');
    setSelectedSeriesProvider('All');
    setSelectedMovieProvider('All');
  }, [tabValue]);

  const canViewProfile = () => {
    if (!profileData) return false;
    if (userId === user?.uid) return true; // Eigenes Profil
    return profileData.isFriend || profileData.profile.isPublic;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const isOwnProfile = userId === user?.uid;

  if (loading) {
    return (
      <Container
        maxWidth={false}
        sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 4 } }}
      >
        <Typography variant='h6' textAlign='center'>
          Lade Profil...
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
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant='h6' color='error' gutterBottom>
              {error || 'Fehler beim Laden'}
            </Typography>
            <Button
              variant='contained'
              onClick={() => navigate('/friends')}
              startIcon={<ArrowBack />}
            >
              Zurück zu Freunden
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
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Avatar
              src={profileData.profile.photoURL}
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                cursor: profileData.profile.photoURL ? 'pointer' : 'default',
                '&:hover': profileData.profile.photoURL
                  ? {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    }
                  : {},
                transition: 'all 0.2s ease',
              }}
              onClick={() =>
                profileData.profile.photoURL && setImageModalOpen(true)
              }
            >
              {(profileData.profile.displayName || profileData.profile.username)
                ?.charAt(0)
                .toUpperCase()}
            </Avatar>
            <Typography variant='h5' gutterBottom>
              @{profileData.profile.displayName || profileData.profile.username}
            </Typography>
            <Typography variant='body1' color='text.secondary' mb={3}>
              Dieses Profil ist privat. Du musst mit diesem Benutzer befreundet
              sein, um es zu sehen.
            </Typography>
            <Button
              variant='contained'
              onClick={() => navigate('/friends')}
              startIcon={<ArrowBack />}
            >
              Zurück zu Freunden
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ 
      p: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <Box
        className='main-page-header'
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--theme-background)',
          backdropFilter: 'blur(20px)',
          p: { xs: 2, sm: 2, md: 3 },
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          color: colors.text.secondary,
          mb: { xs: 2, md: 4 },
          flexShrink: 0,
        }}
      >
        {/* Mobile Layout */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {/* Avatar zentriert */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Avatar
              className='profile-header-avatar'
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
                border: '2px solid var(--theme-primary)',
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

            {/* Titel */}
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
              {isOwnProfile
                ? 'Mein Profil'
                : `${
                    profileData.profile.displayName ||
                    profileData.profile.username
                  }s Profil`}
            </Typography>

            {/* Username und Display Name entfernt - redundant */}

            {/* Status Chips */}
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                justifyContent: 'center',
                flexWrap: 'wrap',
                mt: 0.5,
              }}
            >
              {profileData.profile.isOnline && (
                <Chip
                  label='Online'
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
              )}
              {!isOwnProfile && (
                <Chip
                  label={profileData.isFriend ? 'Freund' : 'Öffentlich'}
                  size='small'
                  variant='outlined'
                  sx={{
                    backgroundColor: profileData.isFriend
                      ? `${colors.text.accent}20`
                      : 'transparent',
                    borderColor: profileData.isFriend
                      ? colors.text.accent
                      : colors.border.default,
                    color: profileData.isFriend
                      ? colors.text.accent
                      : colors.text.muted,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    height: { xs: 14, md: 20 },
                    minHeight: { xs: 14, md: 20 },
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
                border: `2px solid var(--theme-primary)`,
                cursor: profileData.profile.photoURL ? 'pointer' : 'default',
                '&:hover': profileData.profile.photoURL
                  ? {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    }
                  : {},
                transition: 'all 0.2s ease',
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
                {isOwnProfile
                  ? 'Mein Profil'
                  : `${
                      profileData.profile.displayName ||
                      profileData.profile.username
                    }s Profil`}
              </Typography>
              <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
                {/* Username und Display Name komplett entfernt - redundant */}
                {profileData.profile.isOnline && (
                  <Chip
                    label='Online'
                    size='small'
                    sx={{
                      backgroundColor: `${colors.text.accent}20`,
                      borderColor: colors.text.accent,
                      color: colors.text.accent,
                      fontWeight: 'bold',
                    }}
                  />
                )}
                {!isOwnProfile && (
                  <Chip
                    label={profileData.isFriend ? 'Freund' : 'Öffentlich'}
                    size='small'
                    variant='outlined'
                    sx={{
                      backgroundColor: profileData.isFriend
                        ? `${colors.text.accent}20`
                        : 'transparent',
                      borderColor: profileData.isFriend
                        ? colors.text.accent
                        : '#666',
                      color: profileData.isFriend
                        ? colors.text.accent
                        : '#ccc',
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

          {/* Desktop Back Button */}
          <Button
            className='profile-header-button'
            variant='contained'
            onClick={() => navigate(isOwnProfile ? '/' : '/friends')}
            startIcon={<ArrowBack />}
            sx={{
              background: 'var(--theme-primary)',
              color: colors.background.default,
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: `0 4px 12px ${colors.overlay.medium}`,
              '&:hover': {
                background: 'var(--theme-accent)',
                boxShadow: `0 6px 16px ${colors.overlay.medium}`,
                transform: 'translateY(-2px)',
              },
              fontSize: '0.875rem',
              padding: '10px 20px',
              transition: 'all 0.3s ease',
            }}
          >
            {isOwnProfile ? 'Zurück' : 'Zu Freunden'}
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
            onClick={() => navigate(isOwnProfile ? '/' : '/friends')}
            startIcon={<ArrowBack />}
            sx={{
              background: 'var(--theme-primary)',
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
              padding: { xs: '6px 16px', md: '10px 24px' },
              transition: 'all 0.3s ease',
              width: 'auto',
              minWidth: { xs: '120px', md: '150px' },
            }}
          >
            {isOwnProfile ? 'Zurück' : 'Zu Freunden'}
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
                  color='text.secondary'
                  sx={{ fontSize: { sm: '0.75rem', md: '0.875rem' } }}
                >
                  Episoden gesehen
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
                    gutterBottom
                    color='warning.main'
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
                    color='warning.main'
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
                      color='info.main'
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
                      color='warning.main'
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

      {/* Mobile Filter Toggle Button */}
      <Box sx={{ display: { xs: 'block', xl: 'none' }, px: '8px', mb: 2 }}>
        <Button
          onClick={() => setMobileFiltersExpanded(!mobileFiltersExpanded)}
          variant='outlined'
          fullWidth
          startIcon={<FilterList />}
          endIcon={mobileFiltersExpanded ? <ExpandLess /> : <ExpandMore />}
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
          Filter & Suche
        </Button>
      </Box>

      {/* Tabs für Serien und Filme */}
      <Card>
        {/* Desktop Filter - always visible */}
        <Box
          sx={{
            display: { xs: 'none', xl: 'block' },
            p: { xs: 2, md: 3 },
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box className='flex flex-col lg:flex-row items-center gap-2 justify-center'>
            {/* Suchfeld */}
            <TextField
              variant='outlined'
              label='Suchen'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className='w-[250px] search-input-field'
            />

            {/* Genre Filter */}

            <FormControl className='w-[250px]'>
              <InputLabel id='genre-label'>Genre</InputLabel>
              <Select
                labelId='genre-label'
                value={
                  tabValue === 0 ? selectedSeriesGenre : selectedMovieGenre
                }
                label='Genre'
                onChange={(e: SelectChangeEvent<unknown>) => {
                  const value = e.target.value as string;
                  if (tabValue === 0) {
                    setSelectedSeriesGenre(value);
                  } else {
                    setSelectedMovieGenre(value);
                  }
                }}
              >
                {(tabValue === 0
                  ? genreMenuItems
                  : genreMenuItemsForMovies
                ).map((genre) => (
                  <MenuItem key={genre.value} value={genre.value}>
                    {genre.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Provider Filter */}
            <FormControl className='w-[250px]' variant='outlined'>
              <InputLabel>Anbieter</InputLabel>
              <Select
                value={
                  tabValue === 0
                    ? selectedSeriesProvider
                    : selectedMovieProvider
                }
                label='Anbieter'
                onChange={(e: SelectChangeEvent<unknown>) => {
                  const value = e.target.value as string;
                  if (tabValue === 0) {
                    setSelectedSeriesProvider(value);
                  } else {
                    setSelectedMovieProvider(value);
                  }
                }}
              >
                {providerMenuItems.map((provider) => (
                  <MenuItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Mobile Collapsible Filter */}
        <Collapse
          in={mobileFiltersExpanded}
          sx={{ display: { xs: 'block', xl: 'none' } }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor:
                'color-mix(in srgb, var(--theme-surface) 50%, transparent)',
              borderRadius: 2,
              border: '1px solid var(--theme-primary)',
              borderColor:
                'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
              m: 2,
              borderBottom: 1,
            }}
          >
            {/* Suchfeld */}
            <Box sx={{ mb: 2 }}>
              <TextField
                label='Suchen'
                variant='outlined'
                type='search'
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                fullWidth
              />
            </Box>

            {/* Dropdown Filters */}
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel id='mobile-genre-label'>Genre</InputLabel>
                <Select
                  labelId='mobile-genre-label'
                  label='Genre'
                  value={
                    tabValue === 0 ? selectedSeriesGenre : selectedMovieGenre
                  }
                  onChange={(e: SelectChangeEvent<unknown>) => {
                    const value = e.target.value as string;
                    if (tabValue === 0) {
                      setSelectedSeriesGenre(value);
                    } else {
                      setSelectedMovieGenre(value);
                    }
                  }}
                >
                  {(tabValue === 0
                    ? genreMenuItems
                    : genreMenuItemsForMovies
                  ).map((genre) => (
                    <MenuItem key={genre.value} value={genre.value}>
                      {genre.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id='mobile-provider-label'>Provider</InputLabel>
                <Select
                  labelId='mobile-provider-label'
                  label='Provider'
                  value={
                    tabValue === 0
                      ? selectedSeriesProvider
                      : selectedMovieProvider
                  }
                  onChange={(e: SelectChangeEvent<unknown>) => {
                    const value = e.target.value as string;
                    if (tabValue === 0) {
                      setSelectedSeriesProvider(value);
                    } else {
                      setSelectedMovieProvider(value);
                    }
                  }}
                >
                  {providerMenuItems.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Collapse>

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
            searchValue={debouncedSearchValue}
            selectedGenre={selectedSeriesGenre}
            selectedProvider={selectedSeriesProvider}
            selectedSpecialFilter={selectedSpecialFilter}
            viewOnlyMode={!isOwnProfile}
            targetUserId={userId}
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
            searchValue={debouncedSearchValue}
            selectedGenre={selectedMovieGenre}
            selectedProvider={selectedMovieProvider}
            selectedSpecialFilter={selectedSpecialFilter}
            viewOnlyMode={!isOwnProfile}
            targetUserId={userId}
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

export default UserProfilePage;
