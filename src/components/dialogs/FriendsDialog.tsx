import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Snackbar,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import React, { useState } from 'react';
import { useFriends } from '../../contexts/FriendsProvider';
import { Friend, FriendActivity, FriendRequest } from '../../interfaces/Friend';
import { AddFriendDialog } from './AddFriendDialog';

interface FriendsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role='tabpanel' hidden={value !== index}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

const FriendsDialog = ({ open, onClose }: FriendsDialogProps) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');

  const {
    friends,
    friendRequests,
    sentRequests,
    friendActivities,
    unreadRequestsCount,
    unreadActivitiesCount,
    markRequestsAsRead,
    markActivitiesAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useFriends();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    // Markiere entsprechende Benachrichtigungen als gelesen
    if (newValue === 1) {
      // Anfragen Tab
      markRequestsAsRead();
    } else if (newValue === 3) {
      // Aktivität Tab
      markActivitiesAsRead();
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setSnackbarMessage('Freundschaftsanfrage angenommen!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Fehler beim Annehmen der Anfrage');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      setSnackbarMessage('Freundschaftsanfrage abgelehnt');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Fehler beim Ablehnen der Anfrage');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      setSnackbarMessage('Freund entfernt');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Fehler beim Entfernen des Freundes');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'series_added':
        return '📺';
      case 'movie_added':
        return '🎬';
      case 'rating_updated':
        return '⭐';
      case 'episode_watched':
        return '✅';
      default:
        return '📝';
    }
  };

  const getActivityText = (activity: FriendActivity) => {
    switch (activity.type) {
      case 'series_added':
        return `hat "${activity.itemTitle}" hinzugefügt`;
      case 'movie_added':
        return `hat "${activity.itemTitle}" hinzugefügt`;
      case 'rating_updated':
        return `hat "${activity.itemTitle}" mit ${activity.rating}/10 bewertet`;
      case 'episode_watched':
        return `hat eine Episode von "${activity.itemTitle}" geschaut`;
      default:
        return 'unbekannte Aktivität';
    }
  };

  const renderFriendsList = () => (
    <List>
      {friends.length === 0 ? (
        <ListItem>
          <ListItemText
            primary='Noch keine Freunde'
            secondary='Suche nach Benutzernamen um Freunde hinzuzufügen!'
          />
        </ListItem>
      ) : (
        friends.map((friend: Friend) => (
          <ListItem key={friend.uid}>
            <ListItemAvatar>
              <Badge
                color={friend.isOnline ? 'success' : 'default'}
                variant='dot'
                overlap='circular'
              >
                <Avatar src={friend.photoURL || undefined}>
                  {friend.username?.[0]?.toUpperCase() ||
                    friend.displayName?.[0]?.toUpperCase() ||
                    '?'}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={`@${friend.username}`}
              secondary={
                <Box>
                  <Typography variant='body2' component='span'>
                    {friend.displayName && `${friend.displayName} • `}
                    Befreundet seit{' '}
                    {formatDistanceToNow(new Date(friend.friendsSince), {
                      locale: de,
                      addSuffix: true,
                    })}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Button
                size='small'
                color='error'
                onClick={() => handleRemoveFriend(friend.uid)}
              >
                Entfernen
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))
      )}
    </List>
  );

  const renderFriendRequests = () => (
    <List>
      {friendRequests.length === 0 ? (
        <ListItem>
          <ListItemText primary='Keine neuen Freundschaftsanfragen' />
        </ListItem>
      ) : (
        friendRequests.map((request: FriendRequest) => (
          <ListItem key={request.id}>
            <ListItemAvatar>
              <Avatar>
                {(request as any).fromUsername?.[0]?.toUpperCase() ||
                  request.fromUserEmail[0].toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={`@${
                (request as any).fromUsername ||
                request.fromUserEmail.split('@')[0]
              }`}
              secondary={`Freundschaftsanfrage`}
            />
            <ListItemSecondaryAction>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size='small'
                  variant='contained'
                  color='primary'
                  onClick={() => handleAcceptRequest(request.id)}
                >
                  Annehmen
                </Button>
                <Button
                  size='small'
                  color='error'
                  onClick={() => handleDeclineRequest(request.id)}
                >
                  Ablehnen
                </Button>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))
      )}
    </List>
  );

  const renderSentRequests = () => (
    <List>
      {sentRequests.length === 0 ? (
        <ListItem>
          <ListItemText primary='Keine gesendeten Anfragen' />
        </ListItem>
      ) : (
        sentRequests.map((request: FriendRequest) => (
          <ListItem key={request.id}>
            <ListItemAvatar>
              <Avatar>{request.toUserEmail[0].toUpperCase()}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={request.toUserEmail.split('@')[0]}
              secondary={`Anfrage an ${request.toUserEmail} gesendet`}
            />
          </ListItem>
        ))
      )}
    </List>
  );

  const renderActivity = () => (
    <Box>
      {friendActivities.length === 0 ? (
        <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          Noch keine Aktivitäten von deinen Freunden
        </Typography>
      ) : (
        friendActivities.map((activity: FriendActivity) => (
          <Card
            key={activity.id}
            sx={{ mb: 1, bgcolor: theme.palette.background.paper }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component='span' sx={{ fontSize: '1.2em' }}>
                  {getActivityIcon(activity.type)}
                </Typography>
                <Typography variant='body2'>
                  <strong>{activity.userName}</strong>{' '}
                  {getActivityText(activity)}
                </Typography>
              </Box>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mt: 0.5 }}
              >
                {formatDistanceToNow(new Date(activity.timestamp), {
                  locale: de,
                  addSuffix: true,
                })}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', maxHeight: '80vh' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6'>Freunde</Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label={`Freunde (${friends.length})`} />
            <Tab
              label={
                <Badge badgeContent={unreadRequestsCount} color='error'>
                  Anfragen
                </Badge>
              }
            />
            <Tab label='Gesendet' />
            <Tab
              label={
                <Badge badgeContent={unreadActivitiesCount} color='error'>
                  Aktivität
                </Badge>
              }
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 2 }}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Neuen Freund hinzufügen
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddFriendDialogOpen(true)}
                  fullWidth
                >
                  Freund suchen
                </Button>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            {renderFriendsList()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderFriendRequests()}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderSentRequests()}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {renderActivity()}
          </TabPanel>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <AddFriendDialog
        open={addFriendDialogOpen}
        onClose={() => setAddFriendDialogOpen(false)}
      />
    </>
  );
};

export default FriendsDialog;
