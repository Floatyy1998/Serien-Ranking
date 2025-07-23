import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useLocation } from 'react-router-dom';
import { useStats } from '../../contexts/StatsProvider';

// Chart.js Registrierung
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Legend,
  Tooltip
);

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const StatsDialog = ({ open, onClose, isMobile }: StatsDialogProps) => {
  const { seriesStatsData, movieStatsData } = useStats();
  const location = useLocation();
  const isMoviesPage = location.pathname === '/movies';
  const statsData = isMoviesPage ? movieStatsData : seriesStatsData;

  const genreColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
  ];
  const providerColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
  ];

  return (
    <Dialog
      sx={{ textAlign: 'center !important' }}
      open={open}
      onClose={onClose}
      fullWidth
      disableAutoFocus={true}
      disableEnforceFocus={false}
      disableRestoreFocus={false}
      keepMounted={false}
    >
      <DialogTitle>
        Statistiken
        <IconButton
          aria-label='close'
          onClick={onClose}
          className='closeButton'
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {statsData && (
          <>
            <Box
              sx={{
                border: '1px solid rgb(0, 254, 215)',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-around',
                mb: 10,
              }}
            >
              <Box>
                <Typography variant='h4'>
                  Gesehene {isMoviesPage ? 'Filme' : 'Serien'}
                </Typography>
                <Typography style={{ color: 'white' }} variant='body1'>
                  {statsData.userStats.seriesRated}
                </Typography>
              </Box>
              <Box>
                <Typography variant='h4'>Gesehene Episoden</Typography>
                <Typography style={{ color: 'white' }} variant='body1'>
                  {statsData.userStats.episodesWatched}
                </Typography>
              </Box>
              <Box>
                <Typography variant='h4'>Verbrachte Zeit</Typography>
                <Typography style={{ color: 'white' }} variant='body1'>
                  {statsData.userStats.watchtime.join(' ')}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 2,
                width: '100%',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant='h4'>
                  Anzahl der {isMoviesPage ? 'Filme' : 'Serien'} pro Genre
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px',
                    border: '1px solid rgb(0, 254, 215)',
                    padding: '10px',
                    width: '100%',
                    borderRadius: '8px',
                  }}
                >
                  <Doughnut
                    data={{
                      labels: statsData.genres.map((genre) => genre.name),
                      datasets: [
                        {
                          label: 'Häufigkeit',
                          data: statsData.genres.map((genre) => genre.count),
                          backgroundColor: genreColors,
                          hoverBackgroundColor: genreColors,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            color: 'white',
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `${context.label}: ${Number(context.raw)}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h4'>
                  Durchschnittliche Bewertung der Genres
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px',
                    border: '1px solid rgb(0, 254, 215)',
                    padding: '10px',
                    width: '100%',
                    borderRadius: '8px',
                  }}
                >
                  <Bar
                    data={{
                      labels: statsData.genres.map((genre) => genre.name),
                      datasets: [
                        {
                          label: 'Durchschnittliche Bewertung',
                          data: statsData.genres.map(
                            (genre) => genre.averageRating
                          ),
                          backgroundColor: genreColors,
                          borderColor: genreColors,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          ticks: {
                            color: 'white',
                          },
                        },
                        x: {
                          ticks: {
                            color: 'white',
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                          position: 'top',
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `${context.label}: ${Number(
                                context.raw
                              ).toFixed(2)}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 2,
                width: '100%',
                mt: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant='h4'>
                  Anzahl der {isMoviesPage ? 'Filme' : 'Serien'} pro Anbieter
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px',
                    border: '1px solid rgb(0, 254, 215)',
                    padding: '10px',
                    width: '100%',
                    borderRadius: '8px',
                  }}
                >
                  <Doughnut
                    data={{
                      labels: statsData.providers.map(
                        (provider) => provider.name
                      ),
                      datasets: [
                        {
                          label: 'Häufigkeit',
                          data: statsData.providers.map(
                            (provider) => provider.count
                          ),
                          backgroundColor: providerColors,
                          hoverBackgroundColor: providerColors,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            color: 'white',
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `${context.label}: ${Number(context.raw)}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h4'>
                  Durchschnittliche Bewertung der Anbieter
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px',
                    border: '1px solid rgb(0, 254, 215)',
                    padding: '10px',
                    width: '100%',
                    borderRadius: '8px',
                  }}
                >
                  <Bar
                    data={{
                      labels: statsData.providers.map(
                        (provider) => provider.name
                      ),
                      datasets: [
                        {
                          label: 'Durchschnittliche Bewertung',
                          data: statsData.providers.map(
                            (provider) => provider.averageRating
                          ),
                          backgroundColor: providerColors,
                          borderColor: providerColors,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          ticks: {
                            color: 'white',
                          },
                        },
                        x: {
                          ticks: {
                            color: 'white',
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                          position: 'top',
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `${context.label}: ${Number(
                                context.raw
                              ).toFixed(2)}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StatsDialog;
