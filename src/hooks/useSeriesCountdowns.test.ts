// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';

const ctx = vi.hoisted(() => ({ seriesList: [] as Series[] }));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));

import { useSeriesCountdowns } from './useSeriesCountdowns';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

const ep = (o: Partial<Episode> & { id: number }): Episode =>
  ({
    air_date: '2020-01-01',
    name: `Ep ${o.id}`,
    watched: false,
    episode_number: o.id,
    ...o,
  }) as Episode;

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 1,
    title: 'Series',
    seasons: [],
    rating: {},
    poster: { poster: '' },
    ...o,
  }) as unknown as Series;

const run = (list: Series[]) => {
  ctx.seriesList = list;
  return renderHook(() => useSeriesCountdowns()).result.current;
};

describe('useSeriesCountdowns', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    ctx.seriesList = [];
  });

  it('meldet loading und keine Countdowns bei leerer Liste', () => {
    const { countdowns, loading } = run([]);
    expect(loading).toBe(true);
    expect(countdowns).toEqual([]);
  });

  it('erkennt einen Staffelstart in der Zukunft', () => {
    const list = [
      makeSeries({
        id: 5,
        title: 'Starter',
        seasons: [
          {
            seasonNumber: 1,
            episodes: [ep({ id: 1, airstamp: '2026-06-11T12:00:00Z', air_date: '2026-06-11' })],
          },
        ],
      }),
    ];
    const { countdowns, loading } = run(list);
    expect(loading).toBe(false);
    expect(countdowns).toHaveLength(1);
    expect(countdowns[0]).toMatchObject({
      seriesId: 5,
      type: 'season-start',
      seasonNumber: 2, // seasonNumber (1) + 1
      daysUntil: 10,
    });
  });

  it('ignoriert Serien deren einzige Episode in der Vergangenheit liegt', () => {
    const list = [
      makeSeries({
        id: 6,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [ep({ id: 1, airstamp: '2026-05-01T12:00:00Z', air_date: '2026-05-01' })],
          },
        ],
      }),
    ];
    expect(run(list).countdowns).toEqual([]);
  });

  it('erkennt eine Mid-Season-Rückkehr nach einer Lücke > 28 Tagen', () => {
    const list = [
      makeSeries({
        id: 7,
        title: 'Returner',
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 1, airstamp: '2026-05-01T12:00:00Z', air_date: '2026-05-01' }),
              ep({ id: 2, airstamp: '2026-06-21T12:00:00Z', air_date: '2026-06-21' }),
            ],
          },
        ],
      }),
    ];
    const { countdowns } = run(list);
    expect(countdowns).toHaveLength(1);
    expect(countdowns[0]).toMatchObject({ seriesId: 7, type: 'mid-season-return', daysUntil: 20 });
  });

  it('sortiert nach daysUntil aufsteigend', () => {
    const list = [
      makeSeries({
        id: 1,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [ep({ id: 1, airstamp: '2026-06-21T12:00:00Z', air_date: '2026-06-21' })],
          },
        ],
      }),
      makeSeries({
        id: 2,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [ep({ id: 1, airstamp: '2026-06-05T12:00:00Z', air_date: '2026-06-05' })],
          },
        ],
      }),
    ];
    expect(run(list).countdowns.map((c) => c.seriesId)).toEqual([2, 1]);
  });
});
