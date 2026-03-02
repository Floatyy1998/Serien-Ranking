/**
 * StatsComponents - Memoized subcomponents for StatsPage
 * Extracted JSX sections: AnimatedRing, HeroSection, ActorUniverseBanner,
 * TimeBreakdown, RatingsSection, TopGenres, TopProviders, WeekActivity
 */

import {
  AutoAwesome,
  Category,
  EmojiEvents,
  LocalFireDepartment,
  Movie,
  Star,
  Stream,
  Timer,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { memo } from 'react';
import { GradientText } from '../../components/ui';
import type { StatsData, FormattedTime } from './useStatsData';
import { formatTimeDetailed } from './useStatsData';

/* ------------------------------------------------------------------ */
/*  Theme color type (minimal surface needed by subcomponents)         */
/* ------------------------------------------------------------------ */
interface ThemeColors {
  primary: string;
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
          background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}10)`,
          border: `3px solid ${theme.primary}40`,
        }}
      >
        <Timer style={{ fontSize: 48, color: theme.primary }} />
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
      color: '#f59e0b',
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
            background: `${stat.color}10`,
            border: `1px solid ${stat.color}25`,
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
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}cc 100%)`,
          boxShadow: `0 0 30px ${theme.primary}60`,
        }}
      >
        <AutoAwesome style={{ color: 'white', fontSize: '28px' }} />
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
        <Timer style={{ fontSize: 20, color: theme.primary }} />
        Zeit-Aufteilung
      </h2>
      <div className="stats-time-row">
        <div
          className="stats-time-card"
          style={{
            background: `${theme.primary}10`,
            border: `1px solid ${theme.primary}25`,
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
            background: '#f59e0b10',
            border: '1px solid #f59e0b25',
          }}
        >
          <Movie style={{ fontSize: 24, color: '#f59e0b', marginBottom: '8px' }} />
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

/* ------------------------------------------------------------------ */
/*  RatingsSection                                                     */
/* ------------------------------------------------------------------ */
interface RatingsSectionProps {
  avgSeriesRating: number;
  avgMovieRating: number;
  theme: ThemeColors;
}

export const RatingsSection = memo(
  ({ avgSeriesRating, avgMovieRating, theme }: RatingsSectionProps) => (
    <motion.div
      className="stats-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <h2 className="stats-section-title">
        <Star style={{ fontSize: 20, color: '#fbbf24' }} />
        Deine Bewertungen
      </h2>
      <div className="stats-ratings-row">
        <div className="stats-rating-card" style={{ background: '#fbbf2410' }}>
          <div className="stats-rating-value">{avgSeriesRating.toFixed(1)}</div>
          <div className="stats-rating-label" style={{ color: theme.text.muted }}>
            &Oslash; Serien
          </div>
        </div>
        <div className="stats-rating-card" style={{ background: '#fbbf2410' }}>
          <div className="stats-rating-value">{avgMovieRating.toFixed(1)}</div>
          <div className="stats-rating-label" style={{ color: theme.text.muted }}>
            &Oslash; Filme
          </div>
        </div>
      </div>
    </motion.div>
  )
);
RatingsSection.displayName = 'RatingsSection';

/* ------------------------------------------------------------------ */
/*  TopGenresSection                                                   */
/* ------------------------------------------------------------------ */
interface TopGenresProps {
  genres: { name: string; count: number }[];
  theme: ThemeColors;
}

export const TopGenresSection = memo(({ genres, theme }: TopGenresProps) => {
  if (genres.length === 0) return null;
  const maxCount = genres[0]?.count || 1;

  return (
    <motion.div
      className="stats-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <h2 className="stats-section-title">
        <Category style={{ fontSize: 20, color: theme.primary }} />
        Top Genres
      </h2>
      <div className="stats-genre-list">
        {genres.map((genre, i) => (
          <motion.div
            key={genre.name}
            className="stats-genre-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.1 }}
          >
            <span
              className="stats-genre-rank"
              style={{ color: i === 0 ? '#fbbf24' : theme.text.muted }}
            >
              #{i + 1}
            </span>
            <div className="stats-genre-info">
              <div className="stats-genre-header">
                <span className="stats-genre-name">{genre.name}</span>
                <span className="stats-genre-count" style={{ color: theme.text.muted }}>
                  {genre.count}
                </span>
              </div>
              <div
                className="stats-genre-bar-track"
                style={{ background: `${theme.text.muted}20` }}
              >
                <motion.div
                  className="stats-genre-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(genre.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.8, delay: 1 + i * 0.1 }}
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}cc)`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
TopGenresSection.displayName = 'TopGenresSection';

/* ------------------------------------------------------------------ */
/*  TopProvidersSection                                                */
/* ------------------------------------------------------------------ */
interface TopProvidersProps {
  providers: { name: string; count: number }[];
  theme: ThemeColors;
}

export const TopProvidersSection = memo(({ providers, theme }: TopProvidersProps) => {
  if (providers.length === 0) return null;

  return (
    <motion.div
      className="stats-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <h2 className="stats-section-title">
        <Stream style={{ fontSize: 20, color: '#06b6d4' }} />
        Streaming-Dienste
      </h2>
      <div className="stats-provider-list">
        {providers.map((provider, i) => (
          <motion.div
            key={provider.name}
            className="stats-provider-chip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + i * 0.1 }}
            style={{
              background: i === 0 ? `${theme.primary}20` : `${theme.text.muted}10`,
              border: `1px solid ${i === 0 ? theme.primary : theme.text.muted}25`,
            }}
          >
            <span className="stats-provider-name">{provider.name}</span>
            <span
              className="stats-provider-count"
              style={{
                background: `${theme.text.muted}20`,
                color: theme.text.muted,
              }}
            >
              {provider.count}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
TopProvidersSection.displayName = 'TopProvidersSection';

/* ------------------------------------------------------------------ */
/*  WeekActivitySection                                                */
/* ------------------------------------------------------------------ */
interface WeekActivityProps {
  lastWeekWatched: number;
  theme: ThemeColors;
}

export const WeekActivitySection = memo(({ lastWeekWatched, theme }: WeekActivityProps) => (
  <motion.div
    className="stats-week"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.2 }}
    style={{
      background: `linear-gradient(135deg, ${theme.status.success}15, ${theme.primary}15)`,
      border: `1px solid ${theme.status.success}30`,
    }}
  >
    <div className="stats-week-content">
      <div
        className="stats-week-icon"
        style={{
          background: `linear-gradient(135deg, ${theme.status.success}, ${theme.primary})`,
        }}
      >
        <LocalFireDepartment style={{ fontSize: 28, color: '#fff' }} />
      </div>
      <div>
        <div className="stats-week-value">{lastWeekWatched}</div>
        <div className="stats-week-label" style={{ color: theme.text.muted }}>
          Episoden diese Woche
        </div>
      </div>
    </div>
  </motion.div>
));
WeekActivitySection.displayName = 'WeekActivitySection';
