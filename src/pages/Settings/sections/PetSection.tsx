/** Pet-Begleiter an/aus — ausgeschaltet steht die Zeit für die Pets still. */

import { DirectionsWalk, Pets, VolumeUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePetEnabled } from '../../../hooks/pet/usePetEnabled';
import { useEffectSounds } from '../../../hooks/platform/useEffectSounds';
import { setPetRoam, usePetRoam } from '../../../hooks/pet/usePetRoam';
import { t } from '../../../services/i18n';
import { setPetEnabled } from '../../../services/pet/petPreferences';
import { setEffectSounds } from '../../../services/settings/effectSounds';

export const PetSection = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const enabled = usePetEnabled();
  const roam = usePetRoam();
  const sounds = useEffectSounds();
  const [busy, setBusy] = useState(false);

  const handleToggle = async (next: boolean) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await setPetEnabled(user.uid, next);
    } catch (error) {
      console.error('Pet toggle failed:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.23 }}
      className="settings-card"
    >
      <h2 className="settings-section-title" style={{ color: currentTheme.text.primary }}>
        {t('Dein Pet')}
      </h2>

      <div
        className="settings-toggle-row"
        style={{
          background: currentTheme.background.default,
          borderColor: currentTheme.border.default,
        }}
      >
        <div className="settings-toggle-info">
          <Pets style={{ fontSize: '22px', color: currentTheme.primary }} />
          <div>
            <h3 className="settings-toggle-title" style={{ color: currentTheme.text.primary }}>
              {t('Pet-Begleiter')}
            </h3>
            <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted }}>
              {enabled
                ? t('Widget, Reaktionen und Pet-Karten sind an.')
                : t(
                    'Ausgeschaltet. Solange steht die Zeit für dein Pet still, es bekommt keinen Hunger.'
                  )}
            </p>
          </div>
        </div>
        <label className="settings-toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={busy || !user}
            aria-label={t('Pet-Begleiter')}
            className="settings-toggle-input"
          />
          <span
            className="settings-toggle-track"
            style={{
              backgroundColor: enabled ? currentTheme.primary : `${currentTheme.text.muted}30`,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <span className="settings-toggle-thumb" style={{ left: enabled ? '26px' : '4px' }} />
          </span>
        </label>
      </div>

      {enabled && (
        <div
          className="settings-toggle-row"
          style={{
            background: currentTheme.background.default,
            borderColor: currentTheme.border.default,
            marginTop: 10,
          }}
        >
          <div className="settings-toggle-info">
            <DirectionsWalk style={{ fontSize: '22px', color: currentTheme.primary }} />
            <div>
              <h3 className="settings-toggle-title" style={{ color: currentTheme.text.primary }}>
                {t('Herumlaufen')}
              </h3>
              <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted }}>
                {roam
                  ? t('Dein Pet läuft frei über die Navigationsleiste.')
                  : t('Dein Pet bleibt an seinem Platz sitzen.')}
              </p>
            </div>
          </div>
          <label className="settings-toggle-switch">
            <input
              type="checkbox"
              checked={roam}
              onChange={(e) => setPetRoam(e.target.checked)}
              aria-label={t('Herumlaufen')}
              className="settings-toggle-input"
            />
            <span
              className="settings-toggle-track"
              style={{
                backgroundColor: roam ? currentTheme.primary : `${currentTheme.text.muted}30`,
              }}
            >
              <span className="settings-toggle-thumb" style={{ left: roam ? '26px' : '4px' }} />
            </span>
          </label>
        </div>
      )}
      <div
        className="settings-toggle-row"
        style={{
          background: currentTheme.background.default,
          borderColor: currentTheme.border.default,
          marginTop: 10,
        }}
      >
        <div className="settings-toggle-info">
          <VolumeUp style={{ fontSize: '22px', color: currentTheme.primary }} />
          <div>
            <h3 className="settings-toggle-title" style={{ color: currentTheme.text.primary }}>
              {t('Töne bei Kisten & Glücksrad')}
            </h3>
            <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted }}>
              {sounds
                ? t('Beim Öffnen und Drehen spielen Effekt-Töne.')
                : t('Kisten und Glücksrad bleiben stumm.')}
            </p>
          </div>
        </div>
        <label className="settings-toggle-switch">
          <input
            type="checkbox"
            checked={sounds}
            onChange={(e) => setEffectSounds(e.target.checked)}
            aria-label={t('Töne bei Kisten & Glücksrad')}
            className="settings-toggle-input"
          />
          <span
            className="settings-toggle-track"
            style={{
              backgroundColor: sounds ? currentTheme.primary : `${currentTheme.text.muted}30`,
            }}
          >
            <span className="settings-toggle-thumb" style={{ left: sounds ? '26px' : '4px' }} />
          </span>
        </label>
      </div>
    </motion.div>
  );
});

PetSection.displayName = 'PetSection';
