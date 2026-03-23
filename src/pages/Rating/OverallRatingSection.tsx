import {
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVeryDissatisfied,
  SentimentVerySatisfied,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';

interface OverallRatingSectionProps {
  overallRating: number;
  onRatingChange: (value: number) => void;
}

export const OverallRatingSection = ({
  overallRating,
  onRatingChange,
}: OverallRatingSectionProps) => {
  const { currentTheme } = useTheme();

  const ratingEmojis = [
    {
      value: 2,
      icon: <SentimentVeryDissatisfied />,
      label: 'Schrecklich',
      color: currentTheme.status?.error || '#e74c3c',
    },
    {
      value: 4,
      icon: <SentimentDissatisfied />,
      label: 'Schlecht',
      color: currentTheme.status?.error || '#ff6b6b',
    },
    { value: 6, icon: <SentimentNeutral />, label: 'Okay', color: currentTheme.accent },
    {
      value: 8,
      icon: <SentimentSatisfied />,
      label: 'Gut',
      color: currentTheme.status?.success || '#4cd137',
    },
    {
      value: 10,
      icon: <SentimentVerySatisfied />,
      label: 'Meisterwerk',
      color: currentTheme.primary,
    },
  ];

  return (
    <motion.div
      key="overall"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="rate-overall-section"
    >
      {/* Main Rating Display */}
      <div className="rate-main-display">
        <div className="rate-circle">
          <span className="rate-circle-number">{overallRating.toFixed(1)}</span>
          <span className="rate-circle-label">von 10</span>
        </div>

        {/* Emoji Indicators */}
        <div className="rate-emoji-row">
          {ratingEmojis.map((emoji) => (
            <motion.div
              key={emoji.value}
              className={`rate-emoji ${Math.round(overallRating) === emoji.value ? 'active' : ''}`}
              onClick={() => onRatingChange(emoji.value)}
              whileTap={{ scale: 0.9 }}
              style={{
                opacity: Math.round(overallRating) === emoji.value ? 1 : 0.3,
                color: emoji.color,
              }}
            >
              {emoji.icon}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rating Slider */}
      <div className="rate-slider-card">
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={overallRating}
          onChange={(e) => onRatingChange(parseFloat(e.target.value))}
          className="rate-range"
          style={{
            background: `linear-gradient(to right, ${currentTheme.primary} 0%, ${currentTheme.primary} ${overallRating * 10}%, var(--color-background-surface) ${overallRating * 10}%, var(--color-background-surface) 100%)`,
          }}
        />
        <div className="rate-slider-marks">
          {[0, 2, 4, 6, 8, 10].map((value) => (
            <span key={value} className="rate-mark">
              {value}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Select Grid */}
      <div className="rate-quick-card">
        <div className="rate-quick-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <motion.button
              key={value}
              className={`rate-quick-btn ${Math.round(overallRating) === value ? 'active' : ''}`}
              onClick={() => onRatingChange(value)}
              whileTap={{ scale: 0.95 }}
            >
              {value}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
