import ArrowForward from '@mui/icons-material/ArrowForward';
import Email from '@mui/icons-material/Email';
import Lock from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GradientText } from '../../components/ui';
import { CoverWall } from '../../components/ui/CoverWall';
import { useTheme } from '../../contexts/ThemeContext';
import { trackLogin } from '../../services/firebase/analytics';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setInfo('');
      setError('Bitte gib zuerst deine E-Mail-Adresse ein.');
      return;
    }
    setError('');
    setInfo('');
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      setInfo('Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts geschickt.');
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse.');
      } else if (firebaseError.code === 'auth/user-not-found') {
        // Aus Datenschutzgründen keine Konto-Existenz preisgeben.
        setInfo('Falls ein Konto existiert, haben wir dir eine E-Mail geschickt.');
      } else {
        setError('E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      trackLogin('email');
      navigate('/');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        setError('Kein Benutzer mit dieser E-Mail-Adresse gefunden.');
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('Falsches Passwort.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse.');
      } else if (firebaseError.code === 'auth/invalid-credential') {
        setError('E-Mail oder Passwort ist falsch.');
      } else {
        setError(
          `Ein Fehler ist aufgetreten: ${firebaseError.code || firebaseError.message || 'Unbekannter Fehler'}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--theme-bg-default, #000000)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {/* Kino-Pane: animierte Trending-Poster-Wall füllt die linke Hälfte */}
      <Box
        sx={{
          flex: 1.25,
          position: 'relative',
          overflow: 'hidden',
          display: { xs: 'none', md: 'block' },
          '& .ob-wall': { opacity: 0.85, filter: 'saturate(1.0) brightness(1.05) contrast(1.02)' },
          '& .ob-wall-poster': { width: 'clamp(110px, 8vw, 168px)' },
          /* Vignette: zum Formular hin abdunkeln statt alles zu schlucken */
          '& .ob-vignette': {
            background: `linear-gradient(90deg, rgba(6, 7, 11, 0.5) 0%, transparent 25%, transparent 55%, rgba(6, 7, 11, 0.92) 100%),
              linear-gradient(180deg, rgba(6, 7, 11, 0.45) 0%, transparent 30%, transparent 62%, rgba(6, 7, 11, 0.75) 100%)`,
          },
        }}
      >
        <CoverWall rows={6} />
        <Box sx={{ position: 'absolute', left: 48, bottom: 48, zIndex: 2, maxWidth: 560 }}>
          <GradientText
            as="h2"
            style={{
              fontSize: 'clamp(1.8rem, 2.6vw, 3rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Dein Kino. Dein Ranking.
          </GradientText>
          <Typography sx={{ mt: 1.5, color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.05rem' }}>
            Tracke Serien, Filme & Manga — mit Freunden, Stats und allem Drum und Dran.
          </Typography>
        </Box>
      </Box>

      {/* Formular-Spalte: volle Höhe, Glas-Fläche */}
      <Box
        sx={{
          width: { xs: '100%', md: 'min(680px, 44vw)' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          borderLeft: { md: '1px solid rgba(255, 255, 255, 0.08)' },
          backgroundColor: { md: 'rgba(10, 12, 16, 0.6)' },
          backdropFilter: { md: 'blur(24px)' },
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 0, 128, 0.08) 0%, transparent 50%)
          `,
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 3,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 6, textAlign: 'center' }}>
              <GradientText
                as="h1"
                style={{
                  fontSize: '3rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  marginBottom: '16px',
                  letterSpacing: '-0.02em',
                }}
              >
                TV-RANK
              </GradientText>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 300,
                }}
              >
                Willkommen zurück
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                background: 'var(--glass-light)',
                backdropFilter: 'var(--blur-sm)',
                WebkitBackdropFilter: 'var(--blur-sm)',
                border: '1px solid var(--glass-border-light)',
                borderRadius: '16px',
                p: 4,
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
              }}
            >
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    background: 'rgba(211, 47, 47, 0.1)',
                    color: currentTheme.status?.error || '#ff5252',
                  }}
                >
                  {error}
                </Alert>
              )}

              {info && (
                <Alert
                  severity="success"
                  sx={{
                    mb: 3,
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: currentTheme.status?.success || '#4ade80',
                  }}
                >
                  {info}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="E-Mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="email"
                  error={!!error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    /* themeConfig malt TextField-Root schwarz an — Glas braucht transparent */
                    backgroundColor: 'transparent',
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme.text.secondary,
                      /* Glas statt schwarzem Kasten — passt zur App-Sprache */
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '14px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.14)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: currentTheme.primary,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Passwort"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  error={!!error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip
                          title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                          arrow
                        >
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                            aria-pressed={showPassword}
                            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 4,
                    /* themeConfig malt TextField-Root schwarz an — Glas braucht transparent */
                    backgroundColor: 'transparent',
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme.text.secondary,
                      /* Glas statt schwarzem Kasten — passt zur App-Sprache */
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '14px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.14)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: currentTheme.primary,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={!loading && <ArrowForward />}
                  sx={{
                    py: 1.5,
                    background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}cc 100%)`,
                    color: currentTheme.background.default,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    borderRadius: '14px',
                    textTransform: 'none',
                    boxShadow:
                      '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}cc 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${currentTheme.primary}59`,
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  {loading ? 'Anmelden...' : 'Anmelden'}
                </Button>
              </form>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={handlePasswordReset}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: currentTheme.primary,
                      background: 'transparent',
                    },
                  }}
                >
                  Passwort vergessen?
                </Button>
              </Box>
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Noch kein Konto?{' '}
                <Link
                  to="/register"
                  style={{
                    color: currentTheme.primary,
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  Jetzt registrieren
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;
