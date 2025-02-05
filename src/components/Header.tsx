import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid2 as Grid,
  IconButton,
  List,
  ListItem,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
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
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database'; // Fügen Sie diesen Import hinzu
import { BarChartIcon, MenuIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import notFound from '../assets/notFound.jpg';
import { Series } from '../interfaces/Series';
import { calculateOverallRating } from '../utils/rating';

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

interface HeaderProps {
  isNavOpen: boolean;
  setIsNavOpen: (open: boolean) => void;
  setIsStatsOpen: (open: boolean) => void;
}

interface Serien {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  first_air_date: string;
  name: string;
  vote_average: number;
  vote_count: number;
}

interface StatsData {
  genres: {
    name: string;
    count: number;
    totalRating: number;
    averageRating: number;
  }[];
  providers: {
    name: string;
    count: number;
    totalRating: number;
    averageRating: number;
  }[];
  userStats: {
    watchtime: string[];
    episodesWatched: number;
    seriesRated: number;
  };
}

export const Header = memo(({ isNavOpen, setIsNavOpen }: HeaderProps) => {
  const auth = useAuth();
  const { user, setUser } = auth || {};
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [, setSearchValue] = useState('');
  const [options, setOptions] = useState<Serien[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Serien | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const location = useLocation();
  const navigate = useNavigate();

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    if (user) {
      const ref = firebase.database().ref(`${user.uid}/serien`);
      ref.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          return;
        }
        setSeriesList(Object.values(data));
      });
    }
  }, [user]);

  if (!auth) {
    return null; // or handle the error appropriately
  }
  function secondsToString(minutes: number) {
    let value = minutes;

    const units: { [key: string]: number } = {
      Jahre: 24 * 60 * 365,
      Monate: 24 * 60 * 30,
      Tage: 24 * 60,
      Stunden: 60,
      Minuten: 1,
    };

    const result = [];

    for (const name in units) {
      const p = Math.floor(value / units[name as keyof typeof units]);
      if (p > 0) result.push(p + ' ' + name + ' ');

      value %= units[name];
    }
    return result;
  }
  const handleLogin = useCallback(() => {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        if (setUser) {
          setUser(userCredential.user);
        }
        setLoginDialogOpen(false);
        setIsNavOpen(false); // Drawer schließen
      })
      .catch((error) => {
        alert(error.message);
      });
  }, [email, password, setUser, setIsNavOpen]);

  const handleLogout = useCallback(() => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        if (setUser) {
          setUser(null);
        }
        setIsNavOpen(false); // Drawer schließen
      });
  }, [setUser, setIsNavOpen]);

  const handleSearchChange = useCallback(
    async (_event: React.ChangeEvent<unknown>, value: string) => {
      setSearchValue(value);
      if (value.length >= 3) {
        const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
        const response = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${value}`
        );
        const data = await response.json();
        setOptions(data.results || []);
      }
    },
    []
  );

  const handleAddSeries = useCallback(async () => {
    if (!user) {
      setSnackbarMessage(
        'Bitte loggen Sie sich ein, um eine Serie hinzuzufügen.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (selectedSeries) {
      setSnackbarMessage('Serie wird hinzugefügt');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);

      const seriesData = {
        id: selectedSeries.id.toString(),
        data: {
          user: import.meta.env.VITE_USER,
          id: selectedSeries.id,
          uuid: user.uid,
        },
      };

      try {
        const res = await fetch(`https://serienapi.konrad-dinges.de/add`, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(seriesData.data),
        });

        if (res.ok) {
          setSnackbarMessage('Serie hinzugefügt!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          const msgJson = await res.json();

          if (msgJson.error !== 'Serie bereits vorhanden') {
            throw new Error('Fehler beim Hinzufügen der Serie.');
          }
          setSnackbarMessage('Serie bereits vorhanden');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error sending data to server:', error);
        setSnackbarMessage('Fehler beim Hinzufügen der Serie.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  }, [user, selectedSeries]);

  const memoizedSeriesList = useMemo(() => {
    return seriesList.slice(0, 100); // Begrenzen Sie die Anzahl der gerenderten Serien auf 100
  }, [seriesList]);

  const fetchStats = () => {
    const genres: {
      [key: string]: {
        count: number;
        totalRating: number;
        averageRating: number;
      };
    } = {};
    const providers: {
      [key: string]: {
        count: number;
        totalRating: number;
        averageRating: number;
      };
    } = {};
    let watchtime = 0;
    let seriesRated = 0;
    let episodesWatched = 0;
    const labels = new Set();
    seriesList.forEach((serie) => {
      try {
        serie.provider?.provider.forEach((provider) => {
          labels.add(provider.name);
        });
      } catch (error) {
        console.error(error);
      }
    });
    const labelArray = Array.from(labels);

    const dataMap = new Map();

    labelArray.forEach((label) => {
      dataMap.set(label, { count: 0, rating: 0 });
    });

    memoizedSeriesList.forEach((series) => {
      // Genres
      series.genre.genres.forEach((genre) => {
        if (genre !== 'All' && calculateOverallRating(series) !== '0.00') {
          if (!genres[genre]) {
            genres[genre] = { count: 0, totalRating: 0, averageRating: 0 };
          }
          genres[genre].count += 1;
          genres[genre].totalRating += series.rating[genre] || 0;
          genres[genre].averageRating =
            genres[genre].totalRating / genres[genre].count;
        }
      });

      // Providers

      series.provider?.provider.forEach((provider) => {
        if (calculateOverallRating(series) !== '0.00') {
          if (!providers[provider.name]) {
            providers[provider.name] = {
              count: 0,
              totalRating: 0,
              averageRating: 0,
            };
          }
          dataMap.set(provider.name, {
            count: dataMap.get(provider.name).count + 1,
            rating:
              dataMap.get(provider.name).rating +
              Number(calculateOverallRating(series)),
          });

          providers[provider.name].averageRating =
            dataMap.get(provider.name).rating /
            dataMap.get(provider.name).count;
          providers[provider.name].count = dataMap.get(provider.name).count;
        }
      });

      // User Stats

      if (calculateOverallRating(series) !== '0.00') {
        watchtime += series.watchtime;
        episodesWatched += series.episodeCount;
        if (Object.keys(series.rating).length > 0) {
          seriesRated += 1;
        }
      }
    });

    setStatsData({
      genres: Object.keys(genres).map((key) => ({
        name: key,
        ...genres[key],
      })),
      providers: Object.keys(providers).map((key) => ({
        name: key,
        ...providers[key],
      })),
      userStats: {
        watchtime: secondsToString(watchtime),
        episodesWatched,
        seriesRated,
      },
    });
  };

  const handleStatsOpen = useCallback(() => {
    fetchStats();
    setStatsDialogOpen(true);
  }, [fetchStats]);

  const handleStatsClose = useCallback(() => {
    setStatsDialogOpen(false);
  }, []);

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

  const handleTitleClick = useCallback(() => {
    if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location, navigate]);

  return (
    <>
      <AppBar position='fixed' color='default' elevation={1}>
        <Toolbar>
          {user && (
            <IconButton
              edge='start'
              color='inherit'
              aria-label='menu'
              onClick={() => setIsNavOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant='h1'
            component='h1'
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'xxx-large',
              letterSpacing: { xs: 'normal', sm: '20px' }, // Remove letter spacing on mobile
            }}
          >
            <span
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
              onClick={handleTitleClick}
            >
              TV-RANK
            </span>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user ? (
              <>
                <IconButton
                  color='inherit'
                  aria-label='statistics'
                  onClick={handleStatsOpen}
                >
                  <BarChartIcon />
                </IconButton>
              </>
            ) : (
              ''
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Platzhalter für den fixierten Header */}
      {user && (
        <Drawer
          anchor='top'
          open={isNavOpen}
          onClose={() => setIsNavOpen(false)}
        >
          <List
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <ListItem
              sx={{
                width: '100%',
                justifyContent: 'center',
                flexDirection: isMobile ? 'column' : 'row',
              }}
            >
              <Autocomplete
                onChange={(_event, newValue) => setSelectedSeries(newValue)}
                onInputChange={handleSearchChange}
                options={options}
                getOptionLabel={(option) => option.name}
                className='w-full'
                itemProp='name'
                renderOption={(props, option) => (
                  <li
                    // Schlüssel direkt übergeben
                    {...props}
                    key={option.id}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <img
                      src={
                        option.poster_path
                          ? `https://image.tmdb.org/t/p/w92${option.poster_path}`
                          : notFound
                      }
                      alt={option.name}
                      style={{ marginRight: 10, width: 92 }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <div>{option.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                        {option.original_name}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                      {new Date(option.first_air_date).getFullYear()}
                    </div>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Serie hinzufügen'
                    variant='outlined'
                    type='search'
                  />
                )}
              />
              <Button
                onClick={handleAddSeries}
                variant='outlined'
                sx={{
                  marginLeft: isMobile ? '0' : '10px',
                  marginTop: isMobile ? '10px' : '0',
                  fontSize: '1.2rem',
                }}
              >
                Hinzufügen
              </Button>
            </ListItem>
            <ListItem
              sx={{
                width: '100%',
                justifyContent: 'center',
                flexDirection: isMobile ? 'column' : 'row',
              }}
            >
              <Button
                onClick={handleLogout}
                sx={{ marginLeft: '20px' }}
                variant='outlined'
              >
                Logout
              </Button>
            </ListItem>
          </List>
        </Drawer>
      )}
      <Dialog
        sx={{ textAlign: 'center !important' }}
        open={statsDialogOpen}
        onClose={handleStatsClose}
        fullWidth
      >
        <DialogTitle variant='h2'>
          Statistiken
          <IconButton
            aria-label='close'
            onClick={handleStatsClose}
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
                  <Typography
                    style={{ color: theme.palette.text.secondary }}
                    variant='body1'
                  >
                    {statsData.userStats.seriesRated}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='h4'>Geschaute Episoden</Typography>
                  <Typography
                    style={{ color: theme.palette.text.secondary }}
                    variant='body1'
                  >
                    {statsData.userStats.episodesWatched}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='h4'>Geschaute Zeit</Typography>
                  <Typography
                    style={{ color: theme.palette.text.secondary }}
                    variant='body1'
                  >
                    {statsData.userStats.watchtime}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} columns={2}>
                <Grid size={{ xs: 2, lg: 1 }}>
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
                                return `${context.label}: ${Number(
                                  context.raw
                                )}`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 2, lg: 1 }}>
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
                <Grid size={{ xs: 2, lg: 1 }}>
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
                                return `${context.label}: ${Number(
                                  context.raw
                                )}`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 2, lg: 1 }}>
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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === 'warning' ? null : 6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
});
export default Header;
