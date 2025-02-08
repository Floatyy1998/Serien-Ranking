import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Bar, Doughnut } from 'react-chartjs-2';
import { StatsData } from '../../interfaces/StatsData';

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  statsData: StatsData | null;
  isMobile: boolean;
}

const StatsDialog = ({
  open,
  onClose,
  statsData,
  isMobile,
}: StatsDialogProps) => {
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
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          fontSize: '1.5rem',
          paddingLeft: 6,
          paddingRight: 6,
        }}
      >
        Statistiken
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'red',
          }}
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
                <Typography variant='h4'>Geschaute Serien</Typography>
                <Typography style={{ color: 'white' }} variant='body1'>
                  {statsData.userStats.seriesRated}
                </Typography>
              </Box>
              <Box>
                <Typography variant='h4'>Geschaute Episoden</Typography>
                <Typography style={{ color: 'white' }} variant='body1'>
                  {statsData.userStats.episodesWatched}
                </Typography>
              </Box>
              <Box>
                <Typography variant='h4'>Geschaute Zeit</Typography>
                <Typography style={{ color: 'white' }} variant='body1'>
                  {statsData.userStats.watchtime}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} columns={2}>
              <Grid item xs={12} lg={6}>
                <Typography variant='h4'>
                  Anzahl der Serien pro Genre
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px', // Erhöhte Höhe
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
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography variant='h4'>
                  Durchschnittliche Bewertung der Genres
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px', // Erhöhte Höhe
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
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography variant='h4'>
                  {' '}
                  Anzahl der Serien Pro Anbieter
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px', // Erhöhte Höhe
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
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography variant='h4'>
                  Durchschnittliche Bewertung der Anbieter
                </Typography>
                <Box
                  sx={{
                    overflow: 'auto',
                    height: '580px', // Erhöhte Höhe
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
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StatsDialog;
