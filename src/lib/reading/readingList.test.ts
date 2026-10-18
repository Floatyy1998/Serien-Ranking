import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import {
  filterReadingList,
  parseReadingListFormat,
  parseReadingListSort,
  readingListEntries,
  readingListFormats,
} from './readingList';

const book = (o: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Der Hobbit',
  authors: ['J. R. R. Tolkien'],
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
  format: 'MANGA',
  ...o,
});

const formatOf = (m: Manga) => (m.countryOfOrigin === 'KR' ? 'MANHWA' : 'MANGA');

describe('readingListEntries', () => {
  it('nimmt nur Lesendes und Geplantes beider Medien', () => {
    const entries = readingListEntries(
      [book(), book({ id: 'b2', status: 'completed' }), book({ id: 'b3', status: 'planned' })],
      [manga(), manga({ anilistId: 2, readStatus: 'dropped' })],
      formatOf
    );
    expect(entries.map((e) => e.key)).toEqual(['b-b1', 'b-b3', 'm-1']);
    expect(entries.find((e) => e.key === 'b-b3')?.planned).toBe(true);
    expect(entries.find((e) => e.key === 'b-b1')?.progress).toBe(25);
    expect(entries.find((e) => e.key === 'm-1')?.progress).toBe(50);
  });
});

describe('filterReadingList', () => {
  const entries = readingListEntries(
    [
      book({ id: 'b1', title: 'Der Hobbit', lastReadAt: '2026-10-01T00:00:00Z' }),
      book({ id: 'b2', title: 'Momo', authors: ['Michael Ende'], currentPage: 300 }),
    ],
    [
      manga({ anilistId: 1, title: 'Berserk', lastReadAt: '2026-10-10T00:00:00Z' }),
      manga({ anilistId: 2, title: 'Solo Leveling', countryOfOrigin: 'KR', currentChapter: 10 }),
    ],
    formatOf
  );
  const keys = (list: { key: string }[]) => list.map((e) => e.key);

  it('mischt beide Medien beim Sortieren nach zuletzt gelesen', () => {
    expect(
      keys(filterReadingList(entries, { query: '', format: 'all', sort: 'recent-desc' }))
    ).toEqual(['m-1', 'b-b1', 'b-b2', 'm-2']);
  });

  it('sortiert nach Fortschritt und Name', () => {
    expect(
      keys(filterReadingList(entries, { query: '', format: 'all', sort: 'progress-desc' }))
    ).toEqual(['b-b2', 'm-1', 'b-b1', 'm-2']);
    expect(
      keys(filterReadingList(entries, { query: '', format: 'all', sort: 'name-asc' }))
    ).toEqual(['m-1', 'b-b1', 'b-b2', 'm-2']);
  });

  it('filtert nach Medium und Manga-Format', () => {
    expect(
      keys(filterReadingList(entries, { query: '', format: 'books', sort: 'name-asc' }))
    ).toEqual(['b-b1', 'b-b2']);
    expect(
      keys(filterReadingList(entries, { query: '', format: 'MANHWA', sort: 'name-asc' }))
    ).toEqual(['m-2']);
  });

  it('sucht in Titel und Autor', () => {
    expect(
      keys(filterReadingList(entries, { query: 'ende', format: 'all', sort: 'name-asc' }))
    ).toEqual(['b-b2']);
    expect(
      keys(filterReadingList(entries, { query: 'BERS', format: 'all', sort: 'name-asc' }))
    ).toEqual(['m-1']);
  });
});

describe('readingListFormats', () => {
  it('bietet Bücher nur bei beiden Medien an', () => {
    expect(readingListFormats(true, true)).toEqual(['all', 'books', 'MANGA', 'MANHWA', 'MANHUA']);
    expect(readingListFormats(false, true)).toEqual(['all', 'MANGA', 'MANHWA', 'MANHUA']);
    expect(readingListFormats(true, false)).toEqual([]);
  });
});

describe('parse', () => {
  it('lässt nur bekannte Werte durch', () => {
    expect(parseReadingListSort('progress-asc')).toBe('progress-asc');
    expect(parseReadingListSort('kaputt')).toBeNull();
    expect(parseReadingListFormat('MANHUA')).toBe('MANHUA');
    expect(parseReadingListFormat(null)).toBeNull();
  });
});
