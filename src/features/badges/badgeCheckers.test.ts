import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Firebase-Mock: verschachtelter In-Memory-Baum. Pfade werden an '/' zerlegt;
// Parent-Reads aggregieren Children automatisch. Nur checkSocialBadgeFromCounters
// braucht Firebase (friends-Node) — der Rest der Datei ist pure Logik.
// ---------------------------------------------------------------------------
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

import type { Badge } from './badgeDefinitions';
import type {
  BadgeCounters,
  BadgeMovieItem,
  BadgeSeason,
  BadgeSeriesItem,
  BadgeUserData,
} from './badgeTypes';
import {
  checkBadgeRequirement,
  checkBingeBadgeFromSeries,
  checkCollectorBadge,
  checkExplorerBadge,
  checkMarathonBadgeFromSeries,
  checkQuickwatchBadgeFromCounters,
  checkRewatchBadgeFromSeries,
  checkSeasonBadgeFromRealData,
  checkSocialBadgeFromCounters,
  checkStreakBadgeFromCounters,
  getCounterValue,
  getSeasonCompletionTime,
  getTimeframeDescription,
  getTimeWindowMs,
  hasValidRating,
  isSeasonCompleted,
} from './badgeCheckers';

// ---------- Fixtures ----------

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

function season(over: Partial<BadgeSeason> = {}): BadgeSeason {
  return { seasonNumber: 0, episodes: [], ...over };
}

const BASE = new Date('2026-07-04T12:00:00Z').getTime();

// ---------- hasValidRating ----------

describe('hasValidRating', () => {
  it('Zahl > 0 ist gültig, <= 0 nicht', () => {
    expect(hasValidRating(8)).toBe(true);
    expect(hasValidRating(0.5)).toBe(true);
    expect(hasValidRating(0)).toBe(false);
    expect(hasValidRating(-3)).toBe(false);
  });

  it('Map: gültig sobald irgendein Wert > 0 ist', () => {
    expect(hasValidRating({ a: 0, b: 7 })).toBe(true);
    expect(hasValidRating({ a: 5 })).toBe(true);
  });

  it('Map mit ausschließlich <= 0 ist nicht gültig', () => {
    expect(hasValidRating({ a: 0, b: -1 })).toBe(false);
  });

  it('leere Map ist nicht gültig', () => {
    expect(hasValidRating({})).toBe(false);
  });

  it('nicht-numerische Map-Werte werden ignoriert', () => {
    expect(hasValidRating({ a: 'x' as unknown as number })).toBe(false);
  });
});

// ---------- checkExplorerBadge ----------

describe('checkExplorerBadge', () => {
  const series = (n: number): BadgeSeriesItem[] => Array.from({ length: n }, () => ({}));

  it('erreicht ab Schwelle (>=)', () => {
    const r = checkExplorerBadge(makeBadge({ requirements: { series: 3 } }), series(3));
    expect(r).toEqual({ earned: true, details: '3 verschiedene Serien entdeckt' });
  });

  it('unter Schwelle → null', () => {
    expect(checkExplorerBadge(makeBadge({ requirements: { series: 3 } }), series(2))).toBeNull();
  });

  it('fehlende series-Requirement zählt als 0 → immer erreicht', () => {
    const r = checkExplorerBadge(makeBadge({ requirements: {} }), series(0));
    expect(r?.earned).toBe(true);
  });
});

// ---------- checkCollectorBadge ----------

describe('checkCollectorBadge', () => {
  it('zählt gültige Ratings aus Serien UND Filmen', () => {
    const series: BadgeSeriesItem[] = [{ rating: 8 }, { rating: 0 }, { rating: { u: 5 } }];
    const movies: BadgeMovieItem[] = [{ rating: 9 }, { rating: -1 }];
    // gültig: series[0], series[2], movies[0] = 3
    const r = checkCollectorBadge(makeBadge({ requirements: { ratings: 3 } }), series, movies);
    expect(r).toEqual({ earned: true, details: '3 Bewertungen abgegeben' });
  });

  it('unter Schwelle → null', () => {
    const r = checkCollectorBadge(makeBadge({ requirements: { ratings: 5 } }), [{ rating: 8 }], []);
    expect(r).toBeNull();
  });

  it('Einträge ohne rating werden nicht gezählt', () => {
    const r = checkCollectorBadge(makeBadge({ requirements: { ratings: 1 } }), [{}], [{}]);
    expect(r).toBeNull();
  });
});

// ---------- checkSocialBadgeFromCounters (Firebase) ----------

describe('checkSocialBadgeFromCounters', () => {
  const empty: BadgeCounters = {};
  beforeEach(() => fb.reset());

  it('erreicht ab Freundes-Schwelle', async () => {
    fb.setAt('users/u1/friends', { a: true, b: true, c: true });
    const r = await checkSocialBadgeFromCounters(
      makeBadge({ requirements: { friends: 3 } }),
      'u1',
      empty,
      [],
      []
    );
    expect(r).toEqual({ earned: true, details: '3 Freunde hinzugefügt' });
  });

  it('unter Schwelle → null', async () => {
    fb.setAt('users/u1/friends', { a: true });
    const r = await checkSocialBadgeFromCounters(
      makeBadge({ requirements: { friends: 3 } }),
      'u1',
      empty,
      [],
      []
    );
    expect(r).toBeNull();
  });

  it('keine friends-Node → 0 Freunde', async () => {
    const r = await checkSocialBadgeFromCounters(
      makeBadge({ requirements: { friends: 1 } }),
      'u1',
      empty,
      [],
      []
    );
    expect(r).toBeNull();
  });
});

// ---------- getTimeframeDescription ----------

describe('getTimeframeDescription', () => {
  it('bekannte Zeitfenster', () => {
    expect(getTimeframeDescription('10hours')).toBe('10 Stunden');
    expect(getTimeframeDescription('1day')).toBe('einem Tag');
    expect(getTimeframeDescription('2days')).toBe('zwei Tagen');
  });

  it('unbekannt → Default "einer Session"', () => {
    expect(getTimeframeDescription('1week')).toBe('einer Session');
    expect(getTimeframeDescription('')).toBe('einer Session');
  });
});

// ---------- getTimeWindowMs ----------

describe('getTimeWindowMs', () => {
  it('mappt bekannte Zeitfenster auf Millisekunden', () => {
    expect(getTimeWindowMs('10hours')).toBe(10 * 60 * 60 * 1000);
    expect(getTimeWindowMs('1day')).toBe(24 * 60 * 60 * 1000);
    expect(getTimeWindowMs('2days')).toBe(2 * 24 * 60 * 60 * 1000);
    expect(getTimeWindowMs('1week')).toBe(7 * 24 * 60 * 60 * 1000);
    expect(getTimeWindowMs('1month')).toBe(30 * 24 * 60 * 60 * 1000);
    expect(getTimeWindowMs('1year')).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it('undefined/unbekannt → null', () => {
    expect(getTimeWindowMs(undefined)).toBeNull();
    expect(getTimeWindowMs('nope')).toBeNull();
  });
});

// ---------- isSeasonCompleted ----------

describe('isSeasonCompleted', () => {
  it('alle Episoden watched=true → completed', () => {
    expect(isSeasonCompleted(season({ episodes: [{ watched: true }, { watched: true }] }))).toBe(
      true
    );
  });

  it('eine ungesehene Episode → nicht completed', () => {
    expect(isSeasonCompleted(season({ episodes: [{ watched: true }, { watched: false }] }))).toBe(
      false
    );
  });

  it('leeres episodes-Array → completed (every auf leerer Liste ist true)', () => {
    expect(isSeasonCompleted(season({ episodes: [] }))).toBe(true);
  });

  it('kein Array → nicht completed', () => {
    expect(isSeasonCompleted({ seasonNumber: 0 } as unknown as BadgeSeason)).toBe(false);
  });
});

// ---------- getSeasonCompletionTime ----------

describe('getSeasonCompletionTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  it('liefert den spätesten watchedAt-Zeitpunkt', () => {
    const s = season({
      episodes: [
        { watched: true, watchedAt: 1000 },
        { watched: true, watchedAt: 5000 },
        { watched: true, watchedAt: 3000 },
      ],
    });
    expect(getSeasonCompletionTime(s)).toBe(5000);
  });

  it('kein watchedAt vorhanden → Fallback Date.now()', () => {
    const s = season({ episodes: [{ watched: true }] });
    expect(getSeasonCompletionTime(s)).toBe(BASE);
  });

  it('kein Array → null', () => {
    expect(getSeasonCompletionTime({ seasonNumber: 0 } as unknown as BadgeSeason)).toBeNull();
  });
});

// ---------- checkSeasonBadgeFromRealData ----------

describe('checkSeasonBadgeFromRealData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  const completedRecent = (): BadgeSeriesItem => ({
    seasons: [season({ episodes: [{ watched: true, watchedAt: BASE - 1000 }] })],
  });

  it('zählt komplett gesehene Staffeln im Zeitfenster', () => {
    const r = checkSeasonBadgeFromRealData(
      makeBadge({ requirements: { seasons: 2, timeframe: '1day' } }),
      [completedRecent(), completedRecent()]
    );
    expect(r?.earned).toBe(true);
    expect(r?.details).toContain('2 Staffeln');
  });

  it('Singular "Staffel" bei genau einer', () => {
    const r = checkSeasonBadgeFromRealData(
      makeBadge({ requirements: { seasons: 1, timeframe: '1day' } }),
      [completedRecent()]
    );
    expect(r?.details).toContain('1 Staffel in');
    expect(r?.details).not.toContain('Staffeln');
  });

  it('Abschluss außerhalb des Zeitfensters zählt nicht', () => {
    const old: BadgeSeriesItem = {
      seasons: [
        season({ episodes: [{ watched: true, watchedAt: BASE - 2 * 24 * 60 * 60 * 1000 }] }),
      ],
    };
    const r = checkSeasonBadgeFromRealData(
      makeBadge({ requirements: { seasons: 1, timeframe: '1day' } }),
      [old]
    );
    expect(r).toBeNull();
  });

  it('ohne timeframe → null', () => {
    expect(
      checkSeasonBadgeFromRealData(makeBadge({ requirements: { seasons: 1 } }), [completedRecent()])
    ).toBeNull();
  });

  it('unvollständige Staffel wird nicht gezählt', () => {
    const incomplete: BadgeSeriesItem = {
      seasons: [season({ episodes: [{ watched: true }, { watched: false }] })],
    };
    const r = checkSeasonBadgeFromRealData(
      makeBadge({ requirements: { seasons: 1, timeframe: '1day' } }),
      [incomplete]
    );
    expect(r).toBeNull();
  });
});

// ---------- getCounterValue ----------

describe('getCounterValue', () => {
  const data = (counters: BadgeCounters): BadgeUserData => ({
    series: [],
    movies: [],
    activities: [],
    badgeCounters: counters,
  });

  it('liest numerischen Counter', () => {
    expect(getCounterValue(data({ maxBingeEpisodes: 12 }), 'maxBingeEpisodes')).toBe(12);
  });

  it('fehlender/nicht-numerischer Counter → 0', () => {
    expect(getCounterValue(data({}), 'maxBingeEpisodes')).toBe(0);
    expect(getCounterValue(data({ x: 'y' }), 'x')).toBe(0);
  });

  it('null cachedData → 0', () => {
    expect(getCounterValue(null, 'x')).toBe(0);
  });
});

// ---------- checkBingeBadgeFromSeries ----------

describe('checkBingeBadgeFromSeries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });
  afterEach(() => vi.useRealTimers());

  const cache = (counters: BadgeCounters): BadgeUserData => ({
    series: [],
    movies: [],
    activities: [],
    badgeCounters: counters,
  });

  it('timeframe-Branch: bingeWindows-count erreicht Schwelle', () => {
    const r = checkBingeBadgeFromSeries(
      makeBadge({ requirements: { episodes: 3, timeframe: '10hours' } }),
      [],
      [],
      cache({ bingeWindows: { '10hours': { count: 4 } } })
    );
    expect(r?.earned).toBe(true);
    expect(r?.details).toBe('4 Episoden in 10 Stunden');
  });

  it('timeframe-Branch: unter Schwelle → null', () => {
    const r = checkBingeBadgeFromSeries(
      makeBadge({ requirements: { episodes: 5, timeframe: '10hours' } }),
      [],
      [],
      cache({ bingeWindows: { '10hours': { count: 2 } } })
    );
    expect(r).toBeNull();
  });

  it('kein-timeframe-Branch: nutzt maxBingeEpisodes-Counter', () => {
    const r = checkBingeBadgeFromSeries(
      makeBadge({ requirements: { episodes: 10 } }),
      [],
      [],
      cache({ maxBingeEpisodes: 15 })
    );
    expect(r).toEqual({ earned: true, details: '15 Episoden in einer Binge-Session' });
  });

  it('seasons-Branch delegiert an checkSeasonBadgeFromRealData', () => {
    const s: BadgeSeriesItem = {
      seasons: [season({ episodes: [{ watched: true, watchedAt: BASE }] })],
    };
    const r = checkBingeBadgeFromSeries(
      makeBadge({ requirements: { seasons: 1, timeframe: '1day' } }),
      [s],
      [],
      cache({})
    );
    expect(r?.earned).toBe(true);
  });

  it('keine passenden Requirements → null', () => {
    expect(
      checkBingeBadgeFromSeries(makeBadge({ requirements: {} }), [], [], cache({}))
    ).toBeNull();
  });
});

// ---------- checkMarathonBadgeFromSeries ----------

describe('checkMarathonBadgeFromSeries', () => {
  const cache = (marathonWeeks: Record<string, number>): BadgeUserData => ({
    series: [],
    movies: [],
    activities: [],
    badgeCounters: { marathonWeeks },
  });

  it('nimmt die beste Woche und erreicht die Schwelle', () => {
    const r = checkMarathonBadgeFromSeries(
      makeBadge({ requirements: { episodes: 15 } }),
      [],
      [],
      cache({ '2026-W10': 12, '2026-W11': 20 })
    );
    expect(r?.earned).toBe(true);
    expect(r?.details).toBe('20 Episoden in einer Woche (2026-W11)');
  });

  it('beste Woche unter Schwelle → null', () => {
    const r = checkMarathonBadgeFromSeries(
      makeBadge({ requirements: { episodes: 25 } }),
      [],
      [],
      cache({ '2026-W11': 20 })
    );
    expect(r).toBeNull();
  });

  it('keine marathonWeeks → null', () => {
    const r = checkMarathonBadgeFromSeries(makeBadge({ requirements: { episodes: 1 } }), [], [], {
      series: [],
      movies: [],
      activities: [],
      badgeCounters: {},
    });
    expect(r).toBeNull();
  });
});

// ---------- checkStreakBadgeFromCounters ----------

describe('checkStreakBadgeFromCounters', () => {
  it('currentStreak >= days → erreicht', () => {
    const r = checkStreakBadgeFromCounters(makeBadge({ requirements: { days: 7 } }), {
      currentStreak: 7,
    });
    expect(r).toEqual({ earned: true, details: '7 Tage Streak' });
  });

  it('unter Schwelle → null', () => {
    expect(
      checkStreakBadgeFromCounters(makeBadge({ requirements: { days: 7 } }), { currentStreak: 6 })
    ).toBeNull();
  });

  it('fehlender Streak zählt als 0', () => {
    expect(checkStreakBadgeFromCounters(makeBadge({ requirements: { days: 1 } }), {})).toBeNull();
  });
});

// ---------- checkQuickwatchBadgeFromCounters ----------

describe('checkQuickwatchBadgeFromCounters', () => {
  it('quickwatchEpisodes >= episodes → erreicht', () => {
    const r = checkQuickwatchBadgeFromCounters(makeBadge({ requirements: { episodes: 3 } }), {
      quickwatchEpisodes: 5,
    });
    expect(r).toEqual({ earned: true, details: '5 Quickwatch Episoden' });
  });

  it('unter Schwelle → null', () => {
    expect(
      checkQuickwatchBadgeFromCounters(makeBadge({ requirements: { episodes: 3 } }), {
        quickwatchEpisodes: 2,
      })
    ).toBeNull();
  });
});

// ---------- checkRewatchBadgeFromSeries ----------

describe('checkRewatchBadgeFromSeries', () => {
  it('summiert (watchCount - 1) über gesehene Episoden', () => {
    const series: BadgeSeriesItem[] = [
      {
        seasons: [
          season({
            episodes: [
              { watched: true, watchCount: 3 }, // +2
              { watched: true, watchCount: 2 }, // +1
              { watched: true, watchCount: 1 }, // +0
              { watched: false, watchCount: 5 }, // ignoriert (nicht watched)
            ],
          }),
        ],
      },
    ];
    const r = checkRewatchBadgeFromSeries(makeBadge({ requirements: { episodes: 3 } }), series);
    expect(r).toEqual({ earned: true, details: '3 Rewatch Episoden' });
  });

  it('unter Schwelle → null', () => {
    const series: BadgeSeriesItem[] = [
      { seasons: [season({ episodes: [{ watched: true, watchCount: 2 }] })] },
    ];
    expect(
      checkRewatchBadgeFromSeries(makeBadge({ requirements: { episodes: 5 } }), series)
    ).toBeNull();
  });

  it('keine Seasons → null', () => {
    expect(
      checkRewatchBadgeFromSeries(makeBadge({ requirements: { episodes: 1 } }), [{}])
    ).toBeNull();
  });
});

// ---------- checkBadgeRequirement (Dispatch) ----------

describe('checkBadgeRequirement', () => {
  beforeEach(() => fb.reset());

  const userData = (over: Partial<BadgeUserData> = {}): BadgeUserData => ({
    series: [],
    movies: [],
    activities: [],
    badgeCounters: {},
    ...over,
  });

  it('series_explorer → checkExplorerBadge', () => {
    const r = checkBadgeRequirement(
      makeBadge({ category: 'series_explorer', requirements: { series: 1 } }),
      userData({ series: [{}] }),
      'u1',
      null
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('collector → checkCollectorBadge', () => {
    const r = checkBadgeRequirement(
      makeBadge({ category: 'collector', requirements: { ratings: 1 } }),
      userData({ series: [{ rating: 8 }] }),
      'u1',
      null
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('social → async Firebase-Check', async () => {
    fb.setAt('users/u1/friends', { a: true });
    const r = await checkBadgeRequirement(
      makeBadge({ category: 'social', requirements: { friends: 1 } }),
      userData(),
      'u1',
      null
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('streak → checkStreakBadgeFromCounters', () => {
    const r = checkBadgeRequirement(
      makeBadge({ category: 'streak', requirements: { days: 3 } }),
      userData({ badgeCounters: { currentStreak: 3 } }),
      'u1',
      null
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('quickwatch → checkQuickwatchBadgeFromCounters', () => {
    const r = checkBadgeRequirement(
      makeBadge({ category: 'quickwatch', requirements: { episodes: 2 } }),
      userData({ badgeCounters: { quickwatchEpisodes: 2 } }),
      'u1',
      null
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('rewatch → checkRewatchBadgeFromSeries', () => {
    const r = checkBadgeRequirement(
      makeBadge({ category: 'rewatch', requirements: { episodes: 1 } }),
      userData({
        series: [{ seasons: [season({ episodes: [{ watched: true, watchCount: 2 }] })] }],
      }),
      'u1',
      null
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('binge → checkBingeBadgeFromSeries (nutzt cachedData)', () => {
    const cached: BadgeUserData = userData({ badgeCounters: { maxBingeEpisodes: 9 } });
    const r = checkBadgeRequirement(
      makeBadge({ category: 'binge', requirements: { episodes: 5 } }),
      userData(),
      'u1',
      cached
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('marathon → checkMarathonBadgeFromSeries (nutzt cachedData)', () => {
    const cached: BadgeUserData = userData({ badgeCounters: { marathonWeeks: { w: 30 } } });
    const r = checkBadgeRequirement(
      makeBadge({ category: 'marathon', requirements: { episodes: 15 } }),
      userData(),
      'u1',
      cached
    );
    expect(r).toMatchObject({ earned: true });
  });

  it('unbekannte Kategorie → null', () => {
    const r = checkBadgeRequirement(
      makeBadge({ category: 'unknown' as unknown as Badge['category'] }),
      userData(),
      'u1',
      null
    );
    expect(r).toBeNull();
  });
});
