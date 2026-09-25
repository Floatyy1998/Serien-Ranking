import { memo } from 'react';
import { Bookmark, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { formatDate } from './useCalendarData';

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

export interface CalendarToolbarProps extends WeekNavProps, FilterChipsProps {}

export const WeekNav = memo(
  ({ kwNumber, monday, sunday, weekOffset, onPrev, onNext, onReset }: WeekNavProps) => {
    const { currentTheme } = useTheme();

    return (
      <div className="cal-week-switcher">
        <button className="cal-arrow-btn" onClick={onPrev} aria-label={t('Vorherige Woche')}>
          <ChevronLeft style={{ fontSize: '20px' }} />
        </button>
        <button
          className={`cal-week-chip ${weekOffset === 0 ? 'is-current' : ''}`}
          onClick={onReset}
          aria-label={t('Zur aktuellen Woche')}
          style={
            weekOffset === 0
              ? { borderColor: `${currentTheme.primary}60`, color: currentTheme.primary }
              : {}
          }
        >
          {t('KW {n}', { n: kwNumber })} &middot; {formatDate(monday)} – {formatDate(sunday)}
        </button>
        <button className="cal-arrow-btn" onClick={onNext} aria-label={t('Nächste Woche')}>
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
            {t(label)}
          </button>
        );
      })}
    </>
  );
});
FilterChips.displayName = 'FilterChips';

/** Mobile: kompakter Icon-Toggle statt eigener Filter-Zeile. */
const MobileWatchlistToggle = memo(({ watchlistOnly, onToggle }: FilterChipsProps) => {
  const { currentTheme } = useTheme();
  return (
    <button
      type="button"
      className="cal-wl-toggle"
      aria-pressed={watchlistOnly}
      aria-label={watchlistOnly ? t('Alle Serien anzeigen') : t('Nur Watchlist anzeigen')}
      onClick={() => onToggle(!watchlistOnly)}
      style={
        watchlistOnly
          ? {
              background: `${currentTheme.primary}20`,
              color: currentTheme.primary,
              borderColor: `${currentTheme.primary}50`,
            }
          : undefined
      }
    >
      {/* 20px wie die Pfeile daneben — 18px liess das Icon kleiner wirken. */}
      <Bookmark style={{ fontSize: 20 }} />
    </button>
  );
});
MobileWatchlistToggle.displayName = 'MobileWatchlistToggle';

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
  }: CalendarToolbarProps) => {
    const weekNavProps = { kwNumber, monday, sunday, weekOffset, onPrev, onNext, onReset };

    return (
      <>
        {/* Desktop: Woche links, Filter rechts — die Zahlen stehen im Seitenkopf. */}
        <div className="cal-toolbar-desktop">
          <div className="cal-toolbar-left">
            <WeekNav {...weekNavProps} />
          </div>
          <div className="cal-toolbar-right">
            <FilterChips watchlistOnly={watchlistOnly} onToggle={onToggle} />
          </div>
        </div>

        {/* Mobile header — EINE Zeile: Wochen-Nav + Watchlist-Toggle.
            Stats entfallen (der Zähler steht bereits im PageHeader). */}
        <div className="cal-mobile-header">
          <WeekNav {...weekNavProps} />
          <MobileWatchlistToggle watchlistOnly={watchlistOnly} onToggle={onToggle} />
        </div>
      </>
    );
  }
);
CalendarToolbar.displayName = 'CalendarToolbar';
