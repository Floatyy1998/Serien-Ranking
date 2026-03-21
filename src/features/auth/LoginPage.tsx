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
import { trackLogin } from '../../firebase/analytics';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        background: 'var(--theme-bg-default, #06090f)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Static gradient background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 0, 128, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(0, 255, 215, 0.15) 0%, transparent 50%)
          `,
        }}
      />

      <Container
        maxWidth="sm"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
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
              from="#00fed7"
              to="#ff0080"
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
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
                  color: '#ff5252',
                }}
              >
                {error}
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
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00fed7',
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
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00fed7',
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
                  background: 'linear-gradient(135deg, #00fed7 0%, #00c9b7 100%)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  borderRadius: '14px',
                  textTransform: 'none',
                  boxShadow:
                    '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00fed7 0%, #00c9b7 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 254, 215, 0.35)',
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
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Noch kein Konto?{' '}
              <Link
                to="/register"
                style={{
                  color: '#00fed7',
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
  );
};

export default LoginPage;
