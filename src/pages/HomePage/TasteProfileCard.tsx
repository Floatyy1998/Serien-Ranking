/**
 * TasteProfileCard - KI Geschmacksprofil Karte für die HomePage "Für dich" Section
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useTheme } from '../../contexts/ThemeContextDef';
import { IconContainer, NavCard } from '../../components/ui';

const ACCENT = '#a855f7';

export const TasteProfileCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <NavCard
      onClick={() => navigate('/taste-profile')}
      accentColor={ACCENT}
      aria-label="KI Geschmacksprofil: Dein Seriengeschmack analysiert"
    >
      <IconContainer color={ACCENT} secondaryColor="#ec4899">
        <AutoAwesome style={{ fontSize: 20, color: 'white' }} />
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
          KI-Empfehlungen
        </h2>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 12,
            color: currentTheme.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          Personalisierte Vorschläge
        </p>
      </div>

      {/* Animated sparkle dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: 8 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ delay: i * 0.2, duration: 1.5, repeat: Infinity }}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${ACCENT}, #ec4899)`,
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

export default TasteProfileCard;
