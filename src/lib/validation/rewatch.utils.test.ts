import { describe, expect, it } from 'vitest';
import type { Series } from '../../types/Series';
import {
  getImplicitRewatchRound,
  getMaxWatchCount,
  getNextRewatchEpisode,
  getRewatchProgress,
  getRewatchRound,
  hasActiveRewatch,
  hasAnySeasonFullyWatched,
} from './rewatch.utils';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

/** Baut eine minimale Episode; id wird auch als episode_number verwendet. */
const ep = (id: number, overrides: Partial<Episode> = {}): Episode => ({
  id,
  name: `Ep ${id}`,
  air_date: '2020-01-01',
  watched: false,
  episode_number: id,
  ...overrides,
});

const season = (seasonNumber: number, episodes: Episode[]): Season => ({
  seasonNumber,
  episodes,
});

const makeSeries = (overrides: Partial<Series> = {}): Series =>
  ({
    id: 42,
    title: 'Testserie',
    seasons: [],
    ...overrides,
  }) as unknown as Series;

describe('rewatch.utils — Characterization', () => {
  describe('hasActiveRewatch', () => {
    it('gibt true zurück wenn rewatch.active true ist', () => {
      const s = makeSeries({ rewatch: { active: true, round: 1 } });
      expect(hasActiveRewatch(s)).toBe(true);
    });

    it('gibt false zurück wenn rewatch.active false ist', () => {
      const s = makeSeries({ rewatch: { active: false, round: 1 } });
      expect(hasActiveRewatch(s)).toBe(false);
    });

    it('gibt false zurück wenn kein rewatch-Objekt existiert', () => {
      expect(hasActiveRewatch(makeSeries())).toBe(false);
    });

    it('koerziert fehlendes active-Feld via !! zu false', () => {
      const s = makeSeries({ rewatch: { round: 2 } as Series['rewatch'] });
      expect(hasActiveRewatch(s)).toBe(false);
    });
  });

  describe('getRewatchRound', () => {
    it('gibt rewatch.round zurück', () => {
      const s = makeSeries({ rewatch: { active: true, round: 3 } });
      expect(getRewatchRound(s)).toBe(3);
    });

    it('gibt 0 zurück ohne rewatch-Objekt', () => {
      expect(getRewatchRound(makeSeries())).toBe(0);
    });

    it('gibt 0 zurück bei round: 0 (||-Fallback)', () => {
      const s = makeSeries({ rewatch: { active: true, round: 0 } });
      expect(getRewatchRound(s)).toBe(0);
    });
  });

  describe('getNextRewatchEpisode', () => {
    it('gibt null zurück wenn seasons fehlt oder leer ist', () => {
      expect(
        getNextRewatchEpisode(
          makeSeries({
            seasons: undefined as unknown as Series['seasons'],
            rewatch: { active: true, round: 1 },
          })
        )
      ).toBeNull();
      expect(
        getNextRewatchEpisode(makeSeries({ seasons: [], rewatch: { active: true, round: 1 } }))
      ).toBeNull();
    });

    it('gibt null zurück ohne aktiven Rewatch, selbst wenn Episoden qualifizieren würden', () => {
      const s = makeSeries({
        seasons: [season(1, [ep(101, { watched: true, watchCount: 1 })])],
      });
      expect(getNextRewatchEpisode(s)).toBeNull();
      const inactive = makeSeries({
        seasons: [season(1, [ep(101, { watched: true, watchCount: 1 })])],
        rewatch: { active: false, round: 1 },
      });
      expect(getNextRewatchEpisode(inactive)).toBeNull();
    });

    it('liefert die erste gesehene, noch nicht abgehakte Episode mit vollem Shape (Spread + Zusatzfelder)', () => {
      const s = makeSeries({
        seasons: [season(1, [ep(101, { watched: true, watchCount: 1 })])],
        rewatch: { active: true, round: 1 },
      });
      const result = getNextRewatchEpisode(s);
      expect(result).toEqual({
        id: 101,
        name: 'Ep 101',
        air_date: '2020-01-01',
        watched: true,
        watchCount: 1,
        episode_number: 101,
        seasonNumber: 1,
        seasonIndex: 0,
        episodeIndex: 0,
        currentWatchCount: 1,
        targetWatchCount: 2,
      });
    });

    it('targetWatchCount = max(2, round+1): Runde 0/1 → 2, Runde 4 → 5', () => {
      const base = [season(1, [ep(1, { watched: true, watchCount: 1 })])];
      expect(
        getNextRewatchEpisode(makeSeries({ seasons: base, rewatch: { active: true, round: 0 } }))
          ?.targetWatchCount
      ).toBe(2);
      expect(
        getNextRewatchEpisode(makeSeries({ seasons: base, rewatch: { active: true, round: 1 } }))
          ?.targetWatchCount
      ).toBe(2);
      expect(
        getNextRewatchEpisode(makeSeries({ seasons: base, rewatch: { active: true, round: 4 } }))
          ?.targetWatchCount
      ).toBe(5);
    });

    it('überspringt ungesehene Episoden', () => {
      const s = makeSeries({
        seasons: [season(1, [ep(1, { watched: false }), ep(2, { watched: true, watchCount: 1 })])],
        rewatch: { active: true, round: 1 },
      });
      expect(getNextRewatchEpisode(s)?.id).toBe(2);
    });

    it('überspringt explizit in rewatchedEps abgehakte Episoden (Key = String(id))', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 1 }),
            ep(2, { watched: true, watchCount: 1 }),
          ]),
        ],
        rewatch: { active: true, round: 1, rewatchedEps: { '1': true } },
      });
      expect(getNextRewatchEpisode(s)?.id).toBe(2);
    });

    it('überspringt Episoden deren watchCount das Round-Target schon erreicht hat (impliedDone)', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 2 }),
            ep(2, { watched: true, watchCount: 3 }),
            ep(3, { watched: true, watchCount: 1 }),
          ]),
        ],
        rewatch: { active: true, round: 1 },
      });
      expect(getNextRewatchEpisode(s)?.id).toBe(3);
    });

    it('gibt null zurück wenn alle gesehenen Episoden fertig sind (explizit oder implied)', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 2 }),
            ep(2, { watched: true, watchCount: 1 }),
            ep(3, { watched: false }),
          ]),
        ],
        rewatch: { active: true, round: 1, rewatchedEps: { '2': true } },
      });
      expect(getNextRewatchEpisode(s)).toBeNull();
    });

    it('fehlender oder 0-watchCount wird als currentWatchCount 1 behandelt', () => {
      const missing = makeSeries({
        seasons: [season(1, [ep(1, { watched: true })])],
        rewatch: { active: true, round: 1 },
      });
      expect(getNextRewatchEpisode(missing)?.currentWatchCount).toBe(1);
      const zero = makeSeries({
        seasons: [season(1, [ep(1, { watched: true, watchCount: 0 })])],
        rewatch: { active: true, round: 1 },
      });
      expect(getNextRewatchEpisode(zero)?.currentWatchCount).toBe(1);
    });

    it('BEFUND: Episode mit id=0 kann nie explizit abgehakt werden (truthiness-Check auf id)', () => {
      const s = makeSeries({
        seasons: [season(1, [ep(0, { watched: true, watchCount: 1, episode_number: 1 })])],
        rewatch: { active: true, round: 1, rewatchedEps: { '0': true } },
      });
      // trotz rewatchedEps['0'] wird die Episode weiterhin vorgeschlagen
      expect(getNextRewatchEpisode(s)?.id).toBe(0);
    });

    it('akzeptiert Episoden als sparse RTDB-Objekt (Object.values)', () => {
      const s = makeSeries({
        seasons: [
          {
            seasonNumber: 1,
            episodes: {
              '0': ep(1, { watched: true, watchCount: 2 }),
              '2': ep(3, { watched: true, watchCount: 1 }),
            } as unknown as Episode[],
          },
        ],
        rewatch: { active: true, round: 1 },
      });
      const result = getNextRewatchEpisode(s);
      expect(result?.id).toBe(3);
      // BEFUND/Charakterisierung: episodeIndex ist der Index in Object.values-
      // Reihenfolge (1), NICHT der ursprüngliche Objekt-Key (2).
      expect(result?.episodeIndex).toBe(1);
    });

    it('BEFUND: episodeIndex ist der ROHE Array-Index — null-Einträge werden übersprungen, aber mitgezählt', () => {
      const s = makeSeries({
        seasons: [
          {
            seasonNumber: 1,
            episodes: [null, ep(2, { watched: true, watchCount: 1 })] as unknown as Episode[],
          },
        ],
        rewatch: { active: true, round: 1 },
      });
      const result = getNextRewatchEpisode(s);
      expect(result?.id).toBe(2);
      expect(result?.episodeIndex).toBe(1);
    });

    it('überspringt Episoden ohne episode_number und Seasons die kein Objekt sind', () => {
      const s = makeSeries({
        seasons: [
          null as unknown as Season,
          season(2, [
            ep(1, { watched: true, watchCount: 1, episode_number: undefined }),
            ep(2, { watched: true, watchCount: 1 }),
          ]),
        ],
        rewatch: { active: true, round: 1 },
      });
      const result = getNextRewatchEpisode(s);
      expect(result?.id).toBe(2);
      expect(result?.seasonIndex).toBe(1);
      expect(result?.seasonNumber).toBe(2);
    });

    it('BEFUND: seasonNumber kommt nur aus season.seasonNumber — TMDB season_number wird ignoriert (undefined)', () => {
      const s = makeSeries({
        seasons: [
          {
            season_number: 1,
            episodes: [ep(1, { watched: true, watchCount: 1 })],
          } as unknown as Season,
        ],
        rewatch: { active: true, round: 1 },
      });
      expect(getNextRewatchEpisode(s)?.seasonNumber).toBeUndefined();
    });

    it('iteriert Seasons in Array-Reihenfolge über Staffelgrenzen hinweg', () => {
      const s = makeSeries({
        seasons: [
          season(1, [ep(1, { watched: true, watchCount: 2 })]),
          season(2, [ep(2, { watched: true, watchCount: 1 })]),
        ],
        rewatch: { active: true, round: 1 },
      });
      const result = getNextRewatchEpisode(s);
      expect(result?.id).toBe(2);
      expect(result?.seasonIndex).toBe(1);
      expect(result?.seasonNumber).toBe(2);
    });

    it('BEFUND: watched wird nur per Truthiness geprüft — String "false" gilt als gesehen, firstWatchedAt allein nicht', () => {
      const stringFalse = makeSeries({
        seasons: [season(1, [ep(1, { watched: 'false' as unknown as boolean, watchCount: 1 })])],
        rewatch: { active: true, round: 1 },
      });
      expect(getNextRewatchEpisode(stringFalse)?.id).toBe(1);

      const onlyFirstWatchedAt = makeSeries({
        seasons: [season(1, [ep(1, { watched: false, firstWatchedAt: '2020-01-01T00:00:00Z' })])],
        rewatch: { active: true, round: 1 },
      });
      expect(getNextRewatchEpisode(onlyFirstWatchedAt)).toBeNull();
    });
  });

  describe('getRewatchProgress', () => {
    it('gibt {0,0} zurück für fehlende oder leere seasons', () => {
      expect(
        getRewatchProgress(makeSeries({ seasons: undefined as unknown as Series['seasons'] }))
      ).toEqual({ current: 0, total: 0 });
      expect(getRewatchProgress(makeSeries({ seasons: [] }))).toEqual({ current: 0, total: 0 });
    });

    it('total = Anzahl gesehener Episoden, current = explizit abgehakte', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 1 }),
            ep(2, { watched: true, watchCount: 1 }),
            ep(3, { watched: false }),
          ]),
        ],
        rewatch: { active: true, round: 1, rewatchedEps: { '1': true } },
      });
      expect(getRewatchProgress(s)).toEqual({ current: 1, total: 2 });
    });

    it('BEFUND: prüft NICHT auf aktiven Rewatch — rechnet auch ohne rewatch-Objekt (Target 2)', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 2 }),
            ep(2, { watched: true, watchCount: 1 }),
          ]),
        ],
      });
      expect(getRewatchProgress(s)).toEqual({ current: 1, total: 2 });
    });

    it('impliedDone: watchCount >= Target zählt als abgehakt, Runde verschiebt das Target', () => {
      const seasons = [
        season(1, [
          ep(1, { watched: true, watchCount: 2 }),
          ep(2, { watched: true, watchCount: 3 }),
          ep(3, { watched: true, watchCount: 1 }),
        ]),
      ];
      // Runde 1 → Target 2: Eps 1+2 done
      expect(
        getRewatchProgress(makeSeries({ seasons, rewatch: { active: true, round: 1 } }))
      ).toEqual({ current: 2, total: 3 });
      // Runde 2 → Target 3: nur Ep 2 done
      expect(
        getRewatchProgress(makeSeries({ seasons, rewatch: { active: true, round: 2 } }))
      ).toEqual({ current: 1, total: 3 });
    });

    it('BEFUND: Episode mit id=0 zählt nie als explizit abgehakt', () => {
      const s = makeSeries({
        seasons: [season(1, [ep(0, { watched: true, watchCount: 1, episode_number: 1 })])],
        rewatch: { active: true, round: 1, rewatchedEps: { '0': true } },
      });
      expect(getRewatchProgress(s)).toEqual({ current: 0, total: 1 });
    });

    it('normalisiert Objekt-Episoden und filtert ungültige Einträge (null, ohne episode_number)', () => {
      const s = makeSeries({
        seasons: [
          {
            seasonNumber: 1,
            episodes: {
              '0': null,
              '1': ep(1, { watched: true, watchCount: 2 }),
              '2': ep(2, { watched: true, watchCount: 1, episode_number: undefined }),
            } as unknown as Episode[],
          },
        ],
        rewatch: { active: true, round: 1 },
      });
      // Ep 2 fällt durch den episode_number-Filter → weder total noch current
      expect(getRewatchProgress(s)).toEqual({ current: 1, total: 1 });
    });
  });

  describe('hasAnySeasonFullyWatched', () => {
    it('gibt false zurück für fehlende oder leere seasons', () => {
      expect(
        hasAnySeasonFullyWatched(makeSeries({ seasons: undefined as unknown as Series['seasons'] }))
      ).toBe(false);
      expect(hasAnySeasonFullyWatched(makeSeries({ seasons: [] }))).toBe(false);
    });

    it('gibt false zurück wenn alle Seasons leere Episodenlisten haben', () => {
      const s = makeSeries({ seasons: [season(1, []), season(2, [])] });
      expect(hasAnySeasonFullyWatched(s)).toBe(false);
    });

    it('gibt true zurück wenn mindestens eine Season komplett gesehen ist', () => {
      const s = makeSeries({
        seasons: [
          season(1, [ep(1, { watched: false }), ep(2, { watched: true })]),
          season(2, [ep(3, { watched: true }), ep(4, { watched: true })]),
        ],
      });
      expect(hasAnySeasonFullyWatched(s)).toBe(true);
    });

    it('gibt false zurück wenn jede Season mindestens eine ungesehene Episode hat', () => {
      const s = makeSeries({
        seasons: [
          season(1, [ep(1, { watched: true }), ep(2, { watched: false })]),
          season(2, [ep(3, { watched: false })]),
        ],
      });
      expect(hasAnySeasonFullyWatched(s)).toBe(false);
    });

    it('leere Season blockiert nicht — spätere volle Season zählt (Objekt-Episoden inklusive)', () => {
      const s = makeSeries({
        seasons: [
          season(1, []),
          {
            seasonNumber: 2,
            episodes: { '5': ep(5, { watched: true }) } as unknown as Episode[],
          },
        ],
      });
      expect(hasAnySeasonFullyWatched(s)).toBe(true);
    });
  });

  describe('getImplicitRewatchRound', () => {
    it('gibt 0 zurück für fehlende oder leere seasons', () => {
      expect(
        getImplicitRewatchRound(makeSeries({ seasons: undefined as unknown as Series['seasons'] }))
      ).toBe(0);
      expect(getImplicitRewatchRound(makeSeries({ seasons: [] }))).toBe(0);
    });

    it('gibt 0 zurück bei explizit aktivem Rewatch, auch mit gemischten watchCounts', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 3 }),
            ep(2, { watched: true, watchCount: 1 }),
          ]),
        ],
        rewatch: { active: true, round: 2 },
      });
      expect(getImplicitRewatchRound(s)).toBe(0);
    });

    it('gibt 0 zurück wenn alle Episoden gesehen sind mit identischem watchCount (fully watched)', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 2 }),
            ep(2, { watched: true, watchCount: 2 }),
          ]),
        ],
      });
      expect(getImplicitRewatchRound(s)).toBe(0);
    });

    it('gibt maxWatchCount-1 zurück bei gemischten watchCounts gesehener Episoden', () => {
      const mixed2 = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 2 }),
            ep(2, { watched: true, watchCount: 1 }),
          ]),
        ],
      });
      expect(getImplicitRewatchRound(mixed2)).toBe(1);

      const mixed3 = makeSeries({
        seasons: [season(1, [ep(1, { watched: true, watchCount: 3 }), ep(2, { watched: true })])],
      });
      expect(getImplicitRewatchRound(mixed3)).toBe(2);
    });

    it('gibt 0 zurück wenn keine Episode gesehen wurde oder max watchCount <= 1', () => {
      const unwatched = makeSeries({
        seasons: [season(1, [ep(1, { watched: false, watchCount: 5 })])],
      });
      expect(getImplicitRewatchRound(unwatched)).toBe(0);

      const allOnce = makeSeries({
        seasons: [season(1, [ep(1, { watched: true, watchCount: 1 }), ep(2, { watched: false })])],
      });
      expect(getImplicitRewatchRound(allOnce)).toBe(0);
    });

    it('BEFUND: gesehene Eps alle mit gleichem Count > 1, aber Serie nicht komplett → trotzdem 0 (min==max)', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 2 }),
            ep(2, { watched: true, watchCount: 2 }),
            ep(3, { watched: false }),
          ]),
        ],
      });
      expect(getImplicitRewatchRound(s)).toBe(0);
    });

    it('watchCount 0 oder fehlend wird als 1 gewertet (||-Fallback)', () => {
      const s = makeSeries({
        seasons: [
          season(1, [
            ep(1, { watched: true, watchCount: 0 }),
            ep(2, { watched: true, watchCount: 3 }),
          ]),
        ],
      });
      expect(getImplicitRewatchRound(s)).toBe(2);
    });
  });

  describe('getMaxWatchCount', () => {
    it('gibt 0 zurück für fehlende oder leere seasons', () => {
      expect(
        getMaxWatchCount(makeSeries({ seasons: undefined as unknown as Series['seasons'] }))
      ).toBe(0);
      expect(getMaxWatchCount(makeSeries({ seasons: [] }))).toBe(0);
    });

    it('gibt 0 zurück wenn keine Episode gesehen ist — watchCount ungesehener Eps zählt nicht', () => {
      const s = makeSeries({
        seasons: [season(1, [ep(1, { watched: false, watchCount: 7 })])],
      });
      expect(getMaxWatchCount(s)).toBe(0);
    });

    it('liefert das Maximum über alle Seasons; fehlender watchCount zählt als 1', () => {
      const s = makeSeries({
        seasons: [
          season(1, [ep(1, { watched: true }), ep(2, { watched: true, watchCount: 4 })]),
          season(2, [ep(3, { watched: true, watchCount: 2 })]),
        ],
      });
      expect(getMaxWatchCount(s)).toBe(4);
    });

    it('funktioniert mit Objekt-Episoden und ignoriert ungültige Einträge', () => {
      const s = makeSeries({
        seasons: [
          {
            seasonNumber: 1,
            episodes: {
              '0': null,
              '3': ep(3, { watched: true, watchCount: 3 }),
            } as unknown as Episode[],
          },
        ],
      });
      expect(getMaxWatchCount(s)).toBe(3);
    });
  });
});
