import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { bookEntries, bookMatchKeys, mangaEntries, readingOverlap } from './readingOverlap';

const book = (overrides: Partial<Book>): Book => ({
  id: 'b1',
  title: 'Der Herr der Ringe',
  authors: ['J. R. R. Tolkien'],
  status: 'completed',
  currentPage: 0,
  addedAt: '2026-01-01',
  ...overrides,
});

const manga = (overrides: Partial<Manga>): Manga =>
  ({
    nmr: 1,
    anilistId: 30013,
    title: 'One Piece',
    poster: 'https://img/op.jpg',
    rating: {},
    currentChapter: 1,
    readStatus: 'reading',
    ...overrides,
  }) as Manga;

describe('bookMatchKeys', () => {
  it('liefert Titel+Autor normalisiert ohne Akzente und Satzzeichen', () => {
    const keys = bookMatchKeys(book({ title: 'Él Señor!', authors: ['Ana López'] }));
    expect(keys).toContain('ta:elsenor|analopez');
  });

  it('nimmt Titel+Autor nur mit Autor auf', () => {
    expect(bookMatchKeys(book({ authors: [] })).some((k) => k.startsWith('ta:'))).toBe(false);
  });
});

describe('mangaEntries', () => {
  it('liest die Bewertung des jeweiligen Nutzers und blendet versteckte aus', () => {
    const entries = mangaEntries(
      {
        a: manga({ rating: { u1: 8, u2: 3 } }),
        b: manga({ anilistId: 2, title: 'Versteckt', hidden: true }),
      },
      'u1'
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ id: '30013', rating: 8, cover: 'https://img/op.jpg' });
  });
});

describe('readingOverlap', () => {
  it('paart Manga über die AniList-ID', () => {
    const r = readingOverlap(
      mangaEntries({ a: manga({}) }, 'u1'),
      mangaEntries({ a: manga({}), b: manga({ anilistId: 5, title: 'Naruto' }) }, 'u2')
    );
    expect(r.pairs).toHaveLength(1);
    expect(r.score).toBe(50);
  });

  it('paart dasselbe Buch aus verschiedenen Quellen über Titel+Autor', () => {
    const r = readingOverlap(
      bookEntries({ x: book({ id: 'hc-1', hardcoverId: 1 }) }),
      bookEntries({ y: book({ id: 'ol-OL1W', olWorkId: 'OL1W', authors: ['J.R.R. Tolkien'] }) })
    );
    expect(r.pairs).toHaveLength(1);
    expect(r.pairs[0].user.id).toBe('hc-1');
    expect(r.pairs[0].friend.id).toBe('ol-OL1W');
  });

  it('paart über die ISBN, auch wenn Titel abweichen', () => {
    const r = readingOverlap(
      bookEntries({ x: book({ id: 'a', title: 'Dune', isbn13: '978-3-453-31720-6' }) }),
      bookEntries({ y: book({ id: 'b', title: 'Der Wüstenplanet', isbn13: '9783453317206' }) })
    );
    expect(r.pairs).toHaveLength(1);
  });

  it('verwendet einen Freundes-Titel höchstens einmal', () => {
    const r = readingOverlap(
      bookEntries({ x: book({ id: 'a' }), y: book({ id: 'b' }) }),
      bookEntries({ z: book({ id: 'c' }) })
    );
    expect(r.pairs).toHaveLength(1);
    expect(r.score).toBe(50);
  });

  it('ohne Titel auf beiden Seiten ist der Score 0', () => {
    expect(readingOverlap([], []).score).toBe(0);
  });
});
