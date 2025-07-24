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
      user.reload().then(() => {
        setIsVerified(user.emailVerified);
        setLoading(false);
      });
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
    return null; // Lass das GlobalLoadingProvider das Skeleton zeigen
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
              <h1 className='text-[#00fed7] text-4xl mb-8'>
                Email nicht verifiziert
              </h1>
              <p className='text-[#00fed7] text-lg mb-12 leading-relaxed'>
                Es sieht so aus, als ob Ihre Email noch nicht verifiziert wurde.
                Bitte überprüfen Sie Ihr Postfach und klicken Sie auf den
                Verifizierungslink.
              </p>
              <div className='flex flex-col gap-4'>
                <Button
                  variant='contained'
                  onClick={() => resendVerification()}
                  className='bg-[#00fed7] text-black font-medium px-8 py-3 rounded-lg hover:bg-[#00d4b4] transition-colors'
                >
                  LINK ERNEUT SENDEN
                </Button>
                <Button
                  variant='outlined'
                  onClick={handleLogout}
                  sx={{
                    color: '#00fed7',
                    borderColor: '#00fed7',
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
