import { Alert, Button, Card, Snackbar } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
interface VerifiedRouteProps {
  children: React.ReactNode;
}
export const VerifiedRoute = ({ children }: VerifiedRouteProps) => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [snackOpen, setSnackOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  useEffect(() => {
    const user = firebase.auth().currentUser;
    if (user) {
      // Offline-freundliche Version - reload nur wenn online
      if (navigator.onLine) {
        user
          .reload()
          .then(() => {
            setIsVerified(user.emailVerified);
            setLoading(false);
          })
          .catch((error) => {
            console.warn(
              'User reload fehlgeschlagen (offline?), verwende cached Daten:',
              error
            );
            // Bei Offline-Fehler cached Email-Verified Status verwenden
            setIsVerified(user.emailVerified);
            setLoading(false);
          });
      } else {
        // Offline: Verwende cached Daten direkt
        setIsVerified(user.emailVerified);
        setLoading(false);
      }
    } else {
      navigate('/login');
    }
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
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#000',
          color: 'var(--theme-primary)',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid var(--theme-primary)',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div>Verifizierung wird geprüft...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
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
              boxShadow: '0 0 20px rgba(0, 254, 215, 0.15)',
              border: '1px solid rgba(0, 254, 215, 0.1)',
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
                  className='bg-[var(--theme-primary)] text-black font-medium px-8 py-3 rounded-lg hover:bg-[var(--theme-primary-hover)] transition-colors'
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
                      backgroundColor: 'rgba(0, 254, 215, 0.1)',
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
