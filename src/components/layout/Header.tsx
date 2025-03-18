import {
  Alert,
  AppBar,
  Box,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
  Snackbar,
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
import 'firebase/compat/database';
import { BarChartIcon, LogOut, ShareIcon } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import SharedLinksDialog from '../dialogs/SharedLinksDialog';
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
  setIsStatsOpen: (open: boolean) => void;
}
export const Header = memo(({ setIsStatsOpen }: HeaderProps) => {
  const auth = useAuth();
  const { user, setUser } = auth || {};
  const location = useLocation();
  const navigate = useNavigate();
  const isSharedListPage = location.pathname.startsWith('/shared-list');
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [, setShareLink] = useState<string | null>(null);
  const [linkDuration, setLinkDuration] = useState<number>(24);
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  if (!auth) {
    return null;
  }
  const handleLogout = useCallback(() => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        if (setUser) {
          setUser(null);
        }
      });
  }, [setUser]);
  const handleStatsOpen = useCallback(() => {
    setStatsDialogOpen(true);
    setIsStatsOpen(true);
  }, [setIsStatsOpen]);
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
      const expirationTime = Date.now() + linkDuration * 60 * 60 * 1000;
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
  return (
    <>
      <AppBar
        style={{ backgroundColor: '#090909' }}
        position='fixed'
        color='default'
        elevation={1}
      >
        <Toolbar sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 0, ml: 1 }}>
            {/* Left group: Logout oder "Meine Liste" */}
            {isSharedListPage ? (
              isMobile ? (
                <IconButton
                  onClick={handleBackToHome}
                  aria-label='Zu meiner Liste'
                  role='button'
                >
                  {/* Pfeil umgedreht und in Türkis */}
                  <LogOut
                    style={{ transform: 'scaleX(-1)', color: '#00fed7' }}
                  />
                </IconButton>
              ) : (
                <Button
                  sx={{ width: { xs: 100, sm: 130 } }}
                  variant='outlined'
                  color='inherit'
                  onClick={handleBackToHome}
                  aria-label='Zu meiner Liste'
                  role='button'
                >
                  Meine Liste
                </Button>
              )
            ) : (
              user && (
                <Button
                  onClick={handleLogout}
                  variant='outlined'
                  aria-label='Logout'
                  role='button'
                >
                  Logout
                </Button>
              )
            )}
          </Box>

          <Typography
            variant='h1'
            component='h1'
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: '2rem', sm: '3em' },
              letterSpacing: { xs: 'normal', sm: '20px' },
            }}
          >
            <span
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
              onClick={handleTitleClick}
            >
              TV-RANK
            </span>
          </Typography>

          <Box sx={{ position: 'absolute', right: 0, mr: 1 }}>
            {/* Right group: Weitere Buttons */}
            {!isSharedListPage && user && (
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
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
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
      />
    </>
  );
});
export default Header;
