import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Verschachtelter Firebase-Mock (once/set/child/orderByKey/limitToLast + ServerValue).
// OfflineBadgeSystem ist ein Singleton pro uid mit 30-Min-Cache → wir nutzen
// vi.resetModules() + dynamischen Import und Fake-Timer für Cache-Ablauf.
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
  const makeQuery = (path: string, limit?: number): Record<string, unknown> => ({
    orderByKey: () => makeQuery(path, limit),
    limitToLast: (n: number) => makeQuery(path, n),
    once: async () => {
      let val = getAt(path);
      if (limit != null && val && typeof val === 'object' && !Array.isArray(val)) {
        const keys = Object.keys(val as Record<string, unknown>).sort();
        const out: Record<string, unknown> = {};
        for (const k of keys.slice(-limit)) out[k] = (val as Record<string, unknown>)[k];
        val = out;
      }
      return snap(val);
    },
  });
  const makeRef = (path: string): Record<string, unknown> => ({
    once: async () => snap(getAt(path)),
    set: async (v: unknown) => setAt(path, v),
    remove: async () => setAt(path, undefined),
    child: (key: string) => makeRef(`${path}/${key}`),
    orderByKey: () => makeQuery(path),
    limitToLast: (n: number) => makeQuery(path, n),
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

import type { OfflineBadgeSystem } from './offlineBadgeSystem';

const BASE = new Date('2026-07-04T12:00:00Z').getTime();

async function load() {
  return import('./offlineBadgeSystem');
}

function seedSeries(uid: string, count: number, rating: number | Record<string, number> = 0) {
  const series: Record<string, unknown> = {};
  for (let i = 0; i < count; i++) series[`s${i}`] = { rating };
  fb.setAt(`users/${uid}/series`, series);
}

beforeEach(() => {
  vi.resetModules();
  fb.reset();
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------- Singleton ----------

describe('getOfflineBadgeSystem', () => {
  it('liefert dieselbe Instanz pro uid, verschiedene für verschiedene uids', async () => {
    const { getOfflineBadgeSystem } = await load();
    const a1 = getOfflineBadgeSystem('u1');
    const a2 = getOfflineBadgeSystem('u1');
    const b = getOfflineBadgeSystem('u2');
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });
});

// ---------- getUserBadges ----------

describe('getUserBadges', () => {
  it('liefert die gespeicherten Badges als Array', async () => {
    fb.setAt('users/u1/badges', {
      explorer_bronze: { id: 'explorer_bronze', category: 'series_explorer' },
    });
    const { getOfflineBadgeSystem } = await load();
    const sys = getOfflineBadgeSystem('u1');
    const badges = await sys.getUserBadges();
    expect(badges.map((b) => b.id)).toEqual(['explorer_bronze']);
  });

  it('keine Badges → leeres Array', async () => {
    const { getOfflineBadgeSystem } = await load();
    const badges = await getOfflineBadgeSystem('u1').getUserBadges();
    expect(badges).toEqual([]);
  });
});

// ---------- checkForNewBadges ----------

describe('checkForNewBadges', () => {
  it('vergibt explorer_bronze bei 50 Serien und persistiert es', async () => {
    seedSeries('u1', 50);
    const { getOfflineBadgeSystem } = await load();
    const newBadges = await getOfflineBadgeSystem('u1').checkForNewBadges();

    const ids = newBadges.map((b) => b.id);
    expect(ids).toContain('explorer_bronze');
    // Nur die Bronze-Schwelle (50), nicht Silber (100) etc.
    expect(ids).not.toContain('explorer_silver');
    // Persistiert unter users/u1/badges/explorer_bronze mit Server-Timestamp
    const saved = fb.getAt('users/u1/badges/explorer_bronze') as { earnedAt: unknown };
    expect(saved).toBeTruthy();
    expect(saved.earnedAt).toBe('__SERVER_TS__');
  });

  it('überspringt bereits vergebene Badges', async () => {
    seedSeries('u1', 50);
    fb.setAt('users/u1/badges', { explorer_bronze: { id: 'explorer_bronze' } });
    const { getOfflineBadgeSystem } = await load();
    const newBadges = await getOfflineBadgeSystem('u1').checkForNewBadges();
    expect(newBadges.map((b) => b.id)).not.toContain('explorer_bronze');
  });

  it('keine Daten → keine neuen Badges', async () => {
    const { getOfflineBadgeSystem } = await load();
    const newBadges = await getOfflineBadgeSystem('u1').checkForNewBadges();
    expect(newBadges).toEqual([]);
  });
});

// ---------- Cache ----------

describe('Caching', () => {
  it('isCacheValid: false vor Nutzung, true nach Laden, false nach 30 Min', async () => {
    seedSeries('u1', 5);
    const { getOfflineBadgeSystem } = await load();
    const sys = getOfflineBadgeSystem('u1');
    expect(sys.isCacheValid()).toBe(false);

    await sys.getAllBadgeProgress();
    expect(sys.isCacheValid()).toBe(true);

    vi.setSystemTime(BASE + 31 * 60 * 1000);
    expect(sys.isCacheValid()).toBe(false);
  });

  it('invalidateCache setzt den Cache zurück', async () => {
    seedSeries('u1', 5);
    const { getOfflineBadgeSystem } = await load();
    const sys = getOfflineBadgeSystem('u1');
    await sys.getAllBadgeProgress();
    expect(sys.isCacheValid()).toBe(true);
    sys.invalidateCache();
    expect(sys.isCacheValid()).toBe(false);
  });
});

// ---------- getBadgeProgress ----------

describe('getBadgeProgress', () => {
  it('unbekannte Badge-ID → null', async () => {
    const { getOfflineBadgeSystem } = await load();
    await expect(getOfflineBadgeSystem('u1').getBadgeProgress('nope')).resolves.toBeNull();
  });

  it('bereits vergebenes Badge → null', async () => {
    fb.setAt('users/u1/badges', { explorer_bronze: { id: 'explorer_bronze' } });
    const { getOfflineBadgeSystem } = await load();
    await expect(
      getOfflineBadgeSystem('u1').getBadgeProgress('explorer_bronze')
    ).resolves.toBeNull();
  });

  it('explorer: current = Anzahl Serien, total = Schwelle', async () => {
    seedSeries('u1', 10);
    const { getOfflineBadgeSystem } = await load();
    const p = await getOfflineBadgeSystem('u1').getBadgeProgress('explorer_bronze');
    expect(p).toMatchObject({ badgeId: 'explorer_bronze', current: 10, total: 50 });
  });

  it('rewatch: liest Compact-Watch-Daten (w/c/f-Arrays) und summiert watchCount-1', async () => {
    fb.setAt('users/u1/series', { '100': { rating: 0 } });
    fb.setAt('users/u1/seriesWatch', {
      '100': { seasons: { '0': { w: [1, 1], c: [3, 2], f: [0, 0], seasonNumber: 0 } } },
    });
    const { getOfflineBadgeSystem } = await load();
    const p = await getOfflineBadgeSystem('u1').getBadgeProgress('rewatch_bronze');
    // (3-1) + (2-1) = 3
    expect(p).toMatchObject({ current: 3, total: 5 });
  });

  it('collector: zählt gültige Ratings aus Serien + Filmen', async () => {
    fb.setAt('users/u1/series', { a: { rating: 8 }, b: { rating: 0 } });
    fb.setAt('users/u1/movies', { m: { rating: 9 } });
    const { getOfflineBadgeSystem } = await load();
    const p = await getOfflineBadgeSystem('u1').getBadgeProgress('collector_bronze');
    expect(p).toMatchObject({ current: 2, total: 50 });
  });

  it('social: liest die Freundesanzahl aus Firebase', async () => {
    fb.setAt('users/u1/friends', { x: true, y: true, z: true });
    const { getOfflineBadgeSystem } = await load();
    const p = await getOfflineBadgeSystem('u1').getBadgeProgress('social_bronze');
    expect(p).toMatchObject({ current: 3, total: 3 });
  });
});

// ---------- getAllBadgeProgress ----------

describe('getAllBadgeProgress', () => {
  it('liefert Fortschritt für unerreichte Badges (keyed by id)', async () => {
    seedSeries('u1', 7);
    const { getOfflineBadgeSystem } = await load();
    const all = await getOfflineBadgeSystem('u1').getAllBadgeProgress();
    expect(all.explorer_bronze).toMatchObject({ current: 7, total: 50 });
    // erreichte Badges tauchen nicht auf — hier ist keins erreicht
    expect(Object.keys(all).length).toBeGreaterThan(0);
  });

  it('bereits vergebene Badges werden ausgelassen', async () => {
    seedSeries('u1', 7);
    fb.setAt('users/u1/badges', { explorer_bronze: { id: 'explorer_bronze' } });
    const { getOfflineBadgeSystem } = await load();
    const all = await getOfflineBadgeSystem('u1').getAllBadgeProgress();
    expect(all.explorer_bronze).toBeUndefined();
  });

  it('zweiter Aufruf nutzt den Cache und liefert konsistente Daten', async () => {
    seedSeries('u1', 7);
    const { getOfflineBadgeSystem } = await load();
    const sys = getOfflineBadgeSystem('u1');
    const first = await sys.getAllBadgeProgress();
    const second = await sys.getAllBadgeProgress();
    expect(second.explorer_bronze).toEqual(first.explorer_bronze);
  });
});

// ---------- getCategoryProgress ----------

describe('getCategoryProgress', () => {
  it('liefert eine Liste für alle unerreichten Badges der Kategorie', async () => {
    seedSeries('u1', 10);
    const { getOfflineBadgeSystem } = await load();
    const list = await getOfflineBadgeSystem('u1').getCategoryProgress('series_explorer');
    // 6 Explorer-Badges (bronze..mythic), alle unerreicht
    expect(list.length).toBe(6);
    for (const p of list) expect(p.current).toBe(10);
  });
});

// ---------- recalculateAllBadges ----------

describe('recalculateAllBadges', () => {
  it('leert den Cache und berechnet neu', async () => {
    seedSeries('u1', 50);
    const { getOfflineBadgeSystem } = await load();
    const sys: OfflineBadgeSystem = getOfflineBadgeSystem('u1');
    const badges = await sys.recalculateAllBadges();
    expect(badges.map((b) => b.id)).toContain('explorer_bronze');
  });
});

// ---------- debugSocialBadges ----------

describe('debugSocialBadges', () => {
  it('liefert Freundesanzahl und Social-Badge-Definitionen', async () => {
    fb.setAt('users/u1/friends', { a: true, b: true });
    const { getOfflineBadgeSystem } = await load();
    const debug = await getOfflineBadgeSystem('u1').debugSocialBadges();
    expect(debug.friendsCount).toBe(2);
    expect(debug.socialBadges.length).toBeGreaterThan(0);
    expect(debug.earnedSocialBadges).toEqual([]);
  });
});
