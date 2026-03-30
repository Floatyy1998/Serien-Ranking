import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { Pet } from '../../types/pet.types';
import { PET_CONFIG } from './petConstants';
import { getUserPet, getUserPets } from './petCore';
import {
  checkAndUnlockAccessories,
  checkAchievements,
  rollAccessoryDrop,
} from './petAccessoryManager';
import type { AccessoryDrop } from './petAccessoryManager';

// Update wenn Episode geschaut wurde
export async function watchedEpisode(userId: string, petId: string): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  if (!pet.isAlive) return pet;

  pet.episodesWatched++;
  pet.experience += PET_CONFIG.BASE_XP_PER_EPISODE;

  let newLevel = pet.level;
  let currentXP = pet.experience;

  while (currentXP >= PET_CONFIG.XP_PER_LEVEL * newLevel) {
    currentXP -= PET_CONFIG.XP_PER_LEVEL * newLevel;
    newLevel++;
  }

  const hasLeveledUp = newLevel > pet.level;
  if (hasLeveledUp) {
    pet.level = newLevel;
    pet.experience = currentXP;
    pet.happiness = 100;
    pet.hunger = 0;
  }

  const updateData: Record<string, number> = {
    episodesWatched: pet.episodesWatched,
    experience: pet.experience,
    level: pet.level,
  };

  if (hasLeveledUp) {
    updateData.happiness = pet.happiness;
    updateData.hunger = pet.hunger;
  }

  await firebase.database().ref(`pets/${userId}/${petId}`).update(updateData);

  return pet;
}

// Genre-Matching-Logik
const genreAliases: Record<string, string[]> = {
  'action & adventure': ['action & abenteuer', 'action', 'abenteuer', 'adventure'],
  'action & abenteuer': ['action & adventure', 'action', 'abenteuer', 'adventure'],
  comedy: ['komoedie'],
  komoedie: ['comedy'],
  crime: ['krimi'],
  krimi: ['crime'],
  'sci-fi & fantasy': ['science fiction', 'fantasy', 'sci-fi'],
  documentary: ['dokumentarfilm', 'dokumentation', 'doku'],
  dokumentarfilm: ['documentary', 'dokumentation'],
  mystery: ['geheimnis'],
  family: ['familie'],
  familie: ['family'],
};

function matchesGenre(favoriteGenre: string, genres: string[]): boolean {
  const favLower = favoriteGenre.toLowerCase();
  const favAliases = genreAliases[favLower] || [];

  return genres.some((g) => {
    const gLower = g.toLowerCase();
    return (
      favLower === gLower ||
      gLower.includes(favLower) ||
      favLower.includes(gLower) ||
      favAliases.some((alias) => gLower.includes(alias) || alias.includes(gLower))
    );
  });
}

// Schaue Serie mit Genre-Boost (einzelnes Pet)
export async function watchedSeriesWithGenre(
  userId: string,
  petId: string,
  genres: string[]
): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet || !pet.isAlive) return pet;

  let xpGain: number = PET_CONFIG.BASE_XP_PER_EPISODE;
  let genreMatched = false;

  if (pet.favoriteGenre && genres.length > 0) {
    genreMatched = matchesGenre(pet.favoriteGenre, genres);
  }

  if (genreMatched) {
    xpGain = PET_CONFIG.GENRE_MATCH_XP_PER_EPISODE;
    pet.happiness = Math.min(100, pet.happiness + PET_CONFIG.GENRE_MATCH_HAPPINESS_BONUS);
  }

  // Healthy pet XP bonus
  const isHealthy =
    pet.hunger < PET_CONFIG.HEALTHY_HUNGER_THRESHOLD &&
    pet.happiness > PET_CONFIG.HEALTHY_HAPPINESS_THRESHOLD;
  if (isHealthy) {
    xpGain = Math.floor(xpGain * PET_CONFIG.HEALTHY_XP_MULTIPLIER);
  }

  pet.episodesWatched++;
  pet.experience += xpGain;
  pet.totalSeriesWatched = (pet.totalSeriesWatched || 0) + 1;

  let newLevel = pet.level;
  let currentXP = pet.experience;

  while (currentXP >= PET_CONFIG.XP_PER_LEVEL * newLevel) {
    currentXP -= PET_CONFIG.XP_PER_LEVEL * newLevel;
    newLevel++;
  }

  const hasLeveledUp = newLevel > pet.level;
  if (hasLeveledUp) {
    pet.level = newLevel;
    pet.experience = currentXP;
    pet.happiness = 100;
    pet.hunger = 0;

    await checkAndUnlockAccessories(pet);
  }

  await checkAchievements(pet);

  const updateData: Record<string, number | undefined> = {
    episodesWatched: pet.episodesWatched,
    experience: pet.experience,
    level: pet.level,
    totalSeriesWatched: pet.totalSeriesWatched,
  };

  if (hasLeveledUp || genreMatched) {
    updateData.happiness = pet.happiness;
  }
  if (hasLeveledUp) {
    updateData.hunger = pet.hunger;
  }

  await firebase.database().ref(`pets/${userId}/${petId}`).update(updateData);

  return pet;
}

// XP fuer ALLE lebenden Pets + Accessory Drop Roll
export async function watchedSeriesWithGenreAllPets(
  userId: string,
  genres: string[]
): Promise<AccessoryDrop | null> {
  const pets = await getUserPets(userId);
  for (const pet of pets) {
    if (pet.isAlive) {
      await watchedSeriesWithGenre(userId, pet.id, genres);
    }
  }

  // Roll for accessory drop
  return rollAccessoryDrop(userId);
}
