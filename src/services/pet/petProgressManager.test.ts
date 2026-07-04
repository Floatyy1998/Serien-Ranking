import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';

// Firebase-Mock nur zum Aufzeichnen der .update()-Aufrufe. Die eigentliche
// XP-/Level-Logik wird ueber das (mutierte) Rueckgabe-Pet geprueft.
const fb = vi.hoisted(() => {
  const updates: { path: string; data: Record<string, unknown> }[] = [];
  return {
    updates,
    ref: (path: string) => ({
      update: async (data: Record<string, unknown>) => {
        updates.push({ path, data });
      },
    }),
    reset: () => {
      updates.length = 0;
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

// petCore, dailySpin, Reaktionen, Accessoires werden gemockt.
const petCore = vi.hoisted(() => ({
  getUserPet: vi.fn(),
  getUserPets: vi.fn(),
}));
vi.mock('./petCore', () => petCore);

const daily = vi.hoisted(() => ({
  getActiveXpBoost: vi.fn<() => Promise<{ multiplier: number; remainingEpisodes: number } | null>>(
    async () => null
  ),
  consumeXpBoostEpisode: vi.fn(async () => {}),
}));
vi.mock('./dailySpinService', () => daily);

const acc = vi.hoisted(() => ({
  checkAndUnlockAccessories: vi.fn(async () => {}),
  checkAchievements: vi.fn(async () => {}),
  rollAccessoryDrop: vi.fn<
    () => Promise<{
      dropId: string;
      accessoryId: string;
      name: string;
      icon: string;
      rarity: string;
    } | null>
  >(async () => null),
}));
vi.mock('./petAccessoryManager', () => acc);

const reactions = vi.hoisted(() => ({ triggerPetReaction: vi.fn() }));
vi.mock('../../hooks/usePetReactions', () => reactions);

import {
  watchedEpisode,
  watchedSeriesWithGenre,
  watchedSeriesWithGenreAllPets,
} from './petProgressManager';

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    userId: 'u1',
    name: 'Rex',
    type: 'dog',
    color: 'rot',
    level: 1,
    experience: 0,
    hunger: 60,
    happiness: 50,
    lastFed: new Date(),
    episodesWatched: 0,
    createdAt: new Date(),
    isAlive: true,
    totalSeriesWatched: 0,
    favoriteGenre: 'Comedy',
    ...overrides,
  } as Pet;
}

beforeEach(() => {
  fb.reset();
  petCore.getUserPet.mockReset();
  petCore.getUserPets.mockReset();
  daily.getActiveXpBoost.mockReset().mockResolvedValue(null);
  daily.consumeXpBoostEpisode.mockReset().mockResolvedValue(undefined);
  acc.checkAndUnlockAccessories.mockReset().mockResolvedValue(undefined);
  acc.checkAchievements.mockReset().mockResolvedValue(undefined);
  acc.rollAccessoryDrop.mockReset().mockResolvedValue(null);
  reactions.triggerPetReaction.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('watchedEpisode', () => {
  it('kein Pet → null', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await watchedEpisode('u1', 'p1')).toBeNull();
  });

  it('totes Pet bleibt unveraendert', async () => {
    const pet = makePet({ isAlive: false, experience: 0 });
    petCore.getUserPet.mockResolvedValue(pet);
    const result = await watchedEpisode('u1', 'p1');
    expect(result?.experience).toBe(0);
    expect(fb.updates).toHaveLength(0);
  });

  it('vergibt +10 XP ohne Level-Up', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ level: 1, experience: 0 }));
    const result = await watchedEpisode('u1', 'p1');
    expect(result?.experience).toBe(10);
    expect(result?.level).toBe(1);
    expect(result?.episodesWatched).toBe(1);
    // happiness/hunger werden ohne Level-Up nicht geschrieben
    expect(fb.updates[0].data).not.toHaveProperty('happiness');
  });

  it('Level-Up bei Ueberschreiten der Schwelle: Rest-XP, happiness=100, hunger=0', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ level: 1, experience: 95, happiness: 40 }));
    const result = await watchedEpisode('u1', 'p1');
    // 95 + 10 = 105 → -100 → Level 2, Rest 5
    expect(result?.level).toBe(2);
    expect(result?.experience).toBe(5);
    expect(result?.happiness).toBe(100);
    expect(result?.hunger).toBe(0);
    expect(fb.updates[0].data).toMatchObject({ happiness: 100, hunger: 0 });
  });
});

describe('watchedSeriesWithGenre', () => {
  it('kein/totes Pet → gibt Pet (oder null) unveraendert zurueck', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await watchedSeriesWithGenre('u1', 'p1', ['Comedy'])).toBeNull();

    const dead = makePet({ isAlive: false });
    petCore.getUserPet.mockResolvedValue(dead);
    const result = await watchedSeriesWithGenre('u1', 'p1', ['Comedy']);
    expect(result).toBe(dead);
    expect(fb.updates).toHaveLength(0);
  });

  it('kein Genre-Match, ungesund, kein Boost → nur Basis-XP (10)', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({ favoriteGenre: 'Western', hunger: 60, happiness: 50, experience: 0 })
    );
    const result = await watchedSeriesWithGenre('u1', 'p1', ['Drama']);
    expect(result?.experience).toBe(10);
    expect(result?.totalSeriesWatched).toBe(1);
  });

  it('Genre-Match (via Alias komoedie) → 20 XP + Happiness-Bonus', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({ favoriteGenre: 'Comedy', hunger: 60, happiness: 50, experience: 0 })
    );
    const result = await watchedSeriesWithGenre('u1', 'p1', ['Komoedie']);
    expect(result?.experience).toBe(20);
    expect(result?.happiness).toBe(55); // 50 + 5
    // Happiness wird bei Genre-Match geschrieben
    expect(fb.updates[0].data).toMatchObject({ happiness: 55 });
  });

  it('gesundes Pet (Hunger<50, Happiness>50) → 1.5x XP-Bonus', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({ favoriteGenre: 'Western', hunger: 40, happiness: 60, experience: 0 })
    );
    const result = await watchedSeriesWithGenre('u1', 'p1', ['Drama']);
    // kein Match → 10, gesund → floor(10*1.5)=15
    expect(result?.experience).toBe(15);
  });

  it('aktiver XP-Boost multipliziert die XP', async () => {
    daily.getActiveXpBoost.mockResolvedValue({ multiplier: 3, remainingEpisodes: 2 });
    petCore.getUserPet.mockResolvedValue(
      makePet({ favoriteGenre: 'Western', hunger: 60, happiness: 50, experience: 0 })
    );
    const result = await watchedSeriesWithGenre('u1', 'p1', []);
    // kein Match (leere Genres) → 10, ungesund, Boost 3 → floor(30)=30
    expect(result?.experience).toBe(30);
    // Verbrauch passiert NICHT hier (nur in ...AllPets)
    expect(daily.consumeXpBoostEpisode).not.toHaveBeenCalled();
  });

  it('Level-Up loest Accessory-Check + Level-Up-Reaktion aus', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({ level: 1, experience: 90, favoriteGenre: 'Comedy', hunger: 40, happiness: 60 })
    );
    const result = await watchedSeriesWithGenre('u1', 'p1', ['Comedy']);
    // Match → 20, happiness 65, gesund → floor(20*1.5)=30 → 90+30=120 → Level 2, Rest 20
    expect(result?.level).toBe(2);
    expect(result?.experience).toBe(20);
    expect(result?.happiness).toBe(100);
    expect(result?.hunger).toBe(0);
    expect(acc.checkAndUnlockAccessories).toHaveBeenCalledOnce();
    expect(reactions.triggerPetReaction).toHaveBeenCalledWith({
      tone: 'levelup',
      vars: { n: 2 },
    });
  });

  it('checkAchievements wird immer aufgerufen', async () => {
    petCore.getUserPet.mockResolvedValue(makePet());
    await watchedSeriesWithGenre('u1', 'p1', ['Drama']);
    expect(acc.checkAchievements).toHaveBeenCalledOnce();
  });
});

describe('watchedSeriesWithGenreAllPets', () => {
  it('vergibt XP nur an lebende Pets, verbraucht Boost einmal, rollt Drop', async () => {
    const alive = makePet({ id: 'p1', isAlive: true });
    const dead = makePet({ id: 'p2', isAlive: false });
    petCore.getUserPets.mockResolvedValue([alive, dead]);
    petCore.getUserPet.mockImplementation(async (_u: string, id: string) =>
      id === 'p1' ? alive : dead
    );
    daily.getActiveXpBoost.mockResolvedValue({ multiplier: 2, remainingEpisodes: 3 });
    const drop = { dropId: 'd1', accessoryId: 'beanie', name: 'x', icon: 'y', rarity: 'common' };
    acc.rollAccessoryDrop.mockResolvedValue(drop);

    const result = await watchedSeriesWithGenreAllPets('u1', ['Drama']);

    // getUserPet nur fuer das lebende Pet (aus watchedSeriesWithGenre)
    expect(petCore.getUserPet).toHaveBeenCalledWith('u1', 'p1');
    expect(petCore.getUserPet).not.toHaveBeenCalledWith('u1', 'p2');
    // Boost genau einmal verbraucht (pro Episode, nicht pro Pet)
    expect(daily.consumeXpBoostEpisode).toHaveBeenCalledOnce();
    expect(result).toBe(drop);
  });

  it('ohne aktiven Boost wird nichts verbraucht', async () => {
    petCore.getUserPets.mockResolvedValue([]);
    daily.getActiveXpBoost.mockResolvedValue(null);
    const result = await watchedSeriesWithGenreAllPets('u1', ['Drama']);
    expect(daily.consumeXpBoostEpisode).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
