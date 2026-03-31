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
  favoriteGenre?: string; // Lieblings-Serie-Genre fuer XP-Bonus
  accessories?: PetAccessory[];
  unlockedColors?: string[]; // Freigeschaltete spezielle Farben
  unlockedPatterns?: string[]; // Freigeschaltete spezielle Muster
  totalSeriesWatched?: number; // Fuer Achievement-Tracking
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
  cat: '\uD83D\uDC31',
  dog: '\uD83D\uDC36',
  bird: '\uD83D\uDC26',
  dragon: '\uD83D\uDC32',
  fox: '\uD83E\uDD8A',
};

export const PET_TYPE_NAMES = {
  cat: 'Katze',
  dog: 'Hund',
  bird: 'Vogel',
  dragon: 'Drache',
  fox: 'Fuchs',
};

// ============================================================
// Accessory System
// ============================================================

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

export const ACCESSORIES: Record<string, AccessoryDefinition> = {
  // ── HEAD SLOT ──────────────────────────────────────────
  beanie: { slot: 'head', name: 'Muetze', icon: '\uD83E\uDDE2', rarity: 'common' },
  baseballCap: { slot: 'head', name: 'Basecap', icon: '\uD83E\uDDE2', rarity: 'common' },
  flowerCrown: { slot: 'head', name: 'Blumenkranz', icon: '\uD83C\uDF38', rarity: 'common' },
  bandana: {
    slot: 'head',
    name: 'Bandana',
    icon: '\uD83D\uDD3B',
    rarity: 'uncommon',
    color: '#FF0000',
  },
  partyHat: { slot: 'head', name: 'Partyhut', icon: '\uD83C\uDF89', rarity: 'uncommon' },
  topHat: { slot: 'head', name: 'Zylinder', icon: '\uD83C\uDFA9', rarity: 'uncommon' },
  santaHat: { slot: 'head', name: 'Weihnachtsmuetze', icon: '\uD83C\uDF85', rarity: 'rare' },
  pirateHat: {
    slot: 'head',
    name: 'Piratenhut',
    icon: '\uD83C\uDFF4\u200D\u2620\uFE0F',
    rarity: 'rare',
  },
  wizardHat: { slot: 'head', name: 'Zauberhut', icon: '\uD83E\uDDD9', rarity: 'rare' },
  vikingHelmet: { slot: 'head', name: 'Wikingerhelm', icon: '\u2694\uFE0F', rarity: 'epic' },
  crown: { slot: 'head', name: 'Krone', icon: '\uD83D\uDC51', rarity: 'epic' },
  halo: { slot: 'head', name: 'Heiligenschein', icon: '\uD83D\uDE07', rarity: 'legendary' },
  devilHorns: {
    slot: 'head',
    name: 'Teufelshoerner',
    icon: '\uD83D\uDE08',
    rarity: 'legendary',
  },

  // ── FACE SLOT ──────────────────────────────────────────
  roundGlasses: { slot: 'face', name: 'Brille', icon: '\uD83D\uDC53', rarity: 'common' },
  sunglasses: {
    slot: 'face',
    name: 'Sonnenbrille',
    icon: '\uD83D\uDD76\uFE0F',
    rarity: 'uncommon',
  },
  heartGlasses: { slot: 'face', name: 'Herzbrille', icon: '\uD83D\uDC95', rarity: 'uncommon' },
  monocle: { slot: 'face', name: 'Monokel', icon: '\uD83E\uDDD0', rarity: 'rare' },
  starShades: { slot: 'face', name: 'Sternenbrille', icon: '\u2B50', rarity: 'epic' },
  laserVisor: { slot: 'face', name: 'Laser-Visier', icon: '\uD83D\uDD34', rarity: 'legendary' },

  // ── NECK SLOT ──────────────────────────────────────────
  collar: { slot: 'neck', name: 'Halsband', icon: '\uD83D\uDCFF', rarity: 'common' },
  bow: { slot: 'neck', name: 'Schleife', icon: '\uD83C\uDF80', rarity: 'common', color: '#FF69B4' },
  bowtie: { slot: 'neck', name: 'Fliege', icon: '\uD83E\uDD35', rarity: 'common' },
  scarf: { slot: 'neck', name: 'Schal', icon: '\uD83E\uDDE3', rarity: 'uncommon' },
  goldChain: { slot: 'neck', name: 'Goldkette', icon: '\u26D3\uFE0F', rarity: 'rare' },
  cape: { slot: 'neck', name: 'Umhang', icon: '\uD83E\uDDB8', rarity: 'epic' },
  medal: { slot: 'neck', name: 'Medaille', icon: '\uD83C\uDFC5', rarity: 'rare' },
};

/** Get the rarity for an accessory by ID */
export function getAccessoryRarity(accessoryId: string): AccessoryRarity {
  return ACCESSORIES[accessoryId]?.rarity ?? 'common';
}

// ============================================================
// Special Colors & Patterns (unchanged)
// ============================================================

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
