import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { BottomSheet } from './BottomSheet';

interface QuickRatingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seriesTitle: string;
  seasonNumber: number;
  onRate: (rating: number) => void;
}

const RATING_OPTIONS = [
  { value: 2, Icon: SentimentVeryDissatisfied, label: 'Schlecht', color: '#ef4444' },
  { value: 4, Icon: SentimentDissatisfied, label: 'Mäßig', color: '#f97316' },
  { value: 6, Icon: SentimentNeutral, label: 'Okay', color: '#eab308' },
  { value: 8, Icon: SentimentSatisfied, label: 'Gut', color: '#22c55e' },
  { value: 10, Icon: SentimentVerySatisfied, label: 'Super', color: '#3b82f6' },
];

export const QuickRatingSheet: React.FC<QuickRatingSheetProps> = ({
  isOpen,
  onClose,
  seriesTitle,
  seasonNumber,
  onRate,
}) => {
  const { currentTheme } = useTheme();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleRate = (value: number) => {
    setSelectedRating(value);
    if (navigator.vibrate) navigator.vibrate(10);

    setTimeout(() => {
      onRate(value);
      setSelectedRating(null);
    }, 300);
  };

  const handleClose = () => {
    setSelectedRating(null);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} ariaLabel="Schnellbewertung">
      <div style={{ padding: '8px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: currentTheme.accent,
            }}
          >
            Serie abgeschlossen
          </span>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              margin: '8px 0 4px',
            }}
          >
            Wie fandest du {seriesTitle}?
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: currentTheme.text.secondary,
              margin: 0,
            }}
          >
            Staffel {seasonNumber} abgeschlossen
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {RATING_OPTIONS.map(({ value, Icon, label, color }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleRate(value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                background:
                  selectedRating === value ? `${color}22` : `${currentTheme.background.card}`,
                border: `2px solid ${selectedRating === value ? color : 'transparent'}`,
                borderRadius: '16px',
                padding: '12px 10px',
                cursor: 'pointer',
                minWidth: '56px',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon
                style={{
                  fontSize: '32px',
                  color: selectedRating === value ? color : currentTheme.text.secondary,
                  transition: 'color 0.2s ease',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: selectedRating === value ? color : currentTheme.text.secondary,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: selectedRating === value ? color : currentTheme.text.muted,
                }}
              >
                {value}
              </span>
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${currentTheme.border?.default || 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px',
            color: currentTheme.text.secondary,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Später bewerten
        </button>
      </div>
    </BottomSheet>
  );
};
