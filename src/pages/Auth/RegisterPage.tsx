import ArrowForward from '@mui/icons-material/ArrowForward';
import Email from '@mui/icons-material/Email';
import Lock from '@mui/icons-material/Lock';
import Person from '@mui/icons-material/Person';
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
import { trackRegister } from '../../services/firebase/analytics';
import { SocialLoginButtons } from './SocialLoginButtons';
import { syncUserSearchIndex } from '../../services/firebase/userSearchIndex';
import { dbRef, paths, serverTimestamp } from '../../services/db/ref';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (username.length < 3) {
      setError('Anzeigename muss mindestens 3 Zeichen lang sein.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

      if (userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: username,
        });

        // onboardingComplete muss hier gesetzt werden,
        // sonst rennt authProvider in eine Race: trifft die snapshot.once('value')
        // diesen set()-Write bereits an, geht es in den "bestehender User"-Branch
        // mit `existingData?.onboardingComplete !== false` → undefined !== false →
        // true, und das Onboarding wird nie angezeigt.
        await dbRef(paths.user(userCredential.user.uid)).set({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          username: username,
          usernameLower: username.toLowerCase(),
          displayName: username,
          displayNameLower: username.toLowerCase(),
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          isOnline: true,
          onboardingComplete: false,
        });

        // Such-Index spiegeln (best-effort, wirft nie) — der Login-Self-Heal
        // im authProvider kann diesen Write racen und ihn verpassen.
        await syncUserSearchIndex(userCredential.user.uid, {
          username,
          displayName: username,
        });

        await userCredential.user.sendEmailVerification();
        trackRegister('email');
        navigate('/');
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Diese E-Mail-Adresse wird bereits verwendet.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse.');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Passwort ist zu schwach.');
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
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
                Erstelle dein Konto
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

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Anzeigename"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="username"
                  error={!!error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
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
                  autoComplete="new-password"
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
                  label="Passwort bestätigen"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="new-password"
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
                          title={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                          arrow
                        >
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            aria-label={
                              showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'
                            }
                            aria-pressed={showConfirmPassword}
                            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  {loading ? 'Registrieren...' : 'Registrieren'}
                </Button>
              </form>

              <SocialLoginButtons onError={setError} disabled={loading} />
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Bereits ein Konto?{' '}
                <Link
                  to="/login"
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
                  Jetzt anmelden
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default RegisterPage;
