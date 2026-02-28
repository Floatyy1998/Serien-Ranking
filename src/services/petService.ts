import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { Pet, PET_COLORS, ACCESSORIES, GENRE_FAVORITES, PetAccessory } from '../types/pet.types';
import { PET_CONFIG } from './petConstants';
import { toLocalDateString } from '../lib/date/date.utils';

class PetService {
  private migrationDone: Set<string> = new Set();

  // Migration: altes Single-Pet-Format → neues Multi-Pet-Format
  private async migrateIfNeeded(userId: string): Promise<void> {
    if (this.migrationDone.has(userId)) return;

    const snapshot = await firebase.database().ref(`pets/${userId}`).once('value');
    if (!snapshot.exists()) {
      this.migrationDone.add(userId);
      return;
    }

    const data = snapshot.val();

    // Altes Format erkennen: data hat direkt 'name' und 'type' (Pet-Objekt)
    // Neues Format: data hat petId-Keys als Kinder
    if (data.name && data.type && data.id) {
      const petId = data.id;
      await firebase
        .database()
        .ref(`pets/${userId}`)
        .set({
          [petId]: data,
        });
      await firebase.database().ref(`petWidget/${userId}/activePetId`).set(petId);
    }

    this.migrationDone.add(userId);
  }

  // Hole ALLE Pets eines Users
  async getUserPets(userId: string): Promise<Pet[]> {
    await this.migrateIfNeeded(userId);

    const snapshot = await firebase.database().ref(`pets/${userId}`).once('value');
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    const pets: Pet[] = [];

    for (const petId of Object.keys(data)) {
      const petData = data[petId];
      if (!petData || typeof petData !== 'object' || !petData.type) continue;

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
        ...petData,
        lastFed: new Date(petData.lastFed),
        createdAt: new Date(petData.createdAt),
      });
    }

    return pets;
  }

  // Hole ein einzelnes Pet
  async getUserPet(userId: string, petId: string): Promise<Pet | null> {
    await this.migrateIfNeeded(userId);

    const snapshot = await firebase.database().ref(`pets/${userId}/${petId}`).once('value');
    if (!snapshot.exists()) return null;

    const petData = snapshot.val();

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
      ...petData,
      lastFed: new Date(petData.lastFed),
      createdAt: new Date(petData.createdAt),
    };
  }

  // Aktives Pet für Widget
  async getActivePetId(userId: string): Promise<string | null> {
    const snapshot = await firebase.database().ref(`petWidget/${userId}/activePetId`).once('value');
    return snapshot.val() || null;
  }

  async setActivePetId(userId: string, petId: string): Promise<void> {
    await firebase.database().ref(`petWidget/${userId}/activePetId`).set(petId);
  }

  // Prüfe ob 2. Pet erstellt werden kann
  async canCreateSecondPet(userId: string): Promise<boolean> {
    const pets = await this.getUserPets(userId);
    if (pets.length === 0 || pets.length >= PET_CONFIG.MAX_PETS) return false;
    return pets.some((p) => p.level >= PET_CONFIG.SECOND_PET_LEVEL_REQUIREMENT);
  }

  // Erstelle ein neues Pet für den User
  async createPet(userId: string, name: string, type: Pet['type']): Promise<Pet> {
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
      accessories: [
        {
          id: 'collar',
          type: 'collar' as const,
          name: 'Halsband',
          icon: '📿',
          equipped: true,
          color: '#8B4513',
        },
      ],
      unlockedColors: [],
      unlockedPatterns: [],
      totalSeriesWatched: 0,
      achievementPoints: 0,
    };

    await this.migrateIfNeeded(userId);
    await firebase.database().ref(`pets/${userId}/${newPet.id}`).set(newPet);
    await firebase.database().ref(`petWidget/${userId}/activePetId`).set(newPet.id);
    return newPet;
  }

  // Füttere das Pet
  async feedPet(userId: string, petId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
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
  async playWithPet(userId: string, petId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
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

  // Update wenn Episode geschaut wurde
  async watchedEpisode(userId: string, petId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
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

  // Auto-Update (Hunger steigt über Zeit)
  async updatePetStatus(userId: string, petId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
    if (!pet) return null;

    if (!pet.isAlive) return pet;

    const now = new Date();
    const lastUpdated = pet.lastUpdated ? new Date(pet.lastUpdated) : new Date(pet.createdAt);
    const lastFedTime = pet.lastFed instanceof Date ? pet.lastFed : new Date(pet.lastFed);

    const minutesSinceLastUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    if (minutesSinceLastUpdate < 1) return pet;

    if (isNaN(lastFedTime.getTime())) {
      console.warn('Invalid lastFed date, using current time');
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

    let hasDied = false;
    let deathCause: Pet['deathCause'] = undefined;

    if (pet.hunger >= PET_CONFIG.HUNGER_DEATH_THRESHOLD) {
      hasDied = true;
      deathCause = 'hunger';
    } else if (pet.happiness <= PET_CONFIG.HAPPINESS_DEATH_THRESHOLD) {
      hasDied = true;
      deathCause = 'sadness';
    } else if (lastFedTime && !isNaN(lastFedTime.getTime())) {
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

  // Update Status für ALLE Pets
  async updateAllPetsStatus(userId: string): Promise<Pet[]> {
    const pets = await this.getUserPets(userId);
    const updated: Pet[] = [];
    for (const pet of pets) {
      const result = await this.updatePetStatus(userId, pet.id);
      if (result) updated.push(result);
    }
    return updated;
  }

  // Wiederbelebe das Pet
  async revivePet(userId: string, petId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
    if (!pet) return null;

    if (pet.isAlive) return pet;

    pet.isAlive = true;
    pet.hunger = PET_CONFIG.REVIVAL_HUNGER;
    pet.happiness = PET_CONFIG.REVIVAL_HAPPINESS;
    pet.lastFed = new Date();
    pet.reviveCount = (pet.reviveCount || 0) + 1;

    if (pet.level > 1) {
      pet.level = Math.max(1, pet.level - 1);
      pet.experience = (pet.level - 1) * PET_CONFIG.XP_PER_LEVEL;
    }

    const updates: Record<string, string | number | boolean> = {
      isAlive: true,
      hunger: pet.hunger,
      happiness: pet.happiness,
      lastFed: pet.lastFed.toISOString(),
      reviveCount: pet.reviveCount,
      level: pet.level,
      experience: pet.experience,
    };

    await firebase.database().ref(`pets/${userId}/${petId}`).update(updates);
    await firebase.database().ref(`pets/${userId}/${petId}/deathTime`).remove();
    await firebase.database().ref(`pets/${userId}/${petId}/deathCause`).remove();

    return pet;
  }

  // Lösche Pet
  async deletePet(userId: string, petId: string): Promise<void> {
    await firebase.database().ref(`pets/${userId}/${petId}`).remove();
  }

  // Schaue Serie mit Genre-Boost (einzelnes Pet)
  async watchedSeriesWithGenre(
    userId: string,
    petId: string,
    genres: string[]
  ): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
    if (!pet || !pet.isAlive) return pet;

    let xpGain: number = PET_CONFIG.BASE_XP_PER_EPISODE;
    let genreMatched = false;

    if (pet.favoriteGenre && genres.length > 0) {
      const genreAliases: Record<string, string[]> = {
        'action & adventure': ['action & abenteuer', 'action', 'abenteuer', 'adventure'],
        'action & abenteuer': ['action & adventure', 'action', 'abenteuer', 'adventure'],
        comedy: ['komödie'],
        komödie: ['comedy'],
        crime: ['krimi'],
        krimi: ['crime'],
        'sci-fi & fantasy': ['science fiction', 'fantasy', 'sci-fi'],
        documentary: ['dokumentarfilm', 'dokumentation', 'doku'],
        dokumentarfilm: ['documentary', 'dokumentation'],
        mystery: ['geheimnis'],
        family: ['familie'],
        familie: ['family'],
      };

      const favLower = pet.favoriteGenre.toLowerCase();
      const favAliases = genreAliases[favLower] || [];

      genreMatched = genres.some((g) => {
        const gLower = g.toLowerCase();
        return (
          favLower === gLower ||
          gLower.includes(favLower) ||
          favLower.includes(gLower) ||
          favAliases.some((alias) => gLower.includes(alias) || alias.includes(gLower))
        );
      });
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

      await this.checkAndUnlockAccessories(pet);
    }

    await this.checkAchievements(pet);

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

  // XP für ALLE lebenden Pets
  async watchedSeriesWithGenreAllPets(userId: string, genres: string[]): Promise<void> {
    const pets = await this.getUserPets(userId);
    for (const pet of pets) {
      if (pet.isAlive) {
        await this.watchedSeriesWithGenre(userId, pet.id, genres);
      }
    }
  }

  // Accessoire ausrüsten/ablegen
  async toggleAccessory(userId: string, petId: string, accessoryId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
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

  // Prüfe und schalte Accessoires frei
  private async checkAndUnlockAccessories(pet: Pet): Promise<void> {
    const month = new Date().getMonth() + 1;

    if (pet.level >= PET_CONFIG.CROWN_LEVEL_REQUIREMENT && !this.hasAccessory(pet, 'crown')) {
      if (!pet.accessories) pet.accessories = [];
      pet.accessories.push({
        id: 'crown',
        type: 'crown' as const,
        name: 'Krone',
        icon: '👑',
        equipped: false,
      });
      await firebase
        .database()
        .ref(`pets/${pet.userId}/${pet.id}/accessories`)
        .set(pet.accessories);
    }

    if (month === PET_CONFIG.SANTA_HAT_MONTH && !this.hasAccessory(pet, 'santaHat')) {
      if (!pet.accessories) pet.accessories = [];
      pet.accessories.push({
        id: 'santaHat',
        type: 'hat' as const,
        name: 'Weihnachtsmütze',
        icon: '🎅',
        equipped: false,
      });
      await firebase
        .database()
        .ref(`pets/${pet.userId}/${pet.id}/accessories`)
        .set(pet.accessories);
    }

    if (
      (PET_CONFIG.SUNGLASSES_MONTHS as readonly number[]).includes(month) &&
      !this.hasAccessory(pet, 'sunglasses')
    ) {
      if (!pet.accessories) pet.accessories = [];
      pet.accessories.push({
        id: 'sunglasses',
        type: 'glasses' as const,
        name: 'Sonnenbrille',
        icon: '🕶️',
        equipped: false,
      });
      await firebase
        .database()
        .ref(`pets/${pet.userId}/${pet.id}/accessories`)
        .set(pet.accessories);
    }
  }

  // Check Achievements für spezielle Farben/Muster
  private async checkAchievements(pet: Pet): Promise<void> {
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

  private hasAccessory(pet: Pet, accessoryId: string): boolean {
    return pet.accessories?.some((a) => a.id === accessoryId) || false;
  }

  // Ändere Pet-Farbe
  async changePetColor(userId: string, petId: string, newColor: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
    if (!pet) return null;

    if (!PET_COLORS[newColor] && !pet.unlockedColors?.includes(newColor)) {
      return pet;
    }

    pet.color = newColor;
    await firebase.database().ref(`pets/${userId}/${petId}/color`).set(newColor);
    return pet;
  }

  // Ändere Pet-Muster
  async changePetPattern(userId: string, petId: string, newPattern: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId, petId);
    if (!pet) return null;

    const basicPatterns = ['spots', 'stripes', 'plain', 'patches'];

    if (!basicPatterns.includes(newPattern) && !pet.unlockedPatterns?.includes(newPattern)) {
      return pet;
    }

    pet.pattern = newPattern as Pet['pattern'];
    await firebase.database().ref(`pets/${userId}/${petId}/pattern`).set(newPattern);
    return pet;
  }

  // Pet Widget Position Management
  async getPetWidgetPosition(userId: string): Promise<
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
      return snapshot.val();
    } catch (error) {
      console.error('Error getting pet widget position:', error);
      return null;
    }
  }

  // Streak Shield: Pet opfert XP um die Watch Streak zu retten
  async activateStreakShield(
    userId: string,
    petId: string
  ): Promise<{
    success: boolean;
    error?: string;
    newLevel?: number;
    newExperience?: number;
  }> {
    try {
      const pet = await this.getUserPet(userId, petId);
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
      const streakData = streakSnapshot.val();

      if (streakData) {
        await streakRef.update({
          lastWatchDate: yesterdayStr,
          lastShieldUsedDate: todayStr,
          shieldUsedCount: (streakData.shieldUsedCount || 0) + 1,
        });
      }

      return { success: true, newLevel, newExperience };
    } catch (error) {
      console.error('Streak Shield error:', error);
      return { success: false, error: 'Unbekannter Fehler' };
    }
  }

  async savePetWidgetPosition(
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
      console.error('Error saving pet widget position:', error);
    }
  }
}

export const petService = new PetService();
