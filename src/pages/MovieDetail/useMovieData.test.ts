// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Movie } from '../../types/Movie';

// ── react-router-dom ──────────────────────────────────────────────────
const rr = vi.hoisted(() => ({ id: '123', navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: rr.id }),
  useNavigate: () => rr.navigate,
}));

// ── firebase compat ───────────────────────────────────────────────────
const fb = vi.hoisted(() => {
  const removeMock = vi.fn(() => Promise.resolve());
  const updateMock = vi.fn((_updates?: Record<string, unknown>) => Promise.resolve());
  const refMock = vi.fn((_p?: string) => ({ remove: removeMock, update: updateMock }));
  const database = Object.assign(() => ({ ref: refMock }), {
    ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
  });
  return { removeMock, updateMock, refMock, database };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// ── contexts + services ───────────────────────────────────────────────
const ctx = vi.hoisted(() => ({
  movieList: [] as Movie[],
  user: { uid: 'u1' } as { uid: string } | null,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));
vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logMovieAdded: vi.fn(async () => {}),
}));
vi.mock('../../services/firebase/analytics', () => ({
  trackMovieAdded: vi.fn(),
  trackMovieDeleted: vi.fn(),
}));
const backendFetch = vi.hoisted(() => vi.fn());
vi.mock('../../services/backendApi', () => ({ backendFetch }));

import { logMovieAdded } from '../../features/badges/minimalActivityLogger';
import { trackMovieAdded, trackMovieDeleted } from '../../services/firebase/analytics';
import { useMovieData } from './useMovieData';

const makeMovie = (o: Partial<Movie> = {}): Movie =>
  ({
    id: 123,
    title: 'Local Film',
    genre: { genres: ['Drama'] },
    poster: { poster: '/p.jpg' },
    imdb: { imdb_id: '' },
    rating: {},
    runtime: 120,
    wo: { wo: '' },
    begründung: '',
    ...o,
  }) as unknown as Movie;

type FetchResult = { json: () => Promise<unknown> };
const jsonRes = (b: unknown): FetchResult => ({ json: async () => b });

function stubFetch(handler: (url: string) => unknown) {
  const fetchMock = vi.fn(async (url: string): Promise<FetchResult> => jsonRes(handler(url)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function handler(url: string): unknown {
  if (url.includes('omdbapi')) return { imdbRating: '7.5', imdbVotes: '900' };
  if (url.includes('/watch/providers'))
    return {
      results: {
        DE: {
          flatrate: [
            { provider_name: 'Netflix', provider_id: 8, logo_path: '/n.png' },
            { provider_name: 'Nope Service', provider_id: 77, logo_path: '/x.png' },
          ],
        },
      },
    };
  if (url.includes('append_to_response'))
    return {
      id: 999,
      title: 'Remote Film',
      poster_path: '/r.jpg',
      genres: [{ id: 1, name: 'Drama' }],
      release_date: '2021-05-05',
      runtime: 100,
      overview: 'Text',
      backdrop_path: '/b.jpg',
      external_ids: { imdb_id: 'tt999' },
    };
  if (url.includes('language=en-US')) return { title: 'Remote Film' };
  return { backdrop_path: '/b.jpg', vote_average: 8, vote_count: 50, overview: 'Text' };
}

beforeEach(() => {
  rr.id = '123';
  ctx.movieList = [];
  ctx.user = { uid: 'u1' };
  vi.clearAllMocks();
  backendFetch.mockResolvedValue({ ok: true });
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
  vi.stubEnv('VITE_API_OMDb', 'omdb-key');
  vi.stubEnv('VITE_USER', 'flo');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useMovieData', () => {
  it('returns a local movie with derived rating fields and no read-only flag', async () => {
    ctx.movieList = [makeMovie({ id: 123, rating: { u1: 8, other: 6 }, imdb: { imdb_id: 'tt1' } })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());

    expect(result.current.movie?.id).toBe(123);
    expect(result.current.isReadOnlyTmdbMovie).toBe(false);
    // rating ist genre-keyed; currentRating = Gesamtbewertung (Mittel der positiven Werte)
    expect(result.current.currentRating).toBe(7); // mean(8,6)
    expect(result.current.isWatched).toBe(true);
    expect(result.current.averageRating).toBe(7); // mean(8,6)
    await waitFor(() => expect(result.current.tmdbBackdrop).toBe('/b.jpg'));
  });

  it('formatRuntime + getBackdropUrl helpers behave', () => {
    ctx.movieList = [makeMovie({ id: 123 })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());
    expect(result.current.formatRuntime(125)).toBe('2h 5m');
    expect(result.current.getBackdropUrl(undefined)).toBe('');
  });

  it('fetches the movie from TMDB when it is not in the user list (read-only)', async () => {
    rr.id = '999';
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());
    await waitFor(() => expect(result.current.tmdbMovie).not.toBeNull());
    expect(result.current.isReadOnlyTmdbMovie).toBe(true);
    expect(result.current.movie?.title).toBe('Remote Film');
    expect(result.current.loading).toBe(false);
  });

  it('filters providers to the supported set', async () => {
    ctx.movieList = [makeMovie({ id: 123 })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());
    await waitFor(() => expect(result.current.providers).not.toBeNull());
    expect(result.current.providers?.map((p) => p.provider_name)).toEqual(['Netflix']);
  });

  it('handleAddMovie: posts to /addMovie, logs, tracks and navigates', async () => {
    ctx.movieList = [makeMovie({ id: 123 })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());

    await act(async () => {
      await result.current.handleAddMovie();
    });

    expect(backendFetch).toHaveBeenCalledWith(
      '/addMovie',
      expect.objectContaining({ method: 'POST' })
    );
    expect(logMovieAdded).toHaveBeenCalled();
    expect(trackMovieAdded).toHaveBeenCalled();
    expect(rr.navigate).toHaveBeenCalledWith('/movie/123');
    expect(result.current.isAdding).toBe(false);
  });

  it('handleAddMovie: shows an info dialog when the movie already exists', async () => {
    backendFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Film bereits vorhanden' }),
    });
    ctx.movieList = [makeMovie({ id: 123 })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());

    await act(async () => {
      await result.current.handleAddMovie();
    });
    expect(result.current.dialog).toMatchObject({ open: true, type: 'info' });
    expect(rr.navigate).not.toHaveBeenCalled();
  });

  it('isWatched is true when the movie has watched=true even without a rating', () => {
    ctx.movieList = [makeMovie({ id: 123, rating: {}, watched: true })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());
    expect(result.current.currentRating).toBe(0);
    expect(result.current.isWatched).toBe(true);
  });

  it('handleToggleWatched: marks watched with watchedAt, bumps version, leaves rating untouched', async () => {
    ctx.movieList = [makeMovie({ id: 123, rating: {} })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());
    expect(result.current.isWatched).toBe(false);

    await act(async () => {
      await result.current.handleToggleWatched();
    });

    expect(fb.updateMock).toHaveBeenCalledTimes(1);
    const updates = fb.updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(updates['users/u1/movies/123/watched']).toBe(true);
    expect(updates['users/u1/movies/123/watchedAt']).toBeTruthy();
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    // Bewertung wird NICHT verändert
    expect(Object.keys(updates)).not.toContain('users/u1/movies/123/rating');
  });

  it('handleToggleWatched: un-marks a watched movie (watched=false, watchedAt=null)', async () => {
    ctx.movieList = [
      makeMovie({ id: 123, rating: {}, watched: true, watchedAt: '2025-01-01T00:00:00.000Z' }),
    ];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());
    expect(result.current.isWatched).toBe(true);

    await act(async () => {
      await result.current.handleToggleWatched();
    });

    const updates = fb.updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(updates['users/u1/movies/123/watched']).toBe(false);
    expect(updates['users/u1/movies/123/watchedAt']).toBeNull();
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('handleToggleWatched: preserves an existing watchedAt when re-marking after a rating', async () => {
    ctx.movieList = [
      makeMovie({ id: 123, rating: { u1: 7 }, watchedAt: '2024-06-01T12:00:00.000Z' }),
    ];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());
    // rating>0 → isWatched true → toggle target is "un-mark"
    expect(result.current.isWatched).toBe(true);

    await act(async () => {
      await result.current.handleToggleWatched();
    });
    const updates = fb.updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(updates['users/u1/movies/123/watched']).toBe(false);
    // rating map is never part of the write
    expect(Object.keys(updates)).not.toContain('users/u1/movies/123/rating');
  });

  it('handleDeleteMovie: removes the movie and tracks the deletion', async () => {
    ctx.movieList = [makeMovie({ id: 123 })];
    stubFetch(handler);
    const { result } = renderHook(() => useMovieData());

    await act(async () => {
      await result.current.handleDeleteMovie();
    });
    expect(fb.removeMock).toHaveBeenCalled();
    expect(trackMovieDeleted).toHaveBeenCalled();
    const paths = fb.refMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain('users/u1/movies/123');
  });
});
