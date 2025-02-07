import { TextField } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './Authlayout';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        navigate('/');
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  return (
    <>
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
              sx={{ backgroundColor: 'inherit  ' }}
            />
            <TextField
              margin='dense'
              label='Password'
              type='password'
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ backgroundColor: 'inherit  ' }}
            />
          </div>
          <motion.button
            onClick={handleLogin}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
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
      </AuthLayout>
    </>
  );
};

export default LoginPage;
