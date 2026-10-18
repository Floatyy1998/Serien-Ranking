import { describe, expect, it } from 'vitest';
import type { CompactBookEvent } from '../books/bookEvents';
import type { RawChapterEvent } from '../manga/chapterOperations';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import {
  bookGenreKeys,
  computeReadingYearStats,
  daysElapsedInYear,
  mangaGenreKeys,
  mangaYearActivity,
  rankReadingGenres,
  statusCounts,
  streakFromDays,
  tally,
  topMangaByProgress,
} from './readingStats';

const ts = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

const book = (over: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Buch',
  authors: ['Autorin'],
  status: 'reading',
  currentPage: 0,
  addedAt: '2026-01-01T10:00:00',
  ...over,
});

const manga = (over: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Manga',
  poster: '',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  ...over,
});

const ch = (iso: string, s: number, n: number, chapter = n): RawChapterEvent => ({
  ts: ts(iso),
  t: 'ch',
  s,
  ch: chapter,
  ch0: chapter - n + 1,
  n,
});

const pg = (iso: string, s: string, n: number): CompactBookEvent => ({
  ts: ts(iso),
  t: 'pg',
  s,
  st: 'Buch',
  n,
});

describe('tally', () => {
  it('zählt absteigend und lässt Leeres weg', () => {
    expect(tally(['b', 'a', 'b', undefined, '', 'c'], 2)).toEqual([
      { key: 'b', count: 2 },
      { key: 'a', count: 1 },
    ]);
  });
});

describe('daysElapsedInYear', () => {
  it('zählt im laufenden Jahr bis heute, sonst das ganze Jahr', () => {
    const now = new Date(2026, 0, 11, 12).getTime();
    expect(daysElapsedInYear(2026, now)).toBe(11);
    expect(daysElapsedInYear(2025, now)).toBe(365);
  });
});

describe('streakFromDays', () => {
  it('zählt bis gestern, wenn heute noch nichts gelesen wurde', () => {
    const now = new Date(2026, 9, 18, 9).getTime();
    expect(streakFromDays(new Set(['2026-10-17', '2026-10-16', '2026-10-14']), now)).toBe(2);
    expect(streakFromDays(new Set(['2026-10-15']), now)).toBe(0);
  });
});

describe('mangaYearActivity', () => {
  it('summiert Kapitel und Bände je Monat und lässt nachgetragene Sprünge weg', () => {
    const events: RawChapterEvent[] = [
      ch('2026-02-03T10:00:00', 1, 3),
      ch('2026-02-04T10:00:00', 1, 120, 200),
      ch('2025-12-31T10:00:00', 2, 4),
      { ts: ts('2026-05-01T10:00:00'), t: 'vol', s: 3, vol: 2, v0: 1, n: 2 },
    ];
    const a = mangaYearActivity(events, 2026);
    expect(a.chapters).toBe(3);
    expect(a.chaptersByMonth[1]).toBe(3);
    expect(a.volumes).toBe(2);
    expect(a.volumesByMonth[4]).toBe(2);
    expect([...a.readIds].sort()).toEqual([1, 3]);
    expect(a.days.size).toBe(2);
  });
});

describe('Genres', () => {
  it('führt Buch-Kategorien und Manga-Genres auf gemeinsame Genres zusammen', () => {
    expect(bookGenreKeys(book({ categories: ['Fiction / Fantasy / Epic'] }))).toEqual(['fantasy']);
    expect(bookGenreKeys(book({ categories: ['Fiction / Poetry'] }))).toEqual(['book:Poetry']);
    expect(mangaGenreKeys(manga({ genres: ['Fantasy', 'Action', 'Mystery', 'Fantasy'] }))).toEqual([
      'fantasy',
      'anilist:Action',
      'thriller',
    ]);
    expect(
      rankReadingGenres(
        [book({ categories: ['Fantasy'] }), book({ id: 'b2', categories: ['Thriller'] })],
        [manga({ genres: ['Fantasy', 'Action'] })]
      )
    ).toEqual([
      { key: 'fantasy', count: 2 },
      { key: 'anilist:Action', count: 1 },
      { key: 'thriller', count: 1 },
    ]);
  });
});

describe('statusCounts', () => {
  it('zählt Bücher und Manga gemeinsam', () => {
    const counts = statusCounts(
      [book(), book({ status: 'completed' })],
      [manga({ readStatus: 'completed' }), manga({ readStatus: 'dropped' })]
    );
    expect(counts).toEqual({ reading: 1, planned: 0, completed: 2, paused: 0, dropped: 1 });
  });
});

describe('computeReadingYearStats', () => {
  const now = new Date(2026, 9, 18, 9).getTime();
  const finishedBook = book({
    status: 'completed',
    completedAt: '2026-03-10T10:00:00',
    rating: 8,
    categories: ['Fantasy'],
  });
  const done = manga({
    anilistId: 7,
    readStatus: 'completed',
    completedAt: '2026-03-20T10:00:00',
    rating: { u1: 6 },
    genres: ['Romance'],
  });
  const other = manga({ anilistId: 8, genres: ['Action'], currentChapter: 40 });

  const stats = computeReadingYearStats(
    {
      books: [finishedBook, book({ id: 'b9', categories: ['Horror'] })],
      bookEvents: [pg('2026-10-17T20:00:00', 'b1', 30), pg('2026-10-16T20:00:00', 'b1', 20)],
      manga: [done, other],
      mangaEvents: [ch('2026-10-18T08:00:00', 8, 5, 40), ch('2026-10-16T21:00:00', 8, 2, 35)],
      uid: 'u1',
      year: 2026,
      now,
    },
    {
      pagesRead: 50,
      finishedByMonth: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      finishedBooks: [finishedBook],
    }
  );

  it('vereinigt Lesetage und Serie über beide Medien', () => {
    expect(stats.activeDays).toBe(3);
    expect(stats.streak).toBe(3);
  });

  it('zählt Beendetes, Kapitel und die gemeinsame Bewertung', () => {
    expect(stats.booksFinished).toBe(1);
    expect(stats.mangaFinished).toBe(1);
    expect(stats.finishedMangaByMonth[2]).toBe(1);
    expect(stats.chaptersRead).toBe(7);
    expect(stats.chaptersByMonth[9]).toBe(7);
    expect(stats.avgRating).toBe(7);
    expect(stats.ratedCount).toBe(2);
  });

  it('nimmt für Genres nur, was im Jahr gelesen wurde', () => {
    expect(stats.booksRead.map((b) => b.id)).toEqual(['b1']);
    expect(stats.mangaRead.map((m) => m.anilistId)).toEqual([7, 8]);
    expect(stats.topGenres.map((g) => g.key)).toEqual(['anilist:Action', 'fantasy', 'romance']);
  });

  it('hat in vergangenen Jahren keine Serie', () => {
    const past = computeReadingYearStats(
      { books: [], bookEvents: [], manga: [], mangaEvents: [], year: 2025, now },
      { pagesRead: 0, finishedByMonth: new Array(12).fill(0), finishedBooks: [] }
    );
    expect(past.streak).toBe(0);
    expect(past.avgRating).toBeNull();
  });
});

describe('topMangaByProgress', () => {
  it('sortiert nach Lesestand, Bände zählen wie neun Kapitel', () => {
    const list = [
      manga({ anilistId: 1, title: 'A', currentChapter: 30 }),
      manga({ anilistId: 2, title: 'B', trackBy: 'volumes', currentVolume: 4 }),
      manga({ anilistId: 3, title: 'C' }),
    ];
    expect(topMangaByProgress(list).map((m) => m.anilistId)).toEqual([2, 1]);
  });
});
