// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Movie } from '../../types/Movie';

const ctx = vi.hoisted(() => ({ movieList: [] as Movie[], loading: false }));
vi.mock('../../contexts/MovieListContext', () => ({ useMovieList: () => ctx }));

const tmdbFetch = vi.hoisted(() => vi.fn());
vi.mock('../../services/api/tmdbClient', () => ({ tmdbFetch }));
vi.mock('../../services/settings/region', () => ({ watchRegion: 'DE' }));
const catalogFetch = vi.hoisted(() => vi.fn());
vi.mock('../../services/catalog/staticCatalog', () => ({
  fetchStaticMovieReleases: catalogFetch,
  subscribeCatalogChange: () => () => {},
}));

import { resetMovieReleasesForTests } from '../../services/api/movieReleaseDates';
import { useMovieCountdowns } from './useMovieCountdowns';

const movie = (over: Partial<Movie> = {}): Movie =>
  ({
    id: 1,
    title: 'Film',
    poster: { poster: '' },
    rating: {},
    release_date: '2026-12-17',
    status: 'Post Production',
    ...over,
  }) as Movie;

const cinema = (date: string) => ({
  results: [
    { iso_3166_1: 'DE', release_dates: [{ type: 3, release_date: `${date}T00:00:00.000Z` }] },
  ],
});

const settle = () =>
  act(async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve();
  });

describe('useMovieCountdowns', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 19, 12));
    localStorage.clear();
    tmdbFetch.mockReset();
    catalogFetch.mockReset();
    catalogFetch.mockResolvedValue({});
    resetMovieReleasesForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
    ctx.movieList = [];
    ctx.loading = false;
  });

  it('zeigt sofort das Katalog-Datum und danach den regionalen Kinostart', async () => {
    tmdbFetch.mockResolvedValue(cinema('2026-12-10'));
    ctx.movieList = [movie({ id: 7, title: 'Dune' })];
    const { result } = renderHook(() => useMovieCountdowns());

    expect(result.current.countdowns).toMatchObject([
      { movieId: 7, nextDate: '2026-12-17', daysUntil: 28, release: 'unknown' },
    ]);

    await settle();
    expect(result.current.countdowns).toMatchObject([
      { movieId: 7, nextDate: '2026-12-10', daysUntil: 21, release: 'cinema' },
    ]);
    expect(result.current.loading).toBe(false);
  });

  it('findet Filme, die anderswo schon liefen, hier aber erst starten', async () => {
    tmdbFetch.mockResolvedValue(cinema('2026-11-26'));
    ctx.movieList = [movie({ id: 8, release_date: '2026-05-20', status: 'Released' })];
    const { result } = renderHook(() => useMovieCountdowns());

    expect(result.current.countdowns).toEqual([]);
    expect(result.current.loading).toBe(true);

    await settle();
    expect(result.current.countdowns).toMatchObject([{ movieId: 8, daysUntil: 7 }]);
  });

  it('nimmt Starttermine aus dem Katalog und fragt TMDB dann nicht', async () => {
    catalogFetch.mockResolvedValue({ 7: '2026-12-10|', 20: '2026-12-03|' });
    ctx.movieList = [
      movie({ id: 7, title: 'Dune' }),
      movie({ id: 20, title: 'Spätstarter', release_date: '2023-02-01', status: 'Released' }),
    ];
    const { result } = renderHook(() => useMovieCountdowns());
    await settle();

    expect(tmdbFetch).not.toHaveBeenCalled();
    expect(result.current.countdowns).toMatchObject([
      { movieId: 20, nextDate: '2026-12-03', daysUntil: 14, release: 'cinema' },
      { movieId: 7, nextDate: '2026-12-10', daysUntil: 21, release: 'cinema' },
    ]);
  });

  it('fragt für gesehene und alte Filme nichts ab', async () => {
    ctx.movieList = [
      movie({ id: 9, watched: true }),
      movie({ id: 10, release_date: '2019-01-01', status: 'Released' }),
    ];
    const { result } = renderHook(() => useMovieCountdowns());
    await settle();
    expect(tmdbFetch).not.toHaveBeenCalled();
    expect(result.current).toEqual({ countdowns: [], loading: false });
  });

  it('meldet loading, solange die Filmliste noch lädt', () => {
    ctx.loading = true;
    expect(renderHook(() => useMovieCountdowns()).result.current.loading).toBe(true);
  });

  it('bleibt ohne Netz beim Katalog-Datum und lädt nicht ewig', async () => {
    tmdbFetch.mockRejectedValue(new Error('offline'));
    ctx.movieList = [movie({ id: 11, release_date: '2026-05-20', status: 'Released' })];
    const { result } = renderHook(() => useMovieCountdowns());
    await settle();
    expect(result.current).toEqual({ countdowns: [], loading: false });
  });
});
