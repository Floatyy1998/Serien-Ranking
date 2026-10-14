import { describe, expect, it } from 'vitest';
import { forYouGenres, genreShelfOrder, pickedGenres } from './genrePrefs';

const ALL = ['fantasy', 'thriller', 'romance', 'scifi', 'ya', 'classics', 'horror', 'nonfiction'];
const SHELVES = ['fantasy', 'thriller', 'romance', 'scifi', 'ya', 'classics'];

describe('Lieblingsgenres', () => {
  it('ordnet die Wahl nach der festen Genre-Reihenfolge und verwirft Unbekanntes', () => {
    expect(pickedGenres(ALL, ['horror', 'romance', 'poetry'])).toEqual(['romance', 'horror']);
  });

  it('nimmt für „Für dich" die eigene Wahl vor dem Lesegeschmack, höchstens vier', () => {
    expect(forYouGenres([], ['scifi', 'fantasy', 'ya'])).toEqual(['scifi', 'fantasy']);
    expect(forYouGenres(['romance'], ['scifi'])).toEqual(['romance']);
    expect(forYouGenres(ALL, [])).toHaveLength(4);
  });

  it('stellt gewählte Regale nach vorn, auch Genres ohne festes Regal', () => {
    expect(genreShelfOrder(SHELVES, ['romance', 'horror'])).toEqual([
      'romance',
      'horror',
      'fantasy',
      'thriller',
      'scifi',
      'ya',
      'classics',
    ]);
    expect(genreShelfOrder(SHELVES, [])).toEqual(SHELVES);
  });
});
