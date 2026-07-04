// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogSeason } from '../../../types/CatalogTypes';

const fb = vi.hoisted(() => {
  const state = { updateCalls: [] as Array<Record<string, unknown>> };
  const update = vi.fn(async (payload: Record<string, unknown>) => {
    state.updateCalls.push(payload);
  });
  const ref = vi.fn(() => ({ update }));
  const database = Object.assign(() => ({ ref }), {});
  return { state, update, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const catalog = vi.hoisted(() => ({
  fetchStaticCatalogSeasons: vi.fn<(id: number) => Promise<Record<string, CatalogSeason> | null>>(),
}));
vi.mock('../../../lib/staticCatalog', () => ({
  fetchStaticCatalogSeasons: catalog.fetchStaticCatalogSeasons,
}));

import { useApplyWatchProgress } from './useApplyWatchProgress';
import type { WatchTarget } from './useApplyWatchProgress';

function seasons(): Record<string, CatalogSeason> {
  return {
    '0': { episodes: [{ id: 101 }, { id: 102 }] } as unknown as CatalogSeason,
    '1': { episodes: [{ id: 201 }, { id: 202 }, { id: 203 }] } as unknown as CatalogSeason,
  };
}

beforeEach(() => {
  fb.state.updateCalls = [];
  fb.update.mockClear();
  authState.user = { uid: 'u1' };
  catalog.fetchStaticCatalogSeasons.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe('useApplyWatchProgress', () => {
  it('macht nichts ohne User', async () => {
    authState.user = null;
    const { result } = renderHook(() => useApplyWatchProgress());
    await result.current({ 1: { kind: 'total' } });
    expect(fb.update).not.toHaveBeenCalled();
  });

  it('macht nichts wenn keine relevanten Targets vorhanden sind', async () => {
    const { result } = renderHook(() => useApplyWatchProgress());
    await result.current({ 1: { kind: 'none' } });
    expect(fb.update).not.toHaveBeenCalled();
  });

  it('markiert bei "total" alle Episoden und nimmt von der Watchlist', async () => {
    catalog.fetchStaticCatalogSeasons.mockResolvedValue(seasons());
    const { result } = renderHook(() => useApplyWatchProgress());
    const onProgress = vi.fn();
    await result.current({ 500: { kind: 'total' } }, onProgress);

    expect(fb.update).toHaveBeenCalledTimes(1);
    const payload = fb.state.updateCalls[0] ?? {};
    const seasonsObj = payload['users/u1/seriesWatch/500/seasons'] as Record<
      string,
      { eps: Record<string, unknown> }
    >;
    expect(Object.keys(seasonsObj['0']?.eps ?? {})).toEqual(['101', '102']);
    expect(Object.keys(seasonsObj['1']?.eps ?? {})).toEqual(['201', '202', '203']);
    expect(payload['users/u1/series/500/watchlist']).toBe(false);
    expect(onProgress).toHaveBeenLastCalledWith(1, 1);
  });

  it('markiert bei "upToEpisode" nur bis zum Ziel und bleibt auf der Watchlist', async () => {
    catalog.fetchStaticCatalogSeasons.mockResolvedValue(seasons());
    const { result } = renderHook(() => useApplyWatchProgress());
    const target: WatchTarget = { kind: 'upToEpisode', seasonIdx: 1, episodeIdx: 1 };
    await result.current({ 500: target });

    const payload = fb.state.updateCalls[0] ?? {};
    const seasonsObj = payload['users/u1/seriesWatch/500/seasons'] as Record<
      string,
      { eps: Record<string, unknown> }
    >;
    // Season 0 komplett, Season 1 bis Episode-Index 1 (201, 202)
    expect(Object.keys(seasonsObj['0']?.eps ?? {})).toEqual(['101', '102']);
    expect(Object.keys(seasonsObj['1']?.eps ?? {})).toEqual(['201', '202']);
    expect(payload['users/u1/series/500/watchlist']).toBe(true);
  });

  it('pollt bis der Katalog verfügbar ist', async () => {
    vi.useFakeTimers();
    catalog.fetchStaticCatalogSeasons.mockResolvedValueOnce(null).mockResolvedValueOnce(seasons());
    const { result } = renderHook(() => useApplyWatchProgress());
    const promise = result.current({ 500: { kind: 'total' } });
    // erste Auflösung (null) + Backoff-Timer
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(catalog.fetchStaticCatalogSeasons).toHaveBeenCalledTimes(2);
    expect(fb.update).toHaveBeenCalledTimes(1);
  });
});
