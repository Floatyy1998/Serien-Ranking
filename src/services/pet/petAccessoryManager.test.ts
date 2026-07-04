import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { ACCESSORIES } from '../../types/pet.types';

// Nested-Path Firebase-Mock inkl. push().
const fb = vi.hoisted(() => {
  let root: Record<string, unknown> = {};
  let counter = 0;
  const parts = (p: string) => p.split('/').filter(Boolean);
  const getAt = (p: string): unknown => {
    let n: unknown = root;
    for (const k of parts(p)) {
      if (n == null || typeof n !== 'object') return undefined;
      n = (n as Record<string, unknown>)[k];
    }
    return n;
  };
  const setAt = (p: string, v: unknown) => {
    const ks = parts(p);
    let n = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (n[ks[i]] == null || typeof n[ks[i]] !== 'object') n[ks[i]] = {};
      n = n[ks[i]] as Record<string, unknown>;
    }
    n[ks[ks.length - 1]] = v;
  };
  const removeAt = (p: string) => {
    const ks = parts(p);
    let n = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (n[ks[i]] == null) return;
      n = n[ks[i]] as Record<string, unknown>;
    }
    delete n[ks[ks.length - 1]];
  };
  const makeRef = (p: string): Record<string, unknown> => ({
    once: async () => {
      const v = getAt(p);
      return { val: () => (v === undefined ? null : v), exists: () => v != null };
    },
    set: async (v: unknown) => setAt(p, v),
    update: async (obj: Record<string, unknown>) => {
      for (const [k, val] of Object.entries(obj)) setAt(`${p}/${k}`, val);
    },
    remove: async () => removeAt(p),
    push: (v?: unknown) => {
      const key = `push-${++counter}`;
      const cp = `${p}/${key}`;
      if (v !== undefined) setAt(cp, v);
      return { key, ...makeRef(cp) };
    },
  });
  return {
    ref: (p: string) => makeRef(p),
    getAt,
    setAt,
    reset: () => {
      root = {};
      counter = 0;
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const petCore = vi.hoisted(() => ({
  getUserPet: vi.fn(),
  getUserPets: vi.fn(),
}));
vi.mock('./petCore', () => petCore);

import {
  toggleAccessory,
  generateStarterAccessories,
  rollAccessoryDrop,
  claimAccessoryDrop,
  checkAndUnlockAccessories,
  checkAchievements,
  equipBackground,
  changePetColor,
} from './petAccessoryManager';

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    userId: 'u1',
    name: 'Rex',
    type: 'dog',
    color: 'rot',
    level: 1,
    experience: 0,
    hunger: 30,
    happiness: 70,
    lastFed: new Date(),
    episodesWatched: 0,
    createdAt: new Date(),
    isAlive: true,
    accessories: [],
    ...overrides,
  } as Pet;
}

beforeEach(() => {
  fb.reset();
  petCore.getUserPet.mockReset();
  petCore.getUserPets.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generateStarterAccessories', () => {
  it('liefert 3 gueltige Accessoires, das erste ist equipped', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const starters = generateStarterAccessories();
    expect(starters).toHaveLength(3);
    expect(starters[0].equipped).toBe(true);
    expect(starters[1].equipped).toBe(false);
    // Deterministisch bei random=0: beanie, baseballCap, flowerCrown
    expect(starters.map((a) => a.id)).toEqual(['beanie', 'baseballCap', 'flowerCrown']);
    for (const a of starters) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
    }
  });
});

describe('toggleAccessory', () => {
  it('kein Pet → null', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await toggleAccessory('u1', 'p1', 'beanie')).toBeNull();
  });

  it('equipt ein vorhandenes Accessoire und deaktiviert alle anderen', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        accessories: [
          { id: 'beanie', type: 'head', name: 'Muetze', icon: 'x', equipped: true },
          { id: 'bow', type: 'neck', name: 'Schleife', icon: 'y', equipped: false },
        ],
      })
    );
    const result = await toggleAccessory('u1', 'p1', 'bow');
    const bow = result?.accessories?.find((a) => a.id === 'bow');
    const beanie = result?.accessories?.find((a) => a.id === 'beanie');
    expect(bow?.equipped).toBe(true);
    expect(beanie?.equipped).toBe(false);
  });

  it('unequipt ein bereits equipptes Accessoire', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        accessories: [{ id: 'beanie', type: 'head', name: 'Muetze', icon: 'x', equipped: true }],
      })
    );
    const result = await toggleAccessory('u1', 'p1', 'beanie');
    expect(result?.accessories?.[0].equipped).toBe(false);
  });

  it('unbekanntes (nicht besessenes) Accessoire aus ACCESSORIES wird hinzugefuegt und equipped', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        accessories: [{ id: 'beanie', type: 'head', name: 'Muetze', icon: 'x', equipped: true }],
      })
    );
    const result = await toggleAccessory('u1', 'p1', 'topHat');
    const topHat = result?.accessories?.find((a) => a.id === 'topHat');
    expect(topHat).toBeDefined();
    expect(topHat?.equipped).toBe(true);
    expect(result?.accessories?.find((a) => a.id === 'beanie')?.equipped).toBe(false);
  });

  it('loescht das isNew-Flag beim Interagieren', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        accessories: [
          { id: 'beanie', type: 'head', name: 'Muetze', icon: 'x', equipped: false, isNew: true },
        ],
      })
    );
    const result = await toggleAccessory('u1', 'p1', 'beanie');
    expect(result?.accessories?.[0].isNew).toBeUndefined();
  });
});

describe('rollAccessoryDrop', () => {
  it('Random ueber Drop-Chance → kein Drop (null)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // > 0.045
    petCore.getUserPets.mockResolvedValue([makePet({ isAlive: true })]);
    expect(await rollAccessoryDrop('u1')).toBeNull();
  });

  it('keine lebenden Pets → null', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    petCore.getUserPets.mockResolvedValue([makePet({ isAlive: false })]);
    expect(await rollAccessoryDrop('u1')).toBeNull();
  });

  it('alle Kandidaten bereits besessen → null', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const allOwned = Object.keys(ACCESSORIES).map((id) => ({
      id,
      type: 'head',
      name: id,
      icon: 'x',
      equipped: false,
    }));
    petCore.getUserPets.mockResolvedValue([makePet({ isAlive: true, accessories: allOwned })]);
    expect(await rollAccessoryDrop('u1')).toBeNull();
  });

  it('erfolgreicher Drop: schreibt Pending-Drop + Notification, liefert Drop-Info', async () => {
    // 3 Random-Werte: Gate, Rarity (common), Pick (Index 0)
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0) // Gate: 0 > 0.045 false → weiter
      .mockReturnValueOnce(0) // Rarity: 0 < 45 → common
      .mockReturnValueOnce(0); // Pick: Index 0
    petCore.getUserPets.mockResolvedValue([makePet({ isAlive: true, accessories: [] })]);

    const drop = await rollAccessoryDrop('u1');
    expect(drop).not.toBeNull();
    expect(drop?.rarity).toBe('common');
    expect(drop?.accessoryId).toBe('beanie');
    expect(drop?.name).toBe('Muetze');
    // Pending-Drop + Notification wurden geschrieben
    const pending = fb.getAt('users/u1/pendingAccessoryDrops') as Record<string, unknown>;
    const notifs = fb.getAt('users/u1/notifications') as Record<string, unknown>;
    expect(Object.keys(pending)).toHaveLength(1);
    expect(Object.keys(notifs)).toHaveLength(1);
  });

  it('rollt legendary bei hohem Rarity-Wuerfel', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0) // Gate
      .mockReturnValueOnce(0.99) // Rarity: >= 98 → legendary
      .mockReturnValueOnce(0); // Pick
    petCore.getUserPets.mockResolvedValue([makePet({ isAlive: true, accessories: [] })]);
    const drop = await rollAccessoryDrop('u1');
    expect(drop?.rarity).toBe('legendary');
  });

  it('rollt epic im epic-Band', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0) // Gate
      .mockReturnValueOnce(0.95) // Rarity: [90,98) → epic
      .mockReturnValueOnce(0); // Pick
    petCore.getUserPets.mockResolvedValue([makePet({ isAlive: true, accessories: [] })]);
    const drop = await rollAccessoryDrop('u1');
    expect(drop?.rarity).toBe('epic');
  });
});

describe('claimAccessoryDrop', () => {
  it('nicht existierender Drop → false', async () => {
    expect(await claimAccessoryDrop('u1', 'nope', 'beanie')).toBe(false);
  });

  it('ungueltige accessoryId → Drop wird geloescht, false', async () => {
    fb.setAt('users/u1/pendingAccessoryDrops/d1', { accessoryId: 'ghost' });
    const result = await claimAccessoryDrop('u1', 'd1', 'ghostAccessory');
    expect(result).toBe(false);
    expect(fb.getAt('users/u1/pendingAccessoryDrops/d1')).toBeUndefined();
  });

  it('gueltiger Claim: fuegt Accessoire dem lebenden Pet hinzu und loescht den Drop', async () => {
    fb.setAt('users/u1/pendingAccessoryDrops/d1', { accessoryId: 'beanie' });
    petCore.getUserPets.mockResolvedValue([makePet({ id: 'p1', isAlive: true, accessories: [] })]);
    const result = await claimAccessoryDrop('u1', 'd1', 'beanie');
    expect(result).toBe(true);
    const accs = fb.getAt('users/u1/pets/p1/accessories') as Array<{ id: string }>;
    expect(accs.some((a) => a.id === 'beanie')).toBe(true);
    expect(fb.getAt('users/u1/pendingAccessoryDrops/d1')).toBeUndefined();
  });
});

describe('checkAndUnlockAccessories', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15)); // Juli → Sonnenbrillen-Monat
  });
  afterEach(() => vi.useRealTimers());

  it('Level >= 10 schaltet die Krone frei, Juli die Sonnenbrille', async () => {
    const pet = makePet({ level: 10, accessories: [] });
    await checkAndUnlockAccessories(pet);
    const ids = (pet.accessories || []).map((a) => a.id);
    expect(ids).toContain('crown');
    expect(ids).toContain('sunglasses');
    // wurde persistiert
    const stored = fb.getAt('users/u1/pets/p1/accessories') as Array<{ id: string }>;
    expect(stored.map((a) => a.id)).toContain('crown');
  });

  it('Dezember schaltet die Weihnachtsmuetze frei', async () => {
    vi.setSystemTime(new Date(2026, 11, 24)); // Dezember
    const pet = makePet({ level: 1, accessories: [] });
    await checkAndUnlockAccessories(pet);
    expect((pet.accessories || []).map((a) => a.id)).toContain('santaHat');
  });

  it('nichts freizuschalten → kein Firebase-Write', async () => {
    const pet = makePet({
      level: 1,
      accessories: [{ id: 'sunglasses', type: 'face', name: 's', icon: 'x', equipped: false }],
    });
    await checkAndUnlockAccessories(pet);
    expect(fb.getAt('users/u1/pets/p1/accessories')).toBeUndefined();
  });
});

describe('checkAchievements', () => {
  it('25 Serien → silver, 50 → +gold, 100 → +rainbow', async () => {
    const p25 = makePet({ totalSeriesWatched: 25, unlockedColors: [] });
    await checkAchievements(p25);
    expect(p25.unlockedColors).toContain('silver');
    expect(p25.unlockedColors).not.toContain('gold');

    const p100 = makePet({ totalSeriesWatched: 100, unlockedColors: [] });
    await checkAchievements(p100);
    expect(p100.unlockedColors).toEqual(expect.arrayContaining(['silver', 'gold', 'rainbow']));
  });

  it('200 Episoden schaltet das Galaxy-Muster frei', async () => {
    const pet = makePet({ episodesWatched: 200, unlockedPatterns: [] });
    await checkAchievements(pet);
    expect(pet.unlockedPatterns).toContain('galaxy');
    const stored = fb.getAt('users/u1/pets/p1') as Record<string, unknown>;
    expect(stored.unlockedPatterns).toContain('galaxy');
  });

  it('unter allen Schwellen → kein Write', async () => {
    const pet = makePet({ totalSeriesWatched: 5, episodesWatched: 5 });
    await checkAchievements(pet);
    expect(fb.getAt('users/u1/pets/p1')).toBeUndefined();
  });
});

describe('equipBackground', () => {
  it('gueltiger, freigeschalteter Hintergrund wird gesetzt', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ unlockedBackgrounds: ['clearSky'] }));
    const result = await equipBackground('u1', 'p1', 'clearSky');
    expect(result?.equippedBackground).toBe('clearSky');
    expect(fb.getAt('users/u1/pets/p1/equippedBackground')).toBe('clearSky');
  });

  it('nicht freigeschalteter Hintergrund → keine Aenderung', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ unlockedBackgrounds: [] }));
    const result = await equipBackground('u1', 'p1', 'clearSky');
    expect(result?.equippedBackground).toBeUndefined();
    expect(fb.getAt('users/u1/pets/p1/equippedBackground')).toBeUndefined();
  });

  it('unbekannter Hintergrund → keine Aenderung', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ unlockedBackgrounds: ['ghostBg'] }));
    const result = await equipBackground('u1', 'p1', 'ghostBg');
    expect(result?.equippedBackground).toBeUndefined();
  });

  it('null entfernt den Hintergrund', async () => {
    fb.setAt('users/u1/pets/p1/equippedBackground', 'clearSky');
    petCore.getUserPet.mockResolvedValue(makePet({ equippedBackground: 'clearSky' }));
    const result = await equipBackground('u1', 'p1', null);
    expect(result?.equippedBackground).toBeUndefined();
    expect(fb.getAt('users/u1/pets/p1/equippedBackground')).toBeUndefined();
  });

  it('kein Pet → null', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await equipBackground('u1', 'p1', 'clearSky')).toBeNull();
  });
});

describe('changePetColor', () => {
  it('Standard-Farbe (in PET_COLORS) wird gesetzt', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ color: 'rot' }));
    const result = await changePetColor('u1', 'p1', 'blau');
    expect(result?.color).toBe('blau');
    expect(fb.getAt('users/u1/pets/p1/color')).toBe('blau');
  });

  it('freigeschaltete Sonderfarbe wird gesetzt', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ unlockedColors: ['silver'] }));
    const result = await changePetColor('u1', 'p1', 'silver');
    expect(result?.color).toBe('silver');
  });

  it('nicht verfuegbare Farbe → keine Aenderung', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ color: 'rot', unlockedColors: [] }));
    const result = await changePetColor('u1', 'p1', 'silver');
    expect(result?.color).toBe('rot');
  });

  it('kein Pet → null', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await changePetColor('u1', 'p1', 'blau')).toBeNull();
  });
});
