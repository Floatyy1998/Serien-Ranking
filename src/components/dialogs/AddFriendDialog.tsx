import { PersonAdd, Search } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useFriends } from '../../contexts/FriendsProvider';
import { UserSearchResult } from '../../interfaces/Friend';

interface AddFriendDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AddFriendDialog: React.FC<AddFriendDialogProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth()!;
  const { sendFriendRequest, friends, sentRequests } = useFriends();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Debounced search
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

        // Eigenen Account ausschließen
        if (uid === user.uid) return;

        // Nur Nutzer mit Username anzeigen
        if (!userData.username) return;

        // Suche in Username und DisplayName
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

      // Nach Username sortieren
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

      // Status in Suchergebnissen aktualisieren
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
            backgroundColor: 'black',
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <PersonAdd />
          Freunde hinzufügen
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display='flex' flexDirection='column' gap={2}>
          {/* Suchfeld */}
          <TextField
            sx={{ mt: 1 }}
            variant='outlined'
            label='Benutzername suchen'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            placeholder='Mindestens 2 Zeichen eingeben...'
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />

          {/* Suchergebnisse */}
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
                color='text.secondary'
                textAlign='center'
                py={2}
              >
                Keine Benutzer gefunden
              </Typography>
            )}

          {searchResults.length > 0 && (
            <List>
              {searchResults.map((user) => (
                <ListItem
                  key={user.uid}
                  secondaryAction={
                    <Box display='flex' alignItems='center' gap={1}>
                      {getStatusChip(user)}
                      {canSendRequest(user) && (
                        <Button
                          variant='outlined'
                          size='small'
                          onClick={() => handleSendRequest(user)}
                          startIcon={<PersonAdd />}
                        >
                          Hinzufügen
                        </Button>
                      )}
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={user.photoURL}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`@${user.username}`}
                    secondary={user.displayName || undefined}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {/* Feedback */}
          {error && (
            <Alert severity='error' onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
};
