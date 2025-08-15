import { Alert, Button, Snackbar } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface EmailVerificationBannerProps {
  children: React.ReactNode;
}

export const EmailVerificationBanner = ({ children }: EmailVerificationBannerProps) => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [snackOpen, setSnackOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = firebase.auth().currentUser;
    if (user) {
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
            setIsVerified(user.emailVerified);
            setLoading(false);
          });
      } else {
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
          color: '#00fed7',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid #00fed7',
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
        {/* Banner */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #ff4757, #ff6b7a)',
            color: 'white',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ fontWeight: '500' }}>
              Email nicht verifiziert - Bitte überprüfen Sie Ihr Postfach
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="contained"
              size="small"
              onClick={resendVerification}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              Erneut senden
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Abmelden
            </Button>
          </div>
        </div>

        {/* Content mit Overlay */}
        <div style={{ paddingTop: '60px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '40px',
                borderRadius: '12px',
                border: '2px solid #00fed7',
                boxShadow: '0 0 30px rgba(0, 254, 215, 0.3)',
                textAlign: 'center',
                maxWidth: '400px',
                margin: '0 20px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
              <h2 style={{ color: '#00fed7', marginBottom: '16px' }}>
                Email-Verifizierung erforderlich
              </h2>
              <p style={{ color: '#ccc', marginBottom: '24px', lineHeight: '1.5' }}>
                Um alle Funktionen nutzen zu können, müssen Sie Ihre Email-Adresse verifizieren.
                Überprüfen Sie Ihr Postfach und klicken Sie auf den Verifizierungslink.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={resendVerification}
                  sx={{
                    backgroundColor: '#00fed7',
                    color: 'black',
                    '&:hover': {
                      backgroundColor: '#00d4b4',
                    },
                  }}
                >
                  Link erneut senden
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    borderColor: '#00fed7',
                    color: '#00fed7',
                    '&:hover': {
                      borderColor: '#00d4b4',
                      backgroundColor: 'rgba(0, 254, 215, 0.1)',
                    },
                  }}
                >
                  Abmelden
                </Button>
              </div>
            </div>
          </div>
          {children}
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