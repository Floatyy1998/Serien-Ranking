import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  catalog: null as Record<string, { production?: boolean }> | null,
  card: vi.fn(),
}));

vi.mock('./staticCatalog', () => ({ fetchStaticCatalogSeries: async () => state.catalog }));
vi.mock('./itemProviders', () => ({ fetchTmdbSeriesCard: state.card }));

import { clearSeriesAiringCache, fetchSeriesAiring, getCachedSeriesAiring } from './seriesAiring';

beforeEach(() => {
  clearSeriesAiringCache();
  state.catalog = null;
  state.card.mockReset();
});

describe('seriesAiring', () => {
  it('liest Katalog-Serien ohne TMDB-Anfrage', async () => {
    state.catalog = { '1': { production: true }, '2': { production: false } };
    await expect(fetchSeriesAiring(1)).resolves.toBe('ongoing');
    await expect(fetchSeriesAiring(2)).resolves.toBe('ended');
    expect(state.card).not.toHaveBeenCalled();
  });

  it('nimmt für alle anderen den TMDB-Status', async () => {
    state.card.mockResolvedValueOnce({ status: 'Ended', inProduction: false, providers: [] });
    await expect(fetchSeriesAiring(10)).resolves.toBe('ended');
    state.card.mockResolvedValueOnce({ status: 'Canceled', providers: [] });
    await expect(fetchSeriesAiring(11)).resolves.toBe('ended');
    state.card.mockResolvedValueOnce({ status: 'Returning Series', providers: [] });
    await expect(fetchSeriesAiring(12)).resolves.toBe('ongoing');
  });

  it('zeigt nichts für Serien, die noch gar nicht gestartet sind', async () => {
    state.card.mockResolvedValueOnce({
      status: 'In Production',
      inProduction: true,
      providers: [],
    });
    await expect(fetchSeriesAiring(20)).resolves.toBeNull();
    state.card.mockResolvedValueOnce({ status: 'Planned', inProduction: true, providers: [] });
    await expect(fetchSeriesAiring(21)).resolves.toBeNull();
  });

  it('merkt sich Ergebnisse, aber keine Fehlschläge', async () => {
    expect(getCachedSeriesAiring(30)).toBeUndefined();
    state.card.mockRejectedValueOnce(new Error('offline'));
    await expect(fetchSeriesAiring(30)).resolves.toBeNull();
    expect(getCachedSeriesAiring(30)).toBeUndefined();

    state.card.mockResolvedValueOnce({ status: 'Ended', providers: [] });
    await fetchSeriesAiring(30);
    await fetchSeriesAiring(30);
    expect(getCachedSeriesAiring(30)).toBe('ended');
    expect(state.card).toHaveBeenCalledTimes(2);
  });
});
