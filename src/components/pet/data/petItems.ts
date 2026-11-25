import type { AccessoryRarity } from '../../../types/pet.types';

/** Verbrauchsgüter: gehen nie aus, liegen als Vorrat im Konto und werden einzeln eingelöst. */
export type PetItemId =
  'treat' | 'toy' | 'feast' | 'extraSpin' | 'bonusBox' | 'streakPass' | 'elixir';

export interface PetItemDefinition {
  /** Deutscher Quelltext, wird beim Anzeigen über t() übersetzt. */
  name: string;
  description: string;
  rarity: AccessoryRarity;
  /** Wo der Vorrat eingelöst wird, wenn nicht direkt aus dem Inventar. */
  hint?: string;
}

export const PET_ITEMS: Record<PetItemId, PetItemDefinition> = {
  treat: {
    name: 'Leckerli',
    description: 'Macht alle deine Pets sofort satt.',
    rarity: 'common',
  },
  toy: {
    name: 'Spielzeug',
    description: 'Bringt das Glück aller deiner Pets auf 100 %.',
    rarity: 'common',
  },
  feast: {
    name: 'Festmahl',
    description: 'Alle deine Pets sind satt und glücklich.',
    rarity: 'uncommon',
  },
  extraSpin: {
    name: 'Extra-Dreh',
    description: 'Ein weiterer Dreh am Glücksrad.',
    rarity: 'uncommon',
    hint: 'Am Glücksrad einlösen',
  },
  bonusBox: {
    name: 'Bonus-Box',
    description: 'Eine zusätzliche Mystery Box.',
    rarity: 'rare',
  },
  streakPass: {
    name: 'Streak-Freischein',
    description: 'Rettet deine Streak, ohne dass dein Pet XP opfert.',
    rarity: 'legendary',
    hint: 'An der Streak-Karte einlösen',
  },
  elixir: {
    name: 'Lebenselixier',
    description: 'Belebt ein Pet wieder, ohne dass es ein Level verliert.',
    rarity: 'epic',
    hint: 'Beim Wiederbeleben einlösen',
  },
};

export const PET_ITEM_IDS = Object.keys(PET_ITEMS) as PetItemId[];

export type PetItemCounts = Record<PetItemId, number>;

export const emptyPetItems = (): PetItemCounts => ({
  treat: 0,
  toy: 0,
  feast: 0,
  extraSpin: 0,
  bonusBox: 0,
  streakPass: 0,
  elixir: 0,
});

/** Zählerstände aus der Datenbank; alles Unbekannte oder Unsinnige zählt als 0. */
export function readPetItems(raw: unknown): PetItemCounts {
  const counts = emptyPetItems();
  if (!raw || typeof raw !== 'object') return counts;
  for (const id of PET_ITEM_IDS) {
    const n = (raw as Record<string, unknown>)[id];
    if (typeof n === 'number' && n > 0) counts[id] = Math.floor(n);
  }
  return counts;
}

/**
 * Was eine Belohnung dieser Seltenheit als Vorrat enthalten kann, mit Gewicht. Der
 * Streak-Freischein steckt nur im epischen und legendären Topf und dort mit einem Sechstel:
 * er rettet eine Streak ohne Kosten und ohne Cooldown und soll ein seltener Fund bleiben.
 */
export const ITEM_POOLS: Record<AccessoryRarity, readonly (readonly [PetItemId, number])[]> = {
  common: [
    ['treat', 1],
    ['toy', 1],
  ],
  uncommon: [
    ['treat', 1],
    ['toy', 1],
    ['feast', 1],
    ['extraSpin', 1],
  ],
  rare: [
    ['feast', 1],
    ['extraSpin', 1],
    ['bonusBox', 1],
  ],
  epic: [
    ['bonusBox', 3],
    ['streakPass', 1],
    ['elixir', 2],
  ],
  legendary: [
    ['bonusBox', 3],
    ['streakPass', 1],
    ['elixir', 2],
  ],
};

export function rollPetItem(rarity: AccessoryRarity): PetItemId {
  const pool = ITEM_POOLS[rarity];
  const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [id, weight] of pool) {
    roll -= weight;
    if (roll < 0) return id;
  }
  return pool[pool.length - 1][0];
}
