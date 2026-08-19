/**
 * RatingsHeader - Sticky header with title, stats row, and tab navigation.
 *
 * CSS classes for layout, inline styles ONLY for theme colors.
 */

import { Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { GradientText, NavEscapeButtons, SearchInput, TabSwitcher } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { RatingsStats } from './useRatingsData';

interface RatingsHeaderProps {
  theme: ReturnType<typeof useTheme>['currentTheme'];
  stats: RatingsStats;
  activeTab: 'series' | 'movies';
  seriesCount: number;
  moviesCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onTabChange: (id: string) => void;
}

export const RatingsHeader = React.memo<RatingsHeaderProps>(
  ({
    theme,
    stats,
    activeTab,
    seriesCount,
    moviesCount,
    searchValue,
    onSearchChange,
    onTabChange,
  }) => {
    // Lokaler Wert für sofortiges Tippen; die Filter-Pipeline läuft über eine
    // Transition und würde die Eingabe sonst nachziehen lassen.
    const [localSearch, setLocalSearch] = React.useState(searchValue);
    React.useEffect(() => setLocalSearch(searchValue), [searchValue]);

    return (
      <div
        className="ratings-sticky-header"
        style={{
          background: `${theme.background.default}ee`,
        }}
      >
        <div className="ratings-header-inner">
          <div className="ratings-header-row">
            <NavEscapeButtons />
            <GradientText
              as="h1"
              from={theme.text.primary}
              to={theme.accent}
              style={{
                // Aus der NUTZBAREN Breite gerechnet (--effective-width), nicht
                // aus vw: unter Anzeige-Zoom weicht beides voneinander ab.
                fontSize: 'clamp(18px, calc(var(--effective-width, 412px) * 0.058), 26px)',
                fontWeight: 800,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              <Star
                style={{
                  fontSize: 'clamp(19px, calc(var(--effective-width, 412px) * 0.062), 28px)',
                  color: theme.accent,
                  WebkitTextFillColor: 'initial',
                  flexShrink: 0,
                }}
              />
              {t('Meine Bewertungen')}
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
                {t('bewertet')}
              </span>
            </div>
            <div className="ratings-stat-card ratings-stat-card--average">
              <Star className="ratings-stat-star" />
              <span className="ratings-stat-value ratings-stat-value--average">
                {stats.average.toFixed(1)}
              </span>
              <span className="ratings-stat-label" style={{ color: theme.text.muted }}>
                {t('Durchschnitt')}
              </span>
            </div>
          </motion.div>

          <div className="ratings-search-wrap">
            <SearchInput
              value={localSearch}
              onChange={(v) => {
                setLocalSearch(v);
                onSearchChange(v);
              }}
              placeholder={t('Serien & Filme durchsuchen...')}
            />
          </div>
        </div>

        <TabSwitcher
          tabs={[
            { id: 'series', label: t('Serien'), icon: TvIcon, count: seriesCount },
            { id: 'movies', label: t('Filme'), icon: MovieIcon, count: moviesCount },
          ]}
          activeTab={activeTab}
          onTabChange={onTabChange}
          style={{ margin: '0 20px 16px 20px' }}
        />
      </div>
    );
  }
);

RatingsHeader.displayName = 'RatingsHeader';
