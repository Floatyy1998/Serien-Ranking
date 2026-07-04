import { describe, expect, it } from 'vitest';
import { BADGE_DEFINITIONS } from '../../features/badges/badgeDefinitions';
import type { Badge, EarnedBadge } from '../../features/badges/badgeDefinitions';
import {
  categories,
  getCategoryBadges,
  getEarnedCount,
  getNextTierInfo,
  getTotalCount,
} from './badgesPageHelpers';

function badgeById(id: string): Badge {
  const b = BADGE_DEFINITIONS.find((x) => x.id === id);
  if (!b) throw new Error(`Badge ${id} nicht gefunden`);
  return b;
}

describe('categories', () => {
  it('startet mit "all" und listet distinkte Keys', () => {
    expect(categories[0].key).toBe('all');
    const keys = categories.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('jede Kategorie hat Label und Icon', () => {
    for (const cat of categories) {
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.icon).toBeTruthy();
    }
  });
});

describe('getTotalCount / getCategoryBadges', () => {
  it('"all" zählt alle Definitionen', () => {
    expect(getTotalCount('all')).toBe(BADGE_DEFINITIONS.length);
    expect(getCategoryBadges('all')).toBe(BADGE_DEFINITIONS);
  });

  it('Kategorie zählt nur ihre Badges', () => {
    const binge = getCategoryBadges('binge');
    expect(binge.length).toBe(getTotalCount('binge'));
    expect(binge.every((b) => b.category === 'binge')).toBe(true);
    expect(binge.length).toBeGreaterThan(0);
  });

  it('die Summe der Kategorien ergibt die Gesamtzahl', () => {
    const cats = categories.filter((c) => c.key !== 'all').map((c) => c.key);
    const sum = cats.reduce((acc, key) => acc + getTotalCount(key), 0);
    expect(sum).toBe(BADGE_DEFINITIONS.length);
  });
});

describe('getEarnedCount', () => {
  it('0 ohne verdiente Badges', () => {
    expect(getEarnedCount('all', [])).toBe(0);
  });

  it('zählt nur verdiente Badges der Kategorie', () => {
    const bingeBadge = getCategoryBadges('binge')[0];
    const earned = [{ id: bingeBadge.id }] as EarnedBadge[];
    expect(getEarnedCount('binge', earned)).toBe(1);
    expect(getEarnedCount('all', earned)).toBe(1);
    // andere Kategorie ist nicht betroffen (sofern bingeBadge nicht dort liegt)
    expect(getEarnedCount('social', earned)).toBe(0);
  });

  it('ignoriert unbekannte IDs', () => {
    expect(getEarnedCount('all', [{ id: 'gibt_es_nicht' }] as EarnedBadge[])).toBe(0);
  });
});

describe('getNextTierInfo', () => {
  it('bereits verdient → null', () => {
    expect(getNextTierInfo(badgeById('binge_bronze'), true, () => false)).toBeNull();
  });

  it('erstes Tier der Gruppe (Index 0) → null', () => {
    expect(getNextTierInfo(badgeById('binge_bronze'), false, () => true)).toBeNull();
  });

  it('nächstes Tier freigeschaltet, wenn alle Vorgänger verdient sind', () => {
    const result = getNextTierInfo(
      badgeById('binge_bronze_plus'),
      false,
      (id) => id === 'binge_bronze'
    );
    expect(result).toEqual({ isNextTier: true });
  });

  it('kein nächstes Tier, wenn ein Vorgänger fehlt', () => {
    const result = getNextTierInfo(badgeById('binge_silver'), false, () => false);
    expect(result).toBeNull();
  });

  it('kein passender Gruppen-Match → null', () => {
    const orphan = {
      id: 'orphan',
      category: 'binge',
      tier: 'bronze',
      name: 'x',
      description: 'y',
      color: '#fff',
      requirements: { friends: 9999 },
      rarity: 'common',
    } as Badge;
    expect(getNextTierInfo(orphan, false, () => true)).toBeNull();
  });
});
