import { describe, expect, it } from 'vitest';
import type { Book, BookSearchResult, BookSeriesPart } from '../../types/Book';
import { seriesBulkBooks, seriesBulkSelection } from './seriesBulk';

const KEY = 'dnb:Perry Rhodan-Silberband';

const part = (position: number, extra: Partial<BookSeriesPart> = {}): BookSeriesPart => ({
  wikidataId: `dnb-97838453512${String(position).padStart(2, '0')}`,
  title: `Perry Rhodan ${position}`,
  position,
  result: {
    id: `dnb-97838453512${String(position).padStart(2, '0')}`,
    title: `Perry Rhodan ${position}`,
    authors: ['Perry Rhodan'],
    pageCount: 400,
    isbn13: `97838453512${String(position).padStart(2, '0')}`,
    source: 'dnb',
  },
  ...extra,
});

const owned = (position: number, status: Book['status']): Book => ({
  id: `own-${position}`,
  title: `Perry Rhodan ${position}`,
  authors: ['Perry Rhodan'],
  status,
  currentPage: 0,
  addedAt: '2026-01-01T00:00:00.000Z',
  series: { name: 'Perry Rhodan-Silberband', position, wikidataId: KEY },
});

describe('seriesBulkSelection', () => {
  const parts = [
    part(3),
    part(1),
    part(2),
    part(4, { publishedDate: '2027-02-01' }),
    { wikidataId: 'Q5', title: 'Band ohne Daten', position: 5 },
  ];

  it('nimmt fehlende, erschienene Bände in Reihenfolge', () => {
    const selection = seriesBulkSelection(parts, KEY, [owned(2, 'completed')], {}, '2026-11-09');
    expect(selection.candidates.map((c) => c.position)).toEqual([1, 3]);
    expect(selection.upcoming).toBe(1);
    expect(selection.unresolved).toBe(1);
  });

  it('nutzt nachgeschlagene Treffer für Bände ohne eigene Daten', () => {
    const found = {
      Q5: { id: 'hc-5', title: 'Band ohne Daten', authors: [], source: 'hardcover' as const },
    };
    const selection = seriesBulkSelection(parts, KEY, [], found, '2026-11-09');
    expect(selection.candidates.map((c) => c.position)).toEqual([1, 2, 3, 5]);
    expect(selection.unresolved).toBe(0);
  });

  it('merkt sich eigene Bände auf der Leseliste', () => {
    const selection = seriesBulkSelection(parts, KEY, [owned(3, 'planned')], {}, '2026-11-09');
    expect(selection.plannedOwned.map((p) => p.position)).toEqual([3]);
    expect(selection.candidates.map((c) => c.position)).toEqual([1, 2]);
  });
});

describe('seriesBulkBooks', () => {
  const candidates = [1, 2, 3].map((position) => ({
    position,
    result: part(position).result as BookSearchResult,
  }));
  const books = seriesBulkBooks(
    candidates,
    { id: KEY, name: 'Perry Rhodan-Silberband' },
    2,
    '2026-11-09T10:00:00.000Z'
  );

  it('markiert bis zum Band als früher gelesen, ohne Datum', () => {
    expect(books.map((b) => b.status)).toEqual(['completed', 'completed', 'planned']);
    expect(books[0].completedAt).toBeUndefined();
    expect(books[0].startedAt).toBeUndefined();
    expect(books[0].currentPage).toBe(400);
    expect(books[2].currentPage).toBe(0);
  });

  it('trägt Reihen-Schlüssel und Band der Leiste', () => {
    expect(books[1].series).toEqual({
      name: 'Perry Rhodan-Silberband',
      position: 2,
      wikidataId: KEY,
    });
  });
});
