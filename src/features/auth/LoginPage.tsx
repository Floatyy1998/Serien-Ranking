import { Snackbar, TextField } from '@mui/material';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { colors } from '../../theme';
import { initFirebase } from '../../firebase/initFirebase';
import { AuthLayout } from './Authlayout';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  const handleCloseSnackbar = () => setOpenSnackbar(false);
  const handleLogin = () => {
    if (!Firebase.apps.length) {
      initFirebase();
    }
    Firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        navigate('/');
      })
      .catch((error) => {
        setSnackbarMsg(error.message);
        setOpenSnackbar(true);
      });
  };
  const handleForgotPassword = () => {
    if (!email) {
      setSnackbarMsg('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      setOpenSnackbar(true);
      return;
    }
    Firebase.auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        setSnackbarMsg(
          'Passwort-Zurücksetzungslink wurde an Ihre E-Mail-Adresse gesendet.'
        );
        setOpenSnackbar(true);
      })
      .catch((error) => {
        setSnackbarMsg(error.message);
        setOpenSnackbar(true);
      });
  };
  return (
    <AuthLayout title='Login'>
      <form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
        <div>
          <TextField
            margin='dense'
            label='Email'
            type='email'
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ backgroundColor: 'inherit' }}
          />
          <TextField
            margin='dense'
            label='Password'
            type='password'
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ backgroundColor: 'inherit' }}
          />
        </div>
        <motion.button
          onClick={handleLogin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            backgroundColor: 'var(--theme-primary)',
            color: colors.background.default,
            padding: '8px 0',
            borderRadius: '8px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--theme-accent)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--theme-primary)';
          }}
        >
          Einloggen
        </motion.button>
      </form>
      <p style={{ 
        marginTop: '16px', 
        textAlign: 'center', 
        color: colors.text.muted 
      }}>
        Noch kein Konto?{' '}
        <Link 
          to='/register' 
          style={{ 
            color: 'var(--theme-primary)', 
            textDecoration: 'none' 
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
        >
          Registrieren
        </Link>
      </p>
      <p style={{ 
        marginTop: '8px', 
        textAlign: 'center' 
      }}>
        <button
          type='button'
          onClick={handleForgotPassword}
          style={{ 
            color: 'var(--theme-primary)', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
        >
          Passwort vergessen?
        </button>
      </p>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMsg}
      />
    </AuthLayout>
  );
};
export default LoginPage;
