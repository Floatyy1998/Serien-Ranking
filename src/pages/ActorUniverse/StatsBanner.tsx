import { People } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import './ActorUniversePage.css';

interface StatsBannerProps {
  mostConnectedPair: {
    actor1: string;
    actor2: string;
    count: number;
  };
}

export const StatsBanner = ({ mostConnectedPair }: StatsBannerProps) => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="au-stats-banner"
      style={{
        background: currentTheme.background.surface,
        borderColor: currentTheme.border.default,
      }}
    >
      {/* Decorative gradient */}
      <div
        className="au-stats-decoration"
        style={{
          background: `radial-gradient(circle, ${currentTheme.primary}20 0%, transparent 70%)`,
        }}
      />

      <div className="au-stats-content">
        <div
          className="au-stats-icon"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            boxShadow: `0 4px 12px ${currentTheme.primary}40`,
          }}
        >
          <People style={{ color: currentTheme.text.secondary, fontSize: '24px' }} />
        </div>
        <div>
          <p className="au-stats-label" style={{ color: currentTheme.text.muted }}>
            Stärkstes Duo
          </p>
          <p className="au-stats-names" style={{ color: currentTheme.text.primary }}>
            {mostConnectedPair.actor1} & {mostConnectedPair.actor2}
          </p>
          <p className="au-stats-count" style={{ color: currentTheme.primary }}>
            {mostConnectedPair.count} gemeinsame Serien
          </p>
        </div>
      </div>
    </motion.div>
  );
};
