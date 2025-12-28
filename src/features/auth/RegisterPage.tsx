import { ArrowForward, Email, Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';
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
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const RegisterPage = () => {
  const navigate = useNavigate();
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
      setError('Benutzername muss mindestens 3 Zeichen lang sein.');
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

      if (userCredential.user) {
        // Update display name
        await userCredential.user.updateProfile({
          displayName: username,
        });

        // Save user data to database
        await firebase.database().ref(`users/${userCredential.user.uid}`).set({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          username: username,
          displayName: username,
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          lastActive: firebase.database.ServerValue.TIMESTAMP,
          isOnline: true,
        });

        navigate('/');
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Diese E-Mail-Adresse wird bereits verwendet.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse.');
      } else if (error.code === 'auth/weak-password') {
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
        background: '#000',
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
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '3rem', sm: '4rem' },
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00fed7 0%, #ff0080 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                letterSpacing: '-0.02em',
              }}
            >
              TV-RANK
            </Typography>
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
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              p: 4,
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
                label="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoComplete="username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
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
                label="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
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
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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
                label="Passwort bestätigen"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(0, 254, 215, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00fed7 0%, #00c9b7 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0, 254, 215, 0.4)',
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
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Bereits ein Konto?{' '}
              <Link
                to="/login"
                style={{
                  color: '#00fed7',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
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
  );
};

export default RegisterPage;
