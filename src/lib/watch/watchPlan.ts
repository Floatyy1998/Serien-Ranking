/** Eigener Schau-Plan (users/$uid/watchPlan): Parsen, Gruppieren, Auflösen gegen die eigene Liste. */

import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { isMovieWatched } from '../rating/rating';
import { isEpisodeWatched, normalizeEpisodes, normalizeSeasons } from '../episode/seriesMetrics';
import { hasEpisodeAired } from '../../utils/episodeDate';

export type WatchPlanKind = 'series' | 'movie';

/** Gespeicherte Form (Kurz-Keys). */
export interface StoredWatchPlanEntry {
  k: 's' | 'm';
  id: number;
  t: string;
  d: string;
  h?: string;
  s?: number;
  e?: number;
  x?: number;
  n?: string;
  c?: number;
  /** Poster-Pfad als Rückfall, wenn der Titel nicht (mehr) in der eigenen Liste ist. */
  p?: string;
  /** Erinnerung: Vorlauf in Minuten, Zeitpunkt (ms UTC), vom Server gesetzter Versand-Stempel. */
  r?: number;
  ra?: number;
  rs?: number;
  /** Gemeinsamer Termin: Host-UID, Host-Schlüssel, Host-Name. */
  v?: { f: string; k: string; n?: string };
  /** Ziel-Sichtungszahl der Folge: abgehakt, sobald watchCount sie erreicht (Rewatch). */
  w?: number;
  /** Serientermin: Reihen-Id und Rhythmus ("w1,4" = Wochentage, "d2" = alle 2 Tage). */
  g?: string;
  gr?: string;
}

export interface PlanVia {
  hostUid: string;
  hostKey: string;
  hostName?: string;
}

export interface WatchPlanEntry {
  key: string;
  kind: WatchPlanKind;
  itemId: number;
  title: string;
  date: string;
  time?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeId?: number;
  note?: string;
  poster?: string;
  /** Vorlauf in Minuten; undefined = keine Erinnerung. */
  remindOffset?: number;
  remindAt?: number;
  remindSentAt?: number;
  /** Gesetzt, wenn der Eintrag eine angenommene Einladung ist. */
  via?: PlanVia;
  watchTarget?: number;
  groupId?: string;
  repeat?: PlanRepeat;
  createdAt: number;
}

export type PlanRepeat =
  { mode: 'weekly'; weekdays: number[] } | { mode: 'interval'; days: number };

export type WatchPlanDraft = Omit<
  WatchPlanEntry,
  'key' | 'createdAt' | 'remindAt' | 'remindSentAt'
>;

export const WATCH_PLAN_NOTE_MAX = 80;

export const REMIND_OFFSETS = [0, 15, 60] as const;

export const DEFAULT_REMIND_TIME = '20:00';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isValidPlanDate = (value: unknown): value is string =>
  typeof value === 'string' && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));

export const isValidPlanTime = (value: unknown): value is string =>
  typeof value === 'string' && TIME_RE.test(value);

const positiveInt = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;

const isRemindOffset = (value: unknown): value is number =>
  (REMIND_OFFSETS as readonly unknown[]).includes(value);

/** Erinnerungszeitpunkt in der lokalen Zeitzone des Geräts, das den Eintrag speichert. */
export function planReminderAt(
  date: string,
  time: string | undefined,
  offset: number
): number | null {
  if (!isValidPlanDate(date) || !isValidPlanTime(time)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime() - offset * 60_000;
}

export function expandWatchPlanEntry(key: string, raw: unknown): WatchPlanEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<StoredWatchPlanEntry>;
  const itemId = positiveInt(r.id);
  if ((r.k !== 's' && r.k !== 'm') || !itemId || !isValidPlanDate(r.d)) return null;
  const kind: WatchPlanKind = r.k === 's' ? 'series' : 'movie';
  return {
    key,
    kind,
    itemId,
    title: typeof r.t === 'string' ? r.t : '',
    date: r.d,
    time: isValidPlanTime(r.h) ? r.h : undefined,
    seasonNumber: kind === 'series' ? positiveInt(r.s) : undefined,
    episodeNumber: kind === 'series' ? positiveInt(r.e) : undefined,
    episodeId: kind === 'series' ? positiveInt(r.x) : undefined,
    note: typeof r.n === 'string' && r.n.trim() ? r.n.trim() : undefined,
    poster: typeof r.p === 'string' && r.p ? r.p : undefined,
    remindOffset: isRemindOffset(r.r) && isValidPlanTime(r.h) ? r.r : undefined,
    remindAt: typeof r.ra === 'number' ? r.ra : undefined,
    remindSentAt: typeof r.rs === 'number' ? r.rs : undefined,
    via:
      r.v && typeof r.v.f === 'string' && typeof r.v.k === 'string'
        ? {
            hostUid: r.v.f,
            hostKey: r.v.k,
            hostName: typeof r.v.n === 'string' ? r.v.n : undefined,
          }
        : undefined,
    watchTarget: kind === 'series' ? positiveInt(r.w) : undefined,
    groupId: typeof r.g === 'string' && r.g ? r.g : undefined,
    repeat: typeof r.g === 'string' && r.g ? (parsePlanRepeat(r.gr) ?? undefined) : undefined,
    createdAt: typeof r.c === 'number' ? r.c : 0,
  };
}

export function expandWatchPlan(raw: unknown): WatchPlanEntry[] {
  if (!raw || typeof raw !== 'object') return [];
  const entries: WatchPlanEntry[] = [];
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const entry = expandWatchPlanEntry(key, value);
    if (entry) entries.push(entry);
  }
  return entries;
}

/** Ohne undefined-Felder — RTDB lehnt undefined ab. `previous` erhält den Versand-Stempel, solange der Zeitpunkt gleich bleibt. */
export function compactWatchPlanDraft(
  draft: WatchPlanDraft,
  createdAt: number,
  previous?: Pick<WatchPlanEntry, 'remindAt' | 'remindSentAt'>
): StoredWatchPlanEntry {
  const stored: StoredWatchPlanEntry = {
    k: draft.kind === 'series' ? 's' : 'm',
    id: draft.itemId,
    t: draft.title.slice(0, 200),
    d: draft.date,
    c: createdAt,
  };
  if (draft.time && isValidPlanTime(draft.time)) stored.h = draft.time;
  if (draft.kind === 'series') {
    if (draft.seasonNumber) stored.s = draft.seasonNumber;
    if (draft.seasonNumber && draft.episodeNumber) stored.e = draft.episodeNumber;
    if (draft.seasonNumber && draft.episodeNumber && draft.episodeId) stored.x = draft.episodeId;
  }
  const note = draft.note?.trim().slice(0, WATCH_PLAN_NOTE_MAX);
  if (note) stored.n = note;
  if (draft.poster) stored.p = draft.poster.slice(0, 300);
  if (stored.x && draft.watchTarget && draft.watchTarget > 0) stored.w = draft.watchTarget;
  if (draft.groupId) {
    stored.g = draft.groupId;
    if (draft.repeat) stored.gr = encodePlanRepeat(draft.repeat);
  }
  if (draft.via) {
    stored.v = { f: draft.via.hostUid, k: draft.via.hostKey };
    if (draft.via.hostName) stored.v.n = draft.via.hostName.slice(0, 100);
  }
  if (draft.remindOffset !== undefined && isRemindOffset(draft.remindOffset)) {
    const at = planReminderAt(draft.date, stored.h, draft.remindOffset);
    if (at !== null) {
      stored.r = draft.remindOffset;
      stored.ra = at;
      if (previous?.remindSentAt && previous.remindAt === at) stored.rs = previous.remindSentAt;
    }
  }
  return stored;
}

/** Ganztägige Einträge zuerst, dann nach Uhrzeit, dann nach Anlage. */
export function compareWatchPlanEntries(a: WatchPlanEntry, b: WatchPlanEntry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ta = a.time ?? '';
  const tb = b.time ?? '';
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.createdAt - b.createdAt;
}

export function groupWatchPlanByDate(entries: WatchPlanEntry[]): Map<string, WatchPlanEntry[]> {
  const byDate = new Map<string, WatchPlanEntry[]>();
  for (const entry of [...entries].sort(compareWatchPlanEntries)) {
    const list = byDate.get(entry.date);
    if (list) list.push(entry);
    else byDate.set(entry.date, [entry]);
  }
  return byDate;
}

type SeriesEpisode = Series['seasons'][number]['episodes'][number];

export interface PlanEpisodeRef {
  seasonNumber: number;
  episodeNumber: number;
  episode: SeriesEpisode;
}

// Im Datenmodell ist seasonNumber die 0-basierte Position; angezeigt und gespeichert wird 1-basiert.
const seasonNumberOf = (season: Series['seasons'][number], index: number): number =>
  (season.seasonNumber ?? index) + 1;

/** Staffeln mit Folgen, 1-basiert nummeriert. */
export function planSeasons(
  series: Series
): { seasonNumber: number; episodes: PlanEpisodeRef[] }[] {
  return normalizeSeasons(series.seasons)
    .map((season, index) => {
      const seasonNumber = seasonNumberOf(season, index);
      const episodes = normalizeEpisodes(season.episodes).map((episode, i) => ({
        seasonNumber,
        episodeNumber: episode.episode_number ?? i + 1,
        episode,
      }));
      return { seasonNumber, episodes };
    })
    .filter((s) => s.episodes.length > 0);
}

/** Erste ungesehene Folge — Vorschlag beim Eintragen. */
export function firstUnwatchedEpisode(series: Series): PlanEpisodeRef | null {
  for (const season of planSeasons(series)) {
    const open = season.episodes.find((ref) => !isEpisodeWatched(ref.episode));
    if (open) return open;
  }
  return null;
}

/** Folge per TMDB-Id, sonst per Staffel/Folge-Nummer. */
export function resolvePlanEpisode(series: Series, entry: WatchPlanEntry): PlanEpisodeRef | null {
  if (!entry.seasonNumber || !entry.episodeNumber) return null;
  const seasons = planSeasons(series);
  if (entry.episodeId) {
    for (const season of seasons) {
      const hit = season.episodes.find((ref) => ref.episode.id === entry.episodeId);
      if (hit) return hit;
    }
  }
  const season = seasons.find((s) => s.seasonNumber === entry.seasonNumber);
  return season?.episodes.find((ref) => ref.episodeNumber === entry.episodeNumber) ?? null;
}

export interface ResolvedWatchPlanEntry {
  entry: WatchPlanEntry;
  series?: Series;
  movie?: Movie;
  episode?: PlanEpisodeRef | null;
  /** Folge bzw. Film ist schon gesehen; ganze Serie/Staffel nie. */
  done: boolean;
}

export function resolveWatchPlanEntry(
  entry: WatchPlanEntry,
  seriesById: Map<number, Series>,
  moviesById: Map<number, Movie>
): ResolvedWatchPlanEntry {
  if (entry.kind === 'movie') {
    const movie = moviesById.get(entry.itemId);
    return { entry, movie, done: movie ? isMovieWatched(movie) : false };
  }
  const series = seriesById.get(entry.itemId);
  const episode = series ? resolvePlanEpisode(series, entry) : null;
  const done = episode
    ? entry.watchTarget
      ? episodeWatchCount(episode.episode) >= entry.watchTarget
      : isEpisodeWatched(episode.episode)
    : false;
  return { entry, series, episode, done };
}

/** Wie oft eine Folge gesehen wurde; Alt-Zeilen ohne Zähler zählen als 1. */
export function episodeWatchCount(episode: SeriesEpisode): number {
  const count = typeof episode.watchCount === 'number' ? episode.watchCount : 0;
  if (count > 0) return count;
  return isEpisodeWatched(episode) ? 1 : 0;
}

/* ── Serientermin ───────────────────────────────────────────────────── */

export const SCHEDULE_MAX_ENTRIES = 150;
export const SCHEDULE_MAX_PER_SESSION = 5;
export const SCHEDULE_MAX_INTERVAL = 14;

export function encodePlanRepeat(repeat: PlanRepeat): string {
  return repeat.mode === 'weekly'
    ? `w${[...new Set(repeat.weekdays)].sort((a, b) => a - b).join(',')}`
    : `d${repeat.days}`;
}

export function parsePlanRepeat(raw: unknown): PlanRepeat | null {
  if (typeof raw !== 'string') return null;
  if (raw.startsWith('d')) {
    const days = Number(raw.slice(1));
    return Number.isInteger(days) && days >= 1 && days <= SCHEDULE_MAX_INTERVAL
      ? { mode: 'interval', days }
      : null;
  }
  if (raw.startsWith('w')) {
    const weekdays = raw
      .slice(1)
      .split(',')
      .map(Number)
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    return weekdays.length ? { mode: 'weekly', weekdays: [...new Set(weekdays)] } : null;
  }
  return null;
}

const dateKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Die ersten `count` Termine ab `start` (inklusive, falls er passt). */
export function planRepeatDates(start: string, repeat: PlanRepeat, count: number): string[] {
  if (!isValidPlanDate(start) || count <= 0) return [];
  const [y, m, d] = start.split('-').map(Number);
  const out: string[] = [];
  if (repeat.mode === 'interval') {
    const step = Math.max(1, Math.min(SCHEDULE_MAX_INTERVAL, Math.floor(repeat.days)));
    for (let i = 0; out.length < count; i++) out.push(dateKeyOf(new Date(y, m - 1, d + i * step)));
    return out;
  }
  const days = new Set(repeat.weekdays.filter((w) => w >= 0 && w <= 6));
  if (!days.size) return [];
  for (let i = 0; out.length < count; i++) {
    const date = new Date(y, m - 1, d + i);
    if (days.has(date.getDay())) out.push(dateKeyOf(date));
  }
  return out;
}

export type ScheduleEnd = 'season' | 'series';

/** Folgen ab der Startfolge in Reihenfolge; nur ausgestrahlte, optional nur bis Staffelende. */
export function scheduleEpisodes(
  series: Series,
  startEpisodeId: number,
  end: ScheduleEnd
): PlanEpisodeRef[] {
  const out: PlanEpisodeRef[] = [];
  let started = false;
  for (const season of planSeasons(series)) {
    for (const ref of season.episodes) {
      if (!started && ref.episode.id === startEpisodeId) started = true;
      if (!started) continue;
      if (!hasEpisodeAired(ref.episode)) return out;
      out.push(ref);
    }
    if (started && end === 'season') return out;
  }
  return out;
}

export interface PlanScheduleInput {
  series: Series;
  title: string;
  poster?: string;
  startEpisodeId: number;
  end: ScheduleEnd;
  startDate: string;
  time?: string;
  repeat: PlanRepeat;
  perSession: number;
  note?: string;
  remindOffset?: number;
  groupId: string;
}

export interface PlanSchedule {
  drafts: WatchPlanDraft[];
  /** Folgen, die wegen SCHEDULE_MAX_ENTRIES nicht mehr eingeplant wurden. */
  cut: number;
}

/** Ein Eintrag je Folge; Erinnerung nur beim ersten Eintrag eines Termins. */
export function buildPlanSchedule(input: PlanScheduleInput): PlanSchedule {
  const all = scheduleEpisodes(input.series, input.startEpisodeId, input.end);
  const episodes = all.slice(0, SCHEDULE_MAX_ENTRIES);
  const perSession = Math.max(1, Math.min(SCHEDULE_MAX_PER_SESSION, Math.floor(input.perSession)));
  const dates = planRepeatDates(
    input.startDate,
    input.repeat,
    Math.ceil(episodes.length / perSession)
  );
  const drafts = episodes.map((ref, i): WatchPlanDraft => {
    const first = i % perSession === 0;
    return {
      kind: 'series',
      itemId: input.series.id,
      title: input.title,
      date: dates[Math.floor(i / perSession)],
      time: input.time,
      seasonNumber: ref.seasonNumber,
      episodeNumber: ref.episodeNumber,
      episodeId: ref.episode.id,
      note: input.note,
      poster: input.poster,
      remindOffset: first && input.time ? input.remindOffset : undefined,
      watchTarget: episodeWatchCount(ref.episode) + 1,
      groupId: input.groupId,
      repeat: input.repeat,
    };
  });
  return { drafts, cut: all.length - episodes.length };
}

/** Einträge einer Reihe in Terminreihenfolge. */
export function planGroupEntries(entries: WatchPlanEntry[], groupId: string): WatchPlanEntry[] {
  return entries.filter((e) => e.groupId === groupId).sort(compareWatchPlanEntries);
}

/** Die sieben Datums-Keys (YYYY-MM-DD, lokal) ab Montag. */
export function weekDateKeys(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  });
}

export function planItemPath(
  entry: Pick<WatchPlanEntry, 'kind' | 'itemId' | 'seasonNumber' | 'episodeNumber'>
): string {
  if (entry.kind === 'movie') return `/movie/${entry.itemId}`;
  if (entry.seasonNumber && entry.episodeNumber)
    return `/episode/${entry.itemId}/s/${entry.seasonNumber}/e/${entry.episodeNumber}`;
  return `/series/${entry.itemId}`;
}

const hasDayPeriod = (locale: string): boolean => {
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric' })
      .formatToParts(new Date(2020, 0, 1, 13))
      .some((part) => part.type === 'dayPeriod');
  } catch {
    return false;
  }
};

/** 12-h-Anzeige: Geräteformat, solange es zur App-Sprache passt, sonst das der App-Sprache. */
export function planUses12Hour(appLocaleTag: string, deviceLocale?: string): boolean {
  const lang = (tag: string) => tag.split('-')[0].toLowerCase();
  const source =
    deviceLocale && lang(deviceLocale) === lang(appLocaleTag) ? deviceLocale : appLocaleTag;
  return hasDayPeriod(source);
}

/** "20:15" → "8:15 PM" bei 12 h, sonst unverändert. */
export function formatPlanTime(time: string, twelveHour: boolean): string {
  if (!twelveHour || !isValidPlanTime(time)) return time;
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/* ── Gemeinsame Termine ─────────────────────────────────────────────── */

export type PlanGuestStatus = 'p' | 'a' | 'd';

/** Einladung beim Gast: users/$gast/planInvites/{host}_{key}. Ohne Notiz — die bleibt privat. */
export interface StoredPlanInvite {
  f: string;
  fn?: string;
  hk: string;
  k: 's' | 'm';
  id: number;
  t: string;
  d: string;
  h?: string;
  s?: number;
  e?: number;
  x?: number;
  p?: string;
  ts?: number;
}

export interface PlanInvite {
  inviteId: string;
  hostUid: string;
  hostName?: string;
  hostKey: string;
  kind: WatchPlanKind;
  itemId: number;
  title: string;
  date: string;
  time?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeId?: number;
  poster?: string;
  sentAt: number;
}

export const planInviteId = (hostUid: string, hostKey: string) => `${hostUid}_${hostKey}`;
export const guestCopyKey = (hostUid: string, hostKey: string) => `inv_${hostUid}_${hostKey}`;

/** Termin-Felder, die Host und Gast teilen (ohne Notiz, Erinnerung, Anlagezeit). */
export function sharedPlanFields(
  entry: Pick<
    WatchPlanEntry,
    | 'kind'
    | 'itemId'
    | 'title'
    | 'date'
    | 'time'
    | 'seasonNumber'
    | 'episodeNumber'
    | 'episodeId'
    | 'poster'
  >
): Omit<StoredPlanInvite, 'f' | 'fn' | 'hk' | 'ts'> {
  const stored = compactWatchPlanDraft({ ...entry, note: undefined, remindOffset: undefined }, 0);
  const shared: Omit<StoredPlanInvite, 'f' | 'fn' | 'hk' | 'ts'> = {
    k: stored.k,
    id: stored.id,
    t: stored.t,
    d: stored.d,
  };
  if (stored.h) shared.h = stored.h;
  if (stored.s) shared.s = stored.s;
  if (stored.e) shared.e = stored.e;
  if (stored.x) shared.x = stored.x;
  if (stored.p) shared.p = stored.p;
  return shared;
}

export function expandPlanInvites(raw: unknown): PlanInvite[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: PlanInvite[] = [];
  for (const [inviteId, value] of Object.entries(raw as Record<string, unknown>)) {
    const r = value as Partial<StoredPlanInvite> | null;
    if (!r || typeof r.f !== 'string' || typeof r.hk !== 'string') continue;
    const entry = expandWatchPlanEntry(inviteId, { ...r, c: r.ts });
    if (!entry) continue;
    out.push({
      inviteId,
      hostUid: r.f,
      hostName: typeof r.fn === 'string' ? r.fn : undefined,
      hostKey: r.hk,
      kind: entry.kind,
      itemId: entry.itemId,
      title: entry.title,
      date: entry.date,
      time: entry.time,
      seasonNumber: entry.seasonNumber,
      episodeNumber: entry.episodeNumber,
      episodeId: entry.episodeId,
      poster: entry.poster,
      sentAt: typeof r.ts === 'number' ? r.ts : 0,
    });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function expandPlanGuests(raw: unknown): Map<string, Record<string, PlanGuestStatus>> {
  const out = new Map<string, Record<string, PlanGuestStatus>>();
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, guests] of Object.entries(raw as Record<string, unknown>)) {
    if (!guests || typeof guests !== 'object') continue;
    const clean: Record<string, PlanGuestStatus> = {};
    for (const [uid, status] of Object.entries(guests as Record<string, unknown>)) {
      if (status === 'p' || status === 'a' || status === 'd') clean[uid] = status;
    }
    if (Object.keys(clean).length) out.set(key, clean);
  }
  return out;
}

const addDays = (date: string, days: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return dateKeyOf(new Date(y, m - 1, d + days));
};

/** Nächster Termin im Rhythmus nach `date`; ohne Rhythmus eine Woche später. */
export function nextRepeatDate(date: string, repeat?: PlanRepeat): string {
  if (!repeat) return addDays(date, 7);
  if (repeat.mode === 'interval') return addDays(date, repeat.days);
  return planRepeatDates(addDays(date, 1), repeat, 1)[0] ?? addDays(date, 7);
}

/** Termin fällt aus: jede Sitzung ab `from` rückt auf den Tag der nächsten, die letzte auf den nächsten Rhythmus-Tag. */
export function shiftPlanGroup(
  following: WatchPlanEntry[],
  repeat?: PlanRepeat
): Map<string, string> {
  const sessions = [...new Set(following.map((e) => e.date))].sort();
  const moved = new Map<string, string>();
  sessions.forEach((date, i) => {
    moved.set(date, sessions[i + 1] ?? nextRepeatDate(date, repeat));
  });
  const out = new Map<string, string>();
  for (const entry of following) out.set(entry.key, moved.get(entry.date) ?? entry.date);
  return out;
}

/** Folge geändert: ab der neuen Folge fortlaufend neu verteilen; überzählige Termine fallen weg. */
export function renumberPlanGroup(
  series: Series,
  following: WatchPlanEntry[],
  startEpisodeId: number
): { assigned: { entry: WatchPlanEntry; ref: PlanEpisodeRef }[]; removed: WatchPlanEntry[] } {
  const episodes = scheduleEpisodes(series, startEpisodeId, 'series');
  const assigned = following
    .slice(0, episodes.length)
    .map((entry, i) => ({ entry, ref: episodes[i] }));
  return { assigned, removed: following.slice(episodes.length) };
}

/** Eintrag mit neuer Folge; Rewatch-Ziel neu aus dem aktuellen Zähler. */
export function withPlanEpisode(entry: WatchPlanEntry, ref: PlanEpisodeRef): WatchPlanEntry {
  if (entry.episodeId === ref.episode.id) return entry;
  return {
    ...entry,
    seasonNumber: ref.seasonNumber,
    episodeNumber: ref.episodeNumber,
    episodeId: ref.episode.id,
    watchTarget: episodeWatchCount(ref.episode) + 1,
  };
}
