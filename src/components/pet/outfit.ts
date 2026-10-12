import type { AccessorySlot, Pet, PetAccessory } from '../../types/pet.types';
import { ACCESSORIES } from './data/accessories';

export const OUTFIT_SLOTS: readonly AccessorySlot[] = ['head', 'face', 'neck'];

/** Ab diesen Levels trägt ein Pet ein Teil mehr. */
export const OUTFIT_UNLOCK_LEVELS: readonly number[] = [1, 10, 30];

export function slotOf(accessoryId: string): AccessorySlot | null {
  return ACCESSORIES[accessoryId]?.slot ?? null;
}

export function outfitCapacity(level: number): number {
  return Math.max(1, OUTFIT_UNLOCK_LEVELS.filter((l) => level >= l).length);
}

export function nextOutfitUnlock(level: number): number | null {
  return OUTFIT_UNLOCK_LEVELS.find((l) => level < l) ?? null;
}

/** Was das Pet wirklich trägt: je Platz ein Teil, höchstens so viele, wie das Level erlaubt. */
export function wornAccessories(pet: Pick<Pet, 'accessories' | 'level'>): PetAccessory[] {
  const bySlot = new Map<AccessorySlot, PetAccessory>();
  for (const a of pet.accessories ?? []) {
    const slot = a?.equipped ? slotOf(a.id) : null;
    if (slot && !bySlot.has(slot)) bySlot.set(slot, a);
  }
  return OUTFIT_SLOTS.flatMap((s) => bySlot.get(s) ?? []).slice(0, outfitCapacity(pet.level));
}

export function wornSlots(pet: Pick<Pet, 'accessories' | 'level'>): Set<AccessorySlot> {
  return new Set(wornAccessories(pet).map((a) => slotOf(a.id) as AccessorySlot));
}

export interface OutfitChange {
  accessories: PetAccessory[];
  /** Kein Platz mehr frei — erst ab dem nächsten Level-Schritt. */
  blocked: boolean;
}

/** An- oder Ablegen eines Teils; ersetzt ein Teil auf demselben Platz. */
export function toggleWorn(
  pet: Pick<Pet, 'accessories' | 'level'>,
  accessoryId: string
): OutfitChange {
  const all = (pet.accessories ?? []).filter(Boolean);
  const slot = slotOf(accessoryId);
  if (!slot || !all.some((a) => a.id === accessoryId)) return { accessories: all, blocked: false };

  const worn = wornAccessories(pet).map((a) => a.id);
  let next: string[];
  if (worn.includes(accessoryId)) {
    next = worn.filter((id) => id !== accessoryId);
  } else {
    next = worn.filter((id) => slotOf(id) !== slot);
    const capacity = outfitCapacity(pet.level);
    if (next.length >= capacity) {
      if (capacity > 1) return { accessories: all, blocked: true };
      next = [];
    }
    next.push(accessoryId);
  }

  const on = new Set(next);
  return {
    accessories: all.map((a) =>
      !!a.equipped === on.has(a.id) ? a : { ...a, equipped: on.has(a.id) }
    ),
    blocked: false,
  };
}
