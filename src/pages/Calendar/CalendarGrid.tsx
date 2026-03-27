import { memo, useEffect, useRef, forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';
import type { GroupedSchedule } from './useCalendarData';
import { WEEKDAYS_SHORT } from './useCalendarData';
import { SingleEpisodeCard, EpisodeGroupCard } from './EpisodeCard';

// ── Types ────────────────────────────────────────────────────────

interface DayCellProps {
  dateKey: string;
  dayIndex: number;
  todayKey: string;
  groups: {
    seriesId: number;
    seriesTitle: string;
    episodes: WeeklyEpisode[];
  }[];
  backdrops: Record<number, string>;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
  onMarkWatched: (seriesNmr: number, seasonIndex: number, episodeIndex: number) => void;
}

interface CalendarGridProps {
  groupedSchedule: GroupedSchedule;
  todayKey: string;
  backdrops: Record<number, string>;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
  onMarkWatched: (seriesNmr: number, seasonIndex: number, episodeIndex: number) => void;
}

// ── DayCell ──────────────────────────────────────────────────────

const DayCell = memo(
  forwardRef<HTMLDivElement, DayCellProps>(
    (
      {
        dateKey,
        dayIndex,
        todayKey,
        groups,
        backdrops,
        expandedGroups,
        onToggleGroup,
        onMarkWatched,
      },
      ref
    ) => {
      const { currentTheme } = useTheme();
      const isToday = dateKey === todayKey;
      const hasEpisodes = groups.length > 0;
      const dayDate = new Date(dateKey + 'T00:00:00');

      return (
        <div
          ref={ref}
          className={`cal-day ${isToday ? 'is-today' : ''} ${!hasEpisodes ? 'is-empty' : ''}`}
        >
          {/* Day header */}
          <div className="cal-day-label">
            <span
              className={`cal-day-weekday ${isToday ? 'is-today' : ''}`}
              style={isToday ? { color: currentTheme.primary } : {}}
            >
              {WEEKDAYS_SHORT[dayIndex]}
            </span>
            <span
              className={`cal-day-number ${isToday ? 'is-today' : ''}`}
              style={
                isToday
                  ? { background: currentTheme.primary, color: currentTheme.text.secondary }
                  : { color: currentTheme.text.primary }
              }
            >
              {dayDate.getDate()}
            </span>
            {!hasEpisodes && <span className="cal-day-none">&mdash;</span>}
          </div>

          {/* Episodes */}
          {hasEpisodes && (
            <div className="cal-day-episodes">
              {groups.map((group) => {
                const groupKey = `${dateKey}-${group.seriesId}`;
                const isSingle = group.episodes.length === 1;

                if (isSingle) {
                  return (
                    <SingleEpisodeCard
                      key={groupKey}
                      ep={group.episodes[0]}
                      backdropSrc={backdrops[group.seriesId]}
                      onMarkWatched={onMarkWatched}
                    />
                  );
                }

                return (
                  <EpisodeGroupCard
                    key={groupKey}
                    group={group}
                    backdropSrc={backdrops[group.seriesId]}
                    isExpanded={expandedGroups.has(groupKey)}
                    onToggle={() => onToggleGroup(groupKey)}
                    onMarkWatched={onMarkWatched}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    }
  )
);
DayCell.displayName = 'DayCell';

// ── CalendarGrid ─────────────────────────────────────────────────

export const CalendarGrid = memo(
  ({
    groupedSchedule,
    todayKey,
    backdrops,
    expandedGroups,
    onToggleGroup,
    onMarkWatched,
  }: CalendarGridProps) => {
    const todayRef = useRef<HTMLDivElement>(null);
    const hasScrolled = useRef(false);

    // Auto-scroll to today on mobile (< 768px)
    useEffect(() => {
      if (hasScrolled.current || window.innerWidth >= 768) return;
      // Small delay to ensure DOM has rendered
      const timer = setTimeout(() => {
        if (todayRef.current) {
          todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          hasScrolled.current = true;
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [groupedSchedule, todayKey]);

    return (
      <div className="cal-content">
        {Array.from(groupedSchedule.entries()).map(([dateKey, groups], dayIndex) => (
          <DayCell
            key={dateKey}
            ref={dateKey === todayKey ? todayRef : undefined}
            dateKey={dateKey}
            dayIndex={dayIndex}
            todayKey={todayKey}
            groups={groups}
            backdrops={backdrops}
            expandedGroups={expandedGroups}
            onToggleGroup={onToggleGroup}
            onMarkWatched={onMarkWatched}
          />
        ))}
      </div>
    );
  }
);
CalendarGrid.displayName = 'CalendarGrid';
