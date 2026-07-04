import { describe, expect, it } from 'vitest';
import { applyFilters, calculateProgress, calculatePublicRating } from './publicProfileHelpers';
import type { PublicItem } from './publicProfileHelpers';

// Hinweis: useResolvedTheme ist ein React-Hook (ruft useTheme) und wird hier
// bewusst NICHT getestet — das erfordert einen React-Renderer/Provider.

function makeItem(overrides: Partial<PublicItem> = {}): PublicItem {
  return {
    id: 1,
    title: 'Test',
    poster: '/p.jpg',
    rating: { u: 8 },
    ...overrides,
  } as PublicItem;
}

describe('calculatePublicRating', () => {
  it('ohne rating → "0.00"', () => {
    expect(calculatePublicRating(makeItem({ rating: 0 as unknown as PublicItem['rating'] }))).toBe(
      '0.00'
    );
  });

  it('mittelt positive Werte der Rating-Map', () => {
    expect(calculatePublicRating(makeItem({ rating: { a: 8, b: 6 } }))).toBe('7.00');
  });

  it('leere Map → "0.00"', () => {
    expect(calculatePublicRating(makeItem({ rating: {} }))).toBe('0.00');
  });
});

describe('calculateProgress', () => {
  it('ohne seasons → 0', () => {
    expect(calculateProgress(makeItem({ seasons: undefined }))).toBe(0);
  });

  it('Episoden ohne air_date zählen als ausgestrahlt', () => {
    const item = makeItem({
      seasons: [
        {
          episodes: [
            { id: 1, watched: true },
            { id: 2, watched: false },
          ],
        },
      ],
    });
    expect(calculateProgress(item)).toBe(50);
  });

  it('zukünftige Episoden mit air_date zählen nicht', () => {
    const item = makeItem({
      seasons: [
        {
          episodes: [
            { id: 1, air_date: '2000-01-01', watched: true },
            { id: 2, air_date: '2999-01-01', watched: false },
          ],
        },
      ],
    });
    expect(calculateProgress(item)).toBe(100);
  });

  it('episodes als Objekt-Map wird zu Werten normalisiert', () => {
    const item = makeItem({
      seasons: [
        {
          episodes: {
            a: { id: 1, watched: true },
            b: { id: 2, watched: true },
          } as unknown as PublicItem['seasons'],
        } as unknown as NonNullable<PublicItem['seasons']>[number],
      ],
    });
    expect(calculateProgress(item)).toBe(100);
  });
});

describe('applyFilters', () => {
  const items: PublicItem[] = [
    makeItem({
      id: 1,
      title: 'Breaking Bad',
      rating: { a: 9 },
      genres: ['Drama'],
      status: 'Ended',
    }),
    makeItem({ id: 2, title: 'The Office', rating: { a: 7 }, genres: ['Comedy'], status: 'Ended' }),
    makeItem({
      id: 3,
      title: 'Ongoing Show',
      rating: {},
      genres: ['Drama'],
      status: 'Returning Series',
    }),
  ];

  it('sortiert per Default nach rating-desc', () => {
    const result = applyFilters(items, {}, false);
    expect(result.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it('rating-asc kehrt die Reihenfolge um', () => {
    const result = applyFilters(items, { sortBy: 'rating-asc' }, false);
    expect(result[0].id).toBe(3);
  });

  it('Genre-Filter (CSV, ODER)', () => {
    const result = applyFilters(items, { genre: 'Drama' }, false);
    expect(result.map((i) => i.id).sort()).toEqual([1, 3]);
  });

  it('"All" als Genre deaktiviert den Filter', () => {
    expect(applyFilters(items, { genre: 'All' }, false)).toHaveLength(3);
  });

  it('Suche filtert nach Titel (case-insensitiv)', () => {
    const result = applyFilters(items, { search: 'office' }, false);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('quickFilter "unrated" liefert nur ungewertete Items', () => {
    const result = applyFilters(items, { quickFilter: 'unrated' }, false);
    expect(result.map((i) => i.id)).toEqual([3]);
  });

  it('quickFilter "ongoing" nutzt Status/Production', () => {
    const result = applyFilters(items, { quickFilter: 'ongoing' }, false);
    expect(result.map((i) => i.id)).toEqual([3]);
  });

  it('name-asc sortiert alphabetisch', () => {
    const result = applyFilters(items, { sortBy: 'name-asc' }, false);
    expect(result.map((i) => i.title)).toEqual(['Breaking Bad', 'Ongoing Show', 'The Office']);
  });
});
