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

// ============================================================
// Pet Display Backgrounds — obtainable via mystery box & daily spin
// ============================================================

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

/** Wraps an inline SVG in a data URI CSS background value. */
function bgUrl(svg: string): string {
  const compact = svg.trim().replace(/>\s+</g, '><').replace(/\s+/g, ' ');
  return `url("data:image/svg+xml,${encodeURIComponent(compact)}") center/cover no-repeat`;
}

// Alle Szenen nutzen viewBox 0 0 100 100 und 'xMidYMid slice' um das quadratische
// Pet-Display passgenau zu fuellen. Attribute werden mit ' statt " geschrieben.

const SVG_CLEAR_SKY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6fb8e0'/><stop offset='1' stop-color='#d0ecf7'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#a)'/>
  <ellipse cx='22' cy='28' rx='14' ry='4' fill='#ffffff' opacity='0.92'/>
  <ellipse cx='28' cy='25' rx='9' ry='3.5' fill='#ffffff' opacity='0.92'/>
  <ellipse cx='72' cy='45' rx='16' ry='5' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='78' cy='41' rx='10' ry='4' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='18' cy='68' rx='11' ry='3.5' fill='#ffffff' opacity='0.82'/>
</svg>`;

const SVG_FLOWER_MEADOW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8ec6eb'/><stop offset='1' stop-color='#e5f3fc'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7cc576'/><stop offset='1' stop-color='#4a9f3e'/></linearGradient>
  </defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <circle cx='82' cy='18' r='7' fill='#fff3a8'/>
  <circle cx='82' cy='18' r='10' fill='#fff3a8' opacity='0.35'/>
  <ellipse cx='20' cy='28' rx='9' ry='2.5' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='55' cy='22' rx='11' ry='3' fill='#ffffff' opacity='0.85'/>
  <path d='M0 60 Q 25 55 50 62 T 100 60 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <circle cx='15' cy='78' r='1.6' fill='#ff6b9d'/>
  <circle cx='28' cy='85' r='1.6' fill='#fff275'/>
  <circle cx='40' cy='80' r='1.6' fill='#a479f1'/>
  <circle cx='55' cy='88' r='1.6' fill='#ff6b9d'/>
  <circle cx='65' cy='82' r='1.6' fill='#fff275'/>
  <circle cx='78' cy='90' r='1.6' fill='#ff9a5a'/>
  <circle cx='88' cy='85' r='1.6' fill='#a479f1'/>
  <circle cx='22' cy='92' r='1.6' fill='#ffffff'/>
  <circle cx='48' cy='94' r='1.6' fill='#ff6b9d'/>
  <circle cx='72' cy='95' r='1.6' fill='#fff275'/>
  <circle cx='8' cy='88' r='1.4' fill='#fff275'/>
  <circle cx='92' cy='77' r='1.4' fill='#ff6b9d'/>
</svg>`;

const SVG_SUNNY_BEACH = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='k' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7cc5ee'/><stop offset='1' stop-color='#bce4f5'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2c7da0'/><stop offset='1' stop-color='#4a96b8'/></linearGradient>
    <linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f4d38b'/><stop offset='1' stop-color='#e6b673'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#k)'/>
  <circle cx='78' cy='22' r='6' fill='#fff5c2'/>
  <circle cx='78' cy='22' r='10' fill='#fff5c2' opacity='0.35'/>
  <ellipse cx='25' cy='30' rx='10' ry='3' fill='#ffffff' opacity='0.85'/>
  <rect y='55' width='100' height='25' fill='url(#w)'/>
  <path d='M0 60 Q 15 58 30 60 T 60 60 T 100 60 L 100 63 L 0 63 Z' fill='#ffffff' opacity='0.22'/>
  <path d='M0 72 Q 20 70 40 72 T 80 72 T 100 72 L 100 74 L 0 74 Z' fill='#ffffff' opacity='0.15'/>
  <rect y='80' width='100' height='20' fill='url(#d)'/>
</svg>`;

const SVG_ROLLING_HILLS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a0d4f0'/><stop offset='1' stop-color='#e0f0fa'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='75' cy='22' r='6' fill='#fff3a8'/>
  <circle cx='75' cy='22' r='9' fill='#fff3a8' opacity='0.35'/>
  <ellipse cx='20' cy='30' rx='10' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='55' cy='35' rx='8' ry='2.5' fill='#ffffff' opacity='0.8'/>
  <path d='M0 70 Q 30 55 50 65 T 100 60 L 100 85 L 0 85 Z' fill='#a8d968'/>
  <path d='M0 80 Q 25 70 50 78 T 100 75 L 100 100 L 0 100 Z' fill='#7ab954'/>
</svg>`;

const SVG_AUTUMN_FIELD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#91c8e4'/><stop offset='1' stop-color='#d7ecf4'/></linearGradient>
    <linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e8b84a'/><stop offset='1' stop-color='#c48e1f'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <ellipse cx='20' cy='30' rx='9' ry='2.5' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='70' cy='40' rx='11' ry='3' fill='#ffffff' opacity='0.85'/>
  <rect y='55' width='100' height='45' fill='url(#f)'/>
  <path d='M0 75 L 100 75' stroke='#a06f12' stroke-width='0.5' opacity='0.45'/>
  <path d='M0 82 L 100 82' stroke='#a06f12' stroke-width='0.5' opacity='0.4'/>
  <path d='M0 90 L 100 90' stroke='#a06f12' stroke-width='0.5' opacity='0.35'/>
</svg>`;

const SVG_SUNSET = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#1e1b4b'/>
      <stop offset='0.25' stop-color='#6d1e5e'/>
      <stop offset='0.55' stop-color='#e55a4a'/>
      <stop offset='0.9' stop-color='#ffb347'/>
      <stop offset='1' stop-color='#ffd86b'/>
    </linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#1a1346'/>
      <stop offset='1' stop-color='#3a2657'/>
    </linearGradient>
  </defs>
  <rect width='100' height='65' fill='url(#s)'/>
  <circle cx='50' cy='62' r='9' fill='#fff5a0'/>
  <circle cx='50' cy='62' r='14' fill='#fff5a0' opacity='0.28'/>
  <rect y='65' width='100' height='35' fill='url(#w)'/>
  <ellipse cx='50' cy='70' rx='12' ry='1' fill='#fff5a0' opacity='0.6'/>
  <ellipse cx='50' cy='76' rx='8' ry='0.8' fill='#fff5a0' opacity='0.4'/>
  <ellipse cx='50' cy='84' rx='5' ry='0.6' fill='#fff5a0' opacity='0.3'/>
</svg>`;

const SVG_MOUNTAIN_LAKE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#94c5e8'/><stop offset='1' stop-color='#d2e8f4'/></linearGradient>
    <linearGradient id='l' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a6e8f'/><stop offset='1' stop-color='#5a92ab'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='78' cy='18' r='5' fill='#fff3a8'/>
  <ellipse cx='20' cy='22' rx='8' ry='2.5' fill='#ffffff' opacity='0.85'/>
  <polygon points='0,60 20,35 35,50 50,30 68,48 85,32 100,55 100,72 0,72' fill='#6a7e9a'/>
  <polygon points='18,38 20,35 22,38 21,40' fill='#ffffff'/>
  <polygon points='48,33 50,30 52,33 51,35' fill='#ffffff'/>
  <polygon points='83,34 85,32 87,34 86,36' fill='#ffffff'/>
  <polygon points='0,72 25,55 45,65 70,52 100,68 100,77 0,77' fill='#4a5f7a'/>
  <rect y='74' width='100' height='26' fill='url(#l)'/>
  <rect x='0' y='82' width='100' height='0.5' fill='#ffffff' opacity='0.3'/>
  <rect x='0' y='90' width='100' height='0.5' fill='#ffffff' opacity='0.22'/>
</svg>`;

const SVG_CHERRY_TREES = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fdd4e3'/><stop offset='1' stop-color='#fbe8ef'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a8d49a'/><stop offset='1' stop-color='#7cb86b'/></linearGradient>
  </defs>
  <rect width='100' height='75' fill='url(#s)'/>
  <rect y='75' width='100' height='25' fill='url(#g)'/>
  <rect x='22' y='55' width='4' height='25' fill='#5a3d26'/>
  <rect x='74' y='60' width='3' height='20' fill='#5a3d26'/>
  <circle cx='24' cy='50' r='12' fill='#ff9ec4'/>
  <circle cx='18' cy='52' r='8' fill='#ffb0cf'/>
  <circle cx='30' cy='52' r='9' fill='#ffb0cf'/>
  <circle cx='24' cy='43' r='7' fill='#ffc7d9'/>
  <circle cx='76' cy='55' r='10' fill='#ff9ec4'/>
  <circle cx='82' cy='57' r='7' fill='#ffb0cf'/>
  <circle cx='70' cy='58' r='7' fill='#ffb0cf'/>
  <circle cx='45' cy='30' r='0.9' fill='#ff9ec4'/>
  <circle cx='55' cy='40' r='0.9' fill='#ffb0cf'/>
  <circle cx='40' cy='50' r='0.9' fill='#ff9ec4'/>
  <circle cx='60' cy='25' r='0.9' fill='#ffb0cf'/>
  <circle cx='50' cy='60' r='0.9' fill='#ff9ec4'/>
  <circle cx='35' cy='35' r='0.9' fill='#ffb0cf'/>
</svg>`;

const SVG_DESERT_DUNES = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#2c1a47'/>
      <stop offset='0.5' stop-color='#c45c3e'/>
      <stop offset='1' stop-color='#f9b061'/>
    </linearGradient>
    <linearGradient id='d1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#d47a3d'/><stop offset='1' stop-color='#8c4a1e'/></linearGradient>
    <linearGradient id='d2' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a05020'/><stop offset='1' stop-color='#5c2a0a'/></linearGradient>
  </defs>
  <rect width='100' height='65' fill='url(#s)'/>
  <circle cx='65' cy='55' r='10' fill='#ffdc73'/>
  <circle cx='65' cy='55' r='14' fill='#ffdc73' opacity='0.28'/>
  <path d='M0 60 Q 30 45 55 55 T 100 50 L 100 80 L 0 80 Z' fill='url(#d1)'/>
  <path d='M0 80 Q 35 65 60 75 T 100 70 L 100 100 L 0 100 Z' fill='url(#d2)'/>
</svg>`;

const SVG_TROPICAL_ISLAND = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4ec8d4'/><stop offset='1' stop-color='#a3e4e9'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0e7490'/><stop offset='1' stop-color='#22a8c2'/></linearGradient>
    <linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffeec1'/><stop offset='1' stop-color='#e8c178'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='20' cy='22' r='6' fill='#fff5c2'/>
  <circle cx='20' cy='22' r='9' fill='#fff5c2' opacity='0.35'/>
  <ellipse cx='55' cy='30' rx='10' ry='3' fill='#ffffff' opacity='0.8'/>
  <rect y='55' width='100' height='30' fill='url(#w)'/>
  <path d='M0 82 Q 50 76 100 82 L 100 95 L 0 95 Z' fill='url(#d)'/>
  <path d='M70 80 Q 68 60 72 40' stroke='#6a3a1a' stroke-width='2' fill='none'/>
  <ellipse cx='72' cy='38' rx='10' ry='3' fill='#2c8a3e' transform='rotate(-22 72 38)'/>
  <ellipse cx='72' cy='38' rx='10' ry='3' fill='#3aa04e' transform='rotate(22 72 38)'/>
  <ellipse cx='72' cy='38' rx='10' ry='3' fill='#35944a' transform='rotate(70 72 38)'/>
  <ellipse cx='72' cy='38' rx='10' ry='3' fill='#329046' transform='rotate(-70 72 38)'/>
</svg>`;

const SVG_FOGGY_VALLEY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7896a8'/><stop offset='1' stop-color='#c8d4db'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <polygon points='0,62 15,38 30,52 50,28 70,46 85,33 100,58 100,100 0,100' fill='#3c4a5e'/>
  <polygon points='48,32 50,28 52,32 51,35' fill='#ffffff' opacity='0.7'/>
  <polygon points='0,72 20,52 40,65 60,50 80,62 100,55 100,100 0,100' fill='#2a3748' opacity='0.85'/>
  <ellipse cx='30' cy='70' rx='42' ry='5' fill='#ffffff' opacity='0.45'/>
  <ellipse cx='70' cy='78' rx='38' ry='4' fill='#ffffff' opacity='0.4'/>
  <ellipse cx='50' cy='88' rx='55' ry='4' fill='#ffffff' opacity='0.35'/>
</svg>`;

const SVG_CITY_NIGHT = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#0a0e2e'/>
      <stop offset='0.6' stop-color='#1e2754'/>
      <stop offset='1' stop-color='#4c3b6e'/>
    </linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='12' cy='10' r='0.6' fill='#ffffff'/>
  <circle cx='28' cy='18' r='0.5' fill='#ffffff'/>
  <circle cx='45' cy='8' r='0.7' fill='#ffffff'/>
  <circle cx='65' cy='20' r='0.5' fill='#ffffff'/>
  <circle cx='88' cy='12' r='0.6' fill='#ffffff'/>
  <circle cx='78' cy='30' r='0.4' fill='#ffffff'/>
  <circle cx='15' cy='35' r='0.4' fill='#ffffff'/>
  <circle cx='35' cy='32' r='0.5' fill='#ffffff'/>
  <circle cx='25' cy='25' r='5' fill='#f5e8b0'/>
  <circle cx='23' cy='23' r='4' fill='#1e2754' opacity='0.35'/>
  <rect x='5' y='55' width='12' height='45' fill='#141a38'/>
  <rect x='18' y='48' width='10' height='52' fill='#1c2340'/>
  <rect x='29' y='62' width='8' height='38' fill='#141a38'/>
  <rect x='38' y='45' width='12' height='55' fill='#1c2340'/>
  <rect x='51' y='58' width='8' height='42' fill='#141a38'/>
  <rect x='60' y='40' width='14' height='60' fill='#1c2340'/>
  <rect x='75' y='55' width='10' height='45' fill='#141a38'/>
  <rect x='86' y='50' width='10' height='50' fill='#1c2340'/>
  <g fill='#ffd87a'>
    <rect x='7' y='60' width='1.5' height='1.5'/>
    <rect x='11' y='65' width='1.5' height='1.5'/>
    <rect x='20' y='55' width='1.5' height='1.5'/>
    <rect x='24' y='65' width='1.5' height='1.5'/>
    <rect x='31' y='70' width='1.5' height='1.5'/>
    <rect x='40' y='50' width='1.5' height='1.5'/>
    <rect x='44' y='58' width='1.5' height='1.5'/>
    <rect x='47' y='70' width='1.5' height='1.5'/>
    <rect x='53' y='65' width='1.5' height='1.5'/>
    <rect x='63' y='45' width='1.5' height='1.5'/>
    <rect x='67' y='55' width='1.5' height='1.5'/>
    <rect x='71' y='65' width='1.5' height='1.5'/>
    <rect x='77' y='60' width='1.5' height='1.5'/>
    <rect x='81' y='70' width='1.5' height='1.5'/>
    <rect x='88' y='55' width='1.5' height='1.5'/>
    <rect x='92' y='68' width='1.5' height='1.5'/>
  </g>
</svg>`;

const SVG_PINE_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c5d8e8'/><stop offset='1' stop-color='#e8edf3'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <polygon points='0,60 30,32 50,48 75,28 100,52 100,72 0,72' fill='#9ca9b8'/>
  <polygon points='28,35 30,32 32,35 31,37' fill='#ffffff'/>
  <polygon points='73,30 75,28 77,30 76,32' fill='#ffffff'/>
  <path d='M0 72 Q 50 68 100 72 L 100 100 L 0 100 Z' fill='#f0f4f7'/>
  <g fill='#2d5a3d'>
    <polygon points='15,85 10,92 20,92'/>
    <polygon points='15,78 9,88 21,88'/>
    <polygon points='15,71 8,83 22,83'/>
  </g>
  <g fill='#1e4a2e'>
    <polygon points='35,90 30,97 40,97'/>
    <polygon points='35,83 29,94 41,94'/>
    <polygon points='35,76 28,88 42,88'/>
  </g>
  <g fill='#2d5a3d'>
    <polygon points='60,87 55,94 65,94'/>
    <polygon points='60,80 54,90 66,90'/>
  </g>
  <g fill='#1e4a2e'>
    <polygon points='82,89 77,96 87,96'/>
    <polygon points='82,82 76,92 88,92'/>
    <polygon points='82,75 75,87 89,87'/>
  </g>
</svg>`;

const SVG_ALPINE_SNOW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3b6b94'/><stop offset='0.7' stop-color='#7ba8c8'/><stop offset='1' stop-color='#c5d8e8'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='18' cy='18' r='5' fill='#f5ecc0'/>
  <circle cx='18' cy='18' r='8' fill='#f5ecc0' opacity='0.25'/>
  <polygon points='0,55 18,25 35,45 55,20 75,40 100,28 100,65 0,65' fill='#5a6e8a'/>
  <polygon points='15,30 18,25 21,30 20,33 16,33' fill='#ffffff'/>
  <polygon points='52,26 55,20 58,26 57,30 53,30' fill='#ffffff'/>
  <polygon points='96,32 100,28 100,38 96,38' fill='#ffffff'/>
  <polygon points='0,70 20,40 38,60 55,35 75,55 100,45 100,80 0,80' fill='#3c4e6a'/>
  <polygon points='17,46 20,40 23,46 22,50 18,50' fill='#ffffff'/>
  <polygon points='52,42 55,35 58,42 57,47 53,47' fill='#ffffff'/>
  <polygon points='72,58 75,55 78,58 77,62 73,62' fill='#ffffff'/>
  <rect y='80' width='100' height='20' fill='#eaf1f7'/>
</svg>`;

const SVG_LAVA_VALLEY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#1a0914'/>
      <stop offset='0.5' stop-color='#4a0e1a'/>
      <stop offset='1' stop-color='#8c2418'/>
    </linearGradient>
  </defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <circle cx='20' cy='15' r='0.7' fill='#ffb858'/>
  <circle cx='35' cy='8' r='0.6' fill='#ff9838'/>
  <circle cx='55' cy='12' r='0.7' fill='#ffb858'/>
  <circle cx='75' cy='20' r='0.5' fill='#ff9838'/>
  <circle cx='88' cy='10' r='0.6' fill='#ffb858'/>
  <circle cx='15' cy='28' r='0.5' fill='#ff9838'/>
  <circle cx='65' cy='30' r='0.6' fill='#ffb858'/>
  <polygon points='30,60 50,20 70,60' fill='#1a0f0a'/>
  <polygon points='45,30 50,20 55,30 58,50 52,65 45,55' fill='#ff4a1a'/>
  <polygon points='48,32 50,25 52,32 54,48 50,58 46,50' fill='#ffa838'/>
  <rect y='60' width='100' height='40' fill='#2a0a0a'/>
  <path d='M0 70 Q 30 68 60 72 T 100 70 L 100 78 L 0 78 Z' fill='#c42a0e'/>
  <path d='M0 75 Q 20 74 50 76 T 100 74 L 100 80 L 0 80 Z' fill='#ff6a2a'/>
  <path d='M0 85 Q 25 83 55 86 T 100 84 L 100 92 L 0 92 Z' fill='#c42a0e'/>
  <path d='M0 90 Q 30 88 60 91 T 100 89 L 100 100 L 0 100 Z' fill='#ff6a2a'/>
</svg>`;

const SVG_MYSTIC_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='g' cx='0.5' cy='0.55' r='0.6'>
      <stop offset='0' stop-color='#64ffc8'/>
      <stop offset='0.35' stop-color='#1a3a2e'/>
      <stop offset='1' stop-color='#050e0a'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='url(#g)'/>
  <g fill='#051410'>
    <polygon points='8,100 5,40 11,40'/>
    <polygon points='20,100 17,30 23,30'/>
    <polygon points='32,100 30,50 34,50'/>
    <polygon points='75,100 72,35 78,35'/>
    <polygon points='88,100 85,45 91,45'/>
  </g>
  <g fill='#0a1c14'>
    <circle cx='8' cy='40' r='6'/>
    <circle cx='20' cy='30' r='8'/>
    <circle cx='32' cy='50' r='5'/>
    <circle cx='75' cy='35' r='7'/>
    <circle cx='88' cy='45' r='6'/>
  </g>
  <circle cx='40' cy='55' r='2.5' fill='#a8ffe0' opacity='0.35'/>
  <circle cx='55' cy='50' r='2.5' fill='#a8ffe0' opacity='0.35'/>
  <circle cx='60' cy='62' r='2.2' fill='#a8ffe0' opacity='0.3'/>
  <circle cx='40' cy='55' r='1' fill='#e8ffef'/>
  <circle cx='45' cy='60' r='0.8' fill='#e8ffef'/>
  <circle cx='55' cy='50' r='1' fill='#e8ffef'/>
  <circle cx='60' cy='58' r='0.8' fill='#e8ffef'/>
  <circle cx='50' cy='65' r='0.9' fill='#e8ffef'/>
</svg>`;

const SVG_UNDERWATER_REEF = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#22a8c2'/>
      <stop offset='0.5' stop-color='#0e6e90'/>
      <stop offset='1' stop-color='#052a4a'/>
    </linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#w)'/>
  <polygon points='20,0 28,0 40,100 32,100' fill='#ffffff' opacity='0.14'/>
  <polygon points='50,0 55,0 60,100 55,100' fill='#ffffff' opacity='0.11'/>
  <polygon points='70,0 78,0 85,100 77,100' fill='#ffffff' opacity='0.09'/>
  <circle cx='25' cy='80' r='1.5' fill='#ffffff' opacity='0.55'/>
  <circle cx='22' cy='70' r='1' fill='#ffffff' opacity='0.5'/>
  <circle cx='28' cy='60' r='0.8' fill='#ffffff' opacity='0.45'/>
  <circle cx='70' cy='75' r='1.3' fill='#ffffff' opacity='0.55'/>
  <circle cx='68' cy='65' r='0.9' fill='#ffffff' opacity='0.45'/>
  <path d='M10 100 L 10 85 Q 12 80 14 85 L 14 100 Z' fill='#ff6a8a'/>
  <path d='M15 100 L 15 88 Q 17 84 19 88 L 19 100 Z' fill='#ff8ab0'/>
  <path d='M85 100 L 85 82 Q 88 78 91 82 L 91 100 Z' fill='#ff9a5a'/>
  <path d='M80 100 L 80 88 Q 82 85 84 88 L 84 100 Z' fill='#ffb878'/>
  <path d='M45 100 L 45 90 Q 48 86 51 90 L 51 100 Z' fill='#c85a9a'/>
  <path d='M55 100 L 55 92 Q 57 89 59 92 L 59 100 Z' fill='#e676a8'/>
</svg>`;

const SVG_COSMIC_SPACE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='n1' cx='0.3' cy='0.4' r='0.5'>
      <stop offset='0' stop-color='#8c3a8f'/>
      <stop offset='1' stop-color='#8c3a8f' stop-opacity='0'/>
    </radialGradient>
    <radialGradient id='n2' cx='0.7' cy='0.6' r='0.5'>
      <stop offset='0' stop-color='#3a5aaf'/>
      <stop offset='1' stop-color='#3a5aaf' stop-opacity='0'/>
    </radialGradient>
    <radialGradient id='n3' cx='0.5' cy='0.3' r='0.4'>
      <stop offset='0' stop-color='#c44a7a'/>
      <stop offset='1' stop-color='#c44a7a' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='#060012'/>
  <rect width='100' height='100' fill='url(#n1)'/>
  <rect width='100' height='100' fill='url(#n2)'/>
  <rect width='100' height='100' fill='url(#n3)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='15' r='0.5'/>
    <circle cx='25' cy='8' r='0.7'/>
    <circle cx='40' cy='20' r='0.4'/>
    <circle cx='55' cy='12' r='0.6'/>
    <circle cx='70' cy='25' r='0.5'/>
    <circle cx='85' cy='10' r='0.7'/>
    <circle cx='95' cy='30' r='0.4'/>
    <circle cx='15' cy='40' r='0.6'/>
    <circle cx='30' cy='55' r='0.4'/>
    <circle cx='45' cy='45' r='0.8'/>
    <circle cx='60' cy='60' r='0.5'/>
    <circle cx='75' cy='50' r='0.6'/>
    <circle cx='90' cy='65' r='0.4'/>
    <circle cx='5' cy='70' r='0.5'/>
    <circle cx='20' cy='80' r='0.7'/>
    <circle cx='35' cy='90' r='0.4'/>
    <circle cx='50' cy='85' r='0.6'/>
    <circle cx='65' cy='95' r='0.5'/>
    <circle cx='80' cy='80' r='0.4'/>
    <circle cx='95' cy='90' r='0.6'/>
  </g>
</svg>`;

const SVG_MILKY_WAY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#020a1e'/>
      <stop offset='0.6' stop-color='#0c1a3a'/>
      <stop offset='1' stop-color='#1a2a4a'/>
    </linearGradient>
    <radialGradient id='c' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0' stop-color='#fff5d0' stop-opacity='0.75'/>
      <stop offset='0.5' stop-color='#8c5aaf' stop-opacity='0.32'/>
      <stop offset='1' stop-color='#3a2a6e' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='100' height='80' fill='url(#s)'/>
  <ellipse cx='50' cy='35' rx='60' ry='9' fill='url(#c)' transform='rotate(-15 50 35)'/>
  <ellipse cx='50' cy='35' rx='45' ry='4' fill='#ffffff' opacity='0.14' transform='rotate(-15 50 35)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='20' r='0.5'/>
    <circle cx='25' cy='10' r='0.8'/>
    <circle cx='40' cy='15' r='0.4'/>
    <circle cx='55' cy='25' r='0.6'/>
    <circle cx='70' cy='18' r='0.5'/>
    <circle cx='85' cy='28' r='0.8'/>
    <circle cx='18' cy='45' r='0.6'/>
    <circle cx='35' cy='55' r='0.4'/>
    <circle cx='50' cy='60' r='0.5'/>
    <circle cx='65' cy='50' r='0.7'/>
    <circle cx='80' cy='55' r='0.4'/>
    <circle cx='95' cy='45' r='0.6'/>
    <circle cx='5' cy='60' r='0.5'/>
    <circle cx='20' cy='70' r='0.4'/>
    <circle cx='45' cy='72' r='0.5'/>
    <circle cx='75' cy='70' r='0.4'/>
  </g>
  <rect y='80' width='100' height='20' fill='#020408'/>
  <polygon points='0,80 15,68 30,78 50,65 70,75 85,68 100,78 100,82 0,82' fill='#000000'/>
</svg>`;

const SVG_GALAXY_CORE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='c' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0' stop-color='#fff5d0'/>
      <stop offset='0.1' stop-color='#ffe088'/>
      <stop offset='0.25' stop-color='#c45aaf'/>
      <stop offset='0.55' stop-color='#3a2a8e'/>
      <stop offset='1' stop-color='#060020'/>
    </radialGradient>
    <radialGradient id='a' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0' stop-color='#8c7aff' stop-opacity='0'/>
      <stop offset='0.4' stop-color='#8c7aff' stop-opacity='0.38'/>
      <stop offset='1' stop-color='#8c7aff' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='#060020'/>
  <ellipse cx='50' cy='50' rx='50' ry='18' fill='url(#a)' transform='rotate(25 50 50)'/>
  <ellipse cx='50' cy='50' rx='50' ry='14' fill='url(#a)' transform='rotate(-15 50 50)'/>
  <ellipse cx='50' cy='50' rx='40' ry='40' fill='url(#c)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='20' r='0.5'/>
    <circle cx='85' cy='15' r='0.7'/>
    <circle cx='15' cy='80' r='0.5'/>
    <circle cx='90' cy='85' r='0.6'/>
    <circle cx='25' cy='30' r='0.4'/>
    <circle cx='75' cy='70' r='0.5'/>
    <circle cx='50' cy='10' r='0.6'/>
    <circle cx='50' cy='92' r='0.5'/>
    <circle cx='8' cy='50' r='0.4'/>
    <circle cx='93' cy='50' r='0.5'/>
  </g>
</svg>`;

// ── Batch 2: +20 Szenen ────────────────────────────────────

const SVG_SUMMER_PARK = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7ec0ee'/><stop offset='1' stop-color='#d0ecf7'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#84c36e'/><stop offset='1' stop-color='#5fa84a'/></linearGradient>
  </defs>
  <rect width='100' height='68' fill='url(#s)'/>
  <ellipse cx='18' cy='22' rx='10' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='80' cy='18' rx='12' ry='3.5' fill='#ffffff' opacity='0.85'/>
  <circle cx='88' cy='28' r='5' fill='#fff3a8'/>
  <rect y='68' width='100' height='32' fill='url(#g)'/>
  <rect x='48' y='40' width='4' height='35' fill='#6b3e1a'/>
  <circle cx='50' cy='36' r='14' fill='#4a9a3c'/>
  <circle cx='42' cy='38' r='9' fill='#5fb04c'/>
  <circle cx='58' cy='38' r='9' fill='#5fb04c'/>
  <circle cx='50' cy='28' r='8' fill='#64b850'/>
  <circle cx='18' cy='82' r='1.4' fill='#ffffff'/>
  <circle cx='28' cy='88' r='1.4' fill='#ff6b9d'/>
  <circle cx='68' cy='86' r='1.4' fill='#fff275'/>
  <circle cx='78' cy='92' r='1.4' fill='#ff6b9d'/>
  <circle cx='88' cy='80' r='1.4' fill='#ffffff'/>
</svg>`;

const SVG_RIVERSIDE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a3d5f0'/><stop offset='1' stop-color='#e0f0fa'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a92b8'/><stop offset='1' stop-color='#6ab0ce'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7cc576'/><stop offset='1' stop-color='#4a9f3e'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <ellipse cx='25' cy='28' rx='12' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='72' cy='38' rx='10' ry='3' fill='#ffffff' opacity='0.82'/>
  <path d='M0 55 Q 50 50 100 55 L 100 75 L 0 75 Z' fill='url(#w)'/>
  <rect x='0' y='62' width='100' height='0.5' fill='#ffffff' opacity='0.35'/>
  <rect x='0' y='68' width='100' height='0.4' fill='#ffffff' opacity='0.25'/>
  <path d='M0 72 Q 50 68 100 72 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <path d='M12 80 L 10 72 M13 80 L 14 73 M14 80 L 16 73' stroke='#2d5a1e' stroke-width='0.5'/>
  <path d='M82 78 L 80 70 M83 78 L 84 71 M84 78 L 86 70' stroke='#2d5a1e' stroke-width='0.5'/>
</svg>`;

const SVG_PUFFY_CLOUDS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4aa8dc'/><stop offset='1' stop-color='#a0d4f0'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#ffffff'>
    <circle cx='18' cy='30' r='9'/>
    <circle cx='26' cy='28' r='11'/>
    <circle cx='34' cy='32' r='8'/>
    <circle cx='22' cy='35' r='8'/>
    <ellipse cx='26' cy='38' rx='14' ry='4'/>
  </g>
  <g fill='#ffffff'>
    <circle cx='62' cy='58' r='10'/>
    <circle cx='72' cy='55' r='12'/>
    <circle cx='82' cy='60' r='9'/>
    <ellipse cx='72' cy='65' rx='16' ry='4'/>
  </g>
  <g fill='#ffffff' opacity='0.9'>
    <circle cx='12' cy='75' r='7'/>
    <circle cx='20' cy='73' r='9'/>
    <ellipse cx='16' cy='80' rx='12' ry='3'/>
  </g>
</svg>`;

const SVG_SPRING_BLOSSOMS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#b8dff0'/><stop offset='1' stop-color='#e8f3f8'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <path d='M10 10 Q 30 25 55 20 Q 75 18 95 30' stroke='#6b3e1a' stroke-width='2' fill='none'/>
  <path d='M30 22 Q 35 35 42 30' stroke='#6b3e1a' stroke-width='1.2' fill='none'/>
  <path d='M70 22 Q 75 35 82 28' stroke='#6b3e1a' stroke-width='1.2' fill='none'/>
  <g fill='#ffc4d6'>
    <circle cx='12' cy='12' r='2.5'/>
    <circle cx='20' cy='15' r='2'/>
    <circle cx='28' cy='20' r='2.5'/>
    <circle cx='38' cy='22' r='2'/>
    <circle cx='48' cy='20' r='2.5'/>
    <circle cx='58' cy='18' r='2'/>
    <circle cx='68' cy='20' r='2.5'/>
    <circle cx='78' cy='24' r='2'/>
    <circle cx='88' cy='28' r='2.5'/>
    <circle cx='34' cy='33' r='2'/>
    <circle cx='40' cy='30' r='2'/>
    <circle cx='74' cy='30' r='2'/>
    <circle cx='80' cy='28' r='2'/>
  </g>
  <g fill='#ff9ec4'>
    <circle cx='16' cy='13' r='1'/>
    <circle cx='32' cy='22' r='1'/>
    <circle cx='52' cy='20' r='1'/>
    <circle cx='72' cy='22' r='1'/>
    <circle cx='82' cy='26' r='1'/>
  </g>
  <circle cx='25' cy='60' r='0.8' fill='#ffc4d6'/>
  <circle cx='45' cy='70' r='0.8' fill='#ff9ec4'/>
  <circle cx='65' cy='65' r='0.8' fill='#ffc4d6'/>
  <circle cx='85' cy='80' r='0.8' fill='#ff9ec4'/>
  <circle cx='15' cy='85' r='0.8' fill='#ffc4d6'/>
</svg>`;

const SVG_LAVENDER_FIELD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffa678'/><stop offset='0.6' stop-color='#ffc5a5'/><stop offset='1' stop-color='#ffe0c8'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='78' cy='28' r='8' fill='#fff3a8'/>
  <circle cx='78' cy='28' r='12' fill='#fff3a8' opacity='0.32'/>
  <path d='M0 52 Q 30 45 55 50 T 100 48 L 100 65 L 0 65 Z' fill='#6e4a7a'/>
  <g stroke='#8c5ab0' stroke-width='1.6'>
    <path d='M2 65 L 4 55'/>
    <path d='M8 65 L 10 54'/>
    <path d='M14 65 L 16 56'/>
    <path d='M20 65 L 22 54'/>
    <path d='M26 65 L 28 55'/>
    <path d='M32 65 L 34 53'/>
    <path d='M38 65 L 40 55'/>
    <path d='M44 65 L 46 54'/>
    <path d='M50 65 L 52 55'/>
    <path d='M56 65 L 58 54'/>
    <path d='M62 65 L 64 55'/>
    <path d='M68 65 L 70 54'/>
    <path d='M74 65 L 76 55'/>
    <path d='M80 65 L 82 54'/>
    <path d='M86 65 L 88 55'/>
    <path d='M92 65 L 94 54'/>
  </g>
  <rect y='65' width='100' height='8' fill='#5a3a68'/>
  <g stroke='#a674c8' stroke-width='1.6'>
    <path d='M4 73 L 6 64'/>
    <path d='M12 73 L 14 63'/>
    <path d='M20 73 L 22 64'/>
    <path d='M28 73 L 30 63'/>
    <path d='M36 73 L 38 64'/>
    <path d='M44 73 L 46 63'/>
    <path d='M52 73 L 54 64'/>
    <path d='M60 73 L 62 63'/>
    <path d='M68 73 L 70 64'/>
    <path d='M76 73 L 78 63'/>
    <path d='M84 73 L 86 64'/>
    <path d='M92 73 L 94 63'/>
  </g>
  <rect y='73' width='100' height='10' fill='#4c2e5a'/>
  <g stroke='#c088e0' stroke-width='1.8'>
    <path d='M3 83 L 5 73'/>
    <path d='M12 83 L 14 72'/>
    <path d='M22 83 L 24 73'/>
    <path d='M32 83 L 34 72'/>
    <path d='M42 83 L 44 73'/>
    <path d='M52 83 L 54 72'/>
    <path d='M62 83 L 64 73'/>
    <path d='M72 83 L 74 72'/>
    <path d='M82 83 L 84 73'/>
    <path d='M92 83 L 94 72'/>
  </g>
  <rect y='83' width='100' height='17' fill='#3c2048'/>
</svg>`;

const SVG_LAKE_DOCK = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffb478'/><stop offset='0.6' stop-color='#ffd6a5'/><stop offset='1' stop-color='#ffe8c8'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8c6b52'/><stop offset='1' stop-color='#4a3a2a'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='50' cy='42' r='6' fill='#fff3a8'/>
  <circle cx='50' cy='42' r='10' fill='#fff3a8' opacity='0.35'/>
  <polygon points='0,50 30,38 55,44 80,36 100,45 100,58 0,58' fill='#4a3a5a'/>
  <rect y='55' width='100' height='45' fill='url(#w)'/>
  <ellipse cx='50' cy='58' rx='10' ry='1' fill='#fff3a8' opacity='0.5'/>
  <ellipse cx='50' cy='65' rx='7' ry='0.8' fill='#fff3a8' opacity='0.35'/>
  <ellipse cx='50' cy='73' rx='4' ry='0.6' fill='#fff3a8' opacity='0.25'/>
  <rect x='40' y='55' width='20' height='3' fill='#6b4a2a'/>
  <rect x='42' y='58' width='2' height='15' fill='#4a3018'/>
  <rect x='56' y='58' width='2' height='15' fill='#4a3018'/>
</svg>`;

const SVG_PUMPKIN_PATCH = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#d88a4a'/><stop offset='1' stop-color='#f4c878'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8aa83e'/><stop offset='1' stop-color='#5c7a24'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='78' cy='25' r='7' fill='#fff3a8'/>
  <circle cx='78' cy='25' r='10' fill='#fff3a8' opacity='0.35'/>
  <polygon points='0,55 20,48 40,54 60,46 80,52 100,44 100,65 0,65' fill='#4a5e2a'/>
  <rect y='65' width='100' height='35' fill='url(#g)'/>
  <g fill='#e8762a'>
    <ellipse cx='18' cy='82' rx='7' ry='5'/>
    <ellipse cx='34' cy='78' rx='6' ry='4.5'/>
    <ellipse cx='50' cy='84' rx='8' ry='5.5'/>
    <ellipse cx='68' cy='80' rx='6.5' ry='5'/>
    <ellipse cx='84' cy='85' rx='7' ry='5'/>
    <ellipse cx='10' cy='92' rx='6' ry='4'/>
    <ellipse cx='42' cy='92' rx='7' ry='5'/>
    <ellipse cx='76' cy='93' rx='6.5' ry='4.5'/>
  </g>
  <g stroke='#b8591e' stroke-width='0.6' fill='none'>
    <path d='M18 77 L 18 82 M34 74 L 34 78 M50 79 L 50 84 M68 75 L 68 80 M84 80 L 84 85'/>
  </g>
  <g stroke='#3a5010' stroke-width='0.6'>
    <path d='M18 76 Q 15 74 13 75'/>
    <path d='M50 78 Q 53 76 55 77'/>
    <path d='M84 79 Q 81 77 79 78'/>
  </g>
</svg>`;

const SVG_MORNING_MIST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c8b4d0'/><stop offset='0.5' stop-color='#ffc4a8'/><stop offset='1' stop-color='#ffe0c8'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8aa0b0'/><stop offset='1' stop-color='#5a7080'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='50' cy='28' r='6' fill='#ffe8a8'/>
  <circle cx='50' cy='28' r='10' fill='#ffe8a8' opacity='0.4'/>
  <g fill='#2a3a4a'>
    <polygon points='5,70 10,45 15,70'/>
    <polygon points='20,70 25,40 30,70'/>
    <polygon points='70,72 75,42 80,72'/>
    <polygon points='85,72 90,48 95,72'/>
  </g>
  <g fill='#1a2838'>
    <polygon points='40,75 45,50 50,75'/>
    <polygon points='52,75 57,48 62,75'/>
  </g>
  <path d='M0 72 Q 50 68 100 72 L 100 84 L 0 84 Z' fill='url(#w)'/>
  <ellipse cx='25' cy='65' rx='30' ry='3' fill='#ffffff' opacity='0.55'/>
  <ellipse cx='70' cy='68' rx='35' ry='3' fill='#ffffff' opacity='0.5'/>
  <ellipse cx='50' cy='78' rx='50' ry='2.5' fill='#ffffff' opacity='0.45'/>
  <rect y='84' width='100' height='16' fill='#3a4a1a'/>
</svg>`;

const SVG_SNOWY_VILLAGE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1a2040'/><stop offset='1' stop-color='#4a5a7e'/></linearGradient>
  </defs>
  <rect width='100' height='65' fill='url(#s)'/>
  <circle cx='20' cy='22' r='6' fill='#f0ecd0'/>
  <circle cx='20' cy='22' r='9' fill='#f0ecd0' opacity='0.3'/>
  <g fill='#ffffff'>
    <circle cx='12' cy='12' r='0.4'/>
    <circle cx='35' cy='15' r='0.5'/>
    <circle cx='50' cy='10' r='0.4'/>
    <circle cx='65' cy='18' r='0.5'/>
    <circle cx='80' cy='12' r='0.4'/>
    <circle cx='90' cy='22' r='0.5'/>
    <circle cx='45' cy='25' r='0.4'/>
    <circle cx='70' cy='30' r='0.4'/>
  </g>
  <polygon points='0,55 15,40 30,52 50,35 70,50 85,38 100,55 100,78 0,78' fill='#4a5e78'/>
  <path d='M0 68 Q 50 62 100 68 L 100 100 L 0 100 Z' fill='#f0f4f7'/>
  <g>
    <rect x='15' y='70' width='16' height='14' fill='#8a5e3e'/>
    <polygon points='13,70 23,60 33,70' fill='#f0f4f7'/>
    <rect x='20' y='75' width='3' height='4' fill='#ffd87a'/>
    <rect x='26' y='75' width='3' height='4' fill='#ffd87a'/>
  </g>
  <g>
    <rect x='42' y='72' width='14' height='13' fill='#6b4a2a'/>
    <polygon points='40,72 49,62 58,72' fill='#f0f4f7'/>
    <rect x='47' y='76' width='3' height='5' fill='#ffd87a'/>
  </g>
  <g>
    <rect x='70' y='70' width='18' height='15' fill='#8a5e3e'/>
    <polygon points='68,70 79,58 90,70' fill='#f0f4f7'/>
    <rect x='73' y='75' width='3' height='4' fill='#ffd87a'/>
    <rect x='80' y='75' width='3' height='4' fill='#ffd87a'/>
    <rect x='76' y='81' width='3' height='4' fill='#ffd87a'/>
  </g>
  <g fill='#1e4a2e'>
    <polygon points='5,88 2,95 8,95'/>
    <polygon points='5,82 1,92 9,92'/>
    <polygon points='95,90 92,97 98,97'/>
    <polygon points='95,84 91,94 99,94'/>
  </g>
</svg>`;

const SVG_WATERFALL = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a6e5a'/><stop offset='1' stop-color='#8ab07a'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#bce8f5'/><stop offset='1' stop-color='#5aa8c8'/></linearGradient>
    <linearGradient id='p' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a92b8'/><stop offset='1' stop-color='#2a6a8e'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <rect x='20' y='0' width='60' height='70' fill='#3a5a4e'/>
  <g fill='#1e3a2e'>
    <circle cx='10' cy='25' r='8'/>
    <circle cx='5' cy='30' r='7'/>
    <circle cx='18' cy='35' r='8'/>
    <circle cx='90' cy='25' r='8'/>
    <circle cx='95' cy='32' r='7'/>
    <circle cx='82' cy='38' r='8'/>
  </g>
  <rect x='32' y='5' width='36' height='70' fill='url(#w)'/>
  <g fill='#ffffff' opacity='0.75'>
    <rect x='34' y='10' width='2' height='60'/>
    <rect x='40' y='8' width='2' height='65'/>
    <rect x='46' y='12' width='2' height='58'/>
    <rect x='52' y='9' width='2' height='62'/>
    <rect x='58' y='11' width='2' height='60'/>
    <rect x='64' y='8' width='2' height='63'/>
  </g>
  <ellipse cx='50' cy='78' rx='28' ry='6' fill='url(#p)'/>
  <ellipse cx='50' cy='76' rx='22' ry='4' fill='#ffffff' opacity='0.35'/>
  <rect y='84' width='100' height='16' fill='#4a6e5a'/>
  <g fill='#8ab07a'>
    <circle cx='15' cy='88' r='3'/>
    <circle cx='85' cy='90' r='3'/>
  </g>
</svg>`;

const SVG_CANYON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a1a3a'/><stop offset='0.5' stop-color='#c45a3e'/><stop offset='1' stop-color='#f9a558'/></linearGradient>
    <linearGradient id='r1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c8592e'/><stop offset='1' stop-color='#6a1e0a'/></linearGradient>
    <linearGradient id='r2' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8a3018'/><stop offset='1' stop-color='#3a0a02'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='55' cy='50' r='7' fill='#ffdc73'/>
  <circle cx='55' cy='50' r='11' fill='#ffdc73' opacity='0.35'/>
  <polygon points='0,55 10,40 18,50 25,38 32,48 40,45 40,70 0,70' fill='url(#r1)'/>
  <polygon points='60,55 68,42 75,50 85,38 95,48 100,42 100,70 60,70' fill='url(#r1)'/>
  <rect x='0' y='65' width='40' height='10' fill='#6a2010' opacity='0.6'/>
  <rect x='60' y='65' width='40' height='10' fill='#6a2010' opacity='0.6'/>
  <polygon points='0,70 8,60 18,68 28,58 40,65 40,85 0,85' fill='url(#r2)'/>
  <polygon points='60,70 68,62 78,68 88,58 100,64 100,85 60,85' fill='url(#r2)'/>
  <rect y='85' width='100' height='15' fill='#2a0a02'/>
  <rect y='85' width='100' height='3' fill='#4a92b8'/>
</svg>`;

const SVG_GOLDEN_WHEAT = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#3a2050'/>
      <stop offset='0.4' stop-color='#c44e3a'/>
      <stop offset='0.8' stop-color='#ffc478'/>
      <stop offset='1' stop-color='#ffe8a8'/>
    </linearGradient>
    <linearGradient id='f' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#f0a838'/>
      <stop offset='1' stop-color='#8a5a18'/>
    </linearGradient>
  </defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <circle cx='50' cy='58' r='10' fill='#fff5a0'/>
  <circle cx='50' cy='58' r='16' fill='#fff5a0' opacity='0.3'/>
  <path d='M0 62 Q 50 58 100 62 L 100 100 L 0 100 Z' fill='url(#f)'/>
  <g stroke='#6a3a08' stroke-width='0.3' opacity='0.5'>
    <path d='M5 100 L 5 75'/>
    <path d='M12 100 L 12 72'/>
    <path d='M20 100 L 20 76'/>
    <path d='M28 100 L 28 73'/>
    <path d='M36 100 L 36 75'/>
    <path d='M44 100 L 44 72'/>
    <path d='M58 100 L 58 74'/>
    <path d='M66 100 L 66 73'/>
    <path d='M74 100 L 74 76'/>
    <path d='M82 100 L 82 72'/>
    <path d='M90 100 L 90 75'/>
    <path d='M97 100 L 97 74'/>
  </g>
  <path d='M0 82 L 100 82' stroke='#8a5a18' stroke-width='0.4' opacity='0.4'/>
  <path d='M0 92 L 100 92' stroke='#8a5a18' stroke-width='0.4' opacity='0.4'/>
</svg>`;

const SVG_ZEN_GARDEN = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fdd4e3'/><stop offset='1' stop-color='#ffe8c8'/></linearGradient>
    <linearGradient id='sa' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f4e8c8'/><stop offset='1' stop-color='#e0d4a8'/></linearGradient>
  </defs>
  <rect width='100' height='50' fill='url(#s)'/>
  <circle cx='78' cy='22' r='8' fill='#ffb478'/>
  <circle cx='78' cy='22' r='12' fill='#ffb478' opacity='0.32'/>
  <rect x='15' y='35' width='3' height='15' fill='#5a3d26'/>
  <circle cx='16' cy='30' r='8' fill='#ff9ec4'/>
  <circle cx='10' cy='32' r='6' fill='#ffb0cf'/>
  <circle cx='22' cy='33' r='6' fill='#ffb0cf'/>
  <circle cx='16' cy='24' r='5' fill='#ffc7d9'/>
  <rect y='50' width='100' height='50' fill='url(#sa)'/>
  <g stroke='#c8b878' stroke-width='0.5' fill='none'>
    <path d='M0 55 Q 50 52 100 55'/>
    <path d='M0 60 Q 50 57 100 60'/>
    <path d='M0 65 Q 50 62 100 65'/>
    <path d='M0 72 Q 30 68 50 72 Q 70 76 100 72'/>
    <path d='M0 78 Q 30 74 50 78 Q 70 82 100 78'/>
    <path d='M0 85 Q 50 82 100 85'/>
    <path d='M0 92 Q 50 89 100 92'/>
  </g>
  <ellipse cx='30' cy='75' rx='5' ry='3' fill='#6a6260'/>
  <ellipse cx='30' cy='73' rx='4' ry='2' fill='#8a827e'/>
  <ellipse cx='70' cy='82' rx='7' ry='4' fill='#6a6260'/>
  <ellipse cx='70' cy='80' rx='5' ry='2.5' fill='#8a827e'/>
  <ellipse cx='50' cy='92' rx='4' ry='2' fill='#6a6260'/>
  <circle cx='45' cy='60' r='0.8' fill='#ff9ec4'/>
  <circle cx='60' cy='68' r='0.8' fill='#ffb0cf'/>
  <circle cx='25' cy='88' r='0.8' fill='#ff9ec4'/>
  <circle cx='85' cy='65' r='0.8' fill='#ffb0cf'/>
</svg>`;

const SVG_NORTHERN_LIGHTS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#020818'/>
      <stop offset='0.5' stop-color='#0a1e3a'/>
      <stop offset='1' stop-color='#1a2e50'/>
    </linearGradient>
    <linearGradient id='a1' x1='0' y1='0' x2='0.3' y2='1'>
      <stop offset='0' stop-color='#64ffc8' stop-opacity='0.7'/>
      <stop offset='1' stop-color='#64ffc8' stop-opacity='0'/>
    </linearGradient>
    <linearGradient id='a2' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#a864f0' stop-opacity='0.55'/>
      <stop offset='1' stop-color='#a864f0' stop-opacity='0'/>
    </linearGradient>
    <linearGradient id='a3' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#64c8ff' stop-opacity='0.6'/>
      <stop offset='1' stop-color='#64c8ff' stop-opacity='0'/>
    </linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='12' r='0.4'/>
    <circle cx='25' cy='8' r='0.5'/>
    <circle cx='42' cy='15' r='0.4'/>
    <circle cx='58' cy='6' r='0.5'/>
    <circle cx='72' cy='12' r='0.4'/>
    <circle cx='88' cy='8' r='0.5'/>
    <circle cx='15' cy='25' r='0.4'/>
    <circle cx='50' cy='22' r='0.4'/>
    <circle cx='80' cy='25' r='0.4'/>
  </g>
  <path d='M0 15 Q 25 5 50 15 Q 75 25 100 15 L 100 55 Q 75 65 50 55 Q 25 45 0 55 Z' fill='url(#a1)'/>
  <path d='M0 25 Q 30 15 60 25 Q 85 32 100 28 L 100 60 Q 85 67 60 60 Q 30 50 0 60 Z' fill='url(#a2)'/>
  <path d='M0 35 Q 35 28 70 35 Q 90 38 100 36 L 100 60 Q 90 62 70 60 Q 35 52 0 62 Z' fill='url(#a3)'/>
  <polygon points='0,70 15,52 30,66 45,48 60,62 78,50 95,64 100,60 100,85 0,85' fill='#1a2e50'/>
  <polygon points='13,55 15,52 17,55' fill='#ffffff'/>
  <polygon points='43,50 45,48 47,50' fill='#ffffff'/>
  <polygon points='76,52 78,50 80,52' fill='#ffffff'/>
  <rect y='85' width='100' height='15' fill='#0a1220'/>
  <path d='M0 85 Q 50 82 100 85' fill='none' stroke='#ffffff' opacity='0.3' stroke-width='0.5'/>
</svg>`;

const SVG_SAVANNAH = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#4e1a3a'/>
      <stop offset='0.4' stop-color='#d44e2a'/>
      <stop offset='0.75' stop-color='#ffa040'/>
      <stop offset='1' stop-color='#ffd478'/>
    </linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c89040'/><stop offset='1' stop-color='#6a4020'/></linearGradient>
  </defs>
  <rect width='100' height='70' fill='url(#s)'/>
  <circle cx='25' cy='55' r='11' fill='#ffd478'/>
  <circle cx='25' cy='55' r='16' fill='#ffd478' opacity='0.3'/>
  <path d='M0 70 Q 50 65 100 70 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <g>
    <path d='M70 72 L 70 50 Q 72 45 70 40' stroke='#1a0e0a' stroke-width='1.5' fill='none'/>
    <ellipse cx='70' cy='38' rx='15' ry='4' fill='#1a0e0a'/>
    <ellipse cx='70' cy='35' rx='12' ry='3' fill='#1a0e0a'/>
    <ellipse cx='70' cy='41' rx='14' ry='3' fill='#1a0e0a'/>
  </g>
  <g stroke='#8a5a18' stroke-width='0.6' opacity='0.55'>
    <path d='M10 86 L 10 78'/>
    <path d='M15 88 L 15 80'/>
    <path d='M20 86 L 20 79'/>
    <path d='M35 88 L 35 81'/>
    <path d='M40 86 L 40 79'/>
    <path d='M50 88 L 50 80'/>
    <path d='M85 86 L 85 78'/>
    <path d='M90 88 L 90 80'/>
    <path d='M95 86 L 95 79'/>
  </g>
</svg>`;

const SVG_CRYSTAL_CAVE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='g' cx='0.5' cy='0.6' r='0.7'>
      <stop offset='0' stop-color='#5a3a8c'/>
      <stop offset='0.5' stop-color='#2a1a4a'/>
      <stop offset='1' stop-color='#0a0520'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='url(#g)'/>
  <polygon points='0,0 10,15 20,5 35,18 50,8 65,20 80,10 95,22 100,15 100,0' fill='#1a0f2a'/>
  <polygon points='0,100 15,85 30,95 50,82 70,95 85,85 100,95 100,100' fill='#1a0f2a'/>
  <g>
    <polygon points='10,45 8,60 13,58' fill='#9064d0'/>
    <polygon points='10,45 13,58 16,45' fill='#b088e8'/>
    <polygon points='20,50 18,65 24,63' fill='#64b8e8'/>
    <polygon points='20,50 24,63 28,50' fill='#88d0f0'/>
    <polygon points='80,48 78,62 84,60' fill='#c068e0'/>
    <polygon points='80,48 84,60 88,48' fill='#e088f0'/>
    <polygon points='90,52 88,66 94,64' fill='#64e0c0'/>
    <polygon points='90,52 94,64 98,52' fill='#88f0d0'/>
    <polygon points='45,55 42,72 50,70' fill='#64b8e8'/>
    <polygon points='45,55 50,70 56,55' fill='#88d0f0'/>
    <polygon points='60,60 58,76 65,73' fill='#c068e0'/>
    <polygon points='60,60 65,73 70,60' fill='#e088f0'/>
  </g>
  <circle cx='13' cy='52' r='3' fill='#b088e8' opacity='0.45'/>
  <circle cx='23' cy='58' r='3' fill='#88d0f0' opacity='0.45'/>
  <circle cx='84' cy='55' r='3' fill='#e088f0' opacity='0.45'/>
  <circle cx='94' cy='58' r='3' fill='#88f0d0' opacity='0.45'/>
  <circle cx='49' cy='62' r='4' fill='#88d0f0' opacity='0.45'/>
  <circle cx='64' cy='68' r='3' fill='#e088f0' opacity='0.45'/>
</svg>`;

const SVG_STORM_SEA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#1a1e2a'/>
      <stop offset='0.6' stop-color='#3a4052'/>
      <stop offset='1' stop-color='#5a6272'/>
    </linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#2a3a4e'/>
      <stop offset='1' stop-color='#0a1220'/>
    </linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <g fill='#1a1e2a'>
    <ellipse cx='18' cy='15' rx='18' ry='5'/>
    <ellipse cx='55' cy='8' rx='22' ry='5'/>
    <ellipse cx='85' cy='18' rx='17' ry='4'/>
    <ellipse cx='30' cy='25' rx='20' ry='4'/>
    <ellipse cx='75' cy='28' rx='18' ry='4'/>
  </g>
  <path d='M40 20 L 45 30 L 42 30 L 48 42' stroke='#fff5a0' stroke-width='1.2' fill='none'/>
  <path d='M65 15 L 70 28 L 66 28 L 72 40' stroke='#fff5a0' stroke-width='1' fill='none' opacity='0.7'/>
  <rect y='55' width='100' height='45' fill='url(#w)'/>
  <path d='M0 58 Q 15 54 30 58 T 60 58 T 100 58 L 100 62 L 0 62 Z' fill='#ffffff' opacity='0.18'/>
  <path d='M0 68 Q 20 62 40 68 T 80 68 T 100 68 L 100 72 L 0 72 Z' fill='#ffffff' opacity='0.22'/>
  <path d='M0 78 Q 15 72 30 78 T 60 78 T 100 78 L 100 82 L 0 82 Z' fill='#ffffff' opacity='0.2'/>
  <path d='M0 88 Q 20 82 40 88 T 80 88 T 100 88 L 100 92 L 0 92 Z' fill='#ffffff' opacity='0.18'/>
  <path d='M20 62 Q 25 58 30 62 L 28 64 Q 25 62 22 64 Z' fill='#ffffff' opacity='0.55'/>
  <path d='M60 72 Q 65 68 70 72 L 68 74 Q 65 72 62 74 Z' fill='#ffffff' opacity='0.55'/>
  <path d='M85 84 Q 90 80 95 84 L 93 86 Q 90 84 87 86 Z' fill='#ffffff' opacity='0.55'/>
</svg>`;

const SVG_SATURN_VIEW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='sp' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0' stop-color='#0a0520'/>
      <stop offset='1' stop-color='#020010'/>
    </radialGradient>
    <radialGradient id='sa' cx='0.4' cy='0.4' r='0.6'>
      <stop offset='0' stop-color='#fde8a8'/>
      <stop offset='0.5' stop-color='#e8b068'/>
      <stop offset='1' stop-color='#8a5020'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='url(#sp)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='12' r='0.5'/>
    <circle cx='25' cy='8' r='0.7'/>
    <circle cx='42' cy='14' r='0.4'/>
    <circle cx='58' cy='6' r='0.6'/>
    <circle cx='72' cy='12' r='0.5'/>
    <circle cx='88' cy='8' r='0.7'/>
    <circle cx='15' cy='85' r='0.5'/>
    <circle cx='35' cy='92' r='0.4'/>
    <circle cx='55' cy='88' r='0.6'/>
    <circle cx='78' cy='94' r='0.5'/>
    <circle cx='92' cy='88' r='0.4'/>
    <circle cx='8' cy='55' r='0.4'/>
    <circle cx='94' cy='48' r='0.5'/>
  </g>
  <ellipse cx='50' cy='50' rx='42' ry='7' fill='none' stroke='#e8b068' stroke-width='2' opacity='0.85'/>
  <ellipse cx='50' cy='50' rx='45' ry='8' fill='none' stroke='#c88a48' stroke-width='0.8' opacity='0.7'/>
  <ellipse cx='50' cy='50' rx='38' ry='5.5' fill='none' stroke='#fde8a8' stroke-width='0.6' opacity='0.6'/>
  <circle cx='50' cy='50' r='20' fill='url(#sa)'/>
  <ellipse cx='50' cy='46' rx='18' ry='1.5' fill='#c88a48' opacity='0.55'/>
  <ellipse cx='50' cy='52' rx='19' ry='1.2' fill='#8a5020' opacity='0.4'/>
  <ellipse cx='50' cy='58' rx='17' ry='1' fill='#c88a48' opacity='0.5'/>
  <ellipse cx='50' cy='50' rx='42' ry='7' fill='none' stroke='#0a0520' stroke-width='2' opacity='0.6' clip-path='inset(0 0 50% 0)'/>
</svg>`;

const SVG_EARTH_FROM_MOON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='sp' cx='0.5' cy='0.3' r='0.7'>
      <stop offset='0' stop-color='#0a1028'/>
      <stop offset='1' stop-color='#020008'/>
    </radialGradient>
    <radialGradient id='e' cx='0.4' cy='0.4' r='0.6'>
      <stop offset='0' stop-color='#6ab8e8'/>
      <stop offset='0.6' stop-color='#2a6ab0'/>
      <stop offset='1' stop-color='#0a2860'/>
    </radialGradient>
    <linearGradient id='m' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#8a8a92'/>
      <stop offset='1' stop-color='#4a4a52'/>
    </linearGradient>
  </defs>
  <rect width='100' height='70' fill='url(#sp)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='10' r='0.5'/>
    <circle cx='22' cy='6' r='0.7'/>
    <circle cx='38' cy='14' r='0.4'/>
    <circle cx='58' cy='8' r='0.6'/>
    <circle cx='72' cy='12' r='0.5'/>
    <circle cx='90' cy='6' r='0.7'/>
    <circle cx='15' cy='30' r='0.4'/>
    <circle cx='45' cy='40' r='0.5'/>
    <circle cx='85' cy='35' r='0.6'/>
    <circle cx='30' cy='55' r='0.4'/>
    <circle cx='70' cy='50' r='0.5'/>
  </g>
  <circle cx='55' cy='25' r='18' fill='url(#e)'/>
  <path d='M48 18 Q 55 15 62 20 Q 65 25 60 28 Q 52 30 48 25 Z' fill='#5aaa5e' opacity='0.75'/>
  <path d='M50 30 Q 58 32 60 28 Q 55 34 50 34 Z' fill='#5aaa5e' opacity='0.7'/>
  <path d='M44 22 Q 48 20 50 24 Q 46 26 44 22 Z' fill='#eaeaea' opacity='0.55'/>
  <circle cx='55' cy='25' r='18' fill='none' stroke='#040008' stroke-width='12' opacity='0.5' clip-path='inset(0 0 0 50%)'/>
  <path d='M0 70 Q 50 60 100 72 L 100 100 L 0 100 Z' fill='url(#m)'/>
  <g fill='#2a2a32'>
    <circle cx='18' cy='82' r='3'/>
    <circle cx='35' cy='78' r='2'/>
    <circle cx='52' cy='85' r='4'/>
    <circle cx='72' cy='80' r='2.5'/>
    <circle cx='88' cy='86' r='3.5'/>
    <circle cx='25' cy='92' r='2'/>
    <circle cx='60' cy='93' r='2.5'/>
  </g>
</svg>`;

const SVG_BLACK_HOLE_DISK = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='sp' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0' stop-color='#040008'/>
      <stop offset='1' stop-color='#020010'/>
    </radialGradient>
    <radialGradient id='d' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0' stop-color='#000000' stop-opacity='0'/>
      <stop offset='0.35' stop-color='#000000'/>
      <stop offset='0.45' stop-color='#ff8a2a'/>
      <stop offset='0.55' stop-color='#fde058'/>
      <stop offset='0.65' stop-color='#ff5820'/>
      <stop offset='1' stop-color='#300510' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='url(#sp)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='12' r='0.5'/>
    <circle cx='25' cy='8' r='0.6'/>
    <circle cx='88' cy='14' r='0.5'/>
    <circle cx='15' cy='85' r='0.5'/>
    <circle cx='90' cy='88' r='0.6'/>
    <circle cx='8' cy='45' r='0.4'/>
    <circle cx='92' cy='52' r='0.5'/>
  </g>
  <ellipse cx='50' cy='50' rx='45' ry='8' fill='url(#d)'/>
  <circle cx='50' cy='50' r='14' fill='#000000'/>
  <circle cx='50' cy='50' r='16' fill='none' stroke='#ff8a2a' stroke-width='0.6' opacity='0.7'/>
  <circle cx='50' cy='50' r='18' fill='none' stroke='#fde058' stroke-width='0.4' opacity='0.5'/>
  <ellipse cx='50' cy='50' rx='45' ry='8' fill='none' stroke='#fde058' stroke-width='0.5' opacity='0.6'/>
  <ellipse cx='50' cy='50' rx='42' ry='6' fill='none' stroke='#ff8a2a' stroke-width='0.5' opacity='0.65'/>
</svg>`;

// ── Batch 3: +20 Szenen ────────────────────────────────────

const SVG_BAMBOO_GROVE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a8d4a8'/><stop offset='1' stop-color='#d8ebd0'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g stroke='#6a9a4a' stroke-width='3.5'>
    <line x1='8' y1='0' x2='8' y2='100'/>
    <line x1='22' y1='0' x2='22' y2='100'/>
    <line x1='36' y1='0' x2='36' y2='100'/>
    <line x1='50' y1='0' x2='50' y2='100'/>
    <line x1='64' y1='0' x2='64' y2='100'/>
    <line x1='78' y1='0' x2='78' y2='100'/>
    <line x1='92' y1='0' x2='92' y2='100'/>
  </g>
  <g stroke='#4a7a2a' stroke-width='0.5'>
    <line x1='6' y1='18' x2='10' y2='18'/>
    <line x1='6' y1='38' x2='10' y2='38'/>
    <line x1='6' y1='58' x2='10' y2='58'/>
    <line x1='6' y1='78' x2='10' y2='78'/>
    <line x1='20' y1='25' x2='24' y2='25'/>
    <line x1='20' y1='48' x2='24' y2='48'/>
    <line x1='20' y1='72' x2='24' y2='72'/>
    <line x1='34' y1='20' x2='38' y2='20'/>
    <line x1='34' y1='42' x2='38' y2='42'/>
    <line x1='34' y1='66' x2='38' y2='66'/>
    <line x1='48' y1='15' x2='52' y2='15'/>
    <line x1='48' y1='40' x2='52' y2='40'/>
    <line x1='48' y1='65' x2='52' y2='65'/>
    <line x1='48' y1='88' x2='52' y2='88'/>
    <line x1='62' y1='28' x2='66' y2='28'/>
    <line x1='62' y1='52' x2='66' y2='52'/>
    <line x1='62' y1='76' x2='66' y2='76'/>
    <line x1='76' y1='22' x2='80' y2='22'/>
    <line x1='76' y1='46' x2='80' y2='46'/>
    <line x1='76' y1='70' x2='80' y2='70'/>
    <line x1='90' y1='30' x2='94' y2='30'/>
    <line x1='90' y1='55' x2='94' y2='55'/>
    <line x1='90' y1='80' x2='94' y2='80'/>
  </g>
  <g fill='#5c8a3e' opacity='0.7'>
    <ellipse cx='14' cy='12' rx='3' ry='1' transform='rotate(25 14 12)'/>
    <ellipse cx='28' cy='15' rx='3' ry='1' transform='rotate(-20 28 15)'/>
    <ellipse cx='42' cy='10' rx='3' ry='1' transform='rotate(15 42 10)'/>
    <ellipse cx='58' cy='8' rx='3' ry='1' transform='rotate(-25 58 8)'/>
    <ellipse cx='72' cy='12' rx='3' ry='1' transform='rotate(20 72 12)'/>
    <ellipse cx='86' cy='14' rx='3' ry='1' transform='rotate(-15 86 14)'/>
  </g>
</svg>`;

const SVG_DANDELION_FIELD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8ec0e8'/><stop offset='1' stop-color='#d8ecf8'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9cc876'/><stop offset='1' stop-color='#6ba84a'/></linearGradient>
  </defs>
  <rect width='100' height='65' fill='url(#s)'/>
  <ellipse cx='22' cy='22' rx='10' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='72' cy='32' rx='12' ry='3.5' fill='#ffffff' opacity='0.82'/>
  <rect y='65' width='100' height='35' fill='url(#g)'/>
  <g>
    <line x1='15' y1='85' x2='15' y2='72' stroke='#4a7a2a' stroke-width='0.5'/>
    <circle cx='15' cy='70' r='3' fill='#ffffff' opacity='0.85'/>
    <circle cx='15' cy='70' r='1.5' fill='#ffe858'/>
    <line x1='30' y1='90' x2='30' y2='76' stroke='#4a7a2a' stroke-width='0.5'/>
    <circle cx='30' cy='74' r='3' fill='#ffffff' opacity='0.85'/>
    <circle cx='30' cy='74' r='1.5' fill='#ffe858'/>
    <line x1='45' y1='82' x2='45' y2='68' stroke='#4a7a2a' stroke-width='0.5'/>
    <circle cx='45' cy='66' r='3' fill='#ffffff' opacity='0.85'/>
    <circle cx='45' cy='66' r='1.5' fill='#ffe858'/>
    <line x1='60' y1='88' x2='60' y2='74' stroke='#4a7a2a' stroke-width='0.5'/>
    <circle cx='60' cy='72' r='3' fill='#ffffff' opacity='0.85'/>
    <circle cx='60' cy='72' r='1.5' fill='#ffe858'/>
    <line x1='78' y1='86' x2='78' y2='72' stroke='#4a7a2a' stroke-width='0.5'/>
    <circle cx='78' cy='70' r='3' fill='#ffffff' opacity='0.85'/>
    <circle cx='78' cy='70' r='1.5' fill='#ffe858'/>
    <line x1='90' y1='92' x2='90' y2='78' stroke='#4a7a2a' stroke-width='0.5'/>
    <circle cx='90' cy='76' r='3' fill='#ffffff' opacity='0.85'/>
    <circle cx='90' cy='76' r='1.5' fill='#ffe858'/>
  </g>
  <g fill='#ffffff' opacity='0.7'>
    <circle cx='35' cy='40' r='0.6'/>
    <circle cx='55' cy='48' r='0.5'/>
    <circle cx='68' cy='55' r='0.6'/>
    <circle cx='82' cy='42' r='0.5'/>
    <circle cx='18' cy='50' r='0.6'/>
  </g>
</svg>`;

const SVG_COUNTRY_ROAD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#90c8e8'/><stop offset='1' stop-color='#d0e8f4'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#84c36e'/><stop offset='1' stop-color='#5fa84a'/></linearGradient>
  </defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <ellipse cx='20' cy='25' rx='10' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='75' cy='20' rx='12' ry='3.5' fill='#ffffff' opacity='0.85'/>
  <path d='M0 60 Q 30 55 50 60 T 100 58 L 100 85 L 0 85 Z' fill='url(#g)'/>
  <rect y='85' width='100' height='15' fill='#5fa84a'/>
  <path d='M50 60 L 42 85 L 58 85 L 52 60 Z' fill='#c8b8a0'/>
  <path d='M50 85 L 48 100 L 52 100 L 50 85 Z' fill='#c8b8a0'/>
  <g fill='#1e4a2e'>
    <polygon points='18,68 12,80 24,80'/>
    <polygon points='18,60 10,75 26,75'/>
  </g>
  <g fill='#2d5a3d'>
    <polygon points='78,66 72,78 84,78'/>
    <polygon points='78,58 70,73 86,73'/>
  </g>
  <rect x='15' y='80' width='6' height='8' fill='#6a4a2a'/>
  <rect x='75' y='78' width='6' height='10' fill='#6a4a2a'/>
  <g fill='#ffe858'>
    <circle cx='49' cy='70' r='0.3'/>
    <circle cx='51' cy='75' r='0.3'/>
    <circle cx='49' cy='80' r='0.3'/>
  </g>
</svg>`;

const SVG_PICNIC_LAWN = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#88c6e8'/><stop offset='1' stop-color='#cae6f2'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8cc86a'/><stop offset='1' stop-color='#5a9a3a'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='82' cy='20' r='7' fill='#fff3a8'/>
  <circle cx='82' cy='20' r='10' fill='#fff3a8' opacity='0.35'/>
  <ellipse cx='22' cy='26' rx='11' ry='3' fill='#ffffff' opacity='0.85'/>
  <rect y='55' width='100' height='45' fill='url(#g)'/>
  <rect x='25' y='72' width='50' height='20' fill='#ff6b6b' transform='rotate(-3 50 82)'/>
  <g stroke='#ffffff' stroke-width='0.5' transform='rotate(-3 50 82)'>
    <line x1='25' y1='77' x2='75' y2='77'/>
    <line x1='25' y1='82' x2='75' y2='82'/>
    <line x1='25' y1='87' x2='75' y2='87'/>
    <line x1='33' y1='72' x2='33' y2='92'/>
    <line x1='42' y1='72' x2='42' y2='92'/>
    <line x1='50' y1='72' x2='50' y2='92'/>
    <line x1='58' y1='72' x2='58' y2='92'/>
    <line x1='67' y1='72' x2='67' y2='92'/>
  </g>
  <ellipse cx='42' cy='80' rx='5' ry='4' fill='#c89a5a'/>
  <rect x='40' y='74' width='4' height='6' fill='#8a5a2a'/>
  <circle cx='58' cy='82' r='3' fill='#e8c878'/>
  <circle cx='65' cy='84' r='2' fill='#ff8a5a'/>
  <g fill='#ffffff'>
    <circle cx='12' cy='88' r='1'/>
    <circle cx='85' cy='92' r='1'/>
    <circle cx='18' cy='95' r='1'/>
  </g>
</svg>`;

const SVG_VINEYARD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#d88a5e'/><stop offset='0.6' stop-color='#f4c878'/><stop offset='1' stop-color='#fce8b0'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7a9a3e'/><stop offset='1' stop-color='#4a6820'/></linearGradient>
  </defs>
  <rect width='100' height='50' fill='url(#s)'/>
  <circle cx='78' cy='22' r='8' fill='#ffe088'/>
  <circle cx='78' cy='22' r='12' fill='#ffe088' opacity='0.3'/>
  <polygon points='0,48 15,38 30,45 50,32 70,42 85,36 100,44 100,55 0,55' fill='#6a8a3e'/>
  <rect y='55' width='100' height='45' fill='url(#g)'/>
  <g stroke='#3a4810' stroke-width='0.6'>
    <line x1='0' y1='62' x2='100' y2='62'/>
    <line x1='0' y1='70' x2='100' y2='70'/>
    <line x1='0' y1='78' x2='100' y2='78'/>
    <line x1='0' y1='86' x2='100' y2='86'/>
    <line x1='0' y1='94' x2='100' y2='94'/>
  </g>
  <g fill='#6a2a6a' opacity='0.85'>
    <circle cx='10' cy='62' r='1.6'/>
    <circle cx='25' cy='62' r='1.6'/>
    <circle cx='40' cy='62' r='1.6'/>
    <circle cx='55' cy='62' r='1.6'/>
    <circle cx='70' cy='62' r='1.6'/>
    <circle cx='85' cy='62' r='1.6'/>
    <circle cx='15' cy='70' r='1.8'/>
    <circle cx='35' cy='70' r='1.8'/>
    <circle cx='55' cy='70' r='1.8'/>
    <circle cx='75' cy='70' r='1.8'/>
    <circle cx='95' cy='70' r='1.8'/>
    <circle cx='10' cy='78' r='2'/>
    <circle cx='30' cy='78' r='2'/>
    <circle cx='50' cy='78' r='2'/>
    <circle cx='70' cy='78' r='2'/>
    <circle cx='90' cy='78' r='2'/>
    <circle cx='20' cy='86' r='2.2'/>
    <circle cx='45' cy='86' r='2.2'/>
    <circle cx='65' cy='86' r='2.2'/>
    <circle cx='85' cy='86' r='2.2'/>
    <circle cx='10' cy='94' r='2.4'/>
    <circle cx='35' cy='94' r='2.4'/>
    <circle cx='60' cy='94' r='2.4'/>
    <circle cx='80' cy='94' r='2.4'/>
  </g>
</svg>`;

const SVG_APPLE_ORCHARD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9cc8e8'/><stop offset='1' stop-color='#ddeaf3'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8ac864'/><stop offset='1' stop-color='#5c9a38'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <ellipse cx='25' cy='22' rx='11' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='78' cy='28' rx='9' ry='2.5' fill='#ffffff' opacity='0.82'/>
  <rect y='55' width='100' height='45' fill='url(#g)'/>
  <g>
    <rect x='18' y='60' width='3' height='20' fill='#5a3a1e'/>
    <circle cx='19.5' cy='55' r='12' fill='#5a9a3a'/>
    <circle cx='14' cy='56' r='8' fill='#6aaa4a'/>
    <circle cx='25' cy='56' r='8' fill='#6aaa4a'/>
    <circle cx='50' cy='62' r='3'/>
    <circle cx='50' cy='62' r='3' fill='none'/>
  </g>
  <g>
    <rect x='48' y='62' width='3' height='18' fill='#5a3a1e'/>
    <circle cx='49.5' cy='58' r='11' fill='#5a9a3a'/>
    <circle cx='44' cy='59' r='7' fill='#6aaa4a'/>
    <circle cx='55' cy='59' r='7' fill='#6aaa4a'/>
  </g>
  <g>
    <rect x='78' y='63' width='3' height='18' fill='#5a3a1e'/>
    <circle cx='79.5' cy='58' r='11' fill='#5a9a3a'/>
    <circle cx='74' cy='59' r='7' fill='#6aaa4a'/>
    <circle cx='85' cy='59' r='7' fill='#6aaa4a'/>
  </g>
  <g fill='#e8302a'>
    <circle cx='14' cy='52' r='1.5'/>
    <circle cx='20' cy='48' r='1.5'/>
    <circle cx='24' cy='54' r='1.5'/>
    <circle cx='16' cy='58' r='1.5'/>
    <circle cx='44' cy='55' r='1.5'/>
    <circle cx='50' cy='52' r='1.5'/>
    <circle cx='55' cy='58' r='1.5'/>
    <circle cx='75' cy='55' r='1.5'/>
    <circle cx='82' cy='52' r='1.5'/>
    <circle cx='85' cy='58' r='1.5'/>
    <circle cx='78' cy='60' r='1.5'/>
  </g>
  <circle cx='14' cy='85' r='1.5' fill='#e8302a'/>
  <circle cx='22' cy='92' r='1.5' fill='#e8302a'/>
  <circle cx='48' cy='88' r='1.5' fill='#e8302a'/>
  <circle cx='78' cy='90' r='1.5' fill='#e8302a'/>
</svg>`;

const SVG_WINDMILL = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#88c6e8'/><stop offset='1' stop-color='#d0e4f0'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a8d26a'/><stop offset='1' stop-color='#6a9a3a'/></linearGradient>
  </defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <ellipse cx='15' cy='20' rx='12' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='85' cy='28' rx='10' ry='3' fill='#ffffff' opacity='0.82'/>
  <path d='M0 60 Q 50 55 100 60 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <polygon points='42,80 50,35 58,80' fill='#e8d8b0'/>
  <rect x='46' y='60' width='8' height='5' fill='#4a2f1a'/>
  <rect x='47' y='68' width='6' height='6' fill='#4a2f1a'/>
  <circle cx='50' cy='35' r='2.5' fill='#6a4a2a'/>
  <g stroke='#ffffff' stroke-width='3' transform='rotate(15 50 35)'>
    <line x1='50' y1='35' x2='50' y2='12'/>
    <line x1='50' y1='35' x2='73' y2='35'/>
    <line x1='50' y1='35' x2='50' y2='58'/>
    <line x1='50' y1='35' x2='27' y2='35'/>
  </g>
  <g stroke='#f0d8a0' stroke-width='4' transform='rotate(15 50 35)'>
    <line x1='50' y1='15' x2='50' y2='12'/>
    <line x1='70' y1='35' x2='73' y2='35'/>
    <line x1='50' y1='55' x2='50' y2='58'/>
    <line x1='30' y1='35' x2='27' y2='35'/>
  </g>
  <g stroke='#3a4810' stroke-width='0.4' opacity='0.5'>
    <line x1='0' y1='72' x2='100' y2='72'/>
    <line x1='0' y1='82' x2='100' y2='82'/>
    <line x1='0' y1='92' x2='100' y2='92'/>
  </g>
</svg>`;

const SVG_OLD_BRIDGE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#d8a078'/><stop offset='0.6' stop-color='#f4d0a0'/><stop offset='1' stop-color='#fbe8c8'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6a8ea8'/><stop offset='1' stop-color='#3a5a78'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='78' cy='25' r='7' fill='#ffdc80'/>
  <circle cx='78' cy='25' r='11' fill='#ffdc80' opacity='0.3'/>
  <g fill='#3a4a5e'>
    <polygon points='0,48 15,35 25,42 40,30 50,38 60,30 75,40 90,32 100,42 100,55 0,55'/>
  </g>
  <rect y='55' width='100' height='45' fill='url(#w)'/>
  <rect y='55' width='100' height='0.6' fill='#ffffff' opacity='0.4'/>
  <rect y='62' width='100' height='0.5' fill='#ffffff' opacity='0.3'/>
  <path d='M10 55 Q 25 48 40 55 Z' fill='#8a6238'/>
  <path d='M40 55 Q 55 47 70 55 Z' fill='#8a6238'/>
  <rect x='9' y='52' width='2' height='20' fill='#4a2a10'/>
  <rect x='39' y='52' width='2' height='22' fill='#4a2a10'/>
  <rect x='69' y='52' width='2' height='20' fill='#4a2a10'/>
  <rect x='5' y='48' width='70' height='4' fill='#6a3e1a'/>
  <g stroke='#8a5a2a' stroke-width='0.4'>
    <line x1='12' y1='48' x2='12' y2='44'/>
    <line x1='20' y1='48' x2='20' y2='44'/>
    <line x1='28' y1='48' x2='28' y2='44'/>
    <line x1='36' y1='48' x2='36' y2='44'/>
    <line x1='44' y1='48' x2='44' y2='44'/>
    <line x1='52' y1='48' x2='52' y2='44'/>
    <line x1='60' y1='48' x2='60' y2='44'/>
    <line x1='68' y1='48' x2='68' y2='44'/>
  </g>
  <path d='M10 68 Q 25 66 40 68 T 70 68' stroke='#ffffff' stroke-width='0.5' fill='none' opacity='0.4'/>
  <path d='M10 76 Q 30 74 50 76 T 90 76' stroke='#ffffff' stroke-width='0.5' fill='none' opacity='0.35'/>
</svg>`;

const SVG_HOT_AIR_BALLOON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffb478'/><stop offset='0.5' stop-color='#ffd6a5'/><stop offset='1' stop-color='#d8e8d0'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7aa84a'/><stop offset='1' stop-color='#4a7a24'/></linearGradient>
  </defs>
  <rect width='100' height='75' fill='url(#s)'/>
  <circle cx='82' cy='18' r='8' fill='#fff3a8'/>
  <circle cx='82' cy='18' r='12' fill='#fff3a8' opacity='0.32'/>
  <ellipse cx='15' cy='30' rx='10' ry='2.5' fill='#ffffff' opacity='0.82'/>
  <ellipse cx='60' cy='38' rx='12' ry='3' fill='#ffffff' opacity='0.82'/>
  <ellipse cx='35' cy='40' rx='14' ry='20' fill='#e84a5a'/>
  <path d='M21 40 Q 35 20 49 40' fill='none' stroke='#c42030' stroke-width='0.8'/>
  <path d='M21 40 Q 35 60 49 40' fill='none' stroke='#c42030' stroke-width='0.8'/>
  <path d='M28 22 Q 35 25 42 22' stroke='#ffe858' stroke-width='3' fill='none'/>
  <path d='M26 30 Q 35 32 44 30' stroke='#ffe858' stroke-width='3' fill='none'/>
  <path d='M28 58 Q 35 56 42 58' stroke='#ffe858' stroke-width='3' fill='none'/>
  <line x1='29' y1='58' x2='32' y2='68' stroke='#6a3a1a' stroke-width='0.6'/>
  <line x1='41' y1='58' x2='38' y2='68' stroke='#6a3a1a' stroke-width='0.6'/>
  <rect x='31' y='68' width='8' height='5' fill='#6a3a1a'/>
  <rect y='75' width='100' height='25' fill='url(#g)'/>
  <g stroke='#3a5010' stroke-width='0.4' opacity='0.5'>
    <line x1='0' y1='85' x2='100' y2='85'/>
    <line x1='0' y1='93' x2='100' y2='93'/>
  </g>
</svg>`;

const SVG_LIGHTHOUSE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#1a2a52'/>
      <stop offset='0.6' stop-color='#6a4878'/>
      <stop offset='1' stop-color='#d47060'/>
    </linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a4a6a'/><stop offset='1' stop-color='#0a1e36'/></linearGradient>
  </defs>
  <rect width='100' height='65' fill='url(#s)'/>
  <g fill='#ffffff'>
    <circle cx='12' cy='15' r='0.5'/>
    <circle cx='25' cy='8' r='0.4'/>
    <circle cx='38' cy='14' r='0.5'/>
    <circle cx='52' cy='10' r='0.4'/>
  </g>
  <circle cx='25' cy='18' r='5' fill='#f0ecc0' opacity='0.9'/>
  <polygon points='0,62 15,50 30,58 45,48 60,56 75,46 90,54 100,50 100,72 0,72' fill='#1a2a3e'/>
  <rect x='70' y='32' width='8' height='38' fill='#ffffff'/>
  <rect x='70' y='38' width='8' height='4' fill='#e84a2a'/>
  <rect x='70' y='50' width='8' height='4' fill='#e84a2a'/>
  <rect x='70' y='62' width='8' height='4' fill='#e84a2a'/>
  <rect x='68' y='28' width='12' height='5' fill='#3a2a1e'/>
  <rect x='70' y='22' width='8' height='6' fill='#f0ecc0'/>
  <polygon points='68,22 80,22 74,15' fill='#3a2a1e'/>
  <circle cx='74' cy='25' r='2' fill='#fff5a0'/>
  <path d='M74 25 L 30 8 L 30 42 Z' fill='#fff5a0' opacity='0.3'/>
  <rect y='72' width='100' height='28' fill='url(#w)'/>
  <path d='M0 76 Q 15 74 30 76 T 60 76 T 100 76 L 100 80 L 0 80 Z' fill='#ffffff' opacity='0.2'/>
  <path d='M0 86 Q 25 84 50 86 T 100 86 L 100 90 L 0 90 Z' fill='#ffffff' opacity='0.18'/>
</svg>`;

const SVG_FIREFLY_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='g' cx='0.5' cy='0.6' r='0.7'>
      <stop offset='0' stop-color='#4a6a3e'/>
      <stop offset='0.5' stop-color='#1a3020'/>
      <stop offset='1' stop-color='#050f0a'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='url(#g)'/>
  <g fill='#050f0a'>
    <rect x='5' y='30' width='3' height='70'/>
    <rect x='18' y='20' width='3' height='80'/>
    <rect x='30' y='25' width='3' height='75'/>
    <rect x='42' y='35' width='3' height='65'/>
    <rect x='55' y='18' width='3' height='82'/>
    <rect x='68' y='28' width='3' height='72'/>
    <rect x='80' y='22' width='3' height='78'/>
    <rect x='92' y='30' width='3' height='70'/>
  </g>
  <g fill='#0a1810'>
    <circle cx='6.5' cy='28' r='5'/>
    <circle cx='19.5' cy='18' r='6'/>
    <circle cx='31.5' cy='23' r='5'/>
    <circle cx='43.5' cy='33' r='5'/>
    <circle cx='56.5' cy='16' r='6'/>
    <circle cx='69.5' cy='26' r='5'/>
    <circle cx='81.5' cy='20' r='6'/>
    <circle cx='93.5' cy='28' r='5'/>
  </g>
  <g fill='#e8ffa0'>
    <circle cx='25' cy='55' r='0.8'/>
    <circle cx='40' cy='62' r='0.9'/>
    <circle cx='55' cy='50' r='0.8'/>
    <circle cx='70' cy='58' r='0.9'/>
    <circle cx='20' cy='70' r='0.8'/>
    <circle cx='48' cy='75' r='0.9'/>
    <circle cx='75' cy='72' r='0.8'/>
    <circle cx='35' cy='80' r='0.8'/>
    <circle cx='62' cy='82' r='0.9'/>
    <circle cx='88' cy='66' r='0.8'/>
  </g>
  <g fill='#e8ffa0' opacity='0.35'>
    <circle cx='25' cy='55' r='2.5'/>
    <circle cx='40' cy='62' r='2.8'/>
    <circle cx='55' cy='50' r='2.5'/>
    <circle cx='70' cy='58' r='2.8'/>
    <circle cx='20' cy='70' r='2.5'/>
    <circle cx='48' cy='75' r='2.8'/>
    <circle cx='75' cy='72' r='2.5'/>
    <circle cx='35' cy='80' r='2.5'/>
    <circle cx='62' cy='82' r='2.8'/>
    <circle cx='88' cy='66' r='2.5'/>
  </g>
</svg>`;

const SVG_REDWOOD_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#e8c878'/>
      <stop offset='0.5' stop-color='#a8783a'/>
      <stop offset='1' stop-color='#4a2a0a'/>
    </linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <polygon points='15,0 10,100 20,100 18,0' fill='#3a1a08'/>
  <polygon points='32,0 28,100 38,100 35,0' fill='#2a1205'/>
  <polygon points='52,0 48,100 58,100 55,0' fill='#3a1a08'/>
  <polygon points='72,0 68,100 78,100 75,0' fill='#2a1205'/>
  <polygon points='90,0 86,100 96,100 93,0' fill='#3a1a08'/>
  <g fill='#ffe088' opacity='0.25'>
    <polygon points='10,0 5,100 15,100'/>
    <polygon points='42,0 40,100 50,100'/>
    <polygon points='80,0 78,100 88,100'/>
  </g>
  <g fill='#c8a060' opacity='0.4'>
    <rect x='11' y='0' width='1' height='100'/>
    <rect x='16' y='0' width='1' height='100'/>
    <rect x='30' y='0' width='1' height='100'/>
    <rect x='36' y='0' width='1' height='100'/>
    <rect x='50' y='0' width='1' height='100'/>
    <rect x='56' y='0' width='1' height='100'/>
    <rect x='70' y='0' width='1' height='100'/>
    <rect x='76' y='0' width='1' height='100'/>
    <rect x='88' y='0' width='1' height='100'/>
    <rect x='94' y='0' width='1' height='100'/>
  </g>
  <g fill='#1a3a0a' opacity='0.55'>
    <ellipse cx='25' cy='85' rx='4' ry='1'/>
    <ellipse cx='45' cy='92' rx='3' ry='0.8'/>
    <ellipse cx='65' cy='88' rx='4' ry='1'/>
    <ellipse cx='82' cy='93' rx='3' ry='0.8'/>
  </g>
</svg>`;

const SVG_TEMPLE_RUINS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffb478'/><stop offset='0.6' stop-color='#ffd8a8'/><stop offset='1' stop-color='#ffe8c8'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a6a3a'/><stop offset='1' stop-color='#1a4828'/></linearGradient>
  </defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <circle cx='75' cy='22' r='9' fill='#ffe088'/>
  <circle cx='75' cy='22' r='13' fill='#ffe088' opacity='0.3'/>
  <path d='M0 60 Q 50 55 100 60 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <rect x='10' y='38' width='5' height='35' fill='#d8c8a8'/>
  <rect x='28' y='34' width='5' height='40' fill='#d8c8a8'/>
  <rect x='58' y='36' width='5' height='38' fill='#d8c8a8'/>
  <rect x='75' y='32' width='5' height='42' fill='#d8c8a8'/>
  <rect x='8' y='35' width='9' height='4' fill='#c8b898'/>
  <rect x='26' y='31' width='9' height='4' fill='#c8b898'/>
  <rect x='56' y='33' width='9' height='4' fill='#c8b898'/>
  <rect x='73' y='29' width='9' height='4' fill='#c8b898'/>
  <rect x='5' y='72' width='88' height='5' fill='#b8a888'/>
  <rect x='8' y='35' width='75' height='3' fill='#c8b898' opacity='0.55'/>
  <g fill='#4a8a3a'>
    <ellipse cx='12' cy='45' rx='2' ry='1'/>
    <ellipse cx='30' cy='50' rx='2.5' ry='1.2'/>
    <ellipse cx='60' cy='48' rx='2' ry='1'/>
    <ellipse cx='77' cy='52' rx='2.5' ry='1.2'/>
    <ellipse cx='45' cy='72' rx='3' ry='1'/>
  </g>
  <g fill='#8a5a2a' opacity='0.6'>
    <rect x='40' y='73' width='12' height='4'/>
    <rect x='65' y='74' width='8' height='3'/>
    <rect x='15' y='75' width='10' height='2'/>
  </g>
</svg>`;

const SVG_HOT_SPRINGS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a3a6e'/><stop offset='1' stop-color='#6a8ab0'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#80c8d8'/><stop offset='1' stop-color='#3c8aa0'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#ffffff'>
    <circle cx='15' cy='10' r='0.5'/>
    <circle cx='35' cy='8' r='0.4'/>
    <circle cx='60' cy='12' r='0.5'/>
    <circle cx='85' cy='9' r='0.4'/>
  </g>
  <polygon points='0,55 20,38 40,48 60,35 80,45 100,38 100,62 0,62' fill='#e0ecf5'/>
  <polygon points='0,62 15,50 30,58 50,48 70,58 85,52 100,58 100,72 0,72' fill='#ffffff'/>
  <ellipse cx='25' cy='82' rx='16' ry='6' fill='#1a3a4e'/>
  <ellipse cx='25' cy='80' rx='14' ry='5' fill='url(#w)'/>
  <ellipse cx='70' cy='88' rx='22' ry='7' fill='#1a3a4e'/>
  <ellipse cx='70' cy='86' rx='20' ry='6' fill='url(#w)'/>
  <ellipse cx='20' cy='78' rx='8' ry='1' fill='#ffffff' opacity='0.5'/>
  <ellipse cx='65' cy='84' rx='12' ry='1' fill='#ffffff' opacity='0.5'/>
  <g fill='#ffffff' opacity='0.5'>
    <ellipse cx='22' cy='70' rx='6' ry='2'/>
    <ellipse cx='28' cy='65' rx='5' ry='1.8'/>
    <ellipse cx='18' cy='58' rx='4' ry='1.5'/>
    <ellipse cx='65' cy='76' rx='7' ry='2'/>
    <ellipse cx='72' cy='70' rx='5' ry='1.8'/>
    <ellipse cx='78' cy='62' rx='4' ry='1.5'/>
  </g>
  <g fill='#2a1a0a'>
    <rect x='0' y='76' width='8' height='6'/>
    <rect x='45' y='82' width='6' height='5'/>
    <rect x='93' y='80' width='7' height='8'/>
  </g>
</svg>`;

const SVG_GLACIAL_BAY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c8d8e8'/><stop offset='0.7' stop-color='#ffd4a8'/><stop offset='1' stop-color='#ffe8c8'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a7a98'/><stop offset='1' stop-color='#1e4258'/></linearGradient>
    <linearGradient id='ice' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e8f4fa'/><stop offset='1' stop-color='#7aa8c8'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#s)'/>
  <circle cx='70' cy='32' r='6' fill='#fff5a8' opacity='0.85'/>
  <polygon points='0,55 15,38 30,48 45,30 60,44 75,28 90,40 100,32 100,65 0,65' fill='#6a8ab0'/>
  <polygon points='12,42 15,38 18,42 16,45' fill='#ffffff'/>
  <polygon points='42,34 45,30 48,34 47,38' fill='#ffffff'/>
  <polygon points='72,32 75,28 78,32 77,36' fill='#ffffff'/>
  <rect y='65' width='100' height='35' fill='url(#w)'/>
  <polygon points='15,82 10,68 20,62 26,72 22,82' fill='url(#ice)'/>
  <polygon points='22,82 20,72 27,68 30,82' fill='#c8dfed'/>
  <polygon points='55,85 48,70 58,65 66,76 62,85' fill='url(#ice)'/>
  <polygon points='62,85 60,74 68,70 72,85' fill='#c8dfed'/>
  <polygon points='85,90 80,78 87,74 92,84 90,90' fill='url(#ice)'/>
  <path d='M0 72 Q 50 68 100 72 L 100 74 L 0 74 Z' fill='#ffffff' opacity='0.3'/>
  <path d='M0 90 Q 50 88 100 90 L 100 92 L 0 92 Z' fill='#ffffff' opacity='0.2'/>
</svg>`;

const SVG_BALLOON_FIESTA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#3a2858'/>
      <stop offset='0.5' stop-color='#ff7048'/>
      <stop offset='1' stop-color='#ffd078'/>
    </linearGradient>
  </defs>
  <rect width='100' height='80' fill='url(#s)'/>
  <circle cx='80' cy='28' r='5' fill='#ffe8a0'/>
  <circle cx='80' cy='28' r='8' fill='#ffe8a0' opacity='0.3'/>
  <g>
    <ellipse cx='18' cy='28' rx='8' ry='11' fill='#e8302a'/>
    <path d='M10 28 Q 18 14 26 28' stroke='#ffe858' stroke-width='0.8' fill='none'/>
    <path d='M10 28 Q 18 42 26 28' stroke='#ffe858' stroke-width='0.8' fill='none'/>
    <rect x='16' y='40' width='4' height='2' fill='#3a1a0a'/>
    <line x1='14' y1='39' x2='17' y2='42' stroke='#3a1a0a' stroke-width='0.3'/>
    <line x1='22' y1='39' x2='19' y2='42' stroke='#3a1a0a' stroke-width='0.3'/>
  </g>
  <g>
    <ellipse cx='42' cy='48' rx='9' ry='12' fill='#3a7ec8'/>
    <path d='M33 48 Q 42 32 51 48' stroke='#e8f4ff' stroke-width='0.8' fill='none'/>
    <path d='M33 48 Q 42 64 51 48' stroke='#e8f4ff' stroke-width='0.8' fill='none'/>
    <rect x='40' y='62' width='4' height='2.5' fill='#3a1a0a'/>
  </g>
  <g>
    <ellipse cx='68' cy='40' rx='7' ry='10' fill='#5aaa3a'/>
    <path d='M61 40 Q 68 28 75 40' stroke='#e8fca8' stroke-width='0.7' fill='none'/>
    <path d='M61 40 Q 68 52 75 40' stroke='#e8fca8' stroke-width='0.7' fill='none'/>
    <rect x='66' y='51' width='4' height='2' fill='#3a1a0a'/>
  </g>
  <g>
    <ellipse cx='85' cy='58' rx='6' ry='8' fill='#c848a0'/>
    <rect x='83' y='67' width='4' height='2' fill='#3a1a0a'/>
  </g>
  <g>
    <ellipse cx='8' cy='55' rx='5' ry='7' fill='#ffc038'/>
    <rect x='6' y='63' width='4' height='2' fill='#3a1a0a'/>
  </g>
  <rect y='80' width='100' height='20' fill='#8a5a1e'/>
  <path d='M0 83 Q 25 80 50 83 T 100 82 L 100 85 L 0 85 Z' fill='#a8722a'/>
</svg>`;

const SVG_CHINESE_MOUNTAINS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c8d4de'/><stop offset='1' stop-color='#eaf0f4'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <path d='M8 100 L 8 35 L 4 32 L 10 30 L 8 20 L 14 28 L 12 35 L 16 100 Z' fill='#3a4e5e'/>
  <path d='M24 100 L 24 50 L 20 48 L 28 40 L 26 30 L 30 42 L 32 100 Z' fill='#2a3e4e'/>
  <path d='M42 100 L 42 25 L 38 20 L 46 15 L 44 5 L 50 18 L 48 25 L 52 100 Z' fill='#3a4e5e'/>
  <path d='M60 100 L 60 45 L 56 42 L 64 35 L 68 100 Z' fill='#1e3040'/>
  <path d='M76 100 L 76 30 L 72 26 L 80 22 L 78 10 L 84 24 L 82 30 L 88 100 Z' fill='#2a3e4e'/>
  <path d='M92 100 L 92 55 L 88 52 L 96 48 L 100 100 Z' fill='#1e3040'/>
  <g stroke='#3a5a3a' stroke-width='0.4'>
    <path d='M8 18 Q 10 14 12 16'/>
    <path d='M44 5 Q 46 1 48 3'/>
    <path d='M78 10 Q 80 6 82 8'/>
    <path d='M26 28 Q 28 25 30 27'/>
  </g>
  <g fill='#4a7a3a' opacity='0.7'>
    <circle cx='10' cy='15' r='1'/>
    <circle cx='46' cy='4' r='1.2'/>
    <circle cx='80' cy='8' r='1'/>
  </g>
  <ellipse cx='22' cy='60' rx='35' ry='3' fill='#ffffff' opacity='0.7'/>
  <ellipse cx='65' cy='55' rx='40' ry='3' fill='#ffffff' opacity='0.65'/>
  <ellipse cx='40' cy='72' rx='45' ry='3' fill='#ffffff' opacity='0.6'/>
  <ellipse cx='75' cy='82' rx='40' ry='3' fill='#ffffff' opacity='0.55'/>
  <ellipse cx='25' cy='90' rx='50' ry='3' fill='#ffffff' opacity='0.5'/>
</svg>`;

const SVG_SUPERNOVA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='s' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0' stop-color='#ffffff'/>
      <stop offset='0.08' stop-color='#fff5c8'/>
      <stop offset='0.18' stop-color='#ffd878'/>
      <stop offset='0.3' stop-color='#ff7838'/>
      <stop offset='0.5' stop-color='#c43078'/>
      <stop offset='0.75' stop-color='#3a1862'/>
      <stop offset='1' stop-color='#080218'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='#080218'/>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#ffffff'>
    <circle cx='10' cy='10' r='0.5'/>
    <circle cx='90' cy='12' r='0.6'/>
    <circle cx='8' cy='88' r='0.5'/>
    <circle cx='92' cy='90' r='0.6'/>
    <circle cx='20' cy='25' r='0.4'/>
    <circle cx='78' cy='28' r='0.4'/>
    <circle cx='22' cy='75' r='0.4'/>
    <circle cx='80' cy='78' r='0.4'/>
  </g>
  <g stroke='#fff5c8' stroke-width='0.6' opacity='0.7'>
    <line x1='50' y1='10' x2='50' y2='28'/>
    <line x1='50' y1='72' x2='50' y2='90'/>
    <line x1='10' y1='50' x2='28' y2='50'/>
    <line x1='72' y1='50' x2='90' y2='50'/>
    <line x1='22' y1='22' x2='34' y2='34'/>
    <line x1='78' y1='22' x2='66' y2='34'/>
    <line x1='22' y1='78' x2='34' y2='66'/>
    <line x1='78' y1='78' x2='66' y2='66'/>
  </g>
  <circle cx='50' cy='50' r='6' fill='#ffffff'/>
</svg>`;

const SVG_DEEP_SEA_ABYSS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='g' cx='0.5' cy='0.5' r='0.7'>
      <stop offset='0' stop-color='#082238'/>
      <stop offset='0.5' stop-color='#040e1e'/>
      <stop offset='1' stop-color='#000408'/>
    </radialGradient>
  </defs>
  <rect width='100' height='100' fill='url(#g)'/>
  <g fill='#64c8e0'>
    <circle cx='20' cy='30' r='1.2'/>
    <circle cx='35' cy='20' r='1'/>
    <circle cx='50' cy='28' r='1.2'/>
    <circle cx='65' cy='22' r='1'/>
    <circle cx='80' cy='32' r='1.2'/>
    <circle cx='15' cy='55' r='1'/>
    <circle cx='40' cy='50' r='1.2'/>
    <circle cx='62' cy='58' r='1'/>
    <circle cx='85' cy='52' r='1.2'/>
    <circle cx='25' cy='75' r='1'/>
    <circle cx='55' cy='78' r='1.2'/>
    <circle cx='78' cy='72' r='1'/>
  </g>
  <g fill='#64c8e0' opacity='0.4'>
    <circle cx='20' cy='30' r='3'/>
    <circle cx='35' cy='20' r='2.5'/>
    <circle cx='50' cy='28' r='3'/>
    <circle cx='65' cy='22' r='2.5'/>
    <circle cx='80' cy='32' r='3'/>
    <circle cx='15' cy='55' r='2.5'/>
    <circle cx='40' cy='50' r='3'/>
    <circle cx='62' cy='58' r='2.5'/>
    <circle cx='85' cy='52' r='3'/>
    <circle cx='25' cy='75' r='2.5'/>
    <circle cx='55' cy='78' r='3'/>
    <circle cx='78' cy='72' r='2.5'/>
  </g>
  <g>
    <circle cx='50' cy='60' r='6' fill='#000000'/>
    <circle cx='50' cy='55' r='2' fill='#fff5a0'/>
    <circle cx='50' cy='55' r='4' fill='#fff5a0' opacity='0.3'/>
    <path d='M50 66 Q 45 72 48 78 Q 42 80 46 72 Q 44 78 42 82' stroke='#000000' stroke-width='0.8' fill='none'/>
    <ellipse cx='48' cy='60' rx='2' ry='0.8' fill='#ffffff' opacity='0.7'/>
  </g>
  <g fill='#ffffff' opacity='0.4'>
    <circle cx='88' cy='88' r='0.4'/>
    <circle cx='12' cy='92' r='0.3'/>
    <circle cx='92' cy='12' r='0.4'/>
  </g>
</svg>`;

const SVG_RAINY_WINDOW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6a7e92'/><stop offset='1' stop-color='#a8b8c8'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#8a98a8' opacity='0.55'>
    <ellipse cx='20' cy='25' rx='15' ry='5'/>
    <ellipse cx='55' cy='18' rx='18' ry='5'/>
    <ellipse cx='85' cy='28' rx='14' ry='4'/>
    <ellipse cx='35' cy='40' rx='20' ry='5'/>
    <ellipse cx='75' cy='48' rx='18' ry='5'/>
  </g>
  <g stroke='#c8d8e8' stroke-width='0.6' opacity='0.85'>
    <line x1='10' y1='10' x2='8' y2='16'/>
    <line x1='18' y1='14' x2='16' y2='20'/>
    <line x1='28' y1='8' x2='26' y2='14'/>
    <line x1='38' y1='16' x2='36' y2='22'/>
    <line x1='48' y1='10' x2='46' y2='16'/>
    <line x1='58' y1='18' x2='56' y2='24'/>
    <line x1='68' y1='12' x2='66' y2='18'/>
    <line x1='78' y1='16' x2='76' y2='22'/>
    <line x1='88' y1='8' x2='86' y2='14'/>
    <line x1='14' y1='30' x2='12' y2='36'/>
    <line x1='24' y1='34' x2='22' y2='40'/>
    <line x1='34' y1='28' x2='32' y2='34'/>
    <line x1='44' y1='36' x2='42' y2='42'/>
    <line x1='54' y1='30' x2='52' y2='36'/>
    <line x1='64' y1='38' x2='62' y2='44'/>
    <line x1='74' y1='32' x2='72' y2='38'/>
    <line x1='84' y1='36' x2='82' y2='42'/>
    <line x1='94' y1='28' x2='92' y2='34'/>
    <line x1='8' y1='50' x2='6' y2='56'/>
    <line x1='18' y1='54' x2='16' y2='60'/>
    <line x1='28' y1='48' x2='26' y2='54'/>
    <line x1='38' y1='56' x2='36' y2='62'/>
    <line x1='48' y1='50' x2='46' y2='56'/>
    <line x1='58' y1='58' x2='56' y2='64'/>
    <line x1='68' y1='52' x2='66' y2='58'/>
    <line x1='78' y1='56' x2='76' y2='62'/>
    <line x1='88' y1='48' x2='86' y2='54'/>
    <line x1='14' y1='70' x2='12' y2='76'/>
    <line x1='34' y1='68' x2='32' y2='74'/>
    <line x1='54' y1='70' x2='52' y2='76'/>
    <line x1='74' y1='72' x2='72' y2='78'/>
    <line x1='94' y1='68' x2='92' y2='74'/>
    <line x1='24' y1='86' x2='22' y2='92'/>
    <line x1='44' y1='88' x2='42' y2='94'/>
    <line x1='64' y1='86' x2='62' y2='92'/>
    <line x1='84' y1='88' x2='82' y2='94'/>
  </g>
  <g fill='#c8d8e8' opacity='0.65'>
    <circle cx='30' cy='60' r='1.2'/>
    <circle cx='50' cy='45' r='1.5'/>
    <circle cx='70' cy='65' r='1.2'/>
    <circle cx='20' cy='80' r='1'/>
    <circle cx='80' cy='85' r='1.4'/>
  </g>
</svg>`;

export const PET_BACKGROUNDS: Record<string, PetBackgroundDefinition> = {
  // ── COMMON ────────────────────────────────────────────────
  clearSky: {
    id: 'clearSky',
    name: 'Klarer Himmel',
    description: 'Blauer Himmel mit Wolken',
    rarity: 'common',
    background: bgUrl(SVG_CLEAR_SKY),
    glowColor: 'rgba(111, 184, 224, 0.35)',
  },
  flowerMeadow: {
    id: 'flowerMeadow',
    name: 'Blumenwiese',
    description: 'Gruene Wiese voller Blueten',
    rarity: 'common',
    background: bgUrl(SVG_FLOWER_MEADOW),
    glowColor: 'rgba(124, 197, 118, 0.4)',
  },
  sunnyBeach: {
    id: 'sunnyBeach',
    name: 'Sonniger Strand',
    description: 'Meer, Sand und Sonnenschein',
    rarity: 'common',
    background: bgUrl(SVG_SUNNY_BEACH),
    glowColor: 'rgba(255, 220, 115, 0.45)',
  },
  rollingHills: {
    id: 'rollingHills',
    name: 'Sanfte Huegel',
    description: 'Weites Huegelland',
    rarity: 'common',
    background: bgUrl(SVG_ROLLING_HILLS),
    glowColor: 'rgba(168, 217, 104, 0.4)',
  },
  summerPark: {
    id: 'summerPark',
    name: 'Sommerpark',
    description: 'Grosser Baum im Stadtpark',
    rarity: 'common',
    background: bgUrl(SVG_SUMMER_PARK),
    glowColor: 'rgba(100, 180, 76, 0.4)',
  },
  riverside: {
    id: 'riverside',
    name: 'Flussufer',
    description: 'Sanfter Fluss zwischen Wiesen',
    rarity: 'common',
    background: bgUrl(SVG_RIVERSIDE),
    glowColor: 'rgba(106, 176, 206, 0.4)',
  },
  puffyClouds: {
    id: 'puffyClouds',
    name: 'Bauschige Wolken',
    description: 'Dicke Sommerwolken am Himmel',
    rarity: 'common',
    background: bgUrl(SVG_PUFFY_CLOUDS),
    glowColor: 'rgba(74, 168, 220, 0.4)',
  },
  springBlossoms: {
    id: 'springBlossoms',
    name: 'Fruehlingszweige',
    description: 'Bluehende Zweige am Himmel',
    rarity: 'common',
    background: bgUrl(SVG_SPRING_BLOSSOMS),
    glowColor: 'rgba(255, 196, 214, 0.4)',
  },
  bambooGrove: {
    id: 'bambooGrove',
    name: 'Bambushain',
    description: 'Dichter Bambuswald',
    rarity: 'common',
    background: bgUrl(SVG_BAMBOO_GROVE),
    glowColor: 'rgba(106, 154, 74, 0.4)',
  },
  dandelionField: {
    id: 'dandelionField',
    name: 'Loewenzahnwiese',
    description: 'Wiese voller Pusteblumen',
    rarity: 'common',
    background: bgUrl(SVG_DANDELION_FIELD),
    glowColor: 'rgba(255, 232, 88, 0.4)',
  },
  countryRoad: {
    id: 'countryRoad',
    name: 'Landstrasse',
    description: 'Geschlungene Strasse durchs Land',
    rarity: 'common',
    background: bgUrl(SVG_COUNTRY_ROAD),
    glowColor: 'rgba(144, 200, 232, 0.4)',
  },
  picnicLawn: {
    id: 'picnicLawn',
    name: 'Picknickwiese',
    description: 'Rote Decke auf gruener Wiese',
    rarity: 'common',
    background: bgUrl(SVG_PICNIC_LAWN),
    glowColor: 'rgba(255, 107, 107, 0.4)',
  },

  // ── UNCOMMON ──────────────────────────────────────────────
  autumnField: {
    id: 'autumnField',
    name: 'Herbstfeld',
    description: 'Goldenes Getreidefeld',
    rarity: 'uncommon',
    background: bgUrl(SVG_AUTUMN_FIELD),
    glowColor: 'rgba(232, 184, 74, 0.45)',
  },
  sunset: {
    id: 'sunset',
    name: 'Sonnenuntergang',
    description: 'Warmer Abendhimmel ueberm Meer',
    rarity: 'uncommon',
    background: bgUrl(SVG_SUNSET),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 180, 71, 0.55)',
  },
  mountainLake: {
    id: 'mountainLake',
    name: 'Bergsee',
    description: 'Stiller See vor Bergketten',
    rarity: 'uncommon',
    background: bgUrl(SVG_MOUNTAIN_LAKE),
    glowColor: 'rgba(148, 197, 232, 0.4)',
  },
  cherryTrees: {
    id: 'cherryTrees',
    name: 'Kirschbluete',
    description: 'Sakura-Baeume im Fruehling',
    rarity: 'uncommon',
    background: bgUrl(SVG_CHERRY_TREES),
    glowColor: 'rgba(255, 158, 196, 0.45)',
  },
  lavenderField: {
    id: 'lavenderField',
    name: 'Lavendelfeld',
    description: 'Endloses Lavendelfeld bei Sonnenuntergang',
    rarity: 'uncommon',
    background: bgUrl(SVG_LAVENDER_FIELD),
    glowColor: 'rgba(192, 136, 224, 0.5)',
  },
  lakeDock: {
    id: 'lakeDock',
    name: 'Holzsteg',
    description: 'Holzsteg am stillen Abendsee',
    rarity: 'uncommon',
    background: bgUrl(SVG_LAKE_DOCK),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 180, 120, 0.5)',
  },
  pumpkinPatch: {
    id: 'pumpkinPatch',
    name: 'Kuerbisfeld',
    description: 'Herbstliches Kuerbisfeld',
    rarity: 'uncommon',
    background: bgUrl(SVG_PUMPKIN_PATCH),
    glowColor: 'rgba(232, 118, 42, 0.5)',
  },
  morningMist: {
    id: 'morningMist',
    name: 'Morgennebel',
    description: 'Nebelige Daemmerung am Fluss',
    rarity: 'uncommon',
    background: bgUrl(SVG_MORNING_MIST),
    glowColor: 'rgba(255, 232, 168, 0.45)',
  },
  vineyard: {
    id: 'vineyard',
    name: 'Weinberg',
    description: 'Weinreben im Abendlicht',
    rarity: 'uncommon',
    background: bgUrl(SVG_VINEYARD),
    glowColor: 'rgba(255, 220, 128, 0.45)',
  },
  appleOrchard: {
    id: 'appleOrchard',
    name: 'Apfelgarten',
    description: 'Apfelbaeume voller Fruechte',
    rarity: 'uncommon',
    background: bgUrl(SVG_APPLE_ORCHARD),
    glowColor: 'rgba(232, 48, 42, 0.45)',
  },
  windmill: {
    id: 'windmill',
    name: 'Windmuehle',
    description: 'Alte Windmuehle auf gruenem Feld',
    rarity: 'uncommon',
    background: bgUrl(SVG_WINDMILL),
    glowColor: 'rgba(240, 216, 160, 0.45)',
  },
  oldBridge: {
    id: 'oldBridge',
    name: 'Alte Holzbruecke',
    description: 'Bogenbruecke im Abendlicht',
    rarity: 'uncommon',
    background: bgUrl(SVG_OLD_BRIDGE),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 208, 160, 0.45)',
  },
  hotAirBalloon: {
    id: 'hotAirBalloon',
    name: 'Heissluftballon',
    description: 'Ballonfahrt ueber gruene Felder',
    rarity: 'uncommon',
    background: bgUrl(SVG_HOT_AIR_BALLOON),
    glowColor: 'rgba(255, 180, 120, 0.5)',
  },

  // ── RARE ──────────────────────────────────────────────────
  desertDunes: {
    id: 'desertDunes',
    name: 'Wuestenduenen',
    description: 'Goldene Duenen im Abendlicht',
    rarity: 'rare',
    background: bgUrl(SVG_DESERT_DUNES),
    glowColor: 'rgba(249, 176, 97, 0.5)',
  },
  tropicalIsland: {
    id: 'tropicalIsland',
    name: 'Tropeninsel',
    description: 'Palme am tuerkisen Meer',
    rarity: 'rare',
    background: bgUrl(SVG_TROPICAL_ISLAND),
    glowColor: 'rgba(78, 200, 212, 0.5)',
  },
  foggyValley: {
    id: 'foggyValley',
    name: 'Nebeltal',
    description: 'Nebelige Bergketten',
    rarity: 'rare',
    background: bgUrl(SVG_FOGGY_VALLEY),
    glowColor: 'rgba(200, 212, 219, 0.5)',
  },
  cityNight: {
    id: 'cityNight',
    name: 'Stadt bei Nacht',
    description: 'Skyline unter Sternenhimmel',
    rarity: 'rare',
    background: bgUrl(SVG_CITY_NIGHT),
    glowColor: 'rgba(255, 216, 122, 0.45)',
  },
  pineForest: {
    id: 'pineForest',
    name: 'Kiefernwald',
    description: 'Verschneiter Tannenwald',
    rarity: 'rare',
    background: bgUrl(SVG_PINE_FOREST),
    glowColor: 'rgba(240, 244, 247, 0.4)',
  },
  snowyVillage: {
    id: 'snowyVillage',
    name: 'Schneedorf',
    description: 'Verschneite Haeuser mit warmen Lichtern',
    rarity: 'rare',
    background: bgUrl(SVG_SNOWY_VILLAGE),
    glowColor: 'rgba(255, 216, 122, 0.45)',
  },
  waterfall: {
    id: 'waterfall',
    name: 'Wasserfall',
    description: 'Rauschender Wasserfall im Wald',
    rarity: 'rare',
    background: bgUrl(SVG_WATERFALL),
    glowColor: 'rgba(188, 232, 245, 0.5)',
  },
  canyon: {
    id: 'canyon',
    name: 'Canyon',
    description: 'Roter Canyon im Abendlicht',
    rarity: 'rare',
    background: bgUrl(SVG_CANYON),
    glowColor: 'rgba(249, 165, 88, 0.5)',
  },
  goldenWheat: {
    id: 'goldenWheat',
    name: 'Goldenes Weizenfeld',
    description: 'Weizenfeld zur goldenen Stunde',
    rarity: 'rare',
    background: bgUrl(SVG_GOLDEN_WHEAT),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 196, 120, 0.55)',
  },
  zenGarden: {
    id: 'zenGarden',
    name: 'Zen-Garten',
    description: 'Japanischer Garten mit Sakura',
    rarity: 'rare',
    background: bgUrl(SVG_ZEN_GARDEN),
    glowColor: 'rgba(255, 158, 196, 0.45)',
  },
  lighthouseCliff: {
    id: 'lighthouseCliff',
    name: 'Leuchtturm',
    description: 'Leuchtturm auf steiler Klippe',
    rarity: 'rare',
    background: bgUrl(SVG_LIGHTHOUSE),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 245, 160, 0.55)',
  },
  fireflyForest: {
    id: 'fireflyForest',
    name: 'Gluehwuermchen-Wald',
    description: 'Wald voller tanzender Lichter',
    rarity: 'rare',
    background: bgUrl(SVG_FIREFLY_FOREST),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(232, 255, 160, 0.55)',
  },
  redwoodForest: {
    id: 'redwoodForest',
    name: 'Mammutbaeume',
    description: 'Riesige Redwoods im Goldlicht',
    rarity: 'rare',
    background: bgUrl(SVG_REDWOOD_FOREST),
    glowColor: 'rgba(232, 200, 120, 0.5)',
  },
  templeRuins: {
    id: 'templeRuins',
    name: 'Tempelruinen',
    description: 'Antike Saeulen im Dschungel',
    rarity: 'rare',
    background: bgUrl(SVG_TEMPLE_RUINS),
    glowColor: 'rgba(255, 224, 136, 0.5)',
  },
  hotSprings: {
    id: 'hotSprings',
    name: 'Heisse Quellen',
    description: 'Dampfende Onsen im Schnee',
    rarity: 'rare',
    background: bgUrl(SVG_HOT_SPRINGS),
    glowColor: 'rgba(128, 200, 216, 0.5)',
  },
  rainyWindow: {
    id: 'rainyWindow',
    name: 'Regen am Fenster',
    description: 'Regentropfen am Fensterglas',
    rarity: 'rare',
    background: bgUrl(SVG_RAINY_WINDOW),
    glowColor: 'rgba(200, 216, 232, 0.4)',
  },

  // ── EPIC ──────────────────────────────────────────────────
  alpineSnow: {
    id: 'alpineSnow',
    name: 'Alpengipfel',
    description: 'Schneebedeckte Berggipfel',
    rarity: 'epic',
    background: bgUrl(SVG_ALPINE_SNOW),
    glowColor: 'rgba(197, 216, 232, 0.55)',
  },
  lavaValley: {
    id: 'lavaValley',
    name: 'Vulkantal',
    description: 'Ausbrechender Vulkan ueber Lavafluss',
    rarity: 'epic',
    background: bgUrl(SVG_LAVA_VALLEY),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 106, 42, 0.6)',
  },
  mysticForest: {
    id: 'mysticForest',
    name: 'Mystischer Wald',
    description: 'Leuchtende Gluehwuermchen im Dunkel',
    rarity: 'epic',
    background: bgUrl(SVG_MYSTIC_FOREST),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(168, 255, 224, 0.55)',
  },
  underwaterReef: {
    id: 'underwaterReef',
    name: 'Korallenriff',
    description: 'Unterwasserwelt mit Lichtstrahlen',
    rarity: 'epic',
    background: bgUrl(SVG_UNDERWATER_REEF),
    glowColor: 'rgba(34, 168, 194, 0.55)',
  },
  northernLights: {
    id: 'northernLights',
    name: 'Polarlichter',
    description: 'Nordlichter ueber verschneiten Bergen',
    rarity: 'epic',
    background: bgUrl(SVG_NORTHERN_LIGHTS),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(100, 255, 200, 0.6)',
  },
  savannah: {
    id: 'savannah',
    name: 'Savanne',
    description: 'Akazie vor orangenem Horizont',
    rarity: 'epic',
    background: bgUrl(SVG_SAVANNAH),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 160, 64, 0.55)',
  },
  crystalCave: {
    id: 'crystalCave',
    name: 'Kristallhoehle',
    description: 'Leuchtende Kristalle im Untergrund',
    rarity: 'epic',
    background: bgUrl(SVG_CRYSTAL_CAVE),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(176, 136, 232, 0.6)',
  },
  stormSea: {
    id: 'stormSea',
    name: 'Sturmsee',
    description: 'Gewitter ueber aufgewuehltem Meer',
    rarity: 'epic',
    background: bgUrl(SVG_STORM_SEA),
    glowColor: 'rgba(255, 245, 160, 0.5)',
  },
  glacialBay: {
    id: 'glacialBay',
    name: 'Gletscherbucht',
    description: 'Eisberge treiben in stiller Bucht',
    rarity: 'epic',
    background: bgUrl(SVG_GLACIAL_BAY),
    glowColor: 'rgba(232, 244, 250, 0.55)',
  },
  balloonFiesta: {
    id: 'balloonFiesta',
    name: 'Ballon-Festival',
    description: 'Heissluftballone bei Sonnenaufgang',
    rarity: 'epic',
    background: bgUrl(SVG_BALLOON_FIESTA),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 120, 72, 0.55)',
  },
  chineseMountains: {
    id: 'chineseMountains',
    name: 'Nebelberge',
    description: 'Chinesische Berggipfel im Nebel',
    rarity: 'epic',
    background: bgUrl(SVG_CHINESE_MOUNTAINS),
    glowColor: 'rgba(200, 212, 222, 0.5)',
  },

  // ── LEGENDARY ─────────────────────────────────────────────
  cosmicSpace: {
    id: 'cosmicSpace',
    name: 'Kosmischer Nebel',
    description: 'Farbenpraechtiger Weltraumnebel',
    rarity: 'legendary',
    background: bgUrl(SVG_COSMIC_SPACE),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(196, 74, 122, 0.6)',
  },
  milkyWay: {
    id: 'milkyWay',
    name: 'Milchstrasse',
    description: 'Milchstrasse ueber dem Horizont',
    rarity: 'legendary',
    background: bgUrl(SVG_MILKY_WAY),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(140, 90, 175, 0.55)',
  },
  galaxyCore: {
    id: 'galaxyCore',
    name: 'Galaxienkern',
    description: 'Leuchtendes Zentrum einer Spiralgalaxie',
    rarity: 'legendary',
    background: bgUrl(SVG_GALAXY_CORE),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 224, 136, 0.6)',
  },
  saturnView: {
    id: 'saturnView',
    name: 'Saturn',
    description: 'Saturn mit seinen majestaetischen Ringen',
    rarity: 'legendary',
    background: bgUrl(SVG_SATURN_VIEW),
    glowColor: 'rgba(232, 176, 104, 0.6)',
  },
  earthFromMoon: {
    id: 'earthFromMoon',
    name: 'Erdaufgang',
    description: 'Erde ueber der Mondoberflaeche',
    rarity: 'legendary',
    background: bgUrl(SVG_EARTH_FROM_MOON),
    glowColor: 'rgba(106, 184, 232, 0.6)',
  },
  blackHoleDisk: {
    id: 'blackHoleDisk',
    name: 'Schwarzes Loch',
    description: 'Akkretionsscheibe um den Ereignishorizont',
    rarity: 'legendary',
    background: bgUrl(SVG_BLACK_HOLE_DISK),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 138, 42, 0.7)',
  },
  supernova: {
    id: 'supernova',
    name: 'Supernova',
    description: 'Explodierender Stern im All',
    rarity: 'legendary',
    background: bgUrl(SVG_SUPERNOVA),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 216, 120, 0.7)',
  },
  deepSeaAbyss: {
    id: 'deepSeaAbyss',
    name: 'Tiefsee-Abgrund',
    description: 'Anglerfisch im schwarzen Abgrund',
    rarity: 'legendary',
    background: bgUrl(SVG_DEEP_SEA_ABYSS),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(100, 200, 224, 0.6)',
  },
};

export const PET_BACKGROUND_IDS = Object.keys(PET_BACKGROUNDS);

export function getBackgroundRarity(id: string): AccessoryRarity {
  return PET_BACKGROUNDS[id]?.rarity ?? 'common';
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
