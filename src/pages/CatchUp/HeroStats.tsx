import { PlayArrow, Timer, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ProgressBar } from '../../components/ui';
import { formatTime } from './useCatchUpData';

interface HeroStatsProps {
  totalEpisodes: number;
  totalMinutes: number;
  avgProgress: number;
}

export const HeroStats = memo<HeroStatsProps>(({ totalEpisodes, totalMinutes, avgProgress }) => {
  const { currentTheme } = useTheme();
  const timeData = formatTime(totalMinutes);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cu-hero"
      style={{
        background: `linear-gradient(135deg,
          ${currentTheme.background.surface}ee,
          ${currentTheme.background.surface}cc
        )`,
        border: `1px solid ${currentTheme.border.default}`,
        boxShadow: `
          0 8px 32px ${currentTheme.primary}10,
          0 2px 8px rgba(0, 0, 0, 0.08)
        `,
      }}
    >
      {/* Main Stats Row */}
      <div className="cu-hero-grid">
        {/* Episodes */}
        <div className="cu-hero-stat">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="cu-hero-icon"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.accent}20, ${currentTheme.accent}10)`,
              border: `1px solid ${currentTheme.accent}40`,
            }}
          >
            <PlayArrow style={{ fontSize: 26, color: currentTheme.accent }} />
          </motion.div>
          <div className="cu-hero-value">{totalEpisodes}</div>
          <div className="cu-hero-label" style={{ color: currentTheme.text.muted }}>
            Episoden
          </div>
        </div>

        {/* Time */}
        <div className="cu-hero-stat">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="cu-hero-icon"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.accent}20, ${currentTheme.accent}10)`,
              border: `1px solid ${currentTheme.accent}40`,
            }}
          >
            <Timer style={{ fontSize: 26, color: currentTheme.accent }} />
          </motion.div>
          <div className="cu-hero-value">{timeData.value}</div>
          <div className="cu-hero-label" style={{ color: currentTheme.text.muted }}>
            {timeData.unit}
          </div>
        </div>

        {/* Progress */}
        <div className="cu-hero-stat">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="cu-hero-icon"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent || currentTheme.primary}10)`,
              border: `1px solid ${currentTheme.primary}40`,
            }}
          >
            <TrendingUp style={{ fontSize: 26, color: currentTheme.primary }} />
          </motion.div>
          <div className="cu-hero-value">{Math.min(99, Math.round(avgProgress))}%</div>
          <div className="cu-hero-label" style={{ color: currentTheme.text.muted }}>
            Fortschritt
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar value={avgProgress} />
    </motion.div>
  );
});

HeroStats.displayName = 'HeroStats';
