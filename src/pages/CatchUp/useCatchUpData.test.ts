// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import {
  useCatchUpData,
  advanceCatchUpView,
  formatTime,
  formatTimeString,
  type CatchUpSeries,
} from './useCatchUpData';

// ── react-router-dom mock ─────────────────────────────────────────────
const router = vi.hoisted(() => ({
  params: new URLSearchParams(),
  setParams: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [router.params, router.setParams] as const,
}));

// ── SeriesList context mock ───────────────────────────────────────────
const ctx = vi.hoisted(() => ({ seriesList: [] as Series[] }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList, allSeriesList: ctx.seriesList }),
}));

type Episode = Series['seasons'][number]['episodes'][number];

const ep = (o: Partial<Episode> & { id: number }): Episode =>
  ({
    air_date: '2020-01-01',
    name: `Ep ${o.id}`,
    watched: false,
    episode_number: o.id,
    runtime: 40,
    ...o,
  }) as Episode;

const makeSeries = (o: Partial<Series>): Series =>
  ({
    id: 1,
    title: 'Series',
    seasons: [],
    rating: {},
    episodeRuntime: 40,
    ...o,
  }) as unknown as Series;

// A: 4 aired eps, 1 watched → remaining 3, progress 25 %, lastWatched set.
const seriesA = makeSeries({
  id: 1,
  title: 'Alpha',
  seasons: [
    {
      seasonNumber: 0,
      episodes: [
        ep({ id: 1, watched: true, lastWatchedAt: '2026-06-01T10:00:00Z' }),
        ep({ id: 2 }),
        ep({ id: 3 }),
        ep({ id: 4 }),
      ],
    },
  ] as Series['seasons'],
});

// B: 2 aired eps, 1 watched → remaining 1, progress 50 %, no lastWatched.
const seriesB = makeSeries({
  id: 2,
  title: 'Bravo',
  seasons: [
    {
      seasonNumber: 0,
      episodes: [ep({ id: 10, watched: true }), ep({ id: 11 })],
    },
  ] as Series['seasons'],
});

// Fully watched → excluded (remaining 0).
const seriesDone = makeSeries({
  id: 3,
  title: 'Done',
  seasons: [{ seasonNumber: 0, episodes: [ep({ id: 20, watched: true })] }] as Series['seasons'],
});

describe('useCatchUpData', () => {
  beforeEach(() => {
    router.params = new URLSearchParams();
    router.setParams.mockReset();
    ctx.seriesList = [seriesA, seriesB, seriesDone];
  });
  afterEach(() => cleanup());

  it('derives catch-up data, excluding fully watched series', () => {
    const { result } = renderHook(() => useCatchUpData());
    const ids = result.current.catchUpData.map((d) => d.series.id);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    expect(ids).not.toContain(3);

    const a = result.current.catchUpData.find((d) => d.series.id === 1);
    expect(a?.remainingEpisodes).toBe(3);
    expect(a?.totalEpisodes).toBe(4);
    expect(a?.watchedEpisodes).toBe(1);
    expect(Math.round(a?.progress ?? 0)).toBe(25);
    expect(a?.remainingMinutes).toBe(120); // 3 * 40
    expect(a?.lastWatchedDate).toBe('2026-06-01T10:00:00Z');
  });

  it('computes totals across all catch-up series', () => {
    const { result } = renderHook(() => useCatchUpData());
    expect(result.current.totals.totalEpisodes).toBe(4); // 3 + 1
    expect(result.current.totals.totalMinutes).toBe(160); // 120 + 40
    expect(result.current.totals.avgProgress).toBeCloseTo((25 + 50) / 2, 5);
  });

  it('reads the initial sort from URL params', () => {
    router.params = new URLSearchParams('sort=time&dir=asc');
    const { result } = renderHook(() => useCatchUpData());
    expect(result.current.sortBy).toBe('time');
    expect(result.current.sortDirection).toBe('asc');
  });

  it('sorts by remaining episodes descending by default', () => {
    const { result } = renderHook(() => useCatchUpData());
    expect(result.current.sortedData.map((d) => d.series.id)).toEqual([1, 2]);
  });

  it('toggles direction when the active sort tab is clicked again', () => {
    const { result } = renderHook(() => useCatchUpData());
    expect(result.current.sortDirection).toBe('desc');
    act(() => result.current.handleSortClick('episodes'));
    expect(result.current.sortDirection).toBe('asc');
    // asc → fewest remaining first
    expect(result.current.sortedData.map((d) => d.series.id)).toEqual([2, 1]);
  });

  it('switches tab and resets direction to desc on a new sort tab', () => {
    router.params = new URLSearchParams('sort=episodes&dir=asc');
    const { result } = renderHook(() => useCatchUpData());
    act(() => result.current.handleSortClick('progress'));
    expect(result.current.sortBy).toBe('progress');
    expect(result.current.sortDirection).toBe('desc');
    // progress desc → highest progress first (B 50 % before A 25 %)
    expect(result.current.sortedData.map((d) => d.series.id)).toEqual([2, 1]);
  });

  it('sorts "recent" pushing series without a last-watched date to the end', () => {
    router.params = new URLSearchParams('sort=recent&dir=desc');
    const { result } = renderHook(() => useCatchUpData());
    expect(result.current.sortedData.map((d) => d.series.id)).toEqual([1, 2]);
  });

  it('exposes a human label reflecting sort + direction', () => {
    router.params = new URLSearchParams('sort=time&dir=desc');
    const { result } = renderHook(() => useCatchUpData());
    expect(result.current.currentLabel).toBe('Längste Zeit');
  });

  it('syncs sort state to the URL', () => {
    renderHook(() => useCatchUpData());
    expect(router.setParams).toHaveBeenCalledWith(
      { sort: 'episodes', dir: 'desc' },
      { replace: true }
    );
  });
});

describe('advanceCatchUpView (optimistischer Vorlauf)', () => {
  const makeItem = (): CatchUpSeries => ({
    series: makeSeries({
      id: 1,
      title: 'Alpha',
      episodeRuntime: 40,
      seasons: [
        {
          seasonNumber: 0,
          episodes: [ep({ id: 1, watched: true }), ep({ id: 2 }), ep({ id: 3 }), ep({ id: 4 })],
        },
      ] as Series['seasons'],
    }),
    totalEpisodes: 4,
    watchedEpisodes: 1,
    remainingEpisodes: 3,
    remainingMinutes: 120,
    progress: 25,
    currentSeason: 1,
    currentEpisode: 2,
  });

  it('returns the same item reference when advance is 0', () => {
    const item = makeItem();
    expect(advanceCatchUpView(item, 0)).toBe(item);
  });

  it('advances the displayed next episode and recomputes the derived numbers', () => {
    const view = advanceCatchUpView(makeItem(), 1);
    expect(view).not.toBeNull();
    // Ep 2 gilt optimistisch als gesehen → nächste ist Ep 3.
    expect(view?.currentEpisode).toBe(3);
    expect(view?.watchedEpisodes).toBe(2);
    expect(view?.remainingEpisodes).toBe(2);
    expect(view?.remainingMinutes).toBe(80); // 120 - 40
    expect(Math.round(view?.progress ?? 0)).toBe(50);
  });

  it('advances across two taps to the following episode', () => {
    const view = advanceCatchUpView(makeItem(), 2);
    expect(view?.currentEpisode).toBe(4);
    expect(view?.remainingEpisodes).toBe(1);
  });

  it('returns null once the series is fully caught up', () => {
    // 3 ungesehene übrig → 3 Vorläufe holen alles auf.
    expect(advanceCatchUpView(makeItem(), 3)).toBeNull();
  });
});

describe('formatTime / formatTimeString', () => {
  it('formats minutes below an hour', () => {
    expect(formatTime(45)).toEqual({ value: 45, unit: 'Min' });
    expect(formatTimeString(45)).toBe('45m');
  });
  it('formats hours', () => {
    expect(formatTime(150)).toEqual({ value: 2, unit: 'Std' });
    expect(formatTimeString(150)).toBe('2h 30m');
  });
  it('formats days', () => {
    expect(formatTime(60 * 24 * 3)).toEqual({ value: 3, unit: 'Tage' });
    expect(formatTimeString(60 * 25)).toBe('1d 1h');
  });
});
