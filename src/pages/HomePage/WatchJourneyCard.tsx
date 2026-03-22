/**
 * WatchJourneyCard - Kompakte Karte für Watch Journey auf der HomePage
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TrendingUp from '@mui/icons-material/TrendingUp';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useTheme } from '../../contexts/ThemeContext';
import { IconContainer, NavCard } from '../../components/ui';

export const WatchJourneyCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme.primary;

  return (
    <NavCard
      onClick={() => navigate('/watch-journey')}
      accentColor={primaryColor}
      aria-label="Watch Journey: Trends und Entwicklung anzeigen"
    >
      <IconContainer color={primaryColor} secondaryColor={currentTheme.accent}>
        <TrendingUp style={{ fontSize: 20, color: 'white' }} />
      </IconContainer>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
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
              background: `linear-gradient(180deg, ${primaryColor}, ${currentTheme.accent || primaryColor}cc)`,
              opacity: 0.3 + i * 0.1,
            }}
          />
        ))}
      </div>

      <ChevronRight
        style={{ color: currentTheme.text.secondary, fontSize: 20 }}
        aria-hidden="true"
      />
    </NavCard>
  );
};

export default WatchJourneyCard;
