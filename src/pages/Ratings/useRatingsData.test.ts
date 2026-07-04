// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { useRatingsData } from './useRatingsData';

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

// ── contexts ──────────────────────────────────────────────────────────
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

const preloadImage = vi.fn();
vi.mock('../../lib/preloadImage', () => ({ preloadImage: (u?: string) => preloadImage(u) }));

// ── fixtures ──────────────────────────────────────────────────────────
type Episode = Series['seasons'][number]['episodes'][number];
const airedEp = (o: Partial<Episode> & { id: number }): Episode =>
  ({ air_date: '2020-01-01', watched: false, episode_number: o.id, ...o }) as Episode;

const mkSeries = (o: Partial<Series> & { id: number }): Series =>
  ({
    title: `Series ${o.id}`,
    seasons: [],
    rating: {},
    genre: { genres: [] },
    provider: { provider: [] },
    poster: { poster: '/p.jpg' },
    ...o,
  }) as unknown as Series;

const mkMovie = (o: Partial<Movie> & { id: number }): Movie =>
  ({
    title: `Movie ${o.id}`,
    rating: {},
    genre: { genres: [] },
    provider: { provider: [] },
    poster: { poster: '/p.jpg' },
    ...o,
  }) as unknown as Movie;

// rating uses a per-user map keyed by uid; overall = mean of positive values.
const seriesRated9 = mkSeries({
  id: 1,
  title: 'Alpha',
  rating: { u1: 9 } as unknown as Series['rating'],
  genre: { genres: ['Drama'] },
  provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] },
  seasons: [
    { seasonNumber: 0, episodes: [airedEp({ id: 1, watched: true }), airedEp({ id: 2 })] },
  ] as Series['seasons'],
  watchlist: true,
  status: 'Returning Series',
});
const seriesUnrated = mkSeries({
  id: 2,
  title: 'Bravo',
  rating: {} as unknown as Series['rating'],
  genre: { genres: ['Comedy'] },
  seasons: [{ seasonNumber: 0, episodes: [airedEp({ id: 3 })] }] as Series['seasons'],
  status: 'Ended',
});
const seriesRated5 = mkSeries({
  id: 3,
  title: 'Charlie',
  rating: { u1: 5 } as unknown as Series['rating'],
  genre: { genres: ['Drama'] },
});

const movieRated8 = mkMovie({
  id: 10,
  title: 'Zulu',
  rating: { u1: 8 } as unknown as Movie['rating'],
  watchlist: true,
});
const movieUnrated = mkMovie({ id: 11, title: 'Yankee', rating: {} as unknown as Movie['rating'] });

describe('useRatingsData', () => {
  beforeEach(() => {
    router.params = new URLSearchParams();
    router.setParams.mockReset();
    router.navigate.mockReset();
    preloadImage.mockReset();
    ctx.user = { uid: 'u1' };
    ctx.seriesList = [seriesRated9, seriesUnrated, seriesRated5];
    ctx.movieList = [movieRated8, movieUnrated];
  });
  afterEach(() => cleanup());

  it('initializes state from URL params', () => {
    router.params = new URLSearchParams('tab=movies&sort=name-asc&genre=Drama&filter=unrated');
    const { result } = renderHook(() => useRatingsData());
    expect(result.current.activeTab).toBe('movies');
    expect(result.current.filters.sortBy).toBe('name-asc');
    expect(result.current.filters.genre).toBe('Drama');
    expect(result.current.filters.quickFilter).toBe('unrated');
  });

  it('sorts series by rating desc by default and computes counts', () => {
    const { result } = renderHook(() => useRatingsData());
    expect(result.current.currentItems.map((i) => i.id)).toEqual([1, 3, 2]);
    expect(result.current.seriesCount).toBe(3);
    expect(result.current.moviesCount).toBe(2);
  });

  it('computes rating stats over rated items only', () => {
    const { result } = renderHook(() => useRatingsData());
    expect(result.current.stats.count).toBe(2);
    expect(result.current.stats.average).toBeCloseTo(7, 5); // (9 + 5) / 2
  });

  it('switches tab (movies) and updates URL', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleTabChange('movies'));
    expect(result.current.activeTab).toBe('movies');
    expect(result.current.currentItems.map((i) => i.id)).toEqual([10, 11]);
    expect(router.setParams).toHaveBeenCalled();
  });

  it('filters by genre (OR multi-select)', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleQuickFilterChange({ genre: 'Drama' }));
    expect(result.current.currentItems.map((i) => i.id)).toEqual([1, 3]);
  });

  it('filters by provider', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleQuickFilterChange({ provider: 'Netflix' }));
    expect(result.current.currentItems.map((i) => i.id)).toEqual([1]);
  });

  it('applies the search filter (case-insensitive title match)', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleQuickFilterChange({ search: 'alph' }));
    expect(result.current.currentItems.map((i) => i.id)).toEqual([1]);
  });

  it('quickFilter=unrated keeps only rating-0 items', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleQuickFilterChange({ quickFilter: 'unrated' }));
    expect(result.current.currentItems.map((i) => i.id)).toEqual([2]);
  });

  it('quickFilter=watchlist keeps only watchlisted items', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleQuickFilterChange({ quickFilter: 'watchlist' }));
    expect(result.current.currentItems.map((i) => i.id)).toEqual([1]);
  });

  it('quickFilter=started keeps series with partial progress', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleQuickFilterChange({ quickFilter: 'started' }));
    // seriesRated9 has 1/2 aired watched → 50 % progress
    expect(result.current.currentItems.map((i) => i.id)).toEqual([1]);
  });

  it('quickFilter=ongoing forces rating-desc and keeps returning series', () => {
    const { result } = renderHook(() => useRatingsData());
    act(() => result.current.handleQuickFilterChange({ quickFilter: 'ongoing' }));
    expect(result.current.currentItems.map((i) => i.id)).toEqual([1]);
  });

  it('handleGridClick preloads poster, saves scroll and navigates', () => {
    const { result } = renderHook(() => useRatingsData());
    const grid = document.createElement('div');
    const item = document.createElement('div');
    item.className = 'ratings-grid-item';
    item.dataset.id = '42';
    item.dataset.poster = '/x.jpg';
    grid.appendChild(item);
    document.body.appendChild(grid);

    act(() => {
      result.current.handleGridClick({
        target: item,
      } as unknown as React.MouseEvent);
    });
    expect(preloadImage).toHaveBeenCalledWith('/x.jpg');
    expect(router.navigate).toHaveBeenCalledWith('/series/42');
    document.body.removeChild(grid);
  });

  it('handleGridClick routes movies via the data-movie flag', () => {
    const { result } = renderHook(() => useRatingsData());
    const grid = document.createElement('div');
    const item = document.createElement('div');
    item.className = 'ratings-grid-item';
    item.dataset.id = '9';
    item.dataset.movie = '';
    grid.appendChild(item);
    document.body.appendChild(grid);
    act(() => {
      result.current.handleGridClick({ target: item } as unknown as React.MouseEvent);
    });
    expect(router.navigate).toHaveBeenCalledWith('/movie/9');
    document.body.removeChild(grid);
  });

  it('exposes the user (null when unauthenticated)', () => {
    ctx.user = null;
    const { result } = renderHook(() => useRatingsData());
    expect(result.current.user).toBeNull();
  });
});
