import { Star, StarBorder } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScale } from '../../lib/motion';
import { hapticTap } from '../../lib/haptics';
import { t } from '../../services/i18n';

interface StarRatingRowProps {
  /** Aktuelle Bewertung 1–10 (0/undefined = unbewertet). */
  value?: number;
  /** Tap auf Stern; Tap auf den aktuellen Wert liefert null (entfernen). */
  onSelect: (value: number | null) => void;
  /** Stern-Größe in px (Default 24). */
  size?: number;
}

/** Zehner-Sterne-Reihe für Folgenbewertungen (Sheet, Diskussion, Prompt). */
export const StarRatingRow: React.FC<StarRatingRowProps> = ({ value = 0, onSelect, size = 24 }) => {
  const { currentTheme } = useTheme();
  const warningColor = currentTheme.status?.warning || '#f59e0b';

  return (
    <div
      role="radiogroup"
      aria-label={t('Folge bewerten')}
      style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}
    >
      {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
        const filled = star <= value;
        const Icon = filled ? Star : StarBorder;
        return (
          <motion.button
            key={star}
            whileTap={tapScale}
            role="radio"
            aria-checked={star === value}
            aria-label={t('{n} von 10', { n: star })}
            onClick={() => {
              hapticTap();
              onSelect(star === value ? null : star);
            }}
            style={{
              width: `${size + 6}px`,
              height: `${size + 10}px`,
              minWidth: 0,
              minHeight: 0,
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: filled ? warningColor : currentTheme.text?.muted || 'rgba(255,255,255,0.35)',
            }}
          >
            <Icon style={{ fontSize: `${size}px` }} />
          </motion.button>
        );
      })}
    </div>
  );
};
