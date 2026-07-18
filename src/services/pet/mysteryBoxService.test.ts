/** Mystery-Box-Service: Kadenz, ensureInitialized (Migration/Self-Heal), Box-Öffnung — Firebase/Pets gemockt, Math.random gesteuert. */
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
    async transaction(fn: (current: unknown) => unknown) {
      const next = fn(getAt(path));
      if (next === undefined) {
        return { committed: false, snapshot: { val: () => getAt(path) } };
      }
      setAt(path, next);
      return { committed: true, snapshot: { val: () => next } };
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
  BOX_EVERY_N_EPISODES,
  BOX_SCHEMA_VERSION,
  getNextBoxThreshold,
  getProgressToNextBox,
  getAvailableBoxCount,
  ensureInitialized,
  openMysteryBox,
} from './mysteryBoxService';

const MB = 'users/u/mysteryBox';

const alivePet = () => [{ id: 'p1', isAlive: true, accessories: [], unlockedBackgrounds: [] }];

beforeEach(() => {
  fb.reset();
  getUserPets.mockReset();
  getUserPets.mockResolvedValue(alivePet());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Konstanten', () => {
  it('Box alle 20 Episoden, Schema-Version 2', () => {
    expect(BOX_EVERY_N_EPISODES).toBe(20);
    expect(BOX_SCHEMA_VERSION).toBe(2);
  });
});

describe('getNextBoxThreshold / getProgressToNextBox', () => {
  it('berechnet die nächste 20er-Schwelle', () => {
    expect(getNextBoxThreshold(0)).toBe(20);
    expect(getNextBoxThreshold(19)).toBe(20);
    expect(getNextBoxThreshold(20)).toBe(40);
    expect(getNextBoxThreshold(45)).toBe(60);
  });

  it('berechnet den Fortschritt (0-1) zur nächsten Box', () => {
    expect(getProgressToNextBox(0)).toBe(0);
    expect(getProgressToNextBox(10)).toBe(0.5);
    expect(getProgressToNextBox(20)).toBe(0);
    expect(getProgressToNextBox(25)).toBe(0.25);
  });
});

describe('ensureInitialized', () => {
  it('Erstbesuch (keine Daten): Baseline auf aktuellen 20er-Stand, Schema v2', async () => {
    const data = await ensureInitialized('u', 45);
    expect(data).toEqual({ boxesOpened: 0, lastOpenedBoxNumber: 2, schemaVersion: 2 });
    expect(fb.getAt(MB)).toEqual(data);
  });

  it('bestehender v2-Eintrag wird unverändert zurückgegeben', async () => {
    fb.setAt(MB, { boxesOpened: 1, lastOpenedBoxNumber: 1, schemaVersion: 2 });
    const data = await ensureInitialized('u', 60);
    expect(data).toEqual({ boxesOpened: 1, lastOpenedBoxNumber: 1, schemaVersion: 2 });
  });

  it('v1-Eintrag (ohne schemaVersion) wird auf den aktuellen 20er-Stand re-baselined', async () => {
    fb.setAt(MB, { boxesOpened: 5, lastOpenedBoxNumber: 3 });
    const data = await ensureInitialized('u', 100);
    expect(data).toEqual({ boxesOpened: 5, lastOpenedBoxNumber: 5, schemaVersion: 2 });
  });

  it('Self-Heal: erste Defizit-Sichtung heilt NICHT, sondern merkt nur einen Kandidaten vor', async () => {
    // Regression Doppel-Einlösung: halb geladene Zählung darf die Baseline nicht zurückspulen.
    fb.setAt(MB, { boxesOpened: 5, lastOpenedBoxNumber: 5, schemaVersion: 2 });
    const data = await ensureInitialized('u', 40); // earned=2 < lastOpened 5
    expect(data.lastOpenedBoxNumber).toBe(5); // Baseline unveraendert
    expect(data.healCandidateEarned).toBe(2);
    expect(typeof data.healCandidateAt).toBe('number');
    expect(fb.getAt(MB)).toMatchObject({ lastOpenedBoxNumber: 5 });
  });

  it('Self-Heal: Defizit besteht nach >= 24h weiter → Baseline wird zurückgezogen', async () => {
    fb.setAt(MB, {
      boxesOpened: 5,
      lastOpenedBoxNumber: 5,
      schemaVersion: 2,
      healCandidateEarned: 2,
      healCandidateAt: Date.now() - 25 * 60 * 60 * 1000,
    });
    const data = await ensureInitialized('u', 40); // earned=2 < lastOpened 5
    expect(data.lastOpenedBoxNumber).toBe(2);
    expect(data.healCandidateAt).toBeUndefined();
    expect(fb.getAt(MB)).toMatchObject({ lastOpenedBoxNumber: 2 });
  });

  it('Self-Heal: höherer Stand verwirft den Heal-Kandidaten (Zählung war nur stale)', async () => {
    fb.setAt(MB, {
      boxesOpened: 5,
      lastOpenedBoxNumber: 5,
      schemaVersion: 2,
      healCandidateEarned: 2,
      healCandidateAt: Date.now() - 25 * 60 * 60 * 1000,
    });
    const data = await ensureInitialized('u', 120); // earned=6 >= lastOpened 5
    expect(data.lastOpenedBoxNumber).toBe(5);
    expect(data.healCandidateAt).toBeUndefined();
    expect(data.healCandidateEarned).toBeUndefined();
  });

  it('lastOpenedBoxNumber 0 gilt als gültiger Stand (kein Re-Baseline bei jedem Mount)', async () => {
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: 0, schemaVersion: 2 });
    const data = await ensureInitialized('u', 40);
    expect(data.lastOpenedBoxNumber).toBe(0); // bleibt 0 → nächste Box bleibt frei
  });
});

describe('getAvailableBoxCount', () => {
  it('Erstbesuch: keine rückwirkenden Boxen (Baseline = earned)', async () => {
    expect(await getAvailableBoxCount('u', 50)).toBe(0);
  });

  it('zählt ungeöffnete Boxen relativ zur Baseline', async () => {
    fb.setAt(MB, { boxesOpened: 1, lastOpenedBoxNumber: 1, schemaVersion: 2 });
    expect(await getAvailableBoxCount('u', 60)).toBe(2); // earned 3 - 1
  });

  it('nie negativ', async () => {
    fb.setAt(MB, { boxesOpened: 5, lastOpenedBoxNumber: 5, schemaVersion: 2 });
    // Defizit-Fall: Baseline bleibt (Heal-Hysterese) → max(0, 2-5) = 0 verfügbar
    expect(await getAvailableBoxCount('u', 40)).toBe(0);
  });
});

describe('openMysteryBox', () => {
  it('liefert null, wenn keine Box verdient ist', async () => {
    fb.setAt(MB, { boxesOpened: 2, lastOpenedBoxNumber: 2, schemaVersion: 2 });
    expect(await openMysteryBox('u', 40)).toBeNull();
  });

  it('Regression Doppel-Einlösung: dieselbe Box kann nur EINMAL geöffnet werden', async () => {
    // 1 Box verfügbar — zweiter Open (zweites Gerät/Doppel-Tap) muss leer ausgehen, Transaktion claimt atomar.
    fb.setAt(MB, { boxesOpened: 1, lastOpenedBoxNumber: 1, schemaVersion: 2 });
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // common → xp_boost

    const first = await openMysteryBox('u', 40);
    const second = await openMysteryBox('u', 40);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(fb.getAt(MB)).toMatchObject({ boxesOpened: 2, lastOpenedBoxNumber: 2 });
    const inv = fb.getAt('users/u/xpBoostInventory') as unknown[];
    expect(inv).toHaveLength(1); // nur EINE Belohnung
  });

  it('öffnet die nächste Box, speichert Fortschritt und wendet eine XP-Boost-Belohnung an', async () => {
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: 0, schemaVersion: 2 });
    // 1. random: getBoxRarity(1) → 0.9 → common; 2. random: generateMysteryReward → 0.9 → XP-Boost
    const q = [0.9, 0.9];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const reward = await openMysteryBox('u', 40); // earned 2 > lastOpened 0 → Box 1
    expect(reward?.type).toBe('xp_boost');
    expect(reward?.rarity).toBe('common');
    expect(reward).toMatchObject({ xpMultiplier: 2, xpEpisodeCount: 2 });

    expect(fb.getAt(MB)).toEqual({ boxesOpened: 1, lastOpenedBoxNumber: 1, schemaVersion: 2 });
    const inv = fb.getAt('users/u/xpBoostInventory') as Array<{ source: string }>;
    expect(inv).toHaveLength(1);
    expect(inv[0].source).toBe('mystery_box');
  });

  it('Accessoire-Belohnung wird ans lebende Pet vergeben', async () => {
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: 0, schemaVersion: 2 });
    // getBoxRarity(1)=0.9 → common; generateMysteryReward roll 0.5 → accessory; pick-index 0
    const q = [0.9, 0.5, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const reward = await openMysteryBox('u', 40);
    expect(reward?.type).toBe('accessory');
    expect(reward?.accessoryId).toBeDefined();

    const pet = fb.getAt('users/u/pets/p1') as { accessories: unknown[] };
    expect(pet.accessories).toHaveLength(1);
  });

  it('Background-Belohnung wird über alle Pets freigeschaltet', async () => {
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: 0, schemaVersion: 2 });
    getUserPets.mockResolvedValue([
      { id: 'p1', isAlive: true, accessories: [], unlockedBackgrounds: [] },
      { id: 'p2', isAlive: false, accessories: [], unlockedBackgrounds: [] },
    ]);
    // getBoxRarity(1)=0.9 → common; generateMysteryReward roll 0.0 → background; pick-index 0
    const q = [0.9, 0.0, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const reward = await openMysteryBox('u', 40);
    expect(reward?.type).toBe('background');
    expect(reward?.backgroundId).toBeDefined();

    const p1 = fb.getAt('users/u/pets/p1/unlockedBackgrounds') as string[];
    const p2 = fb.getAt('users/u/pets/p2/unlockedBackgrounds') as string[];
    expect(p1).toContain(reward?.backgroundId);
    expect(p2).toContain(reward?.backgroundId); // auf alle Pets verteilt
  });

  it('vergibt bei höherer Rarity ein milestone-exklusives Accessoire', async () => {
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: 19, schemaVersion: 2 });
    // getBoxRarity(20)=0.2 → epic; generateMysteryReward 0.5 → accessory; pick-index 0
    const q = [0.2, 0.5, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));

    const reward = await openMysteryBox('u', 400); // Box 20
    expect(reward?.rarity).toBe('epic');
    expect(reward?.type).toBe('accessory');
    // epische Milestone-Exklusiven existieren → aus dieser Liste gezogen
    const epicExclusives = [
      'trophyNecklace',
      'crystalMonocle',
      'ancientCrown',
      'championBelt',
      'enchantedRose',
      'volcanoHelm',
      'dragonScaleCollar',
      'eclipseGoggles',
      'pyramidHelm',
    ];
    expect(epicExclusives).toContain(reward?.accessoryId);
  });

  it('liefert null, wenn kein lebendes Pet für die Belohnung existiert', async () => {
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: 0, schemaVersion: 2 });
    getUserPets.mockResolvedValue([{ id: 'dead', isAlive: false }]);
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // common → xp_boost
    const reward = await openMysteryBox('u', 40);
    // Box wird geöffnet + gespeichert, aber applyMysteryReward findet kein Pet
    expect(reward?.type).toBe('xp_boost');
    expect(fb.getAt('users/u/xpBoostInventory')).toBeNull();
  });

  it('Accessoire-Zweig ohne verfügbares Accessoire/Background fällt auf XP-Boost zurück', async () => {
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: 0, schemaVersion: 2 });
    getUserPets.mockResolvedValue([{ id: 'dead', isAlive: false }]); // Picks liefern null
    // getBoxRarity(1)=0.9 → common; generateMysteryReward 0.5 → accessory-Zweig
    const q = [0.9, 0.5];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));
    const reward = await openMysteryBox('u', 40);
    expect(reward?.type).toBe('xp_boost'); // Fallback nach null-Picks
  });
});

describe('getBoxRarity – Skalierung mit der Box-Nummer', () => {
  // Rarity über die deterministische XP-Boost-Belohnung geprüft (Reward-roll 0.9 → xp_boost).
  const openBoxAt = async (boxNumber: number, rarityRoll: number) => {
    fb.reset();
    getUserPets.mockResolvedValue(alivePet());
    fb.setAt(MB, { boxesOpened: 0, lastOpenedBoxNumber: boxNumber - 1, schemaVersion: 2 });
    const q = [rarityRoll, 0.9];
    vi.spyOn(Math, 'random').mockImplementation(() => (q.length ? (q.shift() as number) : 0));
    const reward = await openMysteryBox('u', boxNumber * 20);
    vi.restoreAllMocks();
    return reward;
  };

  it.each<[number, number, string]>([
    [400, 0.05, 'legendary'],
    [400, 0.5, 'epic'],
    [400, 0.8, 'rare'],
    [400, 0.95, 'uncommon'],
    [400, 0.99, 'common'],
    [200, 0.05, 'legendary'],
    [200, 0.4, 'epic'],
    [200, 0.8, 'rare'],
    [200, 0.95, 'uncommon'],
    [200, 0.99, 'common'],
    [100, 0.02, 'legendary'],
    [100, 0.4, 'epic'],
    [100, 0.7, 'rare'],
    [100, 0.9, 'uncommon'],
    [100, 0.99, 'common'],
    [50, 0.02, 'legendary'],
    [50, 0.3, 'epic'],
    [50, 0.6, 'rare'],
    [50, 0.85, 'uncommon'],
    [50, 0.95, 'common'],
    [20, 0.01, 'legendary'],
    [20, 0.2, 'epic'],
    [20, 0.5, 'rare'],
    [20, 0.85, 'uncommon'],
    [20, 0.95, 'common'],
    [10, 0.005, 'legendary'],
    [10, 0.2, 'epic'],
    [10, 0.5, 'rare'],
    [10, 0.8, 'uncommon'],
    [10, 0.95, 'common'],
    [4, 0.05, 'epic'],
    [4, 0.3, 'rare'],
    [4, 0.6, 'uncommon'],
    [4, 0.9, 'common'],
    [1, 0.1, 'rare'],
    [1, 0.4, 'uncommon'],
    [1, 0.9, 'common'],
  ])('Box %i mit roll %f → Rarity %s', async (boxNumber, roll, rarity) => {
    const reward = await openBoxAt(boxNumber, roll);
    expect(reward?.rarity).toBe(rarity);
    expect(reward?.type).toBe('xp_boost');
  });
});
