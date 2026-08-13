import StarRate from '@mui/icons-material/StarRate';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { canOpenStoreListing, openStoreListing } from '../../services/appReview';
import { hapticTap } from '../../lib/haptics';
import { tapScaleSmall } from '../../lib/motion';
import { t } from '../../services/i18n';

export const RateAppSection = memo(() => {
  const { currentTheme } = useTheme();

  if (!canOpenStoreListing()) return null;

  const handleClick = () => {
    hapticTap();
    openStoreListing();
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
        <StarRate style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
      </div>
      <div className="settings-nav-btn-text">
        <h2 className="settings-nav-btn-title">{t('App bewerten')}</h2>
        <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
          {t('Eine Bewertung im Store hilft anderen beim Finden')}
        </p>
      </div>
    </motion.button>
  );
});

RateAppSection.displayName = 'RateAppSection';
