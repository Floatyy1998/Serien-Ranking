import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SeasonAnime } from '../../services/anilistSeasonService';
import { readResolveCacheSync, readResolvedTmdbInfoSync, resolveTmdbInfo } from './resolveTmdbId';

const CACHE_KEY = 'animeSeasonTmdb:v11';

// ── sessionStorage-Stub (node hat keins) ─────────────────────────────────
const sessionStore = new Map<string, string>();
const sessionStorageMock = {
  getItem: (k: string) => (sessionStore.has(k) ? (sessionStore.get(k) as string) : null),
  setItem: (k: string, v: string) => {
    sessionStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    sessionStore.delete(k);
  },
  clear: () => sessionStore.clear(),
};

const fetchSpy = vi.fn<(input: unknown) => Promise<unknown>>();

function makeAnime(overrides: Partial<SeasonAnime> = {}): SeasonAnime {
  return {
    id: 1,
    idMal: null,
    title: { romaji: 'Naruto', english: 'Naruto' },
    coverImage: null,
    bannerImage: null,
    episodes: null,
    format: 'TV',
    genres: null,
    averageScore: null,
    popularity: null,
    siteUrl: '',
    status: null,
    description: null,
    // kein startDate → TVMaze-Check wird übersprungen (kein setTimeout-Hang)
    startDate: null,
    studios: null,
    nextAiringEpisode: null,
    relations: null,
    externalLinks: null,
    ...overrides,
  } as SeasonAnime;
}

beforeEach(() => {
  sessionStore.clear();
  fetchSpy.mockReset();
  vi.stubGlobal('sessionStorage', sessionStorageMock);
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubEnv('VITE_API_TMDB', 'testkey');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('readResolvedTmdbInfoSync / readResolveCacheSync', () => {
  it('leerer Cache → undefined bzw. {}', () => {
    expect(readResolvedTmdbInfoSync(42)).toBeUndefined();
    expect(readResolveCacheSync()).toEqual({});
  });

  it('liest einen gecachten Eintrag', () => {
    sessionStore.set(
      CACHE_KEY,
      JSON.stringify({ '42': { tmdbId: 7, overviewDe: 'x', providers: null } })
    );
    expect(readResolvedTmdbInfoSync(42)).toEqual({ tmdbId: 7, overviewDe: 'x', providers: null });
    expect(readResolveCacheSync()['42']).toBeDefined();
  });

  it('korruptes JSON → {} (kein Throw)', () => {
    sessionStore.set(CACHE_KEY, 'nicht json {');
    expect(readResolveCacheSync()).toEqual({});
    expect(readResolvedTmdbInfoSync(1)).toBeUndefined();
  });
});

describe('resolveTmdbInfo', () => {
  it('Cache-Hit liefert ohne Netzwerk-Request', async () => {
    sessionStore.set(
      CACHE_KEY,
      JSON.stringify({ '5': { tmdbId: 99, overviewDe: 'cached', providers: null } })
    );
    const result = await resolveTmdbInfo(makeAnime({ id: 5 }), 2026);
    expect(result.tmdbId).toBe(99);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('ohne primären Titel → Miss (tmdbId null), wird gecacht', async () => {
    const anime = makeAnime({ id: 6, title: { romaji: null, english: null } });
    const result = await resolveTmdbInfo(anime, 2026);
    expect(result.tmdbId).toBeNull();
    expect(result.providers).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    // In den Cache geschrieben
    expect(readResolvedTmdbInfoSync(6)?.tmdbId).toBeNull();
  });

  it('happy path: TMDB-Treffer + deutsche Details', async () => {
    fetchSpy.mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes('/search/tv')) {
        return {
          ok: true,
          json: async () => ({
            results: [{ id: 555, genre_ids: [16], name: 'Naruto', popularity: 10 }],
          }),
        };
      }
      if (url.includes('/tv/555')) {
        return {
          ok: true,
          json: async () => ({
            overview: 'Deutsche Beschreibung',
            vote_average: 8,
            genres: [],
            'watch/providers': { results: {} },
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });

    const result = await resolveTmdbInfo(makeAnime({ id: 7 }), 2026);
    expect(result.tmdbId).toBe(555);
    expect(result.overviewDe).toBe('Deutsche Beschreibung');
    expect(result.tmdbRating).toBe(8);
    // gecacht: zweiter Aufruf ohne weitere Requests
    const callsAfterFirst = fetchSpy.mock.calls.length;
    const second = await resolveTmdbInfo(makeAnime({ id: 7 }), 2026);
    expect(second.tmdbId).toBe(555);
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
  });

  it('ohne API-Key → kein Treffer, kein Request', async () => {
    vi.stubEnv('VITE_API_TMDB', '');
    const result = await resolveTmdbInfo(makeAnime({ id: 8 }), 2026);
    expect(result.tmdbId).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('AniList-MOVIE nutzt die Movie-Suche', async () => {
    const seen: string[] = [];
    fetchSpy.mockImplementation(async (input: unknown) => {
      const url = String(input);
      seen.push(url);
      if (url.includes('/search/movie')) {
        return { ok: true, json: async () => ({ results: [{ id: 321, genre_ids: [16] }] }) };
      }
      if (url.includes('/movie/321')) {
        return {
          ok: true,
          json: async () => ({ overview: '', vote_average: 0, genres: [], 'watch/providers': {} }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });

    const result = await resolveTmdbInfo(makeAnime({ id: 9, format: 'MOVIE' }), 2026);
    expect(result.tmdbId).toBe(321);
    expect(result.mediaType).toBe('movie');
    expect(seen.some((u) => u.includes('/search/movie'))).toBe(true);
    expect(seen.some((u) => u.includes('/search/tv'))).toBe(false);
  });
});
