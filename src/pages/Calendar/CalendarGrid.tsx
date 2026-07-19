import { memo, useEffect, useRef, useState, forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { hapticTap } from '../../lib/haptics';
import { t } from '../../services/i18n';
import type { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';
import type { GroupedSchedule } from './useCalendarData';
import { WEEKDAYS_SHORT } from './useCalendarData';
import { SingleEpisodeCard, EpisodeGroupCard } from './EpisodeCard';

interface DayGroup {
  seriesId: number;
  seriesTitle: string;
  episodes: WeeklyEpisode[];
}

interface DayCellProps {
  dateKey: string;
  dayIndex: number;
  todayKey: string;
  groups: DayGroup[];
  backdrops: Record<number, string>;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
  onMarkWatched: (seriesId: number, seasonIndex: number, episodeIndex: number) => void;
}

interface CalendarGridProps {
  groupedSchedule: GroupedSchedule;
  todayKey: string;
  backdrops: Record<number, string>;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
  onMarkWatched: (seriesId: number, seasonIndex: number, episodeIndex: number) => void;
  /** Mobile-Tagesansicht: Swipe über die Wochengrenze hinaus. */
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  /** Ändert sich mit der geladenen Woche — setzt den gewählten Tag zurück. */
  weekStamp?: string;
}

// Gemeinsames Episoden-Rendering (Desktop-Zelle + Mobile-Tag)

function renderGroups(
  dateKey: string,
  groups: DayGroup[],
  backdrops: Record<number, string>,
  expandedGroups: Set<string>,
  onToggleGroup: (groupKey: string) => void,
  onMarkWatched: (seriesId: number, seasonIndex: number, episodeIndex: number) => void
) {
  return groups.map((group) => {
    const groupKey = `${dateKey}-${group.seriesId}`;
    if (group.episodes.length === 1) {
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
  });
}

// DayCell (Desktop-Wochen-Grid)
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
              {renderGroups(
                dateKey,
                groups,
                backdrops,
                expandedGroups,
                onToggleGroup,
                onMarkWatched
              )}
            </div>
          )}
        </div>
      );
    }
  )
);
DayCell.displayName = 'DayCell';

export const CalendarGrid = memo(
  ({
    groupedSchedule,
    todayKey,
    backdrops,
    expandedGroups,
    onToggleGroup,
    onMarkWatched,
    onPrevWeek,
    onNextWeek,
    weekStamp,
  }: CalendarGridProps) => {
    const { isDesktop } = useDeviceType();

    const entries = Array.from(groupedSchedule.entries());
    const todayIdx = entries.findIndex(([k]) => k === todayKey);

    // Mobile-Tagesansicht: gewählter Tag + Swipe-Richtung für die Animation.
    const [dayIdx, setDayIdx] = useState(() => (todayIdx >= 0 ? todayIdx : 0));
    const [dir, setDir] = useState(0);
    // Beim Wochenwechsel per Swipe: auf Mo (vorwärts) bzw. So (rückwärts) landen.
    const pendingEdge = useRef<null | 'start' | 'end'>(null);

    useEffect(() => {
      if (pendingEdge.current === 'end') setDayIdx(0);
      else if (pendingEdge.current === 'start') setDayIdx(6);
      else setDayIdx(todayIdx >= 0 ? todayIdx : 0);
      pendingEdge.current = null;
      // Nur beim Wochenwechsel zurücksetzen — todayIdx ist dabei stabil.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekStamp]);

    const goToDay = (next: number) => {
      if (next === dayIdx) return;
      hapticTap();
      setDir(next > dayIdx ? 1 : -1);
      if (next < 0) {
        if (onPrevWeek) {
          pendingEdge.current = 'start';
          onPrevWeek();
        }
        return;
      }
      if (next > entries.length - 1) {
        if (onNextWeek) {
          pendingEdge.current = 'end';
          onNextWeek();
        }
        return;
      }
      setDayIdx(next);
    };

    // Desktop: Wochen-Grid
    if (isDesktop) {
      return (
        <div className="cal-content">
          {entries.map(([dateKey, groups], dayIndex) => (
            <DayCell
              key={dateKey}
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

    // Mobile: Tagesansicht mit Swipe
    const clampedIdx = Math.min(dayIdx, Math.max(entries.length - 1, 0));
    const current = entries[clampedIdx];
    const currentKey = current?.[0] ?? 'none';
    const currentGroups = current?.[1] ?? [];

    return (
      <div className="cal-mobile-view">
        {/* Tages-Selector */}
        <div className="cal-day-selector" role="tablist" aria-label={t('Tag wählen')}>
          {entries.map(([k, g], i) => {
            const d = new Date(k + 'T00:00:00');
            const active = i === clampedIdx;
            const isToday = k === todayKey;
            const dayEpisodes = g.flatMap((grp) => grp.episodes);
            const allWatched = dayEpisodes.length > 0 && dayEpisodes.every((ep) => ep.watched);
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${WEEKDAYS_SHORT[i]} ${d.getDate()}.${isToday ? ` (${t('heute')})` : ''}${
                  allWatched
                    ? ` — ${t('alles geschaut')}`
                    : g.length > 0
                      ? ` — ${t('{n} Serien', { n: g.length })}`
                      : ''
                }`}
                className={`cal-day-chip ${active ? 'is-active' : ''} ${isToday ? 'is-today' : ''} ${allWatched ? 'is-complete' : ''}`}
                onClick={() => goToDay(i)}
              >
                {allWatched && (
                  <span className="cal-day-chip__badge" aria-hidden>
                    ✓
                  </span>
                )}
                <span className="cal-day-chip__wd">{WEEKDAYS_SHORT[i]}</span>
                <span className="cal-day-chip__num">{d.getDate()}</span>
                <span
                  className="cal-day-chip__dot"
                  style={{ opacity: g.length > 0 && !allWatched ? 1 : 0 }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        {/* Tag — horizontal swipebar (auch über die Wochengrenze) */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentKey}
            className="cal-mobile-day"
            initial={{ opacity: 0, x: dir * 72 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -72 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) goToDay(clampedIdx + 1);
              else if (info.offset.x > 70) goToDay(clampedIdx - 1);
            }}
          >
            {currentGroups.length > 0 ? (
              <div className="cal-day-episodes">
                {renderGroups(
                  currentKey,
                  currentGroups,
                  backdrops,
                  expandedGroups,
                  onToggleGroup,
                  onMarkWatched
                )}
              </div>
            ) : (
              <div className="cal-mobile-empty">
                <span className="cal-mobile-empty__dash">&mdash;</span>
                {t('Keine Folgen an diesem Tag')}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);
CalendarGrid.displayName = 'CalendarGrid';
