import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  Tooltip as MuiTooltip,
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
import { BarChartIcon, MenuIcon, ShareIcon } from 'lucide-react';
import { memo, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import SharedLinksDialog from '../dialogs/SharedLinksDialog'; // Importieren Sie den neuen Dialog
import StatsDialog from '../dialogs/StatsDialog';

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

export const Header = memo(({ isNavOpen, setIsNavOpen }: HeaderProps) => {
  const auth = useAuth();
  const { user, setUser } = auth || {};
  const location = useLocation();
  const navigate = useNavigate();
  const isSharedListPage = location.pathname.startsWith('/shared-list');

  const [, setSearchValue] = useState('');
  const [options, setOptions] = useState<Serien[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Serien | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [, setShareLink] = useState<string | null>(null);
  const [linkDuration, setLinkDuration] = useState<number>(24); // Standardmäßig 24 Stunden
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Neuer Ref für den Input

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (!auth) {
    return null; // or handle the error appropriately
  }

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
          `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${value}&language=de-DE`
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
          // const res = await fetch(`http://localhost:3000/add`, {
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
          setOptions((prevOptions) =>
            prevOptions.filter((option) => option.id !== selectedSeries.id)
          );
          setIsNavOpen(false); // Drawer schließen
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

  const handleStatsOpen = useCallback(() => {
    setStatsDialogOpen(true);
  }, []);

  const handleStatsClose = useCallback(() => {
    setStatsDialogOpen(false);
  }, []);

  const handleTitleClick = useCallback(() => {
    if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location, navigate]);

  const handleGenerateShareLink = async () => {
    if (!user) {
      setSnackbarMessage(
        'Bitte loggen Sie sich ein, um einen Link zu generieren.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const shareRef = firebase.database().ref('sharedLists').push();
      const expirationTime = Date.now() + linkDuration * 60 * 60 * 1000; // Gültigkeitsdauer in Millisekunden
      await shareRef.set({
        userId: user.uid,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        expiresAt: expirationTime,
      });

      const link = `${window.location.origin}/shared-list/${shareRef.key}`;
      setShareLink(link);
      setSnackbarMessage('Link erfolgreich generiert!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      setSnackbarMessage('Fehler beim Generieren des Links.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleLinksDialogOpen = () => {
    setLinksDialogOpen(true);
  };

  const handleLinksDialogClose = () => {
    setLinksDialogOpen(false);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleDrawerClose = () => {
    setIsNavOpen(false);
    inputRef.current?.blur(); // Fokus entfernen
  };

  return (
    <>
      <AppBar position='fixed' color='default' elevation={1}>
        <Toolbar>
          {user && !isSharedListPage && (
            <IconButton
              edge='start'
              color='inherit'
              aria-label='Menü öffnen'
              onClick={() => setIsNavOpen(true)}
              role='button'
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
              fontSize: { xs: '2rem', sm: '3em' },
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
            {isSharedListPage ? (
              <Button
                variant='outlined'
                color='inherit'
                onClick={handleBackToHome}
                aria-label='Zu meiner Liste'
                role='button'
              >
                Zu meiner Liste
              </Button>
            ) : (
              user && (
                <>
                  <MuiTooltip title='Statistiken anzeigen'>
                    <IconButton
                      color='inherit'
                      aria-label='Statistiken anzeigen'
                      onClick={handleStatsOpen}
                      role='button'
                    >
                      <BarChartIcon />
                    </IconButton>
                  </MuiTooltip>
                  <MuiTooltip title='Link teilen'>
                    <IconButton
                      color='inherit'
                      aria-label='Link teilen'
                      onClick={handleLinksDialogOpen}
                      role='button'
                    >
                      <ShareIcon />
                    </IconButton>
                  </MuiTooltip>
                </>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Platzhalter für den fixierten Header */}
      {user && !isSharedListPage && (
        <Drawer
          anchor='top'
          open={isNavOpen}
          onClose={handleDrawerClose} // Angepasster Handler
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
                    inputRef={inputRef} // Ref an das Input übergeben
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
                aria-label='Serie hinzufügen'
                role='button'
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
                aria-label='Logout'
                role='button'
              >
                Logout
              </Button>
            </ListItem>
          </List>
        </Drawer>
      )}
      <StatsDialog
        open={statsDialogOpen}
        onClose={handleStatsClose}
        isMobile={isMobile}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === 'warning' ? null : 6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <SharedLinksDialog
        open={linksDialogOpen}
        onClose={handleLinksDialogClose}
        handleGenerateShareLink={handleGenerateShareLink}
        linkDuration={linkDuration}
        setLinkDuration={setLinkDuration}
        shareLink={null}
      />
    </>
  );
});
export default Header;
