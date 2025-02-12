import { Snackbar, TextField } from '@mui/material';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
          className='w-full bg-[#00fed7] text-black py-2 rounded-lg font-semibold hover:bg-[#00fed7]/90 transition-colors'
        >
          Einloggen
        </motion.button>
      </form>
      <p className='mt-4 text-center text-gray-400'>
        Noch kein Konto?{' '}
        <Link to='/register' className='text-[#00fed7] hover:underline'>
          Registrieren
        </Link>
      </p>
      <p className='mt-2 text-center'>
        <button
          type='button'
          onClick={handleForgotPassword}
          className='text-[#00fed7] hover:underline'
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
