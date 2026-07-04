// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';
import { getWeekNumber, useWeeklyEpisodes } from './useWeeklyEpisodes';

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

const call = (list: Series[], weekOffset = 0, watchlistOnly = false) =>
  renderHook(() => useWeeklyEpisodes(list, weekOffset, watchlistOnly)).result.current;

// Mittags-UTC-Stempel → stabiler Kalendertag "heute" in üblichen Zeitzonen.
const TODAY_STAMP = '2026-06-03T12:00:00Z';

const seriesWithTodayEpisode = (o: Partial<Series> & { id: number }): Series =>
  makeSeries({
    title: `S${o.id}`,
    watchlist: true,
    seasons: [
      {
        seasonNumber: 0,
        episodes: [ep({ id: 1, airstamp: TODAY_STAMP, air_date: '2026-06-03' })],
      },
    ],
    ...o,
  });

describe('useWeeklyEpisodes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TODAY_STAMP));
  });
  afterEach(() => vi.useRealTimers());

  it('initialisiert 7 Tages-Buckets, auch bei leerer Liste', () => {
    const { schedule, totalEpisodes } = call([]);
    expect(schedule.size).toBe(7);
    expect(totalEpisodes).toBe(0);
  });

  it('ordnet eine Episode dieser Woche dem richtigen Tag zu', () => {
    const { schedule, totalEpisodes } = call([seriesWithTodayEpisode({ id: 5 })]);
    expect(totalEpisodes).toBe(1);
    const all = [...schedule.values()].flat();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      seriesId: 5,
      seasonNumber: 1, // seasonNumber (0) + 1
      episodeNumber: 1,
      premiereType: 'season-start', // erste Episode der Season
    });
  });

  it('zählt gesehene Episoden in watchedCount', () => {
    const s = seriesWithTodayEpisode({ id: 6 });
    s.seasons[0].episodes[0].watched = true;
    const { totalEpisodes, watchedCount } = call([s]);
    expect(totalEpisodes).toBe(1);
    expect(watchedCount).toBe(1);
  });

  it('ignoriert versteckte Serien', () => {
    expect(call([seriesWithTodayEpisode({ id: 7, hidden: true })]).totalEpisodes).toBe(0);
  });

  it('filtert mit watchlistOnly auf watchlist-Serien', () => {
    const notWatchlisted = seriesWithTodayEpisode({ id: 8, watchlist: false });
    expect(call([notWatchlisted], 0, true).totalEpisodes).toBe(0);
    expect(call([notWatchlisted], 0, false).totalEpisodes).toBe(1);
  });

  it('verschiebt das Fenster mit weekOffset (nächste Woche enthält die heutige Episode nicht)', () => {
    expect(call([seriesWithTodayEpisode({ id: 9 })], 1).totalEpisodes).toBe(0);
  });

  it('getWeekNumber liefert eine ISO-Wochennummer im gültigen Bereich', () => {
    const wk = getWeekNumber(new Date('2026-06-03T12:00:00Z'));
    expect(wk).toBeGreaterThanOrEqual(1);
    expect(wk).toBeLessThanOrEqual(53);
  });
});
