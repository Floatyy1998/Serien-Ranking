// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import type * as PathsModule from '../../services/db/paths';
import { useSearchPage } from './useSearchPage';
import { clearProviderCache } from '../Discover/watchProviderFilter';

// router mock
const router = vi.hoisted(() => ({
  params: new URLSearchParams(),
  setParams: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [router.params, router.setParams] as const,
  useNavigate: () => router.navigate,
}));

// contexts / libs
const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  movieList: [] as Movie[],
  user: { uid: 'u1' } as { uid: string } | null,
  isDesktop: true,
  refetchAfterAdd: vi.fn(async () => {}),
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({
    allSeriesList: ctx.seriesList,
    seriesList: ctx.seriesList,
    refetchAfterAdd: ctx.refetchAfterAdd,
  }),
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
const logRatingAdded = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logSeriesAdded: (...a: unknown[]) => logSeriesAdded(...a),
  logMovieAdded: (...a: unknown[]) => logMovieAdded(...a),
  logRatingAdded: (...a: unknown[]) => logRatingAdded(...a),
}));

// RTDB-Writes (Gesehen-Status + Schnellbewertung)
const db = vi.hoisted(() => ({
  set: vi.fn(async () => {}),
  updateWithSeriesVersion: vi.fn<(...a: unknown[]) => Promise<void>>(async () => {}),
  lastSetPath: '' as string,
}));
vi.mock('../../services/db/ref', async () => {
  const { paths } = await vi.importActual<typeof PathsModule>('../../services/db/paths');
  return {
    paths,
    dbRef: (path: string) => {
      db.lastSetPath = path;
      return { set: db.set };
    },
    updateWithSeriesVersion: (...a: unknown[]) => db.updateWithSeriesVersion(...a),
  };
});
const trackRatingSaved = vi.fn();
vi.mock('../../services/firebase/analytics', () => ({
  trackRatingSaved: (...a: unknown[]) => trackRatingSaved(...a),
}));
const logMovieWatch = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../services/watchActivityService', () => ({
  WatchActivityService: { logMovieWatch: (...a: unknown[]) => logMovieWatch(...a) },
}));

// fetch fixtures
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
    logRatingAdded.mockClear();
    db.set.mockClear();
    db.updateWithSeriesVersion.mockClear();
    db.lastSetPath = '';
    trackRatingSaved.mockClear();
    logMovieWatch.mockClear();
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
    expect(owned?.userRating).toBe(0);
    expect(result.current.searchResults.find((r) => r.id === 101)?.inList).toBe(false);
  });

  it('derives the own rating and the watched flag from the owned movie', async () => {
    ctx.movieList = [
      { id: 200, rating: { Action: 8, Thriller: 9 } } as unknown as Movie,
      { id: 201, rating: {}, watched: true } as unknown as Movie,
    ];
    stubFetch((url) =>
      url.includes('/search/movie')
        ? jsonOk({
            results: [
              { id: 200, title: 'Sicario', popularity: 95 },
              { id: 201, title: 'Heat', popularity: 90 },
              { id: 202, title: 'Drive', popularity: 80 },
            ],
          })
        : jsonOk({ results: [] })
    );
    const { result } = renderHook(() => useSearchPage());
    act(() => result.current.setSearchType('movies'));
    act(() => result.current.setSearchQuery('heat'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    const byId = (id: number) => result.current.searchResults.find((r) => r.id === id);
    expect(byId(200)).toMatchObject({ inList: true, userRating: 8.5, watched: true });
    expect(byId(201)).toMatchObject({ inList: true, userRating: 0, watched: true });
    expect(byId(202)).toMatchObject({ inList: false, userRating: 0, watched: false });
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
    expect(ctx.refetchAfterAdd).toHaveBeenCalledWith(100);
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

  it('markWatched adds a missing movie, writes the watched flag and opens the quick rating', async () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    await act(async () => {
      await result.current.markWatched({ id: 200, type: 'movie', title: 'Sicario', inList: false });
    });
    expect(backendFetch).toHaveBeenCalledWith(
      '/addMovie',
      expect.objectContaining({ method: 'POST' })
    );
    expect(logMovieAdded).toHaveBeenCalled();
    expect(db.updateWithSeriesVersion).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        'users/u1/movies/200/watched': true,
        'users/u1/movies/200/watchedAt': expect.any(String),
      })
    );
    expect(result.current.quickRating).toMatchObject({
      open: true,
      title: 'Sicario',
      afterWatched: true,
      initialRating: 0,
    });
    expect(result.current.pendingWatchedIds.has('movie-200')).toBe(false);
  });

  it('markWatched skips the backend add when the movie is already in the list', async () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    await act(async () => {
      await result.current.markWatched({ id: 200, type: 'movie', title: 'Sicario', inList: true });
    });
    expect(backendFetch).not.toHaveBeenCalled();
    expect(db.updateWithSeriesVersion).toHaveBeenCalledTimes(1);
    expect(result.current.quickRating.open).toBe(true);
  });

  it('markWatched shows an error and keeps the sheet closed when the add fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    backendFetch.mockResolvedValue({ ok: false });
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    await act(async () => {
      await result.current.markWatched({ id: 200, type: 'movie', title: 'Sicario', inList: false });
    });
    expect(db.updateWithSeriesVersion).not.toHaveBeenCalled();
    expect(result.current.quickRating.open).toBe(false);
    expect(result.current.dialog).toMatchObject({ open: true, type: 'error' });
  });

  it('markWatched ignores series', async () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    await act(async () => {
      await result.current.markWatched({ id: 100, type: 'series', name: 'Dark', inList: false });
    });
    expect(backendFetch).not.toHaveBeenCalled();
    expect(db.updateWithSeriesVersion).not.toHaveBeenCalled();
  });

  it('saveQuickRating writes a genre-keyed series rating and logs the activity', async () => {
    ctx.seriesList = [
      {
        id: 100,
        title: 'Breaking Bad',
        genre: { genres: ['Drama', 'Krimi'] },
        rating: {},
      } as Series,
    ];
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    act(() =>
      result.current.openQuickRating({
        id: 100,
        type: 'series',
        name: 'Breaking Bad',
        inList: true,
      })
    );
    expect(result.current.quickRating).toMatchObject({
      open: true,
      title: 'Breaking Bad',
      afterWatched: false,
    });
    await act(async () => {
      await result.current.saveQuickRating(9);
    });
    expect(db.lastSetPath).toBe('users/u1/series/100/rating');
    expect(db.set).toHaveBeenCalledWith({ Drama: 9, Krimi: 9 });
    expect(db.updateWithSeriesVersion).not.toHaveBeenCalled();
    expect(trackRatingSaved).toHaveBeenCalledWith('100', 'series', 9);
    expect(logRatingAdded).toHaveBeenCalledWith('u1', 'Breaking Bad', 'series', 9, 100);
    expect(result.current.quickRating.open).toBe(false);
    expect(result.current.snackbar.open).toBe(true);
  });

  it('saveQuickRating writes the movie rating, watched flag and wrapped event atomically', async () => {
    ctx.movieList = [
      {
        id: 200,
        title: 'Sicario',
        genre: { genres: ['Thriller'] },
        rating: {},
        runtime: 121,
        watchedAt: '2026-01-01T00:00:00.000Z',
      } as unknown as Movie,
    ];
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    act(() =>
      result.current.openQuickRating({ id: 200, type: 'movie', title: 'Sicario', inList: true })
    );
    await act(async () => {
      await result.current.saveQuickRating(7);
    });
    expect(db.set).not.toHaveBeenCalled();
    expect(db.updateWithSeriesVersion).toHaveBeenCalledWith('u1', {
      'users/u1/movies/200/rating': { Thriller: 7 },
      'users/u1/movies/200/ratedAt': expect.any(String),
      'users/u1/movies/200/watched': true,
      'users/u1/movies/200/watchedAt': '2026-01-01T00:00:00.000Z',
    });
    expect(logMovieWatch).toHaveBeenCalledWith(
      'u1',
      200,
      'Sicario',
      121,
      7,
      ['Thriller'],
      undefined
    );
    expect(logRatingAdded).toHaveBeenCalledWith('u1', 'Sicario', 'movie', 7, 200);
  });

  it('saveQuickRating falls back to a General rating when the title has no genres yet', async () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    act(() =>
      result.current.openQuickRating({ id: 300, type: 'movie', title: 'Neu', inList: true })
    );
    await act(async () => {
      await result.current.saveQuickRating(6);
    });
    expect(db.updateWithSeriesVersion).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ 'users/u1/movies/300/rating': { General: 6 } })
    );
  });

  it('closeQuickRating and a zero rating never write', async () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    act(() =>
      result.current.openQuickRating({ id: 100, type: 'series', name: 'Dark', inList: true })
    );
    act(() => result.current.closeQuickRating());
    expect(result.current.quickRating.open).toBe(false);
    act(() =>
      result.current.openQuickRating({ id: 100, type: 'series', name: 'Dark', inList: true })
    );
    await act(async () => {
      await result.current.saveQuickRating(0);
    });
    expect(db.set).not.toHaveBeenCalled();
    expect(db.updateWithSeriesVersion).not.toHaveBeenCalled();
    expect(result.current.quickRating.open).toBe(false);
  });

  it('opens the sheet with the exact own rating instead of a rounded one', () => {
    stubFetch(() => jsonOk({ results: [] }));
    const { result } = renderHook(() => useSearchPage());
    act(() =>
      result.current.openQuickRating({
        id: 7,
        type: 'movie',
        title: 'Die Odyssee',
        inList: true,
        userRating: 8.4,
      })
    );
    expect(result.current.quickRating.initialRating).toBe(8.4);
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
