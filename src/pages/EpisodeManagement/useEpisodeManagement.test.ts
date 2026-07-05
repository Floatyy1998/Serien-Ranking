// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';

// ── react-router-dom ──────────────────────────────────────────────────
const rr = vi.hoisted(() => ({ id: '5' }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ id: rr.id }) }));

// ── firebase compat ───────────────────────────────────────────────────
const fb = vi.hoisted(() => {
  const updateMock = vi.fn(() => Promise.resolve());
  const setMock = vi.fn(() => Promise.resolve());
  const removeMock = vi.fn(() => Promise.resolve());
  const refMock = vi.fn((_p?: string) => ({
    update: updateMock,
    set: setMock,
    remove: removeMock,
  }));
  const database = Object.assign(() => ({ ref: refMock }), {
    ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
  });
  return { updateMock, setMock, removeMock, refMock, database };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// ── contexts + hooks + services ───────────────────────────────────────
const ctx = vi.hoisted(() => ({
  allSeriesList: [] as Series[],
  user: { uid: 'u1' } as { uid: string } | null,
  shouldTriggerQuickRate: vi.fn<(...a: unknown[]) => boolean>(() => false),
  showQuickRating: vi.fn(),
}));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.allSeriesList }),
}));
vi.mock('../../hooks/discussionCountHooks', () => ({
  useEpisodeDiscussionCounts: () => ({}),
}));
vi.mock('../../hooks/useQuickSeasonRating', () => ({
  shouldTriggerQuickRate: (...a: unknown[]) => ctx.shouldTriggerQuickRate(...a),
  useQuickSeasonRating: () => ({
    quickRatingOpen: false,
    quickRatingSeries: null,
    quickRatingSeasonNumber: 0,
    showQuickRating: ctx.showQuickRating,
    closeQuickRating: vi.fn(),
    saveQuickRating: vi.fn(),
  }),
}));
vi.mock('../../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: vi.fn(async () => {}),
}));
vi.mock('../../firebase/analytics', () => ({
  trackEpisodeWatched: vi.fn(),
  trackEpisodeUnwatched: vi.fn(),
}));
vi.mock('../../lib/offline/queuedUpdate', () => ({
  applyUserUpdate: vi.fn(async () => ({ queued: false })),
}));
vi.mock('../../lib/toast', () => ({
  showToast: vi.fn(),
  showUndoToast: vi.fn(),
  showActionToast: vi.fn(),
}));
vi.mock('../../lib/haptics', () => ({ hapticSuccess: vi.fn() }));

import { runEpisodeWatchFanout } from '../../lib/episode/episodeWatchFanout';
import { trackEpisodeWatched } from '../../firebase/analytics';
import { applyUserUpdate } from '../../lib/offline/queuedUpdate';
import { showActionToast, showUndoToast } from '../../lib/toast';
import { hapticSuccess } from '../../lib/haptics';
import { useEpisodeManagement } from './useEpisodeManagement';

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
    id: 5,
    title: 'Alpha',
    episodeRuntime: 30,
    genre: { genres: ['Drama'] },
    provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] },
    seasons: [],
    rating: {},
    ...o,
  }) as unknown as Series;

const twoSeasons = (): Series['seasons'] => [
  {
    seasonNumber: 0,
    episodes: [ep({ id: 11, watched: false }), ep({ id: 12, watched: false })],
  },
  { seasonNumber: 1, episodes: [ep({ id: 21, watched: false })] },
];

beforeEach(() => {
  rr.id = '5';
  ctx.allSeriesList = [];
  ctx.user = { uid: 'u1' };
  ctx.shouldTriggerQuickRate.mockReturnValue(false);
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('useEpisodeManagement', () => {
  it('derives the current series, season progress and auto-selects the first unwatched season', async () => {
    ctx.allSeriesList = [
      makeSeries({
        seasons: [
          { seasonNumber: 0, episodes: [ep({ id: 11, watched: true, watchCount: 2 })] },
          { seasonNumber: 1, episodes: [ep({ id: 21, watched: false })] },
        ],
      }),
    ];
    const { result } = renderHook(() => useEpisodeManagement());

    expect(result.current.series?.id).toBe(5);
    await waitFor(() => expect(result.current.selectedSeason).toBe(1));
    expect(result.current.seasonProgress).toMatchObject({
      watchedCount: 0,
      totalCount: 1,
      allWatched: false,
    });
  });

  it('handleEpisodeToggle: marks an episode watched via a serienVersion-bumped update map', async () => {
    ctx.allSeriesList = [makeSeries({ seasons: twoSeasons() })];
    const { result } = renderHook(() => useEpisodeManagement());

    await act(async () => {
      await result.current.handleEpisodeToggle(0, 0);
    });

    expect(applyUserUpdate).toHaveBeenCalledTimes(1);
    const [uid, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(uid).toBe('u1');
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/11';
    expect(updates[`${base}/w`]).toBe(1);
    expect(updates[`${base}/c`]).toBe(1);
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(hapticSuccess).toHaveBeenCalledTimes(1);
    expect(showUndoToast).toHaveBeenCalledTimes(1);
  });

  it('handleEpisodeToggle on the finale shows a non-blocking rating hint (no auto-modal)', async () => {
    // Letzte Episode der letzten Staffel -> Quick-Rate wäre fällig.
    ctx.shouldTriggerQuickRate.mockReturnValue(true);
    ctx.allSeriesList = [
      makeSeries({
        seasons: [{ seasonNumber: 0, episodes: [ep({ id: 11, watched: false })] }],
      }),
    ];
    const { result } = renderHook(() => useEpisodeManagement());

    await act(async () => {
      await result.current.handleEpisodeToggle(0, 0);
    });

    // F4: kein automatisches (blockierendes) Öffnen des Rating-Modals.
    expect(ctx.showQuickRating).not.toHaveBeenCalled();
    // Stattdessen ein wegwischbarer Hinweis mit „Bewerten"-Aktion.
    expect(showActionToast).toHaveBeenCalledTimes(1);
    const [message, opts] = vi.mocked(showActionToast).mock.calls[0] as [
      string,
      { actionLabel: string; onAction: () => void },
    ];
    expect(message).toContain('Alpha');
    expect(opts.actionLabel).toBe('Bewerten');

    // Erst der Tap auf „Bewerten" öffnet die Schnellbewertung (Staffel 1).
    opts.onAction();
    expect(ctx.showQuickRating).toHaveBeenCalledTimes(1);
    expect(vi.mocked(ctx.showQuickRating).mock.calls[0][1]).toBe(1);
  });

  it('handleEpisodeToggle onCommit fires analytics + the watch fanout for a first watch', async () => {
    ctx.allSeriesList = [makeSeries({ seasons: twoSeasons() })];
    const { result } = renderHook(() => useEpisodeManagement());
    await act(async () => {
      await result.current.handleEpisodeToggle(0, 0);
    });
    const opts = vi.mocked(showUndoToast).mock.calls[0][1] as { onCommit?: () => Promise<void> };
    await act(async () => {
      await opts.onCommit?.();
    });
    expect(trackEpisodeWatched).toHaveBeenCalledTimes(1);
    expect(runEpisodeWatchFanout).toHaveBeenCalledTimes(1);
    expect(vi.mocked(runEpisodeWatchFanout).mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      seriesId: 5,
      seasonNumber: 1,
      episodeNumber: 1,
      isRewatch: false,
    });
  });

  it('handleEpisodeToggle (longPress on a watched, single-count episode) unmarks it by nulling the path', async () => {
    ctx.allSeriesList = [
      makeSeries({
        seasons: [{ seasonNumber: 0, episodes: [ep({ id: 11, watched: true, watchCount: 1 })] }],
      }),
    ];
    const { result } = renderHook(() => useEpisodeManagement());

    await act(async () => {
      await result.current.handleEpisodeToggle(0, 0, true);
    });

    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(updates['users/u1/seriesWatch/5/seasons/0/eps/11']).toBeNull();
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('handleCatchUp: bulk-marks every unwatched episode before the target in one update map', async () => {
    ctx.allSeriesList = [makeSeries({ seasons: twoSeasons() })];
    const { result } = renderHook(() => useEpisodeManagement());

    // catch up to season index 1, episode index 0 → marks 11 and 12
    await act(async () => {
      await result.current.handleCatchUp(1, 0);
    });

    expect(applyUserUpdate).toHaveBeenCalledTimes(1);
    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(updates['users/u1/seriesWatch/5/seasons/0/eps/11/w']).toBe(1);
    expect(updates['users/u1/seriesWatch/5/seasons/0/eps/12/w']).toBe(1);
    expect(updates['users/u1/seriesWatch/5/seasons/1/eps/21/w']).toBeUndefined();
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
    expect(result.current.selectedSeason).toBe(1);
  });

  it('handleSeasonToggle (watch): marks every episode of the season', async () => {
    ctx.allSeriesList = [makeSeries({ seasons: twoSeasons() })];
    const { result } = renderHook(() => useEpisodeManagement());

    await act(async () => {
      await result.current.handleSeasonToggle(0, 'watch');
    });

    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(updates['users/u1/seriesWatch/5/seasons/0/eps/11/w']).toBe(1);
    expect(updates['users/u1/seriesWatch/5/seasons/0/eps/12/w']).toBe(1);
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('handleSeasonToggle (unwatch): nulls every episode of the season', async () => {
    ctx.allSeriesList = [
      makeSeries({
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 11, watched: true, watchCount: 1 }),
              ep({ id: 12, watched: true, watchCount: 1 }),
            ],
          },
        ],
      }),
    ];
    const { result } = renderHook(() => useEpisodeManagement());

    await act(async () => {
      await result.current.handleSeasonToggle(0, 'unwatch');
    });

    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(updates['users/u1/seriesWatch/5/seasons/0/eps/11']).toBeNull();
    expect(updates['users/u1/seriesWatch/5/seasons/0/eps/12']).toBeNull();
  });

  it('season navigation clamps at both ends', () => {
    ctx.allSeriesList = [makeSeries({ seasons: twoSeasons() })];
    const { result } = renderHook(() => useEpisodeManagement());

    act(() => result.current.setSelectedSeason(0));
    act(() => result.current.handleSwipeRight()); // already at 0 → stays
    expect(result.current.selectedSeason).toBe(0);

    act(() => result.current.handleSwipeLeft()); // → 1
    expect(result.current.selectedSeason).toBe(1);
    act(() => result.current.handleSwipeLeft()); // clamp at last
    expect(result.current.selectedSeason).toBe(1);
  });
});
