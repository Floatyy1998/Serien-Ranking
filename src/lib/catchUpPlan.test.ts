import { describe, expect, it } from 'vitest';
import { buildCatchUpPlan, collectOpenEpisodes, type CatchUpPlanInput } from './catchUpPlan';
import type { Series } from '../types/Series';

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDaysFromNow = (days: number): string =>
  new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);

type EpisodeInput = { watched?: boolean; air_date?: string; runtime?: number };

const mkSeries = (episodes: EpisodeInput[], episodeRuntime = 45): Series =>
  ({
    id: 1,
    title: 'Serie',
    episodeRuntime,
    seasons: [
      {
        seasonNumber: 0,
        episodes: episodes.map((ep, index) => ({
          id: index + 1,
          episode_number: index + 1,
          name: `E${index + 1}`,
          watched: ep.watched ?? false,
          air_date: ep.air_date ?? isoDaysFromNow(-10),
          runtime: ep.runtime,
        })),
      },
    ],
  }) as unknown as Series;

const baseInput = (over: Partial<CatchUpPlanInput> = {}): CatchUpPlanInput => ({
  episodes: 40,
  hours: 30,
  fillerEpisodes: 0,
  fillerHours: 0,
  episodesPerWeek: 4,
  targetDate: new Date(2026, 9, 14),
  now: new Date(2026, 7, 28),
  ...over,
});

describe('collectOpenEpisodes', () => {
  it('zählt nur ausgestrahlte, ungesehene Folgen', () => {
    const series = mkSeries([{ watched: true }, {}, {}, { air_date: isoDaysFromNow(20) }]);
    const stats = collectOpenEpisodes(series);
    expect(stats.episodes).toBe(2);
    expect(stats.hours).toBeCloseTo(1.5, 5);
    expect(stats.fillerEpisodes).toBe(0);
  });

  it('trennt den Filler-Anteil ab', () => {
    const series = mkSeries([{}, {}, {}, {}]);
    // Staffel 1 (0-basiert gespeichert), Folgen 2 und 4 sind Filler.
    const stats = collectOpenEpisodes(series, (sn, ep) => sn === 1 && (ep === 2 || ep === 4));
    expect(stats.episodes).toBe(4);
    expect(stats.fillerEpisodes).toBe(2);
    expect(stats.fillerHours).toBeCloseTo(1.5, 5);
  });

  it('nutzt die Folgen-Laufzeit vor der Serien-Laufzeit', () => {
    const series = mkSeries([{ runtime: 20 }]);
    expect(collectOpenEpisodes(series).hours).toBeCloseTo(20 / 60, 5);
  });
});

describe('buildCatchUpPlan', () => {
  it('erkennt, dass das Tempo nicht reicht', () => {
    const plan = buildCatchUpPlan(baseInput());
    expect(plan.shouldShow).toBe(true);
    expect(plan.current.willMakeIt).toBe(false);
    expect(plan.current.daysLate).toBeGreaterThan(0);
    // 40 Folgen in ~6,7 Wochen: rund 6 pro Woche nötig.
    expect(plan.requiredPerWeek).toBeGreaterThan(5);
  });

  it('erkennt, dass das Tempo reicht', () => {
    const plan = buildCatchUpPlan(baseInput({ episodes: 10, episodesPerWeek: 5 }));
    expect(plan.current.willMakeIt).toBe(true);
    expect(plan.current.daysLate).toBe(0);
  });

  it('rechnet den Filler-Hebel als eigene Variante', () => {
    const plan = buildCatchUpPlan(
      baseInput({ episodes: 40, fillerEpisodes: 11, fillerHours: 8, episodesPerWeek: 4 })
    );
    expect(plan.withoutFiller).not.toBeNull();
    expect(plan.withoutFiller?.episodes).toBe(29);
    expect(plan.withoutFiller?.hours).toBeCloseTo(22, 5);
    expect(plan.withoutFiller?.daysLate).toBeLessThan(plan.current.daysLate);
  });

  it('meldet, wenn der Filler-Hebel den Termin rettet', () => {
    const plan = buildCatchUpPlan(
      baseInput({
        episodes: 30,
        episodesPerWeek: 4,
        fillerEpisodes: 15,
        fillerHours: 11,
      })
    );
    expect(plan.current.willMakeIt).toBe(false);
    expect(plan.withoutFiller?.willMakeIt).toBe(true);
    expect(plan.fillerSavesIt).toBe(true);
  });

  it('meldet keinen Filler-Hebel ohne Filler', () => {
    const plan = buildCatchUpPlan(baseInput());
    expect(plan.withoutFiller).toBeNull();
    expect(plan.fillerSavesIt).toBe(false);
  });

  it('kommt ohne gemessenes Tempo ohne Prognose aus', () => {
    const plan = buildCatchUpPlan(baseInput({ episodesPerWeek: 0 }));
    expect(plan.current.projectedDate).toBeNull();
    expect(plan.current.willMakeIt).toBe(false);
    // Das nötige Tempo lässt sich trotzdem nennen.
    expect(plan.requiredPerWeek).toBeGreaterThan(0);
  });

  it('zeigt nichts bei fast leerem Rückstand', () => {
    expect(buildCatchUpPlan(baseInput({ episodes: 1 })).shouldShow).toBe(false);
  });

  it('zeigt nichts für einen Termin in der Vergangenheit', () => {
    const plan = buildCatchUpPlan(baseInput({ targetDate: new Date(2026, 6, 1) }));
    expect(plan.shouldShow).toBe(false);
  });
});
