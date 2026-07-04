// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';
import { useWatchNextEpisodes } from './useWatchNextEpisodes';

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

const provider = (name: string, id = 1) => ({ provider: [{ id, logo: 'l', name }] });

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 1,
    title: 'Series',
    seasons: [],
    rating: {},
    seasonCount: 1,
    ...o,
  }) as unknown as Series;

// Zwei watchlist-Serien, jeweils eine ungesehene ausgestrahlte Episode.
const bravo = makeSeries({
  id: 1,
  title: 'Bravo',
  watchlist: true,
  provider: provider('Netflix', 8),
  seasons: [
    {
      seasonNumber: 0,
      episodes: [ep({ id: 1, watched: true }), ep({ id: 2, watched: false })],
    },
  ],
});

const alpha = makeSeries({
  id: 2,
  title: 'Alpha',
  watchlist: true,
  provider: provider('Prime', 9),
  seasons: [{ seasonNumber: 0, episodes: [ep({ id: 3, watched: false })] }],
});

const call = (
  list: Series[],
  opts: {
    filter?: string;
    showRewatches?: boolean;
    sort?: string;
    customOrder?: boolean;
    order?: number[];
    providerFilter?: string | null;
    onlyActive?: ReadonlySet<string> | null;
  } = {}
) =>
  renderHook(() =>
    useWatchNextEpisodes(
      list,
      opts.filter ?? '',
      opts.showRewatches ?? false,
      opts.sort ?? 'name-asc',
      opts.customOrder ?? false,
      opts.order ?? [],
      opts.providerFilter ?? null,
      opts.onlyActive ?? null
    )
  ).result.current;

describe('useWatchNextEpisodes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('gibt eine leere Liste bei leerem Input zurück', () => {
    expect(call([])).toEqual([]);
  });

  it('sammelt die nächste ungesehene ausgestrahlte Episode je watchlist-Serie', () => {
    const result = call([bravo, alpha]);
    // name-asc → Alpha vor Bravo
    expect(result.map((r) => r.seriesId)).toEqual([2, 1]);
    expect(result[1]).toMatchObject({ seriesId: 1, episodeNumber: 2, episodeName: 'Ep 2' });
  });

  it('sortiert name-desc absteigend', () => {
    const result = call([alpha, bravo], { sort: 'name-desc' });
    expect(result.map((r) => r.seriesId)).toEqual([1, 2]);
  });

  it('filtert nach filterInput (Titel)', () => {
    const result = call([bravo, alpha], { filter: 'alpha' });
    expect(result.map((r) => r.seriesId)).toEqual([2]);
  });

  it('ignoriert Serien ohne watchlist-Flag oder ohne seasons', () => {
    const notWatchlisted = makeSeries({ id: 3, title: 'X', watchlist: false });
    const noSeasons = makeSeries({ id: 4, title: 'Y', watchlist: true, seasons: [] });
    expect(call([notWatchlisted, noSeasons])).toEqual([]);
  });

  it('respektiert den providerFilter', () => {
    expect(call([bravo, alpha], { providerFilter: 'Netflix' }).map((r) => r.seriesId)).toEqual([1]);
  });

  it('respektiert onlyActiveProviders', () => {
    const result = call([bravo, alpha], { onlyActive: new Set(['Prime']) });
    expect(result.map((r) => r.seriesId)).toEqual([2]);
  });

  it('wendet die benutzerdefinierte Reihenfolge an', () => {
    const result = call([alpha, bravo], { customOrder: true, order: [1, 2] });
    expect(result.map((r) => r.seriesId)).toEqual([1, 2]);
  });

  it('stellt Rewatches voran wenn showRewatches gesetzt ist', () => {
    const rw = makeSeries({
      id: 3,
      title: 'Zulu',
      watchlist: true,
      rewatch: { active: true, round: 1 },
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 30, watched: true, watchCount: 1 })] }],
    });
    const withRewatch = call([bravo, alpha, rw], { showRewatches: true });
    expect(withRewatch[0]).toMatchObject({ seriesId: 3, isRewatch: true });

    const withoutRewatch = call([bravo, alpha, rw], { showRewatches: false });
    expect(withoutRewatch.some((r) => r.isRewatch)).toBe(false);
  });
});
