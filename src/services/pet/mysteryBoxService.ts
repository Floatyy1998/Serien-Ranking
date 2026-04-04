import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { AccessoryRarity, PetAccessory } from '../../types/pet.types';
import { ACCESSORIES } from '../../types/pet.types';
import { getUserPets } from './petCore';

// ============================================================
// Mystery Box — alle 50 Episoden eine Box
// ============================================================

/** Interval: alle X Episoden gibt es eine Mystery Box */
const BOX_EVERY_N_EPISODES = 50;

export type MysteryRewardType = 'accessory' | 'xp_boost';

export interface MysteryBoxReward {
  type: MysteryRewardType;
  label: string;
  icon: string;
  rarity: AccessoryRarity;
  accessoryId?: string;
  xpMultiplier?: number;
  xpDurationMinutes?: number;
}

export interface MysteryBoxData {
  /** Wie viele Boxen der User schon geöffnet hat */
  boxesOpened: number;
  /** Letzte geöffnete Box-Nummer (z.B. 3 = 150 Episoden) */
  lastOpenedBoxNumber: number;
}

/** Milestone-exclusive accessories (cannot drop from episodes or spin) */
const MILESTONE_EXCLUSIVE_ACCESSORIES = [
  'trophyNecklace',
  'starHelmet',
  'crystalMonocle',
  'phoenixFeather',
  'infinityScarf',
  'ancientCrown',
  'championBelt',
  'cosmicHelm',
  'timeTravelerGoggles',
  'enchantedRose',
  'shadowHood',
  'celestialCrown',
  'volcanoHelm',
  'abyssVisor',
  'dragonScaleCollar',
  'lotusHelm',
  'eclipseGoggles',
  'runeNecklace',
  'glitchCrown',
  'voidMask',
  'sakuraPendant',
  'pyramidHelm',
  'mirrorShades',
  'obsidianAmulet',
];

// ============================================================
// Box availability check
// ============================================================

/** Wie viele ungeöffnete Boxen hat der User? */
export async function getAvailableBoxCount(userId: string, totalEpisodes: number): Promise<number> {
  const data = await ensureInitialized(userId, totalEpisodes);
  const earnedBoxes = Math.floor(totalEpisodes / BOX_EVERY_N_EPISODES);
  return Math.max(0, earnedBoxes - data.lastOpenedBoxNumber);
}

/**
 * Stellt sicher, dass der mysteryBox-Eintrag existiert.
 * Beim allerersten Mal wird lastOpenedBoxNumber auf den aktuellen Stand gesetzt,
 * damit nicht hunderte Boxen rückwirkend verfügbar sind.
 */
async function ensureInitialized(userId: string, totalEpisodes: number): Promise<MysteryBoxData> {
  const ref = firebase.database().ref(`users/${userId}/mysteryBox`);
  const snap = await ref.once('value');
  const data = snap.val();

  if (data && typeof data.lastOpenedBoxNumber === 'number' && data.lastOpenedBoxNumber > 0) {
    return data;
  }

  // Erster Besuch: aktuellen Stand als Baseline setzen
  const baseline = Math.floor(totalEpisodes / BOX_EVERY_N_EPISODES);
  const initData: MysteryBoxData = {
    boxesOpened: 0,
    lastOpenedBoxNumber: baseline,
  };
  await ref.set(initData);
  return initData;
}

/** Nächster Meilenstein (Episoden bis zur nächsten Box) */
export function getNextBoxThreshold(totalEpisodes: number): number {
  return (Math.floor(totalEpisodes / BOX_EVERY_N_EPISODES) + 1) * BOX_EVERY_N_EPISODES;
}

/** Episoden-Fortschritt zur nächsten Box (0-1) */
export function getProgressToNextBox(totalEpisodes: number): number {
  const within = totalEpisodes % BOX_EVERY_N_EPISODES;
  return within / BOX_EVERY_N_EPISODES;
}

// ============================================================
// Mystery Box opening
// ============================================================

/** Open the next available mystery box */
export async function openMysteryBox(
  userId: string,
  totalEpisodes: number
): Promise<MysteryBoxReward | null> {
  const data = await ensureInitialized(userId, totalEpisodes);
  const earnedBoxes = Math.floor(totalEpisodes / BOX_EVERY_N_EPISODES);
  const lastOpened = data.lastOpenedBoxNumber;

  if (earnedBoxes <= lastOpened) return null;

  // Die nächste Box öffnen
  const boxNumber = lastOpened + 1;

  // Rarity basierend auf Box-Nummer (je mehr Boxen, desto besser)
  const rarity = getBoxRarity(boxNumber);
  const reward = await generateMysteryReward(userId, rarity);

  // Speichern
  await firebase
    .database()
    .ref(`users/${userId}/mysteryBox`)
    .set({
      boxesOpened: (data?.boxesOpened || 0) + 1,
      lastOpenedBoxNumber: boxNumber,
    });

  // Reward anwenden
  await applyMysteryReward(userId, reward);

  return reward;
}

/** Rarity skaliert mit Box-Nummer */
function getBoxRarity(boxNumber: number): AccessoryRarity {
  // Box 1 (50 Ep) = common/uncommon, Box 4 (200 Ep) = rare, Box 10 (500 Ep) = epic, Box 20 (1000 Ep) = legendary
  // Aber immer zufällig — höhere Boxen haben nur bessere Chancen
  const roll = Math.random();

  if (boxNumber >= 20) {
    // 1000+ Episoden: 30% legendary, 30% epic, 25% rare, 15% uncommon
    if (roll < 0.3) return 'legendary';
    if (roll < 0.6) return 'epic';
    if (roll < 0.85) return 'rare';
    return 'uncommon';
  }
  if (boxNumber >= 10) {
    // 500+ Episoden: 10% legendary, 25% epic, 35% rare, 30% uncommon
    if (roll < 0.1) return 'legendary';
    if (roll < 0.35) return 'epic';
    if (roll < 0.7) return 'rare';
    return 'uncommon';
  }
  if (boxNumber >= 4) {
    // 200+ Episoden: 5% epic, 25% rare, 40% uncommon, 30% common
    if (roll < 0.05) return 'epic';
    if (roll < 0.3) return 'rare';
    if (roll < 0.7) return 'uncommon';
    return 'common';
  }
  // Erste Boxen: 15% rare, 35% uncommon, 50% common
  if (roll < 0.15) return 'rare';
  if (roll < 0.5) return 'uncommon';
  return 'common';
}

/** XP boost durations by rarity */
const BOOST_DURATIONS: Record<AccessoryRarity, { multiplier: number; minutes: number }> = {
  common: { multiplier: 2, minutes: 30 },
  uncommon: { multiplier: 2, minutes: 60 },
  rare: { multiplier: 2, minutes: 120 },
  epic: { multiplier: 3, minutes: 60 },
  legendary: { multiplier: 3, minutes: 180 },
};

async function generateMysteryReward(
  userId: string,
  rarity: AccessoryRarity
): Promise<MysteryBoxReward> {
  // 60% chance for exclusive accessory, 40% XP boost
  const roll = Math.random();

  if (roll < 0.6) {
    const accessory = await pickMilestoneAccessory(userId, rarity);
    if (accessory) {
      return {
        type: 'accessory',
        label: accessory.name,
        icon: accessory.icon,
        rarity,
        accessoryId: accessory.id,
      };
    }
  }

  // XP boost (also fallback if all accessories owned)
  const boost = BOOST_DURATIONS[rarity];
  const durationLabel = boost.minutes >= 60 ? `${boost.minutes / 60} Std` : `${boost.minutes} Min`;
  return {
    type: 'xp_boost',
    label: `${boost.multiplier}x XP — ${durationLabel}`,
    icon: '\u26A1',
    rarity,
    xpMultiplier: boost.multiplier,
    xpDurationMinutes: boost.minutes,
  };
}

async function pickMilestoneAccessory(
  userId: string,
  targetRarity: AccessoryRarity
): Promise<{ id: string; name: string; icon: string } | null> {
  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (!alivePet) return null;

  const owned = new Set((alivePet.accessories || []).map((a) => a.id));

  // Prefer milestone-exclusive accessories
  const exclusiveCandidates = MILESTONE_EXCLUSIVE_ACCESSORIES.filter((id) => {
    const def = ACCESSORIES[id];
    return def && def.rarity === targetRarity && !owned.has(id);
  });

  if (exclusiveCandidates.length > 0) {
    const id = exclusiveCandidates[Math.floor(Math.random() * exclusiveCandidates.length)];
    const def = ACCESSORIES[id];
    return { id, name: def.name, icon: def.icon };
  }

  // Fall back to any unowned accessory of that rarity
  const candidates = Object.entries(ACCESSORIES).filter(
    ([id, def]) => def.rarity === targetRarity && !owned.has(id)
  );

  if (candidates.length === 0) return null;
  const [id, def] = candidates[Math.floor(Math.random() * candidates.length)];
  return { id, name: def.name, icon: def.icon };
}

async function applyMysteryReward(userId: string, reward: MysteryBoxReward): Promise<void> {
  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (!alivePet) return;

  switch (reward.type) {
    case 'accessory': {
      if (!reward.accessoryId) break;
      const def = ACCESSORIES[reward.accessoryId];
      if (!def) break;
      const alreadyOwned = alivePet.accessories?.some((a) => a.id === reward.accessoryId);
      if (alreadyOwned) break;

      const newAcc: PetAccessory = {
        id: reward.accessoryId,
        type: def.slot,
        name: def.name,
        icon: def.icon,
        equipped: false,
        isNew: true,
      };
      if (def.color) newAcc.color = def.color;

      const accessories = [...(alivePet.accessories || []), newAcc];
      await firebase.database().ref(`pets/${userId}/${alivePet.id}`).update({ accessories });
      break;
    }
    case 'xp_boost': {
      // Add to inventory (same as daily spin)
      const invRef = firebase.database().ref(`users/${userId}/xpBoostInventory`);
      const invSnap = await invRef.once('value');
      const inventory = invSnap.val() || [];
      inventory.push({
        multiplier: reward.xpMultiplier || 2,
        durationMinutes: reward.xpDurationMinutes || 60,
        source: 'mystery_box',
        wonAt: Date.now(),
      });
      await invRef.set(inventory);
      break;
    }
  }
}
