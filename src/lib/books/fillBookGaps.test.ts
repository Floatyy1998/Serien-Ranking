import { describe, expect, it } from 'vitest';
import { fillBookGaps } from './bookSearchMapping';
import type { BookSearchResult } from '../../types/Book';

const preview: BookSearchResult = {
  id: 'dnb-9783551630292',
  title: 'Marry my husband 5',
  authors: [],
  cover: 'https://serienapi.konrad-dinges.de/bookcover/book/dnb-9783551630292-L.jpg',
  source: 'dnb',
};

describe('fillBookGaps', () => {
  it('füllt fehlende und leere Felder, ohne vorhandene zu überschreiben', () => {
    const filled = fillBookGaps(preview, {
      title: 'Anderer Titel',
      authors: ['Studio LICO', 'Sung Sojak'],
      cover: 'https://example.org/other.jpg',
      pageCount: 258,
      publisher: 'C Lines',
      categories: ['Comics'],
      description: undefined,
    });
    expect(filled).toEqual({
      ...preview,
      authors: ['Studio LICO', 'Sung Sojak'],
      pageCount: 258,
      publisher: 'C Lines',
      categories: ['Comics'],
    });
  });

  it('lässt den Datensatz ohne zweite Quelle unverändert', () => {
    expect(fillBookGaps(preview, null)).toBe(preview);
    expect(fillBookGaps(preview, undefined)).toBe(preview);
  });
});
