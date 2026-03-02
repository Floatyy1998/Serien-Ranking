/**
 * RatingsEmptyState - Empty state shown when no items match the current filter.
 *
 * CSS classes for layout, inline styles ONLY for theme colors.
 */

import { Star } from '@mui/icons-material';
import React from 'react';
import type { useTheme } from '../../contexts/ThemeContext';

interface RatingsEmptyStateProps {
  theme: ReturnType<typeof useTheme>['currentTheme'];
  activeTab: 'series' | 'movies';
  hasQuickFilter: boolean;
}

export const RatingsEmptyState = React.memo<RatingsEmptyStateProps>(
  ({ theme, activeTab, hasQuickFilter }) => (
    <div className="ratings-empty-state">
      <div className="ratings-empty-icon" style={{ background: `${theme.text.muted}10` }}>
        <Star style={{ fontSize: 48, color: theme.text.muted }} />
      </div>
      <h2 className="ratings-empty-title">
        Noch keine {activeTab === 'series' ? 'Serien' : 'Filme'}
      </h2>
      <p className="ratings-empty-text" style={{ color: theme.text.muted }}>
        {hasQuickFilter
          ? 'Keine Ergebnisse für diesen Filter'
          : `Bewerte ${activeTab === 'series' ? 'Serien' : 'Filme'} um sie hier zu sehen!`}
      </p>
    </div>
  )
);

RatingsEmptyState.displayName = 'RatingsEmptyState';
