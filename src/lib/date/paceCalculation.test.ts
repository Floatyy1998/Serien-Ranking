import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import { calculateWatchingPace, formatPaceLine, type WatchingPace } from './paceCalculation';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

const AIRED = '2020-01-01'; // liegt in der Vergangenheit

const ep = (overrides: Partial<Episode> = {}): Episode =>
  ({
    id: Math.floor(Math.random() * 1e9),
    air_date: AIRED,
    watched: false,
    ...overrides,
  }) as unknown as Episode;

const seasons = (episodes: Episode[]): Series['seasons'] =>
  [{ seasonNumber: 1, episodes }] as unknown as Series['seasons'];

describe('calculateWatchingPace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gibt noShow für leere/fehlende seasons zurück', () => {
    expect(calculateWatchingPace([] as unknown as Series['seasons']).shouldShow).toBe(false);
    expect(calculateWatchingPace(undefined as unknown as Series['seasons']).shouldShow).toBe(false);
  });

  it('gibt noShow zurück, wenn keine offenen aired Episoden bleiben (remaining < 1)', () => {
    const s = seasons([
      ep({ watched: true, firstWatchedAt: '2024-06-10' }),
      ep({ watched: true, firstWatchedAt: '2024-06-11' }),
    ]);
    expect(calculateWatchingPace(s).shouldShow).toBe(false);
  });

  it('ignoriert null-Seasons und null-Episoden ohne zu crashen', () => {
    const s = [
      null,
      { seasonNumber: 1, episodes: [null, ep({ watched: false })] },
    ] as unknown as Series['seasons'];
    const result = calculateWatchingPace(s);
    expect(result.remainingEpisodes).toBe(1);
    expect(result.shouldShow).toBe(true);
  });

  describe('watchDates.length < 2 (nicht genug Timestamps)', () => {
    it('0 Timestamps → isPaused true (Infinity), remainingHours aus runtime berechnet', () => {
      const s = seasons([
        ep({ watched: true, runtime: 45 }), // gesehen aber ohne firstWatchedAt
        ep({ watched: false, runtime: 45 }),
      ]);
      const result = calculateWatchingPace(s);
      expect(result.shouldShow).toBe(true);
      expect(result.episodesPerWeek).toBe(0);
      expect(result.estimatedCompletionDate).toBeNull();
      expect(result.isPaused).toBe(true);
      // remaining 1 * 45 min → 0.75h → gerundet 0.8
      expect(result.remainingHours).toBe(0.8);
    });

    it('1 kürzlich gesehene Episode (< 14 Tage) → nicht pausiert', () => {
      const s = seasons([
        ep({ watched: true, firstWatchedAt: '2024-06-10' }),
        ep({ watched: false }),
      ]);
      const result = calculateWatchingPace(s);
      expect(result.isPaused).toBe(false);
      expect(result.shouldShow).toBe(true);
    });

    it('1 lange zurückliegende Episode (> 14 Tage) → pausiert', () => {
      const s = seasons([
        ep({ watched: true, firstWatchedAt: '2024-05-01' }),
        ep({ watched: false }),
      ]);
      expect(calculateWatchingPace(s).isPaused).toBe(true);
    });
  });

  describe('Pace-Berechnung mit >= 2 Timestamps', () => {
    it('Recent-Pace (>= 2 in letzten 30 Tagen) liefert estimatedCompletionDate', () => {
      const s = seasons([
        ep({ watched: true, firstWatchedAt: '2024-06-01' }),
        ep({ watched: true, firstWatchedAt: '2024-06-10' }),
        ep({ watched: false }),
      ]);
      const result = calculateWatchingPace(s);
      expect(result.shouldShow).toBe(true);
      expect(result.remainingEpisodes).toBe(1);
      expect(result.episodesPerWeek).toBeCloseTo(1, 5);
      expect(result.isPaused).toBe(false);
      expect(result.estimatedCompletionDate).toBeInstanceOf(Date);
    });

    it('Fallback-Overall-Pace: alle Timestamps alt → pausiert, keine Completion', () => {
      const s = seasons([
        ep({ watched: true, firstWatchedAt: '2024-01-01' }),
        ep({ watched: true, firstWatchedAt: '2024-03-01' }),
        ep({ watched: false }),
      ]);
      const result = calculateWatchingPace(s);
      expect(result.isPaused).toBe(true);
      expect(result.estimatedCompletionDate).toBeNull();
      expect(result.episodesPerWeek).toBeGreaterThan(0);
    });

    it('Fallback-Binge (alle am selben alten Tag, daySpan < 1) → episodesPerDay = Anzahl', () => {
      const s = seasons([
        ep({ watched: true, firstWatchedAt: '2024-01-01T08:00:00Z' }),
        ep({ watched: true, firstWatchedAt: '2024-01-01T20:00:00Z' }),
        ep({ watched: false }),
      ]);
      const result = calculateWatchingPace(s);
      // 2 Episoden "pro Tag" → *7 = 14 Ep./Woche
      expect(result.episodesPerWeek).toBe(14);
      expect(result.isPaused).toBe(true);
    });
  });

  describe('avgRuntime-Fallbacks für remainingHours', () => {
    it('nutzt episodeRuntime-Parameter, wenn keine Episode-Runtimes vorhanden sind', () => {
      const s = seasons([ep({ watched: true }), ep({ watched: false }), ep({ watched: false })]);
      // remaining 2 * 30 min = 60 min → 1.0 h
      const result = calculateWatchingPace(s, 30);
      expect(result.remainingHours).toBe(1);
    });

    it('fällt auf DEFAULT_EPISODE_RUNTIME_MINUTES (45) zurück ohne Runtime-Infos', () => {
      const s = seasons([ep({ watched: true }), ep({ watched: false })]);
      // remaining 1 * 45 min → 0.75 → 0.8
      const result = calculateWatchingPace(s);
      expect(result.remainingHours).toBe(0.8);
    });
  });
});

describe('formatPaceLine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const base: WatchingPace = {
    episodesPerWeek: 0,
    remainingEpisodes: 0,
    estimatedCompletionDate: null,
    remainingHours: 0,
    isPaused: false,
    shouldShow: true,
  };
  const make = (o: Partial<WatchingPace> = {}): WatchingPace => ({ ...base, ...o });
  const inDays = (n: number): Date => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  it('gibt leeren String zurück, wenn shouldShow false ist', () => {
    expect(formatPaceLine(make({ shouldShow: false }))).toBe('');
  });

  it('epw 0 und nicht pausiert → "Nicht genügend Daten"', () => {
    expect(formatPaceLine(make({ episodesPerWeek: 0, remainingEpisodes: 5 }))).toBe(
      'Nicht genügend Daten · 5 Ep. offen'
    );
  });

  it('pausiert → "Pausiert · N Ep. offen"', () => {
    expect(formatPaceLine(make({ isPaused: true, remainingEpisodes: 5 }))).toBe(
      'Pausiert · 5 Ep. offen'
    );
  });

  it('epw >= 7 → Pace als Ep./Tag', () => {
    expect(formatPaceLine(make({ episodesPerWeek: 14, remainingEpisodes: 3 }))).toBe(
      '~2 Ep./Tag · 3 Ep. offen'
    );
  });

  it('epw < 7 → Pace als Ep./Woche', () => {
    expect(formatPaceLine(make({ episodesPerWeek: 3.5, remainingEpisodes: 3 }))).toBe(
      '~3.5 Ep./Woche · 3 Ep. offen'
    );
  });

  describe('compact-Format Completion', () => {
    it('<= 1 Tag → "noch ~1 Tag"', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(0.5) }),
        true
      );
      expect(line).toContain('noch ~1 Tag');
    });

    it('< 7 Tage → "noch ~N Tage"', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(3) }),
        true
      );
      expect(line).toContain('noch ~3 Tage');
    });

    it('genau 1 Woche → "noch ~1 Woche" (Singular)', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(7) }),
        true
      );
      expect(line).toContain('noch ~1 Woche');
      expect(line).not.toContain('Wochen');
    });

    it('mehrere Wochen → "noch ~N Wochen" (Plural)', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(14) }),
        true
      );
      expect(line).toContain('noch ~2 Wochen');
    });

    it('compact zeigt keine Reststunden an', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(3), remainingHours: 5 }),
        true
      );
      expect(line).not.toContain('Std');
    });
  });

  describe('full-Format Completion', () => {
    it('<= 1 Tag → "Fertig ca. heute"', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(0.5) })
      );
      expect(line).toContain('Fertig ca. heute');
    });

    it('<= 14 Tage → "noch ~N Tage"', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(10) })
      );
      expect(line).toContain('noch ~10 Tage');
    });

    it('> 14 Tage → konkretes "Fertig ca. am DD.MM."', () => {
      const line = formatPaceLine(
        make({ episodesPerWeek: 3, estimatedCompletionDate: inDays(20) })
      );
      expect(line).toContain('Fertig ca. am 05.07.');
    });
  });

  describe('Reststunden (nur full)', () => {
    it('>= 1 Stunde → "~N Std. übrig"', () => {
      const line = formatPaceLine(make({ episodesPerWeek: 3, remainingHours: 3 }));
      expect(line).toContain('~3 Std. übrig');
    });

    it('< 1 Stunde (> 0) → "~N Min. übrig"', () => {
      const line = formatPaceLine(make({ episodesPerWeek: 3, remainingHours: 0.5 }));
      expect(line).toContain('~30 Min. übrig');
    });

    it('0 Stunden → kein Zeit-Segment', () => {
      const line = formatPaceLine(make({ episodesPerWeek: 3, remainingHours: 0 }));
      expect(line).not.toContain('übrig');
    });
  });
});
