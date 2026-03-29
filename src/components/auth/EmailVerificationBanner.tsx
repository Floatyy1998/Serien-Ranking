import { Email, Warning } from '@mui/icons-material';
import { Alert, Button, Snackbar, Tooltip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { commonStyles } from '../../theme';
import { useTheme } from '../../contexts/ThemeContextDef';

interface EmailVerificationBannerProps {
  children: React.ReactNode;
}

export const EmailVerificationBanner = ({ children }: EmailVerificationBannerProps) => {
  const auth = useAuth();
  const { currentTheme } = useTheme();
  const user = auth?.user;
  const [isVerified, setIsVerified] = useState<boolean | null>(user?.emailVerified ?? null);
  const [loading] = useState(false); // Kein initiales Loading
  const [message, setMessage] = useState('');
  const [snackOpen, setSnackOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Aktuellen Status immer vom Server holen wenn online
      if (navigator.onLine) {
        user
          .reload()
          .then(() => {
            setIsVerified(user.emailVerified);
          })
          .catch(() => {
            // Offline/Fehler: cached Daten verwenden
            setIsVerified(user.emailVerified);
          });
      }
    } else if (auth?.authStateResolved) {
      // Nur navigieren wenn Auth wirklich resolved ist und kein User da ist
      navigate('/login');
    }
    // Wenn auth noch nicht resolved ist, warte einfach
  }, [user, auth?.authStateResolved, navigate]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (!isVerified && user) {
      intervalId = setInterval(() => {
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
  }, [isVerified, user]);

  const resendVerification = () => {
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

  const handleSnackClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
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

  // NIEMALS einen Loading-Screen zeigen - alles wurde im SplashScreen erledigt
  if (loading) {
    return <>{children}</>;
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
            background: `linear-gradient(90deg, ${currentTheme.status?.error || '#ef4444'}, #ff6b7a)`,
            color: currentTheme.text.secondary,
            padding: '12px 20px',
            ...commonStyles.flexBetween,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Warning style={{ fontSize: '20px' }} />
            <span style={{ fontWeight: '500' }}>
              Email nicht verifiziert - Bitte überprüfen Sie Ihr Postfach
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="Verifizierungslink erneut senden" arrow>
              <Button
                variant="contained"
                size="small"
                onClick={resendVerification}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: currentTheme.text.secondary,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Erneut senden
              </Button>
            </Tooltip>
            <Tooltip title="Vom Account abmelden" arrow>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLogout}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: currentTheme.text.secondary,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Abmelden
              </Button>
            </Tooltip>
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
                backgroundColor: currentTheme.background.surface,
                padding: '40px',
                borderRadius: '16px',
                border: `2px solid var(--theme-primary)`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                maxWidth: '400px',
                margin: '0 20px',
              }}
            >
              <Email style={{ fontSize: '48px', marginBottom: '20px' }} />
              <h2
                style={{
                  color: 'var(--theme-primary)',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                }}
              >
                Email-Verifizierung erforderlich
              </h2>
              <p
                style={{ color: currentTheme.text.muted, marginBottom: '24px', lineHeight: '1.5' }}
              >
                Um alle Funktionen nutzen zu können, müssen Sie Ihre Email-Adresse verifizieren.
                Überprüfen Sie Ihr Postfach und klicken Sie auf den Verifizierungslink.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Tooltip title="Verifizierungslink erneut senden" arrow>
                  <Button
                    variant="contained"
                    onClick={resendVerification}
                    sx={{
                      backgroundColor: 'var(--theme-primary)',
                      color: currentTheme.background.default,
                      '&:hover': {
                        backgroundColor: 'var(--theme-accent)',
                      },
                    }}
                  >
                    Link erneut senden
                  </Button>
                </Tooltip>
                <Tooltip title="Vom Account abmelden" arrow>
                  <Button
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{
                      borderColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary)',
                      '&:hover': {
                        borderColor: 'var(--theme-accent)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Abmelden
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
          {children}
        </div>

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
  }

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
