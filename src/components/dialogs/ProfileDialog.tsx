import {
  Close as CloseIcon,
  Edit,
  ExitToApp,
  PhotoCamera,
  Share,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import React, { useRef, useState } from 'react';
import { useAuth } from '../../App';
import { useFirebaseBatch } from '../../hooks/useFirebaseBatch';
import { useFirebaseCache } from '../../hooks/useFirebaseCache';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth()!;
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [displayNameEditable, setDisplayNameEditable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addUpdate: addBatchUpdate } = useFirebaseBatch({
    batchSize: 5,
    delayMs: 500,
    maxDelayMs: 2000,
  });

  // 🚀 Optimierte Profile-Daten mit Cache
  const { data: userData, loading: userDataLoading } = useFirebaseCache<any>(
    user && open ? `users/${user.uid}` : '',
    {
      ttl: 5 * 60 * 1000, // 5 Minuten Cache für Profile-Daten
      useRealtimeListener: true, // Realtime für Profile-Updates
    }
  );

  // Profildaten aus Cache laden
  React.useEffect(() => {
    if (!user || !open || userDataLoading) return;

    if (userData) {
      setUsername(userData.username || '');
      setDisplayName(userData.displayName || '');
      setPhotoURL(userData.photoURL || user.photoURL || '');
      setIsPublic(userData.isPublic || false);
    } else {
      // Falls keine Daten im Cache, verwende Firebase Auth Daten
      setUsername('');
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setIsPublic(false);
    }

    // Edit-Zustände beim Öffnen zurücksetzen
    setUsernameEditable(false);
    setDisplayNameEditable(false);
  }, [user, open, userData, userDataLoading]);

  // Öffentliche Einstellung beim Öffnen laden (entfernt, da jetzt oben abgehandelt)
  /*React.useEffect(() => {
    const loadPublicSetting = async () => {
      if (!user || !open) return;

      try {
        const userRef = firebase.database().ref(`users/${user.uid}/isPublic`);
        const snapshot = await userRef.once('value');
        setIsPublic(snapshot.val() || false);
      } catch (error) {}
    };

    loadPublicSetting();
  }, [user, open]);*/

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Bild darf maximal 5MB groß sein');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Firebase Storage Upload
      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(`profile-images/${user.uid}`);

      await imageRef.put(file);
      const downloadURL = await imageRef.getDownloadURL();

      // Sofort speichern - Profilbild in Firebase Auth aktualisieren
      await user.updateProfile({
        photoURL: downloadURL,
      });

      // Sofort speichern - Profilbild in Realtime Database aktualisieren
      await firebase
        .database()
        .ref(`users/${user.uid}/photoURL`)
        .set(downloadURL);

      // Firebase Auth User neu laden und Auth State Change forcieren
      await user.reload();

      // Zusätzliche Maßnahme: Auth State Change manuell triggern
      // Dies stellt sicher, dass alle Komponenten das Update erhalten
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        // Trigger ein manuelles Auth State Change Event
        firebase.auth().updateCurrentUser(currentUser);
      }

      setPhotoURL(downloadURL);
      setSuccess('Profilbild erfolgreich hochgeladen und gespeichert');
    } catch (error: any) {
      if (
        error.code === 'storage/unknown' ||
        error.code === 'storage/unauthorized'
      ) {
        setError(
          'Firebase Storage ist nicht korrekt konfiguriert. Bitte Storage Rules überprüfen.'
        );
      } else if (error.code === 'storage/unauthorized') {
        setError('Keine Berechtigung zum Hochladen. Bitte erneut anmelden.');
      } else {
        setError(
          'Fehler beim Hochladen des Bildes: ' +
            (error.message || 'Unbekannter Fehler')
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const isUsernameValid = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!user) return false;

    // 🚀 Cache-basierte Username-Verfügbarkeitsprüfung
    try {
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef
        .orderByChild('username')
        .equalTo(username)
        .once('value');

      const data = snapshot.val();
      if (!data) return true;

      // Username verfügbar wenn kein Eintrag oder nur eigener Eintrag
      const existingUsers = Object.keys(data);
      return (
        existingUsers.length === 0 ||
        (existingUsers.length === 1 && existingUsers[0] === user.uid)
      );
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!username.trim()) {
      setError('Benutzername ist erforderlich');
      return;
    }

    if (!isUsernameValid(username)) {
      setError(
        'Benutzername muss 3-20 Zeichen lang sein und darf nur Buchstaben, Zahlen und _ enthalten'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Username-Verfügbarkeit prüfen
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        setError('Benutzername ist bereits vergeben');
        return;
      }

      // 🚀 Batch-Updates für optimierte Firebase-Operationen
      addBatchUpdate(`users/${user.uid}/username`, username);
      addBatchUpdate(`users/${user.uid}/displayName`, displayName || username);
      addBatchUpdate(`users/${user.uid}/photoURL`, photoURL || null);
      addBatchUpdate(`users/${user.uid}/isPublic`, isPublic);
      addBatchUpdate(
        `users/${user.uid}/lastActive`,
        firebase.database.ServerValue.TIMESTAMP
      );

      // Profil in Firebase Auth aktualisieren
      await user.updateProfile({
        displayName: displayName || username,
        photoURL: photoURL || null,
      });

      setSuccess('Profil erfolgreich aktualisiert');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError('Fehler beim Speichern des Profils');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!user) return;

    try {
      const newPublicState = !isPublic;

      // 🚀 Batch-Update für Public-Status
      addBatchUpdate(`users/${user.uid}/isPublic`, newPublicState);

      setIsPublic(newPublicState);
      setSuccess(
        newPublicState
          ? 'Deine Liste ist jetzt öffentlich sichtbar!'
          : 'Deine Liste ist jetzt privat!'
      );
    } catch (error) {
      setError('Fehler beim Aktualisieren der Einstellung');
    }
  };

  const generateMyPublicLink = () => {
    const link = `${window.location.origin}/public/${user?.uid}`;
    navigator.clipboard.writeText(link);
    setSuccess('Dein öffentlicher Link wurde kopiert!');
  };

  const handleLogout = async () => {
    try {
      // 🚀 Batch-Update für Logout-Status
      if (user) {
        addBatchUpdate(`users/${user.uid}/isOnline`, false);
        addBatchUpdate(
          `users/${user.uid}/lastActive`,
          firebase.database.ServerValue.TIMESTAMP
        );
      }

      await firebase.auth().signOut();
      setSuccess('Erfolgreich ausgeloggt!');

      // Dialog schließen und zur Login-Seite weiterleiten
      setTimeout(() => {
        onClose();
        window.location.reload(); // Oder navigate('/login') wenn Router verwendet wird
      }, 1000);
    } catch (error) {
      setError('Fehler beim Ausloggen');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          mx: { xs: 2, sm: 3 },
          my: { xs: 2, sm: 4 },
          borderRadius: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle>
        <Box
          display='flex'
          alignItems='center'
          gap={1}
          sx={{
            px: { xs: 1, sm: 0 },
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
          }}
        >
          <Edit sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          Profil bearbeiten
        </Box>
      </DialogTitle>
      <IconButton
        aria-label='close'
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8, color: 'red' }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          display='flex'
          flexDirection='column'
          gap={{ xs: 2, sm: 3 }}
          sx={{ pt: { xs: 1, sm: 2 } }}
        >
          {/* Profilbild */}
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={{ xs: 1.5, sm: 2 }}
          >
            <Avatar
              src={photoURL}
              sx={{
                width: { xs: 80, sm: 120 },
                height: { xs: 80, sm: 120 },
                border: '3px solid',
                borderColor: 'primary.main',
                boxShadow: 3,
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ textAlign: 'center' }}>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept='image/*'
                style={{ display: 'none' }}
              />
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                color='primary'
                title='Profilbild ändern'
                sx={{
                  mb: 1,
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  },
                  minHeight: { xs: 44, sm: 40 },
                  minWidth: { xs: 44, sm: 40 },
                }}
              >
                {uploading ? <CircularProgress size={24} /> : <PhotoCamera />}
              </IconButton>
              <Typography
                variant='caption'
                display='block'
                textAlign='center'
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                Profilbild ändern
              </Typography>
            </Box>
          </Box>

          {/* Username */}
          <Box sx={{ position: 'relative' }}>
            <TextField
              label='Benutzername *'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              disabled={!usernameEditable}
              helperText='3-20 Zeichen, nur Buchstaben, Zahlen und _'
              error={!!username && !isUsernameValid(username)}
              sx={{
                '& .MuiInputBase-root': {
                  minHeight: { xs: 48, sm: 40 },
                  paddingRight: '48px', // Platz für das Edit-Icon
                },
                '& .Mui-disabled': {
                  color: 'text.primary !important',
                  '-webkit-text-fill-color': 'text.primary !important',
                },
                '& .Mui-disabled .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23) !important',
                },
                '& .Mui-disabled:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23) !important',
                },
                '& .MuiFormHelperText-root': {
                  backgroundColor: '#0C0C0C',
                  margin: '3px 0 0 0',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                },
              }}
            />
            <IconButton
              onClick={() => setUsernameEditable(!usernameEditable)}
              sx={{
                position: 'absolute',
                right: 8,
                top: '32%',
                transform: 'translateY(-50%)',
                color: usernameEditable ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
              }}
              size='small'
            >
              <Edit fontSize='small' />
            </IconButton>
          </Box>

          {/* Display Name */}
          <Box sx={{ position: 'relative' }}>
            <TextField
              label='Anzeigename (optional)'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
              disabled={!displayNameEditable}
              helperText='Wird anderen Nutzern angezeigt'
              sx={{
                '& .MuiInputBase-root': {
                  minHeight: { xs: 48, sm: 40 },
                  paddingRight: '48px', // Platz für das Edit-Icon
                },
                '& .Mui-disabled': {
                  color: 'text.primary !important',
                  '-webkit-text-fill-color': 'text.primary !important',
                },
                '& .Mui-disabled .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23) !important',
                },
                '& .Mui-disabled:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23) !important',
                },
                '& .MuiFormHelperText-root': {
                  backgroundColor: '#0C0C0C',
                  margin: '3px 0 0 0',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                },
              }}
            />
            <IconButton
              onClick={() => setDisplayNameEditable(!displayNameEditable)}
              sx={{
                position: 'absolute',
                right: 8,
                top: '32%',
                transform: 'translateY(-50%)',
                color: displayNameEditable ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
              }}
              size='small'
            >
              <Edit fontSize='small' />
            </IconButton>
          </Box>

          {/* Freigabe-Einstellungen */}
          <Card variant='outlined' sx={{ borderRadius: { xs: 2, sm: 1 } }}>
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                flexDirection={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent='space-between'
                gap={{ xs: 2, sm: 0 }}
                mb={{ xs: 2, sm: 2 }}
              >
                <Box sx={{ flex: { xs: 1, sm: 'auto' } }}>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Liste freigeben
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    {isPublic
                      ? 'Jeder kann deine Liste mit einem Link sehen'
                      : 'Nur deine Freunde können deine Liste sehen'}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={handleTogglePublic}
                      disabled={saving}
                      icon={<VisibilityOff />}
                      checkedIcon={<Visibility />}
                      sx={{
                        '& .MuiSwitch-switchBase': {
                          padding: { xs: '9px', sm: '9px' },
                        },
                        '& .MuiSwitch-thumb': {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 20,
                          height: 20,
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: { xs: '1.1rem', sm: '1.1rem' },
                          position: 'relative',
                          top: '1px',
                        },
                      }}
                    />
                  }
                  label=''
                  sx={{ alignSelf: { xs: 'center', sm: 'auto' } }}
                />
              </Box>

              {isPublic && (
                <Box>
                  <Button
                    variant='outlined'
                    onClick={generateMyPublicLink}
                    fullWidth
                    startIcon={<Share />}
                    sx={{
                      minHeight: { xs: 48, sm: 40 },
                      fontSize: { xs: '0.9rem', sm: '0.875rem' },
                    }}
                  >
                    Öffentlichen Link kopieren
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          {error && (
            <Alert severity='error' onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2 } }}>
        {/* Mobile Layout */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          {/* Logout Button - Mobile */}
          <Button
            onClick={handleLogout}
            color='error'
            variant='outlined'
            startIcon={<ExitToApp />}
            disabled={saving}
            fullWidth
            sx={{
              minHeight: 48,
              fontSize: '0.9rem',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
              },
            }}
          >
            Ausloggen
          </Button>

          {/* Action Buttons - Mobile */}
          <Box display='flex' gap={1.5}>
            <Button
              onClick={onClose}
              disabled={saving}
              variant='outlined'
              sx={{
                flex: 1,
                minHeight: 48,
                fontSize: '0.9rem',
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              variant='contained'
              disabled={
                saving || !username.trim() || !isUsernameValid(username)
              }
              sx={{
                flex: 1,
                minHeight: 48,
                fontSize: '0.9rem',
              }}
            >
              {saving ? <CircularProgress size={20} /> : 'Speichern'}
            </Button>
          </Box>
        </Box>

        {/* Desktop Layout */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Button
            onClick={handleLogout}
            color='error'
            variant='outlined'
            startIcon={<ExitToApp />}
            disabled={saving}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
              },
            }}
          >
            Ausloggen
          </Button>

          <Box display='flex' gap={1}>
            <Button onClick={onClose} disabled={saving}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              variant='contained'
              disabled={
                saving || !username.trim() || !isUsernameValid(username)
              }
            >
              {saving ? <CircularProgress size={20} /> : 'Speichern'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
