import { Settings } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader } from '../../components/ui';
import {
  EditableField,
  NavigationOptions,
  PrivacyToggleCard,
  ProfileAvatar,
  StatusMessage,
} from './ProfileSettingsComponents';
import { useProfileSettings } from './useProfileSettings';
import './ProfileSettingsPage.css';

export const ProfileSettingsPage = memo(() => {
  const { currentTheme } = useTheme();

  const {
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
  } = useProfileSettings();

  return (
    <div className="ps-page" style={{ background: currentTheme.background.default }}>
      {/* Decorative Background */}
      <div className="ps-bg-decorative">
        <div
          className="ps-bg-blob-left"
          style={{
            background: `radial-gradient(ellipse, ${currentTheme.primary}15 0%, transparent 70%)`,
          }}
        />
        <div
          className="ps-bg-blob-right"
          style={{
            background: `radial-gradient(ellipse, ${currentTheme.accent}14 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Header */}
      <PageHeader
        title="Profil-Einstellungen"
        icon={<Settings style={{ fontSize: 22, color: currentTheme.accent }} />}
        actions={
          usernameEditable || displayNameEditable ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="ps-save-btn"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </motion.button>
          ) : undefined
        }
      />

      {/* Status Messages */}
      <div className="ps-messages">
        <StatusMessage type="error" message={error} currentTheme={currentTheme} />
        <StatusMessage type="success" message={success} currentTheme={currentTheme} />
      </div>

      {/* Content */}
      <div className="ps-content">
        {/* Profile Avatar */}
        <ProfileAvatar
          photoURL={photoURL}
          displayName={displayName}
          username={username}
          uploading={uploading}
          currentTheme={currentTheme}
          fileInputRef={fileInputRef}
          onImageUpload={handleImageUpload}
        />

        {/* Form Fields Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ps-card"
        >
          <EditableField
            id="settings-username"
            label="Benutzername"
            value={username}
            onChange={setUsername}
            editable={usernameEditable}
            onToggleEdit={() => setUsernameEditable(!usernameEditable)}
            placeholder="Wähle einen Benutzernamen"
            currentTheme={currentTheme}
          />
          <EditableField
            id="settings-displayname"
            label="Anzeigename"
            value={displayName}
            onChange={setDisplayName}
            editable={displayNameEditable}
            onToggleEdit={() => setDisplayNameEditable(!displayNameEditable)}
            placeholder="Dein Anzeigename"
            currentTheme={currentTheme}
          />
        </motion.div>

        {/* Privacy Settings */}
        <PrivacyToggleCard
          isPublic={isPublic}
          onToggle={handleTogglePublic}
          onShareLink={generateMyPublicLink}
          currentTheme={currentTheme}
        />

        {/* Navigation Options */}
        <NavigationOptions
          onNavigateTheme={navigateToTheme}
          onRestartTour={handleRestartTour}
          currentTheme={currentTheme}
        />
      </div>
    </div>
  );
});

ProfileSettingsPage.displayName = 'ProfileSettingsPage';
