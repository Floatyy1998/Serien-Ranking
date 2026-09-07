/** Pet-Begleiter an/aus — ausgeschaltet steht die Zeit für die Pets still. */

import { Pets } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePetEnabled } from '../../../hooks/pet/usePetEnabled';
import { t } from '../../../services/i18n';
import { setPetEnabled } from '../../../services/pet/petPreferences';

export const PetSection = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const enabled = usePetEnabled();
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
    </motion.div>
  );
});

PetSection.displayName = 'PetSection';
