import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Add,
  CheckCircle,
  EditCalendar,
  Group,
  NotificationsActive,
  RadioButtonUnchecked,
  Schedule,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { EmptyState, SkeletonListRow } from '../../components/ui';
import { useWatchPlan } from '../../hooks/watch/useWatchPlan';
import { useWatchPlanSharing } from '../../hooks/watch/useWatchPlanSharing';
import { getWeekNumber } from '../../hooks/watch/useWeeklyEpisodes';
import { hapticTap } from '../../lib/interaction/haptics';
import {
  formatPlanTime,
  groupWatchPlanByDate,
  planUses12Hour,
  resolveWatchPlanEntry,
  weekDateKeys,
  type PlanGuestStatus,
  type ResolvedWatchPlanEntry,
  type WatchPlanEntry,
} from '../../lib/watch/watchPlan';
import { dateLocale, t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import { WeekNav } from './CalendarToolbar';
import { toDateKey } from './useCalendarData';
import { WatchPlanSheet, type WatchPlanSheetState } from './WatchPlanSheet';
import { markPlanEntryWatched } from './markPlanEntry';
import { PlanInviteCards } from './PlanInviteCards';
import './WatchPlan.css';

function mondayOf(offset: number): Date {
  const now = new Date();
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff + offset * 7);
}

const dayLabel = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(dateLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const PlanEntryRow = ({
  item,
  onOpen,
  onMark,
  twelveHour,
  companions,
}: {
  item: ResolvedWatchPlanEntry;
  onOpen: () => void;
  onMark: () => void;
  twelveHour: boolean;
  companions?: string;
}) => {
  const { currentTheme } = useTheme();
  const { entry, series, movie, episode, done } = item;
  const poster = series?.poster?.poster ?? movie?.poster?.poster ?? entry.poster;
  const title = entry.title || series?.title || movie?.title || '';

  let detail = entry.kind === 'movie' ? t('Film') : t('Serie');
  if (entry.kind === 'series' && entry.seasonNumber && entry.episodeNumber) {
    detail = `S${entry.seasonNumber} · E${entry.episodeNumber}`;
    if (episode?.episode.name) detail += ` · ${episode.episode.name}`;
  } else if (entry.kind === 'series' && entry.seasonNumber) {
    detail = t('Staffel {n}', { n: entry.seasonNumber });
  }

  const markLabel =
    entry.kind === 'movie'
      ? t('Film als gesehen markieren')
      : entry.episodeNumber
        ? t('Folge als gesehen markieren')
        : t('Nächste Folge abhaken');

  return (
    <div
      className={`wp-entry${done ? ' is-done' : ''}`}
      style={{ borderColor: currentTheme.border.default }}
    >
      <motion.button
        type="button"
        whileTap={{ opacity: 0.7 }}
        className="wp-entry__main"
        onClick={() => {
          hapticTap();
          onOpen();
        }}
      >
        <img className="wp-poster" src={getImageUrl(poster, 'w92')} alt="" loading="lazy" />
        <span className="wp-entry__body">
          <span className="wp-entry__title" style={{ color: currentTheme.text.secondary }}>
            {title}
          </span>
          <span className="wp-entry__detail" style={{ color: currentTheme.text.muted }}>
            {detail}
          </span>
          {companions && (
            <span className="wp-entry__with" style={{ color: currentTheme.primary }}>
              <Group style={{ fontSize: 13 }} />
              {companions}
            </span>
          )}
          {entry.note && (
            <span className="wp-entry__note" style={{ color: currentTheme.text.muted }}>
              {entry.note}
            </span>
          )}
        </span>
        {entry.time && (
          <span
            className="wp-entry__time"
            style={{
              color: currentTheme.primary,
              background: `${currentTheme.primary}18`,
            }}
          >
            {entry.remindOffset !== undefined ? (
              <NotificationsActive aria-label={t('Erinnerung aktiv')} style={{ fontSize: 13 }} />
            ) : (
              <Schedule style={{ fontSize: 13 }} />
            )}
            {formatPlanTime(entry.time, twelveHour)}
          </span>
        )}
      </motion.button>
      <button
        type="button"
        className="wp-entry__check"
        disabled={done}
        aria-label={done ? t('gesehen') : markLabel}
        title={done ? t('gesehen') : markLabel}
        onClick={onMark}
        style={{ color: done ? currentTheme.status.success : currentTheme.text.muted }}
      >
        {done ? (
          <CheckCircle style={{ fontSize: 24 }} />
        ) : (
          <RadioButtonUnchecked style={{ fontSize: 24 }} />
        )}
      </button>
    </div>
  );
};

export const WatchPlanView = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const twelveHour = useMemo(
    () => planUses12Hour(dateLocale(), typeof navigator !== 'undefined' ? navigator.language : ''),
    []
  );
  const { entries, loading } = useWatchPlan();
  const { invites, guests } = useWatchPlanSharing();
  const { friends } = useOptimizedFriends();
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheet, setSheet] = useState<WatchPlanSheetState>({ open: false });

  const monday = useMemo(() => mondayOf(weekOffset), [weekOffset]);
  const sunday = useMemo(
    () => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6),
    [monday]
  );
  const dayKeys = useMemo(() => weekDateKeys(monday), [monday]);
  const todayKey = toDateKey(new Date());

  const byDate = useMemo(() => {
    const seriesById = new Map(seriesList.map((s) => [s.id, s]));
    const moviesById = new Map(movieList.map((m) => [m.id, m]));
    const grouped = groupWatchPlanByDate(entries);
    const resolved = new Map<string, ResolvedWatchPlanEntry[]>();
    for (const [key, list] of grouped) {
      resolved.set(
        key,
        list.map((entry) => resolveWatchPlanEntry(entry, seriesById, moviesById))
      );
    }
    return resolved;
  }, [entries, seriesList, movieList]);

  const weekCount = dayKeys.reduce((sum, key) => sum + (byDate.get(key)?.length ?? 0), 0);
  const upcoming = useMemo(
    () => entries.filter((e) => e.date >= todayKey).sort((a, b) => (a.date < b.date ? -1 : 1)),
    [entries, todayKey]
  );

  const openNew = (date: string) => {
    hapticTap();
    setSheet({ open: true, mode: 'new', date });
  };

  const jumpToNext = () => {
    const next = upcoming.find((e) => e.date > dayKeys[6]) ?? upcoming[0];
    if (!next) return;
    const [y, m, d] = next.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const days = Math.round((target.getTime() - mondayOf(0).getTime()) / 86400000);
    setWeekOffset(Math.floor(days / 7));
  };

  const nextOutsideWeek = upcoming.find((e) => e.date > dayKeys[6]);

  const friendName = (uid: string) => {
    const friend = friends.find((f) => f.uid === uid);
    return friend?.displayName || friend?.username || t('Freund');
  };

  const companionsOf = (entry: WatchPlanEntry): string | undefined => {
    if (entry.via) return t('mit {name}', { name: entry.via.hostName || t('Freund') });
    const list: Record<string, PlanGuestStatus> | undefined = guests.get(entry.key);
    if (!list) return undefined;
    const accepted = Object.entries(list)
      .filter(([, status]) => status === 'a')
      .map(([uid]) => friendName(uid));
    const open = Object.values(list).filter((status) => status === 'p').length;
    const parts: string[] = [];
    if (accepted.length) parts.push(t('mit {name}', { name: accepted.join(', ') }));
    if (open) parts.push(t('{n} offen', { n: open }));
    return parts.length ? parts.join(' · ') : undefined;
  };

  return (
    <div className="wp">
      <div className="wp-toolbar">
        <WeekNav
          kwNumber={getWeekNumber(monday)}
          monday={monday}
          sunday={sunday}
          weekOffset={weekOffset}
          onPrev={() => setWeekOffset((w) => w - 1)}
          onNext={() => setWeekOffset((w) => w + 1)}
          onReset={() => setWeekOffset(0)}
        />
        <motion.button
          type="button"
          whileTap={{ opacity: 0.7 }}
          className="wp-add-main"
          aria-label={t('Eintragen')}
          onClick={() => openNew(weekOffset === 0 ? todayKey : dayKeys[0])}
          style={{ background: currentTheme.primary, color: currentTheme.background.default }}
        >
          <Add style={{ fontSize: 20 }} />
          <span className="wp-add-main__label">{t('Eintragen')}</span>
        </motion.button>
      </div>

      <PlanInviteCards invites={invites} twelveHour={twelveHour} />

      {loading ? (
        <div className="cal-loading" role="status" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonListRow key={i} avatarShape="card" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<EditCalendar style={{ fontSize: 48 }} />}
          title={t('Dein Plan ist noch leer')}
          description={t(
            'Trag ein, an welchem Tag du welche Folge oder welchen Film schauen willst — auf Wunsch mit Uhrzeit.'
          )}
          iconColor={currentTheme.text.secondary}
          action={{ label: t('Ersten Eintrag anlegen'), onClick: () => openNew(todayKey) }}
        />
      ) : (
        <>
          {weekCount === 0 && nextOutsideWeek && (
            <button
              type="button"
              className="wp-next-hint"
              onClick={jumpToNext}
              style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}40` }}
            >
              {t('Nächster Eintrag: {date}', { date: dayLabel(nextOutsideWeek.date) })}
            </button>
          )}
          <div className="wp-week">
            {dayKeys.map((key) => {
              const items = byDate.get(key) ?? [];
              const isToday = key === todayKey;
              const isPast = key < todayKey;
              return (
                <section
                  key={key}
                  className={`wp-day${isToday ? ' is-today' : ''}${isPast ? ' is-past' : ''}${items.length === 0 ? ' is-empty' : ''}`}
                  aria-label={dayLabel(key)}
                  style={
                    isToday
                      ? {
                          borderColor: `${currentTheme.primary}55`,
                          background: `${currentTheme.primary}0d`,
                        }
                      : { borderColor: currentTheme.border.default }
                  }
                >
                  <header className="wp-day__head">
                    <span
                      className="wp-day__label"
                      style={{
                        color: isToday ? currentTheme.primary : currentTheme.text.secondary,
                      }}
                    >
                      {dayLabel(key)}
                      {isToday && <span className="wp-day__today">{t('Heute')}</span>}
                    </span>
                    <button
                      type="button"
                      className="wp-day__add"
                      onClick={() => openNew(key)}
                      aria-label={t('Für {day} eintragen', { day: dayLabel(key) })}
                      style={{ color: currentTheme.text.secondary }}
                    >
                      <Add style={{ fontSize: 20 }} />
                    </button>
                  </header>
                  {items.length === 0 ? (
                    <p className="wp-day__empty" style={{ color: currentTheme.text.muted }}>
                      {t('Nichts geplant')}
                    </p>
                  ) : (
                    <div className="wp-day__list">
                      {items.map((item) => (
                        <PlanEntryRow
                          key={item.entry.key}
                          item={item}
                          twelveHour={twelveHour}
                          companions={companionsOf(item.entry)}
                          onOpen={() => setSheet({ open: true, mode: 'edit', entry: item.entry })}
                          onMark={() => {
                            if (user?.uid) void markPlanEntryWatched(user.uid, item);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      <WatchPlanSheet
        state={sheet}
        onClose={() => setSheet({ open: false })}
        guestsByKey={guests}
      />
    </div>
  );
};
