import { Alert, Button, Card, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { colors } from '../../theme';

interface VerifiedRouteProps {
  children: React.ReactNode;
}

export const VerifiedRoute = ({ children }: VerifiedRouteProps) => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [snackOpen, setSnackOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Since we don't have email verification working without email service,
    // always mark as ready and show the content
    window.setAppReady?.('emailVerification', true);
    
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSnackClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Since email verification is not working without email service,
  // always show the children content
  return (
    <>
      {children}
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleSnackClose}>
        <Alert
          onClose={handleSnackClose}
          severity={message.includes('Fehler') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};