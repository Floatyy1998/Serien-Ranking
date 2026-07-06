import { Save } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { hapticSuccess } from '../../lib/haptics';
import { BottomSheet } from './BottomSheet';
import { RatingControls } from './RatingControls';
import { tapScale } from '../../lib/motion';

interface QuickRatingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seriesTitle: string;
  seasonNumber?: number;
  onRate: (rating: number) => void;
}

export const QuickRatingSheet: React.FC<QuickRatingSheetProps> = ({
  isOpen,
  onClose,
  seriesTitle,
  onRate,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const [rating, setRating] = useState(0);

  const handleSave = () => {
    if (rating > 0) {
      hapticSuccess();
      onRate(rating);
      setRating(0);
    }
  };

  const handleClose = () => {
    setRating(0);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} ariaLabel="Schnellbewertung">
      <div style={{ padding: '8px 24px 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: accent,
            }}
          >
            Keine weiteren Folgen
          </span>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              margin: '8px 0 4px',
            }}
          >
            {seriesTitle} bewerten?
          </h3>
        </div>

        <RatingControls value={rating} onChange={setRating} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            whileTap={tapScale}
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: `1px solid ${currentTheme.border?.default || 'rgba(255,255,255,0.1)'}`,
              borderRadius: 'var(--radius-md)',
              color: currentTheme.text.secondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--duration-fast) ease',
            }}
          >
            Später
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={rating === 0}
            style={{
              flex: 1,
              padding: '14px',
              background: rating > 0 ? accent : `${accent}30`,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: rating > 0 ? currentTheme.background.default : `${accent}60`,
              fontSize: '14px',
              fontWeight: 700,
              cursor: rating > 0 ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Save style={{ fontSize: '18px' }} />
            Speichern
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
};
