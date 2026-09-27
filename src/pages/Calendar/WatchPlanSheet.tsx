import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Add,
  CheckCircleOutlined,
  Close,
  DeleteOutlined,
  Movie as MovieIcon,
  NotificationsActiveOutlined,
  EventBusy,
  EventRepeat,
  OpenInNew,
  Remove,
  Replay,
  Tv,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { BottomSheet, SearchInput, ThemedSelect } from '../../components/ui';
import { hapticSuccess, hapticTap } from '../../lib/interaction/haptics';
import { showToast, showUndoToast } from '../../lib/interaction/toast';
import { isEpisodeWatched } from '../../lib/episode/seriesMetrics';
import {
  DEFAULT_REMIND_TIME,
  REMIND_OFFSETS,
  SCHEDULE_MAX_ENTRIES,
  SCHEDULE_MAX_INTERVAL,
  SCHEDULE_MAX_PER_SESSION,
  WATCH_PLAN_NOTE_MAX,
  buildPlanSchedule,
  episodeWatchCount,
  firstUnwatchedEpisode,
  isValidPlanDate,
  planItemPath,
  planReminderAt,
  planUses12Hour,
  planGroupEntries,
  planSeasons,
  renumberPlanGroup,
  shiftPlanGroup,
  withPlanEpisode,
  resolvePlanEpisode,
  resolveWatchPlanEntry,
  formatPlanTime,
  type PlanGuestStatus,
  type PlanRepeat,
  type ScheduleEnd,
  type WatchPlanDraft,
  type WatchPlanEntry,
  type WatchPlanKind,
} from '../../lib/watch/watchPlan';
import {
  leavePlan,
  planSenderName,
  removePlanGuests,
  sendPlanInvites,
  syncPlanGuests,
  uninvitePlanGuest,
} from '../../services/watchPlan/watchPlanSharing';
import {
  addWatchPlanEntry,
  addWatchPlanSeries,
  applyWatchPlanChanges,
  newPlanGroupId,
  removeWatchPlanEntries,
  removeWatchPlanEntry,
  restoreWatchPlanEntries,
  restoreWatchPlanEntry,
  updateWatchPlanEntry,
} from '../../services/watchPlan/watchPlanService';
import { dateLocale, t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import type { Series } from '../../types/Series';
import { PlanDatePanel, PlanDateTrigger, PlanTimePanel, PlanTimeTrigger } from './PlanPickers';
import { markPlanEntryWatched } from './markPlanEntry';
import { PlanGuestsSection } from './PlanGuestsSection';

export type WatchPlanSheetState =
  | { open: false }
  | { open: true; mode: 'new'; date: string }
  | { open: true; mode: 'edit'; entry: WatchPlanEntry };

interface PickedItem {
  kind: WatchPlanKind;
  id: number;
  title: string;
  poster?: string;
}

const NO_EPISODE = '';
const RESULT_LIMIT = 60;

const seriesTitle = (s: Series) => s.title || s.name || '';

const offsetLabel = (offset: number) =>
  offset === 0
    ? t('Zur Startzeit')
    : offset === 60
      ? t('1 Std. vorher')
      : t('{n} Min. vorher', { n: offset });

const NO_GUESTS: Record<string, PlanGuestStatus> = {};
const NO_ENTRIES: WatchPlanEntry[] = [];

const watchedSuffix = (ep: Parameters<typeof episodeWatchCount>[0]) => {
  const count = episodeWatchCount(ep);
  if (!count) return '';
  return count > 1 ? ` (${t('{n}× gesehen', { n: count })})` : ` (${t('gesehen')})`;
};

/** Mo … So als getDay()-Werte. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const weekdayShort = (day: number) =>
  new Date(2024, 0, day === 0 ? 7 : day).toLocaleDateString(dateLocale(), { weekday: 'short' });

const repeatLabel = (repeat: PlanRepeat): string => {
  if (repeat.mode === 'interval')
    return repeat.days === 1 ? t('Täglich') : t('Alle {n} Tage', { n: repeat.days });
  if (repeat.weekdays.length === 7) return t('Täglich');
  const days = WEEK_ORDER.filter((d) => repeat.weekdays.includes(d)).map(weekdayShort);
  return t('Jeden {days}', { days: days.join(', ') });
};

const weekdayOf = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

const Stepper = ({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) => {
  const { currentTheme } = useTheme();
  const style = { borderColor: currentTheme.border.default, color: currentTheme.text.secondary };
  return (
    <div className="wp-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="wp-stepper__btn"
        disabled={value <= min}
        aria-label={t('Weniger')}
        onClick={() => {
          hapticTap();
          onChange(Math.max(min, value - 1));
        }}
        style={style}
      >
        <Remove style={{ fontSize: 18 }} />
      </button>
      <span className="wp-stepper__value" style={{ color: currentTheme.text.secondary }}>
        {value}
      </span>
      <button
        type="button"
        className="wp-stepper__btn"
        disabled={value >= max}
        aria-label={t('Mehr')}
        onClick={() => {
          hapticTap();
          onChange(Math.min(max, value + 1));
        }}
        style={style}
      >
        <Add style={{ fontSize: 18 }} />
      </button>
    </div>
  );
};

const chipStyle = (active: boolean, theme: ReturnType<typeof useTheme>['currentTheme']) =>
  active
    ? {
        background: `${theme.primary}22`,
        borderColor: `${theme.primary}80`,
        color: theme.primary,
      }
    : { borderColor: theme.border.default, color: theme.text.secondary };

export const WatchPlanSheet = ({
  state,
  onClose,
  guestsByKey,
  entries = NO_ENTRIES,
}: {
  state: WatchPlanSheetState;
  onClose: () => void;
  guestsByKey?: Map<string, Record<string, PlanGuestStatus>>;
  entries?: WatchPlanEntry[];
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [query, setQuery] = useState('');
  const [pick, setPick] = useState<PickedItem | null>(null);
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState(NO_EPISODE);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [remindOffset, setRemindOffset] = useState<number | null>(null);
  const [openPicker, setOpenPicker] = useState<'date' | 'time' | null>(null);
  const [saving, setSaving] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);
  const [queued, setQueued] = useState<string[]>([]);
  const [repeatOn, setRepeatOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<PlanRepeat['mode']>('weekly');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState(2);
  const [perSession, setPerSession] = useState(1);
  const [scheduleEnd, setScheduleEnd] = useState<ScheduleEnd>('series');
  const twelveHour = useMemo(
    () => planUses12Hour(dateLocale(), typeof navigator !== 'undefined' ? navigator.language : ''),
    []
  );

  const seriesById = useMemo(() => new Map(seriesList.map((s) => [s.id, s])), [seriesList]);
  const moviesById = useMemo(() => new Map(movieList.map((m) => [m.id, m])), [movieList]);

  const openKey = !state.open ? '' : state.mode === 'edit' ? state.entry.key : `new-${state.date}`;

  // Formular bei jedem Öffnen neu befüllen
  useEffect(() => {
    if (!state.open) return;
    setQuery('');
    setSaving(false);
    setOpenPicker(null);
    setOpenedAt(Date.now());
    setQueued([]);
    setRepeatOn(false);
    setRepeatMode('weekly');
    setWeekdays([]);
    setIntervalDays(2);
    setPerSession(1);
    setScheduleEnd('series');
    if (state.mode === 'new') {
      setPick(null);
      setSeason('');
      setEpisode(NO_EPISODE);
      setDate(state.date);
      setTime('');
      setNote('');
      setRemindOffset(null);
      return;
    }
    const { entry } = state;
    const series = entry.kind === 'series' ? seriesById.get(entry.itemId) : undefined;
    const movie = entry.kind === 'movie' ? moviesById.get(entry.itemId) : undefined;
    setPick({
      kind: entry.kind,
      id: entry.itemId,
      title: entry.title || (series ? seriesTitle(series) : movie?.title || ''),
      poster: series?.poster?.poster ?? movie?.poster?.poster ?? entry.poster,
    });
    const ref = series ? resolvePlanEpisode(series, entry) : null;
    setSeason(String(ref?.seasonNumber ?? entry.seasonNumber ?? ''));
    setEpisode(ref ? String(ref.episode.id) : NO_EPISODE);
    setDate(entry.date);
    setTime(entry.time ?? '');
    setNote(entry.note ?? '');
    setRemindOffset(entry.remindOffset ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: (PickedItem & { rank: number })[] = [];
    for (const s of seriesList) {
      const title = seriesTitle(s);
      if (q && !title.toLowerCase().includes(q)) continue;
      items.push({
        kind: 'series',
        id: s.id,
        title,
        poster: s.poster?.poster,
        rank: s.watchlist ? 0 : 1,
      });
    }
    for (const m of movieList) {
      if (q && !(m.title || '').toLowerCase().includes(q)) continue;
      items.push({
        kind: 'movie',
        id: m.id,
        title: m.title || '',
        poster: m.poster?.poster,
        rank: m.watchlist ? 0 : 2,
      });
    }
    items.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title));
    return items.slice(0, RESULT_LIMIT);
  }, [query, seriesList, movieList]);

  const pickedSeries = pick?.kind === 'series' ? seriesById.get(pick.id) : undefined;
  const seasons = useMemo(() => (pickedSeries ? planSeasons(pickedSeries) : []), [pickedSeries]);
  const currentSeason = seasons.find((s) => String(s.seasonNumber) === season);

  const choose = (item: PickedItem) => {
    hapticTap();
    setPick(item);
    const series = item.kind === 'series' ? seriesById.get(item.id) : undefined;
    const next = series ? firstUnwatchedEpisode(series) : null;
    const fallbackSeason = series ? planSeasons(series)[0]?.seasonNumber : undefined;
    setSeason(String(next?.seasonNumber ?? fallbackSeason ?? ''));
    setEpisode(next ? String(next.episode.id) : NO_EPISODE);
  };

  const buildDraft = (): WatchPlanDraft | null => {
    if (!pick || !isValidPlanDate(date)) return null;
    const ref = currentSeason?.episodes.find((e) => String(e.episode.id) === episode);
    const previous = state.open && state.mode === 'edit' ? state.entry : undefined;
    const watchTarget = !ref
      ? undefined
      : previous?.episodeId === ref.episode.id && previous.watchTarget
        ? previous.watchTarget
        : episodeWatchCount(ref.episode) + 1;
    return {
      kind: pick.kind,
      itemId: pick.id,
      title: pick.title,
      date,
      time: time || undefined,
      seasonNumber:
        pick.kind === 'series' && currentSeason ? currentSeason.seasonNumber : undefined,
      episodeNumber: ref?.episodeNumber,
      episodeId: ref?.episode.id,
      note: note.trim() || undefined,
      poster: pick.poster,
      remindOffset: time && remindOffset !== null ? remindOffset : undefined,
      watchTarget,
      groupId: previous?.groupId,
      repeat: previous?.repeat,
    };
  };

  const repeatWeekdays = weekdays.length
    ? weekdays
    : isValidPlanDate(date)
      ? [weekdayOf(date)]
      : [];
  const startEpisodeId = Number(episode) || currentSeason?.episodes[0]?.episode.id || 0;

  const schedule = useMemo(() => {
    if (!repeatOn || !pickedSeries || !pick || !startEpisodeId || !isValidPlanDate(date))
      return null;
    const repeat: PlanRepeat =
      repeatMode === 'weekly'
        ? { mode: 'weekly', weekdays: repeatWeekdays }
        : { mode: 'interval', days: intervalDays };
    return buildPlanSchedule({
      series: pickedSeries,
      title: pick.title,
      poster: pick.poster,
      startEpisodeId,
      end: scheduleEnd,
      startDate: date,
      time: time || undefined,
      repeat,
      perSession,
      note: note.trim() || undefined,
      remindOffset: time && remindOffset !== null ? remindOffset : undefined,
      groupId: 'preview',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    repeatOn,
    pickedSeries,
    pick,
    startEpisodeId,
    scheduleEnd,
    date,
    time,
    repeatMode,
    weekdays,
    intervalDays,
    perSession,
    note,
    remindOffset,
  ]);

  const saveSchedule = async () => {
    if (!user?.uid || !schedule?.drafts.length) return;
    setSaving(true);
    try {
      const groupId = newPlanGroupId(user.uid);
      await addWatchPlanSeries(
        user.uid,
        schedule.drafts.map((draft) => ({ ...draft, groupId }))
      );
      showToast(t('{n} Folgen eingeplant', { n: schedule.drafts.length }));
      hapticSuccess();
      onClose();
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
      setSaving(false);
    }
  };

  const save = async () => {
    if (repeatOn && state.open && state.mode === 'new') {
      if (!saving) await saveSchedule();
      return;
    }
    const draft = buildDraft();
    if (!user?.uid || !draft || saving || !state.open) return;
    setSaving(true);
    try {
      let key: string;
      if (state.mode === 'edit' && (await saveGroupRenumber(draft))) {
        hapticSuccess();
        onClose();
        return;
      }
      if (state.mode === 'edit') {
        key = state.entry.key;
        await updateWatchPlanEntry(user.uid, state.entry, draft);
      } else {
        key = await addWatchPlanEntry(user.uid, draft);
      }
      const saved: WatchPlanEntry = { ...draft, key, createdAt: 0 };
      if (!draft.via && Object.keys(guests).length) {
        await syncPlanGuests(user.uid, saved, guests).catch(() => undefined);
      }
      if (!draft.via && queued.length) {
        const name = await planSenderName(user.uid, user.displayName, user.email);
        await sendPlanInvites(user.uid, name, saved, queued, guests);
        showToast(
          queued.length === 1
            ? t('Einladung verschickt')
            : t('{n} Einladungen verschickt', { n: queued.length })
        );
      } else {
        showToast(state.mode === 'edit' ? t('Plan aktualisiert') : t('In deinen Plan eingetragen'));
      }
      hapticSuccess();
      onClose();
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!user?.uid || !state.open || state.mode !== 'edit') return;
    const { entry } = state;
    const uid = user.uid;
    const entryGuests = guests;
    onClose();
    try {
      if (entry.via) {
        const name = await planSenderName(uid, user.displayName, user.email);
        await leavePlan(uid, name, entry);
        showToast(t('Termin abgesagt'));
        return;
      }
      await removeWatchPlanEntry(uid, entry.key);
      showUndoToast(t('Aus dem Plan entfernt'), {
        onUndo: () => void restoreWatchPlanEntry(uid, entry),
        onCommit: () => {
          if (Object.keys(entryGuests).length) {
            void removePlanGuests(uid, entry.key, entryGuests).catch(() => undefined);
          }
        },
      });
    } catch {
      showToast(t('Löschen fehlgeschlagen'), 2500, 'error');
    }
  };

  const openItem = () => {
    const draft = buildDraft();
    if (!draft) return;
    hapticTap();
    onClose();
    navigate(planItemPath(draft));
  };

  const isEdit = state.open && state.mode === 'edit';
  const via = state.open && state.mode === 'edit' ? state.entry.via : undefined;
  const guests =
    (state.open && state.mode === 'edit' && guestsByKey?.get(state.entry.key)) || NO_GUESTS;

  const uninvite = (uid: string, status: PlanGuestStatus) => {
    if (!user?.uid || !state.open || state.mode !== 'edit') return;
    void uninvitePlanGuest(user.uid, state.entry.key, uid, status).catch(() =>
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error')
    );
  };
  const canSave =
    !!pick && isValidPlanDate(date) && !saving && (!repeatOn || !!schedule?.drafts.length);

  const editEntry = state.open && state.mode === 'edit' ? state.entry : null;
  const group = useMemo(
    () => (editEntry?.groupId ? planGroupEntries(entries, editEntry.groupId) : []),
    [entries, editEntry]
  );
  const groupIndex = editEntry ? group.findIndex((e) => e.key === editEntry.key) : -1;

  /** Folge in einer Reihe geändert: die späteren Termine ziehen fortlaufend nach. */
  const saveGroupRenumber = async (draft: WatchPlanDraft): Promise<boolean> => {
    if (!user?.uid || !editEntry?.groupId || groupIndex < 0 || !pickedSeries) return false;
    if (!draft.episodeId || draft.episodeId === editEntry.episodeId) return false;
    const rest = group.slice(groupIndex + 1);
    if (!rest.length) return false;
    const uid = user.uid;
    const self: WatchPlanEntry = { ...editEntry, ...draft, key: editEntry.key };
    const originals = [editEntry, ...rest];
    const { assigned, removed } = renumberPlanGroup(pickedSeries, [self, ...rest], draft.episodeId);
    const changed = assigned.map(({ entry, ref }) => ({
      previous: originals.find((o) => o.key === entry.key) ?? entry,
      next: entry.key === self.key ? self : withPlanEpisode(entry, ref),
    }));
    if (!changed.length) return false;
    await applyWatchPlanChanges(uid, changed, removed);
    showUndoToast(t('Folgende Termine angepasst'), {
      onUndo: () => void restoreWatchPlanEntries(uid, originals),
    });
    return true;
  };

  const skipSession = async () => {
    if (!user?.uid || !editEntry || groupIndex < 0) return;
    const uid = user.uid;
    const following = group.filter((e) => e.date >= editEntry.date);
    const dates = shiftPlanGroup(following, editEntry.repeat);
    const changed = following.map((entry) => ({
      previous: entry,
      next: { ...entry, date: dates.get(entry.key) ?? entry.date },
    }));
    onClose();
    try {
      await applyWatchPlanChanges(uid, changed);
      hapticSuccess();
      showUndoToast(t('Termin fällt aus, der Rest rückt nach'), {
        onUndo: () => void restoreWatchPlanEntries(uid, following),
      });
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
    }
  };

  const removeFollowing = async () => {
    if (!user?.uid || !editEntry || groupIndex < 0) return;
    const uid = user.uid;
    const following = group.slice(groupIndex);
    onClose();
    try {
      await removeWatchPlanEntries(uid, following);
      showUndoToast(t('{n} Termine entfernt', { n: following.length }), {
        onUndo: () => void restoreWatchPlanEntries(uid, following),
      });
    } catch {
      showToast(t('Löschen fehlgeschlagen'), 2500, 'error');
    }
  };

  const toggleRepeat = () => {
    hapticTap();
    if (repeatOn) {
      setRepeatOn(false);
      return;
    }
    setRepeatOn(true);
    if (!weekdays.length && isValidPlanDate(date)) setWeekdays([weekdayOf(date)]);
    if (!episode && currentSeason?.episodes[0]) {
      setEpisode(String(currentSeason.episodes[0].episode.id));
    }
  };

  const toggleWeekday = (day: number) => {
    hapticTap();
    const base = repeatWeekdays;
    if (!base.includes(day)) setWeekdays([...base, day]);
    else if (base.length > 1) setWeekdays(base.filter((d) => d !== day));
  };

  const lastScheduled = schedule?.drafts[schedule.drafts.length - 1];
  const sessionCount = schedule ? new Set(schedule.drafts.map((d) => d.date)).size : 0;
  const rewatching = !!schedule?.drafts.some((d) => (d.watchTarget ?? 1) > 1);

  const resolved =
    state.open && state.mode === 'edit'
      ? resolveWatchPlanEntry(state.entry, seriesById, moviesById)
      : null;

  const markWatched = async (again = false) => {
    if (!user?.uid || !resolved) return;
    const uid = user.uid;
    onClose();
    await markPlanEntryWatched(uid, resolved, again);
  };

  const resolvedCount = resolved?.episode ? episodeWatchCount(resolved.episode.episode) : 0;

  const toggleReminder = () => {
    hapticTap();
    if (remindOffset !== null) {
      setRemindOffset(null);
      return;
    }
    if (!time) setTime(DEFAULT_REMIND_TIME);
    setRemindOffset(15);
  };

  const reminderOn = remindOffset !== null;
  const remindAt = reminderOn ? planReminderAt(date, time, remindOffset) : null;
  const remindInPast = remindAt !== null && remindAt < openedAt;

  const seasonOptions = seasons.map((s) => ({
    value: String(s.seasonNumber),
    label: t('Staffel {n}', { n: s.seasonNumber }),
  }));
  const episodeOptions = [
    { value: NO_EPISODE, label: t('Keine bestimmte Folge') },
    ...(currentSeason?.episodes ?? []).map((ref) => ({
      value: String(ref.episode.id),
      label: `${t('Folge {n}', { n: ref.episodeNumber })}${ref.episode.name ? ` · ${ref.episode.name}` : ''}${watchedSuffix(ref.episode)}`,
    })),
  ].filter((option) => !repeatOn || option.value !== NO_EPISODE);

  return (
    <BottomSheet
      isOpen={state.open}
      onClose={onClose}
      ariaLabel={isEdit ? t('Eintrag bearbeiten') : t('In den Plan eintragen')}
      maxHeight="90vh"
    >
      <div className="wp-sheet">
        <h3 className="wp-sheet__title" style={{ color: currentTheme.text.secondary }}>
          {isEdit ? t('Eintrag bearbeiten') : t('In den Plan eintragen')}
        </h3>

        {!pick ? (
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={t('Serie oder Film suchen...')}
            />
            <div className="wp-results" role="list">
              {results.length === 0 ? (
                <p className="wp-muted" style={{ color: currentTheme.text.muted }}>
                  {seriesList.length + movieList.length === 0
                    ? t('Deine Liste ist noch leer. Füge erst Serien oder Filme hinzu.')
                    : t('Nichts in deiner Liste gefunden')}
                </p>
              ) : (
                results.map((item) => (
                  <motion.button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    role="listitem"
                    whileTap={{ opacity: 0.7 }}
                    className="wp-result"
                    onClick={() => choose(item)}
                    style={{ borderColor: currentTheme.border.default }}
                  >
                    <img
                      className="wp-poster"
                      src={getImageUrl(item.poster, 'w92')}
                      alt=""
                      loading="lazy"
                    />
                    <span className="wp-result__body">
                      <span
                        className="wp-result__title"
                        style={{ color: currentTheme.text.secondary }}
                      >
                        {item.title}
                      </span>
                      <span className="wp-result__kind" style={{ color: currentTheme.text.muted }}>
                        {item.kind === 'series' ? (
                          <Tv style={{ fontSize: 14 }} />
                        ) : (
                          <MovieIcon style={{ fontSize: 14 }} />
                        )}
                        {item.kind === 'series' ? t('Serie') : t('Film')}
                      </span>
                    </span>
                  </motion.button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="wp-form">
            <div className="wp-picked" style={{ borderColor: currentTheme.border.default }}>
              <img className="wp-poster" src={getImageUrl(pick.poster, 'w92')} alt="" />
              <span className="wp-result__body">
                <span className="wp-result__title" style={{ color: currentTheme.text.secondary }}>
                  {pick.title}
                </span>
                <span className="wp-result__kind" style={{ color: currentTheme.text.muted }}>
                  {pick.kind === 'series' ? t('Serie') : t('Film')}
                </span>
              </span>
              {isEdit ? (
                <button
                  type="button"
                  className="wp-icon-btn"
                  onClick={openItem}
                  aria-label={pick.kind === 'series' ? t('Zur Serie') : t('Zum Film')}
                  style={{ color: currentTheme.text.secondary }}
                >
                  <OpenInNew style={{ fontSize: 20 }} />
                </button>
              ) : (
                <button
                  type="button"
                  className="wp-icon-btn"
                  onClick={() => setPick(null)}
                  aria-label={t('Andere Auswahl')}
                  style={{ color: currentTheme.text.secondary }}
                >
                  <Close style={{ fontSize: 20 }} />
                </button>
              )}
            </div>

            {via && (
              <div
                className="wp-via"
                style={{
                  borderColor: `${currentTheme.primary}45`,
                  background: `${currentTheme.primary}10`,
                }}
              >
                <span className="wp-via__from" style={{ color: currentTheme.primary }}>
                  {t('Termin von {name}', { name: via.hostName || t('Freund') })}
                </span>
                <span className="wp-via__when" style={{ color: currentTheme.text.secondary }}>
                  {[
                    pick.kind === 'series' && currentSeason
                      ? `S${currentSeason.seasonNumber}${
                          episode
                            ? ` · E${
                                currentSeason.episodes.find(
                                  (ref) => String(ref.episode.id) === episode
                                )?.episodeNumber ?? ''
                              }`
                            : ''
                        }`
                      : null,
                    date
                      ? new Date(`${date}T00:00:00`).toLocaleDateString(dateLocale(), {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })
                      : null,
                    time ? formatPlanTime(time, twelveHour) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                <span className="wp-remind__sub" style={{ color: currentTheme.text.muted }}>
                  {t('Tag und Uhrzeit legt {name} fest.', { name: via.hostName || t('Freund') })}
                </span>
              </div>
            )}

            {!via && pick.kind === 'series' && seasons.length > 0 && (
              <div className="wp-row">
                <label className="wp-field">
                  <span className="wp-label" style={{ color: currentTheme.text.secondary }}>
                    {t('Staffel')}
                  </span>
                  <ThemedSelect
                    value={season}
                    options={seasonOptions}
                    ariaLabel={t('Staffel')}
                    width="100%"
                    onChange={(value) => {
                      setSeason(value);
                      const target = seasons.find((s) => String(s.seasonNumber) === value);
                      const open = target?.episodes.find((ref) => !isEpisodeWatched(ref.episode));
                      const fallback = repeatOn ? target?.episodes[0] : undefined;
                      const next = open ?? fallback;
                      setEpisode(next ? String(next.episode.id) : NO_EPISODE);
                    }}
                  />
                </label>
                <label className="wp-field wp-field--grow">
                  <span className="wp-label" style={{ color: currentTheme.text.secondary }}>
                    {t('Folge')}
                  </span>
                  <ThemedSelect
                    value={episode}
                    options={episodeOptions}
                    ariaLabel={t('Folge')}
                    width="100%"
                    onChange={setEpisode}
                  />
                </label>
              </div>
            )}

            {!via && (
              <>
                <div className="wp-pickers">
                  <div className="wp-field">
                    <span className="wp-label" style={{ color: currentTheme.text.secondary }}>
                      {repeatOn ? t('Start') : t('Tag')}
                    </span>
                    <PlanDateTrigger
                      value={date}
                      open={openPicker === 'date'}
                      onToggle={() => setOpenPicker((p) => (p === 'date' ? null : 'date'))}
                    />
                  </div>
                  <div className="wp-field">
                    <span className="wp-label" style={{ color: currentTheme.text.secondary }}>
                      {t('Uhrzeit (optional)')}
                    </span>
                    <PlanTimeTrigger
                      twelveHour={twelveHour}
                      value={time}
                      open={openPicker === 'time'}
                      onToggle={() => setOpenPicker((p) => (p === 'time' ? null : 'time'))}
                    />
                  </div>
                </div>
                {openPicker === 'date' && (
                  <PlanDatePanel
                    value={date}
                    onChange={setDate}
                    onClose={() => setOpenPicker(null)}
                  />
                )}
                {openPicker === 'time' && (
                  <PlanTimePanel
                    twelveHour={twelveHour}
                    value={time}
                    onChange={(value) => {
                      setTime(value);
                      if (!value) setRemindOffset(null);
                    }}
                    onClose={() => setOpenPicker(null)}
                  />
                )}
              </>
            )}

            {!isEdit && !via && pick.kind === 'series' && seasons.length > 0 && (
              <div
                className="wp-remind"
                style={{
                  borderColor: repeatOn ? `${currentTheme.primary}55` : currentTheme.border.default,
                }}
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={repeatOn}
                  className="wp-remind__toggle"
                  onClick={toggleRepeat}
                >
                  <EventRepeat
                    style={{
                      fontSize: 20,
                      color: repeatOn ? currentTheme.primary : currentTheme.text.muted,
                    }}
                  />
                  <span className="wp-remind__text">
                    <span
                      className="wp-remind__title"
                      style={{ color: currentTheme.text.secondary }}
                    >
                      {t('Serientermin')}
                    </span>
                    <span className="wp-remind__sub" style={{ color: currentTheme.text.muted }}>
                      {t('Regelmäßig weiterschauen, ab der gewählten Folge')}
                    </span>
                  </span>
                  <span
                    className={`wp-switch${repeatOn ? ' is-on' : ''}`}
                    style={{
                      background: repeatOn ? currentTheme.primary : `${currentTheme.text.muted}40`,
                    }}
                  >
                    <span className="wp-switch__knob" />
                  </span>
                </button>
                {repeatOn && (
                  <div className="wp-repeat">
                    <div
                      className="wp-remind__chips wp-remind__chips--two"
                      role="radiogroup"
                      aria-label={t('Rhythmus')}
                    >
                      {(['weekly', 'interval'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          role="radio"
                          aria-checked={repeatMode === mode}
                          className="wp-chip"
                          onClick={() => {
                            hapticTap();
                            setRepeatMode(mode);
                          }}
                          style={chipStyle(repeatMode === mode, currentTheme)}
                        >
                          {mode === 'weekly' ? t('Wochentage') : t('Alle X Tage')}
                        </button>
                      ))}
                    </div>
                    {repeatMode === 'weekly' ? (
                      <div className="wp-weekdays" role="group" aria-label={t('Wochentage')}>
                        {WEEK_ORDER.map((day) => {
                          const active = repeatWeekdays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              aria-pressed={active}
                              className="wp-chip wp-weekday"
                              onClick={() => toggleWeekday(day)}
                              style={
                                active
                                  ? {
                                      background: currentTheme.primary,
                                      borderColor: currentTheme.primary,
                                      color: currentTheme.background.default,
                                    }
                                  : {
                                      borderColor: currentTheme.border.default,
                                      color: currentTheme.text.secondary,
                                    }
                              }
                            >
                              {weekdayShort(day)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="wp-repeat__row">
                        <span style={{ color: currentTheme.text.secondary }}>
                          {intervalDays === 1
                            ? t('Täglich')
                            : t('Alle {n} Tage', { n: intervalDays })}
                        </span>
                        <Stepper
                          value={intervalDays}
                          min={1}
                          max={SCHEDULE_MAX_INTERVAL}
                          onChange={setIntervalDays}
                          label={t('Abstand in Tagen')}
                        />
                      </div>
                    )}
                    <div className="wp-repeat__row">
                      <span style={{ color: currentTheme.text.secondary }}>
                        {t('Folgen pro Termin')}
                      </span>
                      <Stepper
                        value={perSession}
                        min={1}
                        max={SCHEDULE_MAX_PER_SESSION}
                        onChange={setPerSession}
                        label={t('Folgen pro Termin')}
                      />
                    </div>
                    <div
                      className="wp-remind__chips wp-remind__chips--two"
                      role="radiogroup"
                      aria-label={t('Bis')}
                    >
                      {(['season', 'series'] as const).map((end) => (
                        <button
                          key={end}
                          type="button"
                          role="radio"
                          aria-checked={scheduleEnd === end}
                          className="wp-chip"
                          onClick={() => {
                            hapticTap();
                            setScheduleEnd(end);
                          }}
                          style={chipStyle(scheduleEnd === end, currentTheme)}
                        >
                          {end === 'season' ? t('Bis Staffelende') : t('Bis Serienende')}
                        </button>
                      ))}
                    </div>
                    <div className="wp-repeat__summary" style={{ color: currentTheme.text.muted }}>
                      {schedule && lastScheduled ? (
                        <>
                          <span style={{ color: currentTheme.text.secondary }}>
                            {t('{n} Folgen an {m} Terminen', {
                              n: schedule.drafts.length,
                              m: sessionCount,
                            })}
                            {' · '}
                            {t('bis {date}', {
                              date: new Date(`${lastScheduled.date}T00:00:00`).toLocaleDateString(
                                dateLocale(),
                                { weekday: 'short', day: 'numeric', month: 'short' }
                              ),
                            })}
                          </span>
                          {schedule.cut > 0 && (
                            <span>
                              {t('Eingeplant werden die nächsten {n} Folgen.', {
                                n: SCHEDULE_MAX_ENTRIES,
                              })}
                            </span>
                          )}
                          {rewatching && (
                            <span>
                              {t('Schon gesehene Folgen zählen beim Abhaken als Rewatch.')}
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: currentTheme.status.warning }}>
                          {t('Ab dieser Folge ist noch nichts erschienen.')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {editEntry?.groupId && groupIndex >= 0 && (
              <div
                className="wp-via"
                style={{
                  borderColor: `${currentTheme.primary}45`,
                  background: `${currentTheme.primary}10`,
                }}
              >
                <span className="wp-via__from" style={{ color: currentTheme.primary }}>
                  <EventRepeat style={{ fontSize: 16 }} />
                  {t('Serientermin')}
                  {editEntry.repeat ? ` · ${repeatLabel(editEntry.repeat)}` : ''}
                </span>
                <span className="wp-remind__sub" style={{ color: currentTheme.text.muted }}>
                  {t('Folge {i} von {n} in dieser Reihe', {
                    i: groupIndex + 1,
                    n: group.length,
                  })}
                  {group.length - groupIndex > 1
                    ? ` · ${t('Änderst du die Folge, ziehen die späteren Termine mit.')}`
                    : ''}
                </span>
                <button
                  type="button"
                  className="wp-btn wp-btn--ghost wp-btn--block wp-skip"
                  onClick={() => void skipSession()}
                  style={{
                    color: currentTheme.text.secondary,
                    borderColor: currentTheme.border.default,
                  }}
                >
                  <EventBusy style={{ fontSize: 18 }} />
                  {t('Termin fällt aus – Rest verschieben')}
                </button>
              </div>
            )}

            <div
              className="wp-remind"
              style={{
                borderColor: reminderOn ? `${currentTheme.primary}55` : currentTheme.border.default,
              }}
            >
              <button
                type="button"
                role="switch"
                aria-checked={reminderOn}
                className="wp-remind__toggle"
                onClick={toggleReminder}
              >
                <NotificationsActiveOutlined
                  style={{
                    fontSize: 20,
                    color: reminderOn ? currentTheme.primary : currentTheme.text.muted,
                  }}
                />
                <span className="wp-remind__text">
                  <span className="wp-remind__title" style={{ color: currentTheme.text.secondary }}>
                    {t('Erinnern')}
                  </span>
                  <span className="wp-remind__sub" style={{ color: currentTheme.text.muted }}>
                    {t('Push und Benachrichtigung in der App')}
                  </span>
                </span>
                <span
                  className={`wp-switch${reminderOn ? ' is-on' : ''}`}
                  style={{
                    background: reminderOn ? currentTheme.primary : `${currentTheme.text.muted}40`,
                  }}
                >
                  <span className="wp-switch__knob" />
                </span>
              </button>
              {reminderOn && (
                <>
                  <div className="wp-remind__chips" role="radiogroup" aria-label={t('Erinnern')}>
                    {REMIND_OFFSETS.map((offset) => {
                      const active = offset === remindOffset;
                      return (
                        <button
                          key={offset}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className="wp-chip"
                          onClick={() => {
                            hapticTap();
                            setRemindOffset(offset);
                          }}
                          style={
                            active
                              ? {
                                  background: `${currentTheme.primary}22`,
                                  borderColor: `${currentTheme.primary}80`,
                                  color: currentTheme.primary,
                                }
                              : {
                                  borderColor: currentTheme.border.default,
                                  color: currentTheme.text.secondary,
                                }
                          }
                        >
                          {offsetLabel(offset)}
                        </button>
                      );
                    })}
                  </div>
                  {remindInPast && (
                    <span
                      className="wp-remind__warn"
                      style={{ color: currentTheme.status.warning }}
                    >
                      {t('Dieser Zeitpunkt ist schon vorbei — es kommt keine Erinnerung.')}
                    </span>
                  )}
                </>
              )}
            </div>

            {!via && !repeatOn && !editEntry?.groupId && (
              <PlanGuestsSection
                guests={guests}
                queued={queued}
                onQueue={(uids) => setQueued((prev) => [...new Set([...prev, ...uids])])}
                onUnqueue={(uid) => setQueued((prev) => prev.filter((u) => u !== uid))}
                onUninvite={uninvite}
              />
            )}

            <label className="wp-field">
              <span className="wp-label" style={{ color: currentTheme.text.secondary }}>
                {t('Notiz (optional)')}
              </span>
              <input
                type="text"
                className="wp-input"
                value={note}
                maxLength={WATCH_PLAN_NOTE_MAX}
                placeholder={t('z. B. mit Freunden, Kinoabend …')}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  borderColor: currentTheme.border.default,
                  color: currentTheme.text.secondary,
                }}
              />
            </label>

            {resolved && !resolved.done && (
              <motion.button
                type="button"
                whileTap={{ opacity: 0.7 }}
                className="wp-btn wp-btn--watched"
                onClick={() => void markWatched()}
                style={{
                  color: currentTheme.status.success,
                  borderColor: `${currentTheme.status.success}55`,
                  background: `${currentTheme.status.success}14`,
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 20 }} />
                {resolved.entry.kind === 'movie'
                  ? t('Film als gesehen markieren')
                  : resolved.entry.episodeNumber
                    ? resolved.entry.watchTarget && resolved.entry.watchTarget > 1
                      ? t('Als {n}. Mal gesehen markieren', { n: resolved.entry.watchTarget })
                      : t('Folge als gesehen markieren')
                    : t('Nächste Folge abhaken')}
              </motion.button>
            )}

            {resolved?.done && resolved.entry.kind === 'series' && resolved.episode && (
              <motion.button
                type="button"
                whileTap={{ opacity: 0.7 }}
                className="wp-btn wp-btn--watched"
                onClick={() => void markWatched(true)}
                style={{
                  color: currentTheme.primary,
                  borderColor: `${currentTheme.primary}55`,
                  background: `${currentTheme.primary}14`,
                }}
              >
                <Replay style={{ fontSize: 20 }} />
                {t('Nochmal gesehen')}
                <span className="wp-btn__count">{t('{n}× gesehen', { n: resolvedCount })}</span>
              </motion.button>
            )}

            {editEntry?.groupId && groupIndex >= 0 && group.length - groupIndex > 1 && (
              <button
                type="button"
                className="wp-btn wp-btn--ghost wp-btn--block"
                onClick={() => void removeFollowing()}
                style={{
                  color: currentTheme.status.error,
                  borderColor: currentTheme.border.default,
                }}
              >
                <DeleteOutlined style={{ fontSize: 18 }} />
                {t('Diesen und alle folgenden löschen ({n})', { n: group.length - groupIndex })}
              </button>
            )}

            <div className="wp-actions">
              {isEdit && (
                <button
                  type="button"
                  className="wp-btn wp-btn--ghost"
                  onClick={() => void remove()}
                  style={{
                    color: currentTheme.status.error,
                    borderColor: currentTheme.border.default,
                  }}
                >
                  <DeleteOutlined style={{ fontSize: 18 }} />
                  {via ? t('Absagen') : t('Löschen')}
                </button>
              )}
              <motion.button
                type="button"
                whileTap={{ opacity: 0.7 }}
                className="wp-btn wp-btn--primary"
                disabled={!canSave}
                onClick={() => void save()}
                style={{ background: currentTheme.primary, color: currentTheme.background.default }}
              >
                {isEdit
                  ? t('Speichern')
                  : repeatOn && schedule?.drafts.length
                    ? t('{n} Folgen eintragen', { n: schedule.drafts.length })
                    : t('Eintragen')}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
