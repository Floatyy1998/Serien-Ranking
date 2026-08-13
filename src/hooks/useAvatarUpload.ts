import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MAX_UPLOAD_BYTES, uploadProfileImage } from '../services/profileImage';
import { showToast } from '../lib/toast';
import { t } from '../services/i18n';

/**
 * Gemeinsamer Ablauf fürs Profilbild: Datei wählen, zuschneiden, hochladen.
 * Wird von den Einstellungen und vom Profil-Hub benutzt — beide zeigen dasselbe
 * Zuschneide-Sheet, damit die Vorschau nicht an einer Stelle fehlt.
 */
export const useAvatarUpload = (onUploaded?: (url: string) => void) => {
  const { user } = useAuth() || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  /** Öffnet die Dateiauswahl des Systems. */
  const pickFile = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Zuruecksetzen, sonst loest dieselbe Datei beim naechsten Mal kein change aus.
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(t('Das ist kein Bild'), 2500, 'error');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast(t('Bild darf maximal 10 MB groß sein'), 2500, 'error');
      return;
    }
    setPendingFile(file);
  }, []);

  const cancelCrop = useCallback(() => setPendingFile(null), []);

  const confirmCrop = useCallback(
    async (cropped: Blob) => {
      if (!user) return;
      setUploading(true);
      try {
        const url = await uploadProfileImage(user, cropped);
        setPendingFile(null);
        onUploaded?.(url);
        showToast(t('Profilbild erfolgreich hochgeladen!'), 2500, 'success');
      } catch {
        showToast(t('Fehler beim Hochladen des Bildes'), 3000, 'error');
      } finally {
        setUploading(false);
      }
    },
    [user, onUploaded]
  );

  return {
    fileInputRef,
    pickFile,
    handleFileSelected,
    pendingFile,
    cancelCrop,
    confirmCrop,
    uploading,
  };
};
