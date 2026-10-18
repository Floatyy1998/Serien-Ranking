/** Gemischter Lese-Verlauf: Buch-Seiten (bookEvents) und Manga-Kapitel/-Bände, nach lokalem Tag. */

import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { BULK_PAGE_THRESHOLD, type CompactBookEvent } from '../books/bookEvents';
import {
  buildReadHistory,
  dayStart,
  type MangaReadEvent,
  type ReadHistoryEntry,
} from '../manga/readHistory';
import { t } from '../../services/i18n';

const DAY_MS = 86400000;

export interface BookHistoryEntry {
  kind: 'book';
  id: string;
  title: string;
  cover?: string;
  fromPage: number | null;
  toPage: number | null;
  /** Gelesene Seiten an diesem Tag, ohne nachgetragene Sprünge. */
  pages: number;
  /** Lesestand per großem Sprung nachgetragen — zählt nicht als gelesen. */
  imported: boolean;
  importedTo: number | null;
  finished: boolean;
  reread: boolean;
  lastAt: number;
}

export interface MangaHistoryEntry extends ReadHistoryEntry {
  kind: 'manga';
}

export type ReadingHistoryEntry = BookHistoryEntry | MangaHistoryEntry;

export interface ReadingHistoryDay {
  key: string;
  date: number;
  pages: number;
  chapters: number;
  volumes: number;
  entries: ReadingHistoryEntry[];
}

export interface ReadingHistory {
  days: ReadingHistoryDay[];
  totalPages: number;
  totalChapters: number;
  totalVolumes: number;
  activeDays: number;
  titleCount: number;
}

/** Jahre, deren Ereignisse der Zeitraum berührt (Jahreswechsel inklusive). */
export function historyYears(now: number, rangeDays: number): number[] {
  const last = new Date(now).getFullYear();
  const years: number[] = [];
  for (let y = new Date(now - rangeDays * DAY_MS).getFullYear(); y <= last; y++) years.push(y);
  return years;
}

const rangeStart = (now: number, rangeDays: number) => dayStart(now) - (rangeDays - 1) * DAY_MS;

export function buildBookHistory(
  events: CompactBookEvent[],
  books: Book[],
  now: number,
  rangeDays: number
): Map<number, BookHistoryEntry[]> {
  const cutoff = rangeStart(now, rangeDays);
  const byId = new Map(books.map((b) => [b.id, b]));
  const days = new Map<number, Map<string, BookHistoryEntry>>();

  const entryFor = (date: number, event: CompactBookEvent) => {
    let day = days.get(date);
    if (!day) {
      day = new Map();
      days.set(date, day);
    }
    let entry = day.get(event.s);
    if (!entry) {
      const book = byId.get(event.s);
      entry = {
        kind: 'book',
        id: event.s,
        title: book?.title || event.st || '',
        cover: book?.cover,
        fromPage: null,
        toPage: null,
        pages: 0,
        imported: false,
        importedTo: null,
        finished: false,
        reread: false,
        lastAt: 0,
      };
      day.set(event.s, entry);
    }
    return entry;
  };

  for (const event of events) {
    if (event.t !== 'pg' && event.t !== 'fin') continue;
    const at = event.ts * 1000;
    if (at < cutoff || at > now + 60000) continue;
    if (event.t === 'pg') {
      const n =
        event.n ?? (event.p !== undefined && event.p0 !== undefined ? event.p - event.p0 : 0);
      // Zurückblättern ist eine Korrektur, kein Lesen
      if (!(n > 0)) continue;
      const entry = entryFor(dayStart(at), event);
      if (n > BULK_PAGE_THRESHOLD) {
        entry.imported = true;
        if (event.p !== undefined) entry.importedTo = Math.max(entry.importedTo ?? 0, event.p);
      } else {
        entry.pages += n;
        if (event.p !== undefined) entry.toPage = Math.max(entry.toPage ?? 0, event.p);
        const from = event.p0 ?? (event.p !== undefined ? event.p - n : null);
        if (from !== null) {
          entry.fromPage = entry.fromPage === null ? from : Math.min(entry.fromPage, from);
        }
      }
      if (event.rr) entry.reread = true;
      entry.lastAt = Math.max(entry.lastAt, at);
    } else {
      const entry = entryFor(dayStart(at), event);
      entry.finished = true;
      if (event.rr) entry.reread = true;
      entry.lastAt = Math.max(entry.lastAt, at);
    }
  }

  return new Map([...days].map(([date, entries]) => [date, [...entries.values()]]));
}

interface ReadingHistoryInput {
  bookEvents: CompactBookEvent[];
  books: Book[];
  mangaEvents: MangaReadEvent[];
  manga: Manga[];
  now: number;
  rangeDays: number;
  showBooks: boolean;
  showManga: boolean;
}

export function buildReadingHistory({
  bookEvents,
  books,
  mangaEvents,
  manga,
  now,
  rangeDays,
  showBooks,
  showManga,
}: ReadingHistoryInput): ReadingHistory {
  const days = new Map<number, ReadingHistoryEntry[]>();
  const add = (date: number, entries: ReadingHistoryEntry[]) =>
    days.set(date, [...(days.get(date) ?? []), ...entries]);

  if (showManga) {
    for (const day of buildReadHistory(mangaEvents, manga, now, rangeDays).days) {
      add(
        day.date,
        day.entries.map((e) => ({ ...e, kind: 'manga' as const }))
      );
    }
  }
  if (showBooks) {
    for (const [date, entries] of buildBookHistory(bookEvents, books, now, rangeDays)) {
      add(date, entries);
    }
  }

  const result = [...days]
    .map(([date, entries]) => {
      const sorted = [...entries].sort((a, b) => b.lastAt - a.lastAt);
      let pages = 0;
      let chapters = 0;
      let volumes = 0;
      for (const e of sorted) {
        if (e.kind === 'book') pages += e.pages;
        else {
          chapters += e.chapters ?? 0;
          volumes += e.volumes ?? 0;
        }
      }
      return { key: String(date), date, pages, chapters, volumes, entries: sorted };
    })
    .sort((a, b) => b.date - a.date);

  const titles = new Set(
    result.flatMap((d) =>
      d.entries.map((e) => (e.kind === 'book' ? `b:${e.id}` : `m:${e.anilistId}`))
    )
  );
  return {
    days: result,
    totalPages: result.reduce((sum, d) => sum + d.pages, 0),
    totalChapters: result.reduce((sum, d) => sum + d.chapters, 0),
    totalVolumes: result.reduce((sum, d) => sum + d.volumes, 0),
    activeDays: result.length,
    titleCount: titles.size,
  };
}

/** „S. 120–150 (+30)", „Stand nachgetragen: S. 480" oder „Beendet". */
export function bookEntryLabel(entry: BookHistoryEntry): string {
  const parts: string[] = [];
  if (entry.pages > 0 && entry.toPage !== null && entry.fromPage !== null) {
    parts.push(t('S. {a}–{b} (+{n})', { a: entry.fromPage, b: entry.toPage, n: entry.pages }));
  } else if (entry.pages > 0) {
    parts.push(t('+{n} Seiten', { n: entry.pages }));
  } else if (entry.imported && entry.importedTo !== null) {
    parts.push(t('Stand nachgetragen: S. {n}', { n: entry.importedTo }));
  }
  if (entry.finished) parts.push(t('Beendet'));
  return parts.join(' · ');
}
