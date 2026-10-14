import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import { bookRatingStats, rankBooksByRating } from './bookRanking';

const book = (over: Partial<Book>): Book => ({
  id: 'b',
  title: 'Titel',
  authors: [],
  status: 'completed',
  currentPage: 0,
  addedAt: '2026-01-01T12:00:00.000Z',
  ...over,
});

describe('rankBooksByRating', () => {
  const books = [
    book({ id: 'a', title: 'Der Schwarm', authors: ['Frank Schätzing'], rating: 7 }),
    book({ id: 'b', title: 'Dune', authors: ['Frank Herbert'], rating: 9 }),
    book({ id: 'c', title: 'Tintenherz', authors: ['Cornelia Funke'] }),
    book({
      id: 'd',
      title: 'Momo',
      authors: ['Michael Ende'],
      rating: 7,
      completedAt: '2026-09-01T12:00:00.000Z',
    }),
  ];

  it('stellt bestbewertete nach vorn und bei Gleichstand die zuletzt gelesenen', () => {
    expect(rankBooksByRating(books).map((b) => b.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('sucht in Titel und Autor', () => {
    expect(rankBooksByRating(books, 'frank').map((b) => b.id)).toEqual(['b', 'a']);
    expect(rankBooksByRating(books, '  momo ').map((b) => b.id)).toEqual(['d']);
  });
});

describe('bookRatingStats', () => {
  it('zählt nur bewertete Bücher in den Schnitt', () => {
    expect(
      bookRatingStats([book({ rating: 8 }), book({ rating: 6 }), book({ rating: 0 }), book({})])
    ).toEqual({ count: 2, average: 7 });
    expect(bookRatingStats([])).toEqual({ count: 0, average: 0 });
  });
});
