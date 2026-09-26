import {
  CalendarMonth,
  ChevronRight,
  EditCalendar,
  LiveTv,
  LocalMovies,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PageHeader,
  PageLayout,
  EmptyState,
  SkeletonListRow,
  TabSwitcher,
} from '../../components/ui';
import { QuickRatingSheet } from '../../components/ui/overlay/QuickRatingSheet';
import { hapticTap } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import { useCalendarData } from './useCalendarData';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarGrid } from './CalendarGrid';
import { CalendarFriendBar } from './CalendarFriendBar';
import { CalendarViewModeContext } from './calendarViewMode';
import { PosterNavSheet } from '../../components/ui/overlay/PosterNavSheet';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { friendAddKey, useFriendAddToList } from '../../hooks/social/useFriendAddToList';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { WatchPlanView } from './WatchPlanView';
import './CalendarPage.css';

type CalendarMode = 'releases' | 'plan';

const MODE_KEY = 'calendarMode';

const readMode = (): CalendarMode => {
  try {
    return localStorage.getItem(MODE_KEY) === 'plan' ? 'plan' : 'releases';
  } catch {
    return 'releases';
  }
};

export const CalendarPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { isDesktop } = useDeviceType();
  const [mode, setModeState] = useState<CalendarMode>(readMode);
  const setMode = (next: CalendarMode) => {
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // nur Komfort
    }
  };

  // Einladungs-Benachrichtigungen verlinken /calendar?mode=plan
  useEffect(() => {
    if (new URLSearchParams(search).get('mode') === 'plan') setModeState('plan');
  }, [search]);

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
    quickRatingOpen,
    quickRatingSeries,
    quickRatingValue,
    handleRateSeries,
    closeQuickRating,
    saveQuickRating,
    viewedFriend,
    viewedFriendUid,
    setViewedFriendUid,
    favoriteFriends,
  } = useCalendarData();
  const { friends } = useOptimizedFriends();
  // Antippen einer Folge fragt erst, ob es zur Folge oder zur Serie gehen soll
  // — dasselbe Sheet wie bei „Heute neu" und „Weiterschauen" auf der Startseite.
  const [posterNav, setPosterNav] = useState({
    open: false,
    seriesId: 0,
    title: '',
    episodePath: '',
  });

  const { addingKey, isInOwnList, addToOwnList } = useFriendAddToList('friend_calendar');

  const viewMode = useMemo(
    () => ({
      readOnly: viewedFriendUid !== null,
      onEpisodeNav: (seriesId: number, title: string, episodePath: string) =>
        setPosterNav({ open: true, seriesId, title, episodePath }),
      // Nur im fremden Kalender: der eigene braucht nichts hinzuzufuegen.
      addToList:
        viewedFriendUid !== null
          ? {
              inList: (seriesId: number) => isInOwnList('series', seriesId),
              adding: (seriesId: number) => addingKey === friendAddKey('series', seriesId),
              add: (seriesId: number, title: string) =>
                void addToOwnList({ id: seriesId, title }, 'series'),
            }
          : undefined,
    }),
    [viewedFriendUid, addingKey, isInOwnList, addToOwnList]
  );

  const modeTabs = (
    <TabSwitcher
      tabs={[
        { id: 'releases', label: t('Neue Folgen'), icon: CalendarMonth },
        { id: 'plan', label: t('Mein Plan'), icon: EditCalendar },
      ]}
      activeTab={mode}
      onTabChange={(id) => {
        hapticTap();
        setMode(id as CalendarMode);
      }}
      className={isDesktop ? 'cal-mode-tabs--header' : 'ui-tabs--center'}
    />
  );

  const counter =
    mode === 'releases' && totalEpisodes > 0 ? (
      <span
        className="cal-header-counter"
        style={{ fontSize: '13px', fontWeight: 600, color: currentTheme.text.muted }}
      >
        <span style={{ color: currentTheme.status.success }}>{watchedCount}</span>
        {' / '}
        {totalEpisodes}
      </span>
    ) : undefined;

  const entryLinks = (
    <div className="cal-entry-row">
      <motion.button
        whileTap={{ opacity: 0.7 }}
        onClick={() => {
          hapticTap();
          navigate('/anime-season');
        }}
        aria-label={t('Anime-Season-Kalender öffnen')}
        className="cal-entry-btn cal-entry-btn--first"
      >
        <LiveTv className="cal-entry-btn__icon" style={{ fontSize: 22 }} />
        <span className="cal-entry-btn__body">
          <span className="cal-entry-btn__title">{t('Anime-Season')}</span>
          <span className="cal-entry-btn__short">{t('Anime')}</span>
          <span className="cal-entry-btn__sub">
            {t('Was läuft diese Season? Airing-Tage & Countdown')}
          </span>
        </span>
        <ChevronRight className="cal-entry-btn__chevron" />
      </motion.button>

      <motion.button
        whileTap={{ opacity: 0.7 }}
        onClick={() => {
          hapticTap();
          navigate('/serien-kalender');
        }}
        aria-label={t('Serien-Kalender öffnen')}
        className="cal-entry-btn"
      >
        <CalendarMonth className="cal-entry-btn__icon" style={{ fontSize: 22 }} />
        <span className="cal-entry-btn__body">
          <span className="cal-entry-btn__title">{t('Serien-Kalender')}</span>
          <span className="cal-entry-btn__short">{t('Serien')}</span>
          <span className="cal-entry-btn__sub">{t('Neue Serien & Staffeln entdecken')}</span>
        </span>
        <ChevronRight className="cal-entry-btn__chevron" />
      </motion.button>

      <motion.button
        whileTap={{ opacity: 0.7 }}
        onClick={() => {
          hapticTap();
          navigate('/film-kalender');
        }}
        aria-label={t('Film-Kalender öffnen')}
        className="cal-entry-btn"
      >
        <LocalMovies className="cal-entry-btn__icon" style={{ fontSize: 22 }} />
        <span className="cal-entry-btn__body">
          <span className="cal-entry-btn__title">{t('Film-Kalender')}</span>
          <span className="cal-entry-btn__short">{t('Filme')}</span>
          <span className="cal-entry-btn__sub">{t('Kinostarts & Streaming-Releases')}</span>
        </span>
        <ChevronRight className="cal-entry-btn__chevron" />
      </motion.button>
    </div>
  );

  return (
    <PageLayout>
      <div className="calendar-page">
        <PageHeader
          title={t('TV-Kalender')}
          style={{
            paddingTop: 'calc(var(--space-4) + var(--safe-top))',
            paddingBottom: 'var(--space-3)',
          }}
          titleBadge={isDesktop ? counter : undefined}
          actions={
            isDesktop ? (
              <>
                <div className="cal-header-center">{modeTabs}</div>
                {entryLinks}
              </>
            ) : (
              counter
            )
          }
        />
        {!isDesktop && modeTabs}

        {mode === 'plan' ? (
          <WatchPlanView />
        ) : (
          <>
            <div className={isDesktop ? 'cal-desktop-bar' : 'cal-subbar-wrap'}>
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
              />

              <div className="cal-subbar">
                <CalendarFriendBar
                  favoriteFriends={favoriteFriends}
                  hasFriends={friends.length > 0}
                  viewedFriendUid={viewedFriendUid}
                  onSelect={setViewedFriendUid}
                />

                {!isDesktop && entryLinks}
              </div>
            </div>

            {loading ? (
              <div
                className="cal-loading"
                role="status"
                aria-label={t('Kalender wird geladen')}
                aria-busy="true"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <SkeletonListRow key={i} avatarShape="card" />
                ))}
              </div>
            ) : totalEpisodes === 0 ? (
              <EmptyState
                icon={<CalendarMonth style={{ fontSize: 48 }} />}
                title={t('Keine Episoden in dieser Woche')}
                description={
                  viewedFriend
                    ? t('In dieser Woche stehen keine Folgen aus der Liste von {name} an.', {
                        name: viewedFriend.displayName || viewedFriend.username || t('Freund'),
                      })
                    : t(
                        'In dieser Woche stehen keine Folgen aus deiner Liste an. Wechsle die Woche oder passe den Filter an.'
                      )
                }
                iconColor={currentTheme.text.secondary}
                action={
                  weekOffset !== 0
                    ? { label: t('Zur aktuellen Woche'), onClick: goToCurrentWeek }
                    : undefined
                }
              />
            ) : (
              <CalendarViewModeContext.Provider value={viewMode}>
                <CalendarGrid
                  groupedSchedule={groupedSchedule}
                  todayKey={todayKey}
                  backdrops={backdrops}
                  expandedGroups={expandedGroups}
                  onToggleGroup={toggleGroup}
                  onMarkWatched={handleMarkWatched}
                  onRateSeries={handleRateSeries}
                  onPrevWeek={goToPrevWeek}
                  onNextWeek={goToNextWeek}
                  weekStamp={`${viewedFriendUid ?? 'me'}-${weekOffset}`}
                />
              </CalendarViewModeContext.Provider>
            )}
          </>
        )}

        <PosterNavSheet
          posterNav={posterNav}
          onClose={() => setPosterNav((prev) => ({ ...prev, open: false }))}
        />

        <QuickRatingSheet
          isOpen={quickRatingOpen}
          onClose={closeQuickRating}
          seriesTitle={quickRatingSeries?.title || ''}
          eyebrow={t('Schnellbewertung')}
          initialRating={quickRatingValue}
          genres={quickRatingSeries?.genre?.genres}
          initialGenreRatings={quickRatingSeries?.rating}
          itemId={quickRatingSeries?.id}
          onRate={saveQuickRating}
        />
      </div>
    </PageLayout>
  );
};
