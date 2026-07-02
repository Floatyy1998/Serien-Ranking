import PlayCircle from '@mui/icons-material/PlayCircle';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContextDef';

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
        Keine neuen Episoden
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: currentTheme.text.muted,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Schaue eine Serie an um hier
        <br />
        die nächsten Episoden zu sehen!
      </p>
    </motion.div>
  );
};
