import {
  AddPhotoAlternate,
  Close,
  Warning,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';

export const NewDiscussionForm: React.FC<{
  onSubmit: (data: { title: string; content: string; isSpoiler: boolean }) => Promise<boolean>;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!user?.uid || uploadingImage) return;

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storageRef = firebase.storage().ref(`discussions/${user.uid}/${timestamp}_${file.name}`);
      await storageRef.put(file);
      const downloadURL = await storageRef.getDownloadURL();
      setPreviewImages((prev) => [...prev, downloadURL]);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const removeImage = (imageUrl: string) => {
    setPreviewImages((prev) => prev.filter((img) => img !== imageUrl));
  };

  const handleSubmit = async () => {
    if (!title.trim() || (!content.trim() && previewImages.length === 0) || submitting) return;
    setSubmitting(true);
    // Combine text and images when submitting
    const fullContent = [content.trim(), ...previewImages].filter(Boolean).join('\n');
    const success = await onSubmit({ title: title.trim(), content: fullContent, isSpoiler });
    if (success) {
      setTitle('');
      setContent('');
      setIsSpoiler(false);
      setPreviewImages([]);
      onCancel();
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      style={{
        background: `linear-gradient(145deg, ${currentTheme.background.card}, ${currentTheme.background.surface})`,
        borderRadius: '20px',
        padding: '24px',
        border: `2px solid ${currentTheme.primary}40`,
        marginBottom: '20px',
        boxShadow: `0 8px 32px ${currentTheme.primary}20`,
      }}
    >
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: currentTheme.text.primary, margin: '0 0 16px 0' }}>
        Neue Diskussion starten
      </h4>

      <input
        type="text"
        placeholder="Gib deiner Diskussion einen Titel..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: '100%',
          padding: '14px 18px',
          marginBottom: '12px',
          borderRadius: '12px',
          border: `2px solid ${currentTheme.border.default}`,
          background: currentTheme.background.surface,
          color: currentTheme.text.primary,
          fontSize: '15px',
          fontWeight: 600,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
      />

      {/* Content Input with embedded images */}
      <div
        style={{
          marginBottom: '12px',
          borderRadius: '12px',
          border: `2px solid ${currentTheme.border.default}`,
          background: currentTheme.background.surface,
          padding: '14px 18px',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
      >
        {/* Image Previews inside input */}
        {previewImages.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {previewImages.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={img}
                  alt="Bild"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                />
                <button
                  onClick={() => removeImage(img)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: currentTheme.status.error,
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Close style={{ fontSize: '16px' }} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          placeholder={previewImages.length > 0 ? "Beschreibung hinzufügen (optional)..." : "Was möchtest du diskutieren? Teile deine Gedanken..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={previewImages.length > 0 ? 2 : 4}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: currentTheme.text.primary,
            fontSize: '15px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Actions Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${currentTheme.border.default}`,
              background: 'transparent',
              color: uploadingImage ? currentTheme.primary : currentTheme.text.secondary,
              cursor: uploadingImage ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <AddPhotoAlternate style={{ fontSize: '20px' }} />
            {uploadingImage ? 'Lädt...' : 'Bild'}
          </button>

          {/* Spoiler Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${isSpoiler ? currentTheme.status.warning + '60' : currentTheme.border.default}`,
              background: isSpoiler ? `${currentTheme.status.warning}15` : 'transparent',
              fontSize: '13px',
              fontWeight: 500,
              color: isSpoiler ? currentTheme.status.warning : currentTheme.text.secondary,
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              style={{ display: 'none' }}
            />
            <Warning style={{ fontSize: '18px' }} />
            Spoiler
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: `1px solid ${currentTheme.border.default}`,
              background: 'transparent',
              color: currentTheme.text.secondary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Abbrechen
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!title.trim() || (!content.trim() && previewImages.length === 0) || submitting || uploadingImage}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: title.trim() && (content.trim() || previewImages.length > 0) ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})` : currentTheme.background.surface,
              color: title.trim() && (content.trim() || previewImages.length > 0) ? '#fff' : currentTheme.text.muted,
              cursor: title.trim() && (content.trim() || previewImages.length > 0) ? 'pointer' : 'default',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: title.trim() && (content.trim() || previewImages.length > 0) ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {submitting ? 'Wird gepostet...' : 'Posten'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
