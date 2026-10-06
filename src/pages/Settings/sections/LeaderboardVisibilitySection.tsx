import { EmojiEvents } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { hapticSelect } from '../../../lib/interaction/haptics';
import {
  isLeaderboardHidden,
  setLeaderboardHidden,
} from '../../../services/social/leaderboardService';
import { t } from '../../../services/i18n';

export const LeaderboardVisibilitySection = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    void isLeaderboardHidden(user.uid).then((hidden) => {
      if (cancelled) return;
      setVisible(!hidden);
      setBusy(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const toggle = async (next: boolean) => {
    if (!user?.uid || busy) return;
    setBusy(true);
    setVisible(next);
    try {
      await setLeaderboardHidden(user.uid, !next);
      hapticSelect();
    } catch {
      setVisible(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="settings-card"
    >
      <h2 className="settings-section-title" style={{ color: currentTheme.text.primary }}>
        {t('Rangliste')}
      </h2>
      <div
        className="settings-toggle-row"
        style={{
          background: currentTheme.background.default,
          borderColor: currentTheme.border.default,
        }}
      >
        <div className="settings-toggle-info">
          <EmojiEvents style={{ fontSize: '22px', color: currentTheme.primary }} />
          <div>
            <h3 className="settings-toggle-title" style={{ color: currentTheme.text.primary }}>
              {t('In der globalen Rangliste erscheinen')}
            </h3>
            <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted }}>
              {t('Deine Freunde sehen dich in ihrer Rangliste weiterhin')}
            </p>
          </div>
        </div>
        <label className="settings-toggle-switch">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => void toggle(e.target.checked)}
            disabled={busy}
            aria-label={t('In der globalen Rangliste erscheinen')}
            className="settings-toggle-input"
          />
          <span
            className="settings-toggle-track"
            style={{
              backgroundColor: visible ? currentTheme.primary : `${currentTheme.text.muted}30`,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <span className="settings-toggle-thumb" style={{ left: visible ? '26px' : '4px' }} />
          </span>
        </label>
      </div>
    </motion.div>
  );
});

LeaderboardVisibilitySection.displayName = 'LeaderboardVisibilitySection';
