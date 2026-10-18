import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import type { CompactBookEvent } from '../books/bookEvents';
import type { MangaReadEvent } from '../manga/readHistory';
import {
  bookEntryLabel,
  buildBookHistory,
  buildReadingHistory,
  historyYears,
  type BookHistoryEntry,
} from './readHistory';

const NOW = new Date(2026, 9, 7, 18, 0).getTime();
const at = (daysAgo: number, hour: number) =>
  Math.floor(new Date(2026, 9, 7 - daysAgo, hour, 0).getTime() / 1000);

const book = (over: Partial<Book>): Book => ({
  id: 'b1',
  title: 'Der Name des Windes',
  authors: [],
  status: 'reading',
  currentPage: 0,
  addedAt: '2026-01-01',
  ...over,
});

const manga = (over: Partial<Manga>): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Solo Leveling',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  ...over,
});

const pg = (s: string, p0: number, p: number, ts: number, extra: Partial<CompactBookEvent> = {}) =>
  ({ ts, t: 'pg', s, st: `Buch ${s}`, p0, p, n: p - p0, ...extra }) as CompactBookEvent;

const ch = (s: number, chapter: number, ts: number) =>
  ({ ts, t: 'ch', s, st: `Manga ${s}`, ch: chapter }) as MangaReadEvent;

const entryOf = (over: Partial<BookHistoryEntry>): BookHistoryEntry => ({
  kind: 'book',
  id: 'b1',
  title: 'x',
  fromPage: null,
  toPage: null,
  pages: 0,
  imported: false,
  importedTo: null,
  finished: false,
  reread: false,
  lastAt: 0,
  ...over,
});

describe('historyYears', () => {
  it('lädt bei 90 Tagen über den Jahreswechsel beide Jahre', () => {
    expect(historyYears(new Date(2027, 0, 20).getTime(), 90)).toEqual([2026, 2027]);
    expect(historyYears(new Date(2027, 0, 20).getTime(), 7)).toEqual([2027]);
  });
});

describe('buildBookHistory', () => {
  it('fasst Seiten pro Tag und Buch zu einer Spanne zusammen', () => {
    const days = buildBookHistory(
      [pg('b1', 120, 150, at(0, 9)), pg('b1', 150, 180, at(0, 17)), pg('b1', 100, 120, at(1, 9))],
      [book({ id: 'b1', cover: 'c.jpg' })],
      NOW,
      7
    );
    expect(days.size).toBe(2);
    const today = [...days.values()][0][0];
    expect(today).toMatchObject({
      title: 'Der Name des Windes',
      cover: 'c.jpg',
      fromPage: 120,
      toPage: 180,
      pages: 60,
    });
  });

  it('zählt große Sprünge als nachgetragenen Stand, nicht als gelesen', () => {
    const days = buildBookHistory([pg('b2', 0, 480, at(0, 9))], [], NOW, 7);
    const [entry] = [...days.values()][0];
    expect(entry).toMatchObject({ pages: 0, imported: true, importedTo: 480, title: 'Buch b2' });
    expect(bookEntryLabel(entry)).toBe('Stand nachgetragen: S. 480');
  });

  it('markiert beendete Bücher und ignoriert Zurückblättern und Ereignisse außerhalb', () => {
    const days = buildBookHistory(
      [
        { ts: at(0, 10), t: 'fin', s: 'b1', st: 'x' },
        pg('b1', 200, 150, at(0, 9)),
        pg('b1', 10, 20, at(9, 9)),
        { ts: at(0, 11), t: 'rg', s: 'b1', st: 'x', rat: 8 },
      ],
      [],
      NOW,
      7
    );
    expect(days.size).toBe(1);
    const [entry] = [...days.values()][0];
    expect(entry).toMatchObject({ finished: true, pages: 0 });
    expect(bookEntryLabel(entry)).toBe('Beendet');
  });
});

describe('bookEntryLabel', () => {
  it('zeigt Spanne und Seitenzahl, beendet dahinter', () => {
    expect(bookEntryLabel(entryOf({ fromPage: 120, toPage: 150, pages: 30 }))).toBe(
      'S. 120–150 (+30)'
    );
    expect(bookEntryLabel(entryOf({ fromPage: 300, toPage: 320, pages: 20, finished: true }))).toBe(
      'S. 300–320 (+20) · Beendet'
    );
  });
});

describe('buildReadingHistory', () => {
  const input = {
    bookEvents: [pg('b1', 10, 40, at(0, 9))],
    books: [book({ id: 'b1' })],
    mangaEvents: [ch(1, 5, at(0, 12)), ch(1, 6, at(0, 13)), ch(1, 7, at(2, 13))],
    manga: [manga({ anilistId: 1 })],
    now: NOW,
    rangeDays: 7,
  };

  it('mischt Bücher und Manga pro Tag, zuletzt Gelesenes zuerst', () => {
    const history = buildReadingHistory({ ...input, showBooks: true, showManga: true });
    expect(history.days).toHaveLength(2);
    const [today] = history.days;
    expect(today.entries.map((e) => e.kind)).toEqual(['manga', 'book']);
    expect(today).toMatchObject({ pages: 30, chapters: 2, volumes: 0 });
    expect(history).toMatchObject({
      totalPages: 30,
      totalChapters: 3,
      activeDays: 2,
      titleCount: 2,
    });
  });

  it('lässt nicht genutzte Lesebereiche weg', () => {
    const books = buildReadingHistory({ ...input, showBooks: true, showManga: false });
    expect(books.days).toHaveLength(1);
    expect(books.totalChapters).toBe(0);
    const mangaOnly = buildReadingHistory({ ...input, showBooks: false, showManga: true });
    expect(mangaOnly.totalPages).toBe(0);
    expect(mangaOnly.titleCount).toBe(1);
  });
});
