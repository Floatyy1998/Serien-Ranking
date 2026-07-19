import type { AccessoryDefinition, AccessoryRarity } from '../../../types/pet.types';
import { t } from '../../../services/i18n';

export const ACCESSORIES: Record<string, AccessoryDefinition> = {
  // ── HEAD SLOT ──────────────────────────────────────────
  // Common
  beanie: { slot: 'head', name: t('Muetze'), icon: '\uD83E\uDDE2', rarity: 'common' },
  baseballCap: { slot: 'head', name: t('Basecap'), icon: '\uD83E\uDDE2', rarity: 'common' },
  flowerCrown: { slot: 'head', name: t('Blumenkranz'), icon: '\uD83C\uDF38', rarity: 'common' },
  beret: { slot: 'head', name: t('Baskenmütze'), icon: '\uD83C\uDFA8', rarity: 'common' },
  headband: { slot: 'head', name: t('Stirnband'), icon: '\uD83C\uDFCB\uFE0F', rarity: 'common' },
  // Uncommon
  bandana: {
    slot: 'head',
    name: t('Bandana'),
    icon: '\uD83D\uDD3B',
    rarity: 'uncommon',
    color: '#FF0000',
  },
  partyHat: { slot: 'head', name: t('Partyhut'), icon: '\uD83C\uDF89', rarity: 'uncommon' },
  topHat: { slot: 'head', name: t('Zylinder'), icon: '\uD83C\uDFA9', rarity: 'uncommon' },
  cowboyHat: { slot: 'head', name: t('Cowboyhut'), icon: '\uD83E\uDD20', rarity: 'uncommon' },
  graduationCap: { slot: 'head', name: t('Doktorhut'), icon: '\uD83C\uDF93', rarity: 'uncommon' },
  strawHat: { slot: 'head', name: t('Strohhut'), icon: '\uD83C\uDF3E', rarity: 'uncommon' },
  // Rare
  santaHat: { slot: 'head', name: t('Weihnachtsmuetze'), icon: '\uD83C\uDF85', rarity: 'rare' },
  pirateHat: {
    slot: 'head',
    name: t('Piratenhut'),
    icon: '\uD83C\uDFF4\u200D\u2620\uFE0F',
    rarity: 'rare',
  },
  wizardHat: { slot: 'head', name: t('Zauberhut'), icon: '\uD83E\uDDD9', rarity: 'rare' },
  militaryHelmet: { slot: 'head', name: t('Militaerhelm'), icon: '\u26D1\uFE0F', rarity: 'rare' },
  astronautHelmet: {
    slot: 'head',
    name: t('Astronautenhelm'),
    icon: '\uD83D\uDE80',
    rarity: 'rare',
  },
  // Epic
  vikingHelmet: { slot: 'head', name: t('Wikingerhelm'), icon: '\u2694\uFE0F', rarity: 'epic' },
  crown: { slot: 'head', name: t('Krone'), icon: '\uD83D\uDC51', rarity: 'epic' },
  unicornHorn: { slot: 'head', name: t('Einhorn-Horn'), icon: '\uD83E\uDD84', rarity: 'epic' },
  robotHead: { slot: 'head', name: t('Roboter-Kopf'), icon: '\uD83E\uDD16', rarity: 'epic' },
  // Legendary
  halo: { slot: 'head', name: t('Heiligenschein'), icon: '\uD83D\uDE07', rarity: 'legendary' },
  devilHorns: {
    slot: 'head',
    name: t('Teufelshoerner'),
    icon: '\uD83D\uDE08',
    rarity: 'legendary',
  },
  alienAntenna: {
    slot: 'head',
    name: t('Alien-Antenne'),
    icon: '\uD83D\uDC7D',
    rarity: 'legendary',
  },

  // ── FACE SLOT ──────────────────────────────────────────
  // Common
  roundGlasses: { slot: 'face', name: t('Brille'), icon: '\uD83D\uDC53', rarity: 'common' },
  theatreMask: { slot: 'face', name: t('Theatermaske'), icon: '\uD83C\uDFAD', rarity: 'common' },
  surgeonMask: { slot: 'face', name: t('Mundschutz'), icon: '\uD83D\uDE37', rarity: 'common' },
  // Uncommon
  sunglasses: {
    slot: 'face',
    name: t('Sonnenbrille'),
    icon: '\uD83D\uDD76\uFE0F',
    rarity: 'uncommon',
  },
  heartGlasses: { slot: 'face', name: t('Herzbrille'), icon: '\uD83D\uDC95', rarity: 'uncommon' },
  nerdGlasses: { slot: 'face', name: t('Nerd-Brille'), icon: '\uD83E\uDD13', rarity: 'uncommon' },
  clownNose: { slot: 'face', name: t('Clownsnase'), icon: '\uD83E\uDD21', rarity: 'uncommon' },
  // Rare
  monocle: { slot: 'face', name: t('Monokel'), icon: '\uD83E\uDDD0', rarity: 'rare' },
  cyclopsEye: {
    slot: 'face',
    name: t('Zyklopen-Auge'),
    icon: '\uD83D\uDC41\uFE0F',
    rarity: 'rare',
  },
  skiGoggles: { slot: 'face', name: t('Skibrille'), icon: '\uD83E\uDD7D', rarity: 'rare' },
  // Epic
  starShades: { slot: 'face', name: t('Sternenbrille'), icon: '\u2B50', rarity: 'epic' },
  visionVisor: { slot: 'face', name: t('Kampf-Visier'), icon: '\uD83E\uDD3A', rarity: 'epic' },
  // Legendary
  laserVisor: { slot: 'face', name: t('Laser-Visier'), icon: '\uD83D\uDD34', rarity: 'legendary' },
  diamondMask: {
    slot: 'face',
    name: t('Diamant-Maske'),
    icon: '\uD83D\uDC8E',
    rarity: 'legendary',
  },

  // ── NECK SLOT ──────────────────────────────────────────
  // Common
  collar: { slot: 'neck', name: t('Halsband'), icon: '\uD83D\uDCFF', rarity: 'common' },
  bow: {
    slot: 'neck',
    name: t('Schleife'),
    icon: '\uD83C\uDF80',
    rarity: 'common',
    color: '#FF69B4',
  },
  bowtie: { slot: 'neck', name: t('Fliege'), icon: '\uD83E\uDD35', rarity: 'common' },
  tie: { slot: 'neck', name: t('Krawatte'), icon: '\uD83D\uDC54', rarity: 'common' },
  bandkerchief: { slot: 'neck', name: t('Halstuch'), icon: '\uD83E\uDDE3', rarity: 'common' },
  // Uncommon
  scarf: { slot: 'neck', name: t('Schal'), icon: '\uD83E\uDDE3', rarity: 'uncommon' },
  locket: { slot: 'neck', name: t('Medaillon'), icon: '\uD83D\uDC9B', rarity: 'uncommon' },
  bellCollar: {
    slot: 'neck',
    name: t('Gloeckchen-Halsband'),
    icon: '\uD83D\uDD14',
    rarity: 'uncommon',
  },
  flowerGarland: {
    slot: 'neck',
    name: t('Blumengirlande'),
    icon: '\uD83C\uDF3B',
    rarity: 'uncommon',
  },
  // Rare
  goldChain: { slot: 'neck', name: t('Goldkette'), icon: '\u26D3\uFE0F', rarity: 'rare' },
  medal: { slot: 'neck', name: t('Medaille'), icon: '\uD83C\uDFC5', rarity: 'rare' },
  rubyPendant: { slot: 'neck', name: t('Rubin-Anhaenger'), icon: '\u2764\uFE0F', rarity: 'rare' },
  anchorChain: { slot: 'neck', name: t('Anker-Kette'), icon: '\u2693', rarity: 'rare' },
  // Epic
  cape: { slot: 'neck', name: t('Umhang'), icon: '\uD83E\uDDB8', rarity: 'epic' },
  royalSash: {
    slot: 'neck',
    name: t('Koenigliche Schaerpe'),
    icon: '\uD83C\uDF96\uFE0F',
    rarity: 'epic',
  },
  dragonPendant: {
    slot: 'neck',
    name: t('Drachen-Anhaenger'),
    icon: '\uD83D\uDC09',
    rarity: 'epic',
  },
  // Legendary
  phoenixFeatherNeck: {
    slot: 'neck',
    name: t('Phoenix-Kette'),
    icon: '\uD83D\uDD25',
    rarity: 'legendary',
  },
  cosmicAmulet: {
    slot: 'neck',
    name: t('Kosmisches Amulett'),
    icon: '\uD83C\uDF0C',
    rarity: 'legendary',
  },

  // ── DAILY SPIN EXCLUSIVE ───────────────────────────────
  diamondTiara: {
    slot: 'head',
    name: t('Diamant-Tiara'),
    icon: '\uD83D\uDC8E',
    rarity: 'legendary',
  },
  ninjaMask: { slot: 'face', name: t('Ninja-Maske'), icon: '\uD83E\uDD77', rarity: 'epic' },
  royalCape: {
    slot: 'neck',
    name: t('Koenigsumhang'),
    icon: '\uD83E\uDDB8\u200D\u2642\uFE0F',
    rarity: 'legendary',
  },
  aviatorGoggles: { slot: 'face', name: t('Fliegerbrille'), icon: '\uD83E\uDD7D', rarity: 'rare' },
  chefHat: {
    slot: 'head',
    name: t('Kochmuetze'),
    icon: '\uD83E\uDDD1\u200D\uD83C\uDF73',
    rarity: 'uncommon',
  },
  lei: { slot: 'neck', name: t('Blumenkette'), icon: '\uD83C\uDF3A', rarity: 'uncommon' },
  catEars: { slot: 'head', name: t('Katzenohren'), icon: '\uD83D\uDE3B', rarity: 'rare' },
  nightOwlGoggles: {
    slot: 'face',
    name: t('Nachteule-Brille'),
    icon: '\uD83E\uDD89',
    rarity: 'epic',
  },
  galaxyCape: {
    slot: 'neck',
    name: t('Galaxie-Umhang'),
    icon: '\uD83C\uDF0C',
    rarity: 'legendary',
  },
  samuraiHelmet: { slot: 'head', name: t('Samurai-Helm'), icon: '\uD83C\uDFEF', rarity: 'epic' },
  pixelShades: {
    slot: 'face',
    name: t('Pixel-Brille'),
    icon: '\uD83D\uDDA5\uFE0F',
    rarity: 'uncommon',
  },
  luckyClover: { slot: 'neck', name: t('Gluecksklee-Kette'), icon: '\uD83C\uDF40', rarity: 'rare' },
  // Spin Batch 2
  witchHat: {
    slot: 'head',
    name: t('Hexenhut'),
    icon: '\uD83E\uDDD9\u200D\u2640\uFE0F',
    rarity: 'rare',
  },
  steamGoggles: { slot: 'face', name: t('Steampunk-Brille'), icon: '\u2699\uFE0F', rarity: 'epic' },
  rainbowScarf: {
    slot: 'neck',
    name: t('Regenbogen-Schal'),
    icon: '\uD83C\uDF08',
    rarity: 'uncommon',
  },
  mushHat: { slot: 'head', name: t('Pilzhut'), icon: '\uD83C\uDF44', rarity: 'common' },
  butterflyMask: {
    slot: 'face',
    name: t('Schmetterlings-Maske'),
    icon: '\uD83E\uDD8B',
    rarity: 'rare',
  },
  shellNecklace: { slot: 'neck', name: t('Muschel-Kette'), icon: '\uD83D\uDC1A', rarity: 'common' },
  foxEars: { slot: 'head', name: t('Fuchsohren'), icon: '\uD83E\uDD8A', rarity: 'epic' },
  ghostMask: { slot: 'face', name: t('Geistermaske'), icon: '\uD83D\uDC7B', rarity: 'rare' },
  thunderChain: { slot: 'neck', name: t('Donner-Kette'), icon: '\u26A1', rarity: 'epic' },
  iceHelm: { slot: 'head', name: t('Eishelm'), icon: '\u2744\uFE0F', rarity: 'legendary' },
  prismVisor: { slot: 'face', name: t('Prisma-Visier'), icon: '\uD83C\uDF1F', rarity: 'legendary' },
  solarAmulet: {
    slot: 'neck',
    name: t('Sonnen-Amulett'),
    icon: '\u2600\uFE0F',
    rarity: 'legendary',
  },

  // ── MILESTONE EXCLUSIVE ────────────────────────────────
  trophyNecklace: {
    slot: 'neck',
    name: t('Trophaeen-Kette'),
    icon: '\uD83C\uDFC6',
    rarity: 'epic',
  },
  starHelmet: { slot: 'head', name: t('Sternenhelm'), icon: '\uD83C\uDF1F', rarity: 'legendary' },
  crystalMonocle: {
    slot: 'face',
    name: t('Kristall-Monokel'),
    icon: '\uD83D\uDD2E',
    rarity: 'epic',
  },
  phoenixFeather: {
    slot: 'head',
    name: t('Phoenix-Feder'),
    icon: '\uD83E\uDEB6',
    rarity: 'legendary',
  },
  infinityScarf: { slot: 'neck', name: t('Endlos-Schal'), icon: '\u267E\uFE0F', rarity: 'rare' },
  ancientCrown: { slot: 'head', name: t('Antike Krone'), icon: '\uD83D\uDC51', rarity: 'epic' },
  championBelt: { slot: 'neck', name: t('Champion-Guertel'), icon: '\uD83E\uDD4A', rarity: 'epic' },
  cosmicHelm: {
    slot: 'head',
    name: t('Kosmischer Helm'),
    icon: '\uD83C\uDF0D',
    rarity: 'legendary',
  },
  timeTravelerGoggles: {
    slot: 'face',
    name: t('Zeitreise-Brille'),
    icon: '\u231A',
    rarity: 'rare',
  },
  enchantedRose: {
    slot: 'neck',
    name: t('Verzauberte Rose'),
    icon: '\uD83C\uDF39',
    rarity: 'epic',
  },
  shadowHood: { slot: 'head', name: t('Schattenkapuze'), icon: '\uD83D\uDDA4', rarity: 'rare' },
  celestialCrown: {
    slot: 'head',
    name: t('Himmelskrone'),
    icon: '\uD83D\uDCAB',
    rarity: 'legendary',
  },
  // Milestone Batch 2
  volcanoHelm: { slot: 'head', name: t('Vulkan-Helm'), icon: '\uD83C\uDF0B', rarity: 'epic' },
  abyssVisor: {
    slot: 'face',
    name: t('Abgrund-Visier'),
    icon: '\uD83C\uDF11',
    rarity: 'legendary',
  },
  dragonScaleCollar: {
    slot: 'neck',
    name: t('Drachenschuppen-Kragen'),
    icon: '\uD83D\uDC32',
    rarity: 'epic',
  },
  lotusHelm: { slot: 'head', name: t('Lotus-Krone'), icon: '\uD83C\uDF3C', rarity: 'rare' },
  eclipseGoggles: {
    slot: 'face',
    name: t('Sonnenfinsternis-Brille'),
    icon: '\uD83C\uDF11',
    rarity: 'epic',
  },
  runeNecklace: { slot: 'neck', name: t('Runen-Kette'), icon: '\uD83D\uDD2F', rarity: 'rare' },
  glitchCrown: {
    slot: 'head',
    name: t('Glitch-Krone'),
    icon: '\uD83D\uDDA5\uFE0F',
    rarity: 'legendary',
  },
  voidMask: {
    slot: 'face',
    name: t('Void-Maske'),
    icon: '\uD83D\uDD73\uFE0F',
    rarity: 'legendary',
  },
  sakuraPendant: {
    slot: 'neck',
    name: t('Sakura-Anhaenger'),
    icon: '\uD83C\uDF38',
    rarity: 'uncommon',
  },
  pyramidHelm: {
    slot: 'head',
    name: t('Pyramiden-Helm'),
    icon: '\uD83D\uDEE1\uFE0F',
    rarity: 'epic',
  },
  mirrorShades: { slot: 'face', name: t('Spiegel-Brille'), icon: '\uD83E\uDE9E', rarity: 'rare' },
  obsidianAmulet: {
    slot: 'neck',
    name: t('Obsidian-Amulett'),
    icon: '\uD83D\uDDA4',
    rarity: 'legendary',
  },
};

/** Get the rarity for an accessory by ID */
export function getAccessoryRarity(accessoryId: string): AccessoryRarity {
  return ACCESSORIES[accessoryId]?.rarity ?? 'common';
}
