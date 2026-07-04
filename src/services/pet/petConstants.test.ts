import { describe, expect, it } from 'vitest';
import { PET_CONFIG } from './petConstants';

// petConstants ist reine Konfiguration — die Tests sichern die Invarianten ab,
// auf die sich die restliche Pet-Logik verlaesst (Summen, Schwellen-Ordnung,
// Wertebereiche). Ein versehentlicher Zahlendreher wuerde hier auffallen.

describe('PET_CONFIG — Grundwerte', () => {
  it('XP pro Level ist 100 (Basis der Level-Schleifen)', () => {
    expect(PET_CONFIG.XP_PER_LEVEL).toBe(100);
  });

  it('Initialwerte liegen im 0..100-Band', () => {
    for (const v of [
      PET_CONFIG.INITIAL_HUNGER,
      PET_CONFIG.INITIAL_HAPPINESS,
      PET_CONFIG.REVIVAL_HUNGER,
      PET_CONFIG.REVIVAL_HAPPINESS,
    ]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('Genre-Match gibt mehr XP als die Basis', () => {
    expect(PET_CONFIG.GENRE_MATCH_XP_PER_EPISODE).toBeGreaterThan(PET_CONFIG.BASE_XP_PER_EPISODE);
  });

  it('Healthy-XP-Multiplikator ist > 1 (Bonus, keine Strafe)', () => {
    expect(PET_CONFIG.HEALTHY_XP_MULTIPLIER).toBeGreaterThan(1);
  });
});

describe('PET_CONFIG — Death-/Status-Schwellen', () => {
  it('Hunger-Tod bei 100, Happiness-Tod bei 0', () => {
    expect(PET_CONFIG.HUNGER_DEATH_THRESHOLD).toBe(100);
    expect(PET_CONFIG.HAPPINESS_DEATH_THRESHOLD).toBe(0);
  });

  it('High-Hunger-Schwelle liegt unter der Todes-Schwelle', () => {
    expect(PET_CONFIG.HIGH_HUNGER_THRESHOLD).toBeLessThan(PET_CONFIG.HUNGER_DEATH_THRESHOLD);
  });

  it('Widget-Status-Schwellen sind aufsteigend geordnet', () => {
    expect(PET_CONFIG.STATUS_GOOD_HUNGER).toBeLessThan(PET_CONFIG.STATUS_WARNING_HUNGER);
    expect(PET_CONFIG.STATUS_WARNING_HUNGER).toBeLessThan(PET_CONFIG.STATUS_CRITICAL_HUNGER);
  });

  it('Neglect-Schwelle ist eine positive Tageszahl', () => {
    expect(PET_CONFIG.NEGLECT_DAYS_THRESHOLD).toBeGreaterThan(0);
  });
});

describe('PET_CONFIG — Achievements & Accessoires', () => {
  it('Color-Achievement-Schwellen sind streng aufsteigend', () => {
    expect(PET_CONFIG.SILVER_COLOR_SERIES_THRESHOLD).toBeLessThan(
      PET_CONFIG.GOLD_COLOR_SERIES_THRESHOLD
    );
    expect(PET_CONFIG.GOLD_COLOR_SERIES_THRESHOLD).toBeLessThan(
      PET_CONFIG.RAINBOW_COLOR_SERIES_THRESHOLD
    );
  });

  it('Sonnenbrillen-Monate sind Sommermonate', () => {
    expect(PET_CONFIG.SUNGLASSES_MONTHS).toEqual([6, 7, 8]);
  });

  it('Santa-Hat-Monat ist Dezember', () => {
    expect(PET_CONFIG.SANTA_HAT_MONTH).toBe(12);
  });
});

describe('PET_CONFIG — Drops', () => {
  it('Drop-Chance liegt zwischen 0 und 1', () => {
    expect(PET_CONFIG.DROP_CHANCE_PER_EPISODE).toBeGreaterThan(0);
    expect(PET_CONFIG.DROP_CHANCE_PER_EPISODE).toBeLessThan(1);
  });

  it('Rarity-Gewichte summieren sich zu 100', () => {
    const w = PET_CONFIG.RARITY_WEIGHTS;
    const sum = w.common + w.uncommon + w.rare + w.epic + w.legendary;
    expect(sum).toBe(100);
  });

  it('Seltenere Rarities haben kleinere Gewichte', () => {
    const w = PET_CONFIG.RARITY_WEIGHTS;
    expect(w.common).toBeGreaterThan(w.uncommon);
    expect(w.uncommon).toBeGreaterThan(w.rare);
    expect(w.rare).toBeGreaterThan(w.epic);
    expect(w.epic).toBeGreaterThan(w.legendary);
  });
});

describe('PET_CONFIG — Streak Shield', () => {
  it('Kosten und Cooldown sind positiv', () => {
    expect(PET_CONFIG.STREAK_SHIELD_XP_COST).toBeGreaterThan(0);
    expect(PET_CONFIG.STREAK_SHIELD_HAPPINESS_COST).toBeGreaterThan(0);
    expect(PET_CONFIG.STREAK_SHIELD_COOLDOWN_DAYS).toBeGreaterThan(0);
  });
});
