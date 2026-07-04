import { CalendarMonth, ChevronRight, LiveTv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PageHeader, PageLayout } from '../../components/ui';
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

        {/* Prominenter Einstieg in den Anime-Season-Kalender */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            hapticTap();
            navigate('/anime-season');
          }}
          aria-label="Anime-Season-Kalender öffnen"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: 'calc(100% - 40px)',
            margin: '4px 20px 12px',
            minHeight: 52,
            padding: '10px 14px',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${currentTheme.primary}40`,
            background: `linear-gradient(135deg, ${currentTheme.primary}1f, var(--glass-light))`,
            backdropFilter: 'var(--blur-md)',
            WebkitBackdropFilter: 'var(--blur-md)',
            color: currentTheme.text.secondary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <LiveTv style={{ color: currentTheme.primary, fontSize: 22, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'var(--font-display)',
                color: currentTheme.text.secondary,
              }}
            >
              Anime-Season
            </span>
            <span style={{ display: 'block', fontSize: 12, color: currentTheme.text.muted }}>
              Was läuft diese Season? Airing-Tage & Countdown
            </span>
          </span>
          <ChevronRight style={{ color: currentTheme.text.muted, flexShrink: 0 }} />
        </motion.button>

        {/* Prominenter Einstieg in den Serien-Kalender (Premieren-Discovery) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            hapticTap();
            navigate('/serien-kalender');
          }}
          aria-label="Serien-Kalender öffnen"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: 'calc(100% - 40px)',
            margin: '0 20px 12px',
            minHeight: 52,
            padding: '10px 14px',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${currentTheme.primary}40`,
            background: `linear-gradient(135deg, ${currentTheme.primary}1f, var(--glass-light))`,
            backdropFilter: 'var(--blur-md)',
            WebkitBackdropFilter: 'var(--blur-md)',
            color: currentTheme.text.secondary,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <CalendarMonth style={{ color: currentTheme.primary, fontSize: 22, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'var(--font-display)',
                color: currentTheme.text.secondary,
              }}
            >
              Serien-Kalender
            </span>
            <span style={{ display: 'block', fontSize: 12, color: currentTheme.text.muted }}>
              Neue Serien & Staffeln entdecken
            </span>
          </span>
          <ChevronRight style={{ color: currentTheme.text.muted, flexShrink: 0 }} />
        </motion.button>

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
