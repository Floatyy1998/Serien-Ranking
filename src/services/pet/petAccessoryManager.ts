import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { Pet, PET_COLORS, ACCESSORIES, PetAccessory } from '../../types/pet.types';
import { PET_CONFIG } from './petConstants';
import { getUserPet } from './petCore';

// Accessoire ausruesten/ablegen
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

  const existingAccessory = pet.accessories.find((a) => a.id === accessoryId);

  if (existingAccessory) {
    existingAccessory.equipped = !existingAccessory.equipped;
  } else {
    const accessoryData = ACCESSORIES[accessoryId];
    if (accessoryData) {
      const newAccessory: PetAccessory = {
        id: accessoryId,
        ...accessoryData,
        equipped: true,
      };
      pet.accessories.push(newAccessory);
    }
  }

  await firebase.database().ref(`pets/${userId}/${petId}/accessories`).set(pet.accessories);
  return pet;
}

function hasAccessory(pet: Pet, accessoryId: string): boolean {
  return pet.accessories?.some((a) => a.id === accessoryId) || false;
}

// Pruefe und schalte Accessoires frei
export async function checkAndUnlockAccessories(pet: Pet): Promise<void> {
  const month = new Date().getMonth() + 1;

  if (pet.level >= PET_CONFIG.CROWN_LEVEL_REQUIREMENT && !hasAccessory(pet, 'crown')) {
    if (!pet.accessories) pet.accessories = [];
    pet.accessories.push({
      id: 'crown',
      type: 'crown' as const,
      name: 'Krone',
      icon: '\uD83D\uDC51',
      equipped: false,
    });
    await firebase.database().ref(`pets/${pet.userId}/${pet.id}/accessories`).set(pet.accessories);
  }

  if (month === PET_CONFIG.SANTA_HAT_MONTH && !hasAccessory(pet, 'santaHat')) {
    if (!pet.accessories) pet.accessories = [];
    pet.accessories.push({
      id: 'santaHat',
      type: 'hat' as const,
      name: 'Weihnachtsmuetze',
      icon: '\uD83C\uDF85',
      equipped: false,
    });
    await firebase.database().ref(`pets/${pet.userId}/${pet.id}/accessories`).set(pet.accessories);
  }

  if (
    (PET_CONFIG.SUNGLASSES_MONTHS as readonly number[]).includes(month) &&
    !hasAccessory(pet, 'sunglasses')
  ) {
    if (!pet.accessories) pet.accessories = [];
    pet.accessories.push({
      id: 'sunglasses',
      type: 'glasses' as const,
      name: 'Sonnenbrille',
      icon: '\uD83D\uDD76\uFE0F',
      equipped: false,
    });
    await firebase.database().ref(`pets/${pet.userId}/${pet.id}/accessories`).set(pet.accessories);
  }
}

// Check Achievements fuer spezielle Farben/Muster
export async function checkAchievements(pet: Pet): Promise<void> {
  const updates: Record<string, string[] | undefined> = {};

  if (
    pet.totalSeriesWatched! >= PET_CONFIG.SILVER_COLOR_SERIES_THRESHOLD &&
    !pet.unlockedColors?.includes('silver')
  ) {
    pet.unlockedColors = [...(pet.unlockedColors || []), 'silver'];
    updates.unlockedColors = pet.unlockedColors;
  }

  if (
    pet.totalSeriesWatched! >= PET_CONFIG.GOLD_COLOR_SERIES_THRESHOLD &&
    !pet.unlockedColors?.includes('gold')
  ) {
    pet.unlockedColors = [...(pet.unlockedColors || []), 'gold'];
    updates.unlockedColors = pet.unlockedColors;
  }

  if (
    pet.totalSeriesWatched! >= PET_CONFIG.RAINBOW_COLOR_SERIES_THRESHOLD &&
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

// Aendere Pet-Farbe
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

// Aendere Pet-Muster
export async function changePetPattern(
  userId: string,
  petId: string,
  newPattern: string
): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  const basicPatterns = ['spots', 'stripes', 'plain', 'patches'];

  if (!basicPatterns.includes(newPattern) && !pet.unlockedPatterns?.includes(newPattern)) {
    return pet;
  }

  pet.pattern = newPattern as Pet['pattern'];
  await firebase.database().ref(`pets/${userId}/${petId}/pattern`).set(newPattern);
  return pet;
}
