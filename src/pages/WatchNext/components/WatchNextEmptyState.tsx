import PlayCircle from '@mui/icons-material/PlayCircle';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

/** Empty-State, wenn keine nächsten Episoden anstehen. */
export const WatchNextEmptyState = () => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="watch-next-empty"
    >
      <div
        className="watch-next-empty__icon"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.status.success}15)`,
        }}
      >
        <PlayCircle style={{ fontSize: '44px', color: currentTheme.primary }} />
      </div>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: currentTheme.text.primary,
          margin: '0 0 8px 0',
        }}
      >
        {t('Keine neuen Episoden')}
      </h2>
      <p
        style={{
          fontSize: 'var(--text-base)',
          color: currentTheme.text.secondary,
          margin: '0 auto',
          maxWidth: '300px',
          lineHeight: 1.6,
        }}
      >
        {t('Schaue eine Serie an um hier die nächsten Episoden zu sehen!')}
      </p>
    </motion.div>
  );
};
