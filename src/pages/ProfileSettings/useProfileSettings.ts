import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';

interface UserSettingsData {
  username?: string;
  displayName?: string;
  photoURL?: string;
  isPublic?: boolean;
}

export interface ProfileSettingsState {
  username: string;
  setUsername: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  photoURL: string;
  isPublic: boolean;
  uploading: boolean;
  saving: boolean;
  error: string;
  success: string;
  usernameEditable: boolean;
  setUsernameEditable: (value: boolean) => void;
  displayNameEditable: boolean;
  setDisplayNameEditable: (value: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSave: () => Promise<void>;
  handleTogglePublic: () => Promise<void>;
  generateMyPublicLink: () => void;
  handleRestartTour: () => Promise<void>;
  navigateToTheme: () => void;
}

export const useProfileSettings = (): ProfileSettingsState => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
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
    } catch (err: unknown) {
      setError(
        'Fehler beim Hochladen: ' +
          ((err instanceof Error ? err.message : null) || 'Unbekannter Fehler')
      );
    } finally {
      setUploading(false);
    }
  };

  const isUsernameValid = (uname: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(uname);
  };

  const checkUsernameAvailable = async (uname: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef.orderByChild('username').equalTo(uname).once('value');

      const data = snapshot.val();
      if (!data) return true;

      const existingUsers = Object.keys(data);
      return (
        existingUsers.length === 0 || (existingUsers.length === 1 && existingUsers[0] === user.uid)
      );
    } catch {
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

      await user.updateProfile({
        displayName: displayName || username,
        photoURL: photoURL || null,
      });

      setSuccess('Profil erfolgreich aktualisiert');
      setUsernameEditable(false);
      setDisplayNameEditable(false);
    } catch {
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
    } catch {
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
    } catch {
      setError('Fehler beim Zurücksetzen der Tour');
    }
  };

  const navigateToTheme = () => {
    navigate('/theme');
  };

  return {
    username,
    setUsername,
    displayName,
    setDisplayName,
    photoURL,
    isPublic,
    uploading,
    saving,
    error,
    success,
    usernameEditable,
    setUsernameEditable,
    displayNameEditable,
    setDisplayNameEditable,
    fileInputRef,
    handleImageUpload,
    handleSave,
    handleTogglePublic,
    generateMyPublicLink,
    handleRestartTour,
    navigateToTheme,
  };
};
