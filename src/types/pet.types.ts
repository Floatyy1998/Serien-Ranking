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

export const ACCESSORIES: Record<string, AccessoryDefinition> = {
  // ── HEAD SLOT ──────────────────────────────────────────
  // Common
  beanie: { slot: 'head', name: 'Muetze', icon: '\uD83E\uDDE2', rarity: 'common' },
  baseballCap: { slot: 'head', name: 'Basecap', icon: '\uD83E\uDDE2', rarity: 'common' },
  flowerCrown: { slot: 'head', name: 'Blumenkranz', icon: '\uD83C\uDF38', rarity: 'common' },
  beret: { slot: 'head', name: 'Baskenmütze', icon: '\uD83C\uDFA8', rarity: 'common' },
  headband: { slot: 'head', name: 'Stirnband', icon: '\uD83C\uDFCB\uFE0F', rarity: 'common' },
  // Uncommon
  bandana: {
    slot: 'head',
    name: 'Bandana',
    icon: '\uD83D\uDD3B',
    rarity: 'uncommon',
    color: '#FF0000',
  },
  partyHat: { slot: 'head', name: 'Partyhut', icon: '\uD83C\uDF89', rarity: 'uncommon' },
  topHat: { slot: 'head', name: 'Zylinder', icon: '\uD83C\uDFA9', rarity: 'uncommon' },
  cowboyHat: { slot: 'head', name: 'Cowboyhut', icon: '\uD83E\uDD20', rarity: 'uncommon' },
  graduationCap: { slot: 'head', name: 'Doktorhut', icon: '\uD83C\uDF93', rarity: 'uncommon' },
  strawHat: { slot: 'head', name: 'Strohhut', icon: '\uD83C\uDF3E', rarity: 'uncommon' },
  // Rare
  santaHat: { slot: 'head', name: 'Weihnachtsmuetze', icon: '\uD83C\uDF85', rarity: 'rare' },
  pirateHat: {
    slot: 'head',
    name: 'Piratenhut',
    icon: '\uD83C\uDFF4\u200D\u2620\uFE0F',
    rarity: 'rare',
  },
  wizardHat: { slot: 'head', name: 'Zauberhut', icon: '\uD83E\uDDD9', rarity: 'rare' },
  militaryHelmet: { slot: 'head', name: 'Militaerhelm', icon: '\u26D1\uFE0F', rarity: 'rare' },
  astronautHelmet: { slot: 'head', name: 'Astronautenhelm', icon: '\uD83D\uDE80', rarity: 'rare' },
  // Epic
  vikingHelmet: { slot: 'head', name: 'Wikingerhelm', icon: '\u2694\uFE0F', rarity: 'epic' },
  crown: { slot: 'head', name: 'Krone', icon: '\uD83D\uDC51', rarity: 'epic' },
  unicornHorn: { slot: 'head', name: 'Einhorn-Horn', icon: '\uD83E\uDD84', rarity: 'epic' },
  robotHead: { slot: 'head', name: 'Roboter-Kopf', icon: '\uD83E\uDD16', rarity: 'epic' },
  // Legendary
  halo: { slot: 'head', name: 'Heiligenschein', icon: '\uD83D\uDE07', rarity: 'legendary' },
  devilHorns: { slot: 'head', name: 'Teufelshoerner', icon: '\uD83D\uDE08', rarity: 'legendary' },
  alienAntenna: { slot: 'head', name: 'Alien-Antenne', icon: '\uD83D\uDC7D', rarity: 'legendary' },

  // ── FACE SLOT ──────────────────────────────────────────
  // Common
  roundGlasses: { slot: 'face', name: 'Brille', icon: '\uD83D\uDC53', rarity: 'common' },
  theatreMask: { slot: 'face', name: 'Theatermaske', icon: '\uD83C\uDFAD', rarity: 'common' },
  surgeonMask: { slot: 'face', name: 'Mundschutz', icon: '\uD83D\uDE37', rarity: 'common' },
  // Uncommon
  sunglasses: {
    slot: 'face',
    name: 'Sonnenbrille',
    icon: '\uD83D\uDD76\uFE0F',
    rarity: 'uncommon',
  },
  heartGlasses: { slot: 'face', name: 'Herzbrille', icon: '\uD83D\uDC95', rarity: 'uncommon' },
  nerdGlasses: { slot: 'face', name: 'Nerd-Brille', icon: '\uD83E\uDD13', rarity: 'uncommon' },
  clownNose: { slot: 'face', name: 'Clownsnase', icon: '\uD83E\uDD21', rarity: 'uncommon' },
  // Rare
  monocle: { slot: 'face', name: 'Monokel', icon: '\uD83E\uDDD0', rarity: 'rare' },
  cyclopsEye: { slot: 'face', name: 'Zyklopen-Auge', icon: '\uD83D\uDC41\uFE0F', rarity: 'rare' },
  skiGoggles: { slot: 'face', name: 'Skibrille', icon: '\uD83E\uDD7D', rarity: 'rare' },
  // Epic
  starShades: { slot: 'face', name: 'Sternenbrille', icon: '\u2B50', rarity: 'epic' },
  visionVisor: { slot: 'face', name: 'Kampf-Visier', icon: '\uD83E\uDD3A', rarity: 'epic' },
  // Legendary
  laserVisor: { slot: 'face', name: 'Laser-Visier', icon: '\uD83D\uDD34', rarity: 'legendary' },
  diamondMask: { slot: 'face', name: 'Diamant-Maske', icon: '\uD83D\uDC8E', rarity: 'legendary' },

  // ── NECK SLOT ──────────────────────────────────────────
  // Common
  collar: { slot: 'neck', name: 'Halsband', icon: '\uD83D\uDCFF', rarity: 'common' },
  bow: { slot: 'neck', name: 'Schleife', icon: '\uD83C\uDF80', rarity: 'common', color: '#FF69B4' },
  bowtie: { slot: 'neck', name: 'Fliege', icon: '\uD83E\uDD35', rarity: 'common' },
  tie: { slot: 'neck', name: 'Krawatte', icon: '\uD83D\uDC54', rarity: 'common' },
  bandkerchief: { slot: 'neck', name: 'Halstuch', icon: '\uD83E\uDDE3', rarity: 'common' },
  // Uncommon
  scarf: { slot: 'neck', name: 'Schal', icon: '\uD83E\uDDE3', rarity: 'uncommon' },
  locket: { slot: 'neck', name: 'Medaillon', icon: '\uD83D\uDC9B', rarity: 'uncommon' },
  bellCollar: {
    slot: 'neck',
    name: 'Gloeckchen-Halsband',
    icon: '\uD83D\uDD14',
    rarity: 'uncommon',
  },
  flowerGarland: { slot: 'neck', name: 'Blumengirlande', icon: '\uD83C\uDF3B', rarity: 'uncommon' },
  // Rare
  goldChain: { slot: 'neck', name: 'Goldkette', icon: '\u26D3\uFE0F', rarity: 'rare' },
  medal: { slot: 'neck', name: 'Medaille', icon: '\uD83C\uDFC5', rarity: 'rare' },
  rubyPendant: { slot: 'neck', name: 'Rubin-Anhaenger', icon: '\u2764\uFE0F', rarity: 'rare' },
  anchorChain: { slot: 'neck', name: 'Anker-Kette', icon: '\u2693', rarity: 'rare' },
  // Epic
  cape: { slot: 'neck', name: 'Umhang', icon: '\uD83E\uDDB8', rarity: 'epic' },
  royalSash: {
    slot: 'neck',
    name: 'Koenigliche Schaerpe',
    icon: '\uD83C\uDF96\uFE0F',
    rarity: 'epic',
  },
  dragonPendant: { slot: 'neck', name: 'Drachen-Anhaenger', icon: '\uD83D\uDC09', rarity: 'epic' },
  // Legendary
  phoenixFeatherNeck: {
    slot: 'neck',
    name: 'Phoenix-Kette',
    icon: '\uD83D\uDD25',
    rarity: 'legendary',
  },
  cosmicAmulet: {
    slot: 'neck',
    name: 'Kosmisches Amulett',
    icon: '\uD83C\uDF0C',
    rarity: 'legendary',
  },

  // ── DAILY SPIN EXCLUSIVE ───────────────────────────────
  diamondTiara: { slot: 'head', name: 'Diamant-Tiara', icon: '\uD83D\uDC8E', rarity: 'legendary' },
  ninjaMask: { slot: 'face', name: 'Ninja-Maske', icon: '\uD83E\uDD77', rarity: 'epic' },
  royalCape: {
    slot: 'neck',
    name: 'Koenigsumhang',
    icon: '\uD83E\uDDB8\u200D\u2642\uFE0F',
    rarity: 'legendary',
  },
  aviatorGoggles: { slot: 'face', name: 'Fliegerbrille', icon: '\uD83E\uDD7D', rarity: 'rare' },
  chefHat: {
    slot: 'head',
    name: 'Kochmuetze',
    icon: '\uD83E\uDDD1\u200D\uD83C\uDF73',
    rarity: 'uncommon',
  },
  lei: { slot: 'neck', name: 'Blumenkette', icon: '\uD83C\uDF3A', rarity: 'uncommon' },
  catEars: { slot: 'head', name: 'Katzenohren', icon: '\uD83D\uDE3B', rarity: 'rare' },
  nightOwlGoggles: { slot: 'face', name: 'Nachteule-Brille', icon: '\uD83E\uDD89', rarity: 'epic' },
  galaxyCape: { slot: 'neck', name: 'Galaxie-Umhang', icon: '\uD83C\uDF0C', rarity: 'legendary' },
  samuraiHelmet: { slot: 'head', name: 'Samurai-Helm', icon: '\uD83C\uDFEF', rarity: 'epic' },
  pixelShades: {
    slot: 'face',
    name: 'Pixel-Brille',
    icon: '\uD83D\uDDA5\uFE0F',
    rarity: 'uncommon',
  },
  luckyClover: { slot: 'neck', name: 'Gluecksklee-Kette', icon: '\uD83C\uDF40', rarity: 'rare' },
  // Spin Batch 2
  witchHat: {
    slot: 'head',
    name: 'Hexenhut',
    icon: '\uD83E\uDDD9\u200D\u2640\uFE0F',
    rarity: 'rare',
  },
  steamGoggles: { slot: 'face', name: 'Steampunk-Brille', icon: '\u2699\uFE0F', rarity: 'epic' },
  rainbowScarf: {
    slot: 'neck',
    name: 'Regenbogen-Schal',
    icon: '\uD83C\uDF08',
    rarity: 'uncommon',
  },
  mushHat: { slot: 'head', name: 'Pilzhut', icon: '\uD83C\uDF44', rarity: 'common' },
  butterflyMask: {
    slot: 'face',
    name: 'Schmetterlings-Maske',
    icon: '\uD83E\uDD8B',
    rarity: 'rare',
  },
  shellNecklace: { slot: 'neck', name: 'Muschel-Kette', icon: '\uD83D\uDC1A', rarity: 'common' },
  foxEars: { slot: 'head', name: 'Fuchsohren', icon: '\uD83E\uDD8A', rarity: 'epic' },
  ghostMask: { slot: 'face', name: 'Geistermaske', icon: '\uD83D\uDC7B', rarity: 'rare' },
  thunderChain: { slot: 'neck', name: 'Donner-Kette', icon: '\u26A1', rarity: 'epic' },
  iceHelm: { slot: 'head', name: 'Eishelm', icon: '\u2744\uFE0F', rarity: 'legendary' },
  prismVisor: { slot: 'face', name: 'Prisma-Visier', icon: '\uD83C\uDF1F', rarity: 'legendary' },
  solarAmulet: { slot: 'neck', name: 'Sonnen-Amulett', icon: '\u2600\uFE0F', rarity: 'legendary' },

  // ── MILESTONE EXCLUSIVE ────────────────────────────────
  trophyNecklace: { slot: 'neck', name: 'Trophaeen-Kette', icon: '\uD83C\uDFC6', rarity: 'epic' },
  starHelmet: { slot: 'head', name: 'Sternenhelm', icon: '\uD83C\uDF1F', rarity: 'legendary' },
  crystalMonocle: { slot: 'face', name: 'Kristall-Monokel', icon: '\uD83D\uDD2E', rarity: 'epic' },
  phoenixFeather: {
    slot: 'head',
    name: 'Phoenix-Feder',
    icon: '\uD83E\uDEB6',
    rarity: 'legendary',
  },
  infinityScarf: { slot: 'neck', name: 'Endlos-Schal', icon: '\u267E\uFE0F', rarity: 'rare' },
  ancientCrown: { slot: 'head', name: 'Antike Krone', icon: '\uD83D\uDC51', rarity: 'epic' },
  championBelt: { slot: 'neck', name: 'Champion-Guertel', icon: '\uD83E\uDD4A', rarity: 'epic' },
  cosmicHelm: { slot: 'head', name: 'Kosmischer Helm', icon: '\uD83C\uDF0D', rarity: 'legendary' },
  timeTravelerGoggles: { slot: 'face', name: 'Zeitreise-Brille', icon: '\u231A', rarity: 'rare' },
  enchantedRose: { slot: 'neck', name: 'Verzauberte Rose', icon: '\uD83C\uDF39', rarity: 'epic' },
  shadowHood: { slot: 'head', name: 'Schattenkapuze', icon: '\uD83D\uDDA4', rarity: 'rare' },
  celestialCrown: { slot: 'head', name: 'Himmelskrone', icon: '\uD83D\uDCAB', rarity: 'legendary' },
  // Milestone Batch 2
  volcanoHelm: { slot: 'head', name: 'Vulkan-Helm', icon: '\uD83C\uDF0B', rarity: 'epic' },
  abyssVisor: { slot: 'face', name: 'Abgrund-Visier', icon: '\uD83C\uDF11', rarity: 'legendary' },
  dragonScaleCollar: {
    slot: 'neck',
    name: 'Drachenschuppen-Kragen',
    icon: '\uD83D\uDC32',
    rarity: 'epic',
  },
  lotusHelm: { slot: 'head', name: 'Lotus-Krone', icon: '\uD83C\uDF3C', rarity: 'rare' },
  eclipseGoggles: {
    slot: 'face',
    name: 'Sonnenfinsternis-Brille',
    icon: '\uD83C\uDF11',
    rarity: 'epic',
  },
  runeNecklace: { slot: 'neck', name: 'Runen-Kette', icon: '\uD83D\uDD2F', rarity: 'rare' },
  glitchCrown: {
    slot: 'head',
    name: 'Glitch-Krone',
    icon: '\uD83D\uDDA5\uFE0F',
    rarity: 'legendary',
  },
  voidMask: { slot: 'face', name: 'Void-Maske', icon: '\uD83D\uDD73\uFE0F', rarity: 'legendary' },
  sakuraPendant: {
    slot: 'neck',
    name: 'Sakura-Anhaenger',
    icon: '\uD83C\uDF38',
    rarity: 'uncommon',
  },
  pyramidHelm: { slot: 'head', name: 'Pyramiden-Helm', icon: '\uD83D\uDEE1\uFE0F', rarity: 'epic' },
  mirrorShades: { slot: 'face', name: 'Spiegel-Brille', icon: '\uD83E\uDE9E', rarity: 'rare' },
  obsidianAmulet: {
    slot: 'neck',
    name: 'Obsidian-Amulett',
    icon: '\uD83D\uDDA4',
    rarity: 'legendary',
  },
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
