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

import {
  detectNewSeasons,
  markNewSeasonsAsShown,
  markMultipleSeasonsAsNotified,
} from './newSeasonDetection';

const DAY = 24 * 60 * 60 * 1000;
const UID = 'u1';
let NOW = 0;

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({ id: 1, title: 'S', seasonCount: 2, seasons: [], rating: {}, ...o }) as unknown as Series;

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

describe('detectNewSeasons', () => {
  it('erstmalig gesehene Serie wird still eingelesen (nie benachrichtigt)', async () => {
    const result = await detectNewSeasons([makeSeries({ seasonCount: 2 })], UID);
    expect(result).toEqual([]);
    // seasonCounts wird geseedet
    expect(fb.store.get('users/u1/meta/seasonCounts')).toEqual({ '1': 2 });
  });

  it('seasonCount gestiegen ggü. gespeichertem Stand → benachrichtigt', async () => {
    fb.store.set('users/u1/meta/seasonCounts', { '1': 2 });
    const result = await detectNewSeasons([makeSeries({ seasonCount: 3 })], UID);
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it('seasonCount unverändert (<=) → keine Benachrichtigung', async () => {
    fb.store.set('users/u1/meta/seasonCounts', { '1': 3 });
    await expect(detectNewSeasons([makeSeries({ seasonCount: 3 })], UID)).resolves.toEqual([]);
  });

  it('shown-Cooldown aktiv (gleicher Count, kürzlich gezeigt) → unterdrückt', async () => {
    fb.store.set('users/u1/meta/seasonCounts', { '1': 2 });
    fb.store.set('users/u1/newSeasonNotifications', {
      '1': { shownCount: 3, shownAt: NOW - 1 * DAY },
    });
    await expect(detectNewSeasons([makeSeries({ seasonCount: 3 })], UID)).resolves.toEqual([]);
  });

  it('shown-Cooldown abgelaufen (> 3 Tage) → wieder benachrichtigt', async () => {
    fb.store.set('users/u1/meta/seasonCounts', { '1': 2 });
    fb.store.set('users/u1/newSeasonNotifications', {
      '1': { shownCount: 3, shownAt: NOW - 4 * DAY },
    });
    await expect(detectNewSeasons([makeSeries({ seasonCount: 3 })], UID)).resolves.toHaveLength(1);
  });

  it('gesnoozed → unterdrückt', async () => {
    fb.store.set('users/u1/meta/seasonCounts', { '1': 2 });
    settings.getSnoozedUntil.mockResolvedValue({ '1': NOW + DAY });
    await expect(detectNewSeasons([makeSeries({ seasonCount: 3 })], UID)).resolves.toEqual([]);
  });

  it('Serie ohne numerischen seasonCount → übersprungen', async () => {
    const s = makeSeries({ seasonCount: undefined as unknown as number });
    await expect(detectNewSeasons([s], UID)).resolves.toEqual([]);
  });
});

describe('markNewSeasonsAsShown', () => {
  it('setzt nur den passiven shownAt/shownCount-Marker', async () => {
    await markNewSeasonsAsShown([{ id: 1, seasonCount: 3 }], UID);
    expect(fb.store.get('users/u1/newSeasonNotifications/1')).toEqual({
      shownCount: 3,
      shownAt: NOW,
    });
    // seasonCounts unangetastet
    expect(fb.store.get('users/u1/meta/seasonCounts')).toBeUndefined();
  });

  it('leere Liste → kein Write', async () => {
    await markNewSeasonsAsShown([], UID);
    expect(fb.store.size).toBe(0);
  });
});

describe('markMultipleSeasonsAsNotified', () => {
  it('hebt seasonCounts auf aktuellen Wert und räumt Notification auf', async () => {
    fb.store.set('users/u1/meta/seasonCounts', { '1': 2 });
    await markMultipleSeasonsAsNotified([1], UID, [makeSeries({ seasonCount: 3 })]);
    expect(fb.store.get('users/u1/meta/seasonCounts')).toEqual({ '1': 3 });
    expect(fb.store.get('users/u1/newSeasonNotifications/1')).toBeUndefined();
  });

  it('leere id-Liste → kein Write', async () => {
    await markMultipleSeasonsAsNotified([], UID);
    expect(fb.store.size).toBe(0);
  });
});
