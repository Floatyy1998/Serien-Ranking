import type { PetAccessory } from '../../types/pet.types';
import type { PetAnchors } from './accessories/shared';
import {
  drawBeanie,
  drawBaseballCap,
  drawFlowerCrown,
  drawBandana,
  drawPartyHat,
  drawTopHat,
  drawSantaHat,
  drawPirateHat,
  drawWizardHat,
  drawVikingHelmet,
  drawCrown,
  drawHalo,
  drawDevilHorns,
  drawBeret,
  drawHeadband,
  drawCowboyHat,
  drawGraduationCap,
  drawStrawHat,
  drawMilitaryHelmet,
  drawAstronautHelmet,
  drawUnicornHorn,
  drawRobotHead,
  drawAlienAntenna,
  drawDiamondTiara,
  drawChefHat,
  drawCatEars,
  drawSamuraiHelmet,
  drawWitchHat,
  drawMushHat,
  drawFoxEars,
  drawIceHelm,
  drawStarHelmet,
  drawPhoenixFeatherHead,
  drawAncientCrown,
  drawCosmicHelm,
  drawShadowHood,
  drawCelestialCrown,
  drawVolcanoHelm,
  drawLotusHelm,
  drawGlitchCrown,
  drawPyramidHelm,
} from './accessories/head';
import {
  drawRoundGlasses,
  drawSunglasses,
  drawHeartGlasses,
  drawMonocle,
  drawStarShades,
  drawLaserVisor,
  drawTheatreMask,
  drawSurgeonMask,
  drawNerdGlasses,
  drawClownNose,
  drawCyclopsEye,
  drawSkiGoggles,
  drawVisionVisor,
  drawDiamondMask,
  drawNinjaMask,
  drawAviatorGoggles,
  drawNightOwlGoggles,
  drawPixelShades,
  drawSteamGoggles,
  drawButterflyMask,
  drawGhostMask,
  drawPrismVisor,
  drawCrystalMonocle,
  drawTimeTravelerGoggles,
  drawAbyssVisor,
  drawEclipseGoggles,
  drawVoidMask,
  drawMirrorShades,
} from './accessories/face';
import {
  drawCollar,
  drawBow,
  drawBowtie,
  drawScarf,
  drawGoldChain,
  drawCape,
  drawMedal,
  drawTie,
  drawBandkerchief,
  drawLocket,
  drawBellCollar,
  drawFlowerGarland,
  drawRubyPendant,
  drawAnchorChain,
  drawRoyalSash,
  drawDragonPendant,
  drawPhoenixFeatherNeck,
  drawCosmicAmulet,
  drawRoyalCape,
  drawLei,
  drawGalaxyCape,
  drawLuckyClover,
  drawRainbowScarf,
  drawShellNecklace,
  drawThunderChain,
  drawSolarAmulet,
  drawTrophyNecklace,
  drawInfinityScarf,
  drawChampionBelt,
  drawEnchantedRose,
  drawDragonScaleCollar,
  drawRuneNecklace,
  drawSakuraPendant,
  drawObsidianAmulet,
} from './accessories/neck';

// Sicherer Default falls petType nicht bekannt (z.B. veralteter JS-Cache,
// alte/korrupte Pet-Daten in Firebase mit unbekanntem Typ).
const DEFAULT_ANCHORS: PetAnchors = {
  headTopY: 11,
  headCenterX: 16,
  headHalfWidth: 3.5,
  eyeY: 14,
  eyeLeftX: -3,
  eyeRightX: 1,
  eyeWidth: 2,
  neckY: 18,
  neckHalfWidth: 4,
};

function getAnchors(
  petType: 'cat' | 'dog' | 'bird' | 'dragon' | 'fox' | 'rabbit' | 'panda',
  level: number
): PetAnchors {
  const cx = 16;
  switch (petType) {
    case 'cat': {
      // Lv50+ = Säbelzahn-Form (größerer Kopf, andere Proportionen)
      if (level >= 50) {
        const hs = level >= 75 ? 1.5 : level >= 60 ? 1.4 : 1.35;
        return {
          headTopY: 10,
          headCenterX: cx,
          headHalfWidth: 4 * hs,
          eyeY: 13,
          eyeLeftX: -3.5,
          eyeRightX: 1,
          eyeWidth: 2.5,
          neckY: 18,
          neckHalfWidth: 5 * hs,
        };
      }
      const hs =
        level >= 20 ? 1.3 : level >= 15 ? 1.25 : level >= 10 ? 1.15 : level >= 5 ? 1.08 : 1;
      return {
        headTopY: 11,
        headCenterX: cx,
        headHalfWidth: 3 * hs,
        eyeY: 14,
        eyeLeftX: -3,
        eyeRightX: 1,
        eyeWidth: 2,
        neckY: 18.5,
        neckHalfWidth: 3.5 * hs,
      };
    }
    case 'dog': {
      // Lv50+ = Wolf-Form
      if (level >= 50) {
        const hs = level >= 75 ? 1.45 : level >= 60 ? 1.35 : 1.3;
        return {
          headTopY: 11,
          headCenterX: cx,
          headHalfWidth: 4 * hs,
          eyeY: 14,
          eyeLeftX: -3.5,
          eyeRightX: 1,
          eyeWidth: 2.5,
          neckY: 19,
          neckHalfWidth: 5 * hs,
        };
      }
      const hs = level >= 20 ? 1.35 : level >= 15 ? 1.3 : level >= 10 ? 1.2 : level >= 5 ? 1.1 : 1;
      return {
        headTopY: 12,
        headCenterX: cx,
        headHalfWidth: 3.5 * hs,
        eyeY: 15,
        eyeLeftX: -3,
        eyeRightX: 1,
        eyeWidth: 2,
        neckY: 19.5,
        neckHalfWidth: 4 * hs,
      };
    }
    case 'bird':
      // Lv50+ = Phönix-Form
      if (level >= 50) {
        return {
          headTopY: 10,
          headCenterX: cx,
          headHalfWidth: 3,
          eyeY: 13,
          eyeLeftX: -4,
          eyeRightX: 2,
          eyeWidth: 2,
          neckY: 15.5,
          neckHalfWidth: 3,
        };
      }
      return {
        headTopY: 10,
        headCenterX: cx,
        headHalfWidth: 2.5,
        eyeY: 13,
        eyeLeftX: -4,
        eyeRightX: 2,
        eyeWidth: 2,
        neckY: 15.5,
        neckHalfWidth: 3,
      };
    case 'dragon':
      // Lv50+ = Wyvern-Form
      if (level >= 50) {
        return {
          headTopY: 10,
          headCenterX: cx,
          headHalfWidth: 4,
          eyeY: 12,
          eyeLeftX: -3.5,
          eyeRightX: 1,
          eyeWidth: 2.5,
          neckY: 17.5,
          neckHalfWidth: 4.5,
        };
      }
      return {
        headTopY: 11,
        headCenterX: cx,
        headHalfWidth: 3.5,
        eyeY: 13,
        eyeLeftX: -3,
        eyeRightX: 1,
        eyeWidth: 2,
        neckY: 18,
        neckHalfWidth: 4,
      };
    case 'fox':
      // Lv50+ = Göttliche Kitsune-Form
      if (level >= 50) {
        return {
          headTopY: 10,
          headCenterX: cx,
          headHalfWidth: 3.5,
          eyeY: 13.5,
          eyeLeftX: -3.5,
          eyeRightX: 1.5,
          eyeWidth: 2,
          neckY: 17,
          neckHalfWidth: 3.5,
        };
      }
      return {
        headTopY: 11,
        headCenterX: cx,
        headHalfWidth: 3,
        eyeY: 14,
        eyeLeftX: -3,
        eyeRightX: 1.5,
        eyeWidth: 1.5,
        neckY: 17,
        neckHalfWidth: 3,
      };
    case 'rabbit':
      // Lv50+ = Mondhase-Form
      if (level >= 50) {
        return {
          headTopY: 12,
          headCenterX: cx,
          headHalfWidth: 4.5,
          eyeY: 14.5,
          eyeLeftX: -3,
          eyeRightX: 1.5,
          eyeWidth: 1.5,
          neckY: 19,
          neckHalfWidth: 4,
        };
      }
      return {
        headTopY: 12,
        headCenterX: cx,
        headHalfWidth: 4,
        eyeY: 15,
        eyeLeftX: -2.5,
        eyeRightX: 1.3,
        eyeWidth: 1.2,
        neckY: 19,
        neckHalfWidth: 3.5,
      };
    case 'panda':
      // Lv50+ = Kung-Fu-Wächter-Form (Kopf r=6.7 bei centerY-3.5=12.5)
      if (level >= 50) {
        return {
          headTopY: 6,
          headCenterX: cx,
          headHalfWidth: 6,
          eyeY: 12.8,
          eyeLeftX: -3.6,
          eyeRightX: 1.9,
          eyeWidth: 1.8,
          neckY: 18,
          neckHalfWidth: 5,
        };
      }
      // Normal: Kopf r=6.5 bei centerY-3=13 → Top y=6.5, Augen y=13.3 (cx±2.6)
      return {
        headTopY: 7,
        headCenterX: cx,
        headHalfWidth: 5.5,
        eyeY: 13.3,
        eyeLeftX: -3.5,
        eyeRightX: 1.7,
        eyeWidth: 1.8,
        neckY: 19,
        neckHalfWidth: 4,
      };
    default:
      return DEFAULT_ANCHORS;
  }
}

export const drawAccessory = (
  ctx: CanvasRenderingContext2D,
  accessory: PetAccessory,
  ps: number,
  offset: number,
  petType: 'cat' | 'dog' | 'bird' | 'dragon' | 'fox' | 'rabbit' | 'panda' = 'cat',
  level: number = 1
): void => {
  const a = getAnchors(petType, level);

  // Switch on accessory ID directly for precise drawing
  switch (accessory.id) {
    // ── HEAD ACCESSORIES ─────────────────────────────────
    case 'beanie':
      drawBeanie(ctx, ps, offset, a);
      break;
    case 'baseballCap':
      drawBaseballCap(ctx, ps, offset, a);
      break;
    case 'flowerCrown':
      drawFlowerCrown(ctx, ps, offset, a);
      break;
    case 'bandana':
      drawBandana(ctx, ps, offset, a, accessory.color);
      break;
    case 'partyHat':
      drawPartyHat(ctx, ps, offset, a);
      break;
    case 'topHat':
      drawTopHat(ctx, ps, offset, a);
      break;
    case 'santaHat':
      drawSantaHat(ctx, ps, offset, a);
      break;
    case 'pirateHat':
      drawPirateHat(ctx, ps, offset, a);
      break;
    case 'wizardHat':
      drawWizardHat(ctx, ps, offset, a);
      break;
    case 'vikingHelmet':
      drawVikingHelmet(ctx, ps, offset, a);
      break;
    case 'crown':
      drawCrown(ctx, ps, offset, a);
      break;
    case 'halo':
      drawHalo(ctx, ps, offset, a);
      break;
    case 'devilHorns':
      drawDevilHorns(ctx, ps, offset, a);
      break;

    // ── FACE ACCESSORIES ─────────────────────────────────
    case 'roundGlasses':
      drawRoundGlasses(ctx, ps, offset, a);
      break;
    case 'sunglasses':
      drawSunglasses(ctx, ps, offset, a);
      break;
    case 'heartGlasses':
      drawHeartGlasses(ctx, ps, offset, a);
      break;
    case 'monocle':
      drawMonocle(ctx, ps, offset, a);
      break;
    case 'starShades':
      drawStarShades(ctx, ps, offset, a);
      break;
    case 'laserVisor':
      drawLaserVisor(ctx, ps, offset, a);
      break;

    // ── NECK ACCESSORIES ─────────────────────────────────
    case 'collar':
      drawCollar(ctx, ps, offset, a, accessory.color);
      break;
    case 'bow':
      drawBow(ctx, ps, offset, a, accessory.color);
      break;
    case 'bowtie':
      drawBowtie(ctx, ps, offset, a);
      break;
    case 'scarf':
      drawScarf(ctx, ps, offset, a);
      break;
    case 'goldChain':
      drawGoldChain(ctx, ps, offset, a);
      break;
    case 'cape':
      drawCape(ctx, ps, offset, a);
      break;
    case 'medal':
      drawMedal(ctx, ps, offset, a);
      break;

    // ── NEW HEAD ACCESSORIES ─────────────────────────────
    case 'beret':
      drawBeret(ctx, ps, offset, a);
      break;
    case 'headband':
      drawHeadband(ctx, ps, offset, a);
      break;
    case 'cowboyHat':
      drawCowboyHat(ctx, ps, offset, a);
      break;
    case 'graduationCap':
      drawGraduationCap(ctx, ps, offset, a);
      break;
    case 'strawHat':
      drawStrawHat(ctx, ps, offset, a);
      break;
    case 'militaryHelmet':
      drawMilitaryHelmet(ctx, ps, offset, a);
      break;
    case 'astronautHelmet':
      drawAstronautHelmet(ctx, ps, offset, a);
      break;
    case 'unicornHorn':
      drawUnicornHorn(ctx, ps, offset, a);
      break;
    case 'robotHead':
      drawRobotHead(ctx, ps, offset, a);
      break;
    case 'alienAntenna':
      drawAlienAntenna(ctx, ps, offset, a);
      break;

    // ── NEW FACE ACCESSORIES ─────────────────────────────
    case 'theatreMask':
      drawTheatreMask(ctx, ps, offset, a);
      break;
    case 'surgeonMask':
      drawSurgeonMask(ctx, ps, offset, a);
      break;
    case 'nerdGlasses':
      drawNerdGlasses(ctx, ps, offset, a);
      break;
    case 'clownNose':
      drawClownNose(ctx, ps, offset, a);
      break;
    case 'cyclopsEye':
      drawCyclopsEye(ctx, ps, offset, a);
      break;
    case 'skiGoggles':
      drawSkiGoggles(ctx, ps, offset, a);
      break;
    case 'visionVisor':
      drawVisionVisor(ctx, ps, offset, a);
      break;
    case 'diamondMask':
      drawDiamondMask(ctx, ps, offset, a);
      break;

    // ── NEW NECK ACCESSORIES ─────────────────────────────
    case 'tie':
      drawTie(ctx, ps, offset, a);
      break;
    case 'bandkerchief':
      drawBandkerchief(ctx, ps, offset, a);
      break;
    case 'locket':
      drawLocket(ctx, ps, offset, a);
      break;
    case 'bellCollar':
      drawBellCollar(ctx, ps, offset, a);
      break;
    case 'flowerGarland':
      drawFlowerGarland(ctx, ps, offset, a);
      break;
    case 'rubyPendant':
      drawRubyPendant(ctx, ps, offset, a);
      break;
    case 'anchorChain':
      drawAnchorChain(ctx, ps, offset, a);
      break;
    case 'royalSash':
      drawRoyalSash(ctx, ps, offset, a);
      break;
    case 'dragonPendant':
      drawDragonPendant(ctx, ps, offset, a);
      break;
    case 'phoenixFeatherNeck':
      drawPhoenixFeatherNeck(ctx, ps, offset, a);
      break;
    case 'cosmicAmulet':
      drawCosmicAmulet(ctx, ps, offset, a);
      break;

    // ── SPIN EXCLUSIVE ───────────────────────────────────
    case 'diamondTiara':
      drawDiamondTiara(ctx, ps, offset, a);
      break;
    case 'ninjaMask':
      drawNinjaMask(ctx, ps, offset, a);
      break;
    case 'royalCape':
      drawRoyalCape(ctx, ps, offset, a);
      break;
    case 'aviatorGoggles':
      drawAviatorGoggles(ctx, ps, offset, a);
      break;
    case 'chefHat':
      drawChefHat(ctx, ps, offset, a);
      break;
    case 'lei':
      drawLei(ctx, ps, offset, a);
      break;
    case 'catEars':
      drawCatEars(ctx, ps, offset, a);
      break;
    case 'nightOwlGoggles':
      drawNightOwlGoggles(ctx, ps, offset, a);
      break;
    case 'galaxyCape':
      drawGalaxyCape(ctx, ps, offset, a);
      break;
    case 'samuraiHelmet':
      drawSamuraiHelmet(ctx, ps, offset, a);
      break;
    case 'pixelShades':
      drawPixelShades(ctx, ps, offset, a);
      break;
    case 'luckyClover':
      drawLuckyClover(ctx, ps, offset, a);
      break;
    case 'witchHat':
      drawWitchHat(ctx, ps, offset, a);
      break;
    case 'steamGoggles':
      drawSteamGoggles(ctx, ps, offset, a);
      break;
    case 'rainbowScarf':
      drawRainbowScarf(ctx, ps, offset, a);
      break;
    case 'mushHat':
      drawMushHat(ctx, ps, offset, a);
      break;
    case 'butterflyMask':
      drawButterflyMask(ctx, ps, offset, a);
      break;
    case 'shellNecklace':
      drawShellNecklace(ctx, ps, offset, a);
      break;
    case 'foxEars':
      drawFoxEars(ctx, ps, offset, a);
      break;
    case 'ghostMask':
      drawGhostMask(ctx, ps, offset, a);
      break;
    case 'thunderChain':
      drawThunderChain(ctx, ps, offset, a);
      break;
    case 'iceHelm':
      drawIceHelm(ctx, ps, offset, a);
      break;
    case 'prismVisor':
      drawPrismVisor(ctx, ps, offset, a);
      break;
    case 'solarAmulet':
      drawSolarAmulet(ctx, ps, offset, a);
      break;

    // ── MILESTONE EXCLUSIVE ──────────────────────────────
    case 'trophyNecklace':
      drawTrophyNecklace(ctx, ps, offset, a);
      break;
    case 'starHelmet':
      drawStarHelmet(ctx, ps, offset, a);
      break;
    case 'crystalMonocle':
      drawCrystalMonocle(ctx, ps, offset, a);
      break;
    case 'phoenixFeather':
      drawPhoenixFeatherHead(ctx, ps, offset, a);
      break;
    case 'infinityScarf':
      drawInfinityScarf(ctx, ps, offset, a);
      break;
    case 'ancientCrown':
      drawAncientCrown(ctx, ps, offset, a);
      break;
    case 'championBelt':
      drawChampionBelt(ctx, ps, offset, a);
      break;
    case 'cosmicHelm':
      drawCosmicHelm(ctx, ps, offset, a);
      break;
    case 'timeTravelerGoggles':
      drawTimeTravelerGoggles(ctx, ps, offset, a);
      break;
    case 'enchantedRose':
      drawEnchantedRose(ctx, ps, offset, a);
      break;
    case 'shadowHood':
      drawShadowHood(ctx, ps, offset, a);
      break;
    case 'celestialCrown':
      drawCelestialCrown(ctx, ps, offset, a);
      break;
    case 'volcanoHelm':
      drawVolcanoHelm(ctx, ps, offset, a);
      break;
    case 'abyssVisor':
      drawAbyssVisor(ctx, ps, offset, a);
      break;
    case 'dragonScaleCollar':
      drawDragonScaleCollar(ctx, ps, offset, a);
      break;
    case 'lotusHelm':
      drawLotusHelm(ctx, ps, offset, a);
      break;
    case 'eclipseGoggles':
      drawEclipseGoggles(ctx, ps, offset, a);
      break;
    case 'runeNecklace':
      drawRuneNecklace(ctx, ps, offset, a);
      break;
    case 'glitchCrown':
      drawGlitchCrown(ctx, ps, offset, a);
      break;
    case 'voidMask':
      drawVoidMask(ctx, ps, offset, a);
      break;
    case 'sakuraPendant':
      drawSakuraPendant(ctx, ps, offset, a);
      break;
    case 'pyramidHelm':
      drawPyramidHelm(ctx, ps, offset, a);
      break;
    case 'mirrorShades':
      drawMirrorShades(ctx, ps, offset, a);
      break;
    case 'obsidianAmulet':
      drawObsidianAmulet(ctx, ps, offset, a);
      break;
  }
};
