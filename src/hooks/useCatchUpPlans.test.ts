// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';
import type { SeriesCountdown } from './useSeriesCountdowns';

const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  filler: null as Record<string, { f: number[]; r: number[] }> | null,
}));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));

vi.mock('./useAnimeFillerCatalog', () => ({
  useAnimeFillerCatalog: () => ctx.filler,
}));

import { useCatchUpPlans } from './useCatchUpPlans';

type Episode = Series['seasons'][number]['episodes'][number];

const makeSeries = (openEpisodes: number, watchedDates: string[] = []): Series => {
  const episodes: Episode[] = [];
  watchedDates.forEach((date, index) => {
    episodes.push({
      id: index + 1,
      episode_number: index + 1,
      name: `E${index + 1}`,
      air_date: '2026-01-01',
      watched: true,
      firstWatchedAt: date,
    } as Episode);
  });
  for (let i = 0; i < openEpisodes; i++) {
    const number = watchedDates.length + i + 1;
    episodes.push({
      id: number,
      episode_number: number,
      name: `E${number}`,
      air_date: '2026-02-01',
      watched: false,
    } as Episode);
  }

  return {
    id: 1,
    title: 'Serie',
    episodeRuntime: 45,
    rating: {},
    seasons: [{ seasonNumber: 0, episodes }],
  } as unknown as Series;
};

const countdown = (over: Partial<SeriesCountdown> = {}): SeriesCountdown => ({
  seriesId: 1,
  title: 'Serie',
  posterUrl: '',
  nextDate: '2026-08-01',
  daysUntil: 60,
  seasonNumber: 3,
  type: 'season-start',
  ...over,
});

const run = (list: Series[], countdowns: SeriesCountdown[]) => {
  ctx.seriesList = list;
  return renderHook(() => useCatchUpPlans(countdowns)).result.current;
};

describe('useCatchUpPlans', () => {
  beforeEach(() => {
    ctx.filler = null;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('liefert nichts ohne Countdowns oder Serien', () => {
    expect(run([], [countdown()]).size).toBe(0);
    expect(run([makeSeries(10)], []).size).toBe(0);
  });

  it('baut einen Plan für eine Serie mit Rückstand', () => {
    const series = makeSeries(30, ['2026-05-20T10:00:00Z', '2026-05-27T10:00:00Z']);
    const plans = run([series], [countdown()]);

    const plan = plans.get(1);
    expect(plan).toBeDefined();
    expect(plan?.current.episodes).toBe(30);
    expect(plan?.requiredPerWeek).toBeGreaterThan(0);
  });

  it('lässt Serien ohne nennenswerten Rückstand weg', () => {
    const plans = run([makeSeries(1)], [countdown()]);
    expect(plans.size).toBe(0);
  });

  it('ignoriert Countdowns ohne passende Serie', () => {
    const plans = run([makeSeries(30)], [countdown({ seriesId: 99 })]);
    expect(plans.size).toBe(0);
  });

  it('zieht den Filler-Anteil aus dem statischen Katalog', () => {
    // Absolute Folgen 3 und 4 sind Filler; die Serie hat 2 gesehene + 3 offene.
    ctx.filler = { '1': { f: [3, 4], r: [] } };
    const series = makeSeries(3, ['2026-05-20T10:00:00Z', '2026-05-27T10:00:00Z']);
    const plans = run([series], [countdown()]);

    const plan = plans.get(1);
    expect(plan?.current.episodes).toBe(3);
    expect(plan?.withoutFiller?.episodes).toBe(1);
  });
});
