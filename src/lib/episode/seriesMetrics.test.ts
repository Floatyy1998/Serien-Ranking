import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import {
  DEFAULT_EPISODE_RUNTIME_MINUTES,
  calculateSeriesMetrics,
  getSeriesLastWatchedAt,
  isEpisodeWatched,
  normalizeEpisodes,
  normalizeSeasons,
} from './seriesMetrics';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

/** Fixer "Jetzt"-Zeitpunkt für deterministische aired-Checks (lokal 15.06.2026, 12:00). */
const NOW_LOCAL = new Date(2026, 5, 15, 12, 0, 0);

const makeEp = (over: Partial<Episode> = {}): Episode =>
  ({
    id: 100,
    name: 'Ep',
    air_date: '2000-01-01', // weit in der Vergangenheit → sicher aired
    watched: false,
    episode_number: 1,
    ...over,
  }) as Episode;

const makeSeries = (seasons: unknown): Series => ({ seasons }) as unknown as Series;

describe('DEFAULT_EPISODE_RUNTIME_MINUTES', () => {
  it('ist 45 Minuten (Fallback für fehlende Episoden-/Serien-Runtime in allen Konsumenten)', () => {
    expect(DEFAULT_EPISODE_RUNTIME_MINUTES).toBe(45);
  });
});

describe('normalizeSeasons', () => {
  it('gibt [] für undefined zurück', () => {
    expect(normalizeSeasons(undefined)).toEqual([]);
  });

  it('reicht ein Array unverändert durch (gleiche Elemente, gleiche Reihenfolge)', () => {
    const s0 = { seasonNumber: 1, episodes: [] } as unknown as Season;
    const s1 = { seasonNumber: 2, episodes: [] } as unknown as Season;
    expect(normalizeSeasons([s0, s1])).toEqual([s0, s1]);
  });

  it('koerziert RTDB-sparse-Objekte (numerische Keys) via Object.values in ein Array', () => {
    const s0 = { seasonNumber: 1, episodes: [] } as unknown as Season;
    const s2 = { seasonNumber: 3, episodes: [] } as unknown as Season;
    const sparse = { '0': s0, '2': s2 } as unknown as Series['seasons'];
    expect(normalizeSeasons(sparse)).toEqual([s0, s2]);
  });

  it('filtert null-Einträge aus Arrays (RTDB-sparse-Array mit Lücken)', () => {
    const s = { seasonNumber: 1, episodes: [] } as unknown as Season;
    const arr = [null, s, null] as unknown as Series['seasons'];
    expect(normalizeSeasons(arr)).toEqual([s]);
  });

  it('filtert Nicht-Objekt-Einträge (Strings, Zahlen) heraus', () => {
    const s = { seasonNumber: 1, episodes: [] } as unknown as Season;
    const arr = ['kaputt', 42, s] as unknown as Series['seasons'];
    expect(normalizeSeasons(arr)).toEqual([s]);
  });
});

describe('normalizeEpisodes', () => {
  it('gibt [] für undefined zurück', () => {
    expect(normalizeEpisodes(undefined)).toEqual([]);
  });

  it('koerziert Objekt-Format (RTDB) via Object.values in ein Array', () => {
    const e1 = makeEp({ id: 1, episode_number: 1 });
    const e2 = makeEp({ id: 2, episode_number: 2 });
    expect(normalizeEpisodes({ '0': e1, '5': e2 })).toEqual([e1, e2]);
  });

  it('filtert null-Einträge heraus', () => {
    const e1 = makeEp();
    expect(normalizeEpisodes([null, e1] as unknown as Episode[])).toEqual([e1]);
  });

  it('filtert Episoden ohne episode_number (undefined und null) heraus', () => {
    const ok = makeEp({ episode_number: 3 });
    const missing = makeEp();
    delete (missing as Record<string, unknown>).episode_number;
    const nulled = makeEp({ episode_number: null as unknown as number });
    expect(normalizeEpisodes([missing, nulled, ok])).toEqual([ok]);
  });

  it('behält episode_number 0 (== null-Check, kein Truthiness-Check)', () => {
    const specialEp = makeEp({ episode_number: 0 });
    expect(normalizeEpisodes([specialEp])).toEqual([specialEp]);
  });
});

describe('isEpisodeWatched — alle Legacy-Formate', () => {
  it('firstWatchedAt (nicht-leerer String) → watched', () => {
    expect(isEpisodeWatched({ firstWatchedAt: '2024-01-01T10:00:00.000Z' })).toBe(true);
  });

  it('firstWatchedAt als leerer String → NICHT watched (falsy)', () => {
    expect(isEpisodeWatched({ firstWatchedAt: '' })).toBe(false);
  });

  it('watched === true (boolean) → watched', () => {
    expect(isEpisodeWatched({ watched: true })).toBe(true);
  });

  it('watched === 1 (Legacy-Zahl, {w:1}) → watched', () => {
    expect(isEpisodeWatched({ watched: 1 })).toBe(true);
  });

  it("watched === 'true' (Legacy-String) → watched", () => {
    expect(isEpisodeWatched({ watched: 'true' })).toBe(true);
  });

  it("watched === 'false' → NICHT watched (strikte Gleichheit, keine String-Truthiness)", () => {
    expect(isEpisodeWatched({ watched: 'false' })).toBe(false);
  });

  it('watched false / 0 / undefined → NICHT watched', () => {
    expect(isEpisodeWatched({ watched: false })).toBe(false);
    expect(isEpisodeWatched({ watched: 0 })).toBe(false);
    expect(isEpisodeWatched({})).toBe(false);
  });

  it('watched === 2 → NICHT watched (nur exakt 1 zählt)', () => {
    expect(isEpisodeWatched({ watched: 2 })).toBe(false);
  });

  it("watched === 'TRUE' → NICHT watched (case-sensitive)", () => {
    expect(isEpisodeWatched({ watched: 'TRUE' })).toBe(false);
  });

  it('watchCount > 0 → watched, auch wenn watched explizit false ist', () => {
    expect(isEpisodeWatched({ watchCount: 3 })).toBe(true);
    expect(isEpisodeWatched({ watched: false, watchCount: 1 })).toBe(true);
  });

  it('watchCount 0 oder negativ → NICHT watched', () => {
    expect(isEpisodeWatched({ watchCount: 0 })).toBe(false);
    expect(isEpisodeWatched({ watchCount: -1 })).toBe(false);
  });

  it('gibt immer ein echtes boolean zurück (kein truthy/falsy-Leak)', () => {
    expect(isEpisodeWatched({ firstWatchedAt: '2024-01-01' })).toBe(true);
    expect(isEpisodeWatched({ watchCount: 5 })).toBe(true);
  });
});

describe('calculateSeriesMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_LOCAL);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('leere Serie (keine seasons) → alles 0, progress 0 (keine Division durch 0)', () => {
    expect(calculateSeriesMetrics(makeSeries(undefined))).toEqual({
      totalAiredEpisodes: 0,
      watchedEpisodes: 0,
      remainingEpisodes: 0,
      progress: 0,
    });
  });

  it('zählt NUR aired Episoden — zukünftige Episoden fehlen komplett (auch wenn watched)', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({ id: 1, episode_number: 1, air_date: '2000-01-01', watched: true }),
          makeEp({ id: 2, episode_number: 2, air_date: '2099-01-01', watched: false }),
          // Zukunft + watched: zählt weder in total noch in watched
          makeEp({ id: 3, episode_number: 3, air_date: '2099-01-02', watched: true }),
        ],
      },
    ]);
    expect(calculateSeriesMetrics(series)).toEqual({
      totalAiredEpisodes: 1,
      watchedEpisodes: 1,
      remainingEpisodes: 0,
      progress: 100,
    });
  });

  it('Episode ohne jegliches Datum gilt als nicht aired und wird komplett ignoriert', () => {
    const noDate = makeEp({ watched: true });
    delete (noDate as Record<string, unknown>).air_date;
    const series = makeSeries([{ seasonNumber: 1, episodes: [noDate] }]);
    expect(calculateSeriesMetrics(series)).toEqual({
      totalAiredEpisodes: 0,
      watchedEpisodes: 0,
      remainingEpisodes: 0,
      progress: 0,
    });
  });

  it("BEFUND: nutzt ep.watched-TRUTHINESS statt isEpisodeWatched — watched:'false' zählt als geschaut", () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [makeEp({ watched: 'false' as unknown as boolean })],
      },
    ]);
    // 'false' ist ein truthy String → in den Metriken "geschaut",
    // obwohl isEpisodeWatched({watched:'false'}) false liefert.
    expect(calculateSeriesMetrics(series).watchedEpisodes).toBe(1);
  });

  it('BEFUND: firstWatchedAt-only Episode (ohne watched-Flag) zählt NICHT als geschaut', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [makeEp({ watched: false, firstWatchedAt: '2024-01-01T10:00:00.000Z' })],
      },
    ]);
    const m = calculateSeriesMetrics(series);
    expect(m.totalAiredEpisodes).toBe(1);
    expect(m.watchedEpisodes).toBe(0); // Divergenz zu isEpisodeWatched
  });

  it('BEFUND: watchCount-only Episode (watched false) zählt NICHT als geschaut', () => {
    const series = makeSeries([
      { seasonNumber: 1, episodes: [makeEp({ watched: false, watchCount: 3 })] },
    ]);
    expect(calculateSeriesMetrics(series).watchedEpisodes).toBe(0);
  });

  it('watched === 1 (Legacy) zählt als geschaut (truthy)', () => {
    const series = makeSeries([
      { seasonNumber: 1, episodes: [makeEp({ watched: 1 as unknown as boolean })] },
    ]);
    expect(calculateSeriesMetrics(series).watchedEpisodes).toBe(1);
  });

  it('progress wird gerundet: 1 von 3 → 33, remaining 2', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({ id: 1, episode_number: 1, watched: true }),
          makeEp({ id: 2, episode_number: 2 }),
          makeEp({ id: 3, episode_number: 3 }),
        ],
      },
    ]);
    expect(calculateSeriesMetrics(series)).toEqual({
      totalAiredEpisodes: 3,
      watchedEpisodes: 1,
      remainingEpisodes: 2,
      progress: 33,
    });
  });

  it('progress wird gerundet: 2 von 3 → 67 (aufgerundet)', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({ id: 1, episode_number: 1, watched: true }),
          makeEp({ id: 2, episode_number: 2, watched: true }),
          makeEp({ id: 3, episode_number: 3 }),
        ],
      },
    ]);
    expect(calculateSeriesMetrics(series).progress).toBe(67);
  });

  it('summiert über mehrere Seasons, auch in RTDB-Objektform (seasons UND episodes als Objekte)', () => {
    const series = makeSeries({
      '0': {
        seasonNumber: 1,
        episodes: {
          '0': makeEp({ id: 1, episode_number: 1, watched: true }),
          '1': makeEp({ id: 2, episode_number: 2 }),
        },
      },
      '2': {
        seasonNumber: 3,
        episodes: { '0': makeEp({ id: 3, episode_number: 1, watched: true }) },
      },
    });
    expect(calculateSeriesMetrics(series)).toEqual({
      totalAiredEpisodes: 3,
      watchedEpisodes: 2,
      remainingEpisodes: 1,
      progress: 67,
    });
  });

  it('malformed Episoden (ohne episode_number) fließen nicht in die Zählung ein', () => {
    const broken = makeEp({ watched: true });
    delete (broken as Record<string, unknown>).episode_number;
    const series = makeSeries([
      { seasonNumber: 1, episodes: [broken, makeEp({ id: 2, episode_number: 2 })] },
    ]);
    expect(calculateSeriesMetrics(series)).toEqual({
      totalAiredEpisodes: 1,
      watchedEpisodes: 0,
      remainingEpisodes: 1,
      progress: 0,
    });
  });

  it('airstamp gewinnt gegen air_date: heutige Episode mit Zukunfts-airstamp ist NICHT aired', () => {
    const pastStamp = new Date(2026, 5, 15, 11, 0, 0).toISOString(); // 1h vor "jetzt"
    const futureStamp = new Date(2026, 5, 15, 13, 0, 0).toISOString(); // 1h nach "jetzt"
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({ id: 1, episode_number: 1, air_date: '2026-06-15', airstamp: pastStamp }),
          makeEp({ id: 2, episode_number: 2, air_date: '2026-06-15', airstamp: futureStamp }),
        ],
      },
    ]);
    // Ohne airstamp würden BEIDE per End-of-day-Vergleich als aired zählen;
    // mit airstamp zählt nur die bereits gelaufene.
    expect(calculateSeriesMetrics(series).totalAiredEpisodes).toBe(1);
  });

  it('air_date von heute (ohne airstamp) zählt als aired (End-of-day-Vergleich), morgen nicht', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({ id: 1, episode_number: 1, air_date: '2026-06-15' }),
          makeEp({ id: 2, episode_number: 2, air_date: '2026-06-16' }),
        ],
      },
    ]);
    expect(calculateSeriesMetrics(series).totalAiredEpisodes).toBe(1);
  });

  it('TVMaze-Mitternachts-Quirk: 00:00-airstamp einen Tag nach air_date zählt bereits am air_date als aired', () => {
    // airstamp = lokal Mitternacht des FOLGETAGS (16.06. 00:00) → Quirk mappt auf air_date 15.06.
    const midnightNextDay = new Date(2026, 5, 16, 0, 0, 0).toISOString();
    const quirkEp = makeEp({
      id: 1,
      episode_number: 1,
      air_date: '2026-06-15',
      airstamp: midnightNextDay,
    });
    // Kontrolle: gleicher airstamp OHNE air_date → kein Quirk → Zukunft → nicht aired
    const controlEp = makeEp({ id: 2, episode_number: 2, airstamp: midnightNextDay });
    delete (controlEp as Record<string, unknown>).air_date;

    const series = makeSeries([{ seasonNumber: 1, episodes: [quirkEp, controlEp] }]);
    expect(calculateSeriesMetrics(series).totalAiredEpisodes).toBe(1);
  });
});

describe('getSeriesLastWatchedAt', () => {
  it("keine seasons → Fallback '1900-01-01'", () => {
    expect(getSeriesLastWatchedAt(makeSeries(undefined))).toBe('1900-01-01');
  });

  it("keine geschauten Episoden → '1900-01-01'", () => {
    const series = makeSeries([{ seasonNumber: 1, episodes: [makeEp({ watched: false })] }]);
    expect(getSeriesLastWatchedAt(series)).toBe('1900-01-01');
  });

  it('bevorzugt lastWatchedAt vor firstWatchedAt innerhalb einer Episode', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({
            watched: true,
            firstWatchedAt: '2023-01-01T10:00:00.000Z',
            lastWatchedAt: '2025-03-03T20:00:00.000Z',
          }),
        ],
      },
    ]);
    expect(getSeriesLastWatchedAt(series)).toBe('2025-03-03T20:00:00.000Z');
  });

  it('fällt auf firstWatchedAt zurück, wenn lastWatchedAt fehlt', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [makeEp({ watched: true, firstWatchedAt: '2024-06-01T08:00:00.000Z' })],
      },
    ]);
    expect(getSeriesLastWatchedAt(series)).toBe('2024-06-01T08:00:00.000Z');
  });

  it('liefert das Maximum über alle Episoden und Seasons (lexikografischer String-Vergleich)', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({
            id: 1,
            episode_number: 1,
            watched: true,
            lastWatchedAt: '2024-05-01T10:00:00.000Z',
          }),
          makeEp({
            id: 2,
            episode_number: 2,
            watched: true,
            firstWatchedAt: '2025-01-01T09:00:00.000Z',
          }),
        ],
      },
      {
        seasonNumber: 2,
        episodes: [
          makeEp({
            id: 3,
            episode_number: 1,
            watched: true,
            lastWatchedAt: '2024-12-31T23:59:59.000Z',
          }),
        ],
      },
    ]);
    expect(getSeriesLastWatchedAt(series)).toBe('2025-01-01T09:00:00.000Z');
  });

  it('BEFUND: Episode mit firstWatchedAt aber watched-falsy wird übersprungen (Gate ist ep.watched)', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [makeEp({ watched: false, firstWatchedAt: '2025-05-05T12:00:00.000Z' })],
      },
    ]);
    expect(getSeriesLastWatchedAt(series)).toBe('1900-01-01');
  });

  it("watched true aber ohne Timestamps → '1900-01-01'", () => {
    const series = makeSeries([{ seasonNumber: 1, episodes: [makeEp({ watched: true })] }]);
    expect(getSeriesLastWatchedAt(series)).toBe('1900-01-01');
  });

  it('kein aired-Gate: auch Episoden mit Zukunfts-air_date liefern ihren Timestamp', () => {
    const series = makeSeries([
      {
        seasonNumber: 1,
        episodes: [
          makeEp({
            air_date: '2099-01-01',
            watched: true,
            lastWatchedAt: '2026-01-01T00:00:00.000Z',
          }),
        ],
      },
    ]);
    expect(getSeriesLastWatchedAt(series)).toBe('2026-01-01T00:00:00.000Z');
  });

  it('Timestamps in Objekt-/RTDB-Form der seasons werden ebenfalls gefunden', () => {
    const series = makeSeries({
      '1': {
        seasonNumber: 2,
        episodes: { '0': makeEp({ watched: true, lastWatchedAt: '2025-07-07T07:00:00.000Z' }) },
      },
    });
    expect(getSeriesLastWatchedAt(series)).toBe('2025-07-07T07:00:00.000Z');
  });
});
