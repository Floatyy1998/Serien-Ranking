import { TextField } from '@mui/material';
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
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleRegister = () => {
    if (!validateEmail(email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (!validatePassword(password)) {
      setPasswordError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        navigate('/');
      })
      .catch((error) => {
        alert(error.message);
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
    </AuthLayout>
  );
};

export default RegisterPage;
