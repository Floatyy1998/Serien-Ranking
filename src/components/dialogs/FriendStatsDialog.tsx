import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Bar } from 'react-chartjs-2';
import { Friend, FriendStats } from '../../interfaces/Friend';

interface FriendStatsDialogProps {
  open: boolean;
  onClose: () => void;
  friend: Friend;
  stats: FriendStats;
}

const FriendStatsDialog = ({
  open,
  onClose,
  friend,
  stats,
}: FriendStatsDialogProps) => {
  const theme = useTheme();

  const genreChartData = {
    labels: stats.favoriteGenres.slice(0, 5), // Top 5 Genres
    datasets: [
      {
        label: 'Anzahl Serien/Filme',
        data: [8, 6, 4, 3, 2], // Dummy data - würde aus echten Stats kommen
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const formatWatchtime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} Tage, ${hours % 24} Stunden`;
    } else if (hours > 0) {
      return `${hours} Stunden, ${minutes % 60} Minuten`;
    } else {
      return `${minutes} Minuten`;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={friend.photoURL || undefined}
            sx={{ width: 48, height: 48 }}
          >
            {friend.displayName?.[0] || friend.email[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant='h6'>
              {friend.displayName || friend.email.split('@')[0]}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Statistiken
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Übersicht Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
            }}
          >
            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='primary'>
                  {stats.totalSeries}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Serien
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='secondary'>
                  {stats.totalMovies}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Filme
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='warning.main'>
                  {formatWatchtime(stats.totalWatchtime)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Gesamte Watchzeit
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='success.main'>
                  {stats.averageRating.toFixed(1)}/10
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Durchschnittliche Bewertung
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Lieblingsgenres */}
          <Card sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Lieblingsgenres
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {stats.favoriteGenres.slice(0, 8).map((genre, index) => (
                  <Chip
                    key={genre}
                    label={genre}
                    size='small'
                    color={index < 3 ? 'primary' : 'default'}
                    variant={index < 3 ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              {/* Genre Chart */}
              <Box sx={{ height: 200 }}>
                <Bar data={genreChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>

          {/* Letzte Aktivitäten */}
          <Card sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Letzte Aktivitäten
              </Typography>
              {stats.recentActivity.length === 0 ? (
                <Typography color='text.secondary'>
                  Keine Aktivitäten vorhanden
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: theme.palette.action.hover,
                      }}
                    >
                      <Typography component='span' sx={{ fontSize: '1.2em' }}>
                        {activity.type === 'series_added' && '📺'}
                        {activity.type === 'movie_added' && '🎬'}
                        {activity.type === 'rating_updated' && '⭐'}
                        {activity.type === 'episode_watched' && '✅'}
                        {activity.type === 'episodes_watched' && '📱'}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant='body2'>
                          {activity.type === 'series_added' &&
                            `Serie "${activity.itemTitle}" hinzugefügt`}
                          {activity.type === 'movie_added' &&
                            `Film "${activity.itemTitle}" hinzugefügt`}
                          {activity.type === 'rating_updated' &&
                            `"${activity.itemTitle}" mit ${activity.rating}/10 bewertet`}
                          {activity.type === 'episode_watched' &&
                            `Episode von "${activity.itemTitle}" geschaut`}
                          {activity.type === 'episodes_watched' &&
                            `"${activity.itemTitle}" geschaut`}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            locale: de,
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FriendStatsDialog;
