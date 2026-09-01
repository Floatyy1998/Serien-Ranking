import { Email, Warning } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { requestVerificationMail } from '../../services/authMails';
import { commonStyles } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { showToast } from '../../lib/toast';

interface EmailVerificationBannerProps {
  children: React.ReactNode;
}

export const EmailVerificationBanner = ({ children }: EmailVerificationBannerProps) => {
  const auth = useAuth();
  const { currentTheme } = useTheme();
  const user = auth?.user;
  const [isVerified, setIsVerified] = useState<boolean | null>(user?.emailVerified ?? null);
  const [mountNow] = useState(() => Date.now());
  const [loading] = useState(false); // Kein initiales Loading
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
      } else {
        setIsVerified(user.emailVerified);
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
        if (document.hidden || !navigator.onLine) return;
        // reload() kann mit 503/Netzfehler abbrechen — dann beim nächsten Takt erneut
        user
          .reload()
          .then(() => {
            if (user.emailVerified) {
              setIsVerified(true);
              clearInterval(intervalId);
            }
          })
          .catch(() => {});
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [isVerified, user]);

  const resendVerification = () => {
    if (user) {
      requestVerificationMail(user)
        .then(() => {
          showToast(t('Verifizierungslink wurde erneut gesendet.'), 4000);
        })
        .catch((error) => {
          showToast(error.message, 4000, 'error');
        });
    }
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

  // Schonfrist: 2 Tage nur sanfter Banner (App inkl. Onboarding voll nutzbar),
  // ab Tag 3 kommt der harte Gate — sonst verifiziert niemand.
  // `now` beim Mount eingefroren (Purity-Rule); der Übergang Banner→Gate
  // greift damit beim nächsten App-Start nach Ablauf der Frist.
  const GRACE_MS = 2 * 24 * 60 * 60 * 1000;
  const createdAt = Date.parse(user?.metadata?.creationTime || '') || mountNow;
  const graceExpired = mountNow - createdAt > GRACE_MS;

  if (!isVerified && graceExpired) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'var(--blur-sm)',
            WebkitBackdropFilter: 'var(--blur-sm)',
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
              {t('Email-Verifizierung erforderlich')}
            </h2>
            <p style={{ color: currentTheme.text.muted, marginBottom: '24px', lineHeight: '1.5' }}>
              {t(
                'Um alle Funktionen weiter nutzen zu können, musst du deine Email-Adresse verifizieren. Überprüfe dein Postfach und klicke auf den Verifizierungslink.'
              )}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Tooltip title={t('Verifizierungslink erneut senden')} arrow>
                <Button
                  variant="contained"
                  onClick={resendVerification}
                  sx={{
                    backgroundColor: 'var(--theme-primary)',
                    color: currentTheme.background.default,
                    '&:hover': { backgroundColor: 'var(--theme-accent)' },
                  }}
                >
                  {t('Link erneut senden')}
                </Button>
              </Tooltip>
              <Tooltip title={t('Vom Account abmelden')} arrow>
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
                  {t('Abmelden')}
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  // Innerhalb der Schonfrist: sanfter Reminder, Banner oben, App voll nutzbar.
  // Der 5s-Poll lässt den Banner von selbst verschwinden, sobald der Link in
  // der Mail geklickt wurde.
  if (!isVerified) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: `linear-gradient(90deg, ${currentTheme.status?.error || '#ef4444'}, #ff6b7a)`,
            color: currentTheme.text.secondary,
            padding: '10px 16px',
            ...commonStyles.flexBetween,
            flexWrap: 'wrap',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Warning style={{ fontSize: '20px', flexShrink: 0 }} />
            <span style={{ fontWeight: '500', fontSize: '14px' }}>
              {t('Email nicht verifiziert – bitte überprüfe dein Postfach')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <Tooltip title={t('Verifizierungslink erneut senden')} arrow>
              <Button
                variant="contained"
                size="small"
                onClick={resendVerification}
                startIcon={<Email style={{ fontSize: '16px' }} />}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: currentTheme.text.secondary,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                {t('Erneut senden')}
              </Button>
            </Tooltip>
            <Tooltip title={t('Vom Account abmelden')} arrow>
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
                {t('Abmelden')}
              </Button>
            </Tooltip>
          </div>
        </div>

        <div style={{ paddingTop: '52px' }}>{children}</div>
      </>
    );
  }

  return <>{children}</>;
};
