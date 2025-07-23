import { Box, Button, Typography } from '@mui/material';
import { useFriends } from '../../contexts/FriendsProvider';

// Debug-Komponente um das Notification-System zu testen
const FriendsDebugPanel = () => {
  const {
    unreadRequestsCount,
    unreadActivitiesCount,
    markRequestsAsRead,
    markActivitiesAsRead,
    updateUserActivity,
  } = useFriends();

  const createTestActivity = async () => {
    await updateUserActivity({
      type: 'series_added',
      itemTitle: 'Test Serie ' + Date.now(),
      itemId: Math.floor(Math.random() * 1000),
    });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, m: 2 }}>
      <Typography variant='h6' gutterBottom>
        🐛 Friends Debug Panel
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Typography>
          Ungelesene Anfragen: <strong>{unreadRequestsCount}</strong>
        </Typography>
        <Typography>
          Ungelesene Aktivitäten: <strong>{unreadActivitiesCount}</strong>
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size='small' variant='outlined' onClick={markRequestsAsRead}>
          Anfragen als gelesen markieren
        </Button>

        <Button size='small' variant='outlined' onClick={markActivitiesAsRead}>
          Aktivitäten als gelesen markieren
        </Button>

        <Button size='small' variant='contained' onClick={createTestActivity}>
          Test-Aktivität erstellen
        </Button>
      </Box>
    </Box>
  );
};

export default FriendsDebugPanel;
