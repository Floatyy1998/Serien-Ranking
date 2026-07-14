import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Verschachtelter Firebase-Mock mit transaction/set/remove/child/once, damit
// die counter-Logik (transaction-basiert) end-to-end gegen einen Baum läuft.
const fb = vi.hoisted(() => {
  const root: Record<string, unknown> = {};
  const segs = (p: string) => p.split('/').filter(Boolean);
  const getAt = (path: string): unknown => {
    let node: unknown = root;
    for (const s of segs(path)) {
      if (node == null || typeof node !== 'object') return null;
      node = (node as Record<string, unknown>)[s];
    }
    return node === undefined ? null : node;
  };
  const setAt = (path: string, v: unknown) => {
    const parts = segs(path);
    let node: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const s = parts[i];
      if (node[s] == null || typeof node[s] !== 'object') node[s] = {};
      node = node[s] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (v === null || v === undefined) delete node[last];
    else node[last] = v;
  };
  const snap = (val: unknown) => ({
    val: () => (val === undefined ? null : val),
    exists: () => val !== null && val !== undefined,
  });
  const makeRef = (path: string): Record<string, unknown> => ({
    once: async () => snap(getAt(path)),
    set: async (v: unknown) => setAt(path, v),
    remove: async () => setAt(path, undefined),
    child: (key: string) => makeRef(`${path}/${key}`),
    transaction: async (fn: (cur: unknown) => unknown) => {
      const cur = getAt(path);
      const next = fn(cur);
      setAt(path, next === undefined ? undefined : next);
      return { committed: next != null, snapshot: snap(getAt(path)) };
    },
  });
  const database = (() => ({ ref: (p: string) => makeRef(p) })) as unknown as {
    (): { ref: (p: string) => Record<string, unknown> };
    ServerValue: { TIMESTAMP: string };
  };
  database.ServerValue = { TIMESTAMP: '__SERVER_TS__' };
  const reset = () => {
    for (const k of Object.keys(root)) delete root[k];
  };
  return { getAt, setAt, database, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

import { badgeCounterService } from './badgeCounterService';

const UID = 'u1';
const BASE = new Date('2026-07-04T12:00:00Z').getTime();
const counterPath = (name: string) => `users/${UID}/badgeCounters/${name}`;

beforeEach(() => fb.reset());

// einfache Increment-Counter

describe('increment-Counter (transaction)', () => {
  it('incrementQuickwatchCounter startet bei 1 und erhöht', async () => {
    await badgeCounterService.incrementQuickwatchCounter(UID);
    expect(fb.getAt(counterPath('quickwatchEpisodes'))).toBe(1);
    await badgeCounterService.incrementQuickwatchCounter(UID);
    expect(fb.getAt(counterPath('quickwatchEpisodes'))).toBe(2);
  });

  it('incrementRewatchCounter erhöht rewatchEpisodes', async () => {
    await badgeCounterService.incrementRewatchCounter(UID);
    await badgeCounterService.incrementRewatchCounter(UID);
    expect(fb.getAt(counterPath('rewatchEpisodes'))).toBe(2);
  });

  it('incrementCounter respektiert amount und Default 1', async () => {
    await badgeCounterService.incrementCounter(UID, 'currentStreak', 5);
    expect(fb.getAt(counterPath('currentStreak'))).toBe(5);
    await badgeCounterService.incrementCounter(UID, 'currentStreak');
    expect(fb.getAt(counterPath('currentStreak'))).toBe(6);
  });

  it('incrementSocialCounter erhöht itemsAdded und typ-spezifischen Counter', async () => {
    await badgeCounterService.incrementSocialCounter(UID, 'series');
    await badgeCounterService.incrementSocialCounter(UID, 'movie');
    expect(fb.getAt(counterPath('itemsAdded'))).toBe(2);
    expect(fb.getAt(counterPath('seriesAdded'))).toBe(1);
    expect(fb.getAt(counterPath('movieAdded'))).toBe(1);
  });
});

// read/reset/clear

describe('Lesen und Zurücksetzen', () => {
  it('getCounter liest den Wert, fehlend → 0', async () => {
    fb.setAt(counterPath('quickwatchEpisodes'), 7);
    await expect(badgeCounterService.getCounter(UID, 'quickwatchEpisodes')).resolves.toBe(7);
    await expect(badgeCounterService.getCounter(UID, 'nope')).resolves.toBe(0);
  });

  it('getAllCounters liefert das gesamte badgeCounters-Objekt, sonst {}', async () => {
    fb.setAt(`users/${UID}/badgeCounters`, { a: 1, b: 2 });
    await expect(badgeCounterService.getAllCounters(UID)).resolves.toEqual({ a: 1, b: 2 });
    fb.reset();
    await expect(badgeCounterService.getAllCounters(UID)).resolves.toEqual({});
  });

  it('resetCounter setzt auf 0', async () => {
    fb.setAt(counterPath('quickwatchEpisodes'), 9);
    await badgeCounterService.resetCounter(UID, 'quickwatchEpisodes');
    expect(fb.getAt(counterPath('quickwatchEpisodes'))).toBe(0);
  });

  it('clearAllCounters entfernt den gesamten badgeCounters-Knoten', async () => {
    fb.setAt(`users/${UID}/badgeCounters`, { a: 1 });
    await badgeCounterService.clearAllCounters(UID);
    expect(fb.getAt(`users/${UID}/badgeCounters`)).toBeNull();
  });
});

// Streak

describe('updateStreakCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  const today = () => new Date(BASE).toDateString();
  const yesterdayStr = () => {
    const d = new Date(BASE);
    d.setDate(d.getDate() - 1);
    return d.toDateString();
  };

  it('erste Aktivität → Streak 1, lastActivityDate = heute', async () => {
    await badgeCounterService.updateStreakCounter(UID);
    expect(fb.getAt(counterPath('currentStreak'))).toBe(1);
    expect(fb.getAt(counterPath('lastActivityDate'))).toBe(today());
  });

  it('bereits heute aktiv → Streak bleibt unverändert', async () => {
    fb.setAt(counterPath('lastActivityDate'), today());
    fb.setAt(counterPath('currentStreak'), 5);
    await badgeCounterService.updateStreakCounter(UID);
    expect(fb.getAt(counterPath('currentStreak'))).toBe(5);
  });

  it('gestern aktiv → Streak +1', async () => {
    fb.setAt(counterPath('lastActivityDate'), yesterdayStr());
    fb.setAt(counterPath('currentStreak'), 5);
    await badgeCounterService.updateStreakCounter(UID);
    expect(fb.getAt(counterPath('currentStreak'))).toBe(6);
    expect(fb.getAt(counterPath('lastActivityDate'))).toBe(today());
  });

  it('Lücke (vorletzter Tag) → Streak-Reset auf 1', async () => {
    const older = new Date(BASE);
    older.setDate(older.getDate() - 3);
    fb.setAt(counterPath('lastActivityDate'), older.toDateString());
    fb.setAt(counterPath('currentStreak'), 10);
    await badgeCounterService.updateStreakCounter(UID);
    expect(fb.getAt(counterPath('currentStreak'))).toBe(1);
  });
});

// Binge-Windows

describe('recordBingeEpisode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  it('startet für alle Zeitfenster eine Session mit count 1 und windowEnd', async () => {
    await badgeCounterService.recordBingeEpisode(UID);
    const w10 = fb.getAt(`users/${UID}/badgeCounters/bingeWindows/10hours`) as {
      count: number;
      windowEnd: number;
      startTime: number;
    };
    expect(w10.count).toBe(1);
    expect(w10.windowEnd).toBe(BASE + 10 * 60 * 60 * 1000);
    expect(w10.startTime).toBe(BASE);
    expect(fb.getAt(`users/${UID}/badgeCounters/bingeWindows/1day`)).toMatchObject({ count: 1 });
    expect(fb.getAt(`users/${UID}/badgeCounters/bingeWindows/2days`)).toMatchObject({ count: 1 });
  });

  it('laufende Session: count wird erhöht, windowEnd bleibt', async () => {
    await badgeCounterService.recordBingeEpisode(UID);
    await badgeCounterService.recordBingeEpisode(UID);
    const w10 = fb.getAt(`users/${UID}/badgeCounters/bingeWindows/10hours`) as {
      count: number;
      windowEnd: number;
    };
    expect(w10.count).toBe(2);
    expect(w10.windowEnd).toBe(BASE + 10 * 60 * 60 * 1000);
  });

  it('abgelaufene Session wird beendet und neu gestartet (count zurück auf 1)', async () => {
    await badgeCounterService.recordBingeEpisode(UID);
    // Zeit über das 10h-Fenster hinaus schieben
    vi.setSystemTime(BASE + 11 * 60 * 60 * 1000);
    await badgeCounterService.recordBingeEpisode(UID);
    const w10 = fb.getAt(`users/${UID}/badgeCounters/bingeWindows/10hours`) as { count: number };
    expect(w10.count).toBe(1);
    // 1day-Fenster läuft noch → count 2
    const w1d = fb.getAt(`users/${UID}/badgeCounters/bingeWindows/1day`) as { count: number };
    expect(w1d.count).toBe(2);
  });
});

describe('finalizeBingeSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  it('entfernt abgelaufene Sessions, lässt laufende bestehen', async () => {
    fb.setAt(`users/${UID}/badgeCounters/bingeWindows/10hours`, {
      count: 3,
      windowEnd: BASE - 1,
    });
    fb.setAt(`users/${UID}/badgeCounters/bingeWindows/1day`, {
      count: 4,
      windowEnd: BASE + 10_000,
    });
    await badgeCounterService.finalizeBingeSession(UID);
    expect(fb.getAt(`users/${UID}/badgeCounters/bingeWindows/10hours`)).toBeNull();
    expect(fb.getAt(`users/${UID}/badgeCounters/bingeWindows/1day`)).toMatchObject({ count: 4 });
  });
});

// Marathon

describe('Marathon-Counter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  it('recordMarathonEpisode erhöht die aktuelle Woche um 1', async () => {
    await badgeCounterService.recordMarathonEpisode(UID);
    await badgeCounterService.recordMarathonEpisode(UID);
    const weeks = fb.getAt(`users/${UID}/badgeCounters/marathonWeeks`) as Record<string, number>;
    const total = Object.values(weeks).reduce((a, b) => a + b, 0);
    expect(total).toBe(2);
  });

  it('recordMarathonProgress (Legacy) addiert episodeCount', async () => {
    await badgeCounterService.recordMarathonProgress(UID, 5);
    const weeks = fb.getAt(`users/${UID}/badgeCounters/marathonWeeks`) as Record<string, number>;
    expect(Object.values(weeks)[0]).toBe(5);
  });

  it('getMarathonStats liefert aktuelle + beste Woche', async () => {
    await badgeCounterService.recordMarathonProgress(UID, 3);
    // Fremde (bessere) Woche direkt injizieren
    fb.setAt(`users/${UID}/badgeCounters/marathonWeeks/2020-W1`, 40);
    const stats = await badgeCounterService.getMarathonStats(UID);
    expect(stats.currentWeekEpisodes).toBe(3);
    expect(stats.bestWeekEpisodes).toBe(40);
    expect(stats.timeRemainingInWeek).toBeGreaterThanOrEqual(0);
    expect(stats.currentWeekKey).toMatch(/^\d{4}-W\d+$/);
  });

  it('getMarathonStats ohne Daten → Nullwerte', async () => {
    const stats = await badgeCounterService.getMarathonStats(UID);
    expect(stats.currentWeekEpisodes).toBe(0);
    expect(stats.bestWeekEpisodes).toBe(0);
  });

  it('ensureCurrentMarathonWeek legt die aktuelle Woche mit 0 an, wenn sie fehlt', async () => {
    await badgeCounterService.ensureCurrentMarathonWeek(UID);
    const weeks = fb.getAt(`users/${UID}/badgeCounters/marathonWeeks`) as Record<string, number>;
    const keys = Object.keys(weeks);
    expect(keys).toHaveLength(1);
    expect(weeks[keys[0]]).toBe(0);
  });

  it('ensureCurrentMarathonWeek überschreibt eine bestehende Woche nicht', async () => {
    await badgeCounterService.recordMarathonProgress(UID, 7);
    await badgeCounterService.ensureCurrentMarathonWeek(UID);
    const weeks = fb.getAt(`users/${UID}/badgeCounters/marathonWeeks`) as Record<string, number>;
    expect(Object.values(weeks)[0]).toBe(7);
  });
});
