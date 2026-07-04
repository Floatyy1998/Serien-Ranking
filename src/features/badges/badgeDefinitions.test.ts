import { describe, expect, it } from 'vitest';
import { BADGE_DEFINITIONS } from './badgeDefinitions';
import type { BadgeCategory, BadgeTier } from './badgeDefinitions';

const CATEGORIES: BadgeCategory[] = [
  'binge',
  'quickwatch',
  'marathon',
  'streak',
  'rewatch',
  'series_explorer',
  'collector',
  'social',
];
const TIERS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];

describe('BADGE_DEFINITIONS', () => {
  it('ist eine nicht-leere Liste (re-export)', () => {
    expect(Array.isArray(BADGE_DEFINITIONS)).toBe(true);
    expect(BADGE_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it('jede Badge-ID ist eindeutig', () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('jede Badge hat die Pflichtfelder', () => {
    for (const b of BADGE_DEFINITIONS) {
      expect(typeof b.id).toBe('string');
      expect(b.id.length).toBeGreaterThan(0);
      expect(typeof b.name).toBe('string');
      expect(typeof b.description).toBe('string');
      expect(typeof b.color).toBe('string');
      expect(typeof b.requirements).toBe('object');
      expect(b.requirements).not.toBeNull();
    }
  });

  it('category/tier/rarity gehören zu den erlaubten Werten', () => {
    for (const b of BADGE_DEFINITIONS) {
      expect(CATEGORIES).toContain(b.category);
      expect(TIERS).toContain(b.tier);
      expect(RARITIES).toContain(b.rarity);
    }
  });

  it('numerische requirement-Werte sind positiv', () => {
    for (const b of BADGE_DEFINITIONS) {
      for (const [key, value] of Object.entries(b.requirements)) {
        if (typeof value === 'number') {
          expect(value, `${b.id}.${key}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('deckt mehrere Kategorien ab', () => {
    const used = new Set(BADGE_DEFINITIONS.map((b) => b.category));
    expect(used.size).toBeGreaterThan(1);
  });
});
