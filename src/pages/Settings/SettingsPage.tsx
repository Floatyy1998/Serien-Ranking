/**
 * SettingsPage - Premium Settings Experience
 * Beautiful settings interface with modern styling
 */

import {
  Check,
  ChevronRight,
  ContentCopy,
  Edit,
  Link,
  Logout,
  Palette,
  Person,
  PhotoCamera,
  Public,
  Refresh,
  ViewQuilt,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, PageHeader } from '../../components/ui';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [displayNameEditable, setDisplayNameEditable] = useState(false);
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(false);
  const [publicProfileId, setPublicProfileId] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'info' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        const userRef = firebase.database().ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData) {
          setUsername(userData.username || '');
          setDisplayName(userData.displayName || user.displayName || '');
          setPhotoURL(userData.photoURL || user.photoURL || '');
          setIsPublicProfile(userData.isPublicProfile || false);
          setPublicProfileId(userData.publicProfileId || '');
        } else {
          setUsername('');
          setDisplayName(user.displayName || '');
          setPhotoURL(user.photoURL || '');
          setIsPublicProfile(false);
          setPublicProfileId('');
        }
      } catch (error) {
        // Silent fail
      }
    };

    loadUserData();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm('Möchtest du dich wirklich abmelden?')) {
      try {
        await firebase.auth().signOut();
        navigate('/');
      } catch (error) {
        // Silent fail
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 100 * 1024 * 1024) {
      setDialog({ open: true, message: 'Bild darf maximal 100MB groß sein', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(`profile-images/${user.uid}`);

      await imageRef.put(file);
      const downloadURL = await imageRef.getDownloadURL();

      await user.updateProfile({ photoURL: downloadURL });
      await firebase.database().ref(`users/${user.uid}/photoURL`).set(downloadURL);
      await user.reload();

      setPhotoURL(downloadURL);
      setSnackbar({ open: true, message: 'Profilbild erfolgreich hochgeladen!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Hochladen des Bildes', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const saveUsername = async () => {
    if (!user || !username.trim()) return;

    try {
      setSaving(true);
      await firebase.database().ref(`users/${user.uid}/username`).set(username);
      setUsernameEditable(false);
      setSnackbar({ open: true, message: 'Benutzername gespeichert!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
    } catch (error) {
      setDialog({
        open: true,
        message: 'Fehler beim Speichern des Benutzernamens',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveDisplayName = async () => {
    if (!user || !displayName.trim()) return;

    try {
      setSaving(true);
      await user.updateProfile({ displayName: displayName });
      await firebase.database().ref(`users/${user.uid}/displayName`).set(displayName);
      await user.reload();
      setDisplayNameEditable(false);
      setSnackbar({ open: true, message: 'Anzeigename gespeichert!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
    } catch (error) {
      setDialog({
        open: true,
        message: 'Fehler beim Speichern des Anzeigenamens',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const generatePublicId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const handlePublicProfileToggle = async (enabled: boolean) => {
    if (!user) return;

    setIsLoadingProfile(true);
    try {
      let newPublicProfileId = publicProfileId;

      if (enabled && !publicProfileId) {
        newPublicProfileId = generatePublicId();
      }

      await firebase
        .database()
        .ref(`users/${user.uid}`)
        .update({
          isPublicProfile: enabled,
          publicProfileId: enabled ? newPublicProfileId : null,
        });

      setIsPublicProfile(enabled);
      setPublicProfileId(enabled ? newPublicProfileId : '');

      if (navigator.vibrate) navigator.vibrate(50);
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const copyPublicLink = () => {
    if (!publicProfileId) return;

    const publicUrl = `${window.location.origin}/public/${publicProfileId}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      setSnackbar({ open: true, message: 'Link kopiert!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
    });
  };

  const regeneratePublicId = async () => {
    if (!user || !isPublicProfile) return;

    setIsLoadingProfile(true);
    try {
      const newPublicProfileId = generatePublicId();

      await firebase.database().ref(`users/${user.uid}`).update({
        publicProfileId: newPublicProfileId,
      });

      setPublicProfileId(newPublicProfileId);

      if (navigator.vibrate) navigator.vibrate(100);
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
        paddingBottom: '100px',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, #8b5cf620, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <PageHeader
        title="Einstellungen"
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
      />

      {/* Content */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '16px',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={`Profilbild von ${displayName || username || 'Benutzer'}`}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${currentTheme.primary}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Person style={{ fontSize: '40px', color: 'white' }} />
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Profilbild hochladen"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                  border: `2px solid ${currentTheme.background.surface}`,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {uploading ? (
                  '...'
                ) : (
                  <PhotoCamera style={{ fontSize: '16px' }} aria-hidden="true" />
                )}
              </motion.button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              aria-hidden="true"
              tabIndex={-1}
              style={{ display: 'none' }}
            />
            <p
              style={{
                color: currentTheme.text.muted,
                fontSize: '12px',
                margin: 0,
                textAlign: 'center',
              }}
            >
              Tippe auf die Kamera um ein neues Profilbild hochzuladen
            </p>
          </div>

          {/* Username Field */}
          <div
            style={{
              background: currentTheme.background.default,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '12px',
                    color: currentTheme.text.muted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Benutzername
                </label>
                {usernameEditable ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{
                        flex: 1,
                        background: currentTheme.background.surface,
                        border: `1px solid ${currentTheme.primary}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: currentTheme.text.primary,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                      placeholder="Benutzername eingeben"
                      autoFocus
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={saveUsername}
                      disabled={saving}
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      {saving ? '...' : <Check style={{ fontSize: '16px' }} />}
                    </motion.button>
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: '15px',
                      color: currentTheme.text.primary,
                      fontWeight: 500,
                    }}
                  >
                    {username || 'Nicht festgelegt'}
                  </span>
                )}
              </div>
              {!usernameEditable && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setUsernameEditable(true)}
                  aria-label="Benutzername ändern"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentTheme.text.muted,
                    cursor: 'pointer',
                    padding: '8px',
                  }}
                >
                  <Edit style={{ fontSize: '18px' }} aria-hidden="true" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Display Name Field */}
          <div
            style={{
              background: currentTheme.background.default,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '12px',
                    color: currentTheme.text.muted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Anzeigename
                </label>
                {displayNameEditable ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{
                        flex: 1,
                        background: currentTheme.background.surface,
                        border: `1px solid ${currentTheme.primary}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: currentTheme.text.primary,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                      placeholder="Anzeigename eingeben"
                      autoFocus
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={saveDisplayName}
                      disabled={saving}
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      {saving ? '...' : <Check style={{ fontSize: '16px' }} />}
                    </motion.button>
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: '15px',
                      color: currentTheme.text.primary,
                      fontWeight: 500,
                    }}
                  >
                    {displayName || 'Nicht festgelegt'}
                  </span>
                )}
              </div>
              {!displayNameEditable && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDisplayNameEditable(true)}
                  aria-label="Anzeigename ändern"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentTheme.text.muted,
                    cursor: 'pointer',
                    padding: '8px',
                  }}
                >
                  <Edit style={{ fontSize: '18px' }} aria-hidden="true" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/theme')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '18px',
            background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}08)`,
            border: `1px solid ${currentTheme.primary}30`,
            borderRadius: '16px',
            color: currentTheme.text.primary,
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palette style={{ fontSize: '24px', color: 'white' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Design & Themes</h2>
            <p style={{ fontSize: '13px', color: currentTheme.text.muted, margin: '2px 0 0 0' }}>
              Farben und Aussehen anpassen
            </p>
          </div>
          <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
        </motion.button>

        {/* Homepage Layout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/home-layout')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '18px',
            background: `linear-gradient(135deg, #a855f715, #a855f708)`,
            border: `1px solid #a855f730`,
            borderRadius: '16px',
            color: currentTheme.text.primary,
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, #a855f7, #6366f1)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ViewQuilt style={{ fontSize: '24px', color: 'white' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Homepage Layout</h2>
            <p style={{ fontSize: '13px', color: currentTheme.text.muted, margin: '2px 0 0 0' }}>
              Sektionen sortieren & ausblenden
            </p>
          </div>
          <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
        </motion.button>

        {/* Public Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              margin: '0 0 16px 0',
              color: currentTheme.text.primary,
            }}
          >
            Öffentliches Profil
          </h2>

          {/* Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              background: currentTheme.background.default,
              borderRadius: '12px',
              border: `1px solid ${currentTheme.border.default}`,
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <Public style={{ fontSize: '22px', color: currentTheme.primary }} />
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: currentTheme.text.primary,
                  }}
                >
                  Profil öffentlich teilen
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: currentTheme.text.muted }}>
                  Andere können deine Serien und Filme sehen
                </p>
              </div>
            </div>
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '28px',
              }}
            >
              <input
                type="checkbox"
                checked={isPublicProfile}
                onChange={(e) => handlePublicProfileToggle(e.target.checked)}
                disabled={isLoadingProfile}
                aria-label="Profil öffentlich teilen"
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isPublicProfile
                    ? currentTheme.primary
                    : `${currentTheme.text.muted}30`,
                  transition: '0.3s',
                  borderRadius: '28px',
                  opacity: isLoadingProfile ? 0.5 : 1,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    height: '20px',
                    width: '20px',
                    left: isPublicProfile ? '26px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%',
                  }}
                />
              </span>
            </label>
          </div>

          {/* Public Link */}
          {isPublicProfile && publicProfileId && (
            <div
              style={{
                background: currentTheme.background.default,
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: currentTheme.text.primary,
                }}
              >
                Dein öffentlicher Link
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: currentTheme.background.surface,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border.default}`,
                  marginBottom: '12px',
                }}
              >
                <Link style={{ fontSize: '16px', color: currentTheme.text.muted }} />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: currentTheme.text.secondary,
                    wordBreak: 'break-all',
                    flex: 1,
                  }}
                >
                  {`${window.location.origin}/public/${publicProfileId}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyPublicLink}
                  disabled={isLoadingProfile}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ContentCopy style={{ fontSize: '16px' }} />
                  Kopieren
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={regeneratePublicId}
                  disabled={isLoadingProfile}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: currentTheme.background.surface,
                    border: `1px solid ${currentTheme.border.default}`,
                    borderRadius: '10px',
                    color: currentTheme.text.secondary,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Refresh style={{ fontSize: '16px' }} />
                  Neu
                </motion.button>
              </div>
            </div>
          )}

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                padding: '10px',
                background: currentTheme.background.default,
                borderRadius: '10px',
              }}
            >
              <Public style={{ fontSize: '18px', color: currentTheme.primary, flexShrink: 0 }} />
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: currentTheme.text.muted,
                  lineHeight: 1.4,
                }}
              >
                Wenn aktiviert, können andere deine bewerteten Serien und Filme auch ohne Anmeldung
                sehen
              </p>
            </div>
          </div>
        </motion.div>

        {/* Legal & Data Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              margin: '0 0 14px 0',
              color: currentTheme.text.primary,
            }}
          >
            Rechtliches & Datenquellen
          </h2>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/privacy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                background: currentTheme.background.default,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '12px',
                color: currentTheme.text.primary,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>Datenschutzerklärung</span>
              <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/impressum')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                background: currentTheme.background.default,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '12px',
                color: currentTheme.text.primary,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>Impressum</span>
              <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
            </motion.button>
          </div>

          <div
            style={{
              padding: '14px',
              background: currentTheme.background.default,
              borderRadius: '12px',
            }}
          >
            <h3
              style={{
                fontSize: '13px',
                fontWeight: 600,
                margin: '0 0 10px 0',
                color: currentTheme.text.primary,
              }}
            >
              Datenquellen
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px',
                color: currentTheme.text.muted,
              }}
            >
              {[
                {
                  label: 'Streaming-Anbieter',
                  link: 'https://www.justwatch.com',
                  name: 'JustWatch',
                },
                { label: 'Episoden-Informationen', link: 'https://thetvdb.com', name: 'TheTVDB' },
                { label: 'Film- & Seriendaten', link: 'https://www.themoviedb.org', name: 'TMDB' },
                { label: 'Bewertungen', link: 'https://www.imdb.com', name: 'IMDb' },
              ].map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.label}:</span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: currentTheme.primary, textDecoration: 'none' }}
                  >
                    {item.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '16px',
            background: `linear-gradient(135deg, ${currentTheme.status.error}15, ${currentTheme.status.error}08)`,
            border: `1px solid ${currentTheme.status.error}30`,
            borderRadius: '16px',
            color: currentTheme.status.error,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Logout style={{ fontSize: '20px' }} />
          Abmelden
        </motion.button>
      </div>

      {/* Success Snackbar */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: `0 8px 24px ${currentTheme.status.success}40`,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: 'calc(100% - 40px)',
            }}
          >
            <Check style={{ fontSize: '20px' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
};
