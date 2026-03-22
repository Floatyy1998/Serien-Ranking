import {
  ChevronRight,
  Edit,
  Palette,
  PersonOutline,
  PhotoCamera,
  Public,
  PublicOff,
  Share,
  Tour,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import type { useTheme } from '../../contexts/ThemeContext';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

/* ------------------------------------------------------------------ */
/*  ProfileAvatar                                                      */
/* ------------------------------------------------------------------ */

interface ProfileAvatarProps {
  photoURL: string;
  displayName: string;
  username: string;
  uploading: boolean;
  currentTheme: Theme;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileAvatar = memo(
  ({
    photoURL,
    displayName,
    username,
    uploading,
    currentTheme,
    fileInputRef,
    onImageUpload,
  }: ProfileAvatarProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="ps-avatar-section"
    >
      <div className="ps-avatar-wrapper">
        <div
          className="ps-avatar-glow"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}40, ${currentTheme.accent}40)`,
          }}
        />
        <div
          className="ps-avatar-circle"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          }}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={`Profilbild von ${displayName || username || 'Benutzer'}`}
              className="ps-avatar-img"
            />
          ) : (
            <PersonOutline style={{ fontSize: '48px', color: currentTheme.text.secondary }} />
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Profilbild hochladen"
          className="ps-avatar-upload-btn"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          <PhotoCamera
            style={{ fontSize: '18px', color: currentTheme.text.secondary }}
            aria-hidden="true"
          />
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          aria-hidden="true"
          tabIndex={-1}
          className="ps-avatar-file-input"
        />
      </div>

      {uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ps-uploading-text"
          style={{ color: currentTheme.text.secondary }}
        >
          Bild wird hochgeladen...
        </motion.div>
      )}
    </motion.div>
  )
);

ProfileAvatar.displayName = 'ProfileAvatar';

/* ------------------------------------------------------------------ */
/*  EditableField                                                      */
/* ------------------------------------------------------------------ */

interface EditableFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  onToggleEdit: () => void;
  placeholder: string;
  currentTheme: Theme;
}

export const EditableField = memo(
  ({
    id,
    label,
    value,
    onChange,
    editable,
    onToggleEdit,
    placeholder,
    currentTheme,
  }: EditableFieldProps) => (
    <div className="ps-field">
      <div className="ps-field-header" style={{ color: currentTheme.text.secondary }}>
        <label htmlFor={id}>{label}</label>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleEdit}
          aria-label={editable ? `${label}-Bearbeitung beenden` : `${label} ändern`}
          className="ps-edit-btn"
          style={{
            background: editable ? `${currentTheme.primary}20` : 'transparent',
            color: currentTheme.primary,
          }}
        >
          <Edit style={{ fontSize: '15px' }} aria-hidden="true" />
          {editable ? 'Bearbeiten' : 'Ändern'}
        </motion.button>
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!editable}
        placeholder={placeholder}
        className="ps-input"
        style={{
          background: editable
            ? currentTheme.background.surfaceHover
            : currentTheme.background.surface,
          border: `1px solid ${editable ? `${currentTheme.primary}40` : currentTheme.border.default}`,
          color: currentTheme.text.primary,
        }}
      />
    </div>
  )
);

EditableField.displayName = 'EditableField';

/* ------------------------------------------------------------------ */
/*  PrivacyToggleCard                                                  */
/* ------------------------------------------------------------------ */

interface PrivacyToggleCardProps {
  isPublic: boolean;
  onToggle: () => void;
  onShareLink: () => void;
  currentTheme: Theme;
}

export const PrivacyToggleCard = memo(
  ({ isPublic, onToggle, onShareLink, currentTheme }: PrivacyToggleCardProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="ps-card"
    >
      <motion.button
        role="switch"
        aria-checked={isPublic}
        aria-label={
          isPublic
            ? 'Profil ist öffentlich, zum Deaktivieren klicken'
            : 'Profil ist privat, zum Aktivieren klicken'
        }
        whileTap={{ scale: 0.99 }}
        onClick={onToggle}
        className="ps-privacy-toggle"
      >
        <div className="ps-privacy-left">
          <div
            className="ps-privacy-icon-box"
            style={{
              background: isPublic
                ? `${currentTheme.status.success}20`
                : currentTheme.background.surface,
            }}
          >
            {isPublic ? (
              <Public style={{ fontSize: '22px', color: currentTheme.status.success }} />
            ) : (
              <PublicOff style={{ fontSize: '22px', color: currentTheme.text.muted }} />
            )}
          </div>
          <div>
            <h2 className="ps-privacy-title" style={{ color: currentTheme.text.primary }}>
              Öffentliches Profil
            </h2>
            <p className="ps-privacy-subtitle" style={{ color: currentTheme.text.muted }}>
              {isPublic ? 'Deine Liste ist öffentlich sichtbar' : 'Deine Liste ist privat'}
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="ps-toggle-track"
          style={{
            background: isPublic
              ? `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`
              : `${currentTheme.text.muted}30`,
            boxShadow: isPublic ? `0 2px 10px ${currentTheme.status.success}40` : 'none',
          }}
        >
          <motion.div
            animate={{ left: isPublic ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="ps-toggle-thumb"
          />
        </div>
      </motion.button>

      {isPublic && (
        <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          whileTap={{ scale: 0.98 }}
          onClick={onShareLink}
          className="ps-share-btn"
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            color: currentTheme.primary,
          }}
        >
          <Share style={{ fontSize: '18px' }} />
          Öffentlichen Link kopieren
        </motion.button>
      )}
    </motion.div>
  )
);

PrivacyToggleCard.displayName = 'PrivacyToggleCard';

/* ------------------------------------------------------------------ */
/*  NavigationOptions                                                  */
/* ------------------------------------------------------------------ */

interface NavigationOptionsProps {
  onNavigateTheme: () => void;
  onRestartTour: () => void;
  currentTheme: Theme;
}

export const NavigationOptions = memo(
  ({ onNavigateTheme, onRestartTour, currentTheme }: NavigationOptionsProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="ps-options"
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onNavigateTheme}
        className="ps-option-btn"
        style={{ color: currentTheme.text.primary }}
      >
        <div className="ps-option-left">
          <div
            className="ps-option-icon-box"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.accent}1f, ${currentTheme.accent}1f)`,
            }}
          >
            <Palette style={{ fontSize: '20px', color: currentTheme.accent }} />
          </div>
          <span className="ps-option-label">Theme Editor</span>
        </div>
        <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onRestartTour}
        className="ps-option-btn"
        style={{ color: currentTheme.text.primary }}
      >
        <div className="ps-option-left">
          <div
            className="ps-option-icon-box"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.status.info.main}20, ${currentTheme.status.info.main}20)`,
            }}
          >
            <Tour style={{ fontSize: '20px', color: currentTheme.status.info.main }} />
          </div>
          <span className="ps-option-label">Tour neu starten</span>
        </div>
        <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
      </motion.button>
    </motion.div>
  )
);

NavigationOptions.displayName = 'NavigationOptions';

/* ------------------------------------------------------------------ */
/*  StatusMessage                                                      */
/* ------------------------------------------------------------------ */

interface StatusMessageProps {
  type: 'error' | 'success';
  message: string;
  currentTheme: Theme;
}

export const StatusMessage = memo(({ type, message, currentTheme }: StatusMessageProps) => {
  if (!message) return null;

  if (type === 'error') {
    return (
      <motion.div
        role="alert"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ps-alert ps-alert-error"
      >
        {message}
      </motion.div>
    );
  }

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ps-alert"
      style={{
        background: `${currentTheme.status.success}15`,
        border: `1px solid ${currentTheme.status.success}40`,
        color: currentTheme.status.success,
      }}
    >
      {message}
    </motion.div>
  );
});

StatusMessage.displayName = 'StatusMessage';
