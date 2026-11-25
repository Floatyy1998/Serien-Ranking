import type { AccessoryRarity } from '../../../types/pet.types';
import { ACCESSORIES } from './accessories';
import { PET_BACKGROUNDS } from './petBackgrounds';

/** Nur am Glücksrad bevorzugt zu gewinnen, nie als Fund beim Schauen. */
export const SPIN_EXCLUSIVE_ACCESSORIES: readonly string[] = [
  'diamondTiara',
  'ninjaMask',
  'royalCape',
  'aviatorGoggles',
  'chefHat',
  'lei',
  'catEars',
  'nightOwlGoggles',
  'galaxyCape',
  'samuraiHelmet',
  'pixelShades',
  'luckyClover',
  'witchHat',
  'steamGoggles',
  'rainbowScarf',
  'mushHat',
  'butterflyMask',
  'shellNecklace',
  'foxEars',
  'ghostMask',
  'thunderChain',
  'iceHelm',
  'prismVisor',
  'solarAmulet',
  // Winter 2026
  'fez',
  'sailorCap',
  'pineappleHat',
  'ufoHat',
  'cinemaGlasses',
  'bubbleGum',
  'masqueradeMask',
  'galaxyGlasses',
  'hawaiiShirt',
  'duckFloat',
  'angelWings',
  'starOrbit',
];

/** Nur in Mystery Boxen bevorzugt zu gewinnen, nie als Fund beim Schauen. */
export const MILESTONE_EXCLUSIVE_ACCESSORIES: readonly string[] = [
  'trophyNecklace',
  'starHelmet',
  'crystalMonocle',
  'phoenixFeather',
  'infinityScarf',
  'ancientCrown',
  'championBelt',
  'cosmicHelm',
  'timeTravelerGoggles',
  'enchantedRose',
  'shadowHood',
  'celestialCrown',
  'volcanoHelm',
  'abyssVisor',
  'dragonScaleCollar',
  'lotusHelm',
  'eclipseGoggles',
  'runeNecklace',
  'glitchCrown',
  'voidMask',
  'sakuraPendant',
  'pyramidHelm',
  'mirrorShades',
  'obsidianAmulet',
  // Juli 2026
  'jellyfishCrown',
  'galaxyCrown',
  'crystalHorns',
  'kitsuneMask',
  'thirdEye',
  'moonVisor',
  'auroraScarf',
  'krakenCharm',
  // Winter 2026
  'clapperHat',
  'knightHelmet',
  'pharaohCrown',
  'sunCrown',
  'saturnRing',
  'sparkleEyes',
  'phantomMask',
  'fireBreath',
  'tuxedo',
  'knightArmor',
  'lanternNecklace',
  'jetpack',
];

/** Alles, was beim Schauen einer Folge nicht fallen darf. */
export const EPISODE_DROP_EXCLUDED: ReadonlySet<string> = new Set([
  ...SPIN_EXCLUSIVE_ACCESSORIES,
  ...MILESTONE_EXCLUSIVE_ACCESSORIES,
]);

const RARITY_ORDER: readonly AccessoryRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

/** Die gewürfelte Seltenheit zuerst, danach die nächstgelegenen; bei Gleichstand die niedrigere. */
export function rarityFallbackOrder(target: AccessoryRarity): AccessoryRarity[] {
  const at = RARITY_ORDER.indexOf(target);
  return [...RARITY_ORDER].sort(
    (a, b) =>
      Math.abs(RARITY_ORDER.indexOf(a) - at) - Math.abs(RARITY_ORDER.indexOf(b) - at) ||
      RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b)
  );
}

export interface ItemReward {
  kind: 'accessory' | 'background';
  id: string;
  rarity: AccessoryRarity;
}

const pickOne = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

function unownedAccessory(
  owned: ReadonlySet<string>,
  rarity: AccessoryRarity,
  preferred: readonly string[],
  excluded?: ReadonlySet<string>
): string | null {
  const free = (id: string) => ACCESSORIES[id]?.rarity === rarity && !owned.has(id);
  const first = preferred.filter(free);
  if (first.length > 0) return pickOne(first);
  const rest = Object.keys(ACCESSORIES).filter(
    (id) => free(id) && !ACCESSORIES[id].source && !excluded?.has(id)
  );
  return rest.length > 0 ? pickOne(rest) : null;
}

function unownedBackground(owned: ReadonlySet<string>, rarity: AccessoryRarity): string | null {
  const free = Object.values(PET_BACKGROUNDS).filter(
    (bg) => bg.rarity === rarity && !owned.has(bg.id)
  );
  return free.length > 0 ? pickOne(free).id : null;
}

/**
 * Ein Teil, das der Nutzer noch nicht hat. Ist die gewürfelte Seltenheit leergesammelt, rückt die
 * nächstgelegene nach — leer geht die Auswahl erst aus, wenn wirklich alles gesammelt ist.
 */
export function pickItemReward(options: {
  ownedAccessories: ReadonlySet<string>;
  ownedBackgrounds: ReadonlySet<string>;
  rarity: AccessoryRarity;
  /** Teile, die an dieser Quelle zuerst vergeben werden. */
  preferred: readonly string[];
  first: ItemReward['kind'];
}): ItemReward | null {
  const kinds: ItemReward['kind'][] =
    options.first === 'background' ? ['background', 'accessory'] : ['accessory', 'background'];
  for (const rarity of rarityFallbackOrder(options.rarity)) {
    for (const kind of kinds) {
      const id =
        kind === 'accessory'
          ? unownedAccessory(options.ownedAccessories, rarity, options.preferred)
          : unownedBackground(options.ownedBackgrounds, rarity);
      if (id) return { kind, id, rarity };
    }
  }
  return null;
}

/** Fund beim Schauen: wie oben, aber ohne die Teile von Glücksrad und Mystery Box. */
export function pickEpisodeDrop(
  owned: ReadonlySet<string>,
  rolled: AccessoryRarity
): { id: string; rarity: AccessoryRarity } | null {
  for (const rarity of rarityFallbackOrder(rolled)) {
    const id = unownedAccessory(owned, rarity, [], EPISODE_DROP_EXCLUDED);
    if (id) return { id, rarity };
  }
  return null;
}
