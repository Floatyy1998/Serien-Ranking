import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const catalog = vi.hoisted(() => ({
  series: null as Record<string, { providers: { name: string; logo: string }[] }> | null,
  movies: null as Record<string, { providers: { name: string; logo: string }[] }> | null,
  region: 'DE',
}));

vi.mock('./staticCatalog', () => ({
  fetchStaticCatalogSeries: async () => catalog.series,
  fetchStaticCatalogMovies: async () => catalog.movies,
}));
vi.mock('./region', () => ({
  get watchRegion() {
    return catalog.region;
  },
  pickProviderRegion: (results?: Record<string, unknown>) => results?.[catalog.region],
}));

import {
  clearItemProviderCache,
  fetchItemProviderDetails,
  getCachedItemProviders,
} from './itemProviders';

type FetchResult = { ok: boolean; json: () => Promise<unknown> };
const jsonOk = (body: unknown): FetchResult => ({ ok: true, json: async () => body });

function stubFetch(handler: (url: string) => FetchResult) {
  const fetchMock = vi.fn(async (url: string) => handler(url));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const flatrate = (...providers: { provider_name: string; logo_path?: string }[]) => ({
  results: { DE: { flatrate: providers } },
});

const NETFLIX = { provider_name: 'Netflix', logo_path: '/nf.jpg' };

beforeEach(() => {
  clearItemProviderCache();
  catalog.series = null;
  catalog.movies = null;
  catalog.region = 'DE';
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('itemProviders', () => {
  it('nimmt die Provider aus dem statischen Katalog, ohne TMDB zu fragen', async () => {
    catalog.series = {
      '5': {
        providers: [
          { name: 'Netflix', logo: 'https://img/nf.jpg' },
          { name: 'Wow Fiction Amazon Channel', logo: 'https://img/ch.jpg' },
          { name: 'Netflix Standard with Ads', logo: 'https://img/nf2.jpg' },
        ],
      },
    };
    const fetchMock = stubFetch(() => jsonOk({}));
    await expect(fetchItemProviderDetails('series', 5)).resolves.toEqual([
      { name: 'Netflix', logo: 'https://img/nf.jpg' },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fällt auf TMDB zurück, wenn der Titel nicht im Katalog steht', async () => {
    catalog.movies = { '1': { providers: [] } };
    stubFetch(() => jsonOk(flatrate(NETFLIX, { provider_name: 'Disney+', logo_path: '/d.jpg' })));
    await expect(fetchItemProviderDetails('movie', 99)).resolves.toEqual([
      { name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/nf.jpg' },
      { name: 'Disney Plus', logo: 'https://image.tmdb.org/t/p/w92/d.jpg' },
    ]);
  });

  it('wertet einen leeren Katalog-Eintrag in DE als Antwort, sonst nicht', async () => {
    catalog.series = { '7': { providers: [] } };
    const deFetch = stubFetch(() => jsonOk(flatrate(NETFLIX)));
    await expect(fetchItemProviderDetails('series', 7)).resolves.toEqual([]);
    expect(deFetch).not.toHaveBeenCalled();

    clearItemProviderCache();
    catalog.region = 'US';
    stubFetch(() => jsonOk({ results: { US: { flatrate: [NETFLIX] } } }));
    await expect(fetchItemProviderDetails('series', 7)).resolves.toEqual([
      { name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/nf.jpg' },
    ]);
  });

  it('cached das Ergebnis und liefert es synchron nach', async () => {
    const fetchMock = stubFetch(() => jsonOk(flatrate(NETFLIX)));
    expect(getCachedItemProviders('series', 3)).toBeNull();
    await fetchItemProviderDetails('series', 3);
    await fetchItemProviderDetails('series', 3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCachedItemProviders('series', 3)).toEqual([
      { name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/nf.jpg' },
    ]);
  });

  it('teilt sich einen laufenden Request und liefert bei Fehlern eine leere Liste', async () => {
    const fetchMock = stubFetch(() => jsonOk(flatrate(NETFLIX)));
    const [a, b] = await Promise.all([
      fetchItemProviderDetails('movie', 4),
      fetchItemProviderDetails('movie', 4),
    ]);
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clearItemProviderCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    await expect(fetchItemProviderDetails('movie', 5)).resolves.toEqual([]);
  });

  it('drosselt parallele TMDB-Abfragen, ohne eine zu verlieren', async () => {
    const fetchMock = stubFetch(() => jsonOk(flatrate(NETFLIX)));
    const results = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8].map((id) => fetchItemProviderDetails('series', id + 100))
    );
    expect(results.every((r) => r.length === 1)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it('ignoriert Antworten ohne Flatrate-Liste', async () => {
    stubFetch(() => jsonOk({ results: {} }));
    await expect(fetchItemProviderDetails('series', 500)).resolves.toEqual([]);
  });
});
