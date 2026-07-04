// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';

const ctx = vi.hoisted(() => ({ seriesList: [] as Series[] }));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));

import { useTodayEpisodes } from './useTodayEpisodes';

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
    ...o,
  }) as unknown as Series;

const run = (list: Series[]) => {
  ctx.seriesList = list;
  return renderHook(() => useTodayEpisodes()).result.current;
};

// Mittags-UTC-Stempel liegen in jeder üblichen Zeitzone am selben Kalendertag.
const TODAY_STAMP = '2026-06-03T12:00:00Z';
const FUTURE_STAMP = '2026-06-20T12:00:00Z';

describe('useTodayEpisodes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TODAY_STAMP));
  });
  afterEach(() => {
    vi.useRealTimers();
    ctx.seriesList = [];
  });

  it('gibt eine leere Liste bei leerem Input zurück', () => {
    expect(run([])).toEqual([]);
  });

  it('nimmt heute ausgestrahlte, ungesehene Episoden auf', () => {
    const list = [
      makeSeries({
        id: 7,
        title: 'Today',
        seasons: [
          {
            seasonNumber: 2,
            episodes: [
              ep({ id: 55, watched: false, airstamp: TODAY_STAMP, air_date: '2026-06-03' }),
            ],
          },
        ],
      }),
    ];
    const result = run(list);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      seriesId: 7,
      episodeId: 55,
      seasonNumber: 2,
      episodeNumber: 1,
      seasonIndex: 0,
    });
  });

  it('ignoriert bereits gesehene Episoden', () => {
    const list = [
      makeSeries({
        id: 8,
        seasons: [
          { seasonNumber: 1, episodes: [ep({ id: 1, watched: true, airstamp: TODAY_STAMP })] },
        ],
      }),
    ];
    expect(run(list)).toEqual([]);
  });

  it('ignoriert versteckte Serien', () => {
    const list = [
      makeSeries({
        id: 9,
        hidden: true,
        seasons: [
          { seasonNumber: 1, episodes: [ep({ id: 1, watched: false, airstamp: TODAY_STAMP })] },
        ],
      }),
    ];
    expect(run(list)).toEqual([]);
  });

  it('ignoriert Episoden die nicht heute ausgestrahlt werden', () => {
    const list = [
      makeSeries({
        id: 10,
        seasons: [
          { seasonNumber: 1, episodes: [ep({ id: 1, watched: false, airstamp: FUTURE_STAMP })] },
        ],
      }),
    ];
    expect(run(list)).toEqual([]);
  });
});
