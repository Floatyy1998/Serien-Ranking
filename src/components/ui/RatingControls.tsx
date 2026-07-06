import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticSelect } from '../../lib/haptics';
import '../../pages/Rating/RatingPage.css';
import { tapScaleTight } from '../../lib/motion';

interface RatingControlsProps {
  /** Current value 0–10 (0 = nothing selected). */
  value: number;
  /** Called with the new value; the caller owns the state. */
  onChange: (value: number) => void;
}

/**
 * Geteilte Bewertungs-Controls (Emoji-Anzeige + Slider + Quick-Select 1–10).
 * Wird von `QuickRatingSheet` (Serien-Finale) und der Schnell-Bewertungs-Queue
 * (`RatingQueueSheet`, F8) genutzt, damit es genau *eine* Rating-UI gibt.
 */
export const RatingControls: React.FC<RatingControlsProps> = ({ value, onChange }) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;

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

  const activeEmoji = ratingEmojis.findIndex((e) => value >= e.min && value <= e.max);

  const handleChange = (next: number) => {
    onChange(next);
    hapticSelect();
  };

  return (
    <>
      {/* Rating display */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span
          style={{
            fontSize: '48px',
            fontWeight: 800,
            color: value > 0 ? accent : currentTheme.text.muted,
            lineHeight: 1,
          }}
        >
          {value > 0 ? value.toFixed(1) : '0.0'}
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
            whileTap={tapScaleTight}
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
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="rate-range"
          style={{
            width: '100%',
            background: `linear-gradient(to right, ${accent} 0%, ${accent} ${value * 10}%, ${currentTheme.background.surface} ${value * 10}%, ${currentTheme.background.surface} 100%)`,
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
            whileTap={tapScaleTight}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: Math.round(value) === v ? accent : currentTheme.background.surface,
              color:
                Math.round(value) === v ? currentTheme.background.default : currentTheme.text.muted,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {v}
          </motion.button>
        ))}
      </div>
    </>
  );
};
