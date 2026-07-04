import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';

// ── In-Memory-Firebase (hierarchisch: exakter Key gewinnt, sonst aus Kindern
//    rekonstruiert — deckt sowohl Whole-Node-`set` als auch Multi-Path-`update` ab)
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

// notificationSettings isolieren
const settings = vi.hoisted(() => ({
  getSnoozedUntil: vi.fn(async () => ({}) as Record<string, number>),
  cleanupSnoozes: vi.fn(async () => {}),
}));
vi.mock('../settings/notificationSettings', () => settings);

import { detectCompletedSeries, markCompletedSeriesAsNotified } from './completedSeriesDetection';

const DAY = 24 * 60 * 60 * 1000;
const UID = 'u1';
let NOW = 0;

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
    ...o,
  }) as unknown as Series;

/** Serie mit einer ausgestrahlten, geschauten Episode + Status ended. */
const endedFullyWatched = (o: Partial<Series> = {}): Series =>
  makeSeries({
    status: 'ended',
    seasons: [{ seasonNumber: 0, episodes: [ep({ id: 10, watched: true })] }] as Series['seasons'],
    ...o,
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T12:00:00Z'));
  NOW = Date.now();
  fb.store.clear();
  settings.getSnoozedUntil.mockReset();
  settings.getSnoozedUntil.mockResolvedValue({});
  settings.cleanupSnoozes.mockReset();
  settings.cleanupSnoozes.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('detectCompletedSeries', () => {
  it('First-Run: alle ausgestrahlten Episoden geschaut + Status ended → notify', async () => {
    const result = await detectCompletedSeries([endedFullyWatched()], UID);
    expect(result.map((s) => s.id)).toEqual([1]);
    // Erst-Erfassung wird persistiert
    expect(fb.store.get('users/u1/completedSeriesData')).toMatchObject({
      '1': { seriesId: 1, allEpisodesWatched: true, notified: false },
    });
  });

  it('Status läuft noch (nicht ended/canceled) → kein completed', async () => {
    const s = endedFullyWatched({ status: 'Returning Series' });
    await expect(detectCompletedSeries([s], UID)).resolves.toEqual([]);
  });

  it('akzeptiert canceled und cancelled als abgeschlossen', async () => {
    const a = await detectCompletedSeries([endedFullyWatched({ status: 'canceled' })], UID);
    expect(a).toHaveLength(1);
    fb.store.clear();
    const b = await detectCompletedSeries([endedFullyWatched({ status: 'Cancelled' })], UID);
    expect(b).toHaveLength(1);
  });

  it('nicht alle ausgestrahlten Episoden geschaut → kein completed', async () => {
    const s = makeSeries({
      status: 'ended',
      seasons: [
        {
          seasonNumber: 0,
          episodes: [ep({ id: 1, watched: true }), ep({ id: 2, watched: false })],
        },
      ] as Series['seasons'],
    });
    await expect(detectCompletedSeries([s], UID)).resolves.toEqual([]);
  });

  it('nur zukünftige (noch nicht ausgestrahlte) Episoden → kein completed', async () => {
    const s = makeSeries({
      status: 'ended',
      seasons: [
        { seasonNumber: 0, episodes: [ep({ id: 1, air_date: '2099-01-01', watched: true })] },
      ] as Series['seasons'],
    });
    await expect(detectCompletedSeries([s], UID)).resolves.toEqual([]);
  });

  it('nicht auf der Watchlist → übersprungen', async () => {
    const s = endedFullyWatched({ watchlist: false });
    await expect(detectCompletedSeries([s], UID)).resolves.toEqual([]);
  });

  it('aktiver Rewatch → übersprungen', async () => {
    const s = endedFullyWatched({ rewatch: { active: true, round: 1 } });
    await expect(detectCompletedSeries([s], UID)).resolves.toEqual([]);
  });

  it('kürzlich dismissed (innerhalb RENOTIFY_COOLDOWN) → unterdrückt', async () => {
    fb.store.set('users/u1/completedSeriesNotifications', {
      '1': { dismissed: true, timestamp: NOW - 5 * DAY },
    });
    await expect(detectCompletedSeries([endedFullyWatched()], UID)).resolves.toEqual([]);
  });

  it('dismissed vor sehr langer Zeit (> 90 Tage) → wieder benachrichtigt', async () => {
    fb.store.set('users/u1/completedSeriesNotifications', {
      '1': { dismissed: true, timestamp: NOW - 100 * DAY },
    });
    await expect(detectCompletedSeries([endedFullyWatched()], UID)).resolves.toHaveLength(1);
  });

  it('gesnoozed → unterdrückt', async () => {
    settings.getSnoozedUntil.mockResolvedValue({ '1': NOW + DAY });
    await expect(detectCompletedSeries([endedFullyWatched()], UID)).resolves.toEqual([]);
  });

  it('bereits notifiziert und Cooldown NICHT abgelaufen → unterdrückt', async () => {
    fb.store.set('users/u1/completedSeriesData', {
      '1': {
        seriesId: 1,
        allEpisodesWatched: true,
        seriesStatus: 'ended',
        lastChecked: NOW - 2 * DAY,
        notified: true,
        notifiedAt: NOW - 2 * DAY,
      },
    });
    await expect(detectCompletedSeries([endedFullyWatched()], UID)).resolves.toEqual([]);
  });

  it('bereits notifiziert aber Cooldown abgelaufen (> 90 Tage) → wieder benachrichtigt', async () => {
    fb.store.set('users/u1/completedSeriesData', {
      '1': {
        seriesId: 1,
        allEpisodesWatched: true,
        seriesStatus: 'ended',
        lastChecked: NOW - 100 * DAY,
        notified: true,
        notifiedAt: NOW - 100 * DAY,
      },
    });
    await expect(detectCompletedSeries([endedFullyWatched()], UID)).resolves.toHaveLength(1);
  });
});

describe('markCompletedSeriesAsNotified', () => {
  it('setzt notified + notifiedAt + lastChecked für jede id', async () => {
    await markCompletedSeriesAsNotified([1, 2], UID);
    expect(fb.store.get('users/u1/completedSeriesData/1/notified')).toBe(true);
    expect(fb.store.get('users/u1/completedSeriesData/1/notifiedAt')).toBe(NOW);
    expect(fb.store.get('users/u1/completedSeriesData/2/lastChecked')).toBe(NOW);
  });

  it('leere id-Liste → kein Write', async () => {
    await markCompletedSeriesAsNotified([], UID);
    expect(fb.store.size).toBe(0);
  });
});
