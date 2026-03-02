/**
 * useSettingsData - Custom hook for all SettingsPage state and Firebase operations
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';

export const useSettingsData = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;

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

  // Load user data from Firebase
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

  const showSnackbar = useCallback((message: string) => {
    setSnackbar({ open: true, message });
    setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
  }, []);

  const handleLogout = useCallback(async () => {
    if (window.confirm('Möchtest du dich wirklich abmelden?')) {
      try {
        await firebase.auth().signOut();
        navigate('/');
      } catch (error) {
        // Silent fail
      }
    }
  }, [navigate]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        showSnackbar('Profilbild erfolgreich hochgeladen!');
      } catch (error) {
        setDialog({
          open: true,
          message: 'Fehler beim Hochladen des Bildes',
          type: 'error',
        });
      } finally {
        setUploading(false);
      }
    },
    [user, showSnackbar]
  );

  const saveUsername = useCallback(async () => {
    if (!user || !username.trim()) return;

    try {
      setSaving(true);
      await firebase.database().ref(`users/${user.uid}/username`).set(username);
      setUsernameEditable(false);
      showSnackbar('Benutzername gespeichert!');
    } catch (error) {
      setDialog({
        open: true,
        message: 'Fehler beim Speichern des Benutzernamens',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }, [user, username, showSnackbar]);

  const saveDisplayName = useCallback(async () => {
    if (!user || !displayName.trim()) return;

    try {
      setSaving(true);
      await user.updateProfile({ displayName: displayName });
      await firebase.database().ref(`users/${user.uid}/displayName`).set(displayName);
      await user.reload();
      setDisplayNameEditable(false);
      showSnackbar('Anzeigename gespeichert!');
    } catch (error) {
      setDialog({
        open: true,
        message: 'Fehler beim Speichern des Anzeigenamens',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }, [user, displayName, showSnackbar]);

  const generatePublicId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const handlePublicProfileToggle = useCallback(
    async (enabled: boolean) => {
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
    },
    [user, publicProfileId]
  );

  const copyPublicLink = useCallback(() => {
    if (!publicProfileId) return;

    const publicUrl = `${window.location.origin}/public/${publicProfileId}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      showSnackbar('Link kopiert!');
    });
  }, [publicProfileId, showSnackbar]);

  const regeneratePublicId = useCallback(async () => {
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
  }, [user, isPublicProfile]);

  return {
    // Profile state
    username,
    setUsername,
    displayName,
    setDisplayName,
    photoURL,
    uploading,
    saving,
    usernameEditable,
    setUsernameEditable,
    displayNameEditable,
    setDisplayNameEditable,
    fileInputRef,

    // Public profile state
    isPublicProfile,
    publicProfileId,
    isLoadingProfile,

    // UI state
    dialog,
    setDialog,
    snackbar,

    // Handlers
    handleLogout,
    handleImageUpload,
    saveUsername,
    saveDisplayName,
    handlePublicProfileToggle,
    copyPublicLink,
    regeneratePublicId,

    // Navigation
    navigate,
  };
};
