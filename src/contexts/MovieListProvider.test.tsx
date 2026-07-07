// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedCacheResult } from '../hooks/firebaseCache/types';

const cacheResult = vi.hoisted(
  () =>
    ({
      data: {},
      loading: false,
      error: null,
      isStale: false,
      isOffline: false,
      lastUpdated: 0,
      refetch: vi.fn<() => Promise<void>>(async () => {}),
      clearCache: vi.fn<() => Promise<void>>(async () => {}),
    }) as EnhancedCacheResult<Record<string, unknown>>
);

vi.mock('../hooks/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => cacheResult,
}));

const authUser = vi.hoisted(() => ({ uid: 'u1' }));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('../services/staticCatalog', () => ({
  fetchStaticCatalogMovies: vi.fn(async () => ({})),
  fetchStaticCatalogMoviesFresh: vi.fn(async () => ({})),
  clearStaticCatalogCache: vi.fn(),
  subscribeCatalogChange: vi.fn(() => () => {}),
}));

import { MovieListProvider } from './MovieListProvider';
import { useMovieList } from './MovieListContext';

const Consumer = () => {
  const { movieList, loading } = useMovieList();
  return <div data-testid="movies">{`${movieList.length}|${String(loading)}`}</div>;
};

afterEach(() => {
  cleanup();
});

describe('MovieListProvider', () => {
  it('mounts, exposes the movie context and renders children', () => {
    render(
      <MovieListProvider>
        <Consumer />
      </MovieListProvider>
    );
    expect(screen.getByTestId('movies').textContent).toBe('0|false');
  });
});
