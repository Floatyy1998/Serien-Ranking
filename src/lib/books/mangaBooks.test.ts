import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { booksFromManga, firstSourceBook, volumeSnapshot, withSourceBook } from './mangaBooks';

const book = (id: string, title: string, over: Partial<Book> = {}): Book => ({
  id,
  title,
  authors: ['Ryohgo Narita'],
  status: 'planned',
  currentPage: 0,
  pageCount: 192,
  addedAt: '2026-10-14T10:00:00.000Z',
  ...over,
});

const manga = (over: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 100868,
  title: 'Dead Mount Death Play',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  ...over,
});

describe('booksFromManga', () => {
  it('gibt umgezogene Bücher mit ihrem Stand zurück', () => {
    const moved = book('dnb-1', 'Dead Mount Death Play, Band 1', {
      status: 'reading',
      currentPage: 80,
      rating: 8,
    });
    expect(booksFromManga(manga({ fromBooks: { 'dnb-1': moved } }), new Set())).toEqual([moved]);
  });

  it('übernimmt im Manga abgehakte Bände als gelesen, ohne Datum', () => {
    const fromBooks = {
      'dnb-1': book('dnb-1', 'Dead Mount Death Play, Band 1', { wishedAt: '2026-10-01' }),
      'dnb-4': book('dnb-4', 'Dead Mount Death Play, Band 4'),
    };
    const [first, fourth] = booksFromManga(
      manga({ trackBy: 'volumes', currentVolume: 2, fromBooks }),
      new Set()
    );
    expect(first).toMatchObject({ status: 'completed', currentPage: 192 });
    expect(first).not.toHaveProperty('completedAt');
    expect(first).not.toHaveProperty('wishedAt');
    expect(fourth.status).toBe('planned');
  });

  it('lässt Bücher in Ruhe, die schon wieder in der Sammlung stehen', () => {
    const fromBooks = { 'dnb-1': book('dnb-1', 'Band 1') };
    expect(booksFromManga(manga({ fromBooks }), new Set(['dnb-1']))).toEqual([]);
    expect(booksFromManga(manga(), new Set())).toEqual([]);
  });
});

describe('volumeSnapshot', () => {
  it('legt einen gefundenen Band ohne leere Felder als geplantes Buch an', () => {
    const snap = volumeSnapshot(
      { id: 'dnb-2', title: 'Dead Mount Death Play, Band 2', authors: [], source: 'dnb' },
      '2026-10-14T10:00:00.000Z'
    );
    expect(snap).toMatchObject({ id: 'dnb-2', status: 'planned', currentPage: 0 });
    expect(Object.values(snap)).not.toContain(undefined);
  });
});

describe('Buch zum Anschauen', () => {
  it('nimmt den niedrigsten mitgenommenen Band, Bücher ohne Bandnummer zuletzt', () => {
    const m = manga({
      fromBooks: {
        b3: book('b3', 'Dead Mount Death Play, Band 3'),
        x: book('x', 'Dead Mount Death Play Artbook'),
        b2: book('b2', 'Dead Mount Death Play, Band 2'),
      },
    });
    expect(firstSourceBook(m)?.id).toBe('b2');
    expect(firstSourceBook(manga())).toBeNull();
  });
});

describe('angesehener Band zieht mit um', () => {
  it('nimmt den Band dazu und hakt ihn ab, wenn er im Manga schon gelesen war', () => {
    const m = manga({ trackBy: 'volumes', currentVolume: 2 });
    const moved = booksFromManga(
      withSourceBook(m, book('gb-1', 'Dead Mount Death Play 01')),
      new Set()
    );
    expect(moved).toHaveLength(1);
    expect(moved[0]).toMatchObject({ id: 'gb-1', status: 'completed' });
  });

  it('legt dieselbe Ausgabe nicht doppelt an', () => {
    const own = book('dnb-1', 'Dead Mount Death Play, Band 1', { isbn13: '978' });
    const m = manga({ fromBooks: { 'dnb-1': own } });
    expect(withSourceBook(m, book('gb-1', 'Dead Mount Death Play 01', { isbn13: '978' }))).toBe(m);
  });
});
