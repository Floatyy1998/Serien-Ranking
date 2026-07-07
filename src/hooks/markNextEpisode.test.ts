// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';

// --- Firebase compat mock ---------------------------------------------------
const fb = vi.hoisted(() => {
  const onceMock = vi.fn<() => Promise<{ val: () => unknown }>>();
  const updateMock = vi.fn((_updates?: Record<string, unknown>) => Promise.resolve());
  const refMock = vi.fn(() => ({ once: onceMock, update: updateMock }));
  const database = () => ({ ref: refMock });
  return { onceMock, updateMock, refMock, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

// --- Side-effect module mocks (compactWatch stays real) ---------------------
vi.mock('../services/offline/queuedUpdate', () => ({
  applyUserUpdate: vi.fn(() => Promise.resolve({ queued: false })),
}));
vi.mock('../lib/haptics', () => ({ hapticSuccess: vi.fn() }));
vi.mock('../lib/toast', () => ({ showToast: vi.fn(), showUndoToast: vi.fn() }));
vi.mock('../lib/episode/episodeWatchFanout', () => ({
  runEpisodeWatchFanout: vi.fn(() => Promise.resolve()),
}));
vi.mock('../services/firebase/analytics', () => ({ trackEpisodeWatched: vi.fn() }));

import { trackEpisodeWatched } from '../services/firebase/analytics';
import { runEpisodeWatchFanout } from '../lib/episode/episodeWatchFanout';
import { hapticSuccess } from '../lib/haptics';
import { applyUserUpdate } from '../services/offline/queuedUpdate';
import { showToast, showUndoToast } from '../lib/toast';
import { findNextEpisode, markNextEpisodeWatched } from './markNextEpisode';

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

const seriesWithNext = () =>
  makeSeries({
    seasons: [
      {
        seasonNumber: 0,
        episodes: [
          ep({ id: 11, watched: true }),
          ep({ id: 12, watched: false, episode_number: 2 }),
        ],
      },
    ],
  });

const setSnapshot = (value: unknown) => {
  fb.onceMock.mockResolvedValue({ val: () => value });
};

describe('findNextEpisode', () => {
  it('liefert die erste ungesehene, ausgestrahlte Episode mit korrekten Indizes', () => {
    const next = findNextEpisode(seriesWithNext());
    expect(next).toMatchObject({
      seasonIndex: 0,
      episodeIndex: 1,
      seasonNumber: 1, // (seasonNumber 0) + 1
      episodeNumber: 2,
      episodeId: 12,
      runtime: 30,
    });
  });

  it('gibt null zurück wenn keine seasons vorhanden sind', () => {
    expect(
      findNextEpisode(makeSeries({ seasons: undefined as unknown as Series['seasons'] }))
    ).toBeNull();
  });

  it('gibt null zurück wenn alle Episoden gesehen sind', () => {
    const s = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, watched: true })] }],
    });
    expect(findNextEpisode(s)).toBeNull();
  });

  it('überspringt noch nicht ausgestrahlte Episoden', () => {
    const s = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            ep({ id: 1, watched: true }),
            ep({ id: 2, watched: false, air_date: '2999-01-01' }),
          ],
        },
      ],
    });
    expect(findNextEpisode(s)).toBeNull();
  });
});

describe('markNextEpisodeWatched', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSnapshot({});
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gibt false zurück wenn keine nächste Episode existiert', async () => {
    const s = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ id: 1, watched: true })] }],
    });
    await expect(markNextEpisodeWatched('u1', s)).resolves.toBe(false);
    expect(applyUserUpdate).not.toHaveBeenCalled();
  });

  it('gibt false zurück wenn die nächste Episode keine gültige episodeId hat', async () => {
    const s = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [ep({ id: undefined as unknown as number, watched: false })],
        },
      ],
    });
    await expect(markNextEpisodeWatched('u1', s)).resolves.toBe(false);
    expect(applyUserUpdate).not.toHaveBeenCalled();
  });

  it('schreibt die Watched-Update-Map inkl. serienVersion-Bump und triggert Haptik/Toast', async () => {
    const result = await markNextEpisodeWatched('u1', seriesWithNext());
    expect(result).toBe(true);
    expect(hapticSuccess).toHaveBeenCalledTimes(1);
    expect(showUndoToast).toHaveBeenCalledTimes(1);

    expect(applyUserUpdate).toHaveBeenCalledTimes(1);
    const [uid, updates] = vi.mocked(applyUserUpdate).mock.calls[0];
    expect(uid).toBe('u1');
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/12';
    expect(updates[`${base}/w`]).toBe(1);
    expect(updates[`${base}/c`]).toBe(1); // previousCount 0 + 1
    expect(typeof updates[`${base}/l`]).toBe('number');
    expect(updates[`${base}/f`]).toBeDefined(); // Erstwatch → f gesetzt
    expect(updates['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('erhöht den bestehenden watchCount und lässt f beim Rewatch unangetastet', async () => {
    setSnapshot({ w: 1, c: 2, f: 100, l: 200 });
    await markNextEpisodeWatched('u1', seriesWithNext());
    const [, updates] = vi.mocked(applyUserUpdate).mock.calls[0];
    const base = 'users/u1/seriesWatch/5/seasons/0/eps/12';
    expect(updates[`${base}/c`]).toBe(3); // 2 + 1
    expect(updates[`${base}/f`]).toBeUndefined(); // hatte bereits f → kein neuer Erstwatch
  });

  it('onCommit feuert Analytics + Watch-Fanout', async () => {
    await markNextEpisodeWatched('u1', seriesWithNext());
    const opts = vi.mocked(showUndoToast).mock.calls[0][1];
    expect(typeof opts).toBe('object');
    const options = opts as { onCommit?: () => Promise<void> };
    await options.onCommit?.();
    expect(trackEpisodeWatched).toHaveBeenCalledTimes(1);
    expect(runEpisodeWatchFanout).toHaveBeenCalledTimes(1);
    expect(vi.mocked(runEpisodeWatchFanout).mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      seriesId: 5,
      isRewatch: false, // previousCount 0
    });
  });

  it('onUndo schreibt eine Revert-Map mit serienVersion-Bump direkt in die DB', async () => {
    await markNextEpisodeWatched('u1', seriesWithNext());
    const options = vi.mocked(showUndoToast).mock.calls[0][1] as {
      onUndo?: () => Promise<void>;
    };
    await options.onUndo?.();
    expect(fb.updateMock).toHaveBeenCalledTimes(1);
    const undoMap = fb.updateMock.mock.calls[0][0];
    expect(undoMap?.['users/u1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('gibt false zurück und zeigt einen Fehler-Toast wenn der DB-Read fehlschlägt', async () => {
    fb.onceMock.mockRejectedValueOnce(new Error('boom'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(markNextEpisodeWatched('u1', seriesWithNext())).resolves.toBe(false);
    expect(showToast).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
