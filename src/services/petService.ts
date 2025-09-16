import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { Pet, PET_COLORS, ACCESSORIES, GENRE_FAVORITES, PetAccessory } from '../types/pet.types';

class PetService {
  // Erstelle ein neues Pet für den User
  async createPet(userId: string, name: string, type: Pet['type']): Promise<Pet> {
    const colors = Object.keys(PET_COLORS);
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Zufällige einzigartige Merkmale
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
      hunger: 50,
      happiness: 75,
      lastFed: now,
      lastUpdated: now,
      episodesWatched: 0,
      createdAt: now,
      isAlive: true,
      reviveCount: 0,
      // Einzigartige Merkmale
      pattern: patterns[Math.floor(Math.random() * patterns.length)],
      eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
      personality: personalities[Math.floor(Math.random() * personalities.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      // Neue Features
      mood: 'happy',
      favoriteGenre: GENRE_FAVORITES[Math.floor(Math.random() * GENRE_FAVORITES.length)],
      accessories: [
        // Start-Accessoire (Halsband)
        {
          id: 'collar',
          type: 'collar' as const,
          name: 'Halsband',
          icon: '📿',
          equipped: true, // Direkt ausgerüstet
          color: '#8B4513'
        }
      ],
      unlockedColors: [],
      unlockedPatterns: [],
      totalSeriesWatched: 0,
      achievementPoints: 0
    };

    await firebase.database().ref(`pets/${userId}`).set(newPet);
    return newPet;
  }

  // Hole das Pet des Users
  async getUserPet(userId: string): Promise<Pet | null> {
    const snapshot = await firebase.database().ref(`pets/${userId}`).once('value');
    if (!snapshot.exists()) return null;

    const petData = snapshot.val();

    // Falls createdAt fehlt, setze es auf das heutige Datum und speichere es
    if (!petData.createdAt) {
      const now = new Date();
      petData.createdAt = now.getTime();
      await firebase.database().ref(`pets/${userId}/createdAt`).set(petData.createdAt);
    }

    // Migration: Falls favoriteGenre fehlt oder "All" ist, füge ein zufälliges hinzu
    if (!petData.favoriteGenre || petData.favoriteGenre === 'All') {
      const randomGenre = GENRE_FAVORITES[Math.floor(Math.random() * GENRE_FAVORITES.length)];
      petData.favoriteGenre = randomGenre;
      await firebase.database().ref(`pets/${userId}/favoriteGenre`).set(randomGenre);
    }

    return {
      ...petData,
      lastFed: new Date(petData.lastFed),
      createdAt: new Date(petData.createdAt)
    };
  }

  // Füttere das Pet
  async feedPet(userId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    // Kann tote Pets nicht füttern
    if (!pet.isAlive) {
      return pet;
    }

    pet.hunger = Math.max(0, pet.hunger - 30);
    pet.happiness = Math.min(100, pet.happiness + 10);
    pet.lastFed = new Date();

    await firebase.database().ref(`pets/${userId}`).update({
      hunger: pet.hunger,
      happiness: pet.happiness,
      lastFed: pet.lastFed.toISOString()
    });

    return pet;
  }

  // Spiele mit dem Pet
  async playWithPet(userId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    // Kann nicht mit toten Pets spielen
    if (!pet.isAlive) {
      return pet;
    }

    pet.happiness = Math.min(100, pet.happiness + 20);
    pet.hunger = Math.min(100, pet.hunger + 10); // Spielen macht hungrig

    await firebase.database().ref(`pets/${userId}`).update({
      happiness: pet.happiness,
      hunger: pet.hunger
    });

    return pet;
  }

  // Update wenn Episode geschaut wurde
  async watchedEpisode(userId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    // Tote Pets bekommen keine XP
    if (!pet.isAlive) {
      return pet;
    }

    pet.episodesWatched++;
    pet.experience += 10;

    // Level up alle 100 XP - berechne korrekt mit Übertrag
    const xpPerLevel = 100;
    let newLevel = pet.level;
    let currentXP = pet.experience;

    // Prüfe für Level-Ups
    while (currentXP >= xpPerLevel * newLevel) {
      currentXP -= xpPerLevel * newLevel;
      newLevel++;
    }

    const hasLeveledUp = newLevel > pet.level;
    if (hasLeveledUp) {
      pet.level = newLevel;
      pet.experience = currentXP; // Setze XP auf den Übertrag
      pet.happiness = 100; // Level up macht glücklich!
      pet.hunger = 0; // Level up macht satt!
    }

    const updateData: any = {
      episodesWatched: pet.episodesWatched,
      experience: pet.experience,
      level: pet.level
    };

    // Nur bei Level-Up Hunger/Happiness updaten
    if (hasLeveledUp) {
      updateData.happiness = pet.happiness;
      updateData.hunger = pet.hunger;
    }

    await firebase.database().ref(`pets/${userId}`).update(updateData);

    return pet;
  }

  // Auto-Update (Hunger steigt über Zeit)
  async updatePetStatus(userId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    // Wenn Pet tot ist, nicht weiter updaten
    if (!pet.isAlive) {
      return pet;
    }

    const now = new Date();
    const lastUpdated = pet.lastUpdated ? new Date(pet.lastUpdated) : new Date(pet.createdAt);
    const lastFedTime = pet.lastFed instanceof Date ? pet.lastFed : new Date(pet.lastFed);

    // Nur updaten wenn mehr als 1 Minute vergangen ist
    const minutesSinceLastUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    if (minutesSinceLastUpdate < 1) {
      return pet; // Keine Änderung nötig
    }

    // Validiere die Zeit
    if (isNaN(lastFedTime.getTime())) {
      console.warn('Invalid lastFed date, using current time');
      pet.lastFed = now;
      pet.hunger = 50; // Setze default Hunger
    } else {
      const hoursSinceLastUpdate = minutesSinceLastUpdate / 60;

      // Hunger steigt um 4 pro Stunde seit letztem Update (noch schneller)
      // Bei Start-Hunger von 50: Nach 12.5h erreicht Hunger 100
      // Wenn Pet mit Hunger 30 gefüttert wird: Nach 17.5h erreicht Hunger 100
      const hungerIncrease = Math.floor(hoursSinceLastUpdate * 4);
      pet.hunger = Math.min(100, pet.hunger + hungerIncrease);

      // Happiness sinkt schneller über Zeit (3 pro Stunde seit letztem Update)
      const happinessDecrease = Math.floor(hoursSinceLastUpdate * 3);
      pet.happiness = Math.max(0, pet.happiness - happinessDecrease);
    }

    // Extra Happiness-Verlust wenn zu hungrig
    if (pet.hunger > 80) {
      pet.happiness = Math.max(0, pet.happiness - 3);
    }

    // Stelle sicher, dass die Werte gültig sind
    pet.hunger = isNaN(pet.hunger) ? 50 : pet.hunger;
    pet.happiness = isNaN(pet.happiness) ? 75 : pet.happiness;

    // TOD-PRÜFUNG
    let hasDied = false;
    let deathCause: Pet['deathCause'] = undefined;

    // Stirbt bei 100 Hunger (Verhungert)
    if (pet.hunger >= 100) {
      hasDied = true;
      deathCause = 'hunger';
    }
    // Stirbt bei 0 Happiness (Traurigkeit)
    else if (pet.happiness <= 0) {
      hasDied = true;
      deathCause = 'sadness';
    }
    // Stirbt nach 7 Tagen ohne Fütterung (Vernachlässigung)
    else if (lastFedTime && !isNaN(lastFedTime.getTime())) {
      const daysSinceLastFed = (now.getTime() - lastFedTime.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastFed >= 7) {
        hasDied = true;
        deathCause = 'neglect';
      }
    }

    if (hasDied) {
      pet.isAlive = false;
      pet.deathTime = now;
      pet.deathCause = deathCause;

      await firebase.database().ref(`pets/${userId}`).update({
        isAlive: false,
        deathTime: now.toISOString(),
        deathCause: deathCause,
        hunger: pet.hunger,
        happiness: pet.happiness,
        lastUpdated: now.toISOString()
      });
    } else {
      await firebase.database().ref(`pets/${userId}`).update({
        hunger: pet.hunger,
        happiness: pet.happiness,
        lastUpdated: now.toISOString()
      });
    }

    return pet;
  }

  // Wiederbelebe das Pet
  async revivePet(userId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    // Kann nur tote Pets wiederbeleben
    if (pet.isAlive) {
      return pet;
    }

    pet.isAlive = true;
    pet.hunger = 50;
    pet.happiness = 50;
    pet.lastFed = new Date();
    pet.reviveCount = (pet.reviveCount || 0) + 1;

    // Level-Verlust als Strafe (verliert 1 Level, minimum Level 1)
    if (pet.level > 1) {
      pet.level = Math.max(1, pet.level - 1);
      pet.experience = (pet.level - 1) * 100; // Setze XP zurück auf den neuen Level
    }

    const updates: any = {
      isAlive: true,
      hunger: pet.hunger,
      happiness: pet.happiness,
      lastFed: pet.lastFed.toISOString(),
      reviveCount: pet.reviveCount,
      level: pet.level,
      experience: pet.experience
    };

    // Entferne Tod-bezogene Felder
    await firebase.database().ref(`pets/${userId}`).update(updates);
    await firebase.database().ref(`pets/${userId}/deathTime`).remove();
    await firebase.database().ref(`pets/${userId}/deathCause`).remove();

    return pet;
  }

  // Lösche Pet (für Reset)
  async deletePet(userId: string): Promise<void> {
    await firebase.database().ref(`pets/${userId}`).remove();
  }

  // Schaue Serie mit Genre-Boost
  async watchedSeriesWithGenre(userId: string, genre: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet || !pet.isAlive) return pet;

    let xpGain = 10; // Standard XP

    // Doppelte XP wenn Lieblings-Genre! (aber nie für "All")
    if (pet.favoriteGenre === genre && genre !== 'All') {
      xpGain = 20;
      pet.happiness = Math.min(100, pet.happiness + 5); // Extra Happiness für Lieblings-Genre
    }

    pet.episodesWatched++;
    pet.experience += xpGain;
    pet.totalSeriesWatched = (pet.totalSeriesWatched || 0) + 1;

    // Level up alle 100 XP - berechne korrekt mit Übertrag
    const xpPerLevel = 100;
    let newLevel = pet.level;
    let currentXP = pet.experience;

    // Prüfe für Level-Ups
    while (currentXP >= xpPerLevel * newLevel) {
      currentXP -= xpPerLevel * newLevel;
      newLevel++;
    }

    const hasLeveledUp = newLevel > pet.level;
    if (hasLeveledUp) {
      pet.level = newLevel;
      pet.experience = currentXP; // Setze XP auf den Übertrag
      pet.happiness = 100;
      pet.hunger = 0;

      // Schalte Accessoires bei bestimmten Levels frei
      await this.checkAndUnlockAccessories(pet);
    }

    // Check für Achievement-basierte Freischaltungen
    await this.checkAchievements(pet);

    const updateData: any = {
      episodesWatched: pet.episodesWatched,
      experience: pet.experience,
      level: pet.level,
      totalSeriesWatched: pet.totalSeriesWatched
    };

    // Nur bei Level-Up Hunger/Happiness updaten
    if (hasLeveledUp) {
      updateData.happiness = pet.happiness;
      updateData.hunger = pet.hunger;
    }

    await firebase.database().ref(`pets/${userId}`).update(updateData);

    return pet;
  }

  // Accessoire ausrüsten/ablegen
  async toggleAccessory(userId: string, accessoryId: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    if (!pet.accessories) {
      pet.accessories = [];
    }

    const existingAccessory = pet.accessories.find(a => a.id === accessoryId);

    if (existingAccessory) {
      existingAccessory.equipped = !existingAccessory.equipped;
    } else {
      // Neues Accessoire hinzufügen
      const accessoryData = ACCESSORIES[accessoryId];
      if (accessoryData) {
        const newAccessory: PetAccessory = {
          id: accessoryId,
          ...accessoryData,
          equipped: true
        };
        pet.accessories.push(newAccessory);
      }
    }

    await firebase.database().ref(`pets/${userId}/accessories`).set(pet.accessories);
    return pet;
  }

  // Prüfe und schalte Accessoires frei
  private async checkAndUnlockAccessories(pet: Pet): Promise<void> {
    const month = new Date().getMonth() + 1;

    // Level-basierte Freischaltungen
    if (pet.level >= 10 && !this.hasAccessory(pet, 'crown')) {
      if (!pet.accessories) pet.accessories = [];
      pet.accessories.push({
        id: 'crown',
        type: 'crown' as const,
        name: 'Krone',
        icon: '👑',
        equipped: false
      });
      await firebase.database().ref(`pets/${pet.userId}/accessories`).set(pet.accessories);
    }

    // Zeit-basierte Freischaltungen
    if (month === 12 && !this.hasAccessory(pet, 'santaHat')) {
      if (!pet.accessories) pet.accessories = [];
      pet.accessories.push({
        id: 'santaHat',
        type: 'hat' as const,
        name: 'Weihnachtsmütze',
        icon: '🎅',
        equipped: false
      });
      await firebase.database().ref(`pets/${pet.userId}/accessories`).set(pet.accessories);
    }

    if ((month >= 6 && month <= 8) && !this.hasAccessory(pet, 'sunglasses')) {
      if (!pet.accessories) pet.accessories = [];
      pet.accessories.push({
        id: 'sunglasses',
        type: 'glasses' as const,
        name: 'Sonnenbrille',
        icon: '🕶️',
        equipped: false
      });
      await firebase.database().ref(`pets/${pet.userId}/accessories`).set(pet.accessories);
    }
  }

  // Check Achievements für spezielle Farben/Muster
  private async checkAchievements(pet: Pet): Promise<void> {
    const updates: any = {};

    // Farben-Freischaltungen
    if (pet.totalSeriesWatched! >= 25 && !pet.unlockedColors?.includes('silver')) {
      pet.unlockedColors = [...(pet.unlockedColors || []), 'silver'];
      updates.unlockedColors = pet.unlockedColors;
    }

    if (pet.totalSeriesWatched! >= 50 && !pet.unlockedColors?.includes('gold')) {
      pet.unlockedColors = [...(pet.unlockedColors || []), 'gold'];
      updates.unlockedColors = pet.unlockedColors;
    }

    if (pet.totalSeriesWatched! >= 100 && !pet.unlockedColors?.includes('rainbow')) {
      pet.unlockedColors = [...(pet.unlockedColors || []), 'rainbow'];
      updates.unlockedColors = pet.unlockedColors;
    }

    // Muster-Freischaltungen
    if (pet.episodesWatched >= 200 && !pet.unlockedPatterns?.includes('galaxy')) {
      pet.unlockedPatterns = [...(pet.unlockedPatterns || []), 'galaxy'];
      updates.unlockedPatterns = pet.unlockedPatterns;
    }

    if (Object.keys(updates).length > 0) {
      await firebase.database().ref(`pets/${pet.userId}`).update(updates);
    }
  }

  private hasAccessory(pet: Pet, accessoryId: string): boolean {
    return pet.accessories?.some(a => a.id === accessoryId) || false;
  }

  // Ändere Pet-Farbe
  async changePetColor(userId: string, newColor: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    // Prüfe ob Farbe freigeschaltet ist
    if (!PET_COLORS[newColor] && !pet.unlockedColors?.includes(newColor)) {
      return pet; // Farbe nicht verfügbar
    }

    pet.color = newColor;
    await firebase.database().ref(`pets/${userId}/color`).set(newColor);
    return pet;
  }

  // Ändere Pet-Muster
  async changePetPattern(userId: string, newPattern: string): Promise<Pet | null> {
    const pet = await this.getUserPet(userId);
    if (!pet) return null;

    const basicPatterns = ['spots', 'stripes', 'plain', 'patches'];

    // Prüfe ob Muster verfügbar ist
    if (!basicPatterns.includes(newPattern) && !pet.unlockedPatterns?.includes(newPattern)) {
      return pet; // Muster nicht verfügbar
    }

    pet.pattern = newPattern as any; // Allow special patterns
    await firebase.database().ref(`pets/${userId}/pattern`).set(newPattern);
    return pet;
  }

  // Pet Widget Position Management (in percentage values for cross-device compatibility)
  async getPetWidgetPosition(userId: string): Promise<any> {
    try {
      const snapshot = await firebase.database().ref(`petWidget/${userId}/position`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting pet widget position:', error);
      return null;
    }
  }

  async savePetWidgetPosition(userId: string, position: any): Promise<void> {
    try {
      await firebase.database().ref(`petWidget/${userId}/position`).set(position);
    } catch (error) {
      console.error('Error saving pet widget position:', error);
    }
  }
}

export const petService = new PetService();