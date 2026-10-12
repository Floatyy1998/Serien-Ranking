import { describe, expect, it } from 'vitest';
import type { PetAccessory } from '../../types/pet.types';
import { nextOutfitUnlock, outfitCapacity, toggleWorn, wornAccessories, wornSlots } from './outfit';

const acc = (id: string, equipped = false): PetAccessory => ({
  id,
  type: 'x',
  name: id,
  icon: '',
  equipped,
});

const ids = (list: PetAccessory[]) => list.map((a) => a.id);
const on = (list: PetAccessory[]) => ids(list.filter((a) => a.equipped)).sort();

describe('outfitCapacity', () => {
  it('wächst mit dem Level von einem auf drei Teile', () => {
    expect(outfitCapacity(1)).toBe(1);
    expect(outfitCapacity(9)).toBe(1);
    expect(outfitCapacity(10)).toBe(2);
    expect(outfitCapacity(29)).toBe(2);
    expect(outfitCapacity(30)).toBe(3);
    expect(outfitCapacity(80)).toBe(3);
  });

  it('nennt den nächsten Level-Schritt, danach keinen mehr', () => {
    expect(nextOutfitUnlock(3)).toBe(10);
    expect(nextOutfitUnlock(10)).toBe(30);
    expect(nextOutfitUnlock(30)).toBeNull();
  });
});

describe('wornAccessories', () => {
  it('trägt je Platz nur ein Teil', () => {
    const pet = { level: 40, accessories: [acc('beanie', true), acc('crown', true)] };
    expect(ids(wornAccessories(pet))).toEqual(['beanie']);
  });

  it('kappt alte Daten auf das, was das Level erlaubt', () => {
    const pet = {
      level: 3,
      accessories: [acc('bow', true), acc('sunglasses', true), acc('crown', true)],
    };
    expect(ids(wornAccessories(pet))).toEqual(['crown']);
    expect([...wornSlots(pet)]).toEqual(['head']);
  });

  it('übersteht Lücken und unbekannte Teile', () => {
    const pet = {
      level: 20,
      accessories: [null, acc('gibtsNicht', true), acc('bow', true)] as PetAccessory[],
    };
    expect(ids(wornAccessories(pet))).toEqual(['bow']);
  });
});

describe('toggleWorn', () => {
  it('tauscht unter Lv 10 das eine Teil aus', () => {
    const pet = { level: 2, accessories: [acc('beanie', true), acc('bow')] };
    const change = toggleWorn(pet, 'bow');
    expect(change.blocked).toBe(false);
    expect(on(change.accessories)).toEqual(['bow']);
  });

  it('kombiniert ab Lv 10 zwei Plätze', () => {
    const pet = { level: 10, accessories: [acc('beanie', true), acc('sunglasses')] };
    expect(on(toggleWorn(pet, 'sunglasses').accessories)).toEqual(['beanie', 'sunglasses']);
  });

  it('ersetzt ein Teil auf demselben Platz', () => {
    const pet = { level: 20, accessories: [acc('beanie', true), acc('crown'), acc('bow', true)] };
    expect(on(toggleWorn(pet, 'crown').accessories)).toEqual(['bow', 'crown']);
  });

  it('blockt ein drittes Teil vor Lv 30, ohne etwas zu verändern', () => {
    const accessories = [acc('beanie', true), acc('sunglasses', true), acc('bow')];
    const change = toggleWorn({ level: 29, accessories }, 'bow');
    expect(change.blocked).toBe(true);
    expect(change.accessories).toEqual(accessories);
  });

  it('erlaubt ab Lv 30 alle drei Plätze', () => {
    const pet = {
      level: 30,
      accessories: [acc('beanie', true), acc('sunglasses', true), acc('bow')],
    };
    expect(on(toggleWorn(pet, 'bow').accessories)).toEqual(['beanie', 'bow', 'sunglasses']);
  });

  it('legt ein getragenes Teil ab und räumt Altlasten mit auf', () => {
    const pet = { level: 20, accessories: [acc('beanie', true), acc('crown', true)] };
    expect(on(toggleWorn(pet, 'beanie').accessories)).toEqual([]);
  });

  it('ignoriert Teile, die das Pet nicht besitzt', () => {
    const accessories = [acc('beanie', true)];
    const change = toggleWorn({ level: 20, accessories }, 'crown');
    expect(change.blocked).toBe(false);
    expect(on(change.accessories)).toEqual(['beanie']);
  });
});
