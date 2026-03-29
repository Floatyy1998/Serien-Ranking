import { TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { ACCENT_COLORS } from './accentColors';

export const WatchJourneyLoadingState: React.FC = () => {
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme.primary;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgDefault = currentTheme.background.default;

  return (
    <div className="wj-loading" style={{ background: bgDefault }}>
      {/* Decorative background for loading */}
      <div
        className="wj-loading-blob wj-loading-blob--primary"
        style={{
          background: `radial-gradient(circle, ${primaryColor}20, transparent 70%)`,
        }}
      />
      <div
        className="wj-loading-blob wj-loading-blob--accent"
        style={{
          background: `radial-gradient(circle, ${ACCENT_COLORS.movies}15, transparent 70%)`,
        }}
      />

      {/* Animated loading icon */}
      <div className="wj-loading-icon-wrap">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="wj-loading-spinner"
          style={{
            borderColor: `${primaryColor}20`,
            borderTopColor: primaryColor,
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="wj-loading-icon-bg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}30, ${ACCENT_COLORS.movies}20)`,
          }}
        >
          <TrendingUp style={{ fontSize: 36, color: primaryColor }} />
        </motion.div>
      </div>

      <div className="wj-loading-text">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="wj-loading-title"
          style={{ color: textPrimary }}
        >
          Analysiere Watch-History...
        </motion.p>
        <p className="wj-loading-subtitle" style={{ color: textSecondary }}>
          Berechne deine persönlichen Trends
        </p>
      </div>
    </div>
  );
};
