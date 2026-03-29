/**
 * SettingsPage - Premium Settings Experience
 * Slim composition component following DiscoverPage pattern
 */

import { Check, Logout } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { Dialog, PageHeader } from '../../components/ui';
import { useSettingsData } from './useSettingsData';
import { ProfileSection } from './ProfileSection';
import { PublicProfileSection } from './PublicProfileSection';
import { AppearanceSection } from './AppearanceSection';
import { LegalSection } from './LegalSection';
import './SettingsPage.css';

export const SettingsPage = () => {
  const { currentTheme } = useTheme();

  const {
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
    isPublicProfile,
    publicProfileId,
    isLoadingProfile,
    dialog,
    setDialog,
    snackbar,
    handleLogout,
    handleImageUpload,
    saveUsername,
    saveDisplayName,
    handlePublicProfileToggle,
    copyPublicLink,
    regeneratePublicId,
    navigate,
  } = useSettingsData();

  return (
    <div className="settings-page" style={{ background: currentTheme.background.default }}>
      {/* Decorative Background */}
      <div
        className="settings-page-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.accent}1f, transparent)
          `,
        }}
      />

      {/* Header */}
      <PageHeader
        title="Einstellungen"
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
      />

      {/* Content */}
      <div className="settings-content">
        <ProfileSection
          photoURL={photoURL}
          displayName={displayName}
          username={username}
          uploading={uploading}
          saving={saving}
          usernameEditable={usernameEditable}
          displayNameEditable={displayNameEditable}
          fileInputRef={fileInputRef}
          onImageUpload={handleImageUpload}
          onUsernameChange={setUsername}
          onDisplayNameChange={setDisplayName}
          onSaveUsername={saveUsername}
          onSaveDisplayName={saveDisplayName}
          onEditUsername={() => setUsernameEditable(true)}
          onEditDisplayName={() => setDisplayNameEditable(true)}
        />

        <AppearanceSection
          onNavigateTheme={() => navigate('/theme')}
          onNavigateLayout={() => navigate('/home-layout')}
        />

        <PublicProfileSection
          isPublicProfile={isPublicProfile}
          publicProfileId={publicProfileId}
          isLoadingProfile={isLoadingProfile}
          onToggle={handlePublicProfileToggle}
          onCopyLink={copyPublicLink}
          onRegenerateId={regeneratePublicId}
        />

        <LegalSection
          onNavigatePrivacy={() => navigate('/privacy')}
          onNavigateImpressum={() => navigate('/impressum')}
        />

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="settings-logout-btn"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.status.error}15, ${currentTheme.status.error}08)`,
            border: `1px solid ${currentTheme.status.error}30`,
            color: currentTheme.status.error,
          }}
        >
          <Logout style={{ fontSize: '20px' }} />
          Abmelden
        </motion.button>
      </div>

      {/* Success Snackbar */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="settings-snackbar"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`,
            }}
          >
            <Check style={{ fontSize: '20px' }} />
            <span className="settings-snackbar-text">{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
};
