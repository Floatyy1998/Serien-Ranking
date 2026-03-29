import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { Pet } from '../../types/pet.types';
import { PET_CONFIG } from './petConstants';
import { toLocalDateString } from '../../lib/date/date.utils';
import { getUserPet, getUserPets } from './petCore';

// Fuettere das Pet
export async function feedPet(userId: string, petId: string): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  if (!pet.isAlive) return pet;

  pet.hunger = Math.max(0, pet.hunger - PET_CONFIG.HUNGER_DECREASE_PER_FEED);
  pet.happiness = Math.min(100, pet.happiness + PET_CONFIG.HAPPINESS_INCREASE_PER_FEED);
  pet.lastFed = new Date();

  await firebase.database().ref(`pets/${userId}/${petId}`).update({
    hunger: pet.hunger,
    happiness: pet.happiness,
    lastFed: pet.lastFed.toISOString(),
  });

  return pet;
}

// Spiele mit dem Pet
export async function playWithPet(userId: string, petId: string): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  if (!pet.isAlive) return pet;

  pet.happiness = Math.min(100, pet.happiness + PET_CONFIG.HAPPINESS_INCREASE_PER_PLAY);
  pet.hunger = Math.min(100, pet.hunger + PET_CONFIG.HUNGER_INCREASE_PER_PLAY);

  await firebase.database().ref(`pets/${userId}/${petId}`).update({
    happiness: pet.happiness,
    hunger: pet.hunger,
  });

  return pet;
}

// Auto-Update (Hunger steigt ueber Zeit)
export async function updatePetStatus(userId: string, petId: string): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  if (!pet.isAlive) return pet;

  const now = new Date();
  const lastUpdated = pet.lastUpdated ? new Date(pet.lastUpdated) : new Date(pet.createdAt);
  const lastFedTime = pet.lastFed instanceof Date ? pet.lastFed : new Date(pet.lastFed);

  const minutesSinceLastUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
  if (minutesSinceLastUpdate < 1) return pet;

  if (isNaN(lastFedTime.getTime())) {
    console.warn('[PetService] Invalid lastFed date, resetting to current time');
    pet.lastFed = now;
    pet.hunger = 50;
  } else {
    const hoursSinceLastUpdate = minutesSinceLastUpdate / 60;
    const hungerIncrease = Math.floor(hoursSinceLastUpdate * 1.5);
    pet.hunger = Math.min(100, pet.hunger + hungerIncrease);
    const happinessDecrease = Math.floor(hoursSinceLastUpdate * 1);
    pet.happiness = Math.max(0, pet.happiness - happinessDecrease);
  }

  if (pet.hunger > PET_CONFIG.HIGH_HUNGER_THRESHOLD) {
    pet.happiness = Math.max(0, pet.happiness - PET_CONFIG.HIGH_HUNGER_HAPPINESS_PENALTY);
  }

  pet.hunger = isNaN(pet.hunger) ? PET_CONFIG.INITIAL_HUNGER : pet.hunger;
  pet.happiness = isNaN(pet.happiness) ? PET_CONFIG.INITIAL_HAPPINESS : pet.happiness;

  // Death-Logik: klar getrennte Ursachen
  let hasDied = false;
  let deathCause: Pet['deathCause'] = undefined;

  if (pet.hunger >= PET_CONFIG.HUNGER_DEATH_THRESHOLD) {
    hasDied = true;
    deathCause = 'hunger';
  } else if (pet.happiness <= PET_CONFIG.HAPPINESS_DEATH_THRESHOLD) {
    hasDied = true;
    deathCause = 'sadness';
  } else if (!isNaN(lastFedTime.getTime())) {
    const daysSinceLastFed = (now.getTime() - lastFedTime.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastFed >= PET_CONFIG.NEGLECT_DAYS_THRESHOLD) {
      hasDied = true;
      deathCause = 'neglect';
    }
  }

  if (hasDied) {
    pet.isAlive = false;
    pet.deathTime = now;
    pet.deathCause = deathCause;

    await firebase.database().ref(`pets/${userId}/${petId}`).update({
      isAlive: false,
      deathTime: now.toISOString(),
      deathCause: deathCause,
      hunger: pet.hunger,
      happiness: pet.happiness,
      lastUpdated: now.toISOString(),
    });
  } else {
    await firebase.database().ref(`pets/${userId}/${petId}`).update({
      hunger: pet.hunger,
      happiness: pet.happiness,
      lastUpdated: now.toISOString(),
    });
  }

  return pet;
}

// Update Status fuer ALLE Pets
export async function updateAllPetsStatus(userId: string): Promise<Pet[]> {
  const pets = await getUserPets(userId);
  const updated: Pet[] = [];
  for (const pet of pets) {
    const result = await updatePetStatus(userId, pet.id);
    if (result) updated.push(result);
  }
  return updated;
}

// Revival-Logik: klar getrennt von Death-Logik
export async function revivePet(userId: string, petId: string): Promise<Pet | null> {
  const pet = await getUserPet(userId, petId);
  if (!pet) return null;

  // Nur tote Pets koennen wiederbelebt werden
  if (pet.isAlive) return pet;

  const now = new Date();
  pet.isAlive = true;
  pet.hunger = PET_CONFIG.REVIVAL_HUNGER;
  pet.happiness = PET_CONFIG.REVIVAL_HAPPINESS;
  pet.lastFed = now;
  pet.lastUpdated = now;
  pet.reviveCount = (pet.reviveCount || 0) + 1;

  // Level-Penalty bei Revival
  if (pet.level > 1) {
    pet.level = Math.max(1, pet.level - 1);
    pet.experience = (pet.level - 1) * PET_CONFIG.XP_PER_LEVEL;
  }

  const updates: Record<string, string | number | boolean> = {
    isAlive: true,
    hunger: pet.hunger,
    happiness: pet.happiness,
    lastFed: now.toISOString(),
    lastUpdated: now.toISOString(),
    reviveCount: pet.reviveCount,
    level: pet.level,
    experience: pet.experience,
  };

  await firebase.database().ref(`pets/${userId}/${petId}`).update(updates);
  // Todesfelder explizit entfernen
  await firebase.database().ref(`pets/${userId}/${petId}/deathTime`).remove();
  await firebase.database().ref(`pets/${userId}/${petId}/deathCause`).remove();

  return pet;
}

// Streak Shield: Pet opfert XP um die Watch Streak zu retten
export async function activateStreakShield(
  userId: string,
  petId: string
): Promise<{
  success: boolean;
  error?: string;
  newLevel?: number;
  newExperience?: number;
}> {
  try {
    const pet = await getUserPet(userId, petId);
    if (!pet) return { success: false, error: 'Pet nicht gefunden' };
    if (!pet.isAlive) return { success: false, error: 'Dein Pet lebt nicht' };

    // Check if pet can afford it (including level-down)
    const totalXP = (pet.level - 1) * PET_CONFIG.XP_PER_LEVEL + pet.experience;
    if (totalXP < PET_CONFIG.STREAK_SHIELD_XP_COST) {
      return {
        success: false,
        error: `Nicht genug XP (${pet.experience} XP, Level ${pet.level})`,
      };
    }

    // Deduct XP with level-down support
    let newExperience = pet.experience - PET_CONFIG.STREAK_SHIELD_XP_COST;
    let newLevel = pet.level;
    while (newExperience < 0 && newLevel > 1) {
      newLevel--;
      newExperience += newLevel * PET_CONFIG.XP_PER_LEVEL;
    }
    newExperience = Math.max(0, newExperience);

    // Reduce happiness
    const newHappiness = Math.max(0, pet.happiness - PET_CONFIG.STREAK_SHIELD_HAPPINESS_COST);

    // Update pet in Firebase
    await firebase.database().ref(`pets/${userId}/${petId}`).update({
      experience: newExperience,
      level: newLevel,
      happiness: newHappiness,
    });

    // Update streak: set lastWatchDate to yesterday so status becomes at_risk
    const year = new Date().getFullYear();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);
    const todayStr = toLocalDateString();

    const streakRef = firebase.database().ref(`${userId}/wrapped/${year}/streak`);
    const streakSnapshot = await streakRef.once('value');
    const streakData = streakSnapshot.val() as Record<string, unknown> | null;

    if (streakData) {
      await streakRef.update({
        lastWatchDate: yesterdayStr,
        lastShieldUsedDate: todayStr,
        shieldUsedCount: ((streakData.shieldUsedCount as number) || 0) + 1,
      });
    }

    return { success: true, newLevel, newExperience };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PetService] Streak Shield activation failed: ${message}`);
    return { success: false, error: 'Unbekannter Fehler' };
  }
}
