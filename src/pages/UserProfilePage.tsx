import {
  ArrowBack,
  CalendarToday,
  Search,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import MovieGrid from '../components/movies/MovieGrid';
import SeriesGrid from '../components/series/SeriesGrid';
import {
  genreMenuItems,
  genreMenuItemsForMovies,
  providerMenuItems,
} from '../constants/menuItems';
import { useDebounce } from '../hooks/useDebounce';
import { calculateCorrectAverageRating } from '../utils/rating';

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

  // Filter und Suche States
  const [searchValue, setSearchValue] = useState('');
  const [selectedSeriesGenre, setSelectedSeriesGenre] = useState('All');
  const [selectedMovieGenre, setSelectedMovieGenre] = useState('All');
  const [selectedSeriesProvider, setSelectedSeriesProvider] = useState('All');
  const [selectedMovieProvider, setSelectedMovieProvider] = useState('All');
  const debouncedSearchValue = useDebounce(searchValue, 300);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId || !user) return;

      try {
        setLoading(true);

        // Benutzer-Profil laden - initial
        const userRef = firebase.database().ref(`users/${userId}`);
        const userSnapshot = await userRef.once('value');

        if (!userSnapshot.exists()) {
          setError('Benutzer nicht gefunden');
          return;
        }

        const userProfile = userSnapshot.val();

        // Prüfen ob es ein Freund ist
        const friendsRef = firebase.database().ref('friendRequests');
        const friendsSnapshot = await friendsRef
          .orderByChild('fromUserId')
          .equalTo(user.uid)
          .once('value');

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
        const seriesRef = firebase.database().ref(`${userId}/serien`);
        const moviesRef = firebase.database().ref(`${userId}/filme`);

        const [seriesSnapshot, moviesSnapshot] = await Promise.all([
          seriesRef.once('value'),
          moviesRef.once('value'),
        ]);

        const seriesData = seriesSnapshot.val() || {};
        const moviesData = moviesSnapshot.val() || {};

        const seriesList = Object.values(seriesData) as any[];
        const moviesList = Object.values(moviesData) as any[];

        // Statistiken berechnen
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

        // Korrekte Bewertungsberechnung verwenden
        const allContent = [...seriesList, ...moviesList];
        const averageRating = calculateCorrectAverageRating(allContent);

        setProfileData({
          profile: {
            username: userProfile.username,
            displayName: userProfile.displayName,
            photoURL: userProfile.photoURL,
            isOnline: userProfile.isOnline || false,
            lastActive: userProfile.lastActive,
            isPublic: userProfile.isPublic || false,
          },
          isFriend,
          stats: {
            seriesCount: seriesList.length,
            moviesCount: moviesList.length,
            averageRating,
            totalWatchedEpisodes,
          },
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Fehler beim Laden des Profils');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, user]);

  // Filter zurücksetzen bei Tab-Wechsel
  useEffect(() => {
    setSearchValue('');
    setSelectedSeriesGenre('All');
    setSelectedMovieGenre('All');
    setSelectedSeriesProvider('All');
    setSelectedMovieProvider('All');
  }, [tabValue]);

  // Separater useEffect für Realtime Online-Status Updates
  useEffect(() => {
    if (!userId || !profileData) return;

    const onlineStatusRef = firebase.database().ref(`users/${userId}/isOnline`);
    const lastActiveRef = firebase.database().ref(`users/${userId}/lastActive`);

    const onlineListener = onlineStatusRef.on('value', (snapshot) => {
      const isOnline = snapshot.val() || false;
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                isOnline,
              },
            }
          : null
      );
    });

    const lastActiveListener = lastActiveRef.on('value', (snapshot) => {
      const lastActive = snapshot.val();
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                lastActive,
              },
            }
          : null
      );
    });

    return () => {
      onlineStatusRef.off('value', onlineListener);
      lastActiveRef.off('value', lastActiveListener);
    };
  }, [userId, profileData?.profile?.username]); // Abhängigkeit auf username um zu vermeiden, dass es sich selbst triggert

  const canViewProfile = () => {
    if (!profileData) return false;
    if (userId === user?.uid) return true; // Eigenes Profil
    return profileData.isFriend || profileData.profile.isPublic;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            >
              {profileData.profile.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant='h5' gutterBottom>
              @{profileData.profile.username}
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

  const isOwnProfile = userId === user?.uid;

  return (
    <Container
      maxWidth={false}
      sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, md: 4 } }}
    >
      {/* Header */}
      <Box
        sx={{
          background: isOwnProfile
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)'
            : 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
          borderRadius: 2,
          p: { xs: 2, sm: 2.5, md: 3 },
          color: 'white',
          mb: 4,
        }}
      >
        {/* Mobile Layout */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {/* Avatar zentriert */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Avatar
              src={profileData.profile.photoURL}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid #00fed7',
                boxShadow: '0 0 15px rgba(0, 254, 215, 0.4)',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              {profileData.profile.username?.charAt(0).toUpperCase()}
            </Avatar>

            {/* Titel */}
            <Typography
              variant='h5'
              component='h1'
              fontWeight='bold'
              sx={{ fontSize: '1.5rem', mb: 0.5 }}
            >
              {isOwnProfile
                ? 'Mein Profil'
                : `${profileData.profile.username}s Profil`}
            </Typography>

            {/* Username */}
            <Typography
              variant='h6'
              sx={{ opacity: 0.9, fontSize: '1rem', mb: 1 }}
            >
              @{profileData.profile.username}
            </Typography>

            {/* Optional: Display Name */}
            {profileData.profile.displayName && (
              <Typography
                variant='body2'
                sx={{ opacity: 0.7, fontSize: '0.875rem', mb: 1 }}
              >
                {profileData.profile.displayName}
              </Typography>
            )}

            {/* Status Chips */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {profileData.profile.isOnline && (
                <Chip
                  label='Online'
                  size='small'
                  sx={{
                    backgroundColor: '#00fed7',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {!isOwnProfile && (
                <Chip
                  label={profileData.isFriend ? 'Freund' : 'Öffentlich'}
                  size='small'
                  variant='outlined'
                  sx={{
                    borderColor: profileData.isFriend ? '#00fed7' : '#666',
                    color: profileData.isFriend ? '#00fed7' : '#ccc',
                    fontSize: '0.75rem',
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
                border: '2px solid #00fed7',
                boxShadow: '0 0 10px rgba(0, 254, 215, 0.3)',
              }}
            >
              {profileData.profile.username?.charAt(0).toUpperCase()}
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
                  ? '👤 Mein Profil'
                  : `👤 ${profileData.profile.username}s Profil`}
              </Typography>
              <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
                <Typography
                  variant='h6'
                  sx={{ opacity: 0.9, fontSize: '1.25rem' }}
                >
                  @{profileData.profile.username}
                </Typography>
                {profileData.profile.displayName && (
                  <Typography
                    variant='body1'
                    sx={{ opacity: 0.7, fontSize: '1rem' }}
                  >
                    ({profileData.profile.displayName})
                  </Typography>
                )}
                {profileData.profile.isOnline && (
                  <Chip
                    label='Online'
                    size='small'
                    sx={{
                      backgroundColor: '#00fed7',
                      color: '#000',
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
                      borderColor: profileData.isFriend ? '#00fed7' : '#666',
                      color: profileData.isFriend ? '#00fed7' : '#ccc',
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
            variant='contained'
            onClick={() => navigate(isOwnProfile ? '/' : '/friends')}
            startIcon={<ArrowBack />}
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
            mt: 2,
          }}
        >
          <Button
            variant='contained'
            onClick={() => navigate(isOwnProfile ? '/' : '/friends')}
            startIcon={<ArrowBack />}
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
              fontSize: '0.875rem',
              padding: '10px 24px',
              transition: 'all 0.3s ease',
              width: 'auto',
              minWidth: '150px',
            }}
          >
            {isOwnProfile ? 'Zurück' : 'Zu Freunden'}
          </Button>
        </Box>
      </Box>

      {/* Statistiken */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
          },
          gap: { xs: 2, md: 3 },
          mb: { xs: 3, md: 4 },
          px: { xs: 0.5, md: 0 },
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
            <Typography
              variant='h4'
              color='primary'
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
            >
              {profileData.stats.seriesCount}
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
            <Typography
              variant='h4'
              color='secondary'
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
            >
              {profileData.stats.moviesCount}
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
                {profileData.stats.averageRating.toFixed(2)}
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
                {profileData.stats.totalWatchedEpisodes}
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
      </Box>

      {/* Tabs für Serien und Filme */}
      <Card>
        {/* Such- und Filter-Bereich */}
        <Box
          sx={{ p: { xs: 2, md: 3 }, borderBottom: 1, borderColor: 'divider' }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'center',
            }}
          >
            {/* Suchfeld */}
            <TextField
              variant='outlined'
              label='Suchen...'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{
                minWidth: { xs: '100%', md: 300 },
                '& .MuiInputLabel-root': {
                  color: '#9e9e9e',
                },
                '& .MuiOutlinedInput-root': {
                  color: '#e0e0e0',
                  '& fieldset': {
                    borderColor: '#404040',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00fed7',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00fed7',
                  },
                },
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: '#9e9e9e' }} />,
              }}
            />

            {/* Genre Filter */}
            <FormControl
              variant='outlined'
              sx={{
                minWidth: { xs: '100%', md: 200 },
                '& .MuiInputLabel-root': {
                  color: '#9e9e9e',
                },
                '& .MuiOutlinedInput-root': {
                  color: '#e0e0e0',
                  '& fieldset': {
                    borderColor: '#404040',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00fed7',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00fed7',
                  },
                },
                '& .MuiSelect-icon': {
                  color: '#9e9e9e',
                },
              }}
            >
              <InputLabel>Genre</InputLabel>
              <Select
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
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2d2d30',
                      border: '1px solid #404040',
                      '& .MuiMenuItem-root': {
                        color: '#e0e0e0',
                        '&:hover': {
                          backgroundColor: '#404040',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#00fed7',
                          color: '#000',
                          '&:hover': {
                            backgroundColor: '#00c5a3',
                          },
                        },
                      },
                    },
                  },
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
            <FormControl
              variant='outlined'
              sx={{
                minWidth: { xs: '100%', md: 200 },
                '& .MuiInputLabel-root': {
                  color: '#9e9e9e',
                },
                '& .MuiOutlinedInput-root': {
                  color: '#e0e0e0',
                  '& fieldset': {
                    borderColor: '#404040',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00fed7',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00fed7',
                  },
                },
                '& .MuiSelect-icon': {
                  color: '#9e9e9e',
                },
              }}
            >
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
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2d2d30',
                      border: '1px solid #404040',
                      '& .MuiMenuItem-root': {
                        color: '#e0e0e0',
                        '&:hover': {
                          backgroundColor: '#404040',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#00fed7',
                          color: '#000',
                          '&:hover': {
                            backgroundColor: '#00c5a3',
                          },
                        },
                      },
                    },
                  },
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
            label={`Serien (${profileData.stats.seriesCount})`}
            icon={
              <CalendarToday sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
            }
            iconPosition='start'
          />
          <Tab
            label={`Filme (${profileData.stats.moviesCount})`}
            icon={<Star sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />}
            iconPosition='start'
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <SeriesGrid
            searchValue={debouncedSearchValue}
            selectedGenre={selectedSeriesGenre}
            selectedProvider={selectedSeriesProvider}
            viewOnlyMode={!isOwnProfile}
            targetUserId={userId}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MovieGrid
            searchValue={debouncedSearchValue}
            selectedGenre={selectedMovieGenre}
            selectedProvider={selectedMovieProvider}
            viewOnlyMode={!isOwnProfile}
            targetUserId={userId}
          />
        </TabPanel>
      </Card>
    </Container>
  );
};

export default UserProfilePage;
