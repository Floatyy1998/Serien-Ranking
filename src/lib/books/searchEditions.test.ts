import { describe, expect, it } from 'vitest';
import type { BookSearchResult } from '../../types/Book';
import { isSameBook, mergeEditions, orderSeriesVolumes } from './searchEditions';

const hit = (over: Partial<BookSearchResult>): BookSearchResult => ({
  id: over.id ?? over.title ?? 'x',
  title: 'Titel',
  authors: [],
  source: 'google',
  ...over,
});

const german = (n: number) =>
  hit({ id: `de-${n}`, title: `Not-Sew-Wicked Stepmom ${n}`, authors: ['Iru'], language: 'de' });
const english = (n: number) =>
  hit({
    id: `en-${n}`,
    title: `Not-Sew-Wicked Stepmom, Vol. ${n}`,
    language: 'en',
    cover: `https://covers.example/${n}.jpg`,
    description: 'Yen Press',
  });

describe('isSameBook', () => {
  it('erkennt Ausgaben über Bandschreibweise und fehlenden Autor hinweg', () => {
    expect(isSameBook(german(8), english(8))).toBe(true);
    expect(isSameBook(german(8), english(7))).toBe(false);
  });

  it('hält gleichnamige Bücher verschiedener Autoren auseinander', () => {
    expect(
      isSameBook(
        hit({ title: 'Dune', authors: ['Frank Herbert'] }),
        hit({ title: 'Dune', authors: ['Brian Herbert Smith'] })
      )
    ).toBe(false);
  });
});

describe('mergeEditions', () => {
  it('fasst deutsche und englische Ausgabe zusammen — die deutsche mit dem englischen Cover', () => {
    const merged = mergeEditions([german(8), english(8), german(7), english(7)], 'de');
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      id: 'de-8',
      title: 'Not-Sew-Wicked Stepmom 8',
      authors: ['Iru'],
      cover: 'https://covers.example/8.jpg',
    });
  });

  it('nimmt ohne passende Sprache die reichhaltigere Ausgabe', () => {
    const [only] = mergeEditions([german(3), english(3)], 'fr');
    expect(only.id).toBe('en-3');
    expect(only.authors).toEqual(['Iru']);
  });

  it('lässt keine undefined-Felder zurück', () => {
    const [only] = mergeEditions(
      [german(2), hit({ id: 'x', title: 'Not-Sew-Wicked Stepmom 2' })],
      'de'
    );
    expect(Object.values(only).includes(undefined)).toBe(false);
  });
});

describe('orderSeriesVolumes', () => {
  it('stellt die Bände einer Reihe aufsteigend an die Stelle des besten Bands', () => {
    const solo = hit({ id: 'solo', title: 'Prayer and action' });
    const ordered = orderSeriesVolumes([german(8), solo, german(2), german(10), german(1)]);
    expect(ordered.map((r) => r.id)).toEqual(['de-1', 'de-2', 'de-8', 'de-10', 'solo']);
  });

  it('lässt Titel mit Zahl ohne Reihe in Ruhe', () => {
    const books = [hit({ id: 'a', title: '1984' }), hit({ id: 'b', title: 'Fahrenheit 451' })];
    expect(orderSeriesVolumes(books).map((r) => r.id)).toEqual(['a', 'b']);
  });
});
