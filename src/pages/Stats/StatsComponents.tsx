/** Fortschrittsring und Actor-Universe-Banner der Statistikseite. */

import { AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { memo } from 'react';
import { tapScaleSmall } from '../../lib/motion';
import { t } from '../../services/i18n';

interface ThemeColors {
  primary: string;
  accent?: string;
  text: { primary: string; secondary: string };
}

interface AnimatedRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  bgColor?: string;
}

export const AnimatedRing: React.FC<AnimatedRingProps> = memo(
  ({ progress, size, strokeWidth, color, bgColor }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor || `${color}20`}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
    );
  }
);
AnimatedRing.displayName = 'AnimatedRing';

interface ActorUniverseBannerProps {
  theme: ThemeColors;
  onNavigate: () => void;
}

export const ActorUniverseBanner = memo(({ theme, onNavigate }: ActorUniverseBannerProps) => (
  <motion.button
    type="button"
    className="stats-actor-banner liquid-glass"
    aria-label={t('Actor Universe entdecken – Verbindungen zwischen Schauspielern')}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    whileTap={tapScaleSmall}
    onClick={onNavigate}
  >
    {/* Animated stars */}
    {STARS.map((star, i) => (
      <motion.div
        key={i}
        className="stats-actor-star"
        animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
        transition={{
          duration: star.duration,
          repeat: Infinity,
          delay: star.delay,
        }}
        style={{
          width: star.size,
          height: star.size,
          top: star.top,
          left: star.left,
          background: theme.text.primary,
        }}
      />
    ))}

    <div className="stats-actor-content">
      <motion.div
        className="stats-actor-icon-wrap"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent || theme.primary}cc 100%)`,
          boxShadow: `0 0 30px ${theme.primary}60`,
        }}
      >
        <AutoAwesome style={{ color: theme.text.secondary, fontSize: '28px' }} />
      </motion.div>
      <div className="stats-actor-text">
        <h2 className="stats-actor-title" style={{ color: theme.text.primary }}>
          Actor Universe
        </h2>
        <p className="stats-actor-subtitle" style={{ color: theme.text.secondary }}>
          {t('Entdecke Verbindungen zwischen Schauspielern')}
        </p>
      </div>
      <div
        className="stats-actor-badge"
        style={{
          background: `${theme.primary}26`,
          color: theme.primary,
          boxShadow: `inset 0 0 0 1px ${theme.primary}40`,
        }}
      >
        {t('Erkunden')}
      </div>
    </div>
  </motion.button>
));
ActorUniverseBanner.displayName = 'ActorUniverseBanner';

/** Pre-computed random star positions for the Actor Universe banner */
const STARS = Array.from({ length: 12 }, () => ({
  size: 2 + Math.random() * 3,
  top: `${5 + Math.random() * 90}%`,
  left: `${5 + Math.random() * 90}%`,
  duration: 2 + Math.random() * 2,
  delay: Math.random() * 2,
}));
