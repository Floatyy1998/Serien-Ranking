/** Eigener Schau-Plan (users/$uid/watchPlan): Parsen, Gruppieren, Auflösen gegen die eigene Liste. */

import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { isMovieWatched } from '../rating/rating';
import { isEpisodeWatched, normalizeEpisodes, normalizeSeasons } from '../episode/seriesMetrics';

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
  createdAt: number;
}

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
  return { entry, series, episode, done: episode ? isEpisodeWatched(episode.episode) : false };
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
