import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader, PageLayout } from '../../components/ui';
import { useCalendarData } from './useCalendarData';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarGrid } from './CalendarGrid';
import './CalendarPage.css';

export const CalendarPage = () => {
  const { currentTheme } = useTheme();

  const {
    weekOffset,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    kwNumber,
    monday,
    sunday,
    watchlistOnly,
    toggleWatchlistOnly,
    totalEpisodes,
    watchedCount,
    groupedSchedule,
    todayKey,
    backdrops,
    expandedGroups,
    toggleGroup,
    handleMarkWatched,
  } = useCalendarData();

  return (
    <PageLayout>
      <div className="calendar-page">
        <PageHeader title="TV-Kalender" />

        <CalendarToolbar
          kwNumber={kwNumber}
          monday={monday}
          sunday={sunday}
          weekOffset={weekOffset}
          onPrev={goToPrevWeek}
          onNext={goToNextWeek}
          onReset={goToCurrentWeek}
          watchlistOnly={watchlistOnly}
          onToggle={toggleWatchlistOnly}
          totalEpisodes={totalEpisodes}
          watchedCount={watchedCount}
        />

        <CalendarGrid
          groupedSchedule={groupedSchedule}
          todayKey={todayKey}
          backdrops={backdrops}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          onMarkWatched={handleMarkWatched}
        />

        {totalEpisodes === 0 && (
          <div className="cal-empty">
            <p style={{ color: currentTheme.text.muted }}>Keine Episoden in dieser Woche</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
