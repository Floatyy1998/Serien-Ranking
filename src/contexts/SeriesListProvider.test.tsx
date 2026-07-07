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
  fetchStaticCatalogSeries: vi.fn(async () => ({})),
  fetchStaticCatalogSeriesFresh: vi.fn(async () => ({})),
  fetchStaticCatalogSeasonsBulk: vi.fn(async () => ({})),
  clearStaticCatalogCache: vi.fn(),
  subscribeCatalogChange: vi.fn(() => () => {}),
}));

vi.mock('./seriesListDetection', () => ({
  runSequentialDetections: vi.fn(async () => {}),
  fixMissingFirstWatchedAt: vi.fn(),
}));

vi.mock('../services/firebase/seriesVersionBump', () => ({
  bumpSeriesVersion: vi.fn(),
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({ set: async () => {}, remove: async () => {} }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

import { SeriesListProvider } from './SeriesListProvider';
import { useSeriesList } from './SeriesListContext';

const Consumer = () => {
  const { seriesList, loading } = useSeriesList();
  return <div data-testid="series">{`${seriesList.length}|${String(loading)}`}</div>;
};

afterEach(() => {
  cleanup();
});

describe('SeriesListProvider', () => {
  it('mounts, exposes the series-list context and renders children', () => {
    render(
      <SeriesListProvider>
        <Consumer />
      </SeriesListProvider>
    );
    expect(screen.getByTestId('series').textContent).toBe('0|false');
  });
});
