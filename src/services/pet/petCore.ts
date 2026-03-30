import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { Pet } from '../../types/pet.types';
import { PET_COLORS, GENRE_FAVORITES } from '../../types/pet.types';
import { PET_CONFIG } from './petConstants';
import { generateStarterAccessories } from './petAccessoryManager';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/** Erkennt das alte Single-Pet-Format (direkt name/type/id auf Root-Ebene) */
function isLegacySinglePet(data: unknown): data is { name: string; type: string; id: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'type' in data &&
    'id' in data &&
    typeof (data as Record<string, unknown>).name === 'string' &&
    typeof (data as Record<string, unknown>).type === 'string' &&
    typeof (data as Record<string, unknown>).id === 'string'
  );
}

/** Prueft ob das Objekt ein gueltiger Pet-Datensatz aus Firebase ist */
export function isRawPetData(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && 'type' in data;
}

// ============================================================================
// MIGRATION
// ============================================================================

const migrationDone: Set<string> = new Set();

export async function migrateIfNeeded(userId: string): Promise<void> {
  if (migrationDone.has(userId)) return;

  try {
    const snapshot = await firebase.database().ref(`pets/${userId}`).once('value');
    if (!snapshot.exists()) {
      migrationDone.add(userId);
      return;
    }

    const data: unknown = snapshot.val();

    if (isLegacySinglePet(data)) {
      const petId = data.id;
      await firebase
        .database()
        .ref(`pets/${userId}`)
        .set({
          [petId]: data,
        });
      await firebase.database().ref(`petWidget/${userId}/activePetId`).set(petId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PetService] Migration failed for user ${userId}: ${message}`);
  }

  migrationDone.add(userId);
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export async function getUserPets(userId: string): Promise<Pet[]> {
  await migrateIfNeeded(userId);

  const snapshot = await firebase.database().ref(`pets/${userId}`).once('value');
  if (!snapshot.exists()) return [];

  const data = snapshot.val() as Record<string, unknown> | null;
  if (!data) return [];

  const pets: Pet[] = [];

  for (const petId of Object.keys(data)) {
    const petData = data[petId];
    if (!isRawPetData(petData)) continue;

    if (!petData.createdAt) {
      petData.createdAt = Date.now();
      await firebase.database().ref(`pets/${userId}/${petId}/createdAt`).set(petData.createdAt);
    }

    if (!petData.favoriteGenre || petData.favoriteGenre === 'All') {
      const randomGenre = GENRE_FAVORITES[Math.floor(Math.random() * GENRE_FAVORITES.length)];
      petData.favoriteGenre = randomGenre;
      await firebase.database().ref(`pets/${userId}/${petId}/favoriteGenre`).set(randomGenre);
    }

    pets.push({
      ...(petData as unknown as Pet),
      lastFed: new Date(petData.lastFed as string | number),
      createdAt: new Date(petData.createdAt as string | number),
    });
  }

  // Sync: Alle Pets muessen die gleichen Accessories haben
  if (pets.length > 1) {
    const accSets = pets.map((p) =>
      (p.accessories || [])
        .map((a) => a.id)
        .sort()
        .join(',')
    );
    const allSame = accSets.every((s) => s === accSets[0]);

    if (!allSame) {
      // Nimm die groesste Sammlung als Basis
      let bestAccessories = pets[0].accessories || [];
      for (const p of pets) {
        if ((p.accessories || []).length > bestAccessories.length) {
          bestAccessories = p.accessories || [];
        }
      }
      // Falls alle nur Starter haben (<=3), reset auf gleiche Starter
      if (bestAccessories.length <= 3) {
        bestAccessories = generateStarterAccessories();
      }
      for (const p of pets) {
        // Behalte den equipped-Status des jeweiligen Pets
        const equippedId = p.accessories?.find((a) => a.equipped)?.id;
        const synced = bestAccessories.map((a) => ({
          ...a,
          equipped: a.id === equippedId,
        }));
        // Falls nichts equipped war, equip das erste
        if (!synced.some((a) => a.equipped) && synced.length > 0) {
          synced[0].equipped = true;
        }
        p.accessories = synced;
        await firebase.database().ref(`pets/${userId}/${p.id}/accessories`).set(synced);
      }
    }
  }

  return pets;
}

export async function getUserPet(userId: string, petId: string): Promise<Pet | null> {
  await migrateIfNeeded(userId);

  const snapshot = await firebase.database().ref(`pets/${userId}/${petId}`).once('value');
  if (!snapshot.exists()) return null;

  const petData = snapshot.val() as Record<string, unknown>;

  if (!petData.createdAt) {
    const now = new Date();
    petData.createdAt = now.getTime();
    await firebase.database().ref(`pets/${userId}/${petId}/createdAt`).set(petData.createdAt);
  }

  if (!petData.favoriteGenre || petData.favoriteGenre === 'All') {
    const randomGenre = GENRE_FAVORITES[Math.floor(Math.random() * GENRE_FAVORITES.length)];
    petData.favoriteGenre = randomGenre;
    await firebase.database().ref(`pets/${userId}/${petId}/favoriteGenre`).set(randomGenre);
  }

  return {
    ...(petData as unknown as Pet),
    lastFed: new Date(petData.lastFed as string | number),
    createdAt: new Date(petData.createdAt as string | number),
  };
}

export async function getActivePetId(userId: string): Promise<string | null> {
  const snapshot = await firebase.database().ref(`petWidget/${userId}/activePetId`).once('value');
  return (snapshot.val() as string | null) || null;
}

export async function setActivePetId(userId: string, petId: string): Promise<void> {
  await firebase.database().ref(`petWidget/${userId}/activePetId`).set(petId);
}

export async function canCreateNewPet(userId: string): Promise<boolean> {
  const pets = await getUserPets(userId);
  if (pets.length === 0) return false;
  return pets.every((p) => p.level >= PET_CONFIG.NEW_PET_LEVEL_REQUIREMENT);
}

export async function createPet(userId: string, name: string, type: Pet['type']): Promise<Pet> {
  const colors = Object.keys(PET_COLORS);
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const patterns: Pet['pattern'][] = ['spots', 'stripes', 'plain', 'patches'];
  const eyeColors = ['#000000', '#0066CC', '#00AA00', '#8B4513', '#FFD700', '#FF0000'];
  const personalities: Pet['personality'][] = ['lazy', 'playful', 'brave', 'shy', 'smart'];
  const sizes: Pet['size'][] = ['tiny', 'small', 'normal', 'big', 'chonky'];

  const now = new Date();
  const newPet: Pet = {
    id: `pet-${Date.now()}`,
    userId,
    name,
    type,
    color: randomColor,
    level: 1,
    experience: 0,
    hunger: PET_CONFIG.INITIAL_HUNGER,
    happiness: PET_CONFIG.INITIAL_HAPPINESS,
    lastFed: now,
    lastUpdated: now,
    episodesWatched: 0,
    createdAt: now,
    isAlive: true,
    reviveCount: 0,
    pattern: patterns[Math.floor(Math.random() * patterns.length)],
    eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
    personality: personalities[Math.floor(Math.random() * personalities.length)],
    size: sizes[Math.floor(Math.random() * sizes.length)],
    mood: 'happy',
    favoriteGenre: GENRE_FAVORITES[Math.floor(Math.random() * GENRE_FAVORITES.length)],
    accessories: generateStarterAccessories(),
    unlockedColors: [],
    unlockedPatterns: [],
    totalSeriesWatched: 0,
    achievementPoints: 0,
  };

  await migrateIfNeeded(userId);
  await firebase.database().ref(`pets/${userId}/${newPet.id}`).set(newPet);
  await firebase.database().ref(`petWidget/${userId}/activePetId`).set(newPet.id);
  return newPet;
}

export async function deletePet(userId: string, petId: string): Promise<void> {
  await firebase.database().ref(`pets/${userId}/${petId}`).remove();
}

// Pet Widget Position Management
export async function getPetWidgetPosition(userId: string): Promise<
  | {
      edge: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      offsetX: number;
      offsetY: number;
    }
  | { xPercent: number; yPercent: number }
  | null
> {
  try {
    const snapshot = await firebase.database().ref(`petWidget/${userId}/position`).once('value');
    return snapshot.val() as
      | {
          edge: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
          offsetX: number;
          offsetY: number;
        }
      | { xPercent: number; yPercent: number }
      | null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PetService] Failed to get widget position: ${message}`);
    return null;
  }
}

export async function savePetWidgetPosition(
  userId: string,
  position: {
    edge: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    offsetX: number;
    offsetY: number;
  }
): Promise<void> {
  try {
    await firebase.database().ref(`petWidget/${userId}/position`).set(position);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PetService] Failed to save widget position: ${message}`);
  }
}
