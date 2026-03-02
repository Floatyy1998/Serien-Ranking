import { memo } from 'react';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDate } from './useCalendarData';

// ── Types ────────────────────────────────────────────────────────

interface WeekNavProps {
  kwNumber: number;
  monday: Date;
  sunday: Date;
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

interface FilterChipsProps {
  watchlistOnly: boolean;
  onToggle: (next: boolean) => void;
}

interface StatsProps {
  totalEpisodes: number;
  watchedCount: number;
}

export interface CalendarToolbarProps extends WeekNavProps, FilterChipsProps, StatsProps {}

// ── Sub-components ───────────────────────────────────────────────

const WeekNav = memo(
  ({ kwNumber, monday, sunday, weekOffset, onPrev, onNext, onReset }: WeekNavProps) => {
    const { currentTheme } = useTheme();

    return (
      <div className="cal-week-switcher">
        <button className="cal-arrow-btn" onClick={onPrev}>
          <ChevronLeft style={{ fontSize: '20px' }} />
        </button>
        <button
          className={`cal-week-chip ${weekOffset === 0 ? 'is-current' : ''}`}
          onClick={onReset}
          style={
            weekOffset === 0
              ? { borderColor: `${currentTheme.primary}60`, color: currentTheme.primary }
              : {}
          }
        >
          KW {kwNumber} &middot; {formatDate(monday)} – {formatDate(sunday)}
        </button>
        <button className="cal-arrow-btn" onClick={onNext}>
          <ChevronRight style={{ fontSize: '20px' }} />
        </button>
      </div>
    );
  }
);
WeekNav.displayName = 'WeekNav';

const FilterChips = memo(({ watchlistOnly, onToggle }: FilterChipsProps) => {
  const { currentTheme } = useTheme();
  const labels = ['Alle Serien', 'Watchlist'] as const;

  return (
    <>
      {labels.map((label) => {
        const isActive =
          (label === 'Watchlist' && watchlistOnly) || (label === 'Alle Serien' && !watchlistOnly);
        return (
          <button
            key={label}
            className="cal-filter-chip"
            onClick={() => onToggle(label === 'Watchlist')}
            style={
              isActive
                ? {
                    background: `${currentTheme.primary}20`,
                    color: currentTheme.primary,
                    borderColor: `${currentTheme.primary}50`,
                  }
                : {}
            }
          >
            {label}
          </button>
        );
      })}
    </>
  );
});
FilterChips.displayName = 'FilterChips';

const StatItems = memo(({ totalEpisodes, watchedCount }: StatsProps) => {
  const { currentTheme } = useTheme();
  if (totalEpisodes <= 0) return null;

  return (
    <>
      <div
        className="cal-stat-item"
        style={{ background: `${currentTheme.primary}15`, color: currentTheme.primary }}
      >
        {totalEpisodes} gesamt
      </div>
      <div
        className="cal-stat-item"
        style={{
          background: `${currentTheme.status.success}15`,
          color: currentTheme.status.success,
        }}
      >
        {watchedCount} gesehen
      </div>
      <div className="cal-stat-item">{totalEpisodes - watchedCount} offen</div>
    </>
  );
});
StatItems.displayName = 'StatItems';

// ── Main toolbar ─────────────────────────────────────────────────

export const CalendarToolbar = memo(
  ({
    kwNumber,
    monday,
    sunday,
    weekOffset,
    onPrev,
    onNext,
    onReset,
    watchlistOnly,
    onToggle,
    totalEpisodes,
    watchedCount,
  }: CalendarToolbarProps) => {
    const weekNavProps = { kwNumber, monday, sunday, weekOffset, onPrev, onNext, onReset };

    return (
      <>
        {/* Desktop toolbar */}
        <div className="cal-toolbar-desktop">
          <div className="cal-toolbar-left">
            <FilterChips watchlistOnly={watchlistOnly} onToggle={onToggle} />
          </div>
          <div className="cal-toolbar-center">
            <WeekNav {...weekNavProps} />
          </div>
          <div className="cal-toolbar-right">
            <StatItems totalEpisodes={totalEpisodes} watchedCount={watchedCount} />
          </div>
        </div>

        {/* Mobile header */}
        <div className="cal-mobile-header">
          <WeekNav {...weekNavProps} />
          <div className="cal-filter-row">
            <FilterChips watchlistOnly={watchlistOnly} onToggle={onToggle} />
          </div>
          {totalEpisodes > 0 && (
            <div className="cal-stats">
              <StatItems totalEpisodes={totalEpisodes} watchedCount={watchedCount} />
            </div>
          )}
        </div>
      </>
    );
  }
);
CalendarToolbar.displayName = 'CalendarToolbar';
