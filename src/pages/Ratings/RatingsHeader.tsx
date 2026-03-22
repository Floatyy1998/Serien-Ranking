/**
 * RatingsHeader - Sticky header with title, stats row, and tab navigation.
 *
 * CSS classes for layout, inline styles ONLY for theme colors.
 */

import { Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { GradientText, TabSwitcher } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import type { RatingsStats } from './useRatingsData';

interface RatingsHeaderProps {
  theme: ReturnType<typeof useTheme>['currentTheme'];
  stats: RatingsStats;
  activeTab: 'series' | 'movies';
  seriesCount: number;
  moviesCount: number;
  onTabChange: (id: string) => void;
}

export const RatingsHeader = React.memo<RatingsHeaderProps>(
  ({ theme, stats, activeTab, seriesCount, moviesCount, onTabChange }) => (
    <div
      className="ratings-sticky-header"
      style={{
        background: `${theme.background.default}ee`,
      }}
    >
      <div className="ratings-header-inner">
        <div className="ratings-header-row">
          <GradientText
            as="h1"
            from={theme.text.primary}
            to={theme.accent}
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Star style={{ fontSize: 28, color: theme.accent, WebkitTextFillColor: 'initial' }} />
            Meine Bewertungen
          </GradientText>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ratings-stats-row"
        >
          <div
            className="ratings-stat-card"
            style={{
              background: theme.background.surface,
              borderColor: theme.border.default,
            }}
          >
            <span className="ratings-stat-value">{stats.count}</span>
            <span className="ratings-stat-label" style={{ color: theme.text.muted }}>
              bewertet
            </span>
          </div>
          <div className="ratings-stat-card ratings-stat-card--average">
            <Star className="ratings-stat-star" />
            <span className="ratings-stat-value ratings-stat-value--average">
              {stats.average.toFixed(1)}
            </span>
            <span className="ratings-stat-label" style={{ color: theme.text.muted }}>
              Durchschnitt
            </span>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <TabSwitcher
        tabs={[
          { id: 'series', label: 'Serien', icon: TvIcon, count: seriesCount },
          { id: 'movies', label: 'Filme', icon: MovieIcon, count: moviesCount },
        ]}
        activeTab={activeTab}
        onTabChange={onTabChange}
        style={{ margin: '0 20px 16px 20px' }}
      />
    </div>
  )
);

RatingsHeader.displayName = 'RatingsHeader';
