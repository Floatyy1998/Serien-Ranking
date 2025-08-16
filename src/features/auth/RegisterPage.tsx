import { Snackbar, TextField } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { colors } from '../../theme';
import { AuthLayout } from './Authlayout';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const validatePassword = (password: string) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[^\s]{8,}$/;
    return re.test(password);
  };

  const validateUsername = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const usersRef = firebase.database().ref('users');
    const snapshot = await usersRef
      .orderByChild('username')
      .equalTo(username)
      .once('value');

    return !snapshot.val(); // true wenn kein Benutzer mit diesem Username existiert
  };
  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const handleRegister = async () => {
    // Validierungen zurücksetzen
    setEmailError('');
    setPasswordError('');
    setUsernameError('');

    if (!validateEmail(email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    if (!validateUsername(username)) {
      setUsernameError(
        'Benutzername muss 3-20 Zeichen lang sein und darf nur Buchstaben, Zahlen und _ enthalten.'
      );
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError(
        'Das Passwort muss mindestens 8 Zeichen lang sein und Groß-, Kleinbuchstaben, Ziffern sowie mindestens ein Sonderzeichen enthalten.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }

    // Username-Verfügbarkeit prüfen
    try {
      const isUsernameAvailable = await checkUsernameAvailable(username);
      if (!isUsernameAvailable) {
        setUsernameError('Dieser Benutzername ist bereits vergeben.');
        return;
      }
    } catch (error) {
      setSnackbarMsg('Fehler bei der Überprüfung des Benutzernamens.');
      setOpenSnackbar(true);
      return;
    }

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        if (userCredential.user) {
          // Benutzer-Profil in Auth aktualisieren
          await userCredential.user.updateProfile({
            displayName: username,
          });

          // Benutzer-Daten in Realtime Database speichern
          await firebase
            .database()
            .ref(`users/${userCredential.user.uid}`)
            .set({
              email: email,
              username: username,
              displayName: username,
              createdAt: firebase.database.ServerValue.TIMESTAMP,
            });

          // Email-Verifizierung senden
          await userCredential.user.sendEmailVerification();
        }

        setSnackbarMsg(
          'Registrierung erfolgreich! Bestätigungsmail wurde gesendet.'
        );
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
            label='Benutzername'
            type='text'
            fullWidth
            value={username}
            sx={{ backgroundColor: 'inherit' }}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError('');
            }}
            error={!!usernameError}
            helperText={
              usernameError || '3-20 Zeichen, nur Buchstaben, Zahlen und _'
            }
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
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--theme-primary-hover)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--theme-primary)';
          }}
        >
          Konto erstellen
        </motion.button>
      </form>
      <p style={{ 
        marginTop: '16px', 
        textAlign: 'center', 
        color: colors.text.muted 
      }}>
        Bereits registriert?{' '}
        <Link 
          to='/login' 
          style={{ 
            color: 'var(--theme-primary)', 
            textDecoration: 'none' 
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
        >
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
