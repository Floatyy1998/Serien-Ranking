import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EarnedBadge } from './badgeDefinitions';

// Firebase-Mock (nur innerhalb der Funktionen genutzt)
const fb = vi.hoisted(() => {
  let onceVal: unknown = null;
  const setMock = vi.fn(async () => {});
  const updateMock = vi.fn(async () => {});
  const childUpdateMock = vi.fn(async () => {});
  const onceMock = vi.fn(async () => ({ val: () => onceVal }));
  const pushMock = vi.fn(() => ({ set: setMock, key: 'newKey' }));
  const childMock = vi.fn(() => ({ update: childUpdateMock }));
  const refMock = vi.fn(() => ({
    push: pushMock,
    update: updateMock,
    orderByChild: () => ({ once: onceMock }),
    child: childMock,
  }));
  return {
    refMock,
    setMock,
    updateMock,
    childUpdateMock,
    childMock,
    onceMock,
    pushMock,
    setOnce: (v: unknown) => {
      onceVal = v;
    },
    reset: () => {
      onceVal = null;
      for (const m of [
        setMock,
        updateMock,
        childUpdateMock,
        childMock,
        onceMock,
        pushMock,
        refMock,
      ]) {
        m.mockClear();
      }
    },
  };
});

vi.mock('firebase/compat/app', () => {
  const database = Object.assign(() => ({ ref: fb.refMock }), {
    ServerValue: { TIMESTAMP: 111 },
  });
  return { default: { database } };
});

// badgeCounterService-Mock
const counter = vi.hoisted(() => ({
  updateStreakCounter: vi.fn(async () => {}),
  incrementQuickwatchCounter: vi.fn(async () => {}),
  incrementRewatchCounter: vi.fn(async () => {}),
  recordMarathonEpisode: vi.fn(async () => {}),
  recordBingeEpisode: vi.fn(async () => {}),
  incrementSocialCounter: vi.fn(async () => {}),
  recordMarathonProgress: vi.fn(async () => {}),
}));
vi.mock('./badgeCounterService', () => ({ badgeCounterService: counter }));

// offlineBadgeSystem-Mock
const badgeSys = vi.hoisted(() => {
  let badges: unknown[] = [];
  return {
    invalidateCache: vi.fn(),
    checkForNewBadges: vi.fn(async () => badges),
    setBadges: (b: unknown[]) => {
      badges = b;
    },
  };
});
vi.mock('./offlineBadgeSystem', () => ({ getOfflineBadgeSystem: vi.fn(() => badgeSys) }));

import {
  registerBadgeCallback,
  removeBadgeCallback,
  updateEpisodeCounters,
  logSeriesAdded,
  logMovieAdded,
  logWatchlistAdded,
  logRatingAdded,
  logBatchEpisodesWatchedClean,
  logSeasonWatchedClean,
} from './minimalActivityLogger';

class FakeCustomEvent {
  type: string;
  detail: unknown;
  constructor(type: string, opts?: { detail?: unknown }) {
    this.type = type;
    this.detail = opts?.detail;
  }
}

beforeAll(() => {
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  vi.stubGlobal('CustomEvent', FakeCustomEvent);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  fb.reset();
  badgeSys.setBadges([]);
  badgeSys.invalidateCache.mockClear();
  badgeSys.checkForNewBadges.mockClear();
  for (const m of Object.values(counter)) m.mockClear();
});

const badge = (id: string): EarnedBadge => ({ id }) as EarnedBadge;

describe('Badge-Callbacks', () => {
  it('registrierter Callback erhält neu freigeschaltete Badges', async () => {
    badgeSys.setBadges([badge('b1')]);
    const cb = vi.fn();
    registerBadgeCallback('u-cb1', cb);

    const result = await logSeriesAdded('u-cb1', 'Dark', 1);

    expect(result).toEqual([badge('b1')]);
    expect(cb).toHaveBeenCalledWith([badge('b1')]);
  });

  it('removeBadgeCallback verhindert weitere Aufrufe', async () => {
    badgeSys.setBadges([badge('b2')]);
    const cb = vi.fn();
    registerBadgeCallback('u-cb2', cb);
    removeBadgeCallback('u-cb2');

    await logSeriesAdded('u-cb2', 'Dark', 1);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('updateEpisodeCounters', () => {
  it('aktualisiert Streak/Marathon/Binge-Counter und gibt Badges zurück', async () => {
    badgeSys.setBadges([badge('ep')]);
    const result = await updateEpisodeCounters('u-ep1');

    expect(counter.updateStreakCounter).toHaveBeenCalledWith('u-ep1');
    expect(counter.recordMarathonEpisode).toHaveBeenCalledWith('u-ep1');
    expect(counter.recordBingeEpisode).toHaveBeenCalledWith('u-ep1');
    expect(badgeSys.invalidateCache).toHaveBeenCalled();
    expect(result).toEqual([badge('ep')]);
  });

  it('Quickwatch-Counter nur bei heute erschienener Episode ohne Rewatch', async () => {
    const today = new Date().toISOString();
    await updateEpisodeCounters('u-ep2', false, today);
    expect(counter.incrementQuickwatchCounter).toHaveBeenCalledWith('u-ep2');
  });

  it('kein Quickwatch für alte Air-Dates', async () => {
    await updateEpisodeCounters('u-ep3', false, '2000-01-01');
    expect(counter.incrementQuickwatchCounter).not.toHaveBeenCalled();
  });

  it('Rewatch inkrementiert den Rewatch-Counter (kein Quickwatch)', async () => {
    const today = new Date().toISOString();
    await updateEpisodeCounters('u-ep4', true, today);
    expect(counter.incrementRewatchCounter).toHaveBeenCalledWith('u-ep4');
    expect(counter.incrementQuickwatchCounter).not.toHaveBeenCalled();
  });
});

describe('Friend-Activities', () => {
  it('logSeriesAdded schreibt series_added + Social-Counter', async () => {
    await logSeriesAdded('u1', 'Dark', 42, '/p.jpg');
    expect(fb.pushMock).toHaveBeenCalled();
    expect(fb.setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'series_added',
        tmdbId: 42,
        itemType: 'series',
        posterPath: '/p.jpg',
      })
    );
    expect(counter.incrementSocialCounter).toHaveBeenCalledWith('u1', 'series');
  });

  it('logMovieAdded schreibt movie_added + Social-Counter', async () => {
    await logMovieAdded('u2', 'Inception', 27205);
    expect(fb.setMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'movie_added', itemType: 'movie', tmdbId: 27205 })
    );
    expect(counter.incrementSocialCounter).toHaveBeenCalledWith('u2', 'movie');
  });

  it('logWatchlistAdded schreibt series_added_to_watchlist (ohne Social-Counter)', async () => {
    await logWatchlistAdded('u3', 'Severance', 95396);
    expect(fb.setMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'series_added_to_watchlist', tmdbId: 95396 })
    );
    expect(counter.incrementSocialCounter).not.toHaveBeenCalled();
  });

  it('logRatingAdded unterscheidet Serie und Film', async () => {
    await logRatingAdded('u4', 'Dark', 'series', 9, 1);
    expect(fb.setMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'rating_updated', rating: 9 })
    );
    await logRatingAdded('u4', 'Inception', 'movie', 8, 2);
    expect(fb.setMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'rating_updated_movie', rating: 8 })
    );
  });
});

describe('Batch-/Season-Logger', () => {
  it('logBatchEpisodesWatchedClean dedupliziert Badges nach id', async () => {
    badgeSys.setBadges([badge('dup')]);
    const result = await logBatchEpisodesWatchedClean('u-batch', [
      { isRewatch: false },
      { isRewatch: false },
      { isRewatch: false },
    ]);
    expect(result).toEqual([badge('dup')]);
    // updateEpisodeCounters lief pro Episode → Streak dreimal aktualisiert
    expect(counter.updateStreakCounter).toHaveBeenCalledTimes(3);
  });

  it('logSeasonWatchedClean nutzt Streak + Marathon-Progress', async () => {
    badgeSys.setBadges([badge('season')]);
    const result = await logSeasonWatchedClean('u-season', 8);
    expect(counter.updateStreakCounter).toHaveBeenCalledWith('u-season');
    expect(counter.recordMarathonProgress).toHaveBeenCalledWith('u-season', 8);
    expect(result).toEqual([badge('season')]);
  });
});
