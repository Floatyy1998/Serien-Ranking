// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Context + service mocks ───────────────────────────────────────────
interface Owned {
  id: number;
}
const ctx = vi.hoisted(() => ({
  allSeriesList: [] as Owned[],
  movieList: [] as Owned[],
  user: null as { uid: string } | null,
  refetchAfterAdd: vi.fn(async () => {}),
}));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({
    allSeriesList: ctx.allSeriesList,
    refetchAfterAdd: ctx.refetchAfterAdd,
  }),
}));
vi.mock('../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));
vi.mock('../AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));

const trackSeriesAdded = vi.fn<(...a: unknown[]) => void>();
const trackMovieAdded = vi.fn<(...a: unknown[]) => void>();
vi.mock('../services/firebase/analytics', () => ({
  trackSeriesAdded: (...a: unknown[]) => trackSeriesAdded(...a),
  trackMovieAdded: (...a: unknown[]) => trackMovieAdded(...a),
}));

const logSeriesAdded = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
const logMovieAdded = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../features/badges/minimalActivityLogger', () => ({
  logSeriesAdded: (...a: unknown[]) => logSeriesAdded(...a),
  logMovieAdded: (...a: unknown[]) => logMovieAdded(...a),
}));

const backendFetch = vi.fn<(...a: unknown[]) => Promise<{ ok: boolean }>>(async () => ({
  ok: true,
}));
vi.mock('../services/backendApi', () => ({
  backendFetch: (...a: unknown[]) => backendFetch(...a),
}));

import { useDetailRecommendations } from './useDetailRecommendations';
import type { DiscoverItem } from '../pages/Discover/discoverItemHelpers';

type FetchResult = { ok: boolean; status: number; json: () => Promise<unknown> };
let fetchMock: ReturnType<typeof vi.fn>;

const ok = (body: unknown): FetchResult => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
  ctx.allSeriesList = [];
  ctx.movieList = [];
  ctx.user = { uid: 'u1' };
  ctx.refetchAfterAdd.mockClear();
  trackSeriesAdded.mockClear();
  trackMovieAdded.mockClear();
  logSeriesAdded.mockClear();
  logMovieAdded.mockClear();
  backendFetch.mockClear();
  backendFetch.mockResolvedValue({ ok: true });
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
  vi.stubEnv('VITE_USER', 'flo');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function stubFetch(recResults: unknown[], simResults: unknown[]) {
  fetchMock = vi.fn(async (url: string): Promise<FetchResult> => {
    if (url.includes('/recommendations')) return ok({ results: recResults });
    if (url.includes('/similar')) return ok({ results: simResults });
    return ok({ results: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
}

describe('useDetailRecommendations', () => {
  it('merges recommendations+similar, dedups, filters owned/posterless, sorts by score', async () => {
    ctx.allSeriesList = [{ id: 3 }]; // owned → filtered out
    stubFetch(
      [
        { id: 1, name: 'A', poster_path: '/a.jpg', vote_average: 8, vote_count: 100 },
        { id: 2, name: 'B', poster_path: '/b.jpg', vote_average: 9, vote_count: 1000 },
        { id: 3, name: 'Owned', poster_path: '/c.jpg', vote_average: 7, vote_count: 50 },
        { id: 4, name: 'NoPoster', poster_path: null, vote_average: 9, vote_count: 9999 },
      ],
      [
        { id: 2, name: 'Dup', poster_path: '/b.jpg', vote_average: 9, vote_count: 1000 },
        { id: 5, name: 'E', poster_path: '/e.jpg', vote_average: 6, vote_count: 20 },
      ]
    );

    const { result } = renderHook(() => useDetailRecommendations(55, 'tv'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.map((i) => i.id)).toEqual([2, 1, 5]);
    expect(result.current.items.every((i) => i.type === 'series')).toBe(true);
    expect(result.current.items.every((i) => i.inList === false)).toBe(true);
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not fetch when disabled', async () => {
    stubFetch([], []);
    const { result } = renderHook(() => useDetailRecommendations(55, 'tv', false));
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when the TMDB api key is missing', async () => {
    vi.stubEnv('VITE_API_TMDB', '');
    stubFetch([{ id: 1, poster_path: '/a.jpg', vote_average: 5, vote_count: 10 }], []);
    renderHook(() => useDetailRecommendations(55, 'tv'));
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sets an error and empties items when the fetch rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock = vi.fn(async () => {
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDetailRecommendations(55, 'tv'));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('addToList() adds a series: backend call, tracking, refetch, removal, returns true', async () => {
    stubFetch(
      [{ id: 7, name: 'Keep', poster_path: '/k.jpg', vote_average: 8, vote_count: 500 }],
      []
    );
    const { result } = renderHook(() => useDetailRecommendations(55, 'tv'));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    const item = result.current.items[0] as DiscoverItem;
    let outcome = false;
    await act(async () => {
      outcome = await result.current.addToList(item);
    });

    expect(outcome).toBe(true);
    expect(backendFetch).toHaveBeenCalledWith('/add', expect.objectContaining({ method: 'POST' }));
    expect(trackSeriesAdded).toHaveBeenCalled();
    expect(ctx.refetchAfterAdd).toHaveBeenCalledWith(7);
    expect(logSeriesAdded).toHaveBeenCalled();
    expect(result.current.items).toHaveLength(0);
    expect(result.current.addingId).toBeNull();
  });

  it('addToList() routes movies to /addMovie and the movie logger', async () => {
    stubFetch(
      [{ id: 8, title: 'Film', poster_path: '/f.jpg', vote_average: 8, vote_count: 400 }],
      []
    );
    const { result } = renderHook(() => useDetailRecommendations(55, 'movie'));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      await result.current.addToList(result.current.items[0] as DiscoverItem);
    });

    expect(backendFetch).toHaveBeenCalledWith(
      '/addMovie',
      expect.objectContaining({ method: 'POST' })
    );
    expect(trackMovieAdded).toHaveBeenCalled();
    expect(logMovieAdded).toHaveBeenCalled();
  });

  it('addToList() returns false when the backend responds not-ok', async () => {
    backendFetch.mockResolvedValue({ ok: false });
    stubFetch([{ id: 9, name: 'X', poster_path: '/x.jpg', vote_average: 8, vote_count: 300 }], []);
    const { result } = renderHook(() => useDetailRecommendations(55, 'tv'));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    let outcome = true;
    await act(async () => {
      outcome = await result.current.addToList(result.current.items[0] as DiscoverItem);
    });
    expect(outcome).toBe(false);
    expect(result.current.items).toHaveLength(1);
  });

  it('addToList() returns false when no user is signed in', async () => {
    ctx.user = null;
    stubFetch([{ id: 10, name: 'Y', poster_path: '/y.jpg', vote_average: 8, vote_count: 300 }], []);
    const { result } = renderHook(() => useDetailRecommendations(55, 'tv'));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    let outcome = true;
    await act(async () => {
      outcome = await result.current.addToList(result.current.items[0] as DiscoverItem);
    });
    expect(outcome).toBe(false);
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
