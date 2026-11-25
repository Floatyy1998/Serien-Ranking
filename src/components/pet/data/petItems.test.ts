import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITEM_POOLS, PET_ITEMS, readPetItems, rollPetItem } from './petItems';

afterEach(() => vi.restoreAllMocks());

const share = (rarity: keyof typeof ITEM_POOLS, id: string): number => {
  const pool = ITEM_POOLS[rarity];
  const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
  return (pool.find(([item]) => item === id)?.[1] ?? 0) / total;
};

describe('Vorrats-Töpfe', () => {
  it('enthalten nur bekannte Verbrauchsgüter', () => {
    for (const pool of Object.values(ITEM_POOLS)) {
      for (const [id, weight] of pool) {
        expect(PET_ITEMS[id], id).toBeDefined();
        expect(weight).toBeGreaterThan(0);
      }
    }
  });

  it('der Streak-Freischein steckt nur im epischen und legendären Topf, je mit einem Sechstel', () => {
    expect(share('common', 'streakPass')).toBe(0);
    expect(share('uncommon', 'streakPass')).toBe(0);
    expect(share('rare', 'streakPass')).toBe(0);
    expect(share('epic', 'streakPass')).toBeCloseTo(1 / 6);
    expect(share('legendary', 'streakPass')).toBeCloseTo(1 / 6);
    expect(PET_ITEMS.streakPass.rarity).toBe('legendary');
  });
});

describe('rollPetItem', () => {
  it('würfelt nach Gewicht', () => {
    const at = (roll: number) => {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      return rollPetItem('epic');
    };
    expect(at(0)).toBe('bonusBox');
    expect(at(0.49)).toBe('bonusBox');
    expect(at(0.5)).toBe('streakPass');
    expect(at(0.66)).toBe('streakPass');
    expect(at(0.67)).toBe('elixir');
    expect(at(0.999)).toBe('elixir');
  });

  it('gleich gewichtete Töpfe verteilen gleichmäßig', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(rollPetItem('uncommon')).toBe('extraSpin');
    expect(rollPetItem('rare')).toBe('bonusBox');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(rollPetItem('common')).toBe('treat');
    expect(rollPetItem('rare')).toBe('feast');
  });
});

describe('readPetItems', () => {
  it('liest nur gültige Zählerstände', () => {
    expect(readPetItems(null).treat).toBe(0);
    expect(readPetItems({ treat: 2, toy: -1, elixir: '3' })).toMatchObject({
      treat: 2,
      toy: 0,
      elixir: 0,
    });
  });
});
