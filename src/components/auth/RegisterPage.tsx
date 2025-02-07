import { Snackbar, TextField } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './Authlayout';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    // Passwort muss mindestens 8 Zeichen, sowie Groß-, Kleinbuchstaben, Ziffer und Sonderzeichen enthalten
    const re =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return re.test(password);
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const handleRegister = () => {
    if (!validateEmail(email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (!validatePassword(password)) {
      setPasswordError(
        'Das Passwort muss mindestens 8 Zeichen lang sein und Groß-, Kleinbuchstaben, Ziffern sowie Sonderzeichen enthalten.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Sende Bestätigungsmail
        userCredential.user?.sendEmailVerification();
        setSnackbarMsg('Bestätigungsmail wurde gesendet.');
        setOpenSnackbar(true);
        navigate('/');
      })
      .catch((error) => {
        setSnackbarMsg(error.message);
        setOpenSnackbar(true);
      });
  };

  return (
    <AuthLayout title='Registrieren'>
      <form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
        <div>
          <TextField
            margin='dense'
            label='Email'
            type='email'
            fullWidth
            value={email}
            sx={{ backgroundColor: 'inherit' }}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            error={!!emailError}
            helperText={emailError}
          />
          <TextField
            margin='dense'
            label='Password'
            type='password'
            fullWidth
            value={password}
            sx={{ backgroundColor: 'inherit' }}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            error={!!passwordError}
            helperText={passwordError}
          />
          <TextField
            margin='dense'
            sx={{ backgroundColor: 'inherit' }}
            label='Passwort bestätigen'
            type='password'
            fullWidth
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError('');
            }}
            error={!!passwordError}
            helperText={passwordError}
          />
        </div>
        <motion.button
          onClick={handleRegister}
          whileHover={{
            scale: 1.02,
          }}
          whileTap={{
            scale: 0.98,
          }}
          className='w-full bg-[#00fed7] text-black py-2 rounded-lg font-semibold hover:bg-[#00fed7]/90 transition-colors'
        >
          Konto erstellen
        </motion.button>
      </form>
      <p className='mt-4 text-center text-gray-400'>
        Bereits registriert?{' '}
        <Link to='/login' className='text-[#00fed7] hover:underline'>
          Login
        </Link>
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

export default RegisterPage;
