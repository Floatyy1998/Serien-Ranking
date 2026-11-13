/**
 * RatingsHeader - Sticky header with title, stats row, and tab navigation.
 *
 * CSS classes for layout, inline styles ONLY for theme colors.
 */

import { ListAlt, LocalLibrary, Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { GradientText, NavEscapeButtons, SearchInput, TabSwitcher } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { RatingsStats, RatingsTab } from './useRatingsData';

interface RatingsHeaderProps {
  theme: ReturnType<typeof useTheme>['currentTheme'];
  stats: RatingsStats;
  activeTab: RatingsTab;
  seriesCount: number;
  moviesCount: number;
  /** 0 blendet den Bücher-Reiter aus. */
  booksCount?: number;
  folderCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onTabChange: (id: string) => void;
  /** Breit: Ansichts-Knöpfe rechts in der Reiter-Zeile. */
  toolbar?: React.ReactNode;
}

export const RatingsHeader = React.memo<RatingsHeaderProps>(
  ({
    theme,
    stats,
    activeTab,
    seriesCount,
    moviesCount,
    booksCount = 0,
    folderCount,
    searchValue,
    onSearchChange,
    onTabChange,
    toolbar,
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
                fontSize: 'var(--page-title-size)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                margin: 0,
                minWidth: 0,
              }}
            >
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
              placeholder={
                activeTab === 'books'
                  ? t('Bücher & Manga durchsuchen...')
                  : t('Serien & Filme durchsuchen...')
              }
            />
          </div>
        </div>

        <div className="ratings-tabs-row">
          <TabSwitcher
            tabs={[
              { id: 'series', label: t('Serien'), icon: TvIcon, count: seriesCount },
              { id: 'movies', label: t('Filme'), icon: MovieIcon, count: moviesCount },
              ...(booksCount > 0
                ? [{ id: 'books', label: t('Lesen'), icon: LocalLibrary, count: booksCount }]
                : []),
              { id: 'folders', label: t('Listen'), icon: ListAlt, count: folderCount },
            ]}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="ui-tabs--equal"
            stackCounts={booksCount > 0}
            style={{ margin: '0 20px 16px 20px' }}
          />
          {toolbar}
        </div>
      </div>
    );
  }
);

RatingsHeader.displayName = 'RatingsHeader';
