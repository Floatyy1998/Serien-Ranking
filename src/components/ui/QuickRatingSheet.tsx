import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Save,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import '../../pages/Rating/RatingPage.css';
import { BottomSheet } from './BottomSheet';

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

  const ratingEmojis = [
    {
      min: 0.1,
      max: 3,
      icon: <SentimentVeryDissatisfied />,
      color: currentTheme.status?.error || '#e74c3c',
    },
    {
      min: 3.1,
      max: 5,
      icon: <SentimentDissatisfied />,
      color: currentTheme.status?.error || '#ff6b6b',
    },
    { min: 5.1, max: 6.5, icon: <SentimentNeutral />, color: accent },
    {
      min: 6.6,
      max: 8.5,
      icon: <SentimentSatisfied />,
      color: currentTheme.status?.success || '#4cd137',
    },
    { min: 8.6, max: 10, icon: <SentimentVerySatisfied />, color: currentTheme.primary },
  ];

  const activeEmoji = ratingEmojis.findIndex((e) => rating >= e.min && rating <= e.max);

  const handleChange = (value: number) => {
    setRating(value);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSave = () => {
    if (rating > 0) {
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

        {/* Rating display */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: rating > 0 ? accent : currentTheme.text.muted,
              lineHeight: 1,
            }}
          >
            {rating > 0 ? rating.toFixed(1) : '0.0'}
          </span>
          <span
            style={{
              fontSize: '16px',
              color: currentTheme.text.muted,
              marginLeft: '4px',
            }}
          >
            / 10
          </span>
        </div>

        {/* Emoji indicators */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {ratingEmojis.map((emoji, i) => (
            <motion.div
              key={i}
              onClick={() => handleChange(Math.round((emoji.min + emoji.max) / 2))}
              whileTap={{ scale: 0.9 }}
              style={{
                opacity: activeEmoji === i ? 1 : 0.25,
                color: emoji.color,
                fontSize: '28px',
                cursor: 'pointer',
                display: 'flex',
                transition: 'opacity 0.2s',
              }}
            >
              {emoji.icon}
            </motion.div>
          ))}
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={rating}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            className="rate-range"
            style={{
              width: '100%',
              background: `linear-gradient(to right, ${accent} 0%, ${accent} ${rating * 10}%, ${currentTheme.background.surface} ${rating * 10}%, ${currentTheme.background.surface} 100%)`,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 2px',
              marginTop: '4px',
            }}
          >
            {[0, 2, 4, 6, 8, 10].map((v) => (
              <span
                key={v}
                style={{
                  fontSize: '11px',
                  color: currentTheme.text.muted,
                  opacity: 0.6,
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Quick select */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '20px',
            justifyContent: 'center',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
            <motion.button
              key={v}
              onClick={() => handleChange(v)}
              whileTap={{ scale: 0.9 }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: Math.round(rating) === v ? accent : currentTheme.background.surface,
                color:
                  Math.round(rating) === v
                    ? currentTheme.background.default
                    : currentTheme.text.muted,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {v}
            </motion.button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
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
