/**
 * Tests für den Daily-Spin-Service.
 *
 * Fokus: Spin-Segmente, Datums-Eligibilität (einmal pro Tag), gewichtete
 * Belohnung (Math.random gesteuert), XP-Boost-Inventar + Aktivierung/Verbrauch
 * inkl. Migration alter Zeit-Formate. Firebase und Pet-Zugriff sind gemockt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const root: Record<string, unknown> = {};
  const seg = (p: string) => p.split('/').filter(Boolean);
  const getAt = (p: string): unknown => {
    let cur: unknown = root;
    for (const k of seg(p)) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = (cur as Record<string, unknown>)[k];
    }
    return cur === undefined ? null : cur;
  };
  const setAt = (p: string, v: unknown) => {
    const ks = seg(p);
    let cur = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (typeof cur[ks[i]] !== 'object' || cur[ks[i]] === null) cur[ks[i]] = {};
      cur = cur[ks[i]] as Record<string, unknown>;
    }
    cur[ks[ks.length - 1]] = v;
  };
  const removeAt = (p: string) => {
    const ks = seg(p);
    let cur = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (cur[ks[i]] == null) return;
      cur = cur[ks[i]] as Record<string, unknown>;
    }
    delete cur[ks[ks.length - 1]];
  };
  const makeRef = (path: string) => ({
    async once(_e?: string) {
      return { val: () => getAt(path) };
    },
    async set(v: unknown) {
      setAt(path, v);
    },
    async update(v: Record<string, unknown>) {
      const cur = (getAt(path) as Record<string, unknown>) || {};
      setAt(path, { ...cur, ...v });
    },
    async remove() {
      removeAt(path);
    },
  });
  return {
    getAt,
    setAt,
    makeRef,
    reset() {
      for (const k of Object.keys(root)) delete root[k];
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const getUserPets = vi.hoisted(() => vi.fn());
vi.mock('./petCore', () => ({ getUserPets }));

import {
  toLocalDateString,
  buildSpinSegments,
  canSpinToday,
  getDailySpinData,
  performDailySpin,
  getActiveXpBoost,
  consumeXpBoostEpisode,
  getXpBoostInventory,
  activateXpBoost,
} from './dailySpinService';

const BASE = new Date('2026-06-15T12:00:00').getTime();
const TODAY = '2026-06-15';

const alivePet = () => [{ id: 'p1', isAlive: true, accessories: [], unlockedBackgrounds: [] }];

beforeEach(() => {
  fb.reset();
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
  getUserPets.mockReset();
  getUserPets.mockResolvedValue(alivePet());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('toLocalDateString', () => {
  it('formatiert lokal als YYYY-MM-DD (nullbasierte Padding)', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toLocalDateString(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('buildSpinSegments', () => {
  it('liefert 9 Segmente mit festen Rarities pro Index', () => {
    const segs = buildSpinSegments(0);
    expect(segs).toHaveLength(9);
    expect(segs[0]).toMatchObject({
      type: 'xp_boost',
      rarity: 'epic',
      xpMultiplier: 3,
      xpEpisodeCount: 5,
    });
    expect(segs[2]).toMatchObject({ type: 'xp_boost', rarity: 'legendary', xpEpisodeCount: 10 });
    expect(segs[4]).toMatchObject({ type: 'accessory', rarity: 'common' });
    expect(segs[8]).toMatchObject({ type: 'accessory', rarity: 'legendary' });
  });
});

describe('canSpinToday', () => {
  it('true, wenn noch nie gedreht wurde', async () => {
    expect(await canSpinToday('u')).toBe(true);
  });

  it('false, wenn heute schon gedreht wurde', async () => {
    fb.setAt('users/u/dailySpin/lastSpinDate', TODAY);
    expect(await canSpinToday('u')).toBe(false);
  });

  it('true, wenn der letzte Spin an einem anderen Tag war', async () => {
    fb.setAt('users/u/dailySpin/lastSpinDate', '2026-06-14');
    expect(await canSpinToday('u')).toBe(true);
  });
});

describe('getDailySpinData', () => {
  it('liefert die gespeicherten Daten oder null', async () => {
    expect(await getDailySpinData('u')).toBeNull();
    fb.setAt('users/u/dailySpin', { lastSpinDate: TODAY, totalSpins: 3, history: [] });
    expect((await getDailySpinData('u'))?.totalSpins).toBe(3);
  });
});

describe('performDailySpin', () => {
  it('liefert null, wenn heute bereits gedreht wurde', async () => {
    fb.setAt('users/u/dailySpin/lastSpinDate', TODAY);
    expect(await performDailySpin('u', 0)).toBeNull();
  });

  it('XP-Boost-Segment (Index 0): speichert Spin, hängt XP-Boost ins Inventar', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // roll 0 → Segment 0
    const result = await performDailySpin('u', 0);
    expect(result?.segmentIndex).toBe(0);
    expect(result?.reward.type).toBe('xp_boost');

    const spin = fb.getAt('users/u/dailySpin') as {
      lastSpinDate: string;
      totalSpins: number;
      history: unknown[];
    };
    expect(spin.lastSpinDate).toBe(TODAY);
    expect(spin.totalSpins).toBe(1);
    expect(spin.history).toHaveLength(1);

    const inv = fb.getAt('users/u/xpBoostInventory') as Array<{
      multiplier: number;
      episodeCount: number;
      source: string;
    }>;
    expect(inv).toHaveLength(1);
    expect(inv[0]).toMatchObject({ multiplier: 3, episodeCount: 5, source: 'daily_spin' });
  });

  it('höhere Streak wählt einen anderen Gewichts-Tier, bleibt aber deterministisch bei roll 0', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = await performDailySpin('u', 45); // Tier 3
    expect(result?.segmentIndex).toBe(0);
  });

  it('Accessoire-Segment: vergibt ein Accessoire an das lebende Pet', async () => {
    // roll-Reihenfolge: 0.5 → Segment 4 (accessory common),
    // 0.9 → kein common→uncommon-Upgrade, 0.9 → kein Background-Swap, 0 → Pick-Index 0
    const q = [0.5, 0.9, 0.9, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const result = await performDailySpin('u', 0);
    expect(result?.reward.type).toBe('accessory');
    expect(result?.reward.accessoryId).toBeDefined();

    const pet = fb.getAt('users/u/pets/p1') as { accessories: unknown[] };
    expect(pet.accessories).toHaveLength(1);
  });

  it('Common-Accessoire wird mit 50 % auf uncommon hochgestuft', async () => {
    // 0.5 → Segment 4 (common), 0.0 → Upgrade auf uncommon, 0.9 → kein Swap, 0 → Pick
    const q = [0.5, 0.0, 0.9, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const result = await performDailySpin('u', 0);
    expect(result?.reward.type).toBe('accessory');
    expect(result?.reward.rarity).toBe('uncommon');
  });

  it('Accessoire kann mit 30 % in einen Background gleicher Rarity getauscht werden', async () => {
    // 0.5 → Segment 4 (common), 0.9 → kein Upgrade, 0.0 → Background-Swap, 0 → Pick
    const q = [0.5, 0.9, 0.0, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const result = await performDailySpin('u', 0);
    expect(result?.reward.type).toBe('background');
    expect(result?.reward.backgroundId).toBeDefined();

    const pet = fb.getAt('users/u/pets/p1') as { unlockedBackgrounds: string[] };
    expect(pet.unlockedBackgrounds).toContain(result?.reward.backgroundId);
  });

  it('liefert null, wenn kein lebendes Pet existiert (Belohnung wird nicht angewandt)', async () => {
    getUserPets.mockResolvedValue([{ id: 'dead', isAlive: false }]);
    // XP-Boost-Segment → applySpinReward findet kein lebendes Pet → kein Inventar
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = await performDailySpin('u', 0);
    expect(result?.reward.type).toBe('xp_boost');
    expect(fb.getAt('users/u/xpBoostInventory')).toBeNull();
  });

  it('Accessoire-Segment ohne verfügbares Accessoire/Background fällt auf XP-Boost zurück', async () => {
    getUserPets.mockResolvedValue([{ id: 'dead', isAlive: false }]); // Picks liefern null
    // 0.5 → Segment 4 (accessory), 0.9 → kein Upgrade, 0.9 → kein Swap
    const q = [0.5, 0.9, 0.9];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const result = await performDailySpin('u', 0);
    expect(result?.reward.type).toBe('xp_boost'); // Fallback
    expect(result?.reward.xpEpisodeCount).toBe(5);
  });
});

describe('getActiveXpBoost', () => {
  it('liefert null ohne Daten', async () => {
    expect(await getActiveXpBoost('u')).toBeNull();
  });

  it('entfernt altes zeitbasiertes Format (expiresAt ohne remainingEpisodes) und liefert null', async () => {
    fb.setAt('users/u/activeXpBoost', { multiplier: 2, expiresAt: 123 });
    expect(await getActiveXpBoost('u')).toBeNull();
    expect(fb.getAt('users/u/activeXpBoost')).toBeNull();
  });

  it('entfernt aufgebrauchten Boost (remainingEpisodes <= 0)', async () => {
    fb.setAt('users/u/activeXpBoost', { multiplier: 2, remainingEpisodes: 0 });
    expect(await getActiveXpBoost('u')).toBeNull();
    expect(fb.getAt('users/u/activeXpBoost')).toBeNull();
  });

  it('liefert gültigen Boost', async () => {
    fb.setAt('users/u/activeXpBoost', { multiplier: 3, remainingEpisodes: 4 });
    expect(await getActiveXpBoost('u')).toEqual({ multiplier: 3, remainingEpisodes: 4 });
  });
});

describe('consumeXpBoostEpisode', () => {
  it('macht nichts ohne aktiven Boost', async () => {
    await consumeXpBoostEpisode('u');
    expect(fb.getAt('users/u/activeXpBoost')).toBeNull();
  });

  it('dekrementiert die verbleibenden Episoden', async () => {
    fb.setAt('users/u/activeXpBoost', { multiplier: 2, remainingEpisodes: 3 });
    await consumeXpBoostEpisode('u');
    expect(
      (fb.getAt('users/u/activeXpBoost') as { remainingEpisodes: number }).remainingEpisodes
    ).toBe(2);
  });

  it('entfernt den Boost, wenn die letzte Episode verbraucht wird', async () => {
    fb.setAt('users/u/activeXpBoost', { multiplier: 2, remainingEpisodes: 1 });
    await consumeXpBoostEpisode('u');
    expect(fb.getAt('users/u/activeXpBoost')).toBeNull();
  });
});

describe('getXpBoostInventory', () => {
  it('liefert [] ohne Inventar', async () => {
    expect(await getXpBoostInventory('u')).toEqual([]);
  });

  it('reicht bereits migrierte Items unverändert durch', async () => {
    fb.setAt('users/u/xpBoostInventory', [
      { multiplier: 3, episodeCount: 5, source: 'daily_spin', wonAt: 1 },
    ]);
    const inv = await getXpBoostInventory('u');
    expect(inv).toEqual([{ multiplier: 3, episodeCount: 5, source: 'daily_spin', wonAt: 1 }]);
  });

  it('migriert alte durationMinutes-Items zu episodeCount (>=120→10, >=60→5, sonst 2)', async () => {
    fb.setAt('users/u/xpBoostInventory', [
      { multiplier: 2, durationMinutes: 120 },
      { multiplier: 2, durationMinutes: 60 },
      { multiplier: 2, durationMinutes: 10 },
    ]);
    const inv = await getXpBoostInventory('u');
    expect(inv.map((i) => i.episodeCount)).toEqual([10, 5, 2]);
    // Migration wird persistiert
    const stored = fb.getAt('users/u/xpBoostInventory') as Array<{ episodeCount: number }>;
    expect(stored.map((i) => i.episodeCount)).toEqual([10, 5, 2]);
  });
});

describe('activateXpBoost', () => {
  it('false bei Index außerhalb des Bereichs', async () => {
    fb.setAt('users/u/xpBoostInventory', [
      { multiplier: 2, episodeCount: 5, source: 's', wonAt: 1 },
    ]);
    expect(await activateXpBoost('u', 5)).toBe(false);
  });

  it('false, wenn bereits ein Boost aktiv ist', async () => {
    fb.setAt('users/u/xpBoostInventory', [
      { multiplier: 2, episodeCount: 5, source: 's', wonAt: 1 },
    ]);
    fb.setAt('users/u/activeXpBoost', { multiplier: 2, remainingEpisodes: 3 });
    expect(await activateXpBoost('u', 0)).toBe(false);
  });

  it('aktiviert den Boost, entfernt ihn aus dem Inventar (leeres Inventar → null)', async () => {
    fb.setAt('users/u/xpBoostInventory', [
      { multiplier: 3, episodeCount: 10, source: 'daily_spin', wonAt: 1 },
    ]);
    expect(await activateXpBoost('u', 0)).toBe(true);
    expect(fb.getAt('users/u/activeXpBoost')).toEqual({
      multiplier: 3,
      remainingEpisodes: 10,
      originalEpisodes: 10,
      source: 'daily_spin',
    });
    expect(fb.getAt('users/u/xpBoostInventory')).toBeNull();
  });
});
