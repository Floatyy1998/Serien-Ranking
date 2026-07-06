/**
 * RatingsEmptyState - Empty state shown when no items match the current filter.
 *
 * CSS classes for layout, inline styles ONLY for theme colors.
 */

import { Star } from '@mui/icons-material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { useTheme } from '../../contexts/ThemeContext';

interface RatingsEmptyStateProps {
  theme: ReturnType<typeof useTheme>['currentTheme'];
  activeTab: 'series' | 'movies';
  hasQuickFilter: boolean;
}

export const RatingsEmptyState = React.memo<RatingsEmptyStateProps>(
  ({ theme, activeTab, hasQuickFilter }) => {
    const navigate = useNavigate();
    return (
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
        {!hasQuickFilter && (
          <button
            type="button"
            onClick={() => navigate('/discover')}
            style={{
              marginTop: 20,
              padding: '12px 24px',
              minHeight: 44,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 700,
              background: theme.primary,
              color: getOptimalTextColor(theme.primary),
            }}
          >
            {activeTab === 'series' ? 'Serien entdecken' : 'Filme entdecken'}
          </button>
        )}
      </div>
    );
  }
);

RatingsEmptyState.displayName = 'RatingsEmptyState';
