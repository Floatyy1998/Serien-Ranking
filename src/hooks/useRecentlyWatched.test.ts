// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';

const ctx = vi.hoisted(() => ({ seriesList: [] as Series[] }));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));

import { useRecentlyWatched } from './useRecentlyWatched';

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
  return renderHook(() => useRecentlyWatched()).result.current;
};

const NOW = new Date('2026-06-01T12:00:00Z');
const recentIso = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
const oldIso = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

describe('useRecentlyWatched', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    ctx.seriesList = [];
  });

  it('gibt eine leere Liste bei leerem Input zurück', () => {
    expect(run([])).toEqual([]);
  });

  it('nimmt Serien mit einem firstWatchedAt innerhalb der letzten 7 Tage auf', () => {
    const list = [
      makeSeries({
        id: 3,
        title: 'Recent',
        rating: { u1: 8, u2: 9 },
        seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, firstWatchedAt: recentIso })] }],
      }),
    ];
    const result = run(list);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
    expect(result[0].rating).toBe(8.5); // Mittel aus 8 und 9
  });

  it('ignoriert Serien deren letzter Watch älter als 7 Tage ist', () => {
    const list = [
      makeSeries({
        id: 4,
        seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, firstWatchedAt: oldIso })] }],
      }),
    ];
    expect(run(list)).toEqual([]);
  });

  it('ignoriert Serien ohne seasons', () => {
    const list = [makeSeries({ id: 5, seasons: undefined as unknown as Series['seasons'] })];
    expect(run(list)).toEqual([]);
  });

  it('begrenzt auf HOME_CAROUSEL_MAX_ITEMS (10)', () => {
    const list: Series[] = [];
    for (let i = 0; i < 12; i++) {
      list.push(
        makeSeries({
          id: 200 + i,
          seasons: [{ seasonNumber: 0, episodes: [ep({ id: i, firstWatchedAt: recentIso })] }],
        })
      );
    }
    expect(run(list)).toHaveLength(10);
  });
});
