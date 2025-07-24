import {
  CalendarToday,
  Close,
  Delete,
  FastForward,
  Movie,
  PlayArrow,
  Star,
  Timeline,
  Tv,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  Slide,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';

interface ActivityItem {
  id: string;
  type:
    | 'series_added'
    | 'series_deleted'
    | 'episode_watched'
    | 'episodes_watched'
    | 'series_rated'
    | 'rating_updated'
    | 'movie_added'
    | 'movie_deleted'
    | 'movie_rated';
  itemTitle?: string; // Neues universelles Feld
  seriesTitle?: string;
  movieTitle?: string;
  episodeInfo?: string;
  rating?: number;
  timestamp: number;
}

interface FriendActivityDialogProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
  friendPhotoURL?: string;
}

export const FriendActivityDialog: React.FC<FriendActivityDialogProps> = ({
  open,
  onClose,
  friendId,
  friendName,
  friendPhotoURL,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !friendId) return;

    const loadActivities = async () => {
      setLoading(true);
      try {
        const activitiesRef = firebase.database().ref(`activities/${friendId}`);
        const snapshot = await activitiesRef
          .orderByChild('timestamp')
          .limitToLast(20)
          .once('value');

        if (snapshot.exists()) {
          const data = snapshot.val();
          const activityList = Object.entries(data).map(
            ([id, activity]: [string, any]) => ({
              id,
              ...activity,
            })
          );

          // Sortiere nach Timestamp (neueste zuerst)
          activityList.sort((a, b) => b.timestamp - a.timestamp);
          setActivities(activityList);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [open, friendId]);

  const getActivityIcon = (type: string) => {
    const iconStyle = { fontSize: 20, color: 'white' };
    switch (type) {
      case 'series_added':
        return <Tv sx={iconStyle} />;
      case 'series_deleted':
        return <Delete sx={iconStyle} />;
      case 'episode_watched':
        return <PlayArrow sx={iconStyle} />;
      case 'episodes_watched':
        return <FastForward sx={iconStyle} />;
      case 'series_rated':
        return <Star sx={iconStyle} />;
      case 'movie_added':
        return <Movie sx={iconStyle} />;
      case 'movie_deleted':
        return <Delete sx={iconStyle} />;
      case 'movie_rated':
        return <Star sx={iconStyle} />;
      default:
        return <Timeline sx={iconStyle} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'series_added':
      case 'movie_added':
        return '#4caf50';
      case 'series_deleted':
      case 'movie_deleted':
        return '#f44336';
      case 'episode_watched':
      case 'episodes_watched':
        return '#00fed7';
      case 'series_rated':
      case 'movie_rated':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getActivityEmoji = (type: string) => {
    switch (type) {
      case 'series_added':
        return '📺';
      case 'series_deleted':
        return '🗑️';
      case 'episode_watched':
        return '▶️';
      case 'episodes_watched':
        return '⏩';
      case 'series_rated':
        return '⭐';
      case 'movie_added':
        return '🎬';
      case 'movie_deleted':
        return '🗑️';
      case 'movie_rated':
        return '⭐';
      default:
        return '📊';
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const title =
      activity.itemTitle ||
      activity.seriesTitle ||
      activity.movieTitle ||
      'Unbekannter Titel';

    switch (activity.type) {
      case 'series_added':
        return `hat die Serie "${title}" hinzugefügt`;
      case 'series_deleted':
        return `hat die Serie "${title}" entfernt`;
      case 'episode_watched':
        // Prüfen ob der Titel bereits Episode-Info enthält (z.B. "Serie - Staffel X Episode Y")
        if (title.includes(' - Staffel ') && title.includes(' Episode ')) {
          // Titel enthält bereits Episode-Info, verwende ihn direkt
          const parts = title.split(' - ');
          const seriesName = parts[0];
          const episodeInfo = parts.slice(1).join(' - ');
          return `hat "${seriesName}" ${episodeInfo} geschaut`;
        } else {
          // Verwende separaten episodeInfo
          return `hat "${title}"${
            activity.episodeInfo ? ` ${activity.episodeInfo}` : ' eine Episode'
          } geschaut`;
        }
      case 'episodes_watched':
        return `hat "${title}" geschaut`;
      case 'series_rated':
      case 'rating_updated':
        return `hat "${title}" bewertet${
          activity.rating ? ` (${activity.rating}/10)` : ''
        }`;
      case 'movie_added':
        return `hat den Film "${title}" hinzugefügt`;
      case 'movie_deleted':
        return `hat den Film "${title}" entfernt`;
      case 'movie_rated':
        return `hat "${title}" bewertet${
          activity.rating ? ` (${activity.rating}/10)` : ''
        }`;
      default:
        return 'Unbekannte Aktivität';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'vor wenigen Minuten';
    } else if (diffInHours < 24) {
      return `vor ${Math.floor(diffInHours)} Stunden`;
    } else if (diffInHours < 168) {
      // 7 Tage
      const days = Math.floor(diffInHours / 24);
      return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        },
      }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' } as any}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
          color: 'white',
          textAlign: 'center',
          py: 3,
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          <Close />
        </IconButton>

        <Box display='flex' alignItems='center' justifyContent='center' gap={2}>
          <Avatar
            src={friendPhotoURL || undefined}
            sx={{
              width: 50,
              height: 50,
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              bgcolor: '#00fed7',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {friendName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant='h5' fontWeight='700' sx={{ mb: 0.5 }}>
              {getActivityEmoji('default')} {friendName}s Aktivitäten
            </Typography>
            <Chip
              label='Die letzten 20 Aktivitäten'
              size='small'
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: '#1e1e1e' }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              <Timeline sx={{ fontSize: 80, color: '#00fed7', mb: 2 }} />
            </Box>
            <Typography variant='h6' color='#00fed7'>
              Lade Aktivitäten...
            </Typography>
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Timeline
              sx={{ fontSize: 80, color: '#9e9e9e', mb: 3, opacity: 0.5 }}
            />
            <Typography
              variant='h5'
              gutterBottom
              fontWeight='600'
              color='#e0e0e0'
            >
              Keine Aktivitäten
            </Typography>
            <Typography variant='body1' color='#9e9e9e'>
              {friendName} hat noch keine Aktivitäten
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {activities.map((activity, index) => (
              <Fade key={activity.id} in timeout={300 + index * 100}>
                <Card
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    backgroundColor: '#2d2d30',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    border: '1px solid #404040',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                      backgroundColor: '#333333',
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 4,
                      backgroundColor: getActivityColor(activity.type),
                      borderRadius: '2px',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Box display='flex' alignItems='flex-start' gap={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: getActivityColor(activity.type),
                          boxShadow: `0 4px 12px ${getActivityColor(
                            activity.type
                          )}33`,
                          flexShrink: 0,
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Box>

                      <Box flex={1} minWidth={0}>
                        <Typography
                          variant='body1'
                          sx={{
                            mb: 1,
                            fontWeight: 500,
                            lineHeight: 1.4,
                            color: '#e0e0e0',
                          }}
                        >
                          <Box
                            component='span'
                            sx={{ fontWeight: 700, color: '#00fed7' }}
                          >
                            {friendName}
                          </Box>{' '}
                          {getActivityText(activity)}
                        </Typography>

                        <Box display='flex' alignItems='center' gap={1}>
                          <CalendarToday
                            sx={{ fontSize: 16, color: '#9e9e9e' }}
                          />
                          <Chip
                            label={formatTimestamp(activity.timestamp)}
                            size='small'
                            variant='outlined'
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              borderColor: '#404040',
                              color: '#b0b0b0',
                              backgroundColor: '#1a1a1a',
                            }}
                          />
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          fontSize: '1.5rem',
                          opacity: 0.6,
                          flexShrink: 0,
                        }}
                      >
                        {getActivityEmoji(activity.type)}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FriendActivityDialog;
