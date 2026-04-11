import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { AccessoryRarity, PetAccessory } from '../../types/pet.types';
import { ACCESSORIES, PET_BACKGROUNDS } from '../../types/pet.types';
import { getUserPets } from './petCore';

// ============================================================
// Mystery Box — alle 50 Episoden eine Box
// ============================================================

/** Interval: alle X Episoden gibt es eine Mystery Box */
const BOX_EVERY_N_EPISODES = 50;

export type MysteryRewardType = 'accessory' | 'xp_boost' | 'background';

export interface MysteryBoxReward {
  type: MysteryRewardType;
  label: string;
  icon: string;
  rarity: AccessoryRarity;
  accessoryId?: string;
  backgroundId?: string;
  xpMultiplier?: number;
  xpEpisodeCount?: number;
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
  const roll = Math.random();

  if (boxNumber >= 400) {
    // 20000+ Ep: 10% L, 55% E, 25% R, 8% U, 2% C
    if (roll < 0.1) return 'legendary';
    if (roll < 0.65) return 'epic';
    if (roll < 0.9) return 'rare';
    if (roll < 0.98) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 200) {
    // 10000+ Ep: 8% L, 49% E, 30% R, 10% U, 3% C
    if (roll < 0.08) return 'legendary';
    if (roll < 0.57) return 'epic';
    if (roll < 0.87) return 'rare';
    if (roll < 0.97) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 100) {
    // 5000+ Ep: 5% L, 45% E, 33% R, 12% U, 5% C
    if (roll < 0.05) return 'legendary';
    if (roll < 0.5) return 'epic';
    if (roll < 0.83) return 'rare';
    if (roll < 0.95) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 50) {
    // 2500+ Ep: 3% L, 39% E, 35% R, 15% U, 8% C
    if (roll < 0.03) return 'legendary';
    if (roll < 0.42) return 'epic';
    if (roll < 0.77) return 'rare';
    if (roll < 0.92) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 20) {
    // 1000+ Ep: 2% L, 33% E, 35% R, 20% U, 10% C
    if (roll < 0.02) return 'legendary';
    if (roll < 0.35) return 'epic';
    if (roll < 0.7) return 'rare';
    if (roll < 0.9) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 10) {
    // 500+ Ep: 1% L, 24% E, 35% R, 25% U, 15% C
    if (roll < 0.01) return 'legendary';
    if (roll < 0.25) return 'epic';
    if (roll < 0.6) return 'rare';
    if (roll < 0.85) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 4) {
    // 200+ Ep: 10% E, 30% R, 35% U, 25% C
    if (roll < 0.1) return 'epic';
    if (roll < 0.4) return 'rare';
    if (roll < 0.75) return 'uncommon';
    return 'common';
  }
  // Erste Boxen (50-150 Ep): 15% R, 35% U, 50% C
  if (roll < 0.15) return 'rare';
  if (roll < 0.5) return 'uncommon';
  return 'common';
}

/** XP boost episode counts by rarity */
const BOOST_EPISODES: Record<AccessoryRarity, { multiplier: number; episodes: number }> = {
  common: { multiplier: 2, episodes: 2 },
  uncommon: { multiplier: 2, episodes: 5 },
  rare: { multiplier: 2, episodes: 10 },
  epic: { multiplier: 3, episodes: 10 },
  legendary: { multiplier: 3, episodes: 15 },
};

async function generateMysteryReward(
  userId: string,
  rarity: AccessoryRarity
): Promise<MysteryBoxReward> {
  // 30% background, 40% exclusive accessory, 30% XP boost
  const roll = Math.random();

  if (roll < 0.3) {
    const background = await pickBackgroundReward(userId, rarity);
    if (background) {
      return {
        type: 'background',
        label: background.name,
        icon: '\uD83C\uDF0C',
        rarity,
        backgroundId: background.id,
      };
    }
  }

  if (roll < 0.7) {
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
    // Fallback: try background before XP boost
    const background = await pickBackgroundReward(userId, rarity);
    if (background) {
      return {
        type: 'background',
        label: background.name,
        icon: '\uD83C\uDF0C',
        rarity,
        backgroundId: background.id,
      };
    }
  }

  // XP boost (also fallback if all accessories owned)
  const boost = BOOST_EPISODES[rarity];
  return {
    type: 'xp_boost',
    label: `${boost.multiplier}x XP — ${boost.episodes} Episoden`,
    icon: '\u26A1',
    rarity,
    xpMultiplier: boost.multiplier,
    xpEpisodeCount: boost.episodes,
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

async function pickBackgroundReward(
  userId: string,
  targetRarity: AccessoryRarity
): Promise<{ id: string; name: string } | null> {
  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (!alivePet) return null;

  const owned = new Set(alivePet.unlockedBackgrounds || []);
  const candidates = Object.values(PET_BACKGROUNDS).filter(
    (bg) => bg.rarity === targetRarity && !owned.has(bg.id)
  );

  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { id: pick.id, name: pick.name };
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
      await firebase.database().ref(`users/${userId}/pets/${alivePet.id}`).update({ accessories });
      break;
    }
    case 'background': {
      if (!reward.backgroundId) break;
      if (!PET_BACKGROUNDS[reward.backgroundId]) break;
      const alreadyOwned = alivePet.unlockedBackgrounds?.includes(reward.backgroundId);
      if (alreadyOwned) break;
      // Hintergruende werden ueber alle Pets geteilt (wie Accessoires)
      for (const p of pets) {
        const unlocked = [...(p.unlockedBackgrounds || [])];
        if (!unlocked.includes(reward.backgroundId)) {
          unlocked.push(reward.backgroundId);
          await firebase
            .database()
            .ref(`users/${userId}/pets/${p.id}/unlockedBackgrounds`)
            .set(unlocked);
        }
      }
      break;
    }
    case 'xp_boost': {
      // Add to inventory (same as daily spin)
      const invRef = firebase.database().ref(`users/${userId}/xpBoostInventory`);
      const invSnap = await invRef.once('value');
      const inventory = invSnap.val() || [];
      inventory.push({
        multiplier: reward.xpMultiplier || 2,
        episodeCount: reward.xpEpisodeCount || 5,
        source: 'mystery_box',
        wonAt: Date.now(),
      });
      await invRef.set(inventory);
      break;
    }
  }
}
