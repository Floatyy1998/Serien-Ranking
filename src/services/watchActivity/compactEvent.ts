/**
 * Compact Event Format – kürzere Feldnamen für wrapped events.
 *
 * Spart ~50% Bytes pro Event ohne den Datenbank-Pfad zu ändern.
 * Reader (getYearlyActivity) expandiert kompakt zurück zum Full-Format,
 * damit alle bestehenden Stat-Funktionen unverändert arbeiten.
 *
 * Field Mapping:
 *   ts  ← timestamp (unix seconds statt ISO string, -75% Bytes)
 *   t   ← type ("ep" | "mv" | "mr" | "ch" | "rg")
 *   s   ← seriesId / movieId / mangaId
 *   st  ← seriesTitle / movieTitle / mangaTitle
 *   sn  ← seasonNumber
 *   ep  ← episodeNumber
 *   rt  ← episodeRuntime / runtime
 *   g   ← genres
 *   p   ← providers
 *   rw  ← isRewatch / isReread (0/1)
 *   bs  ← isBingeSession (0/1)
 *   bid ← bingeSessionId
 *   rat ← rating (manga_rating)
 *   ch  ← chapterNumber
 *   vol ← volumeNumber
 *   fmt ← format
 */

import type { ActivityEvent } from '../../types/WatchActivity';

const TYPE_SHORT_TO_FULL: Record<string, string> = {
  ep: 'episode_watch',
  mv: 'movie_watch',
  mr: 'movie_rating',
  ch: 'chapter_read',
  rg: 'manga_rating',
};

const TYPE_FULL_TO_SHORT: Record<string, string> = {
  episode_watch: 'ep',
  movie_watch: 'mv',
  movie_rating: 'mr',
  chapter_read: 'ch',
  manga_rating: 'rg',
};

interface CompactEvent {
  ts?: number;
  t?: string;
  s?: number;
  st?: string;
  sn?: number;
  ep?: number;
  rt?: number;
  g?: string[];
  p?: string[];
  rw?: number;
  bs?: number;
  bid?: string;
  rat?: number;
  ch?: number;
  vol?: number;
  fmt?: string;
}

/** Prüft ob ein Event im kompakten Format gespeichert ist. */
export function isCompactEvent(event: unknown): boolean {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;
  // Compact hat 'ts' (Number) statt 'timestamp' (String)
  return typeof e.ts === 'number' && typeof e.timestamp !== 'string';
}

/**
 * Komprimiert ein Full-Event zu Compact-Format.
 * Wird beim Schreiben verwendet.
 */
export function compactifyEvent(event: ActivityEvent): CompactEvent {
  const e = event as unknown as Record<string, unknown>;
  const ts = Math.floor(new Date(event.timestamp).getTime() / 1000);
  const compact: CompactEvent = {
    ts: isNaN(ts) ? Math.floor(Date.now() / 1000) : ts,
    t: TYPE_FULL_TO_SHORT[event.type] || event.type,
  };

  // Series/Movie/Manga ID
  const id = (e.seriesId || e.movieId || e.mangaId) as number | undefined;
  if (id != null) compact.s = id;

  // Title
  const title = (e.seriesTitle || e.movieTitle || e.mangaTitle) as string | undefined;
  if (title) compact.st = title;

  // Episode-spezifisch
  if (e.seasonNumber != null) compact.sn = e.seasonNumber as number;
  if (e.episodeNumber != null) compact.ep = e.episodeNumber as number;

  // Runtime
  const rt = (e.episodeRuntime || e.runtime) as number | undefined;
  if (rt != null && rt > 0) compact.rt = rt;

  // Genres / Providers
  if (Array.isArray(e.genres) && e.genres.length > 0) compact.g = e.genres as string[];
  if (Array.isArray(e.providers) && e.providers.length > 0) compact.p = e.providers as string[];

  // Rewatch / Reread
  if (e.isRewatch || e.isReread) compact.rw = 1;

  // Binge
  if (e.isBingeSession) compact.bs = 1;
  if (e.bingeSessionId) compact.bid = e.bingeSessionId as string;

  // Rating
  if (e.rating != null) compact.rat = e.rating as number;

  // Manga-spezifisch
  if (e.chapterNumber != null) compact.ch = e.chapterNumber as number;
  if (e.volumeNumber != null) compact.vol = e.volumeNumber as number;
  if (e.format) compact.fmt = e.format as string;

  return compact;
}

/**
 * Expandiert ein Compact-Event zurück zum Full-Format.
 * Wird beim Lesen verwendet, damit alle Stat-Funktionen unverändert arbeiten.
 */
export function expandCompactEvent(compact: CompactEvent): ActivityEvent {
  const ts = compact.ts || 0;
  const date = new Date(ts * 1000);
  const fullType = TYPE_SHORT_TO_FULL[compact.t || ''] || compact.t || 'episode_watch';

  const base: Record<string, unknown> = {
    timestamp: date.toISOString(),
    month: date.getMonth() + 1,
    dayOfWeek: date.getDay(),
    hour: date.getHours(),
    deviceType: 'desktop',
    type: fullType,
  };

  if (fullType === 'episode_watch') {
    if (compact.s != null) base.seriesId = compact.s;
    if (compact.st) base.seriesTitle = compact.st;
    if (compact.sn != null) base.seasonNumber = compact.sn;
    if (compact.ep != null) base.episodeNumber = compact.ep;
    if (compact.rt != null) base.episodeRuntime = compact.rt;
    base.isRewatch = compact.rw === 1;
    if (compact.bs === 1) base.isBingeSession = true;
    if (compact.bid) base.bingeSessionId = compact.bid;
  } else if (fullType === 'movie_watch' || fullType === 'movie_rating') {
    if (compact.s != null) base.movieId = compact.s;
    if (compact.st) base.movieTitle = compact.st;
    if (compact.rt != null) base.runtime = compact.rt;
    if (compact.rat != null) base.rating = compact.rat;
  } else if (fullType === 'chapter_read') {
    if (compact.s != null) base.mangaId = compact.s;
    if (compact.st) base.mangaTitle = compact.st;
    if (compact.ch != null) base.chapterNumber = compact.ch;
    if (compact.vol != null) base.volumeNumber = compact.vol;
    if (compact.fmt) base.format = compact.fmt;
    base.isReread = compact.rw === 1;
  } else if (fullType === 'manga_rating') {
    if (compact.s != null) base.mangaId = compact.s;
    if (compact.st) base.mangaTitle = compact.st;
    if (compact.rat != null) base.rating = compact.rat;
  }

  if (compact.g) base.genres = compact.g;
  if (compact.p) {
    base.providers = compact.p;
    base.provider = compact.p[0];
  }

  return base as unknown as ActivityEvent;
}

/**
 * Universeller Reader: nimmt ein Event in BELIEBIGEM Format (alt oder kompakt)
 * und gibt das Full-Format zurück. Wird in getYearlyActivity verwendet.
 */
export function readEventUniversal(raw: unknown): ActivityEvent {
  if (isCompactEvent(raw)) {
    return expandCompactEvent(raw as CompactEvent);
  }
  // Legacy-Format: einfach durchreichen (mit Hydration der temporalen Felder
  // falls vorhanden – die existierende Logik in shared.ts macht das bereits).
  return raw as ActivityEvent;
}
