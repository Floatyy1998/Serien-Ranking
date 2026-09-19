import { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../lib/interaction/toast';
import { t } from '../../services/i18n';
import { uploadDiscussionImage } from '../../services/discussion/discussionImages';
import { extractClipboardImage, resolveClipboardImage } from '../../services/media/clipboardImage';

/** Bild-Anhänge für Diskussionen und Antworten: Auswahl, Einfügen, Vorschau. */
export function useDiscussionImages() {
  const { user } = useAuth() || {};
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!user?.uid || uploading) return;
      if (!file.type.startsWith('image/')) return;
      setUploading(true);
      try {
        const url = await uploadDiscussionImage(user.uid, file);
        setImages((prev) => [...prev, url]);
      } catch (error) {
        const code = error instanceof Error ? error.message : '';
        showToast(
          code === 'too-large'
            ? t('Bild ist zu groß (max. 8 MB).')
            : t('Bild konnte nicht hochgeladen werden.'),
          4000,
          'error'
        );
      } finally {
        setUploading(false);
      }
    },
    [user?.uid, uploading]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void upload(file);
      e.target.value = '';
    },
    [upload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const { file, gifUrl } = extractClipboardImage(e.clipboardData);
      if (!file && !gifUrl) return;
      e.preventDefault();
      void resolveClipboardImage(file, gifUrl).then((resolved) => {
        if (resolved) void upload(resolved);
      });
    },
    [upload]
  );

  const removeImage = useCallback((url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  }, []);

  const reset = useCallback(() => setImages([]), []);

  return { images, uploading, handleFileSelect, handlePaste, removeImage, reset };
}
