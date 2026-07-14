import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// IndexedDB-Layer mocken: ein simpler In-Memory-Store, der die Semantik von
// catalogIDB nachbildet (idbGetVersioned liefert nur bei passender Version).
const idb = vi.hoisted(() => {
  const store = new Map<string, { v: number | null; data: unknown }>();
  return {
    store,
    idbGetVersioned: vi.fn(async (key: string, expectedV: number) => {
      const rec = store.get(key);
      if (!rec) return null;
      return rec.v === expectedV ? rec.data : null;
    }),
    idbGetAny: vi.fn(async (key: string) => {
      const rec = store.get(key);
      return rec ? { v: rec.v, data: rec.data } : null;
    }),
    idbSetVersioned: vi.fn(async (key: string, v: number | null, data: unknown) => {
      store.set(key, { v, data });
    }),
    idbRemove: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    idbRemovePrefix: vi.fn(async (prefix: string) => {
      for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
    }),
  };
});

vi.mock('./catalogIDB', () => ({
  idbGetVersioned: idb.idbGetVersioned,
  idbGetAny: idb.idbGetAny,
  idbSetVersioned: idb.idbSetVersioned,
  idbRemove: idb.idbRemove,
  idbRemovePrefix: idb.idbRemovePrefix,
}));

// Fake-Server fuer fetch(). version.json separat, uebrige Dateien per Name.
interface FileResp {
  ok: boolean;
  status: number;
  json: unknown;
}
const server: {
  version: number | null;
  versionThrows: boolean;
  rejectFiles: boolean;
  files: Record<string, FileResp>;
} = { version: 100, versionThrows: false, rejectFiles: false, files: {} };

const fetchSpy = vi.fn(async (input: unknown) => {
  const url = String(input);
  if (url.includes('version.json')) {
    if (server.versionThrows) throw new Error('network down');
    return {
      ok: true,
      status: 200,
      json: async () => ({ version: server.version, updatedAt: '2026-07-04' }),
    };
  }
  if (server.rejectFiles) throw new Error('network down');
  const name = url.split('/catalog/')[1]?.split('?')[0] ?? '';
  const r = server.files[name];
  if (!r) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: r.ok, status: r.status, json: async () => r.json };
});

const callsTo = (needle: string) =>
  fetchSpy.mock.calls.filter((c) => String(c[0]).includes(needle)).length;
const lastUrlFor = (needle: string) =>
  String([...fetchSpy.mock.calls].reverse().find((c) => String(c[0]).includes(needle))?.[0] ?? '');

// DOM-Umgebung (node-env hat kein window/document): addEventListener +
// setInterval werden aufgezeichnet, damit Tests Events gezielt feuern koennen.
function makeDomEnv() {
  const handlers: Record<string, Array<() => void>> = {};
  const intervals: Array<() => void> = [];
  let visibility = 'visible';
  const add = (type: string, cb: () => void) => {
    (handlers[type] ||= []).push(cb);
  };
  const doc = {
    get visibilityState() {
      return visibility;
    },
    addEventListener: vi.fn(add),
    removeEventListener: vi.fn(),
  };
  const win = {
    addEventListener: vi.fn(add),
    removeEventListener: vi.fn(),
    setInterval: vi.fn((cb: () => void) => {
      intervals.push(cb);
      return 1 as unknown;
    }),
  };
  return {
    handlers,
    intervals,
    doc,
    win,
    setVisibility: (v: string) => {
      visibility = v;
    },
    fire: (type: string) => {
      for (const h of handlers[type] || []) h();
    },
  };
}

const LS = {
  version: 'catalog-static:version',
  seriesMeta: 'catalog-static:seriesMeta',
  moviesMeta: 'catalog-static:moviesMeta',
  seasonsBulk: 'catalog-static:seasonsBulk',
  seasonalAnime: 'catalog-static:seasonalAnime',
  tvPremieres: 'catalog-static:tvPremieres',
};

function seedLocalVersion(v: number) {
  idb.store.set(LS.version, { v: 0, data: v });
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
let nowRef = 1_000_000;
let dom: ReturnType<typeof makeDomEnv>;

async function load() {
  return import('./staticCatalog');
}

beforeEach(() => {
  vi.resetModules();
  idb.store.clear();
  idb.idbGetVersioned.mockClear();
  idb.idbGetAny.mockClear();
  idb.idbSetVersioned.mockClear();
  idb.idbRemove.mockClear();
  idb.idbRemovePrefix.mockClear();
  server.version = 100;
  server.versionThrows = false;
  server.rejectFiles = false;
  server.files = {};
  fetchSpy.mockClear();
  nowRef = 1_000_000;
  dom = makeDomEnv();
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('document', dom.doc);
  vi.stubGlobal('window', dom.win);
  vi.spyOn(Date, 'now').mockImplementation(() => nowRef);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchStaticCatalogSeries — Caching & Provider-Expansion', () => {
  it('Cold-Path: holt seriesMeta.json mit ?v=<version> und schreibt in IDB', async () => {
    server.version = 111;
    server.files['seriesMeta.json'] = {
      ok: true,
      status: 200,
      json: { '1': { title: 'A', providers: [] } },
    };
    const { fetchStaticCatalogSeries } = await load();

    const data = await fetchStaticCatalogSeries();

    expect(data).toEqual({ '1': { title: 'A', providers: [] } });
    expect(lastUrlFor('seriesMeta.json')).toContain('?v=111');
    expect(idb.store.get(LS.seriesMeta)).toEqual({ v: 111, data });
  });

  it('expandiert deduplizierte Provider aus _meta.providers zurueck', async () => {
    server.files['seriesMeta.json'] = {
      ok: true,
      status: 200,
      json: {
        _meta: { providers: { '8': { logo: 'l8', name: 'Netflix' } } },
        '1': { title: 'A', providers: [8] },
      },
    };
    const { fetchStaticCatalogSeries } = await load();

    const data = await fetchStaticCatalogSeries();

    expect(data).toEqual({
      '1': { title: 'A', providers: [{ id: 8, logo: 'l8', name: 'Netflix' }] },
    });
    expect((data as Record<string, unknown>)._meta).toBeUndefined();
  });

  it('Memory-Cache: zweiter Aufruf feuert keinen weiteren seriesMeta-Fetch', async () => {
    server.files['seriesMeta.json'] = { ok: true, status: 200, json: { '1': { title: 'A' } } };
    const { fetchStaticCatalogSeries } = await load();

    await fetchStaticCatalogSeries();
    await fetchStaticCatalogSeries();

    expect(callsTo('seriesMeta.json')).toBe(1);
  });

  it('IDB-Hit liefert sofort; Background-Revalidate invalidiert bei Versions-Bump', async () => {
    idb.store.set(LS.seriesMeta, { v: 100, data: { '1': { title: 'ALT' } } });
    server.version = 200; // Server ist weiter → Bump
    const { fetchStaticCatalogSeries } = await load();

    const data = await fetchStaticCatalogSeries();
    expect(data).toEqual({ '1': { title: 'ALT' } }); // stale sofort ausgeliefert

    // Revalidate laeuft fire-and-forget → auf Invalidierung warten
    await vi.waitFor(() => expect(idb.idbRemove).toHaveBeenCalledWith(LS.seriesMeta));
  });

  it('IDB-Hit ohne Bump behaelt den Cache', async () => {
    idb.store.set(LS.seriesMeta, { v: 100, data: { '1': { title: 'A' } } });
    server.version = 100; // gleich → kein Bump
    const { fetchStaticCatalogSeries } = await load();

    await fetchStaticCatalogSeries();
    await flush();

    expect(idb.idbRemove).not.toHaveBeenCalledWith(LS.seriesMeta);
  });

  it('Fetch-Fehler → null, ohne den bestehenden Stand zu leeren', async () => {
    // keine seriesMeta.json registriert → 404
    const { fetchStaticCatalogSeries } = await load();
    await expect(fetchStaticCatalogSeries()).resolves.toBeNull();
  });
});

describe('fetchStaticCatalogSeasonsBulk', () => {
  it('404 → null (kein throw), Provider faellt auf Einzel-Fetches zurueck', async () => {
    const { fetchStaticCatalogSeasonsBulk } = await load();
    await expect(fetchStaticCatalogSeasonsBulk()).resolves.toBeNull();
  });

  it('liefert die Bulk-Seasons-Map', async () => {
    server.files['seasonsAll.json'] = {
      ok: true,
      status: 200,
      json: { '82684': { '0': { air_date: '2026-01-01' } } },
    };
    const { fetchStaticCatalogSeasonsBulk } = await load();
    await expect(fetchStaticCatalogSeasonsBulk()).resolves.toEqual({
      '82684': { '0': { air_date: '2026-01-01' } },
    });
  });
});

describe('fetchStaticTvPremieres / fetchStaticSeasonalAnime — .entries-Unwrap', () => {
  it('tv-premieres: entpackt das entries-Array', async () => {
    server.files['tv-premieres.json'] = {
      ok: true,
      status: 200,
      json: { entries: [{ tmdbId: 1, type: 'new', premiereDate: '2026-07-01' }] },
    };
    const { fetchStaticTvPremieres } = await load();
    const data = await fetchStaticTvPremieres();
    expect(data).toHaveLength(1);
    expect(data?.[0].tmdbId).toBe(1);
  });

  it('tv-premieres: fehlendes entries → leeres Array', async () => {
    server.files['tv-premieres.json'] = { ok: true, status: 200, json: {} };
    const { fetchStaticTvPremieres } = await load();
    await expect(fetchStaticTvPremieres()).resolves.toEqual([]);
  });

  it('seasonal-anime: entpackt die entries-Map', async () => {
    server.files['seasonal-anime.json'] = {
      ok: true,
      status: 200,
      json: { entries: { '123': { tmdbId: 9 } } },
    };
    const { fetchStaticSeasonalAnime } = await load();
    await expect(fetchStaticSeasonalAnime()).resolves.toEqual({ '123': { tmdbId: 9 } });
  });
});

describe('checkForCatalogVersionBump', () => {
  it('gleiche Version → false, keine Invalidierung', async () => {
    server.version = 100;
    seedLocalVersion(100);
    const { checkForCatalogVersionBump } = await load();

    await expect(checkForCatalogVersionBump()).resolves.toBe(false);
    expect(idb.idbRemove).not.toHaveBeenCalled();
  });

  it('neue Version → true, invalidiert ALLE Catalog-Caches (inkl. tvPremieres/seasonalAnime)', async () => {
    server.version = 200;
    seedLocalVersion(100);
    idb.store.set(LS.seriesMeta, { v: 100, data: {} });
    idb.store.set(LS.tvPremieres, { v: 100, data: [] });
    idb.store.set(LS.seasonalAnime, { v: 100, data: {} });
    const { checkForCatalogVersionBump } = await load();

    await expect(checkForCatalogVersionBump()).resolves.toBe(true);
    expect(idb.idbRemove).toHaveBeenCalledWith(LS.seriesMeta);
    expect(idb.idbRemove).toHaveBeenCalledWith(LS.tvPremieres);
    expect(idb.idbRemove).toHaveBeenCalledWith(LS.seasonalAnime);
    expect(idb.store.get(LS.version)).toEqual({ v: 0, data: 200 });
  });

  it('version.json-Fetch wirft → false (best-effort)', async () => {
    server.versionThrows = true;
    seedLocalVersion(100);
    const { checkForCatalogVersionBump } = await load();
    await expect(checkForCatalogVersionBump()).resolves.toBe(false);
  });

  it('nicht-numerische Version → false', async () => {
    server.version = null;
    seedLocalVersion(100);
    const { checkForCatalogVersionBump } = await load();
    await expect(checkForCatalogVersionBump()).resolves.toBe(false);
  });
});

describe('subscribeCatalogChange — zentraler Versions-Watcher', () => {
  it('startet den Watcher: registriert visibilitychange, focus und ein Intervall', async () => {
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(() => {});

    expect(dom.handlers['visibilitychange']?.length).toBe(1);
    expect(dom.handlers['focus']?.length).toBe(1);
    expect(dom.win.setInterval).toHaveBeenCalledTimes(1);
  });

  it('feuert Listener bei focus, wenn eine neue Version vorliegt (Zwei-Monitor-Fall)', async () => {
    server.version = 200;
    seedLocalVersion(100);
    const listener = vi.fn();
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(listener);

    dom.fire('focus');
    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
  });

  it('feuert NICHT ohne Versions-Bump', async () => {
    server.version = 100;
    seedLocalVersion(100);
    const listener = vi.fn();
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(listener);

    dom.fire('focus');
    await flush();
    expect(listener).not.toHaveBeenCalled();
  });

  it('Debounce: zwei Trigger innerhalb 30s → nur EIN version.json-Check', async () => {
    server.version = 200;
    seedLocalVersion(100);
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(() => {});

    dom.fire('focus');
    await flush();
    dom.fire('visibilitychange'); // < 30s spaeter (nowRef unveraendert)
    await flush();

    expect(callsTo('version.json')).toBe(1);
  });

  it('nach Ablauf des Debounce (>30s) wird erneut geprueft', async () => {
    server.version = 200;
    seedLocalVersion(100);
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(() => {});

    dom.fire('focus');
    await flush();
    nowRef += 31_000; // Debounce-Fenster verlassen
    dom.fire('focus');
    await flush();

    expect(callsTo('version.json')).toBe(2);
  });

  it('Visible-Gate: verstecktes Tab → kein Check', async () => {
    server.version = 200;
    seedLocalVersion(100);
    dom.setVisibility('hidden');
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(() => {});

    dom.fire('focus');
    await flush();
    expect(callsTo('version.json')).toBe(0);
  });

  it('ein werfender Listener blockiert die anderen nicht', async () => {
    server.version = 200;
    seedLocalVersion(100);
    const good = vi.fn();
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(() => {
      throw new Error('kaputt');
    });
    subscribeCatalogChange(good);

    dom.fire('focus');
    await vi.waitFor(() => expect(good).toHaveBeenCalledTimes(1));
  });

  it('unsubscribe entfernt den Listener', async () => {
    server.version = 200;
    seedLocalVersion(100);
    const listener = vi.fn();
    const { subscribeCatalogChange } = await load();
    const unsubscribe = subscribeCatalogChange(listener);
    unsubscribe();

    dom.fire('focus');
    await flush();
    expect(listener).not.toHaveBeenCalled();
  });

  it('Watcher wird nur EINMAL gestartet, auch bei mehreren Abos', async () => {
    const { subscribeCatalogChange } = await load();
    subscribeCatalogChange(() => {});
    subscribeCatalogChange(() => {});
    subscribeCatalogChange(() => {});

    expect(dom.handlers['focus']?.length).toBe(1);
    expect(dom.win.setInterval).toHaveBeenCalledTimes(1);
  });
});

describe('clearStaticCatalogCache', () => {
  it('entfernt alle Catalog-Keys aus dem IDB', async () => {
    idb.store.set(LS.seriesMeta, { v: 1, data: {} });
    idb.store.set(LS.tvPremieres, { v: 1, data: [] });
    const { clearStaticCatalogCache } = await load();

    clearStaticCatalogCache();
    await flush();

    expect(idb.idbRemove).toHaveBeenCalledWith(LS.seriesMeta);
    expect(idb.idbRemove).toHaveBeenCalledWith(LS.moviesMeta);
    expect(idb.idbRemove).toHaveBeenCalledWith(LS.tvPremieres);
    expect(idb.idbRemove).toHaveBeenCalledWith(LS.seasonalAnime);
    expect(idb.idbRemovePrefix).toHaveBeenCalled();
  });
});

describe('fetchStaticCatalogMovies', () => {
  it('Cold-Path: holt moviesMeta.json mit ?v=, expandiert Provider, schreibt IDB', async () => {
    server.version = 55;
    server.files['moviesMeta.json'] = {
      ok: true,
      status: 200,
      json: {
        _meta: { providers: { '8': { logo: 'l8', name: 'Netflix' } } },
        '7': { title: 'M', providers: [8] },
      },
    };
    const { fetchStaticCatalogMovies } = await load();

    const data = await fetchStaticCatalogMovies();
    expect(data).toEqual({
      '7': { title: 'M', providers: [{ id: 8, logo: 'l8', name: 'Netflix' }] },
    });
    expect(lastUrlFor('moviesMeta.json')).toContain('?v=55');
    expect(idb.store.get(LS.moviesMeta)).toEqual({ v: 55, data });
  });

  it('Memory-Cache: zweiter Aufruf ohne weiteren Fetch', async () => {
    server.files['moviesMeta.json'] = { ok: true, status: 200, json: { '7': { title: 'M' } } };
    const { fetchStaticCatalogMovies } = await load();
    await fetchStaticCatalogMovies();
    await fetchStaticCatalogMovies();
    expect(callsTo('moviesMeta.json')).toBe(1);
  });

  it('404 → null', async () => {
    const { fetchStaticCatalogMovies } = await load();
    await expect(fetchStaticCatalogMovies()).resolves.toBeNull();
  });
});

describe('fetchStaticCatalogSeasons (Einzel-Serie)', () => {
  it('Cold-Path: holt seasons/<id>.json mit ?v= und cached im Memory', async () => {
    server.version = 9;
    server.files['seasons/82684.json'] = {
      ok: true,
      status: 200,
      json: { '0': { air_date: '2026-01-01' } },
    };
    const { fetchStaticCatalogSeasons } = await load();

    const first = await fetchStaticCatalogSeasons(82684);
    expect(first).toEqual({ '0': { air_date: '2026-01-01' } });
    expect(lastUrlFor('seasons/82684.json')).toContain('?v=9');

    // Memory-Hit: kein zweiter Fetch
    await fetchStaticCatalogSeasons('82684');
    expect(callsTo('seasons/82684.json')).toBe(1);
  });

  it('bedient sich aus bereits geladenen Bulk-Daten statt neu zu fetchen', async () => {
    server.files['seasonsAll.json'] = {
      ok: true,
      status: 200,
      json: { '500': { '0': { air_date: '2026-05-05' } } },
    };
    const { fetchStaticCatalogSeasonsBulk, fetchStaticCatalogSeasons } = await load();
    await fetchStaticCatalogSeasonsBulk();

    const single = await fetchStaticCatalogSeasons(500);
    expect(single).toEqual({ '0': { air_date: '2026-05-05' } });
    expect(callsTo('seasons/500.json')).toBe(0); // nie einzeln geholt
  });

  it('404 → null ohne throw', async () => {
    const { fetchStaticCatalogSeasons } = await load();
    await expect(fetchStaticCatalogSeasons(999)).resolves.toBeNull();
  });
});

describe('Force-Fresh-Helfer', () => {
  it('fetchStaticCatalogSeriesFresh: no-store + Timestamp-Buster, aktualisiert Memory + IDB', async () => {
    server.version = 70;
    server.files['seriesMeta.json'] = { ok: true, status: 200, json: { '1': { title: 'FRESH' } } };
    const { fetchStaticCatalogSeriesFresh } = await load();

    const data = await fetchStaticCatalogSeriesFresh();
    expect(data).toEqual({ '1': { title: 'FRESH' } });
    expect(lastUrlFor('seriesMeta.json')).toContain('?_='); // Timestamp-Cache-Buster
    await vi.waitFor(() =>
      expect(idb.store.get(LS.seriesMeta)?.data).toEqual({ '1': { title: 'FRESH' } })
    );
  });

  it('fetchStaticCatalogSeriesFresh: non-ok Antwort → null', async () => {
    server.files['seriesMeta.json'] = { ok: false, status: 500, json: {} };
    const { fetchStaticCatalogSeriesFresh } = await load();
    await expect(fetchStaticCatalogSeriesFresh()).resolves.toBeNull();
  });

  it('fetchStaticCatalogMoviesFresh: liefert expandierte Daten', async () => {
    server.files['moviesMeta.json'] = { ok: true, status: 200, json: { '7': { title: 'MFRESH' } } };
    const { fetchStaticCatalogMoviesFresh } = await load();
    await expect(fetchStaticCatalogMoviesFresh()).resolves.toEqual({ '7': { title: 'MFRESH' } });
  });
});

describe('Cold-Path bei nicht erreichbarer version.json', () => {
  it('version.json wirft → Fetch ohne ?v= (kein Cache-Buster), Daten trotzdem geladen', async () => {
    server.versionThrows = true;
    server.files['seriesMeta.json'] = { ok: true, status: 200, json: { '1': { title: 'A' } } };
    const { fetchStaticCatalogSeries } = await load();

    const data = await fetchStaticCatalogSeries();
    expect(data).toEqual({ '1': { title: 'A' } });
    expect(lastUrlFor('seriesMeta.json')).not.toContain('?v=');
  });

  it('getRemoteVersion memoisiert: series + movies teilen sich EINEN version.json-Fetch', async () => {
    server.files['seriesMeta.json'] = { ok: true, status: 200, json: {} };
    server.files['moviesMeta.json'] = { ok: true, status: 200, json: {} };
    const { fetchStaticCatalogSeries, fetchStaticCatalogMovies } = await load();
    await fetchStaticCatalogSeries();
    await fetchStaticCatalogMovies();
    expect(callsTo('version.json')).toBe(1);
  });
});

describe('expandProviders — Edge-Faelle', () => {
  it('null/primitive Payload → leeres Objekt', async () => {
    server.files['seriesMeta.json'] = { ok: true, status: 200, json: null };
    const { fetchStaticCatalogSeries } = await load();
    await expect(fetchStaticCatalogSeries()).resolves.toEqual({});
  });

  it('Eintrag ohne providers-Array bleibt unveraendert, _meta wird entfernt', async () => {
    server.files['seriesMeta.json'] = {
      ok: true,
      status: 200,
      json: { _meta: { providers: { '8': { logo: 'l', name: 'N' } } }, '1': { title: 'A' } },
    };
    const { fetchStaticCatalogSeries } = await load();
    await expect(fetchStaticCatalogSeries()).resolves.toEqual({ '1': { title: 'A' } });
  });

  it('bereits aufgeloeste (nicht-numerische) Provider-Eintraege bleiben erhalten', async () => {
    server.files['seriesMeta.json'] = {
      ok: true,
      status: 200,
      json: {
        _meta: { providers: { '8': { logo: 'l', name: 'N' } } },
        '1': { title: 'A', providers: [{ id: 8, name: 'N', logo: 'l' }] },
      },
    };
    const { fetchStaticCatalogSeries } = await load();
    const data = await fetchStaticCatalogSeries();
    expect(data).toEqual({ '1': { title: 'A', providers: [{ id: 8, name: 'N', logo: 'l' }] } });
  });
});

describe('Fehler-Logging-Zweige (non-404) liefern null', () => {
  it('seasonsAll.json 500 → null', async () => {
    server.files['seasonsAll.json'] = { ok: false, status: 500, json: {} };
    const { fetchStaticCatalogSeasonsBulk } = await load();
    await expect(fetchStaticCatalogSeasonsBulk()).resolves.toBeNull();
  });

  it('seasons/<id>.json 500 → null', async () => {
    server.files['seasons/1.json'] = { ok: false, status: 500, json: {} };
    const { fetchStaticCatalogSeasons } = await load();
    await expect(fetchStaticCatalogSeasons(1)).resolves.toBeNull();
  });

  it('tv-premieres.json 500 → null', async () => {
    server.files['tv-premieres.json'] = { ok: false, status: 500, json: {} };
    const { fetchStaticTvPremieres } = await load();
    await expect(fetchStaticTvPremieres()).resolves.toBeNull();
  });

  it('seasonal-anime.json 500 → null', async () => {
    server.files['seasonal-anime.json'] = { ok: false, status: 500, json: {} };
    const { fetchStaticSeasonalAnime } = await load();
    await expect(fetchStaticSeasonalAnime()).resolves.toBeNull();
  });
});

describe('revalidateInBackground — Randfaelle', () => {
  it('IDB-Hit + version.json nicht erreichbar → keine Invalidierung', async () => {
    idb.store.set(LS.seriesMeta, { v: 100, data: { '1': { title: 'A' } } });
    server.versionThrows = true;
    const { fetchStaticCatalogSeries } = await load();

    await fetchStaticCatalogSeries();
    await flush();
    expect(idb.idbRemove).not.toHaveBeenCalledWith(LS.seriesMeta);
  });

  it('tv-premieres IDB-Hit liefert stale sofort + revalidiert im Hintergrund', async () => {
    idb.store.set(LS.tvPremieres, { v: 100, data: [{ tmdbId: 1 }] });
    server.version = 100;
    const { fetchStaticTvPremieres } = await load();
    await expect(fetchStaticTvPremieres()).resolves.toEqual([{ tmdbId: 1 }]);
  });

  it('seasonal-anime IDB-Hit liefert stale sofort', async () => {
    idb.store.set(LS.seasonalAnime, { v: 100, data: { '5': { tmdbId: 9 } } });
    server.version = 100;
    const { fetchStaticSeasonalAnime } = await load();
    await expect(fetchStaticSeasonalAnime()).resolves.toEqual({ '5': { tmdbId: 9 } });
  });

  it('seasonsBulk IDB-Hit liefert stale sofort + revalidiert', async () => {
    idb.store.set(LS.seasonsBulk, { v: 100, data: { '82684': { '0': { air_date: 'x' } } } });
    server.version = 100;
    const { fetchStaticCatalogSeasonsBulk } = await load();
    await expect(fetchStaticCatalogSeasonsBulk()).resolves.toEqual({
      '82684': { '0': { air_date: 'x' } },
    });
  });
});

describe('Force-Fresh: Netzwerkfehler → null (catch-Zweig)', () => {
  it('fetchStaticCatalogSeriesFresh faengt einen throw ab', async () => {
    server.rejectFiles = true;
    const { fetchStaticCatalogSeriesFresh } = await load();
    await expect(fetchStaticCatalogSeriesFresh()).resolves.toBeNull();
  });

  it('fetchStaticCatalogMoviesFresh faengt einen throw ab', async () => {
    server.rejectFiles = true;
    const { fetchStaticCatalogMoviesFresh } = await load();
    await expect(fetchStaticCatalogMoviesFresh()).resolves.toBeNull();
  });
});
