import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookSeriesPart } from '../../types/Book';

const { loadBookCatalogIndex, loadBookCatalogItem } = vi.hoisted(() => ({
  loadBookCatalogIndex: vi.fn(),
  loadBookCatalogItem: vi.fn(),
}));

vi.mock('./bookCatalog', () => ({
  bookCatalogVersion: vi.fn(async () => 1),
  loadBookCatalogIndex,
  loadBookCatalogItem,
}));

import { withCatalogEditions } from './bookSeriesCatalog';

const KEY = 'hc:Solo Leveling (Novel)';

const part = (position: number, id: string, title: string, isbn13: string): BookSeriesPart => ({
  wikidataId: id,
  title,
  position,
  publishedDate: '2022-01-01',
  result: {
    id,
    title,
    authors: ['Chugong'],
    isbn13,
    hardcoverId: Number(id.slice(3)),
    source: 'hardcover',
    series: { name: 'Solo Leveling (Novel)', position, wikidataId: KEY },
  },
});

const parts = [
  part(4, 'hc-893196', 'Solo Leveling Roman 04 mit Box', '9783753904764'),
  part(5, 'hc-893204', 'Solo Leveling (Novel), Vol. 5', '9781975319366'),
];

describe('withCatalogEditions', () => {
  beforeEach(() => {
    loadBookCatalogIndex.mockReset();
    loadBookCatalogItem.mockReset();
  });

  it('ersetzt den englischen Band durch die deutsche Ausgabe aus dem Katalog', async () => {
    loadBookCatalogIndex.mockResolvedValue({
      v: 1,
      items: [
        { id: 'gb-CdqvzgEACAAJ', t: 'Solo Leveling Roman 05', i: '9783963587528', h: 893204, v: 7 },
      ],
    });
    loadBookCatalogItem.mockResolvedValue({
      id: 'gb-CdqvzgEACAAJ',
      title: 'Solo Leveling Roman 05',
      authors: ['Chugong'],
      isbn13: '9783963587528',
      hardcoverId: 893204,
      language: 'de',
      source: 'google',
    });
    const [four, five] = await withCatalogEditions(KEY, parts, 'de');
    expect(four).toBe(parts[0]);
    expect(loadBookCatalogItem).toHaveBeenCalledWith('gb-CdqvzgEACAAJ', 7);
    expect(five).toMatchObject({
      wikidataId: 'gb-CdqvzgEACAAJ',
      title: 'Solo Leveling Roman 05',
      position: 5,
      publishedDate: '2022-01-01',
      result: {
        id: 'gb-CdqvzgEACAAJ',
        isbn13: '9783963587528',
        series: { name: 'Solo Leveling (Novel)', position: 5, wikidataId: KEY },
      },
    });
  });

  it('lässt die Liste, wie sie ist, wenn der Katalog nichts kennt oder nicht lädt', async () => {
    loadBookCatalogIndex.mockResolvedValue({ v: 1, items: [] });
    expect(await withCatalogEditions(KEY, parts, 'de')).toBe(parts);
    loadBookCatalogIndex.mockRejectedValue(new Error('offline'));
    expect(await withCatalogEditions(KEY, parts, 'de')).toBe(parts);
    expect(loadBookCatalogItem).not.toHaveBeenCalled();
  });

  it('fragt den Katalog gar nicht, wenn alle Bände in der Sprache vorliegen', async () => {
    expect(await withCatalogEditions(KEY, [parts[0]], 'de')).toEqual([parts[0]]);
    expect(loadBookCatalogIndex).not.toHaveBeenCalled();
  });
});
