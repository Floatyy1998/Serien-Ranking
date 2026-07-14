/**
 * Memoized Bento-Pods für die StatsPage.
 * Ratings/Genres/Provider-Panels liegen in StatsDetailSections.
 */

import {
  AutoAwesome,
  EmojiEvents,
  LocalFireDepartment,
  Movie,
  Timer,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { memo } from 'react';
import { GradientText } from '../../components/ui';
import type { StatsData, FormattedTime } from './useStatsData';
import { formatTimeDetailed } from './useStatsData';
import { tapScaleSmall } from '../../lib/motion';

export { RatingsSection, TopGenresSection, TopProvidersSection } from './StatsDetailSections';

/* Theme color type (minimal surface needed by subcomponents) */
interface ThemeColors {
  primary: string;
  accent?: string;
  background: { default: string; surface: string };
  text: { primary: string; secondary: string; muted: string };
  border: { default: string };
  status: { success: string; error: string; warning: string };
}

const podIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

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

/* WatchtimePod — großer Zeit-Pod inkl. Serien/Filme-Split */
interface WatchtimePodProps {
  stats: StatsData;
  timeData: FormattedTime;
  theme: ThemeColors;
}

export const WatchtimePod = memo(({ stats, timeData, theme }: WatchtimePodProps) => {
  const totalMin = Math.max(stats.seriesMinutes + stats.movieMinutes, 1);
  const seriesShare = (stats.seriesMinutes / totalMin) * 100;
  const accent = theme.accent || theme.primary;

  return (
    <motion.div className="stats-pod stats-pod--time liquid-glass" {...podIn}>
      <div
        className="stats-pod__orb"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${theme.primary} 22%, transparent) 0%, transparent 70%)`,
        }}
        aria-hidden
      />
      <div className="stats-pod__label" style={{ color: theme.text.muted }}>
        <Timer style={{ fontSize: 16, color: accent }} />
        Gesamte Watchtime
      </div>

      <div className="stats-time-display">
        <span className="stats-time-value">
          <GradientText as="span" to={theme.primary}>
            {timeData.value}
          </GradientText>
        </span>
        <span className="stats-time-unit">{timeData.unit}</span>
        {timeData.details && (
          <span className="stats-time-details" style={{ color: theme.text.muted }}>
            + {timeData.details}
          </span>
        )}
      </div>

      <p className="stats-time-sub" style={{ color: theme.text.muted }}>
        ≙ {stats.watchedEpisodes.toLocaleString('de-DE')} Episoden &amp;{' '}
        {stats.watchedMovies.toLocaleString('de-DE')} Filme gesehen
      </p>

      <div className="stats-time-medias">
        <div
          className="stats-time-chip"
          style={{ boxShadow: `inset 0 0 0 1px ${theme.primary}2a` }}
        >
          <Tv style={{ fontSize: 18, color: theme.primary }} />
          <span className="stats-time-chip__label" style={{ color: theme.text.muted }}>
            Serien
          </span>
          <span className="stats-time-chip__value">{formatTimeDetailed(stats.seriesMinutes)}</span>
        </div>
        <div className="stats-time-chip" style={{ boxShadow: `inset 0 0 0 1px ${accent}2a` }}>
          <Movie style={{ fontSize: 18, color: accent }} />
          <span className="stats-time-chip__label" style={{ color: theme.text.muted }}>
            Filme
          </span>
          <span className="stats-time-chip__value">{formatTimeDetailed(stats.movieMinutes)}</span>
        </div>
      </div>

      <div
        className="stats-split-bar"
        style={{ background: `${theme.text.muted}2b` }}
        role="img"
        aria-label={`Serien ${Math.round(seriesShare)} Prozent der Watchtime`}
      >
        <motion.div
          className="stats-split-fill"
          initial={{ width: 0 }}
          animate={{ width: `${seriesShare}%` }}
          transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: `linear-gradient(90deg, ${theme.primary}, ${accent})` }}
        />
      </div>
    </motion.div>
  );
});
WatchtimePod.displayName = 'WatchtimePod';

/* ProgressPod — Ring + Episoden-Zähler */
interface ProgressPodProps {
  stats: StatsData;
  theme: ThemeColors;
}

export const ProgressPod = memo(({ stats, theme }: ProgressPodProps) => (
  <motion.div
    className="stats-pod stats-pod--progress liquid-glass"
    {...podIn}
    transition={{ delay: 0.08 }}
  >
    <div className="stats-pod__label" style={{ color: theme.text.muted }}>
      Fortschritt
    </div>
    <div className="stats-progress-body">
      <div className="stats-ring-wrapper">
        <AnimatedRing progress={stats.progress} size={128} strokeWidth={11} color={theme.primary} />
        <div className="stats-ring-label">
          <span className="stats-ring-percent">{Math.min(100, Math.round(stats.progress))}%</span>
          <span className="stats-ring-text" style={{ color: theme.text.muted }}>
            geschaut
          </span>
        </div>
      </div>
      <div className="stats-progress-count">
        <div>
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
  </motion.div>
));
ProgressPod.displayName = 'ProgressPod';

/* QuickPods — Serien / Filme / Fertig / Diese Woche */
interface QuickPodsProps {
  stats: StatsData;
  theme: ThemeColors;
}

export const QuickPods = memo(({ stats, theme }: QuickPodsProps) => {
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
      label: 'Serien fertig',
      color: theme.status.success,
    },
    {
      icon: <LocalFireDepartment style={{ fontSize: 20 }} />,
      value: stats.lastWeekWatched,
      label: 'Episoden diese Woche',
      color: theme.status.warning,
    },
  ];

  return (
    <>
      {items.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="stats-pod stats-pod--quick liquid-glass"
          {...podIn}
          transition={{ delay: 0.12 + i * 0.05 }}
        >
          <span className="stats-quick-ghost" style={{ color: stat.color }} aria-hidden>
            {React.cloneElement(stat.icon, { style: { fontSize: 128 } })}
          </span>
          <div
            className="stats-quick-icon"
            style={{
              color: stat.color,
              background: `${stat.color}16`,
              boxShadow: `inset 0 0 0 1px ${stat.color}2e`,
            }}
          >
            {stat.icon}
          </div>
          <div className="stats-quick-value">{stat.value.toLocaleString('de-DE')}</div>
          <div className="stats-quick-label" style={{ color: theme.text.muted }}>
            {stat.label}
          </div>
        </motion.div>
      ))}
    </>
  );
});
QuickPods.displayName = 'QuickPods';

interface ActorUniverseBannerProps {
  theme: ThemeColors;
  onNavigate: () => void;
}

export const ActorUniverseBanner = memo(({ theme, onNavigate }: ActorUniverseBannerProps) => (
  <motion.button
    type="button"
    className="stats-actor-banner liquid-glass"
    aria-label="Actor Universe entdecken – Verbindungen zwischen Schauspielern"
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
          Entdecke Verbindungen zwischen Schauspielern
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
        Erkunden
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
