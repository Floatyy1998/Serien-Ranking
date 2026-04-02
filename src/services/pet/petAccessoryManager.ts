import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type {
  Pet,
  PetAccessory,
  AccessoryRarity,
  AccessoryDefinition,
} from '../../types/pet.types';
import { PET_COLORS, ACCESSORIES } from '../../types/pet.types';
import { PET_CONFIG } from './petConstants';
import { getUserPet, getUserPets } from './petCore';

// Fetch remote drop config fresh from Firebase each time
async function getDropConfig(): Promise<{
  dropChance: number;
  rarityWeights: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}> {
  try {
    const snap = await firebase.database().ref('admin/config/petDrops').once('value');
    if (snap.exists()) {
      const val = snap.val();
      return {
        dropChance: val.dropChance ?? PET_CONFIG.DROP_CHANCE_PER_EPISODE,
        rarityWeights: {
          common: val.rarityWeights?.common ?? PET_CONFIG.RARITY_WEIGHTS.common,
          uncommon: val.rarityWeights?.uncommon ?? PET_CONFIG.RARITY_WEIGHTS.uncommon,
          rare: val.rarityWeights?.rare ?? PET_CONFIG.RARITY_WEIGHTS.rare,
          epic: val.rarityWeights?.epic ?? PET_CONFIG.RARITY_WEIGHTS.epic,
          legendary: val.rarityWeights?.legendary ?? PET_CONFIG.RARITY_WEIGHTS.legendary,
        },
      };
    }
  } catch {
    // Fallback to local constants
  }
  return {
    dropChance: PET_CONFIG.DROP_CHANCE_PER_EPISODE,
    rarityWeights: { ...PET_CONFIG.RARITY_WEIGHTS },
  };
}

/** Erstellt ein PetAccessory ohne undefined-Felder (Firebase verbietet undefined) */
function makeAccessory(
  id: string,
  def: AccessoryDefinition,
  equipped: boolean,
  isNew?: boolean
): PetAccessory {
  const acc: PetAccessory = {
    id,
    type: def.slot,
    name: def.name,
    icon: def.icon,
    equipped,
  };
  if (def.color) acc.color = def.color;
  if (isNew) acc.isNew = true;
  return acc;
}

// ============================================================
// Toggle Accessory - max 1 equipped per pet
// ============================================================

export async function toggleAccessory(
  userId: string,
  petId: string,
  accessoryId: string
): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  if (!pet.accessories) {
    pet.accessories = [];
  }

  const target = pet.accessories.find((a) => a.id === accessoryId);

  // Clear isNew flag when interacting with an accessory
  if (target?.isNew) delete target.isNew;

  if (target) {
    if (!target.equipped) {
      // Equipping this one - unequip everything else first
      pet.accessories.forEach((a) => {
        a.equipped = false;
      });
      target.equipped = true;
    } else {
      // Unequipping
      target.equipped = false;
    }
  } else {
    // New accessory - add and equip, unequip all others
    const accessoryData = ACCESSORIES[accessoryId];
    if (accessoryData) {
      pet.accessories.forEach((a) => {
        a.equipped = false;
      });

      pet.accessories.push(makeAccessory(accessoryId, accessoryData, true));
    }
  }

  await firebase.database().ref(`pets/${userId}/${petId}/accessories`).set(pet.accessories);
  return pet;
}

// ============================================================
// Starter Accessories - 3 random ones for new pets
// ============================================================

const STARTER_POOL = [
  'beanie',
  'baseballCap',
  'flowerCrown',
  'roundGlasses',
  'collar',
  'bow',
  'bowtie',
];

export function generateStarterAccessories(): PetAccessory[] {
  const pool = [...STARTER_POOL];
  const starters: PetAccessory[] = [];

  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const pick = pool.splice(idx, 1)[0];
    const def = ACCESSORIES[pick];
    if (def) {
      starters.push(makeAccessory(pick, def, i === 0));
    }
  }

  return starters;
}

// ============================================================
// Accessory Drop System
// ============================================================

export interface AccessoryDrop {
  dropId: string;
  accessoryId: string;
  name: string;
  icon: string;
  rarity: AccessoryRarity;
}

/**
 * Rolls for a random accessory drop after watching an episode.
 * Writes a pending drop to Firebase instead of granting immediately.
 * The user must claim it via the case-opening overlay.
 */
export async function rollAccessoryDrop(userId: string): Promise<AccessoryDrop | null> {
  const config = await getDropConfig();
  if (Math.random() > config.dropChance) {
    return null;
  }

  const rarity = rollRarity(config.rarityWeights);

  const candidates = Object.entries(ACCESSORIES).filter(([, def]) => def.rarity === rarity);
  if (candidates.length === 0) return null;

  const pets = await getUserPets(userId);
  const alivePets = pets.filter((p) => p.isAlive);
  if (alivePets.length === 0) return null;

  // Inventory is shared — use first pet as source of truth
  const owned = new Set((alivePets[0].accessories || []).map((a) => a.id));
  const unowned = candidates.filter(([id]) => !owned.has(id));

  // All candidates already owned → no drop
  if (unowned.length === 0) return null;

  const [accessoryId, def] = unowned[Math.floor(Math.random() * unowned.length)];

  // Write pending drop + notification in one go
  const dropRef = firebase.database().ref(`users/${userId}/pendingAccessoryDrops`).push();
  const notifRef = firebase.database().ref(`users/${userId}/notifications`).push();
  const now = Date.now();

  await Promise.all([
    dropRef.set({ accessoryId, name: def.name, icon: def.icon, rarity, timestamp: now }),
    notifRef.set({
      type: 'pending_accessory_drop',
      title: '🎁 Neues Accessoire gefunden!',
      message: 'Tippe hier zum Öffnen',
      timestamp: now,
      read: false,
      data: { dropId: dropRef.key, accessoryId, rarity },
    }),
  ]);

  return { dropId: dropRef.key ?? '', accessoryId, name: def.name, icon: def.icon, rarity };
}

/**
 * Claims a pending accessory drop — adds it to the pet inventory
 * and deletes the pending drop from Firebase.
 */
export async function claimAccessoryDrop(
  userId: string,
  dropId: string,
  accessoryId: string
): Promise<boolean> {
  // Verify pending drop exists
  const dropRef = firebase.database().ref(`users/${userId}/pendingAccessoryDrops/${dropId}`);
  const snapshot = await dropRef.once('value');
  if (!snapshot.exists()) return false;

  const def = ACCESSORIES[accessoryId];
  if (!def) {
    await dropRef.remove();
    return false;
  }

  // Add to first alive pet — sync propagates to others
  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (alivePet) {
    const alreadyOwned = alivePet.accessories?.some((a) => a.id === accessoryId);
    if (!alreadyOwned) {
      if (!alivePet.accessories) alivePet.accessories = [];
      alivePet.accessories.push(makeAccessory(accessoryId, def, false, true));
      await firebase
        .database()
        .ref(`pets/${userId}/${alivePet.id}/accessories`)
        .set(alivePet.accessories);
    }
  }

  // Delete pending drop
  await dropRef.remove();
  return true;
}

function rollRarity(weights: {
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
}): AccessoryRarity {
  const total = weights.common + weights.uncommon + weights.rare + weights.epic + weights.legendary;
  const roll = Math.random() * total;

  if (roll < weights.common) return 'common';
  if (roll < weights.common + weights.uncommon) return 'uncommon';
  if (roll < weights.common + weights.uncommon + weights.rare) return 'rare';
  if (roll < weights.common + weights.uncommon + weights.rare + weights.epic) return 'epic';
  return 'legendary';
}

// ============================================================
// Legacy: Check & Unlock Accessories (level-up / seasonal rewards)
// ============================================================

function hasAccessory(pet: Pet, accessoryId: string): boolean {
  return pet.accessories?.some((a) => a.id === accessoryId) || false;
}

export async function checkAndUnlockAccessories(pet: Pet): Promise<void> {
  const month = new Date().getMonth() + 1;
  let changed = false;

  if (pet.level >= PET_CONFIG.CROWN_LEVEL_REQUIREMENT && !hasAccessory(pet, 'crown')) {
    if (!pet.accessories) pet.accessories = [];
    pet.accessories.push(makeAccessory('crown', ACCESSORIES.crown, false));
    changed = true;
  }

  if (month === PET_CONFIG.SANTA_HAT_MONTH && !hasAccessory(pet, 'santaHat')) {
    if (!pet.accessories) pet.accessories = [];
    pet.accessories.push(makeAccessory('santaHat', ACCESSORIES.santaHat, false));
    changed = true;
  }

  if (
    (PET_CONFIG.SUNGLASSES_MONTHS as readonly number[]).includes(month) &&
    !hasAccessory(pet, 'sunglasses')
  ) {
    if (!pet.accessories) pet.accessories = [];
    pet.accessories.push(makeAccessory('sunglasses', ACCESSORIES.sunglasses, false));
    changed = true;
  }

  if (changed) {
    await firebase.database().ref(`pets/${pet.userId}/${pet.id}/accessories`).set(pet.accessories);
  }
}

// ============================================================
// Achievements
// ============================================================

export async function checkAchievements(pet: Pet): Promise<void> {
  const updates: Record<string, string[] | undefined> = {};

  if (
    (pet.totalSeriesWatched ?? 0) >= PET_CONFIG.SILVER_COLOR_SERIES_THRESHOLD &&
    !pet.unlockedColors?.includes('silver')
  ) {
    pet.unlockedColors = [...(pet.unlockedColors || []), 'silver'];
    updates.unlockedColors = pet.unlockedColors;
  }

  if (
    (pet.totalSeriesWatched ?? 0) >= PET_CONFIG.GOLD_COLOR_SERIES_THRESHOLD &&
    !pet.unlockedColors?.includes('gold')
  ) {
    pet.unlockedColors = [...(pet.unlockedColors || []), 'gold'];
    updates.unlockedColors = pet.unlockedColors;
  }

  if (
    (pet.totalSeriesWatched ?? 0) >= PET_CONFIG.RAINBOW_COLOR_SERIES_THRESHOLD &&
    !pet.unlockedColors?.includes('rainbow')
  ) {
    pet.unlockedColors = [...(pet.unlockedColors || []), 'rainbow'];
    updates.unlockedColors = pet.unlockedColors;
  }

  if (
    pet.episodesWatched >= PET_CONFIG.GALAXY_PATTERN_EPISODES_THRESHOLD &&
    !pet.unlockedPatterns?.includes('galaxy')
  ) {
    pet.unlockedPatterns = [...(pet.unlockedPatterns || []), 'galaxy'];
    updates.unlockedPatterns = pet.unlockedPatterns;
  }

  if (Object.keys(updates).length > 0) {
    await firebase.database().ref(`pets/${pet.userId}/${pet.id}`).update(updates);
  }
}

// ============================================================
// Color & Pattern Changes
// ============================================================

export async function changePetColor(
  userId: string,
  petId: string,
  newColor: string
): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  if (!PET_COLORS[newColor] && !pet.unlockedColors?.includes(newColor)) {
    return pet;
  }

  pet.color = newColor;
  await firebase.database().ref(`pets/${userId}/${petId}/color`).set(newColor);
  return pet;
}
