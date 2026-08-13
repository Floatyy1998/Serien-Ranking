import HelpOutline from '@mui/icons-material/HelpOutline';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isNewAccount } from '../../lib/pageTour';
import { hapticTap } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { tapScaleSmall } from '../../lib/motion';
import { resetSeenTours } from '../../services/pageTour';
import { t } from '../../services/i18n';

export const PageToursSection = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};

  // Wer die Hilfen gar nicht bekommt, braucht auch den Knopf nicht.
  if (!isNewAccount(user?.metadata?.creationTime)) return null;

  const handleClick = () => {
    hapticTap();
    resetSeenTours(user?.uid);
    showToast(t('Seitenhilfen werden wieder angezeigt'), 2500, 'success');
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      whileTap={tapScaleSmall}
      onClick={handleClick}
      className="settings-nav-btn"
      style={{ color: currentTheme.text.primary }}
    >
      <div
        className="settings-nav-btn-icon"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
        }}
      >
        <HelpOutline style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
      </div>
      <div className="settings-nav-btn-text">
        <h2 className="settings-nav-btn-title">{t('Seitenhilfen zurücksetzen')}</h2>
        <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
          {t('Die Kurzhilfe erscheint beim nächsten Besuch jeder Seite erneut')}
        </p>
      </div>
    </motion.button>
  );
});

PageToursSection.displayName = 'PageToursSection';
