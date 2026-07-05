import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearProviderCache,
  fetchItemProviders,
  filterItemsByActiveProviders,
  normalizeProviderName,
} from './watchProviderFilter';

type FetchResult = { ok: boolean; json: () => Promise<unknown> };
const jsonOk = (body: unknown): FetchResult => ({ ok: true, json: async () => body });
const jsonErr = (): FetchResult => ({ ok: false, json: async () => ({}) });

function stubFetch(handler: (url: string) => FetchResult) {
  const fetchMock = vi.fn(async (url: string) => handler(url));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const flatrate = (...names: string[]) => ({
  results: { DE: { flatrate: names.map((provider_name) => ({ provider_name })) } },
});

describe('watchProviderFilter', () => {
  beforeEach(() => {
    clearProviderCache();
    vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('normalizeProviderName', () => {
    it('maps TMDB names onto canonical subscription names', () => {
      expect(normalizeProviderName('Netflix')).toBe('Netflix');
      expect(normalizeProviderName('Amazon Prime Video')).toBe('Amazon Prime Video');
      expect(normalizeProviderName('Disney+')).toBe('Disney Plus');
      expect(normalizeProviderName('Apple TV+')).toBe('Apple TV Plus');
      expect(normalizeProviderName('Max')).toBe('HBO Max');
      expect(normalizeProviderName('Amazon Freevee')).toBe('Amazon Prime Video');
    });

    it('rejects channel add-ons and unknown providers', () => {
      expect(normalizeProviderName('Wow Fiction Amazon Channel')).toBeNull();
      expect(normalizeProviderName('Totally Unknown TV')).toBeNull();
    });
  });

  describe('fetchItemProviders', () => {
    it('returns normalized, de-duplicated DE flatrate providers', async () => {
      stubFetch(() => jsonOk(flatrate('Netflix', 'Disney+', 'Netflix')));
      const providers = await fetchItemProviders('series', 42);
      expect(providers).toEqual(['Netflix', 'Disney Plus']);
    });

    it('caches results so a second lookup does not refetch', async () => {
      const fetchMock = stubFetch(() => jsonOk(flatrate('Netflix')));
      await fetchItemProviders('movie', 7);
      await fetchItemProviders('movie', 7);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list for a non-ok response or missing DE data', async () => {
      stubFetch(() => jsonErr());
      expect(await fetchItemProviders('series', 1)).toEqual([]);
      clearProviderCache();
      stubFetch(() => jsonOk({ results: {} }));
      expect(await fetchItemProviders('series', 2)).toEqual([]);
    });
  });

  describe('filterItemsByActiveProviders', () => {
    const items = [
      { id: 1, type: 'series' as const },
      { id: 2, type: 'series' as const },
      { id: 3, type: 'movie' as const },
    ];

    it('is a no-op when the active-provider set is empty', async () => {
      const fetchMock = stubFetch(() => jsonOk(flatrate('Netflix')));
      const out = await filterItemsByActiveProviders(items, new Set());
      expect(out).toBe(items);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('keeps only items available on an active provider', async () => {
      stubFetch((url) => {
        if (url.includes('/tv/1')) return jsonOk(flatrate('Netflix'));
        if (url.includes('/tv/2')) return jsonOk(flatrate('WOW'));
        if (url.includes('/movie/3')) return jsonOk(flatrate('Disney+'));
        return jsonOk(flatrate());
      });
      const out = await filterItemsByActiveProviders(items, new Set(['Netflix', 'Disney Plus']));
      expect(out.map((i) => i.id)).toEqual([1, 3]);
    });
  });
});
