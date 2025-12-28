import { Pet } from '../types/pet.types';

export class PetMoodService {
  getMoodByTimeOfDay(): Pet['mood'] {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 10) {
      return 'sleepy'; // Morgens noch müde
    } else if (hour >= 10 && hour < 14) {
      return 'playful'; // Vormittags spielfreudig
    } else if (hour >= 14 && hour < 17) {
      return 'happy'; // Nachmittags zufrieden
    } else if (hour >= 17 && hour < 20) {
      return 'excited'; // Abends aufgeregt (Serienzeit!)
    } else if (hour >= 20 && hour < 23) {
      return 'loved'; // Gemütlicher Abend
    } else {
      return 'sleepy'; // Nachts schläfrig
    }
  }

  getMoodByHoliday(): Pet['mood'] | null {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Weihnachtszeit (20-26 Dezember)
    if (month === 12 && day >= 20 && day <= 26) {
      return 'festive';
    }
    // Silvester (31 Dezember - 1 Januar)
    if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
      return 'excited';
    }
    // Valentinstag (14 Februar)
    if (month === 2 && day === 14) {
      return 'loved';
    }
    // Halloween (31 Oktober)
    if (month === 10 && day === 31) {
      return 'scared';
    }
    // Ostern (ungefähr - würde normalerweise berechnet werden)
    if (month === 4 && day >= 1 && day <= 10) {
      return 'playful';
    }

    return null;
  }

  getMoodByWeather(temperature?: number): Pet['mood'] | null {
    // Wenn wir Wetter-API hätten
    if (!temperature) return null;

    if (temperature > 30) return 'sleepy'; // Zu heiß
    if (temperature < 0) return 'scared'; // Zu kalt
    if (temperature >= 20 && temperature <= 25) return 'happy'; // Perfekt

    return null;
  }

  calculateCurrentMood(pet: Pet): Pet['mood'] {
    // Priorität: 1. Tod, 2. Hunger/Happiness, 3. Feiertag, 4. Tageszeit

    if (!pet.isAlive) {
      return 'sad';
    }

    // Kritische Zustände haben Priorität
    if (pet.hunger > 80) {
      return 'hungry';
    }
    if (pet.happiness < 20) {
      return 'sad';
    }

    // Feiertags-Stimmung
    const holidayMood = this.getMoodByHoliday();
    if (holidayMood) {
      return holidayMood;
    }

    // Sehr glücklich
    if (pet.happiness > 80) {
      return 'loved';
    }

    // Standard: Tageszeit-basierte Stimmung
    return this.getMoodByTimeOfDay();
  }

  getMoodEmoji(mood: Pet['mood']): string {
    const moodEmojis: Record<NonNullable<Pet['mood']>, string> = {
      happy: '😊',
      sad: '😢',
      excited: '🤗',
      sleepy: '😴',
      hungry: '🤤',
      playful: '😄',
      festive: '🎉',
      scared: '😨',
      loved: '🥰'
    };

    return mood ? moodEmojis[mood] : '😊';
  }

  getMoodAnimation(mood: Pet['mood']): any {
    // Verschiedene Animationen basierend auf Stimmung
    const animations = {
      happy: {
        y: [0, -5, 0],
        rotate: [0, 5, -5, 0]
      },
      sad: {
        y: [0, 2, 0],
        scale: [1, 0.95, 1]
      },
      excited: {
        y: [0, -10, 0],
        rotate: [0, 10, -10, 0],
        scale: [1, 1.1, 1]
      },
      sleepy: {
        y: [0, 1, 0],
        opacity: [1, 0.8, 1]
      },
      hungry: {
        x: [-2, 2, -2, 2, 0],
        scale: [1, 0.98, 1]
      },
      playful: {
        y: [0, -8, 0],
        rotate: [0, 360],
        scale: [1, 1.05, 1]
      },
      festive: {
        y: [0, -5, 0],
        rotate: [0, 15, -15, 0],
        scale: [1, 1.2, 1, 1.2, 1]
      },
      scared: {
        x: [-1, 1, -1, 1, 0],
        scale: [1, 0.9, 1]
      },
      loved: {
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0]
      }
    };

    return mood ? animations[mood] : animations.happy;
  }
}

export const petMoodService = new PetMoodService();