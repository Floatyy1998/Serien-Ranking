// @vitest-environment jsdom
import { act, render, screen, cleanup } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedCacheResult } from '../hooks/data/firebaseCache/types';

const cacheResult = vi.hoisted(
  () =>
    ({
      data: {},
      loading: false,
      isSyncing: false,
      error: null,
      isStale: false,
      isOffline: false,
      lastUpdated: 0,
      refetch: vi.fn<() => Promise<void>>(async () => {}),
      clearCache: vi.fn<() => Promise<void>>(async () => {}),
    }) as EnhancedCacheResult<Record<string, unknown>>
);

vi.mock('../hooks/data/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => cacheResult,
}));

const authUser = vi.hoisted(() => ({ uid: 'u1' }));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: authUser }),
}));

const catalog = vi.hoisted(() => ({
  fetchStaticCatalogSeries: vi.fn<() => Promise<Record<string, unknown> | null>>(async () => ({})),
  fetchStaticCatalogSeriesFresh: vi.fn<() => Promise<Record<string, unknown> | null>>(
    async () => ({})
  ),
  fetchStaticCatalogSeasonsBulk: vi.fn<() => Promise<Record<string, unknown> | null>>(
    async () => ({})
  ),
  fetchStaticCatalogSeasonsBulkFresh: vi.fn<() => Promise<Record<string, unknown> | null>>(
    async () => ({})
  ),
  fetchStaticCatalogSeasons: vi.fn(async () => null),
  refreshCatalogNow: vi.fn(async () => true),
  claimFreshFetch: vi.fn(() => true),
  clearStaticCatalogCache: vi.fn(),
  subscribeCatalogChange: vi.fn(() => () => {}),
}));
vi.mock('../services/catalog/staticCatalog', () => catalog);

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
  vi.clearAllMocks();
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

describe('Detection beim Zurückholen der App', () => {
  const HintCount = () => {
    const { inactiveSeries } = useSeriesList();
    return <div data-testid="inactive">{inactiveSeries.length}</div>;
  };

  const setVisible = () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  afterEach(() => {
    vi.useRealTimers();
    cacheResult.data = {};
  });

  it('prüft nach langer Pause erneut und räumt erledigte Hinweise weg', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-06T09:00:00'));
    cacheResult.data = { '42': { rating: {}, watchlist: true } };
    catalog.fetchStaticCatalogSeries.mockResolvedValue({ '42': { title: 'Dark', poster: '' } });
    catalog.fetchStaticCatalogSeasonsBulk.mockResolvedValue({
      '42': { '0': { seasonNumber: 0, episodes: [{ id: 1, name: 'A', airDate: '2020-01-01' }] } },
    });
    const { runSequentialDetections } = await import('./seriesListDetection');
    const run = vi.mocked(runSequentialDetections);
    run.mockImplementationOnce(async (list, _uid, onUpdate) => {
      onUpdate({ inactiveSeries: list });
    });

    render(
      <SeriesListProvider>
        <HintCount />
      </SeriesListProvider>
    );
    await vi.waitFor(() => expect(screen.getByTestId('inactive').textContent).toBe('1'));
    expect(run).toHaveBeenCalledTimes(1);

    await act(async () => setVisible());
    expect(run).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-11-06T14:00:00'));
    await act(async () => setVisible());
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(screen.getByTestId('inactive').textContent).toBe('0'));
  });

  const mountWithSeries = async () => {
    cacheResult.data = { '42': { rating: {}, watchlist: true } };
    catalog.fetchStaticCatalogSeries.mockResolvedValue({ '42': { title: 'Dark', poster: '' } });
    catalog.fetchStaticCatalogSeasonsBulk.mockResolvedValue({
      '42': { '0': { seasonNumber: 0, episodes: [{ id: 1, name: 'A', airDate: '2020-01-01' }] } },
    });
    const { runSequentialDetections } = await import('./seriesListDetection');
    const run = vi.mocked(runSequentialDetections);
    render(
      <SeriesListProvider>
        <HintCount />
      </SeriesListProvider>
    );
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    return run;
  };

  it('prüft nach einem Staffel- oder Anbieter-Push sofort neu, ohne Wartezeit', async () => {
    const run = await mountWithSeries();
    const { requestHintRefresh } = await import('../services/notifications/hintRefresh');
    await act(async () => requestHintRefresh());
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    expect(catalog.refreshCatalogNow).toHaveBeenCalled();
  });

  it('prüft neu, wenn sich der Katalog ändert', async () => {
    const run = await mountWithSeries();
    const calls = catalog.subscribeCatalogChange.mock.calls as unknown as [() => void][];
    const onChange = calls[calls.length - 1]?.[0];
    await act(async () => onChange?.());
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(2));
  });
});

describe('refetchAfterAdd', () => {
  const grabbed: { fn: (id?: number) => Promise<void> } = { fn: async () => {} };
  const refetchAfterAdd = (id?: number) => grabbed.fn(id);
  const Grab = () => {
    const { refetchAfterAdd: fn } = useSeriesList();
    useEffect(() => {
      grabbed.fn = fn;
    }, [fn]);
    return null;
  };
  const mount = () =>
    render(
      <SeriesListProvider>
        <Grab />
      </SeriesListProvider>
    );

  it('holt die neue Serie über den Versions-Check, ohne Voll-Download ohne Cache', async () => {
    catalog.fetchStaticCatalogSeries.mockResolvedValue({ '42': { title: 'Neu' } });
    catalog.fetchStaticCatalogSeasonsBulk.mockResolvedValue({ '42': { '0': {} } });
    mount();
    await act(() => refetchAfterAdd(42));

    expect(catalog.refreshCatalogNow).toHaveBeenCalled();
    expect(catalog.fetchStaticCatalogSeriesFresh).not.toHaveBeenCalled();
    expect(catalog.fetchStaticCatalogSeasonsBulkFresh).not.toHaveBeenCalled();
  });

  it('fällt auf die Downloads ohne Cache zurück, wenn die Serie danach noch fehlt', async () => {
    catalog.fetchStaticCatalogSeries.mockResolvedValue({});
    catalog.fetchStaticCatalogSeasonsBulk.mockResolvedValue({});
    catalog.fetchStaticCatalogSeriesFresh.mockResolvedValue({ '42': { title: 'Neu' } });
    catalog.fetchStaticCatalogSeasonsBulkFresh.mockResolvedValue({ '42': { '0': {} } });
    mount();
    await act(() => refetchAfterAdd(42));

    expect(catalog.fetchStaticCatalogSeriesFresh).toHaveBeenCalledTimes(1);
    expect(catalog.fetchStaticCatalogSeasonsBulkFresh).toHaveBeenCalledTimes(1);
  });
});
