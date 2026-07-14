import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock (nur getSocialProgress liest den friends-Node).
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
  const database = (() => ({
    ref: (p: string) => ({ once: async () => snap(getAt(p)) }),
  })) as unknown as { (): unknown; ServerValue: { TIMESTAMP: string } };
  database.ServerValue = { TIMESTAMP: '__SERVER_TS__' };
  const reset = () => {
    for (const k of Object.keys(root)) delete root[k];
  };
  return { getAt, setAt, database, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

import type { Badge } from './badgeDefinitions';
import type { BadgeCounters, BadgeSeriesItem } from './badgeTypes';
import {
  getBingeProgress,
  getCollectorProgress,
  getCurrentWeekKey,
  getExplorerProgress,
  getMarathonProgress,
  getQuickwatchProgress,
  getRewatchProgress,
  getSocialProgress,
  getStreakProgress,
  getTimeRemainingInWeek,
} from './badgeProgressHelpers';

function makeBadge(over: Partial<Badge> = {}): Badge {
  return {
    id: 'x',
    category: 'binge',
    tier: 'bronze',
    name: 'n',
    description: 'd',
    color: '#fff',
    requirements: {},
    rarity: 'common',
    ...over,
  };
}

const BASE = new Date('2026-07-04T12:00:00Z').getTime();

describe('getBingeProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  it('null ohne episodes oder ohne timeframe', () => {
    expect(getBingeProgress(makeBadge({ requirements: { timeframe: '10hours' } }), {})).toBeNull();
    expect(getBingeProgress(makeBadge({ requirements: { episodes: 3 } }), {})).toBeNull();
  });

  it('aktive Session: current=count, timeRemaining in Sekunden, sessionActive=true', () => {
    const counters: BadgeCounters = {
      bingeWindows: { '10hours': { count: 4, windowEnd: BASE + 10_000 } },
    };
    const p = getBingeProgress(
      makeBadge({ id: 'binge_bronze', requirements: { episodes: 3, timeframe: '10hours' } }),
      counters
    );
    expect(p).toMatchObject({
      badgeId: 'binge_bronze',
      current: 4,
      total: 3,
      timeRemaining: 10,
      sessionActive: true,
    });
  });

  it('abgelaufene Session: current=0, keine timeRemaining, sessionActive=false', () => {
    const counters: BadgeCounters = {
      bingeWindows: { '10hours': { count: 9, windowEnd: BASE - 1 } },
    };
    const p = getBingeProgress(
      makeBadge({ requirements: { episodes: 3, timeframe: '10hours' } }),
      counters
    );
    expect(p?.current).toBe(0);
    expect(p?.sessionActive).toBe(false);
    expect(p?.timeRemaining).toBeUndefined();
  });

  it('keine bingeWindow-Daten: current=0, sessionActive=false, total gesetzt', () => {
    const p = getBingeProgress(
      makeBadge({ requirements: { episodes: 8, timeframe: '10hours' } }),
      {}
    );
    expect(p).toMatchObject({ current: 0, total: 8, sessionActive: false });
  });
});

describe('getQuickwatchProgress', () => {
  it('null ohne episodes-Requirement', () => {
    expect(getQuickwatchProgress(makeBadge({ requirements: {} }), {})).toBeNull();
  });

  it('current = quickwatchEpisodes, fehlend → 0', () => {
    expect(
      getQuickwatchProgress(makeBadge({ requirements: { episodes: 8 } }), {
        quickwatchEpisodes: 5,
      })?.current
    ).toBe(5);
    expect(getQuickwatchProgress(makeBadge({ requirements: { episodes: 8 } }), {})?.current).toBe(
      0
    );
  });
});

describe('getMarathonProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  it('null ohne episodes-Requirement', () => {
    expect(getMarathonProgress(makeBadge({ requirements: {} }), {})).toBeNull();
  });

  it('current = Episoden der aktuellen ISO-Woche', () => {
    const weekKey = getCurrentWeekKey();
    const p = getMarathonProgress(makeBadge({ requirements: { episodes: 15 } }), {
      marathonWeeks: { [weekKey]: 12 },
    });
    expect(p?.current).toBe(12);
    expect(p?.total).toBe(15);
    expect(p?.sessionActive).toBe(true);
    expect(typeof p?.timeRemaining).toBe('number');
  });

  it('keine Episoden in aktueller Woche → current 0, sessionActive false', () => {
    const p = getMarathonProgress(makeBadge({ requirements: { episodes: 15 } }), {
      marathonWeeks: {},
    });
    expect(p?.current).toBe(0);
    expect(p?.sessionActive).toBe(false);
  });
});

// getTimeRemainingInWeek / getCurrentWeekKey

describe('getTimeRemainingInWeek', () => {
  afterEach(() => vi.useRealTimers());

  it('gibt Sekunden bis Wochenende zurück, nie negativ, <= 7 Tage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z')); // Mittwoch
    const s = getTimeRemainingInWeek();
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(7 * 24 * 60 * 60);
  });
});

describe('getCurrentWeekKey', () => {
  afterEach(() => vi.useRealTimers());

  it('Format YYYY-Wn', () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
    expect(getCurrentWeekKey()).toMatch(/^\d{4}-W\d+$/);
  });

  it('deterministisch und stabil für ein festes Datum', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T12:00:00Z'));
    const key = getCurrentWeekKey();
    expect(key).toMatch(/^2026-W\d+$/);
    // Zweiter Aufruf bei gleicher Zeit → identisch
    expect(getCurrentWeekKey()).toBe(key);
  });
});

describe('getStreakProgress', () => {
  it('null ohne days-Requirement', () => {
    expect(getStreakProgress(makeBadge({ requirements: {} }), {})).toBeNull();
  });

  it('current = currentStreak, fehlend → 0', () => {
    expect(
      getStreakProgress(makeBadge({ requirements: { days: 7 } }), { currentStreak: 4 })?.current
    ).toBe(4);
    expect(getStreakProgress(makeBadge({ requirements: { days: 7 } }), {})?.current).toBe(0);
  });
});

describe('getRewatchProgress', () => {
  it('null ohne episodes-Requirement', () => {
    expect(getRewatchProgress(makeBadge({ requirements: {} }), [])).toBeNull();
  });

  it('summiert (watchCount - 1) — auch bei watched=false (im Unterschied zum Checker)', () => {
    const series: BadgeSeriesItem[] = [
      {
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              { watched: true, watchCount: 3 }, // +2
              { watched: false, watchCount: 2 }, // +1 (watched ignoriert hier)
              { watched: true, watchCount: 1 }, // +0
            ],
          },
        ],
      },
    ];
    expect(getRewatchProgress(makeBadge({ requirements: { episodes: 5 } }), series)?.current).toBe(
      3
    );
  });

  it('keine Seasons → current 0', () => {
    expect(getRewatchProgress(makeBadge({ requirements: { episodes: 5 } }), [{}])?.current).toBe(0);
  });
});

describe('getExplorerProgress', () => {
  it('null ohne series-Requirement', () => {
    expect(getExplorerProgress(makeBadge({ requirements: {} }), [])).toBeNull();
  });

  it('current = Anzahl der Serien', () => {
    const series: BadgeSeriesItem[] = [{}, {}, {}];
    const p = getExplorerProgress(makeBadge({ requirements: { series: 50 } }), series);
    expect(p).toMatchObject({ current: 3, total: 50 });
  });
});

describe('getCollectorProgress', () => {
  it('null ohne ratings-Requirement', () => {
    expect(getCollectorProgress(makeBadge({ requirements: {} }), [], [])).toBeNull();
  });

  it('zählt gültige Ratings aus Serien und Filmen', () => {
    const p = getCollectorProgress(
      makeBadge({ requirements: { ratings: 50 } }),
      [{ rating: 8 }, { rating: 0 }, { rating: { u: 5 } }],
      [{ rating: 9 }, { rating: -2 }]
    );
    expect(p?.current).toBe(3);
    expect(p?.total).toBe(50);
  });
});

// getSocialProgress (Firebase)

describe('getSocialProgress', () => {
  beforeEach(() => fb.reset());

  it('null ohne friends-Requirement', async () => {
    await expect(getSocialProgress(makeBadge({ requirements: {} }), 'u1')).resolves.toBeNull();
  });

  it('current = Anzahl Freunde', async () => {
    fb.setAt('users/u1/friends', { a: true, b: true });
    const p = await getSocialProgress(makeBadge({ requirements: { friends: 3 } }), 'u1');
    expect(p).toMatchObject({ current: 2, total: 3 });
  });

  it('keine friends-Node → current 0', async () => {
    const p = await getSocialProgress(makeBadge({ requirements: { friends: 3 } }), 'u1');
    expect(p?.current).toBe(0);
  });
});
