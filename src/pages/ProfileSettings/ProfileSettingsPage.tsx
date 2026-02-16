import {
  ChevronRight,
  Edit,
  Palette,
  PersonOutline,
  PhotoCamera,
  Public,
  PublicOff,
  Settings,
  Share,
  Tour,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';
import { PageHeader } from '../../components/ui';

interface UserSettingsData {
  username?: string;
  displayName?: string;
  photoURL?: string;
  isPublic?: boolean;
}

export const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isPublic, setIsPublic] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [usernameEditable, setUsernameEditable] = useState(false);
  const [displayNameEditable, setDisplayNameEditable] = useState(false);

  // Load user data from Firebase
  const { data: userData, loading: userDataLoading } = useEnhancedFirebaseCache<UserSettingsData>(
    user ? `users/${user.uid}` : '',
    {
      ttl: 5 * 60 * 1000,
      useRealtimeListener: true,
      enableOfflineSupport: true,
    }
  );

  useEffect(() => {
    if (!user || userDataLoading) return;

    if (userData) {
      setUsername(userData.username || '');
      setDisplayName(userData.displayName || '');
      setPhotoURL(userData.photoURL || user.photoURL || '');
      setIsPublic(userData.isPublic || false);
    } else {
      setUsername('');
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setIsPublic(false);
    }
  }, [user, userData, userDataLoading]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 100 * 1024 * 1024) {
      setError('Bild darf maximal 100MB groß sein');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(`profile-images/${user.uid}`);

      await imageRef.put(file);
      const downloadURL = await imageRef.getDownloadURL();

      await user.updateProfile({ photoURL: downloadURL });
      await firebase.database().ref(`users/${user.uid}/photoURL`).set(downloadURL);

      await user.reload();

      setPhotoURL(downloadURL);
      setSuccess('Profilbild erfolgreich hochgeladen');
    } catch (error: unknown) {
      setError('Fehler beim Hochladen: ' + ((error instanceof Error ? error.message : null) || 'Unbekannter Fehler'));
    } finally {
      setUploading(false);
    }
  };

  const isUsernameValid = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef.orderByChild('username').equalTo(username).once('value');

      const data = snapshot.val();
      if (!data) return true;

      const existingUsers = Object.keys(data);
      return (
        existingUsers.length === 0 || (existingUsers.length === 1 && existingUsers[0] === user.uid)
      );
    } catch (error) {
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

      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        setError('Benutzername ist bereits vergeben');
        return;
      }

      // Update Firebase
      await firebase
        .database()
        .ref(`users/${user.uid}`)
        .update({
          username: username,
          displayName: displayName || username,
          photoURL: photoURL || null,
          isPublic: isPublic,
          lastActive: firebase.database.ServerValue.TIMESTAMP,
        });

      // Update Firebase Auth
      await user.updateProfile({
        displayName: displayName || username,
        photoURL: photoURL || null,
      });

      setSuccess('Profil erfolgreich aktualisiert');
      setUsernameEditable(false);
      setDisplayNameEditable(false);
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
      await firebase.database().ref(`users/${user.uid}/isPublic`).set(newPublicState);
      setIsPublic(newPublicState);
      setSuccess(
        newPublicState ? 'Deine Liste ist jetzt öffentlich!' : 'Deine Liste ist jetzt privat!'
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

  const handleRestartTour = async () => {
    if (!user) return;

    try {
      await firebase.database().ref(`users/${user.uid}`).update({
        hasCompletedTour: false,
        tourCompletedAt: null,
        tourStep: 0,
      });
      setSuccess('Tour wird beim nächsten Besuch gestartet');
    } catch (error) {
      setError('Fehler beim Zurücksetzen der Tour');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-20%',
            width: '60%',
            height: '50%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${currentTheme.primary}15 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '-15%',
            width: '50%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, #8b5cf615 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Premium Glassmorphism Header */}
      <PageHeader
        title="Profil-Einstellungen"
        gradientTo="#8b5cf6"
        icon={<Settings style={{ fontSize: 22, color: currentTheme.primary }} />}
        actions={
          (usernameEditable || displayNameEditable) ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                border: 'none',
                borderRadius: '12px',
                padding: '10px 18px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                boxShadow: `0 4px 15px ${currentTheme.primary}40`,
              }}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </motion.button>
          ) : undefined
        }
      />

      {/* Messages below header */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 100 }}>
        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(255, 71, 87, 0.15)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginTop: '-8px',
              marginBottom: '12px',
              color: '#ff4757',
              fontSize: '14px',
            }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: `${currentTheme.status.success}15`,
              border: `1px solid ${currentTheme.status.success}40`,
              borderRadius: '12px',
              padding: '12px 16px',
              marginTop: '-8px',
              marginBottom: '12px',
              color: currentTheme.status.success,
              fontSize: '14px',
            }}
          >
            {success}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: '24px 20px',
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Profile Image Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            {/* Glow effect behind avatar */}
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentTheme.primary}40, #8b5cf640)`,
                filter: 'blur(15px)',
                opacity: 0.6,
              }}
            />
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '3px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={`Profilbild von ${displayName || username || 'Benutzer'}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <PersonOutline style={{ fontSize: '48px', color: 'white' }} />
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Profilbild hochladen"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 15px ${currentTheme.primary}50`,
              }}
            >
              <PhotoCamera style={{ fontSize: '18px', color: 'white' }} aria-hidden="true" />
            </motion.button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              aria-hidden="true"
              tabIndex={-1}
              style={{ display: 'none' }}
            />
          </div>

          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                color: currentTheme.text.secondary,
                fontSize: '13px',
                marginTop: '8px',
              }}
            >
              Bild wird hochgeladen...
            </motion.div>
          )}
        </motion.div>

        {/* Form Fields Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Username */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: currentTheme.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label htmlFor="settings-username">Benutzername</label>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setUsernameEditable(!usernameEditable)}
                aria-label={usernameEditable ? 'Benutzername-Bearbeitung beenden' : 'Benutzername ändern'}
                style={{
                  background: usernameEditable ? `${currentTheme.primary}20` : 'transparent',
                  border: 'none',
                  color: currentTheme.primary,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <Edit style={{ fontSize: '14px' }} aria-hidden="true" />
                {usernameEditable ? 'Bearbeiten' : 'Ändern'}
              </motion.button>
            </div>
            <input
              id="settings-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!usernameEditable}
              placeholder="Wähle einen Benutzernamen"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: usernameEditable
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  usernameEditable ? `${currentTheme.primary}40` : 'rgba(255, 255, 255, 0.1)'
                }`,
                borderRadius: '12px',
                color: currentTheme.text.primary,
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
          </div>

          {/* Display Name */}
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: currentTheme.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label htmlFor="settings-displayname">Anzeigename</label>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setDisplayNameEditable(!displayNameEditable)}
                aria-label={displayNameEditable ? 'Anzeigename-Bearbeitung beenden' : 'Anzeigename ändern'}
                style={{
                  background: displayNameEditable ? `${currentTheme.primary}20` : 'transparent',
                  border: 'none',
                  color: currentTheme.primary,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <Edit style={{ fontSize: '14px' }} aria-hidden="true" />
                {displayNameEditable ? 'Bearbeiten' : 'Ändern'}
              </motion.button>
            </div>
            <input
              id="settings-displayname"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!displayNameEditable}
              placeholder="Dein Anzeigename"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: displayNameEditable
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  displayNameEditable ? `${currentTheme.primary}40` : 'rgba(255, 255, 255, 0.1)'
                }`,
                borderRadius: '12px',
                color: currentTheme.text.primary,
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
        </motion.div>

        {/* Privacy Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <motion.button
            role="switch"
            aria-checked={isPublic}
            aria-label={isPublic ? 'Profil ist öffentlich, zum Deaktivieren klicken' : 'Profil ist privat, zum Aktivieren klicken'}
            whileTap={{ scale: 0.99 }}
            onClick={handleTogglePublic}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: isPublic ? `${currentTheme.status.success}20` : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isPublic ? (
                  <Public style={{ fontSize: '22px', color: currentTheme.status.success }} />
                ) : (
                  <PublicOff style={{ fontSize: '22px', color: currentTheme.text.muted }} />
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0', color: currentTheme.text.primary }}>
                  Öffentliches Profil
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: currentTheme.text.muted,
                    margin: 0,
                  }}
                >
                  {isPublic ? 'Deine Liste ist öffentlich sichtbar' : 'Deine Liste ist privat'}
                </p>
              </div>
            </div>

            <div
              aria-hidden="true"
              style={{
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                background: isPublic
                  ? `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`
                  : 'rgba(255, 255, 255, 0.15)',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: isPublic ? `0 2px 10px ${currentTheme.status.success}40` : 'none',
                flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ left: isPublic ? '22px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </motion.button>

          {isPublic && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              whileTap={{ scale: 0.98 }}
              onClick={generateMyPublicLink}
              style={{
                width: '100%',
                padding: '14px',
                background: `linear-gradient(135deg, ${currentTheme.primary}15, #8b5cf615)`,
                border: `1px solid ${currentTheme.primary}30`,
                borderRadius: '12px',
                color: currentTheme.primary,
                fontSize: '14px',
                fontWeight: 600,
                marginTop: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Share style={{ fontSize: '18px' }} />
              Öffentlichen Link kopieren
            </motion.button>
          )}
        </motion.div>

        {/* Additional Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/theme')}
            style={{
              padding: '16px 18px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              color: currentTheme.text.primary,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf620, #a855f720)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Palette style={{ fontSize: '20px', color: '#a855f7' }} />
              </div>
              <span style={{ fontWeight: 500 }}>Theme Editor</span>
            </div>
            <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleRestartTour}
            style={{
              padding: '16px 18px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              color: currentTheme.text.primary,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${currentTheme.status.info.main}20, #06b6d420)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tour style={{ fontSize: '20px', color: currentTheme.status.info.main }} />
              </div>
              <span style={{ fontWeight: 500 }}>Tour neu starten</span>
            </div>
            <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
