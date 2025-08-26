import { Alert, Button, Card, Snackbar } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React, { useEffect, useState } from 'react';
import { colors } from '../../theme';
import { useNavigate } from 'react-router-dom';
interface VerifiedRouteProps {
  children: React.ReactNode;
}
export const VerifiedRoute = ({ children }: VerifiedRouteProps) => {
  // Initialisiere mit dem aktuellen Status - KEIN Loading!
  const currentUser = firebase.auth().currentUser;
  const [isVerified, setIsVerified] = useState<boolean | null>(currentUser?.emailVerified ?? null);
  const [loading] = useState(false); // KEIN initiales Loading mehr!
  const [message, setMessage] = useState('');
  const [snackOpen, setSnackOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  useEffect(() => {
    const user = firebase.auth().currentUser;
    if (user) {
      // Setze sofort den Status
      setIsVerified(user.emailVerified);
      
      // Nur im Hintergrund aktualisieren wenn online und nicht verifiziert
      if (navigator.onLine && !user.emailVerified) {
        user
          .reload()
          .then(() => {
            setIsVerified(user.emailVerified);
          })
          .catch((error) => {
            console.warn(
              'User reload fehlgeschlagen (offline?):',
              error
            );
          });
      }
    } else {
      navigate('/login');
    }
    
    // IMMER setAppReady aufrufen - egal ob User oder nicht
    window.setAppReady?.('emailVerification', true);
  }, [navigate]);
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (!isVerified) {
      intervalId = setInterval(() => {
        const user = firebase.auth().currentUser;
        if (user) {
          user.reload().then(() => {
            if (user.emailVerified) {
              setIsVerified(true);
              clearInterval(intervalId);
            }
          });
        }
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [isVerified]);
  const resendVerification = () => {
    const user = firebase.auth().currentUser;
    if (user) {
      user
        .sendEmailVerification()
        .then(() => {
          setMessage('Verifizierungslink wurde erneut gesendet.');
          setSnackOpen(true);
        })
        .catch((error) => {
          setMessage(error.message);
          setSnackOpen(true);
        });
    }
  };
  const handleSnackClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setSnackOpen(false);
  };

  const handleLogout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        navigate('/login');
      });
  };
  // KEIN Loading-Screen mehr! Wurde im SplashScreen erledigt
  if (loading) {
    return <>{children}</>; // Zeige direkt den Content
  }

  if (!isVerified) {
    return (
      <>
        <div
          style={{ height: 'calc(100vh - 120px)' }}
          className='w-full bg-black flex items-center justify-center p-4'
        >
          <Card
            sx={{
              maxWidth: 512,
              width: '100%',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              boxShadow: colors.shadow.hover,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <main className='p-8 text-center'>
              <h1 className='text-[var(--theme-primary)] text-4xl mb-8'>
                Email nicht verifiziert
              </h1>
              <p className='text-[var(--theme-primary)] text-lg mb-12 leading-relaxed'>
                Es sieht so aus, als ob Ihre Email noch nicht verifiziert wurde.
                Bitte überprüfen Sie Ihr Postfach und klicken Sie auf den
                Verifizierungslink.
              </p>
              <div className='flex flex-col gap-4'>
                <Button
                  variant='contained'
                  onClick={() => resendVerification()}
                  className='bg-[var(--theme-primary)] text-black font-medium px-8 py-3 rounded-lg hover:bg-[var(--theme-accent)] transition-colors'
                >
                  LINK ERNEUT SENDEN
                </Button>
                <Button
                  variant='outlined'
                  onClick={handleLogout}
                  sx={{
                    color: 'var(--theme-primary)',
                    borderColor: 'var(--theme-primary)',
                    '&:hover': {
                      borderColor: '#00d4b4',
                      backgroundColor: colors.overlay.light,
                    },
                  }}
                  className='font-medium px-8 py-3 rounded-lg transition-colors'
                >
                  AUSLOGGEN
                </Button>
              </div>
            </main>
          </Card>
        </div>
        <Snackbar
          open={snackOpen}
          autoHideDuration={6000}
          onClose={handleSnackClose}
        >
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
  }
  return (
    <>
      {children}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={handleSnackClose}
      >
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
