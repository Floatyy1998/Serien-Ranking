import { ArrowForward, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
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
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export const PasswordResetPage = () => {
  // const navigate = useNavigate(); // Unused for now
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Ungültiger oder fehlender Reset-Token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.DEV ? '/api' : 'https://serienapi.konrad-dinges.de/api');
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Passwort erfolgreich zurückgesetzt! Sie werden gleich weitergeleitet...');

        // Store token and redirect to login
        localStorage.setItem('token', data.token);

        setTimeout(() => {
          window.location.href = '/login'; // Go to login page first
        }, 2000);
      } else {
        setError(data.error || 'Fehler beim Zurücksetzen des Passworts');
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es später erneut.');
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
              Neues Passwort setzen
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

            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  background: 'rgba(46, 125, 50, 0.1)',
                  color: '#66bb6a',
                }}
              >
                {success}
              </Alert>
            )}

            {!success && token && (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Neues Passwort"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
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
                  disabled={loading || !password || !confirmPassword}
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
                  {loading ? 'Wird gesetzt...' : 'Passwort setzen'}
                </Button>
              </form>
            )}
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Zurück zur{' '}
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
                Anmeldung
              </Link>
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PasswordResetPage;
