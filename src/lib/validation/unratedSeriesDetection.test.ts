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
  getSnoozedUntil: vi.fn(async () => ({}) as Record<string, number>),
  cleanupSnoozes: vi.fn(async () => {}),
}));
vi.mock('../settings/notificationSettings', () => settings);

import { detectUnratedSeries } from './unratedSeriesDetection';

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
  ({ id: 1, title: 'S', seasonCount: 1, seasons: [], rating: {}, ...o }) as unknown as Series;

/** Serie mit einer voll ausgestrahlten + geschauten Staffel, abgeschlossen vor `daysAgo`. */
const completedSeason = (daysAgo: number, o: Partial<Series> = {}): Series =>
  makeSeries({
    seasons: [
      {
        seasonNumber: 0,
        episodes: [
          ep({ id: 1, watched: true, lastWatchedAt: iso(-daysAgo * DAY) }),
          ep({ id: 2, episode_number: 2, watched: true, lastWatchedAt: iso(-daysAgo * DAY) }),
        ],
      },
    ] as Series['seasons'],
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

describe('detectUnratedSeries', () => {
  it('unbewertete Serie, letzte Staffel vor >= 7 Tagen abgeschlossen → gemeldet', async () => {
    const result = await detectUnratedSeries([completedSeason(10)], UID);
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it('bereits bewertet → übersprungen', async () => {
    const s = completedSeason(10, { rating: { u1: 8 } });
    await expect(detectUnratedSeries([s], UID)).resolves.toEqual([]);
  });

  it('Staffel läuft aktuell (einige ausgestrahlt, einige nicht) → übersprungen', async () => {
    const s = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            ep({ id: 1, watched: true, lastWatchedAt: iso(-10 * DAY) }),
            ep({ id: 2, episode_number: 2, air_date: '2099-01-01', watched: false }),
          ],
        },
      ] as Series['seasons'],
    });
    await expect(detectUnratedSeries([s], UID)).resolves.toEqual([]);
  });

  it('Abschluss weniger als 7 Tage her → noch nicht gemeldet', async () => {
    await expect(detectUnratedSeries([completedSeason(3)], UID)).resolves.toEqual([]);
  });

  it('kürzlich dismissed (innerhalb 7-Tage-Cooldown) → unterdrückt', async () => {
    fb.store.set('users/u1/unratedSeriesNotifications', {
      '1': { dismissed: true, timestamp: NOW - 2 * DAY },
    });
    await expect(detectUnratedSeries([completedSeason(10)], UID)).resolves.toEqual([]);
  });

  it('dismissed vor > 7 Tagen → wieder gemeldet', async () => {
    fb.store.set('users/u1/unratedSeriesNotifications', {
      '1': { dismissed: true, timestamp: NOW - 8 * DAY },
    });
    await expect(detectUnratedSeries([completedSeason(10)], UID)).resolves.toHaveLength(1);
  });

  it('gesnoozed → unterdrückt', async () => {
    settings.getSnoozedUntil.mockResolvedValue({ '1': NOW + DAY });
    await expect(detectUnratedSeries([completedSeason(10)], UID)).resolves.toEqual([]);
  });

  it('spätere ausgestrahlte Staffel noch nicht fertig geschaut → nicht die neueste → übersprungen', async () => {
    const s = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [ep({ id: 1, watched: true, lastWatchedAt: iso(-10 * DAY) })],
        },
        {
          // Staffel 2 komplett ausgestrahlt, aber NICHT geschaut
          seasonNumber: 1,
          episodes: [ep({ id: 2, episode_number: 1, watched: false })],
        },
      ] as Series['seasons'],
    });
    await expect(detectUnratedSeries([s], UID)).resolves.toEqual([]);
  });

  it('keine abgeschlossene ausgestrahlte Staffel → nichts zu melden', async () => {
    const s = makeSeries({
      seasons: [
        { seasonNumber: 0, episodes: [ep({ id: 1, watched: false })] },
      ] as Series['seasons'],
    });
    await expect(detectUnratedSeries([s], UID)).resolves.toEqual([]);
  });
});
