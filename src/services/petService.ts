import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { Pet, PET_COLORS } from '../types/pet.types';

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
      size: sizes[Math.floor(Math.random() * sizes.length)]
    };

    await firebase.database().ref(`pets/${userId}`).set(newPet);
    return newPet;
  }

  // Hole das Pet des Users
  async getUserPet(userId: string): Promise<Pet | null> {
    const snapshot = await firebase.database().ref(`pets/${userId}`).once('value');
    if (!snapshot.exists()) return null;

    const petData = snapshot.val();
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

    // Level up alle 100 XP
    const newLevel = Math.floor(pet.experience / 100) + 1;
    if (newLevel > pet.level) {
      pet.level = newLevel;
      pet.happiness = 100; // Level up macht glücklich!
      pet.hunger = 0; // Level up macht satt!
    }

    await firebase.database().ref(`pets/${userId}`).update({
      episodesWatched: pet.episodesWatched,
      experience: pet.experience,
      level: pet.level,
      happiness: pet.happiness,
      hunger: pet.hunger
    });

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

      // Hunger steigt um 1 pro Stunde seit letztem Update
      // Bei Start-Hunger von 50: Nach 50h erreicht Hunger 100
      // Wenn Pet mit Hunger 30 gefüttert wird: Nach 70h erreicht Hunger 100
      const hungerIncrease = Math.floor(hoursSinceLastUpdate * 1);
      pet.hunger = Math.min(100, pet.hunger + hungerIncrease);

      // Happiness sinkt langsam über Zeit (1 pro Stunde seit letztem Update, vorher 2)
      const happinessDecrease = Math.floor(hoursSinceLastUpdate * 1);
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
}

export const petService = new PetService();