import { Check, Edit, Person, PhotoCamera } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScaleTight } from '../../lib/motion';
import { t } from '../../services/i18n';

interface ProfileSectionProps {
  photoURL: string;
  displayName: string;
  uploading: boolean;
  saving: boolean;
  displayNameEditable: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDisplayNameChange: (value: string) => void;
  onSaveDisplayName: () => void;
  onEditDisplayName: () => void;
}

export const ProfileSection = memo(
  ({
    photoURL,
    displayName,
    uploading,
    saving,
    displayNameEditable,
    fileInputRef,
    onImageUpload,
    onDisplayNameChange,
    onSaveDisplayName,
    onEditDisplayName,
  }: ProfileSectionProps) => {
    const { currentTheme } = useTheme();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="settings-card"
      >
        {/* Avatar */}
        <div className="settings-avatar-wrapper">
          <div className="settings-avatar-container">
            {photoURL ? (
              <img
                src={photoURL}
                alt={t('Profilbild von {name}', { name: displayName || t('Benutzer') })}
                className="settings-avatar-image"
                style={{ borderColor: currentTheme.primary }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="settings-avatar-placeholder"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                }}
              >
                <Person style={{ fontSize: '40px', color: currentTheme.text.secondary }} />
              </div>
            )}
            <motion.button
              whileTap={tapScaleTight}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label={t('Profilbild hochladen')}
              className="settings-avatar-upload-btn"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                borderColor: currentTheme.background.surface,
              }}
            >
              {uploading ? '...' : <PhotoCamera style={{ fontSize: '16px' }} aria-hidden="true" />}
            </motion.button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImageUpload}
            accept="image/*"
            aria-hidden="true"
            tabIndex={-1}
            style={{ display: 'none' }}
          />
          <p className="settings-avatar-hint" style={{ color: currentTheme.text.muted }}>
            {t('Tippe auf die Kamera um ein neues Profilbild hochzuladen')}
          </p>
        </div>

        {/* Display Name Field */}
        <div className="settings-field settings-field--last">
          <div className="settings-field-row">
            <div className="settings-field-content">
              <label className="settings-field-label" style={{ color: currentTheme.text.muted }}>
                {t('Anzeigename')}
              </label>
              {displayNameEditable ? (
                <div className="settings-field-edit-row">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => onDisplayNameChange(e.target.value)}
                    className="settings-field-input"
                    style={{
                      background: currentTheme.background.surface,
                      borderColor: currentTheme.primary,
                      color: currentTheme.text.primary,
                    }}
                    placeholder={t('Anzeigename eingeben')}
                    autoFocus
                  />
                  <motion.button
                    whileTap={tapScaleTight}
                    onClick={onSaveDisplayName}
                    disabled={saving}
                    className="settings-field-save-btn"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`,
                    }}
                  >
                    {saving ? '...' : <Check style={{ fontSize: '16px' }} />}
                  </motion.button>
                </div>
              ) : (
                <span className="settings-field-value" style={{ color: currentTheme.text.primary }}>
                  {displayName || t('Nicht festgelegt')}
                </span>
              )}
            </div>
            {!displayNameEditable && (
              <motion.button
                whileTap={tapScaleTight}
                onClick={onEditDisplayName}
                aria-label={t('Anzeigename ändern')}
                className="settings-field-edit-btn"
                style={{ color: currentTheme.text.muted }}
              >
                <Edit style={{ fontSize: '18px' }} aria-hidden="true" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

ProfileSection.displayName = 'ProfileSection';
