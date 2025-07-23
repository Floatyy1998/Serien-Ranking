import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
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
import { BarChartIcon, LogOut, Users } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useFriends } from '../../contexts/FriendsProvider';
import { ProfileDialog } from '../dialogs/ProfileDialog';
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
// React 19: Automatische Memoization - kein memo nötig
export const Header = ({ setIsStatsOpen }: HeaderProps) => {
  const auth = useAuth();
  const { user, setUser } = auth || {};
  const { unreadRequestsCount, unreadActivitiesCount } = useFriends();
  const location = useLocation();
  const navigate = useNavigate();
  const isSharedListPage = location.pathname.startsWith('/shared-list');
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  if (!auth) {
    return null;
  }
  // React 19: Automatische Memoization - kein useCallback nötig
  const handleLogout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        if (setUser) {
          setUser(null);
        }
      });
  };
  const handleStatsOpen = () => {
    setStatsDialogOpen(true);
    setIsStatsOpen(true);
  };
  const handleStatsClose = () => {
    setStatsDialogOpen(false);
  };
  const handleTitleClick = () => {
    if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFriendsClick = () => {
    navigate('/friends');
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
                <MuiTooltip title='Freunde'>
                  <IconButton
                    color='inherit'
                    aria-label='Freunde'
                    onClick={handleFriendsClick}
                    role='button'
                  >
                    <Badge
                      badgeContent={unreadRequestsCount + unreadActivitiesCount}
                      color='error'
                      max={99}
                    >
                      <Users />
                    </Badge>
                  </IconButton>
                </MuiTooltip>

                <MuiTooltip title='Profil bearbeiten'>
                  <IconButton
                    color='inherit'
                    aria-label='Profil bearbeiten'
                    onClick={() => setProfileDialogOpen(true)}
                    role='button'
                  >
                    <Avatar
                      src={user?.photoURL || undefined}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user?.displayName?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        '?'}
                    </Avatar>
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
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </>
  );
};
export default Header;
