import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Reines sessionStorage-Mock (node-env hat keins). Map-backed.
// ---------------------------------------------------------------------------
function makeSessionStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    map,
  };
}

const fetchMock = vi.fn();
let ss: ReturnType<typeof makeSessionStorage>;

function graphqlPage(media: unknown[], hasNextPage = false) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data: { Page: { pageInfo: { hasNextPage }, media } } }),
  };
}

function makeAnime(id: number, popularity = 0) {
  return { id, popularity, title: { romaji: `A${id}`, english: null } };
}

// Frisches Modul je Test → In-Memory-Cache ist leer.
async function load() {
  return import('./anilistSeasonService');
}

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  ss = makeSessionStorage();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('sessionStorage', ss);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ===========================================================================
describe('reine Season-Helfer', () => {
  it('getCurrentSeason leitet Season aus dem Monat ab', async () => {
    const { getCurrentSeason } = await load();
    expect(getCurrentSeason(new Date('2026-01-15'))).toEqual({ season: 'WINTER', year: 2026 });
    expect(getCurrentSeason(new Date('2026-04-15'))).toEqual({ season: 'SPRING', year: 2026 });
    expect(getCurrentSeason(new Date('2026-07-15'))).toEqual({ season: 'SUMMER', year: 2026 });
    expect(getCurrentSeason(new Date('2026-11-15'))).toEqual({ season: 'FALL', year: 2026 });
  });

  it('shiftSeason +1 wechselt Season, überschreitet Jahresgrenze korrekt', async () => {
    const { shiftSeason } = await load();
    expect(shiftSeason({ season: 'FALL', year: 2026 }, 1)).toEqual({
      season: 'WINTER',
      year: 2027,
    });
    expect(shiftSeason({ season: 'WINTER', year: 2026 }, -1)).toEqual({
      season: 'FALL',
      year: 2025,
    });
    expect(shiftSeason({ season: 'SUMMER', year: 2026 }, -2)).toEqual({
      season: 'WINTER',
      year: 2026,
    });
  });

  it('shiftSeason mit 0 ist die Identität', async () => {
    const { shiftSeason } = await load();
    expect(shiftSeason({ season: 'SPRING', year: 2026 }, 0)).toEqual({
      season: 'SPRING',
      year: 2026,
    });
  });

  it('seasonKey / seasonLabel formatieren stabil', async () => {
    const { seasonKey, seasonLabel, SEASON_LABELS_DE } = await load();
    expect(seasonKey({ season: 'SUMMER', year: 2026 })).toBe('SUMMER-2026');
    expect(seasonLabel({ season: 'SUMMER', year: 2026 })).toBe('Sommer 2026');
    expect(SEASON_LABELS_DE.FALL).toBe('Herbst');
  });
});

// ===========================================================================
describe('fetchSeasonAnime', () => {
  it('lädt eine Seite und mappt media/hasNextPage', async () => {
    fetchMock.mockResolvedValueOnce(graphqlPage([makeAnime(1), makeAnime(2)], true));
    const { fetchSeasonAnime } = await load();

    const page = await fetchSeasonAnime({ season: 'SUMMER', year: 2026 }, 1);

    expect(page.media).toHaveLength(2);
    expect(page.hasNextPage).toBe(true);
    // richtige Variablen im Body
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.variables).toEqual({ season: 'SUMMER', year: 2026, page: 1 });
  });

  it('fehlende data → leeres media-Array, hasNextPage false', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    const { fetchSeasonAnime } = await load();
    const page = await fetchSeasonAnime({ season: 'WINTER', year: 2025 });
    expect(page).toEqual({ media: [], hasNextPage: false });
  });

  it('cached: zweiter Aufruf feuert kein weiteres fetch (Memory-Cache)', async () => {
    fetchMock.mockResolvedValueOnce(graphqlPage([makeAnime(1)]));
    const { fetchSeasonAnime } = await load();

    await fetchSeasonAnime({ season: 'SUMMER', year: 2026 }, 1);
    await fetchSeasonAnime({ season: 'SUMMER', year: 2026 }, 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('liest aus sessionStorage, wenn Memory-Cache leer aber Session frisch', async () => {
    const { seasonKey } = await load();
    const ref = { season: 'FALL', year: 2026 } as const;
    const key = `anilistSeason:v6:${seasonKey(ref)}:1`;
    ss.map.set(
      key,
      JSON.stringify({
        fetchedAt: Date.now(),
        page: { media: [makeAnime(99)], hasNextPage: false },
      })
    );

    const { fetchSeasonAnime } = await load();
    const page = await fetchSeasonAnime(ref, 1);

    expect(page.media[0].id).toBe(99);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('abgelaufener Session-Cache (>30min) → erneuter fetch', async () => {
    const { seasonKey } = await load();
    const ref = { season: 'FALL', year: 2026 } as const;
    const key = `anilistSeason:v6:${seasonKey(ref)}:1`;
    ss.map.set(
      key,
      JSON.stringify({
        fetchedAt: Date.now() - 31 * 60 * 1000,
        page: { media: [makeAnime(99)], hasNextPage: false },
      })
    );
    fetchMock.mockResolvedValueOnce(graphqlPage([makeAnime(1)]));

    const { fetchSeasonAnime } = await load();
    const page = await fetchSeasonAnime(ref, 1);

    expect(page.media[0].id).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('429 → verständliche Rate-Limit-Fehlermeldung', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) });
    const { fetchSeasonAnime } = await load();
    await expect(fetchSeasonAnime({ season: 'SUMMER', year: 2026 })).rejects.toThrow(/Rate-Limit/);
  });

  it('sonstiger non-ok → API-Fehler mit Status', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const { fetchSeasonAnime } = await load();
    await expect(fetchSeasonAnime({ season: 'SUMMER', year: 2026 })).rejects.toThrow(
      'AniList API error: 500'
    );
  });

  it('GraphQL-errors → wirft die Fehlermeldung', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ errors: [{ message: 'boom' }] }),
    });
    const { fetchSeasonAnime } = await load();
    await expect(fetchSeasonAnime({ season: 'SUMMER', year: 2026 })).rejects.toThrow('boom');
  });
});

// ===========================================================================
describe('fetchContinuingAnime', () => {
  it('holt zwei vorherige Seasons, dedupliziert und sortiert nach Popularität', async () => {
    // origin[0] = shift(-1), origin[1] = shift(-2)
    fetchMock
      .mockResolvedValueOnce(graphqlPage([makeAnime(1, 10), makeAnime(2, 50)]))
      .mockResolvedValueOnce(graphqlPage([makeAnime(2, 50), makeAnime(3, 30)]));

    const { fetchContinuingAnime } = await load();
    const result = await fetchContinuingAnime({ season: 'SUMMER', year: 2026 });

    // 2 fetches (je eine Seite pro Origin)
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // dedupliziert: id 2 nur einmal
    expect(result.map((r) => r.anime.id)).toEqual([2, 3, 1]);
    // origin von id 1 ist die zuletzt gestartete Season (shift -1 = SPRING 2026)
    const one = result.find((r) => r.anime.id === 1)!;
    expect(one.origin).toEqual({ season: 'SPRING', year: 2026 });
  });

  it('leere Seasons → leeres Ergebnis', async () => {
    fetchMock.mockResolvedValueOnce(graphqlPage([])).mockResolvedValueOnce(graphqlPage([]));
    const { fetchContinuingAnime } = await load();
    await expect(fetchContinuingAnime({ season: 'WINTER', year: 2026 })).resolves.toEqual([]);
  });
});
