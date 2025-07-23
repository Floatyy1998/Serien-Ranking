import { Share, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useFriends } from '../../contexts/FriendsProvider';

interface ShareWithFriendsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ShareWithFriendsDialog: React.FC<ShareWithFriendsDialogProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth()!;
  const { friends } = useFriends();
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadPublicSetting = async () => {
      if (!user) return;

      try {
        const userRef = firebase.database().ref(`users/${user.uid}/isPublic`);
        const snapshot = await userRef.once('value');
        setIsPublic(snapshot.val() || false);
      } catch (error) {
        console.error('Error loading public setting:', error);
      }
    };

    if (open) {
      loadPublicSetting();
    }
  }, [open, user]);

  const handleTogglePublic = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const newPublicState = !isPublic;

      await firebase
        .database()
        .ref(`users/${user.uid}/isPublic`)
        .set(newPublicState);
      setIsPublic(newPublicState);

      setMessage(
        newPublicState
          ? 'Deine Liste ist jetzt öffentlich sichtbar!'
          : 'Deine Liste ist jetzt privat!'
      );
    } catch (error) {
      console.error('Error updating public setting:', error);
      setMessage('Fehler beim Aktualisieren der Einstellung');
    } finally {
      setLoading(false);
    }
  };

  const copyFriendLink = (friendId: string, friendUsername: string) => {
    const link = `${window.location.origin}/friend/${friendId}`;
    navigator.clipboard.writeText(link);
    setMessage(`Link für ${friendUsername} kopiert!`);
  };

  const generateMyPublicLink = () => {
    const link = `${window.location.origin}/friend/${user?.uid}`;
    navigator.clipboard.writeText(link);
    setMessage('Dein öffentlicher Link wurde kopiert!');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <Share />
          Mit Freunden teilen
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display='flex' flexDirection='column' gap={3}>
          {/* Öffentliche Einstellung */}
          <Card variant='outlined'>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h6' gutterBottom>
                    Öffentliche Liste
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {isPublic
                      ? 'Jeder kann deine Liste mit einem Link sehen'
                      : 'Nur deine Freunde können deine Liste sehen'}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={handleTogglePublic}
                      disabled={loading}
                      icon={<VisibilityOff />}
                      checkedIcon={<Visibility />}
                    />
                  }
                  label=''
                />
              </Box>

              {isPublic && (
                <Box mt={2}>
                  <Button
                    variant='outlined'
                    onClick={generateMyPublicLink}
                    fullWidth
                    startIcon={<Share />}
                  >
                    Öffentlichen Link kopieren
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Freunde-Liste */}
          <Box>
            <Typography variant='h6' gutterBottom>
              Freunde-Listen anzeigen
            </Typography>
            <Typography variant='body2' color='text.secondary' mb={2}>
              Klicke auf einen Freund, um dessen Liste zu sehen
            </Typography>

            {friends.length === 0 ? (
              <Card variant='outlined'>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Du hast noch keine Freunde. Füge Freunde hinzu, um ihre
                    Listen zu sehen!
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <List>
                {friends.map((friend) => (
                  <ListItem
                    key={friend.uid}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={friend.photoURL}>
                        {friend.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`@${friend.username}`}
                      secondary={friend.displayName}
                    />
                    <Box display='flex' gap={1}>
                      <Button
                        size='small'
                        variant='contained'
                        onClick={() => {
                          window.open(`/friend/${friend.uid}`, '_blank');
                        }}
                      >
                        Liste ansehen
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() =>
                          copyFriendLink(friend.uid, friend.username)
                        }
                      >
                        Link kopieren
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Feedback */}
          {message && (
            <Box
              sx={{
                p: 2,
                backgroundColor: 'success.light',
                color: 'success.contrastText',
                borderRadius: 1,
              }}
            >
              <Typography variant='body2'>{message}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
};
