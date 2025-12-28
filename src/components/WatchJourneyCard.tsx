/**
 * WatchJourneyCard - Kompakte Karte für Watch Journey auf der HomePage
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

export const WatchJourneyCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/watch-journey')}
      style={{
        margin: '0 20px 16px',
        padding: '16px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, #00cec915, #00cec905)`,
        border: `1px solid #00cec930`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #00cec9, #00b894)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <TrendingUp style={{ fontSize: 24, color: 'white' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: currentTheme.text.primary,
          }}
        >
          Watch Journey
        </h3>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 13,
            color: currentTheme.text.secondary,
          }}
        >
          Deine Trends und Entwicklung
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
              background: `linear-gradient(180deg, #00cec9, #00b894)`,
              opacity: 0.3 + (i * 0.1),
            }}
          />
        ))}
      </div>

      <ChevronRight style={{ color: currentTheme.text.secondary, fontSize: 20 }} />
    </motion.div>
  );
};

export default WatchJourneyCard;
