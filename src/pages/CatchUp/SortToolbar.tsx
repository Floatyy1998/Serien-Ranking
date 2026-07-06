import {
  ArrowDownward,
  ArrowUpward,
  Bolt,
  MovieFilter,
  Timer,
  TrendingUp,
} from '@mui/icons-material';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { SortOption, SortDirection } from './useCatchUpData';

interface SortToolbarProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  currentLabel: string;
  onSortClick: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; icon: React.ReactNode; label: string }[] = [
  {
    value: 'episodes',
    icon: <MovieFilter style={{ fontSize: 18 }} />,
    label: 'Nach Episoden sortieren',
  },
  {
    value: 'time',
    icon: <Timer style={{ fontSize: 18 }} />,
    label: 'Nach verbleibender Zeit sortieren',
  },
  {
    value: 'progress',
    icon: <TrendingUp style={{ fontSize: 18 }} />,
    label: 'Nach Fortschritt sortieren',
  },
  {
    value: 'recent',
    icon: <Bolt style={{ fontSize: 18 }} />,
    label: 'Nach zuletzt geschaut sortieren',
  },
];

export const SortToolbar = memo<SortToolbarProps>(
  ({ sortBy, sortDirection, currentLabel, onSortClick }) => {
    const { currentTheme } = useTheme();

    return (
      <>
        <div className="cu-sort-sticky" style={{ background: currentTheme.background.default }}>
          <div className="cu-sort-track" style={{ background: currentTheme.background.surface }}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortBy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className="cu-sort-btn"
                  onClick={() => onSortClick(option.value)}
                  aria-label={option.label}
                  aria-pressed={isActive}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                      : 'transparent',
                    color: isActive
                      ? getOptimalTextColor(currentTheme.primary)
                      : currentTheme.text.muted,
                    boxShadow: isActive ? `0 2px 8px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  {option.icon}
                  {isActive &&
                    (sortDirection === 'desc' ? (
                      <ArrowDownward style={{ fontSize: 14 }} />
                    ) : (
                      <ArrowUpward style={{ fontSize: 14 }} />
                    ))}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Sort Title */}
        <div className="cu-sort-title">
          <h2 style={{ color: currentTheme.text.primary }}>{currentLabel}</h2>
        </div>
      </>
    );
  }
);

SortToolbar.displayName = 'SortToolbar';
