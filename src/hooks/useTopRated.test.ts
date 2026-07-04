// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';

const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  movieList: [] as Movie[],
}));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.seriesList }),
}));
vi.mock('../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));

import { useTopRated } from './useTopRated';

function makeSeries(id: number, rating: number, extra: Record<string, unknown> = {}): Series {
  return {
    id,
    title: `Series ${id}`,
    poster: `/s${id}.jpg`,
    rating: rating > 0 ? { u1: rating } : {},
    genre: { genres: ['Drama', 'Action', 'all'] },
    first_air_date: '2020-03-15',
    ...extra,
  } as unknown as Series;
}

function makeMovie(id: number, rating: number, extra: Record<string, unknown> = {}): Movie {
  return {
    id,
    title: `Movie ${id}`,
    poster: `/m${id}.jpg`,
    rating: rating > 0 ? { u1: rating } : {},
    genre: { genres: ['Comedy'] },
    release_date: '2019-07-01',
    ...extra,
  } as unknown as Movie;
}

beforeEach(() => {
  ctx.seriesList = [];
  ctx.movieList = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTopRated', () => {
  it('returns an empty array when nothing is rated', () => {
    ctx.seriesList = [makeSeries(1, 0)];
    ctx.movieList = [makeMovie(2, 0)];
    const { result } = renderHook(() => useTopRated());
    expect(result.current).toEqual([]);
  });

  it('sorts combined series+movies by rating descending', () => {
    ctx.seriesList = [makeSeries(1, 6), makeSeries(2, 9)];
    ctx.movieList = [makeMovie(3, 8), makeMovie(4, 7)];
    const { result } = renderHook(() => useTopRated());
    expect(result.current.map((i) => i.id)).toEqual([2, 3, 4, 1]);
    expect(result.current.map((i) => i.rating)).toEqual([9, 8, 7, 6]);
  });

  it('excludes unrated items (overall rating 0)', () => {
    ctx.seriesList = [makeSeries(1, 8), makeSeries(2, 0)];
    const { result } = renderHook(() => useTopRated());
    expect(result.current.map((i) => i.id)).toEqual([1]);
  });

  it('caps each media type at 10 items (max 20 combined)', () => {
    ctx.seriesList = Array.from({ length: 15 }, (_, i) => makeSeries(i + 1, 5 + (i % 5)));
    ctx.movieList = Array.from({ length: 15 }, (_, i) => makeMovie(100 + i, 5 + (i % 5)));
    const { result } = renderHook(() => useTopRated());
    expect(result.current.length).toBeLessThanOrEqual(20);
    const series = result.current.filter((i) => i.type === 'series');
    const movies = result.current.filter((i) => i.type === 'movie');
    expect(series.length).toBeLessThanOrEqual(10);
    expect(movies.length).toBeLessThanOrEqual(10);
  });

  it('maps genres (drops "all", keeps 2), year and a poster url', () => {
    ctx.seriesList = [makeSeries(1, 8)];
    const { result } = renderHook(() => useTopRated());
    const item = result.current[0];
    expect(item.genres).toBe('Drama, Action');
    expect(item.year).toBe('2020');
    expect(typeof item.poster).toBe('string');
    expect(item.poster.length).toBeGreaterThan(0);
    expect(item.type).toBe('series');
  });

  it('is memoized: the same reference is returned when inputs do not change', () => {
    ctx.seriesList = [makeSeries(1, 8)];
    const { result, rerender } = renderHook(() => useTopRated());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
