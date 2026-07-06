import { describe, expect, it } from 'vitest';
import type { Movie } from '../../types/Movie';
import { detectUnratedMovies, isMovieRated } from './unratedMoviesDetection';

const makeMovie = (overrides: Partial<Movie>): Movie => ({
  begründung: '',
  genre: { genres: [] },
  id: 1,
  imdb: { imdb_id: '' },
  poster: { poster: '' },
  rating: {},
  runtime: 120,
  title: 'Test Movie',
  wo: { wo: '' },
  ...overrides,
});

describe('isMovieRated', () => {
  it('is false without any positive genre value', () => {
    expect(isMovieRated(makeMovie({ rating: {} }))).toBe(false);
    expect(isMovieRated(makeMovie({ rating: { Action: 0 } }))).toBe(false);
  });

  it('is true when any genre value is positive', () => {
    expect(isMovieRated(makeMovie({ rating: { Action: 0, Drama: 8 } }))).toBe(true);
  });
});

describe('detectUnratedMovies', () => {
  it('returns watched-but-unrated movies', () => {
    const list = [
      makeMovie({ id: 1, watched: true, rating: {} }), // ✓ watched, unrated
      makeMovie({ id: 2, watched: true, rating: { Action: 7 } }), // rated → out
      makeMovie({ id: 3, watched: false, rating: {} }), // not watched → out
      makeMovie({ id: 4, rating: {} }), // watched undefined → out
    ];
    expect(detectUnratedMovies(list).map((m) => m.id)).toEqual([1]);
  });

  it('returns an empty array for an empty list', () => {
    expect(detectUnratedMovies([])).toEqual([]);
  });
});
