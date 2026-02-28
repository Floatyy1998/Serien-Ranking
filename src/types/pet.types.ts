export interface Pet {
  id: string;
  userId: string;
  name: string;
  type: 'cat' | 'dog' | 'bird' | 'dragon' | 'fox';
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
  favoriteGenre?: string; // Lieblings-Serie-Genre für XP-Bonus
  accessories?: PetAccessory[];
  unlockedColors?: string[]; // Freigeschaltete spezielle Farben
  unlockedPatterns?: string[]; // Freigeschaltete spezielle Muster
  totalSeriesWatched?: number; // Für Achievement-Tracking
  achievementPoints?: number;
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
  cat: '🐱',
  dog: '🐶',
  bird: '🐦',
  dragon: '🐲',
  fox: '🦊',
};

export const PET_TYPE_NAMES = {
  cat: 'Katze',
  dog: 'Hund',
  bird: 'Vogel',
  dragon: 'Drache',
  fox: 'Fuchs',
};

export interface PetAccessory {
  id: string;
  type: 'hat' | 'glasses' | 'collar' | 'bow' | 'scarf' | 'crown' | 'bandana';
  name: string;
  icon: string;
  color?: string;
  unlockCondition?: string;
  equipped: boolean;
}

export const ACCESSORIES: Record<string, Omit<PetAccessory, 'id' | 'equipped'>> = {
  santaHat: { type: 'hat', name: 'Weihnachtsmütze', icon: '🎅', unlockCondition: 'Dezember' },
  sunglasses: { type: 'glasses', name: 'Sonnenbrille', icon: '🕶️', unlockCondition: 'Sommer' },
  partyHat: { type: 'hat', name: 'Partyhut', icon: '🎉', unlockCondition: 'Geburtstag' },
  bow: { type: 'bow', name: 'Schleife', icon: '🎀', color: '#FF69B4' },
  crown: { type: 'crown', name: 'Krone', icon: '👑', unlockCondition: 'Level 10' },
  scarf: { type: 'scarf', name: 'Schal', icon: '🧣', unlockCondition: 'Winter' },
  collar: { type: 'collar', name: 'Halsband', icon: '📿' },
  bandana: { type: 'bandana', name: 'Bandana', icon: '🔻', color: '#FF0000' },
};

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
  stars: { name: 'Sterne', unlockCondition: 'Nachtschwärmer' },
  zigzag: { name: 'Zickzack', unlockCondition: 'Speed Watcher' },
  dots: { name: 'Punkte', unlockCondition: 'Anfänger' },
};

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
