// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* ---------------------------------------------------------------------------
 * Mocks: firebase once('value'), react-router (useParams/useNavigate),
 * static catalog. Rating/Filter/Sort-Logik bleibt echt.
 * ------------------------------------------------------------------------- */
const fb = vi.hoisted(() => {
  const state = { dataByPath: {} as Record<string, unknown> };
  const makeRef = (path: string) => ({
    once: async (_e: string) => ({ val: () => state.dataByPath[path] ?? null }),
  });
  return { state, ref: (path: string) => makeRef(path) };
});

const routing = vi.hoisted(() => ({
  params: {} as Record<string, string | undefined>,
  navigate: vi.fn<(to: string) => void>(),
}));

const catalog = vi.hoisted(() => ({
  series: null as Record<string, unknown> | null,
  movies: null as Record<string, unknown> | null,
}));

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('react-router-dom', () => ({
  useParams: () => routing.params,
  useNavigate: () => routing.navigate,
}));
vi.mock('../../services/staticCatalog', () => ({
  fetchStaticCatalogSeries: () => Promise.resolve(catalog.series),
  fetchStaticCatalogMovies: () => Promise.resolve(catalog.movies),
}));

import { useFriendProfileData } from './useFriendProfileData';

beforeEach(() => {
  fb.state.dataByPath = {};
  routing.params = {};
  routing.navigate.mockReset();
  catalog.series = {};
  catalog.movies = {};
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useFriendProfileData', () => {
  it('lädt ohne friendId keine Daten (Guard bleibt im Loading)', () => {
    const { result } = renderHook(() => useFriendProfileData());
    expect(result.current.friendId).toBeUndefined();
    expect(result.current.friendName).toBe('');
    expect(result.current.ratedSeries).toEqual([]);
    expect(result.current.ratedMovies).toEqual([]);
  });

  it('lädt Freundes-Serien + Filme und mergt Katalog-Metadaten', async () => {
    routing.params = { id: 'u1' };
    fb.state.dataByPath['users/u1/displayName'] = 'Alice';
    fb.state.dataByPath['users/u1/series'] = {
      '10': { rating: { Action: 8 }, addedAt: 2 },
      '20': { rating: { Action: 5 }, addedAt: 1 },
    };
    fb.state.dataByPath['users/u1/movies'] = { '30': { rating: { Drama: 9 } } };
    catalog.series = {
      '10': { title: 'Show A', genres: ['Action'], poster: 'a.jpg', status: 'Ended' },
      '20': { title: 'Show B', genres: ['Action'], poster: 'b.jpg' },
    };
    catalog.movies = { '30': { title: 'Film C', genres: ['Drama'], poster: 'c.jpg' } };

    const { result } = renderHook(() => useFriendProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.friendName).toBe('Alice');
    expect(result.current.ratedSeries).toHaveLength(2);
    expect(result.current.ratedMovies).toHaveLength(1);
    // rating-desc default: Show A (8) vor Show B (5)
    expect(result.current.ratedSeries.map((s) => s.title)).toEqual(['Show A', 'Show B']);
    expect(result.current.ratedMovies[0].title).toBe('Film C');
  });

  it('fällt bei fehlendem displayName auf "User" zurück', async () => {
    routing.params = { id: 'u2' };
    fb.state.dataByPath['users/u2/series'] = {};
    fb.state.dataByPath['users/u2/movies'] = {};
    const { result } = renderHook(() => useFriendProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.friendName).toBe('User');
  });

  it('berechnet Durchschnitts-Rating + Anzahl bewerteter Items des aktiven Tabs', async () => {
    routing.params = { id: 'u3' };
    fb.state.dataByPath['users/u3/displayName'] = 'Bob';
    fb.state.dataByPath['users/u3/series'] = {
      '1': { rating: { Action: 8 } },
      '2': { rating: { Action: 6 } },
      '3': { rating: {} }, // unbewertet
    };
    fb.state.dataByPath['users/u3/movies'] = {};
    catalog.series = {
      '1': { title: 'One' },
      '2': { title: 'Two' },
      '3': { title: 'Three' },
    };
    const { result } = renderHook(() => useFriendProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.itemsWithRatingCount).toBe(2);
    expect(result.current.averageRating).toBeCloseTo(7, 5);
  });

  it('filtert per Such-Filter und wechselt currentItems mit dem Tab', async () => {
    routing.params = { id: 'u4' };
    fb.state.dataByPath['users/u4/displayName'] = 'Carol';
    fb.state.dataByPath['users/u4/series'] = { '1': { rating: { A: 7 } } };
    fb.state.dataByPath['users/u4/movies'] = { '9': { rating: { A: 7 } } };
    catalog.series = { '1': { title: 'Breaking Bad' } };
    catalog.movies = { '9': { title: 'Inception' } };
    const { result } = renderHook(() => useFriendProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentItems).toHaveLength(1);
    act(() => result.current.setFilters({ search: 'zzz' }));
    expect(result.current.ratedSeries).toHaveLength(0);

    act(() => result.current.setFilters({}));
    act(() => result.current.setActiveTab('movies'));
    expect(result.current.currentItems[0].title).toBe('Inception');
  });

  it('navigiert bei Item-Klick zur Detailseite und zu Taste-Match', async () => {
    routing.params = { id: 'u5' };
    fb.state.dataByPath['users/u5/displayName'] = 'Dave';
    fb.state.dataByPath['users/u5/series'] = {};
    fb.state.dataByPath['users/u5/movies'] = {};
    const { result } = renderHook(() => useFriendProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.handleItemClick(
        { id: 42 } as (typeof result.current.ratedSeries)[number],
        'series'
      )
    );
    expect(routing.navigate).toHaveBeenCalledWith('/series/42');

    act(() => result.current.navigateToTasteMatch());
    expect(routing.navigate).toHaveBeenCalledWith('/taste-match/u5');
  });
});
