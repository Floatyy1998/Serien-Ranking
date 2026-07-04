import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// In-Memory-Firebase-Mock: ein Baum + chainbare ref()/query()-Stubs.
// Unterstützt once/set/update(multi-path)/push/child/orderByChild/equalTo,
// ServerValue.TIMESTAMP + increment und onDisconnect.
// ---------------------------------------------------------------------------
const fb = vi.hoisted(() => {
  const db: Record<string, unknown> = {};
  const state = { pushCounter: 0, failOnce: new Set<string>() };

  const parts = (p: string) => (p === '' ? [] : p.split('/'));
  const getByPath = (path: string): unknown => {
    let n: unknown = db;
    for (const seg of parts(path)) {
      if (n == null || typeof n !== 'object') return undefined;
      n = (n as Record<string, unknown>)[seg];
    }
    return n;
  };
  const setByPath = (path: string, val: unknown) => {
    const segs = parts(path);
    let n = db as Record<string, unknown>;
    for (let i = 0; i < segs.length - 1; i++) {
      if (typeof n[segs[i]] !== 'object' || n[segs[i]] == null) n[segs[i]] = {};
      n = n[segs[i]] as Record<string, unknown>;
    }
    n[segs[segs.length - 1]] = val;
  };
  const removeByPath = (path: string) => {
    const segs = parts(path);
    let n = db as Record<string, unknown>;
    for (let i = 0; i < segs.length - 1; i++) {
      if (n == null) return;
      n = n[segs[i]] as Record<string, unknown>;
      if (n == null) return;
    }
    delete n[segs[segs.length - 1]];
  };

  const resolveVal = (fullPath: string, v: unknown): unknown => {
    if (v && typeof v === 'object' && '.sv' in (v as Record<string, unknown>)) {
      const sv = (v as Record<string, unknown>)['.sv'];
      if (sv === 'timestamp') return Date.now();
      if (sv && typeof sv === 'object' && 'increment' in (sv as Record<string, unknown>)) {
        const cur = getByPath(fullPath);
        return (typeof cur === 'number' ? cur : 0) + (sv as { increment: number }).increment;
      }
    }
    return v;
  };

  const snap = (val: unknown) => ({
    val: () => (val === undefined ? null : val),
    exists: () => val !== undefined && val !== null,
  });

  interface Ref {
    key?: string;
    once: (ev?: string) => Promise<ReturnType<typeof snap>>;
    set: (v: unknown) => Promise<void>;
    remove: () => Promise<void>;
    update: (map: Record<string, unknown>) => Promise<void>;
    push: (v?: unknown) => Ref;
    child: (sub: string) => Ref;
    orderByChild: (field: string) => Query;
    onDisconnect: () => { remove: () => Promise<void>; set: () => Promise<void> };
  }
  interface Query {
    equalTo: (v: unknown) => Query;
    limitToLast: (n: number) => Query;
    once: (ev?: string) => Promise<ReturnType<typeof snap>>;
  }

  const makeQuery = (
    path: string,
    field: string,
    hasFilter = false,
    filterVal?: unknown
  ): Query => ({
    equalTo: (v: unknown) => makeQuery(path, field, true, v),
    limitToLast: () => makeQuery(path, field, hasFilter, filterVal),
    once: async () => {
      const node = getByPath(path);
      if (!node || typeof node !== 'object') return snap(hasFilter ? null : node);
      let entries = Object.entries(node as Record<string, unknown>);
      if (hasFilter) {
        entries = entries.filter(
          ([, c]) =>
            c && typeof c === 'object' && (c as Record<string, unknown>)[field] === filterVal
        );
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of entries) out[k] = v;
      return snap(hasFilter && entries.length === 0 ? null : out);
    },
  });

  const makeRef = (path: string): Ref => ({
    key: parts(path).slice(-1)[0],
    once: async () => {
      if (state.failOnce.has(path)) throw new Error('firebase fail ' + path);
      return snap(getByPath(path));
    },
    set: async (v: unknown) => {
      setByPath(path, v);
    },
    remove: async () => {
      removeByPath(path);
    },
    update: async (map: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(map)) {
        const full = path === '' ? k : `${path}/${k}`;
        if (v === null) removeByPath(full);
        else setByPath(full, resolveVal(full, v));
      }
    },
    push: (v?: unknown) => {
      const key = `-push${state.pushCounter++}`;
      const childPath = path ? `${path}/${key}` : key;
      if (v !== undefined) setByPath(childPath, v);
      const r = makeRef(childPath);
      r.key = key;
      return r;
    },
    child: (sub: string) => makeRef(path ? `${path}/${sub}` : sub),
    orderByChild: (field: string) => makeQuery(path, field),
    onDisconnect: () => ({ remove: async () => {}, set: async () => {} }),
  });

  const database = (() => ({ ref: (p = '') => makeRef(p) })) as unknown as {
    (): { ref: (p?: string) => Ref };
    ServerValue: { TIMESTAMP: unknown; increment: (n: number) => unknown };
  };
  database.ServerValue = {
    TIMESTAMP: { '.sv': 'timestamp' },
    increment: (n: number) => ({ '.sv': { increment: n } }),
  };

  const firebaseDefault = {
    database,
    app: () => ({ options: { databaseURL: 'https://serien-ranking.firebaseio.com' } }),
  };

  return {
    db,
    state,
    getByPath,
    setByPath,
    firebaseDefault,
    reset: () => {
      for (const k of Object.keys(db)) delete db[k];
      state.pushCounter = 0;
      state.failOnce.clear();
    },
  };
});

vi.mock('firebase/compat/app', () => ({ default: fb.firebaseDefault }));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../lib/firebase/userDisplayData', () => ({
  fetchPublicUserFields: vi.fn(async (uid: string) => ({
    username: `user_${uid}`,
    displayName: `Name ${uid}`,
    photoURL: null,
  })),
}));

import { fetchPublicUserFields } from '../lib/firebase/userDisplayData';
import {
  checkAndArchiveMonth,
  fetchGlobalLeaderboard,
  fetchLeaderboardData,
  fetchLeaderboardProfiles,
  fetchTrophyHistory,
  forceRebuildArchive,
  seedLeaderboardStats,
  updateLeaderboardStats,
} from './leaderboardService';

// Fixe Systemzeit: 2026-07-04 12:00 lokal → currentMonth '2026-07', today '2026-07-04'.
beforeEach(() => {
  fb.reset();
  vi.mocked(fetchPublicUserFields).mockClear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const seedProfile = (uid: string, displayName: string, username = '', photoURL = '') => {
  fb.setByPath(`users/${uid}/displayName`, displayName);
  if (username) fb.setByPath(`users/${uid}/username`, username);
  if (photoURL) fb.setByPath(`users/${uid}/photoURL`, photoURL);
};

describe('updateLeaderboardStats', () => {
  it('legt für einen neuen User Default-Stats an und startet die Streak bei 1', async () => {
    seedProfile('u1', 'Alice', 'alice', 'p.png');
    await updateLeaderboardStats('u1', {
      episodesWatched: 5,
      moviesWatched: 2,
      watchtimeMinutes: 100,
    });

    const stats = fb.getByPath('users/u1/leaderboard/stats') as Record<string, unknown>;
    expect(stats.episodesThisMonth).toBe(5);
    expect(stats.moviesThisMonth).toBe(2);
    expect(stats.watchtimeThisMonth).toBe(100);
    expect(stats.monthKey).toBe('2026-07');
    expect(stats.streakCurrent).toBe(1);
    expect(stats.streakThisMonth).toBe(1);
    expect(stats.streakAllTime).toBe(1);
    expect(stats.lastStreakDate).toBe('2026-07-04');

    const publicEntry = fb.getByPath('leaderboardStats/u1') as Record<string, unknown>;
    expect(publicEntry.displayName).toBe('Alice');
    expect(publicEntry.username).toBe('alice');
    expect(publicEntry.photoURL).toBe('p.png');

    // Kein Monatswechsel → keine History
    expect(fb.getByPath('users/u1/leaderboard/history')).toBeUndefined();
  });

  it('rollt bei Monatswechsel: schreibt History + Archiv und resettet die Monatszähler', async () => {
    seedProfile('u1', 'Alice', 'alice');
    fb.setByPath('users/u1/leaderboard/stats', {
      monthKey: '2026-06',
      episodesThisMonth: 3,
      moviesThisMonth: 1,
      watchtimeThisMonth: 50,
      streakThisMonth: 2,
      streakAllTime: 5,
      streakCurrent: 5,
      lastStreakDate: '2026-06-30',
      lastUpdated: 0,
    });

    await updateLeaderboardStats('u1', { watchtimeMinutes: 10 });

    const hist = fb.getByPath('users/u1/leaderboard/history/2026-06') as Record<string, unknown>;
    expect(hist).toMatchObject({ watchtimeThisMonth: 50, episodesThisMonth: 3, streakAllTime: 5 });

    const archive = fb.getByPath('leaderboardArchive/2026-06/u1') as Record<string, unknown>;
    expect(archive).toMatchObject({ watchtimeThisMonth: 50, displayName: 'Alice' });

    const stats = fb.getByPath('users/u1/leaderboard/stats') as Record<string, unknown>;
    expect(stats.monthKey).toBe('2026-07');
    expect(stats.watchtimeThisMonth).toBe(10); // reset + neuer Wert
    expect(stats.episodesThisMonth).toBe(0);
    expect(stats.streakCurrent).toBe(1); // Lücke → reset
    expect(stats.streakAllTime).toBe(5); // bleibt
  });

  it('setzt die Streak fort, wenn der letzte Streak-Tag gestern war', async () => {
    seedProfile('u1', 'Alice');
    fb.setByPath('users/u1/leaderboard/stats', {
      monthKey: '2026-07',
      episodesThisMonth: 0,
      moviesThisMonth: 0,
      watchtimeThisMonth: 0,
      streakThisMonth: 3,
      streakAllTime: 4,
      streakCurrent: 4,
      lastStreakDate: '2026-07-03',
      lastUpdated: 0,
    });

    await updateLeaderboardStats('u1', { episodesWatched: 1 });

    const stats = fb.getByPath('users/u1/leaderboard/stats') as Record<string, unknown>;
    expect(stats.streakCurrent).toBe(5);
    expect(stats.streakThisMonth).toBe(4); // min(5, dayOfMonth 4)
    expect(stats.streakAllTime).toBe(5);
  });

  it('lässt die Streak unverändert, wenn heute schon gezählt wurde', async () => {
    seedProfile('u1', 'Alice');
    fb.setByPath('users/u1/leaderboard/stats', {
      monthKey: '2026-07',
      episodesThisMonth: 1,
      moviesThisMonth: 0,
      watchtimeThisMonth: 5,
      streakThisMonth: 3,
      streakAllTime: 7,
      streakCurrent: 3,
      lastStreakDate: '2026-07-04',
      lastUpdated: 0,
    });

    await updateLeaderboardStats('u1', { episodesWatched: 1 });

    const stats = fb.getByPath('users/u1/leaderboard/stats') as Record<string, unknown>;
    expect(stats.streakCurrent).toBe(3);
    expect(stats.episodesThisMonth).toBe(2);
  });

  it('fängt Firebase-Fehler ab (kein throw, console.error)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fb.state.failOnce.add('users/u1/leaderboard/stats');
    await expect(updateLeaderboardStats('u1', { episodesWatched: 1 })).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('seedLeaderboardStats', () => {
  it('kopiert Stats mit aktivem Monat + Aktivität in den öffentlichen Knoten', async () => {
    fb.setByPath('users/u2/leaderboard/stats', {
      monthKey: '2026-07',
      watchtimeThisMonth: 20,
      episodesThisMonth: 1,
      moviesThisMonth: 0,
    });

    await seedLeaderboardStats('u2', []);

    const pub = fb.getByPath('leaderboardStats/u2') as Record<string, unknown>;
    expect(pub).toBeTruthy();
    expect(pub.displayName).toBe('Name u2');
    expect(pub.username).toBe('user_u2');
  });

  it('überspringt User, deren öffentlicher Eintrag schon den aktuellen Monat hat', async () => {
    fb.setByPath('leaderboardStats/u2', { monthKey: '2026-07', marker: 1 });
    fb.setByPath('users/u2/leaderboard/stats', {
      monthKey: '2026-07',
      watchtimeThisMonth: 20,
    });

    await seedLeaderboardStats('u2', []);

    const pub = fb.getByPath('leaderboardStats/u2') as Record<string, unknown>;
    expect(pub.marker).toBe(1); // nicht überschrieben
  });

  it('überspringt User ohne Monatsaktivität', async () => {
    fb.setByPath('users/u2/leaderboard/stats', {
      monthKey: '2026-07',
      watchtimeThisMonth: 0,
      episodesThisMonth: 0,
      moviesThisMonth: 0,
    });

    await seedLeaderboardStats('u2', []);
    expect(fb.getByPath('leaderboardStats/u2')).toBeUndefined();
  });
});

describe('fetchLeaderboardData', () => {
  it('liefert Stats des aktuellen Monats direkt, nullt veraltete Monate und defaultet fehlende User', async () => {
    fb.setByPath('users/a/leaderboard/stats', {
      monthKey: '2026-07',
      episodesThisMonth: 5,
      moviesThisMonth: 1,
      watchtimeThisMonth: 30,
      streakThisMonth: 2,
      streakAllTime: 9,
      streakCurrent: 2,
      lastStreakDate: '2026-07-04',
      lastUpdated: 1,
    });
    fb.setByPath('users/b/leaderboard/stats', {
      monthKey: '2026-05',
      episodesThisMonth: 99,
      moviesThisMonth: 9,
      watchtimeThisMonth: 999,
      streakThisMonth: 5,
      streakAllTime: 12,
      streakCurrent: 0,
      lastStreakDate: '2026-05-31',
      lastUpdated: 2,
    });

    const map = await fetchLeaderboardData('a', ['b', 'c']);

    expect(map.a.watchtimeThisMonth).toBe(30);
    // veralteter Monat → Monatswerte genullt, streakAllTime bleibt
    expect(map.b.watchtimeThisMonth).toBe(0);
    expect(map.b.episodesThisMonth).toBe(0);
    expect(map.b.monthKey).toBe('2026-07');
    expect(map.b.streakAllTime).toBe(12);
    // fehlender User → Default
    expect(map.c.watchtimeThisMonth).toBe(0);
    expect(map.c.monthKey).toBe('2026-07');
  });
});

describe('fetchLeaderboardProfiles', () => {
  it('baut eine uid→Profil-Map über fetchPublicUserFields', async () => {
    const map = await fetchLeaderboardProfiles(['x', 'y']);
    expect(map.x.displayName).toBe('Name x');
    expect(map.y.username).toBe('user_y');
    expect(fetchPublicUserFields).toHaveBeenCalledTimes(2);
  });
});

describe('fetchGlobalLeaderboard', () => {
  it('filtert auf den aktuellen Monat, überspringt inaktive und backfillt frische Profile', async () => {
    fb.setByPath('leaderboardStats/u1', {
      monthKey: '2026-07',
      watchtimeThisMonth: 100,
      episodesThisMonth: 5,
      moviesThisMonth: 1,
      streakThisMonth: 3,
      streakAllTime: 10,
      displayName: 'Old',
      username: 'u1old',
      photoURL: 'old.png',
      lastUpdated: 123,
    });
    // inaktiv → raus
    fb.setByPath('leaderboardStats/u2', {
      monthKey: '2026-07',
      watchtimeThisMonth: 0,
      episodesThisMonth: 0,
      moviesThisMonth: 0,
    });
    // anderer Monat → vom equalTo-Query gefiltert
    fb.setByPath('leaderboardStats/u3', {
      monthKey: '2026-05',
      watchtimeThisMonth: 500,
    });
    // frische Profil-Subnodes für Backfill
    fb.setByPath('users/u1/username', 'freshname');
    fb.setByPath('users/u1/photoURL', 'fresh.png');

    const entries = await fetchGlobalLeaderboard();

    expect(entries).toHaveLength(1);
    expect(entries[0].uid).toBe('u1');
    expect(entries[0].watchtimeThisMonth).toBe(100);
    // fetchProfileSubnode: displayName = toDisplayName(username, displayName) → 'freshname'
    expect(entries[0].displayName).toBe('freshname');
    expect(entries[0].photoURL).toBe('fresh.png');
  });

  it('liefert [] wenn kein Eintrag existiert', async () => {
    await expect(fetchGlobalLeaderboard()).resolves.toEqual([]);
  });
});

describe('checkAndArchiveMonth', () => {
  it('archiviert nur Monate mit Daten und benachrichtigt die Gewinner des Vormonats', async () => {
    // Nur der Vormonat (2026-06) hat Archiv-Einträge → nur er wird verarbeitet.
    fb.setByPath('leaderboardArchive/2026-06', {
      u1: { watchtimeThisMonth: 100, displayName: 'Alice', username: 'alice', photoURL: 'a.png' },
      u2: { watchtimeThisMonth: 50, displayName: 'Bob' },
    });

    await checkAndArchiveMonth();

    const trophy = fb.getByPath('leaderboardTrophies/2026-06') as Record<string, unknown>;
    expect(trophy.archived).toBe(true);
    expect(trophy.category).toBe('watchtimeThisMonth');
    expect((trophy.first as Record<string, unknown>).uid).toBe('u1');
    expect((trophy.first as Record<string, unknown>).score).toBe(100);
    expect((trophy.second as Record<string, unknown>).uid).toBe('u2');
    expect(trophy.third).toBeNull();

    // Notifications an beide Gewinner (Vormonat = pastMonths[0])
    const u1Notes = fb.getByPath('users/u1/notifications') as Record<string, unknown>;
    const firstNote = Object.values(u1Notes)[0] as Record<string, unknown>;
    expect(firstNote.type).toBe('trophy_won');
    expect(fb.getByPath('users/u2/notifications')).toBeTruthy();
  });

  it('tut nichts, wenn alle Monate bereits archiviert sind', async () => {
    // leaderboardTrophies für alle 12 Vormonate vorbelegen (truthy)
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      fb.setByPath(`leaderboardTrophies/${key}`, { archived: true });
    }
    fb.setByPath('leaderboardArchive/2026-06', { u1: { watchtimeThisMonth: 100 } });

    await checkAndArchiveMonth();
    // 2026-06 bleibt der Platzhalter, keine Gewinner-Slots geschrieben
    const trophy = fb.getByPath('leaderboardTrophies/2026-06') as Record<string, unknown>;
    expect(trophy.first).toBeUndefined();
  });
});

describe('forceRebuildArchive', () => {
  it('überschreibt den Trophy eines Monats aus den Archiv-Daten', async () => {
    fb.setByPath('leaderboardArchive/2026-06', {
      u1: { watchtimeThisMonth: 80, displayName: 'Alice' },
    });
    fb.setByPath('leaderboardTrophies/2026-06', { archived: true, first: { uid: 'stale' } });

    await forceRebuildArchive('2026-06');

    const trophy = fb.getByPath('leaderboardTrophies/2026-06') as Record<string, unknown>;
    expect((trophy.first as Record<string, unknown>).uid).toBe('u1');
    expect((trophy.first as Record<string, unknown>).score).toBe(80);
  });

  it('tut nichts bei leerem Monat', async () => {
    await forceRebuildArchive('2026-06');
    expect(fb.getByPath('leaderboardTrophies/2026-06')).toBeUndefined();
  });
});

describe('fetchTrophyHistory', () => {
  it('sortiert nach Monat absteigend und merged frische Profil-Daten', async () => {
    fb.setByPath('leaderboardTrophies', {
      '2026-05': {
        category: 'watchtimeThisMonth',
        first: { uid: 'u1', displayName: 'Old', photoURL: 'o.png', score: 80 },
        second: null,
        third: null,
      },
      '2026-06': {
        first: { uid: 'u2', displayName: 'X', score: 40 },
      },
    });
    fb.setByPath('users/u1/username', 'fresh1');
    fb.setByPath('users/u2/username', 'fresh2');

    const history = await fetchTrophyHistory();

    expect(history.map((t) => t.monthKey)).toEqual(['2026-06', '2026-05']);
    expect(history[0].first?.displayName).toBe('fresh2'); // gemergt
    expect(history[1].first?.score).toBe(80);
    expect(history[1].category).toBe('watchtimeThisMonth');
  });

  it('liefert [] ohne Trophäen', async () => {
    await expect(fetchTrophyHistory()).resolves.toEqual([]);
  });
});
