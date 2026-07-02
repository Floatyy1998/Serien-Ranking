import { describe, expect, it } from 'vitest';
import { mergeToMovieView, mergeToSeriesView } from './seriesAdapter';
import type {
  CatalogMovie,
  CatalogSeries,
  UserMovieRef,
  UserSeriesRef,
  SeriesWatchData,
} from '../types/CatalogTypes';

// ---------- Fixtures ----------

function makeCatalog(overrides: Record<string, unknown> = {}): CatalogSeries {
  return {
    title: 'Breaking Bad',
    poster: '/poster.jpg',
    genres: ['Drama', 'Crime'],
    providers: [{ id: 8, logo: '/netflix.png', name: 'Netflix' }],
    imdbId: 'tt0903747',
    woUrl: 'https://example.com/wo',
    production: false,
    episodeCount: 62,
    episodeRuntime: 47,
    watchtime: 2914,
    seasonCount: 5,
    lastUpdated: 123,
    originCountry: ['US'],
    originalLanguage: 'en',
    ...overrides,
  } as unknown as CatalogSeries;
}

function makeUserRef(overrides: Record<string, unknown> = {}): UserSeriesRef {
  return {
    rating: { user1: 8 },
    begpirate: 'weil gut',
    ...overrides,
  } as unknown as UserSeriesRef;
}

function makeMovieCatalog(overrides: Record<string, unknown> = {}): CatalogMovie {
  return {
    title: 'Inception',
    poster: '/inception.jpg',
    genres: ['Sci-Fi'],
    providers: [{ id: 9, logo: '/prime.png', name: 'Prime' }],
    imdbId: 'tt1375666',
    woUrl: 'https://example.com/movie',
    runtime: 148,
    status: 'Released',
    releaseDate: '2010-07-16',
    collectionId: 999,
    lastUpdated: 456,
    ...overrides,
  } as unknown as CatalogMovie;
}

function makeMovieRef(overrides: Record<string, unknown> = {}): UserMovieRef {
  return {
    rating: { user1: 9 },
    begpirate: 'Traum im Traum',
    ...overrides,
  } as unknown as UserMovieRef;
}

function makeEp(id: number | null, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Ep ${id}`,
    airDate: '2020-01-01',
    seasonNumber: 1,
    episodeNumber: 1,
    ...overrides,
  };
}

function makeWatch(seasons: Record<string, unknown>): SeriesWatchData {
  return { seasons } as unknown as SeriesWatchData;
}

// BEFUND: Der Adapter schreibt `season_number` in jede Episode, der
// Series-Episode-Typ (types/Series.ts) deklariert das Feld aber nur auf
// Season-Ebene, nicht pro Episode. Für Assertions deshalb untypisiert lesen.
function seasonNumberOf(ep: unknown): unknown {
  return (ep as Record<string, unknown>).season_number;
}

const UNIX_F = 1700000000;
const UNIX_L = 1710000000;
const ISO_F = new Date(UNIX_F * 1000).toISOString();
const ISO_L = new Date(UNIX_L * 1000).toISOString();

// ---------- mergeToSeriesView ----------

describe('mergeToSeriesView', () => {
  describe('Wrapper-Shapes & Basisfelder', () => {
    it('verpackt Catalog-Felder in die Legacy-Wrapper-Shapes (poster/genre/provider/imdb/wo/production)', () => {
      const result = mergeToSeriesView(1396, makeCatalog(), makeUserRef());
      expect(result.poster).toEqual({ poster: '/poster.jpg' });
      expect(result.genre).toEqual({ genres: ['Drama', 'Crime'] });
      expect(result.provider).toEqual({
        provider: [{ id: 8, logo: '/netflix.png', name: 'Netflix' }],
      });
      expect(result.imdb).toEqual({ imdb_id: 'tt0903747' });
      expect(result.wo).toEqual({ wo: 'https://example.com/wo' });
      expect(result.production).toEqual({ production: false });
    });

    it('setzt id aus dem tmdbId-Parameter, nicht aus dem Catalog', () => {
      const result = mergeToSeriesView(42, makeCatalog(), makeUserRef());
      expect(result.id).toBe(42);
    });

    it('mappt imdbId=null und woUrl=null auf leere Strings in den Wrappern', () => {
      const result = mergeToSeriesView(
        1,
        makeCatalog({ imdbId: null, woUrl: null }),
        makeUserRef()
      );
      expect(result.imdb).toEqual({ imdb_id: '' });
      expect(result.wo).toEqual({ wo: '' });
    });

    it('mappt begpirate (RTDB) auf begründung (UI)', () => {
      const result = mergeToSeriesView(1, makeCatalog(), makeUserRef({ begpirate: 'top Serie' }));
      expect(result.begründung).toBe('top Serie');
    });

    it('fehlendes begpirate wird zu leerem String', () => {
      const result = mergeToSeriesView(1, makeCatalog(), makeUserRef({ begpirate: undefined }));
      expect(result.begründung).toBe('');
    });

    it('reicht die rating-Map (userId→Wert) als selbe Referenz durch', () => {
      const rating = { userA: 7, userB: 0, userC: -1 };
      const result = mergeToSeriesView(1, makeCatalog(), makeUserRef({ rating }));
      expect(result.rating).toBe(rating);
      expect(result.rating).toEqual({ userA: 7, userB: 0, userC: -1 });
    });

    it('reicht userRef-Felder (beschreibung/hidden/watchlist/rewatch/addedAt) unverändert durch', () => {
      const rewatch = { active: true, round: 2, rewatchedEps: { '123': true as const } };
      const result = mergeToSeriesView(
        1,
        makeCatalog(),
        makeUserRef({
          beschreibung: 'Notiz',
          hidden: true,
          watchlist: false,
          rewatch,
          addedAt: '2024-01-01T00:00:00.000Z',
        })
      );
      expect(result.beschreibung).toBe('Notiz');
      expect(result.hidden).toBe(true);
      expect(result.watchlist).toBe(false);
      expect(result.rewatch).toBe(rewatch);
      expect(result.addedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('füllt Legacy-Pflichtfelder mit festen Defaults (original_name, popularity, votes, release_date)', () => {
      const result = mergeToSeriesView(1, makeCatalog(), makeUserRef());
      expect(result.original_name).toBe('');
      expect(result.popularity).toBe(0);
      expect(result.vote_average).toBe(0);
      expect(result.vote_count).toBe(0);
      expect(result.release_date).toBe('');
      expect(result.original_language).toBe('en');
    });

    it('fehlt originalLanguage im Catalog, wird es zu leerem String', () => {
      const result = mergeToSeriesView(
        1,
        makeCatalog({ originalLanguage: undefined }),
        makeUserRef()
      );
      expect(result.original_language).toBe('');
    });
  });

  describe('ensureArray / sparse RTDB-Objekte', () => {
    it('koerziert genres als sparse Objekt (Index 0 fehlt) zu einem Array der Values', () => {
      const result = mergeToSeriesView(
        1,
        makeCatalog({ genres: { 1: 'Drama', 2: 'Action' } }),
        makeUserRef()
      );
      expect(result.genre.genres).toEqual(['Drama', 'Action']);
    });

    it('numerische Objekt-Keys werden in aufsteigender Key-Reihenfolge gelesen, nicht in Insertion-Order', () => {
      const result = mergeToSeriesView(
        1,
        makeCatalog({ genres: { 3: 'Comedy', 1: 'Drama' } }),
        makeUserRef()
      );
      expect(result.genre.genres).toEqual(['Drama', 'Comedy']);
    });

    it('koerziert providers als sparse Objekt zu Array', () => {
      const providerObj = {
        2: { id: 8, logo: '/n.png', name: 'Netflix' },
        5: { id: 9, logo: '/p.png', name: 'Prime' },
      };
      const result = mergeToSeriesView(1, makeCatalog({ providers: providerObj }), makeUserRef());
      expect(result.provider?.provider).toEqual([
        { id: 8, logo: '/n.png', name: 'Netflix' },
        { id: 9, logo: '/p.png', name: 'Prime' },
      ]);
    });

    it('fehlende genres/providers/originCountry werden zu leeren Arrays', () => {
      const result = mergeToSeriesView(
        1,
        makeCatalog({ genres: undefined, providers: null, originCountry: undefined }),
        makeUserRef()
      );
      expect(result.genre.genres).toEqual([]);
      expect(result.provider?.provider).toEqual([]);
      expect(result.origin_country).toEqual([]);
    });

    it('primitive Werte (String/Zahl) werden zu leerem Array koerziert', () => {
      const result = mergeToSeriesView(
        1,
        makeCatalog({ genres: 'Drama', originCountry: 5 }),
        makeUserRef()
      );
      expect(result.genre.genres).toEqual([]);
      expect(result.origin_country).toEqual([]);
    });

    it('koerziert originCountry als sparse Objekt zu Array', () => {
      const result = mergeToSeriesView(
        1,
        makeCatalog({ originCountry: { 1: 'US', 2: 'DE' } }),
        makeUserRef()
      );
      expect(result.origin_country).toEqual(['US', 'DE']);
    });
  });

  describe('Seasons-Struktur', () => {
    it('ohne catalog.seasons ist seasons ein leeres Array', () => {
      const result = mergeToSeriesView(1, makeCatalog(), makeUserRef());
      expect(result.seasons).toEqual([]);
    });

    it('Seasons-Objekt mit unsortierten Keys wird nach seasonNumber aufsteigend sortiert', () => {
      const seasons = {
        '2': { seasonNumber: 2, episodes: [makeEp(30)] },
        '0': { seasonNumber: 0, episodes: [makeEp(10)] },
        '10': { seasonNumber: 10, episodes: [makeEp(99)] },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons.map((s) => s.seasonNumber)).toEqual([0, 2, 10]);
    });

    it('BEFUND: der äußere Season-Key gewinnt über catalogSeason.seasonNumber', () => {
      // Season liegt unter Key '0', behauptet aber seasonNumber 5 —
      // der Adapter nimmt Number(key), das innere Feld wird ignoriert.
      const seasons = {
        '0': { seasonNumber: 5, episodes: [makeEp(1, { seasonNumber: undefined })] },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons[0].seasonNumber).toBe(0);
      // Episode ohne eigenes seasonNumber erbt ebenfalls den äußeren Key.
      expect(seasonNumberOf(result.seasons[0].episodes[0])).toBe(0);
    });

    it('null-Einträge im Seasons-Objekt werden übersprungen', () => {
      const seasons = { '0': null, '1': { seasonNumber: 1, episodes: [makeEp(1)] } };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons).toHaveLength(1);
      expect(result.seasons[0].seasonNumber).toBe(1);
    });

    it('Seasons als echtes Array: Index wird zum seasonNumber, null-Löcher werden gefiltert', () => {
      const seasons = [null, { seasonNumber: 1, episodes: [makeEp(1)] }];
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons).toHaveLength(1);
      expect(result.seasons[0].seasonNumber).toBe(1);
    });

    it('Seasons ohne Episoden (leer oder fehlend) werden komplett weggelassen', () => {
      const seasons = {
        '0': { seasonNumber: 0, episodes: [] },
        '1': { seasonNumber: 1 },
        '2': { seasonNumber: 2, episodes: [makeEp(1)] },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons.map((s) => s.seasonNumber)).toEqual([2]);
    });

    it('BEFUND: episodes als sparse Objekt wird kompaktiert — der Legacy-Index verschiebt sich', () => {
      // RTDB liefert {1: epA, 2: epB} (Index 0 fehlt). ensureArray macht daraus
      // [epA, epB] mit idx 0/1 → episode_number-Fallback wird 1/2 statt 2/3,
      // und Legacy-Array-Watch-Daten würden am kompaktierten Index gelesen.
      const seasons = {
        '0': {
          seasonNumber: 0,
          episodes: {
            1: makeEp(200, { episodeNumber: undefined }),
            2: makeEp(300, { episodeNumber: undefined }),
          },
        },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons[0].episodes.map((e) => e.episode_number)).toEqual([1, 2]);
      expect(result.seasons[0].episodes.map((e) => e.id)).toEqual([200, 300]);
    });
  });

  describe('Episode-Feld-Mapping', () => {
    it('air_date: airDate hat Vorrang, dann raw air_date, sonst leerer String', () => {
      const seasons = {
        '0': {
          seasonNumber: 0,
          episodes: [
            makeEp(1, { airDate: '2021-05-05' }),
            makeEp(2, { airDate: null, air_date: '2022-06-06' }),
            makeEp(3, { airDate: null }),
          ],
        },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      const eps = result.seasons[0].episodes;
      expect(eps[0].air_date).toBe('2021-05-05');
      expect(eps[1].air_date).toBe('2022-06-06');
      expect(eps[2].air_date).toBe('');
    });

    it('airstamp: camelCase vor raw, fehlend → undefined', () => {
      const seasons = {
        '0': {
          seasonNumber: 0,
          episodes: [
            makeEp(1, { airstamp: '2021-05-05T00:00:00Z' }),
            makeEp(2, { airstamp: null, air_date: undefined }),
          ],
        },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons[0].episodes[0].airstamp).toBe('2021-05-05T00:00:00Z');
      expect(result.seasons[0].episodes[1].airstamp).toBeUndefined();
    });

    it('season_number/episode_number: camelCase vor snake_case vor Fallback (äußerer Key / idx+1)', () => {
      const seasons = {
        '3': {
          seasonNumber: 3,
          episodes: [
            makeEp(1, { seasonNumber: 7, episodeNumber: 9 }),
            makeEp(2, {
              seasonNumber: undefined,
              episodeNumber: undefined,
              season_number: 4,
              episode_number: 8,
            }),
            makeEp(3, { seasonNumber: undefined, episodeNumber: undefined }),
          ],
        },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      const eps = result.seasons[0].episodes;
      expect(seasonNumberOf(eps[0])).toBe(7);
      expect(eps[0].episode_number).toBe(9);
      expect(seasonNumberOf(eps[1])).toBe(4);
      expect(eps[1].episode_number).toBe(8);
      // Fallback: äußerer Season-Key bzw. 1-basierter Index
      expect(seasonNumberOf(eps[2])).toBe(3);
      expect(eps[2].episode_number).toBe(3);
    });

    it('runtime: null → undefined, 0 bleibt 0 erhalten', () => {
      const seasons = {
        '0': {
          seasonNumber: 0,
          episodes: [
            makeEp(1, { runtime: null }),
            makeEp(2, { runtime: 0 }),
            makeEp(3, { runtime: 45 }),
          ],
        },
      };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      const eps = result.seasons[0].episodes;
      expect(eps[0].runtime).toBeUndefined();
      expect(eps[1].runtime).toBe(0);
      expect(eps[2].runtime).toBe(45);
    });

    it('Episode-id null wird zu 0', () => {
      const seasons = { '0': { seasonNumber: 0, episodes: [makeEp(null)] } };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      expect(result.seasons[0].episodes[0].id).toBe(0);
    });
  });

  describe('Watch-Daten: Epid-Format (eps-Map, keyed by TMDB episode.id)', () => {
    const seasons = {
      '0': { seasonNumber: 0, episodes: [makeEp(1001), makeEp(1002)] },
    };

    it('expandiert {w,c,f,l}: Unix-Sekunden werden zu ISO-Strings', () => {
      const watch = makeWatch({
        '0': { eps: { '1001': { w: 1, c: 2, f: UNIX_F, l: UNIX_L } } },
      });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const ep0 = result.seasons[0].episodes[0];
      expect(ep0.watched).toBe(true);
      expect(ep0.watchCount).toBe(2);
      expect(ep0.firstWatchedAt).toBe(ISO_F);
      expect(ep0.lastWatchedAt).toBe(ISO_L);
    });

    it('f/l fehlend oder 0 → firstWatchedAt/lastWatchedAt fehlen als Keys komplett', () => {
      const watch = makeWatch({
        '0': { eps: { '1001': { w: 1, c: 1, f: 0 } } },
      });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const ep0 = result.seasons[0].episodes[0];
      expect(ep0.watched).toBe(true);
      expect(ep0).not.toHaveProperty('firstWatchedAt');
      expect(ep0).not.toHaveProperty('lastWatchedAt');
    });

    it('BEFUND-nah: Legacy-Eintrag {w:1} ohne c ergibt watched=true, aber watchCount=0 (nicht 1)', () => {
      // Domänenregel "Legacy {w:1} = 1 früherer Watch" wird HIER nicht angewendet;
      // die 1-Zählung passiert erst in nachgelagerter Logik.
      const watch = makeWatch({ '0': { eps: { '1001': { w: 1 } } } });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      expect(result.seasons[0].episodes[0].watched).toBe(true);
      expect(result.seasons[0].episodes[0].watchCount).toBe(0);
    });

    it('w=0 mit c>0 (Rewatch-Buchhaltung): watched=false, watchCount bleibt erhalten', () => {
      const watch = makeWatch({ '0': { eps: { '1001': { w: 0, c: 3, l: UNIX_L } } } });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const ep0 = result.seasons[0].episodes[0];
      expect(ep0.watched).toBe(false);
      expect(ep0.watchCount).toBe(3);
      expect(ep0.lastWatchedAt).toBe(ISO_L);
    });

    it('Episode-id nicht in eps-Map → ungesehen', () => {
      const watch = makeWatch({ '0': { eps: { '1001': { w: 1, c: 1 } } } });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const ep1 = result.seasons[0].episodes[1];
      expect(ep1.watched).toBe(false);
      expect(ep1.watchCount).toBe(0);
    });

    it('Episode mit id=null wird im Epid-Format nie gematcht (fällt durch, ungesehen)', () => {
      const nullSeasons = { '0': { seasonNumber: 0, episodes: [makeEp(null)] } };
      const watch = makeWatch({ '0': { eps: { null: { w: 1, c: 5 }, '0': { w: 1, c: 5 } } } });
      const result = mergeToSeriesView(
        1,
        makeCatalog({ seasons: nullSeasons }),
        makeUserRef(),
        watch
      );
      expect(result.seasons[0].episodes[0].watched).toBe(false);
      expect(result.seasons[0].episodes[0].watchCount).toBe(0);
    });
  });

  describe('Watch-Daten: Legacy-Index-Array-Format {w:[],c:[],f:[],l:[]}', () => {
    const seasons = {
      '0': { seasonNumber: 0, episodes: [makeEp(1001), makeEp(1002)] },
    };

    it('liest watched/count/first/last per Array-Index', () => {
      const watch = makeWatch({
        '0': { w: [1, 0], c: [4, 0], f: [UNIX_F, 0], l: [UNIX_L, 0] },
      });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const [ep0, ep1] = result.seasons[0].episodes;
      expect(ep0.watched).toBe(true);
      expect(ep0.watchCount).toBe(4);
      expect(ep0.firstWatchedAt).toBe(ISO_F);
      expect(ep0.lastWatchedAt).toBe(ISO_L);
      expect(ep1.watched).toBe(false);
      expect(ep1.watchCount).toBe(0);
      expect(ep1).not.toHaveProperty('firstWatchedAt');
    });

    it('fehlende c/f/l-Arrays: watched aus w, count 0, keine Timestamps', () => {
      const watch = makeWatch({ '0': { w: [1] } });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const ep0 = result.seasons[0].episodes[0];
      expect(ep0.watched).toBe(true);
      expect(ep0.watchCount).toBe(0);
      expect(ep0).not.toHaveProperty('firstWatchedAt');
      expect(ep0).not.toHaveProperty('lastWatchedAt');
    });

    it('teil-migrierte Season: eps-Map gewinnt pro Episode, Rest fällt auf Legacy-Array zurück', () => {
      // Episode 1002 ist schon ID-basiert markiert, 1001 steht noch im Array.
      const watch = makeWatch({
        '0': {
          eps: { '1002': { w: 1, c: 1, f: UNIX_F } },
          w: [1, 0],
          c: [7, 0],
        },
      });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const [ep0, ep1] = result.seasons[0].episodes;
      expect(ep0.watched).toBe(true); // aus Legacy-Array idx 0
      expect(ep0.watchCount).toBe(7);
      expect(ep1.watched).toBe(true); // aus eps-Map per id
      expect(ep1.watchCount).toBe(1);
      expect(ep1.firstWatchedAt).toBe(ISO_F);
    });
  });

  describe('Watch-Daten: Pre-Compact-Format {episodes:{idx:{...}}}', () => {
    const seasons = {
      '0': { seasonNumber: 0, episodes: [makeEp(1001), makeEp(1002)] },
    };

    it('liest per Index-Key und reicht ISO-Strings unverändert durch', () => {
      const watch = makeWatch({
        '0': {
          episodes: {
            '0': {
              watched: true,
              watchCount: 2,
              firstWatchedAt: '2023-01-01T10:00:00.000Z',
              lastWatchedAt: '2023-02-01T10:00:00.000Z',
            },
          },
        },
      });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const ep0 = result.seasons[0].episodes[0];
      expect(ep0.watched).toBe(true);
      expect(ep0.watchCount).toBe(2);
      expect(ep0.firstWatchedAt).toBe('2023-01-01T10:00:00.000Z');
      expect(ep0.lastWatchedAt).toBe('2023-02-01T10:00:00.000Z');
    });

    it('fehlende Felder im Eintrag: watched=false, watchCount=0, keine Timestamps', () => {
      const watch = makeWatch({ '0': { episodes: { '0': {} } } });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      const ep0 = result.seasons[0].episodes[0];
      expect(ep0.watched).toBe(false);
      expect(ep0.watchCount).toBe(0);
      expect(ep0).not.toHaveProperty('firstWatchedAt');
    });

    it('Season {w:1} (w kein Array) wird NICHT als Legacy-Array erkannt → ungesehen', () => {
      const watch = makeWatch({ '0': { w: 1 } });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      expect(result.seasons[0].episodes[0].watched).toBe(false);
      expect(result.seasons[0].episodes[0].watchCount).toBe(0);
    });
  });

  describe('ohne watchData', () => {
    it('alle Episoden ungesehen, watchCount 0, keine Timestamp-Keys', () => {
      const seasons = { '0': { seasonNumber: 0, episodes: [makeEp(1)] } };
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef());
      const ep0 = result.seasons[0].episodes[0];
      expect(ep0.watched).toBe(false);
      expect(ep0.watchCount).toBe(0);
      expect(ep0).not.toHaveProperty('firstWatchedAt');
      expect(ep0).not.toHaveProperty('lastWatchedAt');
    });

    it('watchData ohne passende Season-Keys lässt Episoden ungesehen', () => {
      const seasons = { '1': { seasonNumber: 1, episodes: [makeEp(1)] } };
      const watch = makeWatch({ '0': { eps: { '1': { w: 1, c: 1 } } } });
      const result = mergeToSeriesView(1, makeCatalog({ seasons }), makeUserRef(), watch);
      expect(result.seasons[0].episodes[0].watched).toBe(false);
    });
  });
});

// ---------- mergeToMovieView ----------

describe('mergeToMovieView', () => {
  it('verpackt Catalog-Felder in Wrapper-Shapes und übernimmt runtime', () => {
    const result = mergeToMovieView(27205, makeMovieCatalog(), makeMovieRef());
    expect(result.id).toBe(27205);
    expect(result.title).toBe('Inception');
    expect(result.poster).toEqual({ poster: '/inception.jpg' });
    expect(result.genre).toEqual({ genres: ['Sci-Fi'] });
    expect(result.provider).toEqual({ provider: [{ id: 9, logo: '/prime.png', name: 'Prime' }] });
    expect(result.imdb).toEqual({ imdb_id: 'tt1375666' });
    expect(result.wo).toEqual({ wo: 'https://example.com/movie' });
    expect(result.runtime).toBe(148);
  });

  it('imdbId/woUrl null → leere Strings', () => {
    const result = mergeToMovieView(
      1,
      makeMovieCatalog({ imdbId: null, woUrl: null }),
      makeMovieRef()
    );
    expect(result.imdb).toEqual({ imdb_id: '' });
    expect(result.wo).toEqual({ wo: '' });
  });

  it('begpirate → begründung, fehlend → leerer String', () => {
    const mit = mergeToMovieView(1, makeMovieCatalog(), makeMovieRef({ begpirate: 'Klassiker' }));
    const ohne = mergeToMovieView(1, makeMovieCatalog(), makeMovieRef({ begpirate: undefined }));
    expect(mit.begründung).toBe('Klassiker');
    expect(ohne.begründung).toBe('');
  });

  it('rating-Map wird als selbe Referenz durchgereicht', () => {
    const rating = { userX: 10, userY: -1 };
    const result = mergeToMovieView(1, makeMovieCatalog(), makeMovieRef({ rating }));
    expect(result.rating).toBe(rating);
  });

  it('status/releaseDate/collectionId null → undefined', () => {
    const result = mergeToMovieView(
      1,
      makeMovieCatalog({ status: null, releaseDate: null, collectionId: null }),
      makeMovieRef()
    );
    expect(result.status).toBeUndefined();
    expect(result.release_date).toBeUndefined();
    expect(result.collection_id).toBeUndefined();
  });

  it('collectionId 0 bleibt 0 (falsy, aber nicht nullish)', () => {
    const result = mergeToMovieView(1, makeMovieCatalog({ collectionId: 0 }), makeMovieRef());
    expect(result.collection_id).toBe(0);
  });

  it('reicht User-Felder (watched/watchlist/addedAt/watchedAt/ratedAt/watchHistory) durch', () => {
    const watchHistory = [
      { timestamp: '2024-05-05T20:00:00.000Z', rating: 9, deviceType: 'mobile' as const },
    ];
    const result = mergeToMovieView(
      1,
      makeMovieCatalog(),
      makeMovieRef({
        watched: true,
        watchlist: false,
        addedAt: '2024-01-01',
        watchedAt: '2024-02-02',
        ratedAt: '2024-03-03',
        watchHistory,
        beschreibung: 'Film-Notiz',
      })
    );
    expect(result.watched).toBe(true);
    expect(result.watchlist).toBe(false);
    expect(result.addedAt).toBe('2024-01-01');
    expect(result.watchedAt).toBe('2024-02-02');
    expect(result.ratedAt).toBe('2024-03-03');
    expect(result.watchHistory).toBe(watchHistory);
    expect(result.beschreibung).toBe('Film-Notiz');
  });

  it('genres/providers als sparse RTDB-Objekte werden zu Arrays koerziert', () => {
    const result = mergeToMovieView(
      1,
      makeMovieCatalog({
        genres: { 1: 'Action', 3: 'Thriller' },
        providers: { 2: { id: 8, logo: '/n.png', name: 'Netflix' } },
      }),
      makeMovieRef()
    );
    expect(result.genre.genres).toEqual(['Action', 'Thriller']);
    expect(result.provider?.provider).toEqual([{ id: 8, logo: '/n.png', name: 'Netflix' }]);
  });

  it('genres fehlend/primitiv → leeres Array', () => {
    const fehlt = mergeToMovieView(1, makeMovieCatalog({ genres: undefined }), makeMovieRef());
    const primitiv = mergeToMovieView(1, makeMovieCatalog({ genres: 'Action' }), makeMovieRef());
    expect(fehlt.genre.genres).toEqual([]);
    expect(primitiv.genre.genres).toEqual([]);
  });
});
