import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PetMoodService, petMoodService } from './petMoodService';
import type { Pet } from '../../types/pet.types';

// petMoodService ist rein: keine Firebase, nur Date + Pet-Zustand.
// Zeit wird ueber Fake-Timers deterministisch gemacht.

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
    ...overrides,
  } as Pet;
}

// Lokale Zeit setzen (Konstruktor mit Einzelkomponenten = lokale TZ).
function setLocal(y: number, mZeroBased: number, d: number, h = 12, min = 0) {
  vi.setSystemTime(new Date(y, mZeroBased, d, h, min, 0));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getMoodByTimeOfDay', () => {
  const svc = new PetMoodService();

  it('06:00–10:00 → sleepy', () => {
    setLocal(2026, 5, 15, 8);
    expect(svc.getMoodByTimeOfDay()).toBe('sleepy');
  });

  it('10:00–14:00 → playful', () => {
    setLocal(2026, 5, 15, 11);
    expect(svc.getMoodByTimeOfDay()).toBe('playful');
  });

  it('14:00–17:00 → happy', () => {
    setLocal(2026, 5, 15, 15);
    expect(svc.getMoodByTimeOfDay()).toBe('happy');
  });

  it('17:00–20:00 → excited', () => {
    setLocal(2026, 5, 15, 18);
    expect(svc.getMoodByTimeOfDay()).toBe('excited');
  });

  it('20:00–23:00 → loved', () => {
    setLocal(2026, 5, 15, 21);
    expect(svc.getMoodByTimeOfDay()).toBe('loved');
  });

  it('nachts (23:00 / 02:00) → sleepy', () => {
    setLocal(2026, 5, 15, 23);
    expect(svc.getMoodByTimeOfDay()).toBe('sleepy');
    setLocal(2026, 5, 15, 2);
    expect(svc.getMoodByTimeOfDay()).toBe('sleepy');
  });
});

describe('getMoodByHoliday', () => {
  const svc = new PetMoodService();

  it('Weihnachten (24.12.) → festive', () => {
    setLocal(2026, 11, 24);
    expect(svc.getMoodByHoliday()).toBe('festive');
  });

  it('Silvester (31.12.) und Neujahr (01.01.) → excited', () => {
    setLocal(2026, 11, 31);
    expect(svc.getMoodByHoliday()).toBe('excited');
    setLocal(2026, 0, 1);
    expect(svc.getMoodByHoliday()).toBe('excited');
  });

  it('Valentinstag (14.02.) → loved', () => {
    setLocal(2026, 1, 14);
    expect(svc.getMoodByHoliday()).toBe('loved');
  });

  it('Halloween (31.10.) → scared', () => {
    setLocal(2026, 9, 31);
    expect(svc.getMoodByHoliday()).toBe('scared');
  });

  it('Osterfenster (05.04.) → playful', () => {
    setLocal(2026, 3, 5);
    expect(svc.getMoodByHoliday()).toBe('playful');
  });

  it('gewoehnlicher Tag → null', () => {
    setLocal(2026, 5, 15);
    expect(svc.getMoodByHoliday()).toBeNull();
  });
});

describe('getMoodByWeather', () => {
  const svc = new PetMoodService();

  it('ohne Temperatur → null', () => {
    expect(svc.getMoodByWeather()).toBeNull();
  });

  it('Temperatur 0 ist falsy → null (kein Wetter-Mood)', () => {
    expect(svc.getMoodByWeather(0)).toBeNull();
  });

  it('> 30° → sleepy', () => {
    expect(svc.getMoodByWeather(35)).toBe('sleepy');
  });

  it('< 0° → scared', () => {
    expect(svc.getMoodByWeather(-5)).toBe('scared');
  });

  it('20–25° → happy', () => {
    expect(svc.getMoodByWeather(22)).toBe('happy');
  });

  it('lauwarm ausserhalb der Baender → null', () => {
    expect(svc.getMoodByWeather(15)).toBeNull();
  });
});

describe('calculateCurrentMood — Prioritaeten', () => {
  const svc = new PetMoodService();

  it('totes Pet → sad (hoechste Prioritaet)', () => {
    setLocal(2026, 11, 24); // selbst an Weihnachten
    expect(svc.calculateCurrentMood(makePet({ isAlive: false }))).toBe('sad');
  });

  it('Hunger > 80 → hungry', () => {
    setLocal(2026, 5, 15, 15);
    expect(svc.calculateCurrentMood(makePet({ hunger: 90, happiness: 90 }))).toBe('hungry');
  });

  it('Happiness < 20 → sad', () => {
    setLocal(2026, 5, 15, 15);
    expect(svc.calculateCurrentMood(makePet({ hunger: 10, happiness: 10 }))).toBe('sad');
  });

  it('Feiertag schlaegt Tageszeit (Weihnachten → festive)', () => {
    setLocal(2026, 11, 24, 15);
    expect(svc.calculateCurrentMood(makePet({ hunger: 40, happiness: 50 }))).toBe('festive');
  });

  it('Happiness > 80 ohne Feiertag → loved', () => {
    setLocal(2026, 5, 15, 11);
    expect(svc.calculateCurrentMood(makePet({ hunger: 30, happiness: 90 }))).toBe('loved');
  });

  it('Standard → Tageszeit-Mood', () => {
    setLocal(2026, 5, 15, 11); // playful-Fenster
    expect(svc.calculateCurrentMood(makePet({ hunger: 30, happiness: 60 }))).toBe('playful');
  });
});

describe('getMoodEmoji', () => {
  const svc = new PetMoodService();

  it('mappt jede bekannte Stimmung auf ein Emoji', () => {
    const moods: NonNullable<Pet['mood']>[] = [
      'happy',
      'sad',
      'excited',
      'sleepy',
      'hungry',
      'playful',
      'festive',
      'scared',
      'loved',
    ];
    for (const m of moods) {
      expect(svc.getMoodEmoji(m)).toBeTruthy();
    }
  });

  it('undefined → Default-Emoji 😊', () => {
    expect(svc.getMoodEmoji(undefined)).toBe('😊');
  });
});

describe('getMoodAnimation', () => {
  const svc = new PetMoodService();

  it('liefert fuer jede Stimmung ein Animations-Objekt', () => {
    const moods: NonNullable<Pet['mood']>[] = [
      'happy',
      'sad',
      'excited',
      'sleepy',
      'hungry',
      'playful',
      'festive',
      'scared',
      'loved',
    ];
    for (const m of moods) {
      const anim = svc.getMoodAnimation(m);
      expect(typeof anim).toBe('object');
      expect(Object.keys(anim).length).toBeGreaterThan(0);
    }
  });

  it('undefined faellt auf die happy-Animation zurueck', () => {
    expect(svc.getMoodAnimation(undefined)).toEqual(svc.getMoodAnimation('happy'));
  });
});

describe('Singleton-Export', () => {
  it('petMoodService ist eine PetMoodService-Instanz', () => {
    expect(petMoodService).toBeInstanceOf(PetMoodService);
  });
});
