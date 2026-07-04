// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FriendActivity } from '../../types/Friend';

/* ---------------------------------------------------------------------------
 * useSeriesList/useMovieList gemockt. VITE_API_TMDB leer → Poster-Fetch-Effekt
 * bricht ab (kein globaler fetch nötig). getImageUrl bleibt echt.
 * ------------------------------------------------------------------------- */
const ctx = vi.hoisted(() => ({
  seriesList: [] as unknown[],
  movieList: [] as unknown[],
}));

vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));

import { useActivityGrouping } from './useActivityGrouping';

const act0 = (o: Partial<FriendActivity> & { id: string; userId: string }): FriendActivity =>
  ({
    userName: o.userId,
    type: 'series_added',
    itemTitle: 'Item',
    timestamp: 0,
    ...o,
  }) as FriendActivity;

beforeEach(() => {
  ctx.seriesList = [];
  ctx.movieList = [];
  vi.stubEnv('VITE_API_TMDB', '');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  cleanup();
  vi.restoreAllMocks();
});

describe('useActivityGrouping', () => {
  it('gruppiert Aktivitäten nach User, neueste Gruppe zuerst', () => {
    const activities = [
      act0({ id: '1', userId: 'a', timestamp: 100 }),
      act0({ id: '2', userId: 'b', timestamp: 500 }),
      act0({ id: '3', userId: 'a', timestamp: 300 }),
    ];
    const { result } = renderHook(() => useActivityGrouping(activities));
    const groups = result.current.groupedActivities;
    expect(groups.map(([uid]) => uid)).toEqual(['b', 'a']);
    // Innerhalb von 'a': neueste Aktivität zuerst
    expect(groups[1][1].map((x) => x.id)).toEqual(['3', '1']);
  });

  it('filtert nach Film-Aktivitäten', () => {
    const activities = [
      act0({ id: 's', userId: 'a', type: 'series_added', timestamp: 1 }),
      act0({ id: 'm', userId: 'a', type: 'movie_added', timestamp: 2 }),
    ];
    const { result } = renderHook(() => useActivityGrouping(activities));
    act(() => result.current.setFilterType('movies'));
    expect(result.current.filteredActivities.map((a) => a.id)).toEqual(['m']);
  });

  it('sortiert filteredActivities absteigend nach timestamp', () => {
    const activities = [
      act0({ id: 'old', userId: 'a', timestamp: 1 }),
      act0({ id: 'new', userId: 'a', timestamp: 9 }),
    ];
    const { result } = renderHook(() => useActivityGrouping(activities));
    expect(result.current.filteredActivities.map((a) => a.id)).toEqual(['new', 'old']);
  });

  it('getItemDetails findet Serie aus der Liste oder gibt Fallback zurück', () => {
    ctx.seriesList = [{ id: 55, title: 'Known Series' }];
    const { result } = renderHook(() => useActivityGrouping([]));

    const known = result.current.getItemDetails(
      act0({ id: 'x', userId: 'a', type: 'series_added', tmdbId: 55 })
    );
    expect((known as { title: string }).title).toBe('Known Series');

    const unknown = result.current.getItemDetails(
      act0({ id: 'y', userId: 'a', type: 'series_added', tmdbId: 999, itemTitle: 'Missing' })
    );
    expect((unknown as { title: string }).title).toBe('Missing');
  });

  it('formatTimeAgo liefert relative deutsche Labels', () => {
    const { result } = renderHook(() => useActivityGrouping([]));
    const now = Date.now();
    expect(result.current.formatTimeAgo(now)).toBe('gerade eben');
    expect(result.current.formatTimeAgo(now - 5 * 60000)).toBe('vor 5m');
    expect(result.current.formatTimeAgo(now - 3 * 3600000)).toBe('vor 3h');
    expect(result.current.formatTimeAgo(now - 2 * 86400000)).toBe('vor 2d');
  });

  it('getPosterUrl liefert eine URL für Fallback-Poster-Pfade', () => {
    const { result } = renderHook(() => useActivityGrouping([]));
    const url = result.current.getPosterUrl(
      act0({ id: 'p', userId: 'a', itemType: 'series', tmdbId: 1, posterPath: '/abc.jpg' })
    );
    expect(typeof url).toBe('string');
    expect(url).toContain('abc.jpg');
  });
});
