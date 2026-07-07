import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';

const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const readPath = (path?: string): unknown => {
    if (!path) return null;
    if (store.has(path)) return store.get(path);
    const prefix = path + '/';
    const childKeys = [...store.keys()].filter((k) => k.startsWith(prefix));
    if (childKeys.length === 0) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const k of childKeys) {
      const parts = k.slice(prefix.length).split('/');
      let cur = result;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = store.get(k);
    }
    return result;
  };
  const deleteTree = (path: string) => {
    store.delete(path);
    const prefix = path + '/';
    for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
  };
  const makeRef = (path?: string) => ({
    once: async () => ({ val: () => readPath(path) }),
    set: async (v: unknown) => {
      if (path) {
        deleteTree(path);
        store.set(path, v);
      }
    },
    update: async (m: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(m)) {
        if (v === null) deleteTree(k);
        else store.set(k, v);
      }
    },
  });
  return { store, makeRef };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p?: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const settings = vi.hoisted(() => ({
  getInactiveThresholdDays: vi.fn(async () => 30),
  getSnoozedUntil: vi.fn(async () => ({}) as Record<string, number>),
  cleanupSnoozes: vi.fn(async () => {}),
}));
vi.mock('../../lib/settings/notificationSettings', () => settings);

import {
  detectInactiveSeries,
  detectInactiveRewatches,
  markInactiveSeriesAsNotified,
  markInactiveRewatchAsNotified,
} from './inactiveSeriesDetection';

const DAY = 24 * 60 * 60 * 1000;
const UID = 'u1';
let NOW = 0;
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

interface EpOver {
  id?: number;
  air_date?: string;
  watched?: boolean;
  episode_number?: number;
  lastWatchedAt?: string;
}
const ep = (o: EpOver = {}) => ({
  id: 1,
  name: 'E',
  air_date: '2020-01-01',
  watched: false,
  episode_number: 1,
  ...o,
});

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 1,
    title: 'S',
    watchlist: true,
    rating: {},
    seasonCount: 1,
    seasons: [],
    status: 'ended',
    ...o,
  }) as unknown as Series;

/** Ended-Serie, zuletzt vor `daysAgo` Tagen geschaut (alte, ausgestrahlte Folge). */
const watchedLongAgo = (daysAgo: number, o: Partial<Series> = {}): Series =>
  makeSeries({
    seasons: [
      {
        seasonNumber: 0,
        episodes: [ep({ id: 10, watched: true, lastWatchedAt: iso(-daysAgo * DAY) })],
      },
    ] as Series['seasons'],
    ...o,
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T12:00:00Z'));
  NOW = Date.now();
  fb.store.clear();
  settings.getInactiveThresholdDays.mockReset();
  settings.getInactiveThresholdDays.mockResolvedValue(30);
  settings.getSnoozedUntil.mockReset();
  settings.getSnoozedUntil.mockResolvedValue({});
  settings.cleanupSnoozes.mockReset();
  settings.cleanupSnoozes.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('detectInactiveSeries', () => {
  it('Threshold 0 → Feature aus → gibt [] zurück ohne Firebase-Zugriff', async () => {
    settings.getInactiveThresholdDays.mockResolvedValue(0);
    await expect(detectInactiveSeries([watchedLongAgo(200)], UID)).resolves.toEqual([]);
    // Kein Notifications-Read/Write bei deaktiviertem Feature
    expect(fb.store.size).toBe(0);
  });

  it('zuletzt geschaut länger her als Threshold → inaktiv', async () => {
    const result = await detectInactiveSeries([watchedLongAgo(200)], UID);
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it('zuletzt geschaut innerhalb des Thresholds → nicht inaktiv', async () => {
    await expect(detectInactiveSeries([watchedLongAgo(10)], UID)).resolves.toEqual([]);
  });

  it('laufende Serie (running) → übersprungen', async () => {
    const s = watchedLongAgo(200, { status: 'running' });
    await expect(detectInactiveSeries([s], UID)).resolves.toEqual([]);
  });

  it('kürzlich ausgestrahlte, ungeschaute Episode (in Grace-Periode) → übersprungen', async () => {
    const s = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            ep({ id: 10, watched: true, lastWatchedAt: iso(-200 * DAY) }),
            ep({ id: 11, air_date: iso(-14 * DAY).slice(0, 10), watched: false }),
          ],
        },
      ] as Series['seasons'],
    });
    await expect(detectInactiveSeries([s], UID)).resolves.toEqual([]);
  });

  it('nie geschaut (kein lastWatched) → nicht inaktiv', async () => {
    const s = makeSeries({
      seasons: [
        { seasonNumber: 0, episodes: [ep({ id: 10, watched: false })] },
      ] as Series['seasons'],
    });
    await expect(detectInactiveSeries([s], UID)).resolves.toEqual([]);
  });

  it('gesnoozed → unterdrückt', async () => {
    settings.getSnoozedUntil.mockResolvedValue({ '1': NOW + DAY });
    await expect(detectInactiveSeries([watchedLongAgo(200)], UID)).resolves.toEqual([]);
  });

  it('kürzlich dismissed → unterdrückt', async () => {
    fb.store.set('users/u1/inactiveSeriesNotifications', {
      '1': { dismissed: true, timestamp: NOW - 2 * DAY },
    });
    await expect(detectInactiveSeries([watchedLongAgo(200)], UID)).resolves.toEqual([]);
  });

  it('höherer Threshold (90) macht eine bei 30 inaktive Serie wieder aktiv', async () => {
    settings.getInactiveThresholdDays.mockResolvedValue(90);
    await expect(detectInactiveSeries([watchedLongAgo(60)], UID)).resolves.toEqual([]);
  });

  it('aktiver Rewatch → von der Standard-Inaktiv-Detection übersprungen', async () => {
    const s = watchedLongAgo(200, { rewatch: { active: true, round: 1 } });
    await expect(detectInactiveSeries([s], UID)).resolves.toEqual([]);
  });
});

describe('detectInactiveRewatches', () => {
  const rewatched = (daysAgo: number, startedOffsetDays: number): Series =>
    makeSeries({
      rewatch: { active: true, round: 1, startedAt: iso(-startedOffsetDays * DAY) },
      seasons: [
        {
          seasonNumber: 0,
          episodes: [ep({ id: 10, watched: true, lastWatchedAt: iso(-daysAgo * DAY) })],
        },
      ] as Series['seasons'],
    });

  it('Threshold 0 → []', async () => {
    settings.getInactiveThresholdDays.mockResolvedValue(0);
    await expect(detectInactiveRewatches([rewatched(200, 200)], UID)).resolves.toEqual([]);
  });

  it('Rewatch seit langem inaktiv → gemeldet', async () => {
    const result = await detectInactiveRewatches([rewatched(200, 200)], UID);
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it('lastActivity = max(lastWatched, startedAt): kürzlich gestarteter Rewatch → nicht inaktiv', async () => {
    // Watch alt (200d), aber Rewatch-Start erst vor 5 Tagen → max = 5d < Threshold
    await expect(detectInactiveRewatches([rewatched(200, 5)], UID)).resolves.toEqual([]);
  });

  it('Serie ohne aktiven Rewatch → übersprungen', async () => {
    const s = watchedLongAgo(200); // kein rewatch
    await expect(detectInactiveRewatches([s], UID)).resolves.toEqual([]);
  });

  it('gesnoozed → unterdrückt', async () => {
    settings.getSnoozedUntil.mockResolvedValue({ '1': NOW + DAY });
    await expect(detectInactiveRewatches([rewatched(200, 200)], UID)).resolves.toEqual([]);
  });
});

describe('mark-Funktionen', () => {
  it('markInactiveSeriesAsNotified setzt Flags pro id', async () => {
    await markInactiveSeriesAsNotified([1], UID);
    expect(fb.store.get('users/u1/inactiveSeriesData/1/notified')).toBe(true);
    expect(fb.store.get('users/u1/inactiveSeriesData/1/notifiedAt')).toBe(NOW);
  });

  it('markInactiveRewatchAsNotified setzt Flags pro id', async () => {
    await markInactiveRewatchAsNotified([2], UID);
    expect(fb.store.get('users/u1/inactiveRewatchData/2/notified')).toBe(true);
    expect(fb.store.get('users/u1/inactiveRewatchData/2/notifiedAt')).toBe(NOW);
  });

  it('leere Listen → keine Writes', async () => {
    await markInactiveSeriesAsNotified([], UID);
    await markInactiveRewatchAsNotified([], UID);
    expect(fb.store.size).toBe(0);
  });
});
