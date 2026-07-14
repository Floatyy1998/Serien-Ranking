export interface Pet {
  id: string;
  userId: string;
  name: string;
  type: 'cat' | 'dog' | 'bird' | 'dragon' | 'fox' | 'rabbit' | 'panda';
  color: string;
  level: number;
  experience: number;
  hunger: number; // 0-100 (100 = sehr hungrig)
  happiness: number; // 0-100
  lastFed: Date;
  lastUpdated?: Date; // Wann wurden die Status-Werte zuletzt aktualisiert
  episodesWatched: number;
  createdAt: Date;
  // Tod-System
  isAlive: boolean;
  deathTime?: Date;
  deathCause?: 'hunger' | 'sadness' | 'neglect';
  reviveCount?: number; // Wie oft wurde das Pet wiederbelebt
  // Einzigartige Merkmale
  pattern?:
    | 'spots'
    | 'stripes'
    | 'plain'
    | 'patches'
    | 'galaxy'
    | 'hearts'
    | 'stars'
    | 'zigzag'
    | 'dots';
  eyeColor?: string;
  personality?: 'lazy' | 'playful' | 'brave' | 'shy' | 'smart';
  size?: 'tiny' | 'small' | 'normal' | 'big' | 'chonky';
  // Neue Features
  mood?:
    | 'happy'
    | 'sad'
    | 'excited'
    | 'sleepy'
    | 'hungry'
    | 'playful'
    | 'festive'
    | 'scared'
    | 'loved';
  favoriteGenre?: string; // Lieblings-Serie-Genre fuer XP-Bonus
  accessories?: PetAccessory[];
  unlockedColors?: string[]; // Freigeschaltete spezielle Farben
  unlockedPatterns?: string[]; // Freigeschaltete spezielle Muster
  totalSeriesWatched?: number; // Fuer Achievement-Tracking
  achievementPoints?: number;
  // Hintergruende (Pet-Display)
  unlockedBackgrounds?: string[];
  equippedBackground?: string;
}

export const PET_COLORS: Record<string, string> = {
  rot: '#FF6B6B',
  blau: '#4ECDC4',
  gruen: '#95E77E',
  lila: '#B794F6',
  gelb: '#FFD93D',
  rosa: '#FF6BCB',
  orange: '#FFA500',
  tuerkis: '#00D4FF',
};

export const PET_TYPES = {
  cat: '\uD83D\uDC31',
  dog: '\uD83D\uDC36',
  bird: '\uD83D\uDC26',
  dragon: '\uD83D\uDC32',
  fox: '\uD83E\uDD8A',
  rabbit: '\uD83D\uDC30',
  panda: '\uD83D\uDC3C',
};

export const PET_TYPE_NAMES = {
  cat: 'Katze',
  dog: 'Hund',
  bird: 'Vogel',
  dragon: 'Drache',
  fox: 'Fuchs',
  rabbit: 'Hase',
  panda: 'Panda',
};

// Accessory System

export type AccessorySlot = 'head' | 'face' | 'neck';
export type AccessoryRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PetAccessory {
  id: string;
  type: string; // legacy compat - maps to slot
  name: string;
  icon: string;
  color?: string;
  unlockCondition?: string;
  equipped: boolean;
  isNew?: boolean;
}

export interface PendingAccessoryDrop {
  id: string; // Firebase push key
  accessoryId: string;
  name: string;
  icon: string;
  rarity: AccessoryRarity;
  timestamp: number;
}

export const RARITY_COLORS: Record<AccessoryRarity, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800',
};

export const RARITY_LABELS: Record<AccessoryRarity, string> = {
  common: 'Gewöhnlich',
  uncommon: 'Ungewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

export interface AccessoryDefinition {
  slot: AccessorySlot;
  name: string;
  icon: string;
  rarity: AccessoryRarity;
  color?: string;
}

// Special Colors & Patterns

export const SPECIAL_COLORS: Record<
  string,
  { color: string; name: string; unlockCondition: string }
> = {
  gold: { color: '#FFD700', name: 'Gold', unlockCondition: '50 Serien' },
  silver: { color: '#C0C0C0', name: 'Silber', unlockCondition: '25 Serien' },
  rainbow: { color: 'rainbow', name: 'Regenbogen', unlockCondition: '100 Serien' },
  neon: { color: '#39FF14', name: 'Neon', unlockCondition: 'Nacht-Eule Badge' },
  cosmic: { color: 'cosmic', name: 'Kosmisch', unlockCondition: 'Sci-Fi Fan' },
  shadow: { color: '#2B2B2B', name: 'Schatten', unlockCondition: 'Horror Fan' },
};

export const SPECIAL_PATTERNS = {
  galaxy: { name: 'Galaxie', unlockCondition: '200 Episoden' },
  hearts: { name: 'Herzen', unlockCondition: 'Valentinstag' },
  stars: { name: 'Sterne', unlockCondition: 'Nachtschwaermer' },
  zigzag: { name: 'Zickzack', unlockCondition: 'Speed Watcher' },
  dots: { name: 'Punkte', unlockCondition: 'Anfaenger' },
};

// Pet Display Backgrounds — obtainable via mystery box & daily spin

export interface PetBackgroundDefinition {
  id: string;
  name: string;
  description: string;
  rarity: AccessoryRarity;
  /** CSS background value (gradient, image, or solid) for the pet display square */
  background: string;
  /** Optional CSS animation class applied to the pet-card-display */
  animationClass?: string;
  /** Optional overlay gradient layered above the base background */
  overlay?: string;
  /** Optional color for the inner radial glow behind the pet (else theme default) */
  glowColor?: string;
}

export const GENRE_FAVORITES = [
  'Action & Adventure',
  'Comedy',
  'Drama',
  'Crime',
  'Sci-Fi & Fantasy',
  'Mystery',
  'Animation',
  'Documentary',
  'Family',
  'Western',
];
