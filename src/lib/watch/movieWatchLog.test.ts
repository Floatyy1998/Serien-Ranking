import { describe, expect, it } from 'vitest';
import { shouldLogMovieWatch, wasMovieWatched } from './movieWatchLog';

const NOW = new Date(2026, 9, 7);

describe('shouldLogMovieWatch', () => {
  it('loggt das erste Sehen', () => {
    expect(shouldLogMovieWatch(null, NOW)).toBe(true);
    expect(shouldLogMovieWatch({}, NOW)).toBe(true);
    expect(shouldLogMovieWatch({ watched: false, rating: {} }, NOW)).toBe(true);
  });

  it('loggt erneut, wenn der Film in diesem Jahr gesehen wurde (Bewertung nachtragen)', () => {
    expect(shouldLogMovieWatch({ watched: true, watchedAt: '2026-03-01T10:00:00Z' }, NOW)).toBe(
      true
    );
  });

  it('loggt nicht, wenn der Film in einem früheren Jahr gesehen wurde', () => {
    expect(shouldLogMovieWatch({ watched: true, watchedAt: '2025-12-01T10:00:00Z' }, NOW)).toBe(
      false
    );
  });

  it('loggt alte, nur bewertete Filme ohne Datum nicht als neu', () => {
    expect(shouldLogMovieWatch({ rating: { Action: 8 } }, NOW)).toBe(false);
    expect(wasMovieWatched({ rating: { Action: 8 } })).toBe(true);
  });
});
