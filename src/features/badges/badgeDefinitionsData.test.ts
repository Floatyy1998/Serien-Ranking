import { describe, expect, it } from 'vitest';
import { BADGE_DEFINITIONS } from './badgeDefinitionsData';
import type { BadgeCategory, BadgeTier } from './badgeDefinitions';

const VALID_CATEGORIES: BadgeCategory[] = [
  'binge',
  'quickwatch',
  'marathon',
  'streak',
  'rewatch',
  'series_explorer',
  'collector',
  'social',
];
const VALID_TIERS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary'];

// Primäre Schwellen-Metrik je Kategorie (für Monotonie-Prüfung).
const PRIMARY_METRIC: Record<BadgeCategory, keyof (typeof BADGE_DEFINITIONS)[0]['requirements']> = {
  binge: 'episodes',
  quickwatch: 'episodes',
  marathon: 'episodes',
  rewatch: 'episodes',
  streak: 'days',
  series_explorer: 'series',
  collector: 'ratings',
  social: 'friends',
};

describe('BADGE_DEFINITIONS Integrität', () => {
  it('ist ein nicht-leeres Array', () => {
    expect(Array.isArray(BADGE_DEFINITIONS)).toBe(true);
    expect(BADGE_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it('alle IDs sind eindeutig', () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('jede Definition hat alle Pflichtfelder', () => {
    for (const b of BADGE_DEFINITIONS) {
      expect(typeof b.id).toBe('string');
      expect(b.id.length).toBeGreaterThan(0);
      expect(typeof b.name).toBe('string');
      expect(b.name.length).toBeGreaterThan(0);
      expect(typeof b.description).toBe('string');
      expect(b.description.length).toBeGreaterThan(0);
      expect(typeof b.color).toBe('string');
      expect(b.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(b.requirements).toBeTypeOf('object');
    }
  });

  it('category, tier und rarity liegen in den erlaubten Wertebereichen', () => {
    for (const b of BADGE_DEFINITIONS) {
      expect(VALID_CATEGORIES).toContain(b.category);
      expect(VALID_TIERS).toContain(b.tier);
      expect(VALID_RARITIES).toContain(b.rarity);
    }
  });

  it('jede Definition hat mindestens eine numerische Schwelle', () => {
    const numericKeys = ['episodes', 'seasons', 'days', 'series', 'ratings', 'friends'] as const;
    for (const b of BADGE_DEFINITIONS) {
      const hasThreshold = numericKeys.some(
        (k) => typeof b.requirements[k] === 'number' && (b.requirements[k] as number) > 0
      );
      expect(hasThreshold, `${b.id} braucht eine numerische Schwelle`).toBe(true);
    }
  });

  it('binge-Badges ohne timeframe verletzen keine Erwartung: timeframe ist optional string', () => {
    for (const b of BADGE_DEFINITIONS) {
      if (b.requirements.timeframe !== undefined) {
        expect(typeof b.requirements.timeframe).toBe('string');
      }
    }
  });

  it('Schwellen sind pro Kategorie in Array-Reihenfolge streng monoton steigend', () => {
    const byCategory = new Map<BadgeCategory, number[]>();
    for (const b of BADGE_DEFINITIONS) {
      const metric = PRIMARY_METRIC[b.category];
      const value = b.requirements[metric];
      expect(typeof value, `${b.id} sollte ${String(metric)} gesetzt haben`).toBe('number');
      const list = byCategory.get(b.category) ?? [];
      list.push(value as number);
      byCategory.set(b.category, list);
    }

    for (const [category, values] of byCategory) {
      for (let i = 1; i < values.length; i++) {
        expect(
          values[i],
          `${category}: Schwelle an Index ${i} (${values[i]}) muss > ${values[i - 1]} sein`
        ).toBeGreaterThan(values[i - 1]);
      }
    }
  });

  it('deckt alle acht Kategorien ab', () => {
    const present = new Set(BADGE_DEFINITIONS.map((b) => b.category));
    for (const c of VALID_CATEGORIES) {
      expect(present.has(c)).toBe(true);
    }
  });
});
