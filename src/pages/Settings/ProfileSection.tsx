/**
 * ProfileSection - Avatar with upload, username edit, display name edit
 */

import { Check, Edit, Person, PhotoCamera } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';

interface ProfileSectionProps {
  photoURL: string;
  displayName: string;
  username: string;
  uploading: boolean;
  saving: boolean;
  usernameEditable: boolean;
  displayNameEditable: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSaveUsername: () => void;
  onSaveDisplayName: () => void;
  onEditUsername: () => void;
  onEditDisplayName: () => void;
}

export const ProfileSection = memo(
  ({
    photoURL,
    displayName,
    username,
    uploading,
    saving,
    usernameEditable,
    displayNameEditable,
    fileInputRef,
    onImageUpload,
    onUsernameChange,
    onDisplayNameChange,
    onSaveUsername,
    onSaveDisplayName,
    onEditUsername,
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
                alt={`Profilbild von ${displayName || username || 'Benutzer'}`}
                className="settings-avatar-image"
                style={{ borderColor: currentTheme.primary }}
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
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Profilbild hochladen"
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
            Tippe auf die Kamera um ein neues Profilbild hochzuladen
          </p>
        </div>

        {/* Username Field */}
        <div className="settings-field">
          <div className="settings-field-row">
            <div className="settings-field-content">
              <label className="settings-field-label" style={{ color: currentTheme.text.muted }}>
                Benutzername
              </label>
              {usernameEditable ? (
                <div className="settings-field-edit-row">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    className="settings-field-input"
                    style={{
                      background: currentTheme.background.surface,
                      borderColor: currentTheme.primary,
                      color: currentTheme.text.primary,
                    }}
                    placeholder="Benutzername eingeben"
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onSaveUsername}
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
                  {username || 'Nicht festgelegt'}
                </span>
              )}
            </div>
            {!usernameEditable && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onEditUsername}
                aria-label="Benutzername ändern"
                className="settings-field-edit-btn"
                style={{ color: currentTheme.text.muted }}
              >
                <Edit style={{ fontSize: '18px' }} aria-hidden="true" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Display Name Field */}
        <div className="settings-field settings-field--last">
          <div className="settings-field-row">
            <div className="settings-field-content">
              <label className="settings-field-label" style={{ color: currentTheme.text.muted }}>
                Anzeigename
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
                    placeholder="Anzeigename eingeben"
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
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
                  {displayName || 'Nicht festgelegt'}
                </span>
              )}
            </div>
            {!displayNameEditable && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onEditDisplayName}
                aria-label="Anzeigename ändern"
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
