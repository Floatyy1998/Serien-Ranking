// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

// ── react-router-dom ──────────────────────────────────────────────────
const rr = vi.hoisted(() => ({ id: '123', type: 'series' as 'series' | 'movie' }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ id: rr.id, type: rr.type }) }));

// ── firebase compat ───────────────────────────────────────────────────
const fb = vi.hoisted(() => {
  const setMock = vi.fn(() => Promise.resolve());
  const removeMock = vi.fn(() => Promise.resolve());
  const childSetMock = vi.fn(() => Promise.resolve());
  const childMock = vi.fn((_k?: string) => ({ set: childSetMock }));
  const refMock = vi.fn((_p?: string) => ({
    set: setMock,
    remove: removeMock,
    child: childMock,
  }));
  const database = () => ({ ref: refMock });
  return { setMock, removeMock, childSetMock, childMock, refMock, database };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// ── contexts + services ───────────────────────────────────────────────
const ctx = vi.hoisted(() => ({
  allSeriesList: [] as Series[],
  movieList: [] as Movie[],
  user: { uid: 'u1' } as { uid: string } | null,
}));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.allSeriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));
vi.mock('../../lib/haptics', () => ({ hapticSelect: vi.fn() }));
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logRatingAdded: vi.fn(async () => {}),
}));
vi.mock('../../services/firebase/analytics', () => ({
  trackRatingSaved: vi.fn(),
  trackRatingDeleted: vi.fn(),
}));
const logMovieWatch = vi.hoisted(() => vi.fn());
vi.mock('../../services/watchActivityService', () => ({
  WatchActivityService: { logMovieWatch },
}));

import { hapticSelect } from '../../lib/haptics';
import { logRatingAdded } from '../../features/badges/minimalActivityLogger';
import { trackRatingSaved, trackRatingDeleted } from '../../services/firebase/analytics';
import { useRatingEditorData } from './useRatingEditorData';

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 123,
    title: 'Rated Show',
    genre: { genres: ['Drama', 'Comedy'] },
    rating: {},
    seasons: [],
    ...o,
  }) as unknown as Series;

const makeMovie = (o: Partial<Movie> = {}): Movie =>
  ({
    id: 123,
    title: 'Rated Film',
    genre: { genres: ['Drama'] },
    rating: {},
    runtime: 120,
    ...o,
  }) as unknown as Movie;

beforeEach(() => {
  rr.id = '123';
  rr.type = 'series';
  ctx.allSeriesList = [];
  ctx.movieList = [];
  ctx.user = { uid: 'u1' };
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('useRatingEditorData', () => {
  it('finds the series item and initialises the overall rating from stored genre ratings', async () => {
    ctx.allSeriesList = [makeSeries({ rating: { Drama: 8, Comedy: 6 } })];
    const { result } = renderHook(() => useRatingEditorData());

    expect(result.current.item?.id).toBe(123);
    expect(result.current.type).toBe('series');
    await waitFor(() => expect(result.current.overallRating).toBe(7)); // mean(8,6)
    expect(result.current.genreRatings.Drama).toBe(8);
    expect(result.current.genreRatings.Comedy).toBe(6);
  });

  it('handleRatingChange updates the overall rating and fires haptics', () => {
    ctx.allSeriesList = [makeSeries()];
    const { result } = renderHook(() => useRatingEditorData());
    act(() => result.current.handleRatingChange(9));
    expect(result.current.overallRating).toBe(9);
    expect(hapticSelect).toHaveBeenCalledTimes(1);
  });

  it('genre tab recomputes the overall rating as the average of rated genres', async () => {
    ctx.allSeriesList = [makeSeries()];
    const { result } = renderHook(() => useRatingEditorData());
    act(() => result.current.setActiveTab('genre'));
    act(() => result.current.handleGenreRatingChange('Drama', 8));
    act(() => result.current.handleGenreRatingChange('Comedy', 4));
    await waitFor(() => expect(result.current.overallRating).toBe(6)); // mean(8,4)
  });

  it('handleSave (series, overall tab) writes every genre rating, logs + tracks it', async () => {
    ctx.allSeriesList = [makeSeries({ genre: { genres: ['Drama', 'Comedy'] } })];
    const { result } = renderHook(() => useRatingEditorData());
    act(() => result.current.handleRatingChange(9));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(fb.setMock).toHaveBeenCalledWith({ Drama: 9, Comedy: 9 });
    const paths = fb.refMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain('users/u1/series/123/rating');
    expect(logRatingAdded).toHaveBeenCalled();
    expect(trackRatingSaved).toHaveBeenCalledWith('123', 'series', 9);
    expect(result.current.snackbar.open).toBe(true);
  });

  it('handleSave (movie) also stamps ratedAt/watchedAt and logs a movie watch', async () => {
    rr.type = 'movie';
    ctx.movieList = [makeMovie({ genre: { genres: ['Drama'] } })];
    const { result } = renderHook(() => useRatingEditorData());
    act(() => result.current.handleRatingChange(7));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(fb.setMock).toHaveBeenCalledWith({ Drama: 7 });
    // ratedAt + watchedAt via ref().child(...).set(...)
    const childKeys = fb.childMock.mock.calls.map((c) => c[0]);
    expect(childKeys).toContain('ratedAt');
    expect(childKeys).toContain('watchedAt');
    expect(logMovieWatch).toHaveBeenCalled();
  });

  it('handleDelete opens a confirm dialog and only removes after confirmDelete', async () => {
    ctx.allSeriesList = [makeSeries({ rating: { Drama: 8 } })];
    const { result } = renderHook(() => useRatingEditorData());

    // Requesting delete opens the confirm dialog but does not delete yet
    act(() => {
      result.current.handleDelete();
    });
    expect(result.current.deleteConfirmOpen).toBe(true);
    expect(fb.removeMock).not.toHaveBeenCalled();

    // Cancelling closes the dialog without deleting
    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.deleteConfirmOpen).toBe(false);
    expect(fb.removeMock).not.toHaveBeenCalled();

    // Confirming performs the actual delete
    act(() => {
      result.current.handleDelete();
    });
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(result.current.deleteConfirmOpen).toBe(false);
    expect(fb.removeMock).toHaveBeenCalled();
    expect(trackRatingDeleted).toHaveBeenCalledWith('123', 'series');
  });
});
