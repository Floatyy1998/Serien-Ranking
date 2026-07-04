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

import { useSeasonalRecommendations } from './useSeasonalRecommendations';

const CACHE_KEY = 'seasonal_recommendations_v9';

type FetchResult = { ok: boolean; status: number; json: () => Promise<unknown> };
let fetchMock: ReturnType<typeof vi.fn>;

// Minimal Map-backed sessionStorage fake so cache behaviour is deterministic.
function makeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string): string | null => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string): void => {
      m.set(k, String(v));
    },
    removeItem: (k: string): void => {
      m.delete(k);
    },
    clear: (): void => {
      m.clear();
    },
    key: (i: number): string | null => Array.from(m.keys())[i] ?? null,
    get length() {
      return m.size;
    },
  };
}
let store: ReturnType<typeof makeStorage>;

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

function stubDiscoverFetch(tv: unknown[], movie: unknown[]) {
  fetchMock = vi.fn(async (url: string): Promise<FetchResult> => {
    if (url.includes('/watch/providers')) return ok({ results: {} });
    if (url.includes('/discover/tv')) return ok({ results: tv });
    if (url.includes('/discover/movie')) return ok({ results: movie });
    return ok({ results: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(() => {
  ctx.allSeriesList = [];
  ctx.movieList = [];
  store = makeStorage();
  vi.stubGlobal('sessionStorage', store);
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useSeasonalRecommendations', () => {
  it('exposes a season title/colors synchronously on first render', () => {
    stubDiscoverFetch([], []);
    const { result } = renderHook(() => useSeasonalRecommendations());
    expect(typeof result.current.title).toBe('string');
    expect(result.current.title.length).toBeGreaterThan(0);
    expect(result.current.iconColor).toMatch(/^#/);
    expect(result.current.badgeGradient).toContain('linear-gradient');
  });

  it('loads discover results, then sorts merged items by voteCount desc and caps at 20', async () => {
    stubDiscoverFetch([tvItem(1, 500), tvItem(2, 100)], [movieItem(3, 900), movieItem(4, 50)]);

    const { result } = renderHook(() => useSeasonalRecommendations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const items = result.current.items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(20);
    // Highest voteCount first (movie 3 = 900).
    expect(items[0].id).toBe(3);
    const counts = items.map((i) => i.voteCount);
    const sorted = [...counts].sort((a, b) => b - a);
    expect(counts).toEqual(sorted);
    // Cache was written.
    expect(store.getItem(CACHE_KEY)).not.toBeNull();
  });

  it('filters out items already in the user lists', async () => {
    ctx.allSeriesList = [{ id: 1 }];
    ctx.movieList = [{ id: 3 }];
    stubDiscoverFetch([tvItem(1, 500), tvItem(2, 100)], [movieItem(3, 900), movieItem(4, 50)]);

    const { result } = renderHook(() => useSeasonalRecommendations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids = result.current.items.map((i) => i.id);
    expect(ids).not.toContain(1);
    expect(ids).not.toContain(3);
    expect(ids).toContain(2);
    expect(ids).toContain(4);
  });

  it('serves from sessionStorage cache without fetching again', async () => {
    // Probe render to learn the current season title, then seed the cache.
    const probe = renderHook(() => useSeasonalRecommendations());
    const title = probe.result.current.title;
    probe.unmount();

    store.setItem(
      CACHE_KEY,
      JSON.stringify({
        title,
        series: [
          {
            type: 'series',
            id: 99,
            title: 'Cached',
            poster: 'p',
            rating: 7,
            voteCount: 123,
            genres: '',
          },
        ],
        movies: [],
      })
    );
    fetchMock.mockClear();

    const { result } = renderHook(() => useSeasonalRecommendations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.map((i) => i.id)).toContain(99);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('empties the list and clears loading when the fetch rejects', async () => {
    fetchMock = vi.fn(async () => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useSeasonalRecommendations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it('cancels state updates after unmount (no cache write from a stale fetch)', async () => {
    let resolveFn: (v: FetchResult) => void = () => {};
    const pending = new Promise<FetchResult>((res) => {
      resolveFn = res;
    });
    fetchMock = vi.fn(() => pending);
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = renderHook(() => useSeasonalRecommendations());
    unmount();
    resolveFn(ok({ results: [tvItem(1, 10)] }));
    await Promise.resolve();
    // Cancelled effect must not have persisted anything.
    expect(store.getItem(CACHE_KEY)).toBeNull();
  });
});
