import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { readingQuickStats } from './quickStats';

const book = (overrides: Partial<Book>): Book =>
  ({ id: 'b', title: 'B', authors: [], status: 'planned', currentPage: 0, ...overrides }) as Book;
const manga = (overrides: Partial<Manga>): Manga =>
  ({
    nmr: 1,
    anilistId: 1,
    title: 'M',
    poster: '',
    rating: {},
    currentChapter: 0,
    readStatus: 'planned',
    ...overrides,
  }) as Manga;

describe('readingQuickStats', () => {
  it('zählt Bücher und Manga zusammen', () => {
    const stats = readingQuickStats(
      [
        book({ status: 'reading', currentPage: 50, pageCount: 300 }),
        book({ status: 'completed', rating: 8 }),
      ],
      [
        manga({ readStatus: 'reading', currentChapter: 10, chapters: 20 }),
        manga({ readStatus: 'completed', rating: { u1: 9 } }),
      ],
      'u1'
    );
    expect(stats).toEqual({ reading: 2, titles: 4, rated: 2, finished: 2, open: 2 });
  });

  it('zählt fertig gelesene laufende Titel nicht als offen', () => {
    const stats = readingQuickStats(
      [book({ status: 'reading', currentPage: 300, pageCount: 300 })],
      [manga({ readStatus: 'reading', currentChapter: 20, chapters: 20 })],
      'u1'
    );
    expect(stats.open).toBe(0);
  });
});
