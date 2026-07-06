// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* ---------------------------------------------------------------------------
 * Mocks: firebase once, react-router, static catalog, useTheme (via
 * ThemeContext, für useResolvedTheme). Filter/Sort/Rating bleiben echt.
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

const cat = vi.hoisted(() => ({
  series: {} as Record<string, unknown> | null,
  movies: {} as Record<string, unknown> | null,
}));

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('react-router-dom', () => ({
  useParams: () => routing.params,
  useNavigate: () => routing.navigate,
}));
vi.mock('../../lib/staticCatalog', () => ({
  fetchStaticCatalogSeries: () => Promise.resolve(cat.series),
  fetchStaticCatalogMovies: () => Promise.resolve(cat.movies),
}));
// useResolvedTheme fängt einen throw ab → Fallback-Theme. Wir lassen es werfen.
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => {
    throw new Error('no provider');
  },
}));

import { usePublicProfileData } from './usePublicProfileData';

beforeEach(() => {
  fb.state.dataByPath = {};
  routing.params = {};
  routing.navigate.mockReset();
  cat.series = {};
  cat.movies = {};
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('usePublicProfileData', () => {
  it('nutzt das Fallback-Theme wenn kein ThemeProvider vorhanden ist', () => {
    const { result } = renderHook(() => usePublicProfileData());
    expect(result.current.currentTheme.primary).toContain('--theme-primary');
  });

  it('markiert Profil als nicht existent wenn der publicId-Lookup leer ist', async () => {
    routing.params = { publicId: 'abc' };
    fb.state.dataByPath['publicProfiles/abc'] = null;
    const { result } = renderHook(() => usePublicProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profileExists).toBe(false);
  });

  it('markiert Profil als nicht existent wenn isPublicProfile false ist', async () => {
    routing.params = { publicId: 'abc' };
    fb.state.dataByPath['publicProfiles/abc'] = { userId: 'u9' };
    fb.state.dataByPath['users/u9/isPublicProfile'] = false;
    const { result } = renderHook(() => usePublicProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profileExists).toBe(false);
  });

  it('lädt öffentliche Serien + Filme und mergt Katalog-Metadaten', async () => {
    routing.params = { publicId: 'pub1' };
    fb.state.dataByPath['publicProfiles/pub1'] = { userId: 'u1' };
    fb.state.dataByPath['users/u1/isPublicProfile'] = true;
    fb.state.dataByPath['users/u1/username'] = 'PublicBob';
    fb.state.dataByPath['users/u1/series'] = {
      '10': { rating: { Action: 9 } },
      '20': { rating: { Action: 4 } },
    };
    fb.state.dataByPath['users/u1/movies'] = { '30': { rating: { Drama: 7 } } };
    cat.series = { '10': { title: 'High', genres: ['Action'] }, '20': { title: 'Low' } };
    cat.movies = { '30': { title: 'Movie X' } };

    const { result } = renderHook(() => usePublicProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profileExists).toBe(true);
    expect(result.current.profileName).toBe('PublicBob');
    expect(result.current.ratedSeries.map((s) => s.title)).toEqual(['High', 'Low']);
    expect(result.current.ratedMovies[0].title).toBe('Movie X');
    // averageRating berücksichtigt Serien + Filme: (9 + 4 + 7)/3
    expect(result.current.averageRating).toBeCloseTo((9 + 4 + 7) / 3, 5);
    expect(result.current.itemsWithRatingCount).toBe(3);
  });

  it('navigiert bei Item-Klick zur Film-Detailseite', async () => {
    routing.params = { publicId: 'pub2' };
    fb.state.dataByPath['publicProfiles/pub2'] = { userId: 'u2' };
    fb.state.dataByPath['users/u2/isPublicProfile'] = true;
    fb.state.dataByPath['users/u2/displayName'] = 'D';
    fb.state.dataByPath['users/u2/series'] = null;
    fb.state.dataByPath['users/u2/movies'] = null;
    const { result } = renderHook(() => usePublicProfileData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.handleItemClick(
        { id: 77 } as (typeof result.current.ratedMovies)[number],
        'movie'
      )
    );
    expect(routing.navigate).toHaveBeenCalledWith('/movie/77');
  });
});
