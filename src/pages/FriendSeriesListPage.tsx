import { ArrowBack } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import SeriesGrid from '../components/series/SeriesGrid';

interface FriendSeriesData {
  friendProfile: any;
  isFriend: boolean;
  isPublic: boolean;
}

export const FriendSeriesListPage: React.FC = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuth()!;
  const navigate = useNavigate();

  const [friendData, setFriendData] = useState<FriendSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFriendData = async () => {
      if (!friendId || !user) return;

      try {
        setLoading(true);

        // Freund-Profil laden
        const friendRef = firebase.database().ref(`users/${friendId}`);
        const friendSnapshot = await friendRef.once('value');

        if (!friendSnapshot.exists()) {
          setError('Benutzer nicht gefunden');
          return;
        }

        const friendProfile = friendSnapshot.val();

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
            (req) => req.toUserId === friendId && req.status === 'accepted'
          );
        }

        // Rückrichtung prüfen
        if (!isFriend) {
          const backwardSnapshot = await friendsRef
            .orderByChild('fromUserId')
            .equalTo(friendId)
            .once('value');

          if (backwardSnapshot.exists()) {
            const requests = Object.values(backwardSnapshot.val()) as any[];
            isFriend = requests.some(
              (req) => req.toUserId === user.uid && req.status === 'accepted'
            );
          }
        }

        setFriendData({
          friendProfile,
          isFriend,
          isPublic: friendProfile.isPublic || false,
        });
      } catch (error) {
        console.error('Error loading friend data:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    loadFriendData();
  }, [friendId, user]);

  // Separater useEffect für Realtime Online-Status Updates
  useEffect(() => {
    if (!friendId || !friendData) return;

    const onlineStatusRef = firebase
      .database()
      .ref(`users/${friendId}/isOnline`);
    const lastActiveRef = firebase
      .database()
      .ref(`users/${friendId}/lastActive`);

    const onlineListener = onlineStatusRef.on('value', (snapshot) => {
      const isOnline = snapshot.val() || false;
      setFriendData((prev) =>
        prev
          ? {
              ...prev,
              friendProfile: {
                ...prev.friendProfile,
                isOnline,
              },
            }
          : null
      );
    });

    const lastActiveListener = lastActiveRef.on('value', (snapshot) => {
      const lastActive = snapshot.val();
      setFriendData((prev) =>
        prev
          ? {
              ...prev,
              friendProfile: {
                ...prev.friendProfile,
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
  }, [friendId, friendData?.friendProfile?.username]); // Abhängigkeit auf username um zu vermeiden, dass es sich selbst triggert

  const canViewList = () => {
    if (!friendData) return false;
    if (friendId === user?.uid) return true; // Eigene Liste
    return friendData.isFriend || friendData.isPublic;
  };

  if (loading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Typography variant='h6' textAlign='center'>
          Lade Daten...
        </Typography>
      </Container>
    );
  }

  if (error || !friendData) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
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

  if (!canViewList()) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Avatar
              src={friendData.friendProfile.photoURL}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            >
              {friendData.friendProfile.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant='h5' gutterBottom>
              @{friendData.friendProfile.username}
            </Typography>
            <Typography variant='body1' color='text.secondary' mb={3}>
              Diese Liste ist privat. Du musst mit diesem Benutzer befreundet
              sein, um sie zu sehen.
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

  const isOwnList = friendId === user?.uid;

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={4}
        sx={{
          background: isOwnList
            ? 'linear-gradient(135deg, #00fed7 0%, #00c5a3 100%)'
            : 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
          borderRadius: 2,
          p: 3,
          color: 'white',
        }}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Avatar
            src={friendData.friendProfile.photoURL}
            sx={{ width: 60, height: 60 }}
          >
            {friendData.friendProfile.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography
              variant='h4'
              component='h1'
              gutterBottom
              fontWeight='bold'
            >
              {isOwnList
                ? '📺 Meine Liste'
                : `📺 ${friendData.friendProfile.username}s Liste`}
            </Typography>
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='body1' sx={{ opacity: 0.9 }}>
                {friendData.friendProfile.displayName ||
                  friendData.friendProfile.username}
              </Typography>
              {friendData.friendProfile.isOnline && (
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
              {!isOwnList && (
                <Chip
                  label={friendData.isFriend ? 'Freund' : 'Öffentlich'}
                  size='small'
                  color='success'
                />
              )}
            </Box>
          </Box>
        </Box>

        <Button
          variant='contained'
          onClick={() => navigate(isOwnList ? '/' : '/friends')}
          startIcon={<ArrowBack />}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          {isOwnList ? 'Zurück' : 'Zu Freunden'}
        </Button>
      </Box>

      {/* Serien-Grid für den Freund */}
      <SeriesGrid
        searchValue=''
        selectedGenre='All'
        selectedProvider='All'
        viewOnlyMode={!isOwnList}
        targetUserId={friendId}
      />
    </Container>
  );
};
