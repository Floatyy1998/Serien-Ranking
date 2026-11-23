// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { useDiscoverFetch } from './useDiscoverFetch';
import { clearProviderCache } from './watchProviderFilter';

// contexts (shared by useDiscoverActions too)
const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  movieList: [] as Movie[],
  user: { uid: 'u1' } as { uid: string } | null,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.seriesList, seriesList: ctx.seriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));

// useDiscoverActions side-effect deps
vi.mock('../../services/firebase/analytics', () => ({
  trackSeriesAdded: vi.fn(),
  trackMovieAdded: vi.fn(),
}));
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logSeriesAdded: vi.fn(async () => {}),
  logMovieAdded: vi.fn(async () => {}),
}));
vi.mock('../../services/api/backendApi', () => ({
  backendFetch: vi.fn(async () => ({ ok: true })),
}));

const taste = vi.hoisted(() => ({ blocked: new Set<number>() }));
vi.mock('../../services/rating/recFeedbackService', () => ({
  fetchRecFeedback: vi.fn(async () => [...taste.blocked].map((id) => ({ id, type: 'series' }))),
}));
vi.mock('../../services/taste/friendPicks', () => ({
  fetchFriendPicks: vi.fn(async () => ({ picks: new Map(), declined: new Set() })),
}));
vi.mock('../../services/profile/interestsService', () => ({
  fetchInterests: vi.fn(async () => []),
}));
vi.mock('../../services/catalog/staticCatalog', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  fetchStaticInterestTags: vi.fn(async () => null),
  fetchStaticCommunityRatings: vi.fn(async () => null),
  fetchStaticCatalogSeries: vi.fn(async () => null),
  fetchStaticCatalogMovies: vi.fn(async () => null),
}));

// fetch helper
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
    taste.blocked = new Set();
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
    ctx.seriesList = [{ id: 100, title: 'A', rating: { Drama: 9 } } as unknown as Series];
    stubFetch(() =>
      jsonOk({
        results: [
          { id: 500, vote_average: 8, poster_path: '/p.jpg' },
          { id: 100, vote_average: 7, poster_path: '/p.jpg' },
        ],
      })
    );
    const { result } = render({ activeCategory: 'recommendations' });
    await act(async () => {
      await result.current.fetchRecommendations(true);
    });
    expect(result.current.recommendations.map((r) => r.id)).toEqual([500]);
    expect(result.current.recommendations[0].basedOn).toBe('A');
    expect(result.current.recommendations[0].type).toBe('series');
    // only owned source exhausted → no more
    expect(result.current.recommendationsHasMore).toBe(false);
  });

  it('fetchRecommendations asks every liked title and skips disliked and blocked ones', async () => {
    ctx.seriesList = [
      { id: 100, title: 'A', rating: { Drama: 10 } },
      { id: 101, title: 'B', rating: { Drama: 9 } },
      { id: 102, title: 'C', rating: { Drama: 2 } },
    ] as unknown as Series[];
    taste.blocked = new Set([501]);
    const fetchMock = stubFetch(() =>
      jsonOk({
        results: [
          { id: 500, vote_average: 8, poster_path: '/p.jpg' },
          { id: 501, vote_average: 8, poster_path: '/p.jpg' },
        ],
      })
    );
    const { result } = render({ activeCategory: 'recommendations' });
    await act(async () => {
      await result.current.fetchRecommendations(true);
    });
    const asked = fetchMock.mock.calls.map(([url]) => new URL(url).pathname);
    expect(asked.sort()).toEqual(['/3/tv/100/recommendations', '/3/tv/101/recommendations']);
    expect(result.current.recommendations.map((r) => r.id)).toEqual([500]);
    expect(result.current.recommendations[0].basedOn).toBe('A');
    expect(result.current.recommendations[0].basedOnMore).toBe('B');
  });

  it('sorts a browse page by taste and explains the match', async () => {
    ctx.seriesList = [
      {
        id: 100,
        title: 'A',
        genre: { genres: ['Drama'] },
        rating: { Drama: 10 },
      } as unknown as Series,
    ];
    stubFetch((url) =>
      url.includes('/recommendations')
        ? jsonOk({ results: [{ id: 202, poster_path: '/p.jpg' }] })
        : jsonOk({
            results: [
              { id: 201, genre_ids: [27], vote_average: 7 },
              { id: 202, genre_ids: [18], vote_average: 7 },
            ],
            total_pages: 1,
          })
    );
    const { result } = render();
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    expect(result.current.results.map((r) => r.id)).toEqual([202, 201]);
    expect(result.current.results[0].basedOn).toBe('A');
    expect(result.current.results[0].match).toBeGreaterThan(result.current.results[1].match ?? 0);
  });

  it('applies the view filters and keeps loading pages until enough titles pass', async () => {
    const fetchMock = stubFetch((url) => {
      const page = new URL(url).searchParams.get('page');
      return page === '1'
        ? jsonOk({
            results: [
              { id: 401, genre_ids: [16], original_language: 'ja' },
              { id: 402, genre_ids: [18] },
            ],
            total_pages: 2,
          })
        : jsonOk({ results: [{ id: 403, genre_ids: [18] }], total_pages: 2 });
    });
    const extras = {
      viewFilters: {
        only: [] as string[],
        hide: ['anime'],
        eras: [],
        minRating: 0,
        minMatch: 0,
      },
      ownProviders: new Set<string>(),
      readsManga: false,
    };
    const { result } = renderHook(() =>
      useDiscoverFetch('series', 'trending', null, false, '', true, false, new Set(), extras)
    );
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    expect(result.current.results.map((r) => r.id)).toEqual([402, 403]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('asks TMDB discover for the wanted genres and still drops hidden anime', async () => {
    const fetchMock = stubFetch(() =>
      jsonOk({
        results: [
          { id: 501, genre_ids: [35, 18] },
          { id: 502, genre_ids: [16, 35, 18], original_language: 'ja' },
        ],
        total_pages: 1,
      })
    );
    const extras = {
      viewFilters: {
        only: ['comedy', 'drama'],
        hide: ['anime'],
        eras: [],
        minRating: 0,
        minMatch: 0,
      },
      ownProviders: new Set<string>(),
      readsManga: false,
    };
    const { result } = renderHook(() =>
      useDiscoverFetch('movies', 'popular', null, false, '', true, false, new Set(), extras)
    );
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/3/discover/movie');
    expect(url.searchParams.get('with_genres')).toBe('35|18');
    expect(url.searchParams.get('sort_by')).toBe('popularity.desc');
    expect(result.current.results.map((r) => r.id)).toEqual([501]);
  });

  it('leaves browse pages untouched without a library', async () => {
    stubFetch(() => jsonOk({ results: [{ id: 301 }, { id: 302 }], total_pages: 1 }));
    const { result } = render();
    await act(async () => {
      await result.current.fetchFromTMDB(true);
    });
    expect(result.current.results.map((r) => r.id)).toEqual([301, 302]);
    expect(result.current.results[0].match).toBeUndefined();
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
