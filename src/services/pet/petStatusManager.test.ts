import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PET_CONFIG } from './petConstants';

// Nested-Path Firebase-Mock (Baum-Struktur), damit .update()/.remove()/.once()
// realistisch geschachtelt arbeiten.
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
  const makeRef = (p: string) => ({
    once: async () => {
      const v = getAt(p);
      return { val: () => (v === undefined ? null : v), exists: () => v != null };
    },
    set: async (v: unknown) => setAt(p, v),
    update: async (obj: Record<string, unknown>) => {
      for (const [k, val] of Object.entries(obj)) setAt(`${p}/${k}`, val);
    },
    remove: async () => removeAt(p),
  });
  return {
    ref: (p: string) => makeRef(p),
    getAt,
    setAt,
    reset: () => {
      root = {};
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
  feedPet,
  playWithPet,
  updatePetStatus,
  updateAllPetsStatus,
  revivePet,
  activateStreakShield,
} from './petStatusManager';

const NOW = new Date(2026, 6, 4, 12, 0, 0); // 04.07.2026 12:00 lokal
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

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
    lastFed: new Date(NOW),
    lastUpdated: new Date(NOW),
    episodesWatched: 0,
    createdAt: new Date(NOW),
    isAlive: true,
    reviveCount: 0,
    ...overrides,
  } as Pet;
}

beforeEach(() => {
  fb.reset();
  petCore.getUserPet.mockReset();
  petCore.getUserPets.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('feedPet', () => {
  it('kein Pet → null', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await feedPet('u1', 'p1')).toBeNull();
  });

  it('totes Pet bleibt unveraendert', async () => {
    const pet = makePet({ isAlive: false, hunger: 90 });
    petCore.getUserPet.mockResolvedValue(pet);
    const result = await feedPet('u1', 'p1');
    expect(result?.hunger).toBe(90);
  });

  it('senkt Hunger (-30, min 0) und hebt Happiness (+10, max 100)', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ hunger: 20, happiness: 95 }));
    const result = await feedPet('u1', 'p1');
    expect(result?.hunger).toBe(0); // max(0, 20-30)
    expect(result?.happiness).toBe(100); // min(100, 95+10)
    expect((fb.getAt('users/u1/pets/p1') as Record<string, unknown>).hunger).toBe(0);
  });
});

describe('playWithPet', () => {
  it('hebt Happiness (+20) und Hunger (+10), beide gedeckelt', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ hunger: 95, happiness: 90 }));
    const result = await playWithPet('u1', 'p1');
    expect(result?.happiness).toBe(100); // min(100, 90+20)
    expect(result?.hunger).toBe(100); // min(100, 95+10)
  });

  it('totes Pet unveraendert', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ isAlive: false, happiness: 10 }));
    const result = await playWithPet('u1', 'p1');
    expect(result?.happiness).toBe(10);
  });
});

describe('updatePetStatus — Decay', () => {
  it('unter einem Alterungsschritt (3 h) → keine Aenderung, kein Write', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({ lastUpdated: new Date(NOW.getTime() - 2 * HOUR), hunger: 10, happiness: 90 })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.hunger).toBe(10);
    expect(result?.happiness).toBe(90);
    expect(fb.getAt('users/u1/pets/p1/lastUpdated')).toBeUndefined();
  });

  it('10 Stunden: drei Schritte, die angebrochene Stunde bleibt liegen', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        lastUpdated: new Date(NOW.getTime() - 10 * HOUR),
        lastFed: new Date(NOW.getTime() - 10 * HOUR),
        hunger: 0,
        happiness: 100,
      })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.hunger).toBe(6);
    expect(result?.happiness).toBe(97);
    expect(result?.isAlive).toBe(true);
    expect(fb.getAt('users/u1/pets/p1/lastUpdated')).toBe(
      new Date(NOW.getTime() - HOUR).toISOString()
    );
  });

  it('halbstuendliche Updates bei offener App verlieren keine Zeit', async () => {
    const pet = makePet({ hunger: 0, happiness: 100 });
    petCore.getUserPet.mockResolvedValue(pet);
    for (let i = 1; i <= 12; i++) {
      vi.setSystemTime(new Date(NOW.getTime() + i * 30 * 60 * 1000));
      await updatePetStatus('u1', 'p1');
    }
    expect(pet.hunger).toBe(4);
    expect(pet.happiness).toBe(98);
  });

  it('frisches Pet ueberlebt 5 Tage ohne Futter und Spielen', async () => {
    const pet = makePet({
      hunger: PET_CONFIG.INITIAL_HUNGER,
      happiness: PET_CONFIG.INITIAL_HAPPINESS,
      lastUpdated: new Date(NOW.getTime() - 5 * DAY + HOUR),
      lastFed: new Date(NOW.getTime() - 5 * DAY + HOUR),
    });
    petCore.getUserPet.mockResolvedValue(pet);
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.isAlive).toBe(true);
  });

  it('wiederbelebtes Pet ueberlebt knapp 5 Tage ohne Futter und Spielen', async () => {
    const pet = makePet({
      hunger: PET_CONFIG.REVIVAL_HUNGER,
      happiness: PET_CONFIG.REVIVAL_HAPPINESS,
      lastUpdated: new Date(NOW.getTime() - 5 * DAY + 4 * HOUR),
      lastFed: new Date(NOW.getTime() - 5 * DAY + 4 * HOUR),
    });
    petCore.getUserPet.mockResolvedValue(pet);
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.isAlive).toBe(true);
  });

  it('satt gefuettertes Pet verhungert nach gut 6 Tagen', async () => {
    const pet = makePet({
      hunger: 0,
      happiness: 100,
      lastUpdated: new Date(NOW.getTime() - 6 * DAY),
      lastFed: new Date(NOW.getTime() - 6 * DAY),
    });
    petCore.getUserPet.mockResolvedValue(pet);
    expect((await updatePetStatus('u1', 'p1'))?.isAlive).toBe(true);

    vi.setSystemTime(new Date(NOW.getTime() + 7 * HOUR));
    const later = await updatePetStatus('u1', 'p1');
    expect(later?.isAlive).toBe(false);
    expect(later?.deathCause).toBe('hunger');
  });

  it('ausgeschaltetes Pet: ein Jahr Pause, kein Decay, kein Write', async () => {
    fb.setAt('users/u1/petWidget/enabled', false);
    petCore.getUserPet.mockResolvedValue(
      makePet({
        lastUpdated: new Date(NOW.getTime() - 365 * 24 * HOUR),
        lastFed: new Date(NOW.getTime() - 365 * 24 * HOUR),
        hunger: 20,
        happiness: 80,
      })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.hunger).toBe(20);
    expect(result?.happiness).toBe(80);
    expect(result?.isAlive).toBe(true);
    expect(fb.getAt('users/u1/pets/p1/lastUpdated')).toBeUndefined();
  });

  it('sehr hoher Hunger (>80) zieht je Schritt zusaetzlich Happiness ab', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        lastUpdated: new Date(NOW.getTime() - 6 * HOUR),
        lastFed: new Date(NOW.getTime() - 6 * HOUR),
        hunger: 85,
        happiness: 50,
      })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.hunger).toBe(89);
    expect(result?.happiness).toBe(46);
  });

  it('ungueltiges lastFed → Reset auf Hunger 50', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        lastUpdated: new Date(NOW.getTime() - 5 * HOUR),
        lastFed: new Date('invalid'),
      })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.hunger).toBe(50);
    expect(result?.isAlive).toBe(true);
    expect(fb.getAt('users/u1/pets/p1/lastFed')).toBe(NOW.toISOString());
  });
});

describe('updatePetStatus — Tod', () => {
  it('Hunger >= 100 → Tod durch hunger', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        lastUpdated: new Date(NOW.getTime() - 9 * HOUR),
        lastFed: new Date(NOW.getTime() - 9 * HOUR),
        hunger: 95,
        happiness: 100,
      })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.isAlive).toBe(false);
    expect(result?.deathCause).toBe('hunger');
    expect((fb.getAt('users/u1/pets/p1') as Record<string, unknown>).isAlive).toBe(false);
  });

  it('Happiness <= 0 → Tod durch sadness', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        lastUpdated: new Date(NOW.getTime() - 9 * HOUR),
        lastFed: new Date(NOW.getTime() - 9 * HOUR),
        hunger: 0,
        happiness: 3,
      })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.isAlive).toBe(false);
    expect(result?.deathCause).toBe('sadness');
  });

  it('lange nicht gefuettert (>= 14 Tage) → Tod durch neglect', async () => {
    petCore.getUserPet.mockResolvedValue(
      makePet({
        lastUpdated: new Date(NOW.getTime() - 2 * HOUR),
        lastFed: new Date(NOW.getTime() - 15 * DAY),
        hunger: 0,
        happiness: 100,
      })
    );
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.isAlive).toBe(false);
    expect(result?.deathCause).toBe('neglect');
  });

  it('totes Pet wird nicht weiter verarbeitet', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ isAlive: false, hunger: 20 }));
    const result = await updatePetStatus('u1', 'p1');
    expect(result?.hunger).toBe(20);
  });

  it('kein Pet → null', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await updatePetStatus('u1', 'p1')).toBeNull();
  });
});

describe('updateAllPetsStatus', () => {
  it('aktualisiert jedes Pet und sammelt die Ergebnisse', async () => {
    const p1 = makePet({ id: 'p1' });
    const p2 = makePet({ id: 'p2' });
    petCore.getUserPets.mockResolvedValue([p1, p2]);
    petCore.getUserPet.mockImplementation(async (_u: string, id: string) =>
      id === 'p1' ? p1 : p2
    );
    const result = await updateAllPetsStatus('u1');
    expect(result).toHaveLength(2);
  });
});

describe('revivePet', () => {
  it('lebendes Pet → keine Wiederbelebung', async () => {
    const pet = makePet({ isAlive: true });
    petCore.getUserPet.mockResolvedValue(pet);
    const result = await revivePet('u1', 'p1');
    expect(result).toBe(pet);
    expect(result?.reviveCount).toBe(0);
  });

  it('totes Pet: setzt Werte, Level-Penalty, reviveCount++, entfernt Todesfelder', async () => {
    fb.setAt('users/u1/pets/p1', { deathTime: 'x', deathCause: 'hunger' });
    petCore.getUserPet.mockResolvedValue(
      makePet({ isAlive: false, level: 5, experience: 30, reviveCount: 1 })
    );
    const result = await revivePet('u1', 'p1');
    expect(result?.isAlive).toBe(true);
    expect(result?.hunger).toBe(PET_CONFIG.REVIVAL_HUNGER);
    expect(result?.happiness).toBe(PET_CONFIG.REVIVAL_HAPPINESS);
    expect(result?.level).toBe(4); // 5 - 1
    expect(result?.experience).toBe(300); // (4-1)*100
    expect(result?.reviveCount).toBe(2);
    const stored = fb.getAt('users/u1/pets/p1') as Record<string, unknown>;
    expect(stored.deathTime).toBeUndefined();
    expect(stored.deathCause).toBeUndefined();
  });

  it('Level 1 bleibt Level 1 (keine Penalty unter Level 2)', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ isAlive: false, level: 1, experience: 40 }));
    const result = await revivePet('u1', 'p1');
    expect(result?.level).toBe(1);
    expect(result?.experience).toBe(40); // unveraendert
  });

  it('kein Pet → null', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    expect(await revivePet('u1', 'p1')).toBeNull();
  });
});

describe('activateStreakShield', () => {
  it('kein Pet → Fehler', async () => {
    petCore.getUserPet.mockResolvedValue(null);
    const result = await activateStreakShield('u1', 'p1');
    expect(result.success).toBe(false);
  });

  it('totes Pet → Fehler', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ isAlive: false }));
    const result = await activateStreakShield('u1', 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('lebt nicht');
  });

  it('zu wenig XP → Fehler mit XP-Angabe', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ level: 1, experience: 10 }));
    const result = await activateStreakShield('u1', 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('10 XP');
  });

  it('genug XP: zieht 50 XP + 10 Happiness ab', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ level: 1, experience: 100, happiness: 30 }));
    const result = await activateStreakShield('u1', 'p1');
    expect(result.success).toBe(true);
    expect(result.newLevel).toBe(1);
    expect(result.newExperience).toBe(50); // 100 - 50
    const stored = fb.getAt('users/u1/pets/p1') as Record<string, unknown>;
    expect(stored.happiness).toBe(20); // 30 - 10
  });

  it('XP-Kosten fuehren zu Level-Down', async () => {
    petCore.getUserPet.mockResolvedValue(makePet({ level: 3, experience: 20, happiness: 50 }));
    const result = await activateStreakShield('u1', 'p1');
    // 20 - 50 = -30 → Level 3→2, +2*100 → 170
    expect(result.success).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.newExperience).toBe(170);
  });

  it('aktualisiert vorhandene Streak-Daten (shieldUsedCount++)', async () => {
    const year = NOW.getFullYear();
    fb.setAt(`users/u1/wrapped/${year}/streak`, {
      lastWatchDate: '2026-07-04',
      shieldUsedCount: 2,
    });
    petCore.getUserPet.mockResolvedValue(makePet({ level: 1, experience: 100 }));
    await activateStreakShield('u1', 'p1');
    const streak = fb.getAt(`users/u1/wrapped/${year}/streak`) as Record<string, unknown>;
    expect(streak.shieldUsedCount).toBe(3);
    expect(streak.lastWatchDate).toBe('2026-07-03'); // gestern
    expect(streak.lastShieldUsedDate).toBe('2026-07-04'); // heute
  });

  it('unerwarteter Fehler → success:false (catch-Zweig)', async () => {
    petCore.getUserPet.mockRejectedValue(new Error('boom'));
    const result = await activateStreakShield('u1', 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unbekannter Fehler');
  });
});
