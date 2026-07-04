// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface Owned {
  id: number;
}
const ctx = vi.hoisted(() => ({
  allSeriesList: [] as Owned[],
  movieList: [] as Owned[],
}));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.allSeriesList }),
}));
vi.mock('../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));

import { useTMDBTrending } from './useTMDBTrending';

type FetchResult = { ok: boolean; status: number; json: () => Promise<unknown> };
let fetchMock: ReturnType<typeof vi.fn>;

const ok = (body: unknown): FetchResult => ({ ok: true, status: 200, json: async () => body });

function tvItem(id: number, voteCount: number) {
  return {
    id,
    name: `S${id}`,
    poster_path: `/s${id}.jpg`,
    vote_average: 7,
    vote_count: voteCount,
    first_air_date: '2021-05-01',
    genre_ids: [18],
  };
}
function movieItem(id: number, voteCount: number) {
  return {
    id,
    title: `M${id}`,
    poster_path: `/m${id}.jpg`,
    vote_average: 7,
    vote_count: voteCount,
    release_date: '2022-06-01',
    genre_ids: [28],
  };
}

beforeEach(() => {
  ctx.allSeriesList = [];
  ctx.movieList = [];
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useTMDBTrending', () => {
  it('fast path: uses the cached backend /trending payload without per-item TMDB calls', async () => {
    fetchMock = vi.fn(async (url: string): Promise<FetchResult> => {
      if (url.endsWith('/trending')) {
        return ok({ tv: [tvItem(1, 500), tvItem(2, 100)], movie: [movieItem(3, 900)] });
      }
      return ok({ results: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTMDBTrending());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.trending.length).toBe(3);
    expect(result.current.trending[0].id).toBe(3); // highest voteCount
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/trending$/);
  });

  it('falls back to the direct TMDB trending endpoints when the backend is empty', async () => {
    fetchMock = vi.fn(async (url: string): Promise<FetchResult> => {
      if (url.endsWith('/trending')) return ok({ tv: [], movie: [] });
      if (url.includes('/watch/providers')) return ok({ results: {} });
      if (url.includes('/trending/tv/week')) return ok({ results: [tvItem(1, 200)] });
      if (url.includes('/trending/movie/week')) return ok({ results: [movieItem(2, 800)] });
      return ok({ results: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTMDBTrending());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids = result.current.trending.map((t) => t.id);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    expect(result.current.trending[0].id).toBe(2); // 800 > 200
    expect(result.current.error).toBeNull();
  });

  it('falls back to TMDB when the backend request rejects', async () => {
    fetchMock = vi.fn(async (url: string): Promise<FetchResult> => {
      if (url.endsWith('/trending')) throw new Error('backend down');
      if (url.includes('/watch/providers')) return ok({ results: {} });
      if (url.includes('/trending/tv/week')) return ok({ results: [tvItem(1, 200)] });
      if (url.includes('/trending/movie/week')) return ok({ results: [movieItem(2, 800)] });
      return ok({ results: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTMDBTrending());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trending.map((t) => t.id).sort()).toEqual([1, 2]);
  });

  it('filters out titles already in the user lists', async () => {
    ctx.allSeriesList = [{ id: 1 }];
    ctx.movieList = [{ id: 3 }];
    fetchMock = vi.fn(async (url: string): Promise<FetchResult> => {
      if (url.endsWith('/trending')) {
        return ok({ tv: [tvItem(1, 500), tvItem(2, 100)], movie: [movieItem(3, 900)] });
      }
      return ok({ results: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTMDBTrending());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids = result.current.trending.map((t) => t.id);
    expect(ids).toEqual([2]);
  });

  it('sets an error when the backend is empty and no TMDB api key is configured', async () => {
    vi.stubEnv('VITE_API_TMDB', '');
    fetchMock = vi.fn(async (url: string): Promise<FetchResult> => {
      if (url.endsWith('/trending')) return ok({ tv: [], movie: [] });
      return ok({ results: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTMDBTrending());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.trending).toEqual([]);
  });
});
