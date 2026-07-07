// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';

vi.mock('firebase/compat/app', () => ({
  default: { database: Object.assign(() => ({}), { ServerValue: { TIMESTAMP: 'TS' } }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const routeState = vi.hoisted(() => ({
  params: { seriesId: '100', seasonNumber: '1', episodeNumber: '1' } as Record<string, string>,
}));
const navSpy = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useParams: () => routeState.params,
  useNavigate: () => navSpy,
}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const listState = vi.hoisted(() => ({ seriesList: [] as Series[], refetchSeries: vi.fn() }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({
    seriesList: listState.seriesList,
    refetchSeries: listState.refetchSeries,
  }),
}));

vi.mock('../../lib/date/episodeDate.utils', () => ({
  getUnifiedEpisodeDate: (d: string) => `formatted:${d}`,
}));

const fanout = vi.hoisted(() => ({ runEpisodeWatchFanout: vi.fn(async () => {}) }));
vi.mock('../../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: fanout.runEpisodeWatchFanout,
}));

const queued = vi.hoisted(() => ({
  applyUserUpdate:
    vi.fn<(uid: string, updates: Record<string, unknown>, label: string) => Promise<void>>(),
}));
vi.mock('../../services/offline/queuedUpdate', () => ({ applyUserUpdate: queued.applyUserUpdate }));

import { useEpisodeDiscussion } from './useEpisodeDiscussion';

function makeSeries(watchedFirst = false): Series {
  return {
    id: 100,
    title: 'My Show',
    name: 'My Show',
    genre: { genres: ['Drama'] },
    provider: { provider: [{ name: 'Netflix' }] },
    episodeRuntime: 45,
    seasons: [
      {
        seasonNumber: 0,
        episodes: [
          { id: 11, name: 'E1', watched: watchedFirst },
          { id: 12, name: 'E2', watched: false },
        ],
      },
    ],
  } as unknown as Series;
}

beforeEach(() => {
  routeState.params = { seriesId: '100', seasonNumber: '1', episodeNumber: '1' };
  navSpy.mockReset();
  authState.user = { uid: 'u1' };
  listState.seriesList = [makeSeries()];
  listState.refetchSeries.mockClear();
  fanout.runEpisodeWatchFanout.mockClear();
  queued.applyUserUpdate.mockReset();
  queued.applyUserUpdate.mockResolvedValue();
  vi.stubEnv('VITE_API_TMDB', '');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useEpisodeDiscussion – derived state', () => {
  it('leitet Episoden-Details und Navigation aus der lokalen Serie ab', async () => {
    const { result } = renderHook(() => useEpisodeDiscussion());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.episodeName).toBe('E1');
    expect(result.current.hasSeries).toBe(true);
    expect(result.current.hasUser).toBe(true);
    expect(result.current.isWatched).toBe(false);
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.navigation.hasNextInSeason).toBe(true);
    expect(result.current.navigation.hasPrevInSeason).toBe(false);
    expect(result.current.seriesTitle).toBe('My Show');
  });

  it('meldet isNotFound wenn keine Serie und keine TMDB-Daten vorliegen', async () => {
    listState.seriesList = [];
    const { result } = renderHook(() => useEpisodeDiscussion());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.hasSeries).toBe(false);
  });
});

describe('useEpisodeDiscussion – toggle watched', () => {
  it('markiert eine Episode, refetcht und triggert den Fanout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useEpisodeDiscussion());
    await act(async () => {
      await result.current.handleToggleWatched();
    });
    const epPath = 'users/u1/seriesWatch/100/seasons/0/eps/11';
    const call = queued.applyUserUpdate.mock.calls[0];
    expect(call?.[0]).toBe('u1');
    const updates = call?.[1] ?? {};
    expect(updates[`${epPath}/w`]).toBe(1);
    expect(updates[`${epPath}/c`]).toBe(1);
    expect(updates['users/u1/meta/serienVersion']).toBe('TS');
    expect(listState.refetchSeries).toHaveBeenCalled();
    expect(fanout.runEpisodeWatchFanout).toHaveBeenCalled();
    // Auto-Navigation zur nächsten ungesehenen Episode
    expect(result.current.nextEpisodeTransition?.active).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(navSpy).toHaveBeenCalledWith('/episode/100/s/1/e/2', { replace: true });
  });

  it('entmarkiert eine gesehene Episode ohne Fanout', async () => {
    listState.seriesList = [makeSeries(true)];
    const { result } = renderHook(() => useEpisodeDiscussion());
    await waitFor(() => expect(result.current.isWatched).toBe(true));
    await act(async () => {
      await result.current.handleToggleWatched();
    });
    const epPath = 'users/u1/seriesWatch/100/seasons/0/eps/11';
    const updates = queued.applyUserUpdate.mock.calls[0]?.[1] ?? {};
    expect(updates[epPath]).toBeNull();
    expect(fanout.runEpisodeWatchFanout).not.toHaveBeenCalled();
  });
});

describe('useEpisodeDiscussion – navigation', () => {
  it('goToNextEpisode navigiert zur nächsten Episode der Season', async () => {
    const { result } = renderHook(() => useEpisodeDiscussion());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.navigation.goToNextEpisode());
    expect(navSpy).toHaveBeenCalledWith('/episode/100/s/1/e/2', { replace: true });
  });
});
