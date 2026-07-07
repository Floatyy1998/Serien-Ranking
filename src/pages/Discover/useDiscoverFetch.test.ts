// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { useDiscoverFetch } from './useDiscoverFetch';
import { clearProviderCache } from './watchProviderFilter';

// ── contexts (shared by useDiscoverActions too) ───────────────────────
const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  movieList: [] as Movie[],
  user: { uid: 'u1' } as { uid: string } | null,
}));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.seriesList, seriesList: ctx.seriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));

// ── useDiscoverActions side-effect deps ───────────────────────────────
vi.mock('../../services/firebase/analytics', () => ({
  trackSeriesAdded: vi.fn(),
  trackMovieAdded: vi.fn(),
}));
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logSeriesAdded: vi.fn(async () => {}),
  logMovieAdded: vi.fn(async () => {}),
}));
vi.mock('../../services/backendApi', () => ({ backendFetch: vi.fn(async () => ({ ok: true })) }));

// ── fetch helper ──────────────────────────────────────────────────────
type FetchResult = { ok: boolean; json: () => Promise<unknown> };
const jsonOk = (body: unknown): FetchResult => ({ ok: true, json: async () => body });

function stubFetch(handler: (url: string) => FetchResult) {
  const fetchMock = vi.fn(async (url: string) => handler(url));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

type Args = Parameters<typeof useDiscoverFetch>;
const render = (
  args: Partial<{
    activeTab: Args[0];
    activeCategory: Args[1];
    selectedGenre: Args[2];
    showSearch: Args[3];
    searchQuery: Args[4];
    isRestoring: Args[5];
  }> = {}
) =>
  renderHook(
    (p: {
      activeTab: Args[0];
      activeCategory: Args[1];
      selectedGenre: Args[2];
      showSearch: Args[3];
      searchQuery: Args[4];
      isRestoring: Args[5];
    }) =>
      useDiscoverFetch(
        p.activeTab,
        p.activeCategory,
        p.selectedGenre,
        p.showSearch,
        p.searchQuery,
        p.isRestoring
      ),
    {
      initialProps: {
        activeTab: 'series',
        activeCategory: 'trending',
        selectedGenre: null,
        showSearch: false,
        searchQuery: '',
        isRestoring: true, // suppress mount auto-fetch unless a test opts in
        ...args,
      } as {
        activeTab: Args[0];
        activeCategory: Args[1];
        selectedGenre: Args[2];
        showSearch: Args[3];
        searchQuery: Args[4];
        isRestoring: Args[5];
      },
    }
  );

describe('useDiscoverFetch', () => {
  beforeEach(() => {
    ctx.seriesList = [];
    ctx.movieList = [];
    ctx.user = { uid: 'u1' };
    clearProviderCache();
    vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
    vi.stubEnv('VITE_USER', 'flo');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    cleanup();
  });

  it('isInList matches by numeric id and string form across owned lists', () => {
    ctx.seriesList = [{ id: 100 } as Series];
    ctx.movieList = [{ id: 200 } as Movie];
    const { result } = render();
    expect(result.current.isInList(100, 'series')).toBe(true);
    expect(result.current.isInList('100', 'series')).toBe(true);
    expect(result.current.isInList(200, 'movie')).toBe(true);
    expect(result.current.isInList(999, 'series')).toBe(false);
  });

  it('fetchFromTMDB(reset) filters owned items and maps type/inList', async () => {
    ctx.seriesList = [{ id: 100 } as Series];
    stubFetch(() => jsonOk({ results: [{ id: 100 }, { id: 101 }, { id: 102 }], total_pages: 3 }));
    const { result } = render();
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    expect(result.current.results.map((r) => r.id)).toEqual([101, 102]);
    expect(result.current.results.every((r) => r.type === 'series' && r.inList === false)).toBe(
      true
    );
    expect(result.current.hasMore).toBe(true);
  });

  it('paginates and de-duplicates by type-id on subsequent pages', async () => {
    const fetchMock = stubFetch((url) => {
      const page = new URL(url).searchParams.get('page');
      if (page === '1') return jsonOk({ results: [{ id: 101 }, { id: 102 }], total_pages: 3 });
      return jsonOk({ results: [{ id: 102 }, { id: 103 }], total_pages: 3 });
    });
    const { result } = render();
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    await act(async () => {
      await result.current.fetchFromTMDB(false);
    });
    expect(result.current.results.map((r) => r.id)).toEqual([101, 102, 103]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('sets hasMore=false when the fetch rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn(async () => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = render();
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    expect(result.current.hasMore).toBe(false);
  });

  it('auto-fetches on mount when not restoring', async () => {
    const fetchMock = stubFetch(() => jsonOk({ results: [{ id: 1 }], total_pages: 1 }));
    const { result } = render({ isRestoring: false });
    await waitFor(() => expect(result.current.results.length).toBe(1));
    expect(fetchMock).toHaveBeenCalled();
    expect(result.current.hasMore).toBe(false); // page 1 of 1
  });

  it('filters browse results to active abo providers when onlyMyProviders is on', async () => {
    stubFetch((url) => {
      if (url.includes('/watch/providers')) {
        return url.includes('/tv/101')
          ? jsonOk({ results: { DE: { flatrate: [{ provider_name: 'Netflix' }] } } })
          : jsonOk({ results: { DE: { flatrate: [{ provider_name: 'WOW' }] } } });
      }
      return jsonOk({ results: [{ id: 101 }, { id: 102 }], total_pages: 1 });
    });
    const abo = new Set(['Netflix']);
    const { result } = renderHook(() =>
      useDiscoverFetch('series', 'trending', null, false, '', true, true, abo)
    );
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    expect(result.current.results.map((r) => r.id)).toEqual([101]);
  });

  it('searchItems filters owned, caps at 20 and maps type', async () => {
    ctx.seriesList = [{ id: 5 } as Series];
    const many = Array.from({ length: 25 }, (_, i) => ({ id: i + 10 }));
    stubFetch(() => jsonOk({ results: [{ id: 5 }, ...many] }));
    const { result } = render();
    await act(async () => {
      await result.current.searchItems('dune');
    });
    expect(result.current.searchResults.length).toBe(20);
    expect(result.current.searchResults.some((r) => r.id === 5)).toBe(false);
    expect(result.current.searchResults.every((r) => r.type === 'series')).toBe(true);
  });

  it('searchItems clears results for an empty query', async () => {
    stubFetch(() => jsonOk({ results: [{ id: 1 }] }));
    const { result } = render();
    await act(async () => {
      await result.current.searchItems('   ');
    });
    expect(result.current.searchResults).toEqual([]);
  });

  it('debounced search runs after 300 ms when showSearch is active', async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch(() => jsonOk({ results: [{ id: 7 }] }));
    const { result } = render({ showSearch: true, searchQuery: 'matrix' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(fetchMock).toHaveBeenCalled();
    expect(result.current.searchResults.map((r) => r.id)).toEqual([7]);
  });

  it('fetchRecommendations builds recs from owned items, filtering owned/dupes', async () => {
    ctx.seriesList = [{ id: 100, title: 'A', rating: { u1: 9 } } as unknown as Series];
    stubFetch(() =>
      jsonOk({
        results: [
          { id: 500, vote_average: 8 },
          { id: 100, vote_average: 7 },
        ],
      })
    );
    const { result } = render({ activeCategory: 'recommendations' });
    await act(async () => {
      await result.current.fetchRecommendations(true);
    });
    expect(result.current.recommendations.map((r) => r.id)).toEqual([500]);
    expect(result.current.recommendations[0].basedOn).toBe('A');
    // only owned source exhausted → no more
    expect(result.current.recommendationsHasMore).toBe(false);
  });

  it('fetchRecommendations short-circuits with an empty owned list', async () => {
    ctx.seriesList = [];
    const fetchMock = stubFetch(() => jsonOk({ results: [] }));
    const { result } = render({ activeCategory: 'recommendations' });
    await act(async () => {
      await result.current.fetchRecommendations(true);
    });
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.recommendationsHasMore).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
