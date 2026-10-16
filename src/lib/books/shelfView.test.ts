import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import { bookGenres, collectGenres, matchesQuery, sortShelf } from './shelfView';

const book = (over: Partial<Book>): Book => ({
  id: over.title ?? 'x',
  title: 'X',
  authors: [],
  status: 'planned',
  currentPage: 0,
  addedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('shelfView', () => {
  it('nimmt das erste nicht-generische Genre-Segment', () => {
    expect(bookGenres(book({ categories: ['Fiction / Fantasy / Epic'] }))).toEqual(['Fantasy']);
    expect(bookGenres(book({ categories: ['Krimi', 'Krimi'] }))).toEqual(['Krimi']);
  });

  it('zählt Genres absteigend', () => {
    const list = [
      book({ categories: ['Krimi'] }),
      book({ categories: ['Krimi'] }),
      book({ categories: ['Fantasy'] }),
    ];
    expect(collectGenres(list)).toEqual([
      { name: 'Krimi', count: 2 },
      { name: 'Fantasy', count: 1 },
    ]);
  });

  it('sucht in Titel, Autor und Reihe, alle Wörter', () => {
    const b = book({ title: 'Der Hobbit', authors: ['J. R. R. Tolkien'] });
    expect(matchesQuery(b, 'tolkien hobbit')).toBe(true);
    expect(matchesQuery(b, 'tolkien herr')).toBe(false);
    expect(matchesQuery(b, '  ')).toBe(true);
  });

  it('sortiert Titel ohne Artikel, A–Z, und kehrt um', () => {
    const list = [
      book({ title: 'The Zebra' }),
      book({ title: 'Apfel' }),
      book({ title: 'Der Bär' }),
    ];
    expect(sortShelf(list, 'title', false).map((b) => b.title)).toEqual([
      'Apfel',
      'Der Bär',
      'The Zebra',
    ]);
    expect(sortShelf(list, 'title', true).map((b) => b.title)).toEqual([
      'The Zebra',
      'Der Bär',
      'Apfel',
    ]);
  });

  it('sortiert Bewertung und Zuletzt standardmäßig absteigend', () => {
    const list = [
      book({ title: 'a', rating: 5, addedAt: '2026-01-01' }),
      book({ title: 'b', rating: 9, addedAt: '2026-03-01' }),
    ];
    expect(sortShelf(list, 'rating', false)[0].title).toBe('b');
    expect(sortShelf(list, 'rating', true)[0].title).toBe('a');
    expect(sortShelf(list, 'recent', false)[0].title).toBe('b');
  });
});
