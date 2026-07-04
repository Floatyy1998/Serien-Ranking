// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';

const ctx = vi.hoisted(() => ({ seriesList: [] as Series[] }));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));

import { useRewatchEpisodes } from './useRewatchEpisodes';

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

/** Serie mit aktivem Rewatch und genau einer gesehenen (noch nicht erneut abgehakten) Episode. */
const rewatchSeries = (o: Partial<Series> & { id: number }): Series =>
  makeSeries({
    watchlist: true,
    rewatch: { active: true, round: 1 },
    seasons: [{ seasonNumber: 0, episodes: [ep({ id: 30, watched: true, watchCount: 1 })] }],
    ...o,
  });

const run = (list: Series[]) => {
  ctx.seriesList = list;
  return renderHook(() => useRewatchEpisodes()).result.current;
};

describe('useRewatchEpisodes', () => {
  afterEach(() => {
    ctx.seriesList = [];
  });

  it('gibt eine leere Liste bei leerem Input zurück', () => {
    expect(run([])).toEqual([]);
  });

  it('nimmt watchlist-Serien mit aktivem Rewatch und nächster Rewatch-Episode auf', () => {
    const result = run([rewatchSeries({ id: 42, title: 'RW' })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 42,
      seasonIndex: 0,
      episodeIndex: 0,
      seasonNumber: 1, // nextEp.seasonNumber (0) + 1
      episodeNumber: 1,
      currentWatchCount: 1,
      targetWatchCount: 2,
    });
  });

  it('ignoriert Serien ohne watchlist-Flag', () => {
    expect(run([rewatchSeries({ id: 1, watchlist: false })])).toEqual([]);
  });

  it('ignoriert Serien ohne aktiven Rewatch', () => {
    const s = makeSeries({
      id: 2,
      watchlist: true,
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, watched: true, watchCount: 1 })] }],
    });
    expect(run([s])).toEqual([]);
  });

  it('ignoriert Serien deren Rewatch bereits vollständig abgehakt ist (keine nächste Episode)', () => {
    const s = makeSeries({
      id: 3,
      watchlist: true,
      rewatch: { active: true, round: 1, rewatchedEps: { '1': true } },
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, watched: true, watchCount: 1 })] }],
    });
    expect(run([s])).toEqual([]);
  });

  it('sortiert nach lastWatchedAt (rewatch.lastWatchedAt) absteigend', () => {
    const list = [
      rewatchSeries({
        id: 1,
        rewatch: { active: true, round: 1, lastWatchedAt: '2026-05-01T00:00:00Z' },
      }),
      rewatchSeries({
        id: 2,
        rewatch: { active: true, round: 1, lastWatchedAt: '2026-05-10T00:00:00Z' },
      }),
    ];
    expect(run(list).map((r) => r.id)).toEqual([2, 1]);
  });
});
