import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Firebase: kontrollierbarer Pfad→Wert-Store. once('value') liefert val().
// ---------------------------------------------------------------------------
const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    store,
    once: vi.fn(async (path: string) => ({ val: () => store.get(path) ?? null })),
  };
});

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: (path: string) => ({ once: () => fb.once(path) }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

// backendFetch mocken (refreshAnimeFillerViaBackend).
const backendFetchMock = vi.hoisted(() => vi.fn());
vi.mock('../lib/backendApi', () => ({ backendFetch: backendFetchMock }));

// ---------------------------------------------------------------------------
// localStorage-Stub (node-env). Unterstützt length + key(i) für clearAll.
// ---------------------------------------------------------------------------
function makeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    map,
  };
}

let ls: ReturnType<typeof makeLocalStorage>;
const PREFIX = 'animeFiller_v4:';

async function load() {
  return import('./animeFillerService');
}

beforeEach(() => {
  vi.resetModules();
  fb.store.clear();
  fb.once.mockClear();
  backendFetchMock.mockReset();
  ls = makeLocalStorage();
  vi.stubGlobal('localStorage', ls);
  vi.stubEnv('VITE_BACKEND_API_URL', 'http://backend.test');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ===========================================================================
describe('fillerLookupKey', () => {
  it('formatiert s{n}-e{n}', async () => {
    const { fillerLookupKey } = await load();
    expect(fillerLookupKey(2, 5)).toBe('s2-e5');
  });
});

describe('buildFillerLookup', () => {
  it('leere Seasons oder leere Filler-Liste → leere Map', async () => {
    const { buildFillerLookup } = await load();
    expect(buildFillerLookup(undefined, [])).toEqual(new Map());
    expect(buildFillerLookup([{ episodes: [{}] }], [])).toEqual(new Map());
  });

  it('mappt absolute MAL-Nummer auf s/e-Key (nur filler/recap)', async () => {
    const { buildFillerLookup, fillerLookupKey } = await load();
    const seasons = [
      { season_number: 0, episodes: [{}, {}] }, // → seasonNumber 1, eps 1..2 (abs 1,2)
      { season_number: 1, episodes: [{}, {}] }, // → seasonNumber 2, eps 1..2 (abs 3,4)
    ];
    const filler = [
      { malEpisodeNumber: 2, title: 'Filler A', filler: true, recap: false },
      { malEpisodeNumber: 3, title: 'Recap B', filler: false, recap: true },
      { malEpisodeNumber: 4, title: 'Canon', filler: false, recap: false }, // ignoriert
    ];
    const lookup = buildFillerLookup(seasons, filler);

    expect(lookup.get(fillerLookupKey(1, 2))?.title).toBe('Filler A');
    expect(lookup.get(fillerLookupKey(2, 1))?.title).toBe('Recap B');
    expect(lookup.has(fillerLookupKey(2, 2))).toBe(false); // Canon nicht gemappt
    expect(lookup.size).toBe(2);
  });

  it('überspringt null-Seasons und nutzt seasonNumber-Fallback', async () => {
    const { buildFillerLookup, fillerLookupKey } = await load();
    const seasons = [null, { seasonNumber: 0, episodes: [{}] }] as never;
    const filler = [{ malEpisodeNumber: 1, title: 'F', filler: true, recap: false }];
    const lookup = buildFillerLookup(seasons, filler);
    expect(lookup.get(fillerLookupKey(1, 1))?.title).toBe('F');
  });
});

describe('readFillerCacheSync', () => {
  it('liest gecachte Daten synchron aus localStorage', async () => {
    const { readFillerCacheSync } = await load();
    const data = {
      malId: 20,
      totalEpisodes: 100,
      fillerCount: 1,
      recapCount: 0,
      episodes: [],
      fetchedAt: Date.now(),
    };
    ls.map.set(PREFIX + '123', JSON.stringify({ data, fetchedAt: Date.now() }));
    expect(readFillerCacheSync(123)?.malId).toBe(20);
  });

  it('nichts gecacht → null', async () => {
    const { readFillerCacheSync } = await load();
    expect(readFillerCacheSync(999)).toBeNull();
  });

  it('abgelaufener Cache → null', async () => {
    const { readFillerCacheSync } = await load();
    const data = { malId: 20, totalEpisodes: null, fillerCount: 0, recapCount: 0, episodes: [] };
    // positiver Cache, TTL 7 Tage → 8 Tage alt
    ls.map.set(
      PREFIX + '123',
      JSON.stringify({ data, fetchedAt: Date.now() - 8 * 24 * 60 * 60 * 1000 })
    );
    expect(readFillerCacheSync(123)).toBeNull();
  });
});

describe('clearAnimeFillerCacheForSeries / clearAnimeFillerCache', () => {
  it('entfernt den Eintrag einer Serie (inkl. Legacy-Keys)', async () => {
    const { clearAnimeFillerCacheForSeries } = await load();
    ls.map.set(PREFIX + '5', 'x');
    ls.map.set('animeFiller_v3:5', 'x');
    clearAnimeFillerCacheForSeries(5);
    expect(ls.map.has(PREFIX + '5')).toBe(false);
    expect(ls.map.has('animeFiller_v3:5')).toBe(false);
  });

  it('clearAnimeFillerCache entfernt alle Filler-Keys und zählt sie', async () => {
    const { clearAnimeFillerCache } = await load();
    ls.map.set(PREFIX + '1', 'a');
    ls.map.set('animeFiller_v3:2', 'b');
    ls.map.set('animeFiller_v1:3', 'c');
    ls.map.set('unrelated', 'keep');
    const removed = clearAnimeFillerCache();
    expect(removed).toBe(3);
    expect(ls.map.has('unrelated')).toBe(true);
  });
});

describe('getAnimeFillerData', () => {
  const okRecord = {
    status: 'ok',
    malId: 21,
    totalEpisodes: 1000,
    fillerCount: 1,
    recapCount: 1,
    filler: [{ n: 54, t: 'Filler Ep' }],
    recap: [99],
    updatedAt: 5000,
  };

  it('Cache-Hit innerhalb der Grace-Window → keine Firebase-Reads', async () => {
    const { getAnimeFillerData } = await load();
    const data = {
      malId: 21,
      totalEpisodes: 1,
      fillerCount: 0,
      recapCount: 0,
      episodes: [],
      fetchedAt: Date.now(),
    };
    ls.map.set(PREFIX + '10', JSON.stringify({ data, fetchedAt: Date.now(), backendUpdatedAt: 1 }));
    const res = await getAnimeFillerData(10);
    expect(res?.malId).toBe(21);
    expect(fb.once).not.toHaveBeenCalled();
  });

  it('Cache älter als Grace, Server-updatedAt unverändert → Cache bleibt', async () => {
    const { getAnimeFillerData } = await load();
    const data = {
      malId: 21,
      totalEpisodes: 1,
      fillerCount: 0,
      recapCount: 0,
      episodes: [],
      fetchedAt: 1,
    };
    ls.map.set(
      PREFIX + '10',
      JSON.stringify({ data, fetchedAt: Date.now() - 120000, backendUpdatedAt: 5000 })
    );
    fb.store.set('admin/animeFiller/10/updatedAt', 5000);

    const res = await getAnimeFillerData(10);

    expect(res?.malId).toBe(21);
    // nur der updatedAt-Read, kein voller Refetch
    expect(fb.once).toHaveBeenCalledTimes(1);
  });

  it('kein Cache → liest Backend-Record und expandiert filler/recap-Episoden', async () => {
    const { getAnimeFillerData } = await load();
    fb.store.set('admin/animeFiller/10', okRecord);

    const res = await getAnimeFillerData(10);

    expect(res?.malId).toBe(21);
    expect(res?.episodes).toEqual([
      { malEpisodeNumber: 54, title: 'Filler Ep', filler: true, recap: false },
      { malEpisodeNumber: 99, title: '', filler: false, recap: true },
    ]);
    // Ergebnis wird gecacht
    expect(ls.map.has(PREFIX + '10')).toBe(true);
  });

  it('Backend-Record ohne status=ok → data null', async () => {
    const { getAnimeFillerData } = await load();
    fb.store.set('admin/animeFiller/10', { status: 'pending', updatedAt: 1 });
    await expect(getAnimeFillerData(10)).resolves.toBeNull();
  });

  it('kein Record → data null', async () => {
    const { getAnimeFillerData } = await load();
    await expect(getAnimeFillerData(404)).resolves.toBeNull();
  });
});

describe('refreshAnimeFillerViaBackend', () => {
  it('ohne VITE_BACKEND_API_URL → null', async () => {
    vi.stubEnv('VITE_BACKEND_API_URL', '');
    const { refreshAnimeFillerViaBackend } = await load();
    await expect(refreshAnimeFillerViaBackend(1)).resolves.toBeNull();
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it('POSTet und liest anschließend Firebase neu', async () => {
    backendFetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'ok' }) });
    fb.store.set('admin/animeFiller/7', {
      status: 'ok',
      malId: 44,
      filler: [],
      recap: [],
      updatedAt: 10,
    });
    const { refreshAnimeFillerViaBackend } = await load();

    const res = await refreshAnimeFillerViaBackend(7);

    expect(backendFetchMock).toHaveBeenCalledWith(
      '/refreshAnimeFiller',
      expect.objectContaining({ method: 'POST' })
    );
    expect(res?.malId).toBe(44);
  });

  it('Backend antwortet non-ok → null', async () => {
    backendFetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const { refreshAnimeFillerViaBackend } = await load();
    await expect(refreshAnimeFillerViaBackend(7)).resolves.toBeNull();
  });

  it('Backend wirft → null', async () => {
    backendFetchMock.mockRejectedValueOnce(new Error('network'));
    const { refreshAnimeFillerViaBackend } = await load();
    await expect(refreshAnimeFillerViaBackend(7)).resolves.toBeNull();
  });
});
