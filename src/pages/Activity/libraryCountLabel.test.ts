import { describe, expect, it } from 'vitest';
import { libraryCountLabel } from './libraryCountLabel';

const label = (...args: Parameters<typeof libraryCountLabel>) =>
  libraryCountLabel(...args).replace(/\u00a0/g, ' ');

describe('libraryCountLabel', () => {
  it('zählt alle vier Bereiche und lässt leere weg', () => {
    expect(label({ series: 24, movies: 0, manga: 3, books: 1 })).toBe(
      '24 Serien · 3 Manga · 1 Buch'
    );
    expect(label({ series: 1, movies: 2, manga: 1, books: 5 })).toBe(
      '1 Serie · 2 Filme · 1 Manga · 5 Bücher'
    );
  });

  it('bricht nur zwischen den Bereichen um', () => {
    expect(libraryCountLabel({ series: 0, movies: 0, manga: 12, books: 34 })).toBe(
      '12\u00a0Manga · 34\u00a0Bücher'
    );
  });

  it('bleibt leer ohne Bibliothek', () => {
    expect(libraryCountLabel({ series: 0, movies: 0, manga: 0, books: 0 })).toBe('');
  });
});
