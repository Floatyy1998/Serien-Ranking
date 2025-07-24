import {
  ArrowBack,
  Notifications,
  People,
  Person,
  PersonAdd,
  Search,
  Timeline,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import FriendActivityDialog from '../components/dialogs/FriendActivityDialog';
import { ProfileDialog } from '../components/dialogs/ProfileDialog';
import { useFriends } from '../contexts/FriendsProvider';
import { useNotifications } from '../contexts/NotificationProvider';
import { Friend, FriendRequest, UserSearchResult } from '../interfaces/Friend';

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
      id={`friends-tabpanel-${index}`}
      aria-labelledby={`friends-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const FriendsPage: React.FC = () => {
  const { user } = useAuth()!;
  const navigate = useNavigate();
  const theme = useTheme();
  const { friendUnreadActivities, markActivitiesAsRead } = useNotifications();
  const {
    friends,
    friendRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useFriends();

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [requestProfiles, setRequestProfiles] = useState<Record<string, any>>(
    {}
  );
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [selectedFriendName, setSelectedFriendName] = useState<string>('');
  const [selectedFriendPhotoURL, setSelectedFriendPhotoURL] =
    useState<string>('');

  // Freund-Profile laden um aktuelle Daten zu haben
  useEffect(() => {
    const loadFriendProfiles = async () => {
      const profiles: Record<string, any> = {};

      for (const friend of friends) {
        try {
          const userRef = firebase.database().ref(`users/${friend.uid}`);
          const snapshot = await userRef.once('value');
          if (snapshot.exists()) {
            profiles[friend.uid] = snapshot.val();
          }
        } catch (error) {
          console.error(`Error loading profile for ${friend.uid}:`, error);
        }
      }

      setFriendProfiles(profiles);
    };

    if (friends.length > 0) {
      loadFriendProfiles();
    }
  }, [friends]);

  // Profile der Anfragensteller laden
  useEffect(() => {
    const loadRequestProfiles = async () => {
      const profiles: Record<string, any> = {};

      for (const request of friendRequests) {
        try {
          const userRef = firebase
            .database()
            .ref(`users/${request.fromUserId}`);
          const snapshot = await userRef.once('value');
          if (snapshot.exists()) {
            profiles[request.fromUserId] = snapshot.val();
          }
        } catch (error) {
          console.error(
            `Error loading profile for ${request.fromUserId}:`,
            error
          );
        }
      }

      setRequestProfiles(profiles);
    };

    if (friendRequests.length > 0) {
      loadRequestProfiles();
    }
  }, [friendRequests]);

  // Realtime Online-Status Listener
  useEffect(() => {
    const listeners: Array<() => void> = [];

    const setupOnlineListeners = () => {
      friends.forEach((friend) => {
        const userRef = firebase.database().ref(`users/${friend.uid}`);

        const listener = userRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setFriendProfiles((prev) => ({
              ...prev,
              [friend.uid]: {
                ...prev[friend.uid],
                ...userData,
              },
            }));
          }
        });

        // Cleanup function für diesen Listener
        listeners.push(() => userRef.off('value', listener));
      });
    };

    if (friends.length > 0) {
      setupOnlineListeners();
    }

    // Cleanup beim Unmount oder wenn sich Freunde ändern
    return () => {
      listeners.forEach((cleanup) => cleanup());
    };
  }, [friends]); // Debounced search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async () => {
    if (!user || searchTerm.length < 2) return;

    try {
      setSearching(true);
      setError('');

      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef.once('value');
      const usersData = snapshot.val();

      if (!usersData) {
        setSearchResults([]);
        return;
      }

      const results: UserSearchResult[] = [];
      const currentFriendIds = friends.map((f) => f.uid);
      const sentRequestIds = sentRequests.map((r) => r.toUserId);

      Object.keys(usersData).forEach((uid) => {
        const userData = usersData[uid];

        if (uid === user.uid) return;
        if (!userData.username) return;

        const searchInUsername = userData.username
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const searchInDisplayName = userData.displayName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (searchInUsername || searchInDisplayName) {
          results.push({
            uid,
            username: userData.username,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            isAlreadyFriend: currentFriendIds.includes(uid),
            hasPendingRequest: sentRequestIds.includes(uid),
          });
        }
      });

      results.sort((a, b) => a.username.localeCompare(b.username));
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Fehler bei der Suche');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUser: UserSearchResult) => {
    try {
      setError('');
      await sendFriendRequest(targetUser.username);

      setSearchResults((prev) =>
        prev.map((user) =>
          user.uid === targetUser.uid
            ? { ...user, hasPendingRequest: true }
            : user
        )
      );

      setSuccess(`Freundschaftsanfrage an ${targetUser.username} gesendet`);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Senden der Anfrage');
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      await acceptFriendRequest(request.id);
      setSuccess(`Du bist jetzt mit ${request.fromUsername} befreundet!`);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Akzeptieren der Anfrage');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      setSuccess('Freundschaftsanfrage abgelehnt');
    } catch (error: any) {
      setError(error.message || 'Fehler beim Ablehnen der Anfrage');
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    if (
      window.confirm(
        `Möchtest du ${friend.username} wirklich als Freund entfernen?`
      )
    ) {
      try {
        await removeFriend(friend.uid);
        setSuccess(`${friend.username} wurde entfernt`);
      } catch (error: any) {
        setError(error.message || 'Fehler beim Entfernen des Freundes');
      }
    }
  };

  const getStatusChip = (user: UserSearchResult) => {
    if (user.isAlreadyFriend) {
      return <Chip label='Bereits befreundet' size='small' color='success' />;
    }
    if (user.hasPendingRequest) {
      return (
        <Chip
          label='Anfrage gesendet'
          size='small'
          sx={{
            backgroundColor: '#00fed7',
            color: 'white',
            fontWeight: 500,
          }}
        />
      );
    }
    return null;
  };

  const canSendRequest = (user: UserSearchResult) => {
    return !user.isAlreadyFriend && !user.hasPendingRequest;
  };

  const handleShowActivities = (friend: Friend) => {
    const currentProfile = friendProfiles[friend.uid] || friend;
    setSelectedFriendId(friend.uid);
    setSelectedFriendName(friend.displayName || friend.username);
    setSelectedFriendPhotoURL(currentProfile.photoURL || '');
    setActivityDialogOpen(true);

    // Markiere Aktivitäten als gelesen
    markActivitiesAsRead(friend.uid);
  };

  const handleCloseActivityDialog = () => {
    setActivityDialogOpen(false);
    setSelectedFriendId('');
    setSelectedFriendName('');
    setSelectedFriendPhotoURL('');
  };

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
          sx={{
            textAlign: { xs: 'center', md: 'left' },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Typography
            variant='h4'
            component='h1'
            gutterBottom
            fontWeight='bold'
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              mb: { xs: 0.5, md: 1 },
            }}
          >
            🫂 Freunde
          </Typography>
          <Typography
            variant='body1'
            sx={{
              opacity: 0.9,
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Verwalte deine Freundschaften und finde neue Freunde
          </Typography>
        </Box>
        <Button
          variant='contained'
          onClick={() => navigate('/')}
          startIcon={
            <ArrowBack sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
          }
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
            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' },
            padding: { xs: '6px 12px', sm: '8px 16px', md: '10px 20px' },
            transition: 'all 0.3s ease',
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: '200px', sm: 'none' },
          }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            Zurück zur Hauptseite
          </Box>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Hauptseite</Box>
        </Button>
      </Box>

      {/* Feedback */}
      {error && (
        <Alert severity='error' onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity='success' onClose={() => setSuccess('')} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper
        sx={{
          mb: 3,
          backgroundColor: '#2d2d30',
          borderRadius: 2,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant='fullWidth'
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              minHeight: { xs: 48, md: 72 },
              padding: { xs: '6px 8px', md: '12px 16px' },
              color: '#b0b0b0',
              '&.Mui-selected': {
                color: '#00fed7',
              },
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'inherit',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00fed7',
              height: 3,
              borderRadius: '2px 2px 0 0',
              transform: 'scaleX(0.85)',
              transformOrigin: 'center',
            },
            '& .MuiTouchRipple-root': {
              display: 'none',
            },
          }}
        >
          <Tab
            icon={<People sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />}
            label={`Freunde (${friends.length})`}
            iconPosition='start'
            disableRipple
          />
          <Tab
            icon={
              <Notifications sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
            }
            label={`Anfragen (${friendRequests.length})`}
            iconPosition='start'
            disableRipple
          />
          <Tab
            icon={<Search sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />}
            label='Freunde finden'
            iconPosition='start'
            disableRipple
          />
        </Tabs>
      </Paper>

      {/* Freunde Tab */}
      <TabPanel value={tabValue} index={0}>
        {friends.length === 0 ? (
          <Card
            sx={{ backgroundColor: '#2d2d30', border: '1px solid #404040' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <People sx={{ fontSize: 64, color: '#9e9e9e', mb: 2 }} />
              <Typography variant='h6' gutterBottom sx={{ color: '#e0e0e0' }}>
                Noch keine Freunde
              </Typography>
              <Typography variant='body2' color='#9e9e9e' mb={3}>
                Finde deine ersten Freunde über die Suche
              </Typography>
              <Button
                variant='contained'
                onClick={() => setTabValue(2)}
                startIcon={<PersonAdd />}
              >
                Freunde finden
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
                xl: 'repeat(4, 1fr)',
              },
              gap: { xs: 2, md: 3 },
            }}
          >
            {friends.map((friend) => {
              const currentProfile = friendProfiles[friend.uid] || friend;
              return (
                <Card
                  key={friend.uid}
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#2d2d30',
                    border: '1px solid #404040',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      backgroundColor: '#333333',
                    },
                  }}
                >
                  <CardContent
                    sx={{ flex: 1, textAlign: 'center', p: { xs: 2, md: 3 } }}
                  >
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      gap={2}
                    >
                      <Avatar
                        src={currentProfile.photoURL}
                        sx={{
                          width: { xs: 60, md: 80 },
                          height: { xs: 60, md: 80 },
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          background:
                            'linear-gradient(45deg, #00fed7, #00c5a3)',
                          border: '3px solid',
                          borderColor: '#00fed7',
                        }}
                      >
                        {currentProfile.displayName
                          ? currentProfile.displayName.charAt(0).toUpperCase()
                          : currentProfile.username.charAt(0).toUpperCase()}
                      </Avatar>

                      <Box>
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                          gutterBottom
                          sx={{
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            color: '#e0e0e0',
                          }}
                        >
                          {currentProfile.displayName ||
                            '@' + currentProfile.username}
                        </Typography>

                        {currentProfile.isOnline ? (
                          <Chip
                            label='Online'
                            size='small'
                            color='success'
                            sx={{
                              mt: 1,
                              backgroundColor: '#00fed7',
                              color: '#000',
                              fontWeight: 'bold',
                            }}
                          />
                        ) : (
                          currentProfile.lastActive && (
                            <Typography
                              variant='caption'
                              color='#9e9e9e'
                              sx={{ mt: 1, display: 'block' }}
                            >
                              Zuletzt online:{' '}
                              {new Date(
                                currentProfile.lastActive
                              ).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          )
                        )}
                      </Box>

                      <Box
                        display='flex'
                        justifyContent='center'
                        gap={1}
                        mt={2}
                        flexWrap='wrap'
                      >
                        <Button
                          size='small'
                          variant='contained'
                          color='primary'
                          startIcon={<Person />}
                          onClick={() => navigate(`/profile/${friend.uid}`)}
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            px: { xs: 1, md: 2 },
                          }}
                        >
                          Profil
                        </Button>
                        <Badge
                          badgeContent={friendUnreadActivities[friend.uid] || 0}
                          color='error'
                          invisible={
                            (friendUnreadActivities[friend.uid] || 0) === 0
                          }
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#ff4444',
                              color: 'white',
                              fontWeight: 'bold',
                              minWidth: '18px',
                              height: '18px',
                              fontSize: '0.7rem',
                            },
                          }}
                        >
                          <Button
                            size='small'
                            variant='outlined'
                            color='info'
                            startIcon={<Timeline />}
                            onClick={() => handleShowActivities(friend)}
                            sx={{
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              px: { xs: 1, md: 2 },
                            }}
                          >
                            Aktivitäten
                          </Button>
                        </Badge>
                        <Button
                          size='small'
                          variant='outlined'
                          color='error'
                          onClick={() => handleRemoveFriend(friend)}
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            px: { xs: 1, md: 2 },
                          }}
                        >
                          Entfernen
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </TabPanel>

      {/* Anfragen Tab */}
      <TabPanel value={tabValue} index={1}>
        {friendRequests.length === 0 ? (
          <Card
            sx={{ backgroundColor: '#2d2d30', border: '1px solid #404040' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Notifications sx={{ fontSize: 64, color: '#9e9e9e', mb: 2 }} />
              <Typography variant='h6' gutterBottom sx={{ color: '#e0e0e0' }}>
                Keine neuen Anfragen
              </Typography>
              <Typography variant='body2' color='#9e9e9e'>
                Du hast momentan keine ausstehenden Freundschaftsanfragen
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box display='flex' flexDirection='column' gap={{ xs: 1.5, md: 2 }}>
            {friendRequests.map((request: FriendRequest) => {
              const requestProfile = requestProfiles[request.fromUserId] || {};
              return (
                <Card
                  key={request.id}
                  elevation={1}
                  sx={{
                    backgroundColor: '#2d2d30',
                    border: '1px solid #404040',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Box
                      display='flex'
                      alignItems='center'
                      justifyContent='space-between'
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 0 },
                        textAlign: { xs: 'center', sm: 'left' },
                      }}
                    >
                      <Box
                        display='flex'
                        alignItems='center'
                        gap={2}
                        sx={{
                          flexDirection: { xs: 'column', sm: 'row' },
                          textAlign: { xs: 'center', sm: 'left' },
                        }}
                      >
                        <Avatar
                          src={requestProfile.photoURL}
                          sx={{
                            width: { xs: 48, md: 56 },
                            height: { xs: 48, md: 56 },
                            background:
                              'linear-gradient(45deg, #ff9800, #ffb74d)',
                          }}
                        >
                          {request.fromUsername?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography
                            variant='h6'
                            gutterBottom
                            sx={{
                              fontSize: { xs: '1rem', md: '1.25rem' },
                              color: '#e0e0e0',
                            }}
                          >
                            @{request.fromUsername || 'Unbekannt'}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='#9e9e9e'
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Von: {request.fromUserEmail}
                          </Typography>
                          <Typography
                            variant='caption'
                            color='#9e9e9e'
                            sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}
                          >
                            {new Date(request.sentAt).toLocaleDateString(
                              'de-DE',
                              {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        display='flex'
                        gap={1}
                        sx={{
                          flexDirection: { xs: 'row', sm: 'row' },
                          justifyContent: { xs: 'center', sm: 'flex-end' },
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        <Button
                          variant='contained'
                          color='success'
                          size='small'
                          onClick={() => handleAcceptRequest(request)}
                          startIcon={<PersonAdd />}
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            px: { xs: 1, md: 2 },
                          }}
                        >
                          Akzeptieren
                        </Button>
                        <Button
                          variant='outlined'
                          color='error'
                          size='small'
                          onClick={() => handleDeclineRequest(request.id)}
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            px: { xs: 1, md: 2 },
                          }}
                        >
                          Ablehnen
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </TabPanel>

      {/* Suche Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ backgroundColor: '#2d2d30', border: '1px solid #404040' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <TextField
              variant='outlined'
              label='Benutzername suchen'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              placeholder='Mindestens 2 Zeichen eingeben...'
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: '#9e9e9e' }} />,
              }}
              sx={{
                mb: 3,
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
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', md: '1rem' },
                },
              }}
            />

            {searching && (
              <Box display='flex' justifyContent='center' p={2}>
                <CircularProgress />
              </Box>
            )}

            {!searching &&
              searchTerm.length >= 2 &&
              searchResults.length === 0 && (
                <Typography
                  variant='body2'
                  color='#9e9e9e'
                  textAlign='center'
                  py={2}
                >
                  Keine Benutzer gefunden
                </Typography>
              )}

            {searchResults.length > 0 && (
              <List>
                {searchResults.map((user) => (
                  <React.Fragment key={user.uid}>
                    <ListItem sx={{ px: { xs: 0, md: 2 } }}>
                      <ListItemAvatar>
                        <Avatar
                          src={user.photoURL}
                          sx={{
                            width: { xs: 40, md: 48 },
                            height: { xs: 40, md: 48 },
                            fontSize: { xs: '1rem', md: '1.25rem' },
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`@${user.username}`}
                        secondary={user.displayName || undefined}
                        primaryTypographyProps={{
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          color: '#e0e0e0',
                        }}
                        secondaryTypographyProps={{
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          color: '#9e9e9e',
                        }}
                      />
                      <ListItemSecondaryAction
                        sx={{ right: { xs: 0, md: 16 } }}
                      >
                        <Box
                          display='flex'
                          alignItems='center'
                          gap={1}
                          sx={{
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 0.5, sm: 1 },
                          }}
                        >
                          {getStatusChip(user)}
                          {canSendRequest(user) && (
                            <Button
                              variant='outlined'
                              size='small'
                              onClick={() => handleSendRequest(user)}
                              startIcon={<PersonAdd />}
                              sx={{
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                px: { xs: 1, md: 2 },
                              }}
                            >
                              Hinzufügen
                            </Button>
                          )}
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />

      {/* Friend Activity Dialog */}
      <FriendActivityDialog
        open={activityDialogOpen}
        onClose={handleCloseActivityDialog}
        friendId={selectedFriendId}
        friendName={selectedFriendName}
        friendPhotoURL={selectedFriendPhotoURL}
      />
    </Container>
  );
};
