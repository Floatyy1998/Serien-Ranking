import { CalendarMonth, ChevronRight, LiveTv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader, PageLayout, EmptyState, SkeletonListRow } from '../../components/ui';
import { hapticTap } from '../../lib/haptics';
import { useCalendarData } from './useCalendarData';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarGrid } from './CalendarGrid';
import './CalendarPage.css';

export const CalendarPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

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
    loading,
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
        <PageHeader
          title="TV-Kalender"
          showBack={false}
          actions={
            totalEpisodes > 0 ? (
              <span style={{ fontSize: '13px', fontWeight: 600, color: currentTheme.text.muted }}>
                <span style={{ color: currentTheme.status.success }}>{watchedCount}</span>
                {' / '}
                {totalEpisodes}
              </span>
            ) : undefined
          }
        />
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

        {/* Einstiege in Anime-Season + Serien-Kalender — Desktop nebeneinander */}
        <div className="cal-entry-row">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              hapticTap();
              navigate('/anime-season');
            }}
            aria-label="Anime-Season-Kalender öffnen"
            className="cal-entry-btn cal-entry-btn--first"
          >
            <LiveTv className="cal-entry-btn__icon" style={{ fontSize: 22 }} />
            <span className="cal-entry-btn__body">
              <span className="cal-entry-btn__title">Anime-Season</span>
              <span className="cal-entry-btn__sub">
                Was läuft diese Season? Airing-Tage & Countdown
              </span>
            </span>
            <ChevronRight className="cal-entry-btn__chevron" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              hapticTap();
              navigate('/serien-kalender');
            }}
            aria-label="Serien-Kalender öffnen"
            className="cal-entry-btn"
          >
            <CalendarMonth className="cal-entry-btn__icon" style={{ fontSize: 22 }} />
            <span className="cal-entry-btn__body">
              <span className="cal-entry-btn__title">Serien-Kalender</span>
              <span className="cal-entry-btn__sub">Neue Serien & Staffeln entdecken</span>
            </span>
            <ChevronRight className="cal-entry-btn__chevron" />
          </motion.button>
        </div>

        {loading ? (
          <div
            className="cal-loading"
            role="status"
            aria-label="Kalender wird geladen"
            aria-busy="true"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonListRow key={i} avatarShape="card" />
            ))}
          </div>
        ) : totalEpisodes === 0 ? (
          <EmptyState
            icon={<CalendarMonth style={{ fontSize: 48 }} />}
            title="Keine Episoden in dieser Woche"
            description="In dieser Woche stehen keine Folgen aus deiner Liste an. Wechsle die Woche oder passe den Filter an."
            iconColor={currentTheme.text.secondary}
            action={
              weekOffset !== 0
                ? { label: 'Zur aktuellen Woche', onClick: goToCurrentWeek }
                : undefined
            }
          />
        ) : (
          <CalendarGrid
            groupedSchedule={groupedSchedule}
            todayKey={todayKey}
            backdrops={backdrops}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            onMarkWatched={handleMarkWatched}
            onPrevWeek={goToPrevWeek}
            onNextWeek={goToNextWeek}
            weekStamp={`${weekOffset}`}
          />
        )}
      </div>
    </PageLayout>
  );
};
