import { describe, expect, it } from 'vitest';
import type { SeriesProgress } from '../books/bookSeries';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import {
  bookCatchUp,
  catchUpTotals,
  CHAPTER_MINUTES,
  mangaCatchUp,
  seriesCatchUp,
  sortCatchUp,
} from './catchUp';

const book = (o: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Der Hobbit',
  authors: ['Tolkien'],
  status: 'reading',
  currentPage: 100,
  pageCount: 400,
  addedAt: '2026-01-01T00:00:00Z',
  ...o,
});

const manga = (o: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Berserk',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 50,
  chapters: 100,
  readStatus: 'reading',
  ...o,
});

const series = (o: Partial<SeriesProgress> = {}): SeriesProgress => ({
  seriesId: 'Q1',
  seriesName: 'Mittelerde',
  author: 'Tolkien',
  next: {
    part: { wikidataId: 'Q2', title: 'Die Gefährten', position: 2 },
    state: 'available',
    daysUntil: null,
  },
  ownedCount: 1,
  total: 4,
  books: [book({ status: 'completed', pageCount: 200, completedAt: '2026-05-01T00:00:00Z' })],
  ...o,
});

describe('mangaCatchUp', () => {
  it('nimmt nur laufende Manga mit offenen Kapiteln', () => {
    const list = mangaCatchUp([
      manga(),
      manga({ anilistId: 2, currentChapter: 100 }),
      manga({ anilistId: 3, readStatus: 'planned' }),
      manga({ anilistId: 4, trackBy: 'volumes', currentVolume: 1, volumes: 5 }),
      manga({ anilistId: 5, chapters: 0 }),
    ]);
    expect(list.map((e) => e.key)).toEqual(['m-1']);
    const [entry] = list;
    expect(entry.kind === 'manga' && entry.open).toBe(50);
    expect(entry.openMinutes).toBe(50 * CHAPTER_MINUTES);
  });
});

describe('bookCatchUp', () => {
  it('nimmt angefangene Bücher mit bekannter Seitenzahl und Restzeit', () => {
    const list = bookCatchUp([
      book(),
      book({ id: 'b2', pageCount: undefined }),
      book({ id: 'b3', status: 'planned' }),
      book({ id: 'b4', currentPage: 400 }),
    ]);
    expect(list.map((e) => e.key)).toEqual(['b-b1']);
    const [entry] = list;
    expect(entry.kind === 'book' && entry.pagesLeft).toBe(300);
    expect(entry.kind === 'book' && entry.hoursLeft).toBe(7.5);
    expect(entry.progress).toBe(25);
  });
});

describe('seriesCatchUp', () => {
  it('zeigt nur erschienene nächste Bände', () => {
    const list = seriesCatchUp([
      series(),
      series({
        seriesId: 'Q9',
        next: {
          part: { wikidataId: 'Q10', title: 'Später', position: 3 },
          state: 'upcoming',
          daysUntil: 5,
        },
      }),
    ]);
    expect(list.map((e) => e.key)).toEqual(['s-Q1']);
    expect(list[0].title).toBe('Die Gefährten');
    expect(list[0].progress).toBe(25);
    expect(list[0].openMinutes).toBe(300);
  });
});

describe('sortCatchUp', () => {
  const entries = [
    ...mangaCatchUp([manga({ lastReadAt: '2026-10-10T00:00:00Z' })]),
    ...bookCatchUp([book({ lastReadAt: '2026-09-01T00:00:00Z' })]),
    ...seriesCatchUp([series()]),
  ];
  const keys = (list: { key: string }[]) => list.map((e) => e.key);

  it('vergleicht Kapitel und Seiten über die geschätzte Lesezeit', () => {
    expect(keys(sortCatchUp(entries, 'open'))).toEqual(['b-b1', 's-Q1', 'm-1']);
  });

  it('sortiert nach Fortschritt und nach längster Pause', () => {
    expect(keys(sortCatchUp(entries, 'progress'))).toEqual(['b-b1', 's-Q1', 'm-1']);
    expect(keys(sortCatchUp(entries, 'recent'))).toEqual(['s-Q1', 'b-b1', 'm-1']);
  });
});

describe('catchUpTotals', () => {
  it('zählt Kapitel und Seiten getrennt, Fortschritt gemischt', () => {
    const totals = catchUpTotals([...mangaCatchUp([manga()]), ...bookCatchUp([book()])]);
    expect(totals).toEqual({ titles: 2, chapters: 50, pages: 300, avgProgress: 37.5 });
  });

  it('liefert Nullen ohne Einträge', () => {
    expect(catchUpTotals([])).toEqual({ titles: 0, chapters: 0, pages: 0, avgProgress: 0 });
  });
});
