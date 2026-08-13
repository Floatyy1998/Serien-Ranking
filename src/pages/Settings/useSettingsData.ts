import firebase from 'firebase/compat/app';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { trackLogout } from '../../services/firebase/analytics';
import { syncUserSearchIndex } from '../../services/firebase/userSearchIndex';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { hapticSelect, hapticSuccess, hapticWarning } from '../../lib/haptics';
import { copyTextToClipboard } from '../../utils/clipboard';
import { dbRef, dbUpdate, paths, userPath } from '../../services/db/ref';
import { t } from '../../services/i18n';
import { shareLink } from '../../services/share/shareLink';
import { showToast } from '../../lib/toast';

export const useSettingsData = () => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [displayNameEditable, setDisplayNameEditable] = useState(false);
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(false);
  const [publicProfileId, setPublicProfileId] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'info' });

  // Load user data from Firebase
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        const userRef = dbRef(paths.user(user.uid));
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData) {
          setDisplayName(userData.displayName || userData.username || user.displayName || '');
          setPhotoURL(userData.photoURL || user.photoURL || '');
          setIsPublicProfile(userData.isPublicProfile || false);
          setPublicProfileId(userData.publicProfileId || '');
        } else {
          setDisplayName(user.displayName || '');
          setPhotoURL(user.photoURL || '');
          setIsPublicProfile(false);
          setPublicProfileId('');
        }
      } catch {
        // Silent fail
      }
    };

    loadUserData();
  }, [user]);

  // Zentrales Toast-System (lib/toast): zentriert, gestapelt, aria-live.
  const showSnackbar = useCallback((message: string) => {
    showToast(message, 3000);
  }, []);

  const handleLogout = useCallback(async () => {
    if (window.confirm(t('Möchtest du dich wirklich abmelden?'))) {
      try {
        trackLogout();
        await firebase.auth().signOut();
        navigate('/');
      } catch {
        // Silent fail
      }
    }
  }, [navigate]);

  // Datei waehlen, zuschneiden, hochladen — gemeinsamer Ablauf mit dem
  // Profil-Hub, damit die Zuschneide-Vorschau an keiner Stelle fehlt.
  const avatar = useAvatarUpload(setPhotoURL);

  const saveDisplayName = useCallback(async () => {
    if (!user || !displayName.trim()) return;

    try {
      setSaving(true);
      await user.updateProfile({ displayName: displayName });
      // username spiegelt den Anzeigenamen — er ist kein eigenes UI-Feld mehr,
      // steckt aber weiter in geteilten Daten (Suche, Leaderboard, Diskussionen).
      await dbRef(paths.user(user.uid)).update({
        displayName,
        displayNameLower: displayName.toLowerCase(),
        username: displayName,
        usernameLower: displayName.toLowerCase(),
      });
      // Such-Index spiegeln (best-effort, wirft nie)
      void syncUserSearchIndex(user.uid, { displayName, username: displayName });
      await user.reload();
      setDisplayNameEditable(false);
      showSnackbar(t('Anzeigename gespeichert!'));
    } catch {
      setDialog({
        open: true,
        message: t('Fehler beim Speichern des Anzeigenamens'),
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

        // Multi-Path Update: user-eigene Felder UND oeffentlicher Lookup
        // (publicProfiles/{publicId}/userId) damit unauthentifizierte
        // Visitor das Profil ueber den publicId-Path resolven koennen.
        const updates: Record<string, unknown> = {
          [userPath(user.uid, 'isPublicProfile')]: enabled,
          [userPath(user.uid, 'publicProfileId')]: enabled ? newPublicProfileId : null,
        };
        if (enabled && newPublicProfileId) {
          updates[`publicProfiles/${newPublicProfileId}`] = { userId: user.uid };
        }
        if (!enabled && publicProfileId) {
          updates[`publicProfiles/${publicProfileId}`] = null;
        }
        await dbUpdate(updates);

        setIsPublicProfile(enabled);
        setPublicProfileId(enabled ? newPublicProfileId : '');

        hapticSelect();
      } catch {
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
    void copyTextToClipboard(publicUrl).then((ok) => {
      if (!ok) return;
      hapticSuccess();
      showSnackbar(t('Link kopiert!'));
    });
  }, [publicProfileId, showSnackbar]);

  const sharePublicLink = useCallback(async () => {
    if (!publicProfileId) return;

    const publicUrl = `${window.location.origin}/public/${publicProfileId}`;
    const result = await shareLink({
      url: publicUrl,
      title: 'TV-Rank',
      text: t('Schau dir mein TV-Rank-Profil an!'),
    });
    if (result === 'shared') {
      hapticSuccess();
    } else if (result === 'copied') {
      hapticSuccess();
      showSnackbar(t('Link kopiert!'));
    } else if (result === 'failed') {
      showSnackbar(t('Teilen nicht möglich'));
    }
  }, [publicProfileId, showSnackbar]);

  const regeneratePublicId = useCallback(async () => {
    if (!user || !isPublicProfile) return;

    setIsLoadingProfile(true);
    try {
      const newPublicProfileId = generatePublicId();
      const oldPublicId = publicProfileId;

      // Atomic: alten Lookup loeschen, neuen anlegen, user-Feld updaten.
      const updates: Record<string, unknown> = {
        [userPath(user.uid, 'publicProfileId')]: newPublicProfileId,
        [`publicProfiles/${newPublicProfileId}`]: { userId: user.uid },
      };
      if (oldPublicId && oldPublicId !== newPublicProfileId) {
        updates[`publicProfiles/${oldPublicId}`] = null;
      }
      await dbUpdate(updates);

      setPublicProfileId(newPublicProfileId);

      hapticWarning();
    } catch {
      // Silent fail
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user, isPublicProfile, publicProfileId]);

  return {
    // Profile state
    displayName,
    setDisplayName,
    photoURL,
    uploading: avatar.uploading,
    saving,
    displayNameEditable,
    setDisplayNameEditable,
    fileInputRef: avatar.fileInputRef,

    // Public profile state
    isPublicProfile,
    publicProfileId,
    isLoadingProfile,

    // UI state
    dialog,
    setDialog,

    // Handlers
    handleLogout,
    avatar,
    saveDisplayName,
    handlePublicProfileToggle,
    copyPublicLink,
    sharePublicLink,
    regeneratePublicId,

    // Navigation
    navigate,
  };
};
