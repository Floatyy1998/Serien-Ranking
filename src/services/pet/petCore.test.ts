import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Nested-Path Firebase-Mock (Baum), damit hierarchische Reads/Writes +
// Migration korrekt zusammenspielen.
const fb = vi.hoisted(() => {
  let root: Record<string, unknown> = {};
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
  const throwOn = new Set<string>();
  const makeRef = (p: string) => ({
    once: async () => {
      if (throwOn.has(p)) throw new Error('boom');
      const v = getAt(p);
      return { val: () => (v === undefined ? null : v), exists: () => v != null };
    },
    set: async (v: unknown) => {
      if (throwOn.has(p)) throw new Error('boom');
      setAt(p, v);
    },
    update: async (obj: Record<string, unknown>) => {
      for (const [k, val] of Object.entries(obj)) setAt(`${p}/${k}`, val);
    },
    remove: async () => removeAt(p),
  });
  return {
    ref: (p: string) => makeRef(p),
    getAt,
    setAt,
    throwOn,
    reset: () => {
      root = {};
      throwOn.clear();
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

// generateStarterAccessories deterministisch machen (vermeidet Zufall/Zyklus).
const starterAcc = [
  { id: 'beanie', type: 'head', name: 'Muetze', icon: 'x', equipped: true },
  { id: 'bow', type: 'neck', name: 'Schleife', icon: 'y', equipped: false },
  { id: 'roundGlasses', type: 'face', name: 'Brille', icon: 'z', equipped: false },
];
vi.mock('./petAccessoryManager', () => ({
  generateStarterAccessories: vi.fn(() => starterAcc.map((a) => ({ ...a }))),
}));

async function load() {
  return import('./petCore');
}

function seedPet(uid: string, petId: string, overrides: Record<string, unknown> = {}) {
  fb.setAt(`users/${uid}/pets/${petId}`, {
    type: 'dog',
    name: 'Rex',
    id: petId,
    level: 3,
    experience: 0,
    hunger: 30,
    happiness: 70,
    lastFed: '2026-07-04T12:00:00.000Z',
    createdAt: 1700000000000,
    favoriteGenre: 'Comedy',
    isAlive: true,
    accessories: [{ id: 'beanie', type: 'head', name: 'Muetze', icon: 'x', equipped: true }],
    ...overrides,
  });
}

beforeEach(() => {
  vi.resetModules(); // migrationDone-Singleton zuruecksetzen
  fb.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getUserPets', () => {
  it('kein pets-Knoten → leeres Array', async () => {
    const { getUserPets } = await load();
    expect(await getUserPets('u1')).toEqual([]);
  });

  it('liest ein sauberes Pet und wandelt Datumsfelder in Date um', async () => {
    seedPet('u1', 'petA');
    const { getUserPets } = await load();
    const pets = await getUserPets('u1');
    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe('petA');
    expect(pets[0].lastFed).toBeInstanceOf(Date);
    expect(pets[0].createdAt).toBeInstanceOf(Date);
  });

  it('ersetzt alte Accessory-Typen durch Starter-Set', async () => {
    seedPet('u1', 'petA', {
      accessories: [{ id: 'oldHat', type: 'hat', name: 'Alt', icon: 'x', equipped: true }],
    });
    const { getUserPets } = await load();
    const pets = await getUserPets('u1');
    expect(pets[0].accessories?.map((a) => a.id)).toEqual(['beanie', 'bow', 'roundGlasses']);
    // persistiert
    const stored = fb.getAt('users/u1/pets/petA/accessories') as Array<{ id: string }>;
    expect(stored.map((a) => a.id)).toEqual(['beanie', 'bow', 'roundGlasses']);
  });

  it('setzt fehlendes createdAt nach und persistiert es', async () => {
    seedPet('u1', 'petA', { createdAt: undefined });
    const { getUserPets } = await load();
    const pets = await getUserPets('u1');
    expect(pets[0].createdAt).toBeInstanceOf(Date);
    expect(fb.getAt('users/u1/pets/petA/createdAt')).toBeDefined();
  });
});

describe('migrateIfNeeded (via getUserPets)', () => {
  it('migriert das alte Single-Pet-Format in eine Pet-Map + setzt activePetId', async () => {
    // Legacy: name/type/id direkt auf Root-Ebene von users/u1/pets
    fb.setAt('users/u1/pets', {
      type: 'cat',
      name: 'Mimi',
      id: 'legacyPet',
      level: 2,
      hunger: 40,
      happiness: 80,
      lastFed: '2026-07-04T12:00:00.000Z',
      createdAt: 1700000000000,
      favoriteGenre: 'Drama',
      isAlive: true,
      accessories: [{ id: 'beanie', type: 'head', name: 'm', icon: 'x', equipped: true }],
    });

    const { getUserPets, getActivePetId } = await load();
    const pets = await getUserPets('u1');

    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe('legacyPet');
    expect(fb.getAt('users/u1/pets/legacyPet')).toBeDefined();
    expect(await getActivePetId('u1')).toBe('legacyPet');
  });
});

describe('getUserPets — Sync ueber mehrere Pets', () => {
  const acc = (id: string, type = 'head', equipped = false) => ({
    id,
    type,
    name: id,
    icon: 'x',
    equipped,
  });

  it('teilt freigeschaltete Hintergruende und gleicht Accessoire-Sets an', async () => {
    seedPet('u1', 'petA', {
      accessories: [
        acc('beanie', 'head', true),
        acc('bow', 'neck'),
        acc('roundGlasses', 'face'),
        acc('topHat', 'head'),
      ],
      unlockedBackgrounds: ['clearSky'],
    });
    seedPet('u1', 'petB', {
      accessories: [acc('beanie', 'head', true)],
      unlockedBackgrounds: [],
    });

    const { getUserPets } = await load();
    const pets = await getUserPets('u1');
    const petB = pets.find((p) => p.id === 'petB');
    if (!petB) throw new Error('petB fehlt');

    // Hintergrund-Union propagiert zu petB
    expect(petB.unlockedBackgrounds).toContain('clearSky');
    // Accessoire-Sets sind nach dem Sync identisch (petB erhaelt das laengere Set)
    const petA = pets.find((p) => p.id === 'petA');
    if (!petA) throw new Error('petA fehlt');
    const idsA = petA.accessories?.map((a) => a.id).sort();
    const idsB = petB.accessories?.map((a) => a.id).sort();
    expect(idsB).toEqual(idsA);
    expect(idsB).toHaveLength(4);
  });

  it('bei zu kurzem Best-Set (<=3) wird auf das Starter-Set zurueckgesetzt', async () => {
    seedPet('u1', 'petA', { accessories: [acc('beanie', 'head', true), acc('bow', 'neck')] });
    seedPet('u1', 'petB', { accessories: [acc('roundGlasses', 'face', true)] });

    const { getUserPets } = await load();
    const pets = await getUserPets('u1');
    for (const p of pets) {
      expect(p.accessories?.map((a) => a.id)).toEqual(['beanie', 'bow', 'roundGlasses']);
    }
  });
});

describe('getUserPet', () => {
  it('liest ein einzelnes Pet', async () => {
    seedPet('u1', 'petA');
    const { getUserPet } = await load();
    const pet = await getUserPet('u1', 'petA');
    expect(pet?.id).toBe('petA');
    expect(pet?.lastFed).toBeInstanceOf(Date);
  });

  it('fuellt fehlendes createdAt und favoriteGenre nach', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedPet('u1', 'petA', { createdAt: undefined, favoriteGenre: undefined });
    const { getUserPet } = await load();
    const pet = await getUserPet('u1', 'petA');
    expect(pet?.createdAt).toBeInstanceOf(Date);
    expect(pet?.favoriteGenre).toBeTruthy();
    expect(fb.getAt('users/u1/pets/petA/createdAt')).toBeDefined();
    expect(fb.getAt('users/u1/pets/petA/favoriteGenre')).toBeTruthy();
  });

  it('ersetzt favoriteGenre "All" durch ein zufaelliges Genre', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedPet('u1', 'petA', { favoriteGenre: 'All' });
    const { getUserPet } = await load();
    const pet = await getUserPet('u1', 'petA');
    expect(pet?.favoriteGenre).not.toBe('All');
  });

  it('nicht existierendes Pet → null', async () => {
    const { getUserPet } = await load();
    expect(await getUserPet('u1', 'nope')).toBeNull();
  });
});

describe('getActivePetId / setActivePetId', () => {
  it('liest und schreibt die aktive Pet-Id', async () => {
    const { getActivePetId, setActivePetId } = await load();
    expect(await getActivePetId('u1')).toBeNull();
    await setActivePetId('u1', 'petA');
    expect(await getActivePetId('u1')).toBe('petA');
  });
});

describe('canCreateNewPet', () => {
  it('keine Pets → false', async () => {
    const { canCreateNewPet } = await load();
    expect(await canCreateNewPet('u1')).toBe(false);
  });

  it('Pet unter dem Level-Requirement → false', async () => {
    seedPet('u1', 'petA', { level: 3 });
    const { canCreateNewPet } = await load();
    expect(await canCreateNewPet('u1')).toBe(false);
  });

  it('alle Pets >= Level 15 → true', async () => {
    seedPet('u1', 'petA', { level: 15 });
    seedPet('u1', 'petB', { level: 20 });
    const { canCreateNewPet } = await load();
    expect(await canCreateNewPet('u1')).toBe(true);
  });
});

describe('createPet', () => {
  it('erstellt ein Pet mit Startwerten und setzt es aktiv', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0));
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { createPet } = await load();
    const pet = await createPet('u1', 'Bello', 'dog');

    expect(pet.name).toBe('Bello');
    expect(pet.type).toBe('dog');
    expect(pet.level).toBe(1);
    expect(pet.hunger).toBe(50); // INITIAL_HUNGER
    expect(pet.happiness).toBe(75); // INITIAL_HAPPINESS
    expect(pet.isAlive).toBe(true);
    expect((pet.accessories ?? []).map((a) => a.id)).toEqual(['beanie', 'bow', 'roundGlasses']);
    // persistiert + aktiv gesetzt
    expect(fb.getAt(`users/u1/pets/${pet.id}`)).toBeDefined();
    expect(fb.getAt('users/u1/petWidget/activePetId')).toBe(pet.id);

    vi.useRealTimers();
  });
});

describe('deletePet', () => {
  it('entfernt das Pet', async () => {
    seedPet('u1', 'petA');
    const { deletePet } = await load();
    await deletePet('u1', 'petA');
    expect(fb.getAt('users/u1/pets/petA')).toBeUndefined();
  });
});

describe('Widget-Position', () => {
  it('save + get roundtrip', async () => {
    const { savePetWidgetPosition, getPetWidgetPosition } = await load();
    const pos = { edge: 'top-left' as const, offsetX: 10, offsetY: 20 };
    await savePetWidgetPosition('u1', pos);
    expect(await getPetWidgetPosition('u1')).toEqual(pos);
  });

  it('keine Position → null', async () => {
    const { getPetWidgetPosition } = await load();
    expect(await getPetWidgetPosition('u1')).toBeNull();
  });

  it('Firebase-Fehler beim Lesen → null (catch-Zweig)', async () => {
    fb.throwOn.add('users/u1/petWidget/position');
    const { getPetWidgetPosition } = await load();
    expect(await getPetWidgetPosition('u1')).toBeNull();
  });

  it('Firebase-Fehler beim Speichern wird geschluckt (catch-Zweig)', async () => {
    fb.throwOn.add('users/u1/petWidget/position');
    const { savePetWidgetPosition } = await load();
    await expect(
      savePetWidgetPosition('u1', { edge: 'top-left', offsetX: 0, offsetY: 0 })
    ).resolves.toBeUndefined();
  });
});
