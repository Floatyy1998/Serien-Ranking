import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import {
  availableKinds,
  buildRatingItems,
  formatRating,
  rankRatingItems,
  ratingQueue,
  ratingSummary,
} from './readingRatings';

const book = (over: Partial<Book>): Book => ({
  id: 'b1',
  title: 'Buch',
  authors: [],
  status: 'reading',
  currentPage: 0,
  addedAt: '2026-01-01',
  ...over,
});

const manga = (over: Partial<Manga>): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Manga',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  ...over,
});

const items = buildRatingItems(
  [
    book({ id: 'a', title: 'Arena', rating: 9, status: 'completed' }),
    book({ id: 'c', title: 'Chronik', rating: 9, status: 'completed' }),
    book({ id: 'z', title: 'Zeit', rating: 0, currentPage: 60, pageCount: 100 }),
    book({ id: 'q', title: 'Quelle', rating: 0, currentPage: 10, pageCount: 100 }),
    book({
      id: 'f',
      title: 'Fertig',
      status: 'completed',
      completedAt: '2026-10-01T10:00:00Z',
    }),
  ],
  [
    manga({ anilistId: 1, title: 'Berserk', rating: { u1: 10 }, countryOfOrigin: 'JP' }),
    manga({ anilistId: 2, title: 'Solo Leveling', rating: { u2: 9 }, countryOfOrigin: 'KR' }),
    manga({ anilistId: 3, title: 'Blame', rating: { u1: 7.5 } }),
    manga({ anilistId: 4, title: 'One Piece', currentChapter: 120 }),
    manga({ anilistId: 5, title: 'Dandadan', currentChapter: 12 }),
    manga({
      anilistId: 6,
      title: 'Monster',
      readStatus: 'dropped',
      lastReadAt: '2026-09-01T10:00:00Z',
    }),
  ],
  'u1'
);

describe('buildRatingItems', () => {
  it('liest beide Bewertungen auf derselben Skala 0–10', () => {
    expect(items.slice(0, 1).map((i) => [i.title, i.rating, i.medium])).toEqual([
      ['Arena', 9, 'book'],
    ]);
    const solo = items.find((i) => i.title === 'Solo Leveling');
    expect([solo?.rating, solo?.medium]).toEqual([0, 'manhwa']);
  });
});

describe('rankRatingItems', () => {
  it('rankt nur Bewertete, Gleichstand teilt sich den Platz und steht nach Titel', () => {
    expect(rankRatingItems(items, null).map((i) => [i.title, i.place])).toEqual([
      ['Berserk', 1],
      ['Arena', 2],
      ['Chronik', 2],
      ['Blame', 4],
    ]);
  });

  it('filtert nach Medium und zählt die Plätze neu', () => {
    expect(rankRatingItems(items, 'manga').map((i) => [i.title, i.place])).toEqual([
      ['Berserk', 1],
      ['Blame', 2],
    ]);
    expect(rankRatingItems(items, 'book').map((i) => i.place)).toEqual([1, 1]);
  });
});

describe('ratingQueue', () => {
  it('nimmt beendete, abgebrochene und weit gelesene Unbewertete, zuletzt gelesene zuerst', () => {
    expect(ratingQueue(items, null).map((i) => i.title)).toEqual([
      'Fertig',
      'Monster',
      'Zeit',
      'One Piece',
    ]);
    expect(ratingQueue(items, 'book').map((i) => i.title)).toEqual(['Fertig', 'Zeit']);
  });
});

describe('availableKinds', () => {
  it('bietet Medien-Chips nur an, wenn Bücher und Manga da sind', () => {
    expect(availableKinds(items)).toEqual(['book', 'manga']);
    expect(availableKinds(items.filter((i) => i.kind === 'book'))).toEqual([]);
  });
});

describe('ratingSummary + formatRating', () => {
  it('rechnet den Schnitt über beide Medien und zeigt ihn einheitlich', () => {
    const { count, average } = ratingSummary(items);
    expect(count).toBe(4);
    expect(formatRating(average, 'de-DE', true)).toBe('8,9');
    expect(formatRating(10, 'de-DE')).toBe('10');
    expect(formatRating(8.5, 'de-DE')).toBe('8,5');
    expect(formatRating(9, 'de-DE', true)).toBe('9,0');
  });
});
