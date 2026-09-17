// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';

const ctx = vi.hoisted(() => ({
  user: { uid: 'u1' } as { uid: string } | null,
  unratedSeries: [] as Series[],
  movieList: [] as Movie[],
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ unratedSeries: ctx.unratedSeries }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));

const saveQuickRating = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('../../services/rating/quickRating', () => ({ saveQuickRating }));

import { useUnratedQueue } from './useUnratedQueue';

const series = {
  id: 1,
  title: 'Dexter',
  poster: { poster: '/d.jpg' },
  genre: { genres: ['Drama', 'Crime'] },
} as unknown as Series;

const movie = {
  id: 2,
  title: 'Heat',
  watched: true,
  rating: {},
  poster: { poster: '/h.jpg' },
  genre: { genres: ['Action'] },
} as unknown as Movie;

beforeEach(() => {
  ctx.user = { uid: 'u1' };
  ctx.unratedSeries = [series];
  ctx.movieList = [movie];
  saveQuickRating.mockClear();
});
afterEach(cleanup);

describe('useUnratedQueue', () => {
  it('lists unrated series and movies as cards', () => {
    const { result } = renderHook(() => useUnratedQueue());
    expect(result.current.count).toBe(2);
    expect(result.current.items[0]).toMatchObject({
      key: 'series-1',
      type: 'series',
      title: 'Dexter',
      genres: ['Drama', 'Crime'],
    });
    expect(result.current.items[1]).toMatchObject({ key: 'movie-2', type: 'movie' });
  });

  it('saves through the shared quick-rating path with the source item', async () => {
    const { result } = renderHook(() => useUnratedQueue());
    const item = result.current.items[1];
    await act(async () => {
      await result.current.rate(item, 8);
    });
    // Der Film braucht die Quelle — daran hängen ratedAt, watchedAt und der
    // Wrapped-Eintrag, die die Queue früher nicht geschrieben hat.
    expect(saveQuickRating).toHaveBeenCalledWith(
      'u1',
      { id: 2, type: 'movie', title: 'Heat' },
      8,
      movie,
      undefined
    );
  });

  it('passes per-genre values through', async () => {
    const { result } = renderHook(() => useUnratedQueue());
    const item = result.current.items[0];
    await act(async () => {
      await result.current.rate(item, 7, { Drama: 8, Crime: 6 });
    });
    expect(saveQuickRating).toHaveBeenCalledWith(
      'u1',
      { id: 1, type: 'series', title: 'Dexter' },
      7,
      series,
      { Drama: 8, Crime: 6 }
    );
  });

  it('hides a rated card right away and skips without writing', async () => {
    const { result } = renderHook(() => useUnratedQueue());
    await act(async () => {
      await result.current.rate(result.current.items[0], 8);
    });
    expect(result.current.count).toBe(1);

    act(() => result.current.skip(result.current.items[0]));
    expect(result.current.count).toBe(0);
    expect(saveQuickRating).toHaveBeenCalledTimes(1);
  });

  it('does not write without a user or without a rating', async () => {
    ctx.user = null;
    const { result } = renderHook(() => useUnratedQueue());
    await act(async () => {
      await result.current.rate(result.current.items[0], 8);
    });
    expect(saveQuickRating).not.toHaveBeenCalled();
  });
});
