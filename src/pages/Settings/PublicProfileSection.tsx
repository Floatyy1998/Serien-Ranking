/**
 * PublicProfileSection - Toggle, share link, copy button, regenerate ID
 */

import { ContentCopy, Link, Public, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';

interface PublicProfileSectionProps {
  isPublicProfile: boolean;
  publicProfileId: string;
  isLoadingProfile: boolean;
  onToggle: (enabled: boolean) => void;
  onCopyLink: () => void;
  onRegenerateId: () => void;
}

export const PublicProfileSection = memo(
  ({
    isPublicProfile,
    publicProfileId,
    isLoadingProfile,
    onToggle,
    onCopyLink,
    onRegenerateId,
  }: PublicProfileSectionProps) => {
    const { currentTheme } = useTheme();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="settings-card"
      >
        <h2 className="settings-section-title" style={{ color: currentTheme.text.primary }}>
          Öffentliches Profil
        </h2>

        {/* Toggle */}
        <div
          className="settings-toggle-row"
          style={{
            background: currentTheme.background.default,
            borderColor: currentTheme.border.default,
          }}
        >
          <div className="settings-toggle-info">
            <Public style={{ fontSize: '22px', color: currentTheme.primary }} />
            <div>
              <h3 className="settings-toggle-title" style={{ color: currentTheme.text.primary }}>
                Profil öffentlich teilen
              </h3>
              <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted }}>
                Andere können deine Serien und Filme sehen
              </p>
            </div>
          </div>
          <label className="settings-toggle-switch">
            <input
              type="checkbox"
              checked={isPublicProfile}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={isLoadingProfile}
              aria-label="Profil öffentlich teilen"
              className="settings-toggle-input"
            />
            <span
              className="settings-toggle-track"
              style={{
                backgroundColor: isPublicProfile
                  ? currentTheme.primary
                  : `${currentTheme.text.muted}30`,
                opacity: isLoadingProfile ? 0.5 : 1,
              }}
            >
              <span
                className="settings-toggle-thumb"
                style={{ left: isPublicProfile ? '26px' : '4px' }}
              />
            </span>
          </label>
        </div>

        {/* Public Link */}
        {isPublicProfile && publicProfileId && (
          <div
            className="settings-public-link-container"
            style={{ background: currentTheme.background.default }}
          >
            <h3 className="settings-public-link-title" style={{ color: currentTheme.text.primary }}>
              Dein öffentlicher Link
            </h3>
            <div
              className="settings-public-link-display"
              style={{
                background: currentTheme.background.surface,
                borderColor: currentTheme.border.default,
              }}
            >
              <Link style={{ fontSize: '16px', color: currentTheme.text.muted }} />
              <span
                className="settings-public-link-url"
                style={{ color: currentTheme.text.secondary }}
              >
                {`${window.location.origin}/public/${publicProfileId}`}
              </span>
            </div>
            <div className="settings-public-link-actions">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCopyLink}
                disabled={isLoadingProfile}
                className="settings-action-btn settings-action-btn--primary"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                }}
              >
                <ContentCopy style={{ fontSize: '16px' }} />
                Kopieren
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onRegenerateId}
                disabled={isLoadingProfile}
                className="settings-action-btn settings-action-btn--secondary"
                style={{
                  background: currentTheme.background.surface,
                  borderColor: currentTheme.border.default,
                  color: currentTheme.text.secondary,
                }}
              >
                <Refresh style={{ fontSize: '16px' }} />
                Neu
              </motion.button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="settings-info-box" style={{ background: currentTheme.background.default }}>
          <Public style={{ fontSize: '18px', color: currentTheme.primary, flexShrink: 0 }} />
          <p className="settings-info-text" style={{ color: currentTheme.text.muted }}>
            Wenn aktiviert, können andere deine bewerteten Serien und Filme auch ohne Anmeldung
            sehen
          </p>
        </div>
      </motion.div>
    );
  }
);

PublicProfileSection.displayName = 'PublicProfileSection';
