/**
 * WatchJourneyCard - Kompakte Karte für Watch Journey auf der HomePage
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

export const WatchJourneyCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const primaryColor = currentTheme.primary;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/watch-journey')}
      aria-label="Watch Journey: Trends und Entwicklung anzeigen"
      style={{
        margin: '0 20px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
        border: `1px solid ${primaryColor}30`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: 'calc(100% - 40px)',
        textAlign: 'left',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <TrendingUp style={{ fontSize: 20, color: 'white' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
          }}
        >
          Watch Journey
        </h2>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 12,
            color: currentTheme.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          Trends & Entwicklung
        </p>
      </div>

      {/* Mini Chart Preview */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', marginRight: 8 }}>
        {[30, 50, 35, 60, 45, 70].map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
            style={{
              width: 4,
              maxHeight: 24,
              borderRadius: 2,
              background: `linear-gradient(180deg, ${primaryColor}, ${primaryColor}cc)`,
              opacity: 0.3 + (i * 0.1),
            }}
          />
        ))}
      </div>

      <ChevronRight style={{ color: currentTheme.text.secondary, fontSize: 20 }} aria-hidden="true" />
    </motion.button>
  );
};

export default WatchJourneyCard;
