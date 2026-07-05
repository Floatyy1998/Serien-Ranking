// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';

const ctx = vi.hoisted(() => ({ seriesList: [] as Series[] }));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));

import { useContinueWatching } from './useContinueWatching';

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
  return renderHook(() => useContinueWatching()).result.current;
};

describe('useContinueWatching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    ctx.seriesList = [];
  });

  it('gibt eine leere Liste bei leerem Input zurück', () => {
    expect(run([])).toEqual([]);
  });

  it('wählt die erste ungesehene, ausgestrahlte Episode als nextEpisode', () => {
    const list = [
      makeSeries({
        id: 5,
        title: 'Alpha',
        watchlist: true,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 11, watched: true, lastWatchedAt: '2026-05-01T00:00:00Z' }),
              ep({ id: 12, watched: false }),
            ],
          },
        ],
      }),
    ];
    const result = run(list);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
    expect(result[0].nextEpisode).toMatchObject({
      episodeId: 12,
      seasonNumber: 1, // (seasonNumber 0) + 1
      episodeNumber: 2, // index 1 + 1
      seasonIndex: 0,
      episodeIndex: 1,
    });
  });

  it('zeigt angefangene Serien MIT Fortschritt auch OHNE watchlist-Flag (F2)', () => {
    const list = [
      makeSeries({
        id: 6,
        watchlist: false,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 1, watched: true, lastWatchedAt: '2026-05-01T00:00:00Z' }),
              ep({ id: 2, watched: false }),
            ],
          },
        ],
      }),
    ];
    const result = run(list);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(6);
    expect(result[0].nextEpisode.episodeId).toBe(2);
  });

  it('ignoriert noch nicht angefangene Serien (keine Episode gesehen)', () => {
    const list = [
      makeSeries({
        id: 9,
        watchlist: true,
        seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, watched: false })] }],
      }),
    ];
    expect(run(list)).toEqual([]);
  });

  it('ignoriert versteckte (hidden) Serien trotz Fortschritt', () => {
    const list = [
      makeSeries({
        id: 10,
        watchlist: true,
        hidden: true,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 1, watched: true, lastWatchedAt: '2026-05-01T00:00:00Z' }),
              ep({ id: 2, watched: false }),
            ],
          },
        ],
      }),
    ];
    expect(run(list)).toEqual([]);
  });

  it('überspringt Serien deren nächste Episode noch nicht ausgestrahlt ist', () => {
    const list = [
      makeSeries({
        id: 7,
        watchlist: true,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 1, watched: true, lastWatchedAt: '2026-05-01T00:00:00Z' }),
              ep({ id: 2, watched: false, air_date: '2030-01-01' }),
            ],
          },
        ],
      }),
    ];
    expect(run(list)).toEqual([]);
  });

  it('überspringt komplett durchgesehene Serien', () => {
    const list = [
      makeSeries({
        id: 8,
        watchlist: true,
        seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, watched: true })] }],
      }),
    ];
    expect(run(list)).toEqual([]);
  });

  it('sortiert nach lastWatchedAt absteigend', () => {
    const list = [
      makeSeries({
        id: 1,
        title: 'Older',
        watchlist: true,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 10, watched: true, lastWatchedAt: '2026-05-01T00:00:00Z' }),
              ep({ id: 11, watched: false }),
            ],
          },
        ],
      }),
      makeSeries({
        id: 2,
        title: 'Newer',
        watchlist: true,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 20, watched: true, lastWatchedAt: '2026-05-10T00:00:00Z' }),
              ep({ id: 21, watched: false }),
            ],
          },
        ],
      }),
    ];
    const result = run(list);
    expect(result.map((r) => r.id)).toEqual([2, 1]);
  });

  it('begrenzt auf HOME_CAROUSEL_MAX_ITEMS (10)', () => {
    const list: Series[] = [];
    for (let i = 0; i < 12; i++) {
      list.push(
        makeSeries({
          id: 100 + i,
          title: `S${i}`,
          watchlist: true,
          seasons: [
            {
              seasonNumber: 0,
              episodes: [
                ep({ id: i * 10, watched: true, lastWatchedAt: '2026-05-01T00:00:00Z' }),
                ep({ id: i * 10 + 1, watched: false }),
              ],
            },
          ],
        })
      );
    }
    expect(run(list)).toHaveLength(10);
  });
});
