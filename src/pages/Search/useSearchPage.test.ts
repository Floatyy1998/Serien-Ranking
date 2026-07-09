// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { useSearchPage } from './useSearchPage';
import { clearProviderCache } from '../Discover/watchProviderFilter';

// ── router mock ───────────────────────────────────────────────────────
const router = vi.hoisted(() => ({
  params: new URLSearchParams(),
  setParams: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [router.params, router.setParams] as const,
  useNavigate: () => router.navigate,
}));

// ── contexts / libs ───────────────────────────────────────────────────
const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  movieList: [] as Movie[],
  user: { uid: 'u1' } as { uid: string } | null,
  isDesktop: true,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.seriesList, seriesList: ctx.seriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));
vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isDesktop: ctx.isDesktop, isMobile: !ctx.isDesktop }),
}));
const preloadImage = vi.fn();
vi.mock('../../lib/preloadImage', () => ({ preloadImage: (u?: string) => preloadImage(u) }));

const backendFetch = vi.fn<(...a: unknown[]) => Promise<{ ok: boolean }>>();
vi.mock('../../services/backendApi', () => ({
  backendFetch: (...a: unknown[]) => backendFetch(...a),
}));

const logSeriesAdded = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
const logMovieAdded = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logSeriesAdded: (...a: unknown[]) => logSeriesAdded(...a),
  logMovieAdded: (...a: unknown[]) => logMovieAdded(...a),
}));

// ── fetch fixtures ────────────────────────────────────────────────────
type FetchResult = { ok: boolean; json: () => Promise<unknown> };
const jsonOk = (body: unknown): FetchResult => ({ ok: true, json: async () => body });

function stubFetch(handler: (url: string) => FetchResult) {
  const fetchMock = vi.fn(async (url: string) => handler(url));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const tvResults = {
  results: [
    { id: 100, name: 'Breaking Bad', popularity: 90, poster_path: '/bb.jpg' },
    { id: 101, name: 'Better Call Saul', popularity: 80, poster_path: '/bcs.jpg' },
  ],
};
const movieResults = {
  results: [{ id: 200, title: 'Sicario', popularity: 95, poster_path: '/s.jpg' }],
};

describe('useSearchPage', () => {
  beforeEach(() => {
    router.params = new URLSearchParams();
    router.setParams.mockReset();
    router.navigate.mockReset();
    preloadImage.mockReset();
    backendFetch.mockReset().mockResolvedValue({ ok: true });
    logSeriesAdded.mockClear();
    logMovieAdded.mockClear();
    ctx.user = { uid: 'u1' };
    ctx.seriesList = [];
    ctx.movieList = [];
    ctx.isDesktop = true;
    localStorage.clear();
    sessionStorage.clear();
    clearProviderCache();
    vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
    vi.stubEnv('VITE_USER', 'flo');
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    cleanup();
  });

  it('reads the initial query and type from the URL', () => {
    router.params = new URLSearchParams('q=dune&type=movies');
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    expect(result.current.searchQuery).toBe('dune');
    expect(result.current.searchType).toBe('movies');
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.popularSearches.length).toBeGreaterThan(0);
  });

  it('does not query TMDB for inputs shorter than 2 chars', async () => {
    const fetchMock = stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    act(() => result.current.setSearchQuery('a'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.searchResults).toEqual([]);
  });

  it('debounces then fetches, merges series+movies and sorts by popularity', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.includes('/search/tv')) return jsonOk(tvResults);
      if (url.includes('/search/movie')) return jsonOk(movieResults);
      return jsonOk({ results: [] });
    });
    const { result } = renderHook(() => useSearchPage());
    act(() => result.current.setSearchQuery('breaking'));

    // Not yet fired (debounce 500 ms)
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.loading).toBe(false);

    // sorted by popularity desc: Sicario(95), BreakingBad(90), BCS(80)
    expect(result.current.searchResults.map((r) => r.id)).toEqual([200, 100, 101]);
    expect(result.current.recentSearches).toContain('breaking');
    expect(localStorage.getItem('recentSearches')).toContain('breaking');
  });

  it('only queries the tv endpoints when the type filter is "series"', async () => {
    const fetchMock = stubFetch((url) =>
      url.includes('/search/tv') ? jsonOk(tvResults) : jsonOk({ results: [] })
    );
    const { result } = renderHook(() => useSearchPage());
    act(() => result.current.setSearchType('series'));
    act(() => result.current.setSearchQuery('breaking'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.searchResults.length).toBe(2);
    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('/search/movie'))).toBe(false);
    expect(result.current.searchResults.every((r) => r.type === 'series')).toBe(true);
  });

  it('derives inList live from the owned series/movie lists', async () => {
    ctx.seriesList = [{ id: 100 } as Series];
    stubFetch((url) => (url.includes('/search/tv') ? jsonOk(tvResults) : jsonOk({ results: [] })));
    const { result } = renderHook(() => useSearchPage());
    act(() => result.current.setSearchQuery('breaking'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.searchResults.length).toBeGreaterThan(0);
    const owned = result.current.searchResults.find((r) => r.id === 100);
    expect(owned?.inList).toBe(true);
    expect(result.current.searchResults.find((r) => r.id === 101)?.inList).toBe(false);
  });

  it('empties results and logs on fetch failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn(async () => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSearchPage());
    act(() => result.current.setSearchQuery('breaking'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.searchResults).toEqual([]);
  });

  it('handleItemClick preloads the poster and navigates to the detail route', () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    act(() =>
      result.current.handleItemClick({
        id: 5,
        type: 'series',
        poster_path: '/p.jpg',
        inList: false,
      })
    );
    expect(preloadImage).toHaveBeenCalledWith('https://image.tmdb.org/t/p/w500/p.jpg');
    expect(router.navigate).toHaveBeenCalledWith('/series/5');
  });

  it('addToList warns when unauthenticated', async () => {
    ctx.user = null;
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    await act(async () => {
      await result.current.addToList({ id: 1, type: 'series', inList: false });
    });
    expect(result.current.dialog.open).toBe(true);
    expect(result.current.dialog.type).toBe('warning');
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('addToList posts to /add and logs a series activity on success', async () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    await act(async () => {
      await result.current.addToList({
        id: 100,
        type: 'series',
        name: 'Breaking Bad',
        inList: false,
      });
    });
    expect(backendFetch).toHaveBeenCalledWith('/add', expect.objectContaining({ method: 'POST' }));
    expect(logSeriesAdded).toHaveBeenCalled();
    expect(result.current.snackbar.open).toBe(true);
    expect(result.current.pendingAddIds.has('series-100')).toBe(false);
  });

  it('addToList routes movies to /addMovie', async () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    await act(async () => {
      await result.current.addToList({ id: 200, type: 'movie', title: 'Sicario', inList: false });
    });
    expect(backendFetch).toHaveBeenCalledWith(
      '/addMovie',
      expect.objectContaining({ method: 'POST' })
    );
    expect(logMovieAdded).toHaveBeenCalled();
  });

  it('filters results to active abo providers when the toggle is on', async () => {
    stubFetch((url) => {
      if (url.includes('/watch/providers')) {
        return url.includes('/tv/100')
          ? jsonOk({ results: { DE: { flatrate: [{ provider_name: 'Netflix' }] } } })
          : jsonOk({ results: { DE: { flatrate: [{ provider_name: 'WOW' }] } } });
      }
      return url.includes('/search/tv') ? jsonOk(tvResults) : jsonOk({ results: [] });
    });
    const { result } = renderHook(() => useSearchPage(new Set(['Netflix'])));
    act(() => result.current.setOnlyMyProviders(true));
    act(() => result.current.setSearchType('series'));
    act(() => result.current.setSearchQuery('breaking'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    // Breaking Bad (100) läuft auf Netflix → bleibt; Better Call Saul (101) auf WOW → raus.
    expect(result.current.searchResults.map((r) => r.id)).toEqual([100]);
  });

  it('removeRecentSearch prunes the term from state and localStorage', async () => {
    localStorage.setItem('recentSearches', JSON.stringify(['dune', 'matrix']));
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    expect(result.current.recentSearches).toEqual(['dune', 'matrix']);
    act(() => result.current.removeRecentSearch('dune'));
    expect(result.current.recentSearches).toEqual(['matrix']);
    expect(localStorage.getItem('recentSearches')).toBe(JSON.stringify(['matrix']));
  });
});
