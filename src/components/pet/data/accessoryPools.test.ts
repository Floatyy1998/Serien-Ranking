import { describe, expect, it } from 'vitest';
import { ACCESSORIES } from './accessories';
import {
  EPISODE_DROP_EXCLUDED,
  MILESTONE_EXCLUSIVE_ACCESSORIES,
  pickEpisodeDrop,
  pickItemReward,
  rarityFallbackOrder,
  SPIN_EXCLUSIVE_ACCESSORIES,
} from './accessoryPools';
import { PET_BACKGROUNDS } from './petBackgrounds';

const allAccessories = Object.keys(ACCESSORIES);
const allBackgrounds = Object.keys(PET_BACKGROUNDS);
const ofRarity = (rarity: string) =>
  allAccessories.filter((id) => ACCESSORIES[id].rarity === rarity);

describe('Drop-Pools', () => {
  it('nennt nur Teile, die es gibt, und keines doppelt', () => {
    const ids = [...SPIN_EXCLUSIVE_ACCESSORIES, ...MILESTONE_EXCLUSIVE_ACCESSORIES];
    expect(ids.filter((id) => !ACCESSORIES[id])).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lässt in jeder Seltenheit Teile für den Fund beim Schauen übrig', () => {
    for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
      const free = ofRarity(rarity).filter(
        (id) => !EPISODE_DROP_EXCLUDED.has(id) && !ACCESSORIES[id].source
      );
      expect(free.length, rarity).toBeGreaterThan(0);
    }
  });
});

describe('rarityFallbackOrder', () => {
  it('beginnt mit der gewürfelten Seltenheit und geht zu den nächstgelegenen', () => {
    expect(rarityFallbackOrder('legendary')).toEqual([
      'legendary',
      'epic',
      'rare',
      'uncommon',
      'common',
    ]);
    expect(rarityFallbackOrder('rare')).toEqual([
      'rare',
      'uncommon',
      'epic',
      'common',
      'legendary',
    ]);
    expect(rarityFallbackOrder('common')).toEqual([
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
    ]);
  });
});

describe('pickItemReward', () => {
  const base = {
    ownedAccessories: new Set<string>(),
    ownedBackgrounds: new Set<string>(),
    rarity: 'legendary' as const,
    preferred: SPIN_EXCLUSIVE_ACCESSORIES,
    first: 'accessory' as const,
  };

  it('vergibt zuerst ein bevorzugtes Teil der gewürfelten Seltenheit', () => {
    const item = pickItemReward(base);
    expect(item?.kind).toBe('accessory');
    expect(item?.rarity).toBe('legendary');
    expect(SPIN_EXCLUSIVE_ACCESSORIES).toContain(item?.id);
  });

  it('weicht auf den Hintergrund derselben Seltenheit aus, wenn die Accessoires gesammelt sind', () => {
    const item = pickItemReward({ ...base, ownedAccessories: new Set(ofRarity('legendary')) });
    expect(item).toMatchObject({ kind: 'background', rarity: 'legendary' });
  });

  it('rückt zur nächsten Seltenheit vor, statt leer auszugehen', () => {
    const item = pickItemReward({
      ...base,
      ownedAccessories: new Set(ofRarity('legendary')),
      ownedBackgrounds: new Set(
        allBackgrounds.filter((id) => PET_BACKGROUNDS[id].rarity === 'legendary')
      ),
    });
    expect(item).toMatchObject({ kind: 'accessory', rarity: 'epic' });
  });

  it('liefert erst dann nichts, wenn alles gesammelt ist', () => {
    const everything = {
      ...base,
      ownedAccessories: new Set(allAccessories.filter((id) => !ACCESSORIES[id].source)),
      ownedBackgrounds: new Set(allBackgrounds),
    };
    expect(pickItemReward(everything)).toBeNull();
    const oneMissing = new Set(everything.ownedAccessories);
    oneMissing.delete('beanie');
    expect(pickItemReward({ ...everything, ownedAccessories: oneMissing })).toEqual({
      kind: 'accessory',
      id: 'beanie',
      rarity: 'common',
    });
  });

  it('vergibt nie das Einladungs-Teil', () => {
    const owned = new Set(allAccessories.filter((id) => !ACCESSORIES[id].source));
    expect(
      pickItemReward({
        ...base,
        ownedAccessories: owned,
        ownedBackgrounds: new Set(allBackgrounds),
      })
    ).toBeNull();
  });
});

describe('pickEpisodeDrop', () => {
  it('lässt Glücksrad- und Box-Teile aus und weicht auf andere Seltenheiten aus', () => {
    const droppable = (rarity: string) =>
      ofRarity(rarity).filter((id) => !EPISODE_DROP_EXCLUDED.has(id) && !ACCESSORIES[id].source);
    const owned = new Set(droppable('legendary'));
    const drop = pickEpisodeDrop(owned, 'legendary');
    expect(drop?.rarity).toBe('epic');
    expect(EPISODE_DROP_EXCLUDED.has(drop?.id ?? '')).toBe(false);
  });

  it('liefert nichts, wenn alle frei fallenden Teile gesammelt sind', () => {
    const owned = new Set(allAccessories.filter((id) => !EPISODE_DROP_EXCLUDED.has(id)));
    expect(pickEpisodeDrop(owned, 'common')).toBeNull();
  });
});
