/**
 * StatsComponents - Memoized subcomponents for StatsPage
 * Extracted JSX sections: AnimatedRing, HeroSection, ActorUniverseBanner,
 * TimeBreakdown, RatingsSection, TopGenres, TopProviders, WeekActivity
 */

import { AutoAwesome, EmojiEvents, Movie, Timer, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { memo } from 'react';
import { GradientText } from '../../components/ui';
import type { StatsData, FormattedTime } from './useStatsData';
import { formatTimeDetailed } from './useStatsData';

export {
  RatingsSection,
  TopGenresSection,
  TopProvidersSection,
  WeekActivitySection,
} from './StatsDetailSections';

/* ------------------------------------------------------------------ */
/*  Theme color type (minimal surface needed by subcomponents)         */
/* ------------------------------------------------------------------ */
interface ThemeColors {
  primary: string;
  accent?: string;
  background: { default: string; surface: string };
  text: { primary: string; secondary: string; muted: string };
  border: { default: string };
  status: { success: string; error: string; warning: string };
}

/* ------------------------------------------------------------------ */
/*  AnimatedRing                                                       */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  HeroSection                                                        */
/* ------------------------------------------------------------------ */
interface HeroSectionProps {
  stats: StatsData;
  timeData: FormattedTime;
  theme: ThemeColors;
}

export const HeroSection = memo(({ stats, timeData, theme }: HeroSectionProps) => (
  <motion.div
    className="stats-hero"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: `linear-gradient(135deg, ${theme.background.surface}ee, ${theme.background.surface}cc)`,
      border: `1px solid ${theme.border.default}`,
      boxShadow: `0 8px 32px ${theme.primary}15`,
    }}
  >
    {/* Main Time Stat */}
    <div className="stats-hero-time">
      <motion.div
        className="stats-hero-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        style={{
          background: `linear-gradient(135deg, ${theme.primary}20, ${theme.accent || theme.primary}10)`,
          border: `3px solid ${theme.primary}40`,
        }}
      >
        <Timer style={{ fontSize: 48, color: theme.accent || theme.primary }} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GradientText
          as="span"
          to={theme.primary}
          style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-2px' }}
        >
          {timeData.value}
        </GradientText>
        <span className="stats-hero-unit" style={{ color: theme.text.secondary }}>
          {timeData.unit}
        </span>
        {timeData.details && (
          <span className="stats-hero-details" style={{ color: theme.text.muted }}>
            , {timeData.details}
          </span>
        )}
      </motion.div>
      <p className="stats-hero-subtitle" style={{ color: theme.text.muted }}>
        Gesamte Watchtime
      </p>
    </div>

    {/* Progress Ring */}
    <div className="stats-progress-area">
      <div className="stats-ring-wrapper">
        <AnimatedRing progress={stats.progress} size={90} strokeWidth={8} color={theme.primary} />
        <div className="stats-ring-label">
          <span className="stats-ring-percent">{Math.min(99, Math.round(stats.progress))}%</span>
          <span className="stats-ring-text" style={{ color: theme.text.muted }}>
            Fortschritt
          </span>
        </div>
      </div>

      <div className="stats-progress-info">
        <div className="stats-progress-count">
          <span className="stats-progress-value">
            {stats.watchedEpisodes.toLocaleString('de-DE')}
          </span>
          <span className="stats-progress-total" style={{ color: theme.text.muted }}>
            {' '}
            / {stats.totalEpisodes.toLocaleString('de-DE')}
          </span>
        </div>
        <p className="stats-progress-label" style={{ color: theme.text.muted }}>
          Episoden geschaut
        </p>
      </div>
    </div>

    {/* Quick Stats Row */}
    <QuickStatsGrid stats={stats} theme={theme} />
  </motion.div>
));
HeroSection.displayName = 'HeroSection';

/* ------------------------------------------------------------------ */
/*  QuickStatsGrid                                                     */
/* ------------------------------------------------------------------ */
interface QuickStatsGridProps {
  stats: StatsData;
  theme: ThemeColors;
}

const QuickStatsGrid = memo(({ stats, theme }: QuickStatsGridProps) => {
  const items = [
    {
      icon: <Tv style={{ fontSize: 20 }} />,
      value: stats.totalSeries,
      label: 'Serien',
      color: theme.primary,
    },
    {
      icon: <Movie style={{ fontSize: 20 }} />,
      value: stats.totalMovies,
      label: 'Filme',
      color: theme.accent || theme.primary,
    },
    {
      icon: <EmojiEvents style={{ fontSize: 20 }} />,
      value: stats.completedSeries,
      label: 'Fertig',
      color: theme.status.success,
    },
  ];

  return (
    <div className="stats-quick-grid">
      {items.map((stat, i) => (
        <motion.div
          key={i}
          className="stats-quick-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          style={{
            background: theme.background.surface,
            border: `1px solid ${theme.border.default}`,
          }}
        >
          <div className="stats-quick-icon" style={{ color: stat.color }}>
            {stat.icon}
          </div>
          <div className="stats-quick-value">{stat.value}</div>
          <div className="stats-quick-label" style={{ color: theme.text.muted }}>
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
});
QuickStatsGrid.displayName = 'QuickStatsGrid';

/* ------------------------------------------------------------------ */
/*  ActorUniverseBanner                                                */
/* ------------------------------------------------------------------ */
interface ActorUniverseBannerProps {
  theme: ThemeColors;
  onNavigate: () => void;
}

export const ActorUniverseBanner = memo(({ theme, onNavigate }: ActorUniverseBannerProps) => (
  <motion.div
    className="stats-actor-banner"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onNavigate}
    style={{
      background: `linear-gradient(135deg, ${theme.background.default} 0%, ${theme.background.surface} 50%, ${theme.background.surface} 100%)`,
      border: `1px solid ${theme.primary}30`,
    }}
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
        <h2 className="stats-actor-title">Actor Universe</h2>
        <p className="stats-actor-subtitle">Entdecke Verbindungen zwischen Schauspielern</p>
      </div>
      <div
        className="stats-actor-badge"
        style={{
          background: `${theme.primary}30`,
          color: `${theme.primary}cc`,
        }}
      >
        Erkunden
      </div>
    </div>
  </motion.div>
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

/* ------------------------------------------------------------------ */
/*  TimeBreakdownSection                                               */
/* ------------------------------------------------------------------ */
interface TimeBreakdownProps {
  seriesMinutes: number;
  movieMinutes: number;
  theme: ThemeColors;
}

export const TimeBreakdownSection = memo(
  ({ seriesMinutes, movieMinutes, theme }: TimeBreakdownProps) => (
    <motion.div
      className="stats-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <h2 className="stats-section-title">
        <Timer style={{ fontSize: 20, color: theme.accent || theme.primary }} />
        Zeit-Aufteilung
      </h2>
      <div className="stats-time-row">
        <div
          className="stats-time-card"
          style={{
            background: theme.background.surface,
            border: `1px solid ${theme.border.default}`,
          }}
        >
          <Tv style={{ fontSize: 24, color: theme.primary, marginBottom: '8px' }} />
          <div className="stats-time-value">{formatTimeDetailed(seriesMinutes)}</div>
          <div className="stats-time-label" style={{ color: theme.text.muted }}>
            Serien
          </div>
        </div>
        <div
          className="stats-time-card"
          style={{
            background: theme.background.surface,
            border: `1px solid ${theme.border.default}`,
          }}
        >
          <Movie
            style={{ fontSize: 24, color: theme.accent || theme.primary, marginBottom: '8px' }}
          />
          <div className="stats-time-value">{formatTimeDetailed(movieMinutes)}</div>
          <div className="stats-time-label" style={{ color: theme.text.muted }}>
            Filme
          </div>
        </div>
      </div>
    </motion.div>
  )
);
TimeBreakdownSection.displayName = 'TimeBreakdownSection';
