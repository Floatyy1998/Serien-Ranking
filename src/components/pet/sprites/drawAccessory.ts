import type { PetAccessory } from '../../../types/pet.types';
import type { PetAnchors } from '../accessories/shared';
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
  drawSproutHat,
  drawPopcornHat,
  drawPropellerCap,
  drawJesterHat,
  drawDetectiveHat,
  drawWinterCrown,
  drawDivingHelmet,
  drawCrystalHorns,
  drawJellyfishCrown,
  drawGalaxyCrown,
} from '../accessories/head';
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
  drawEyepatch,
  drawBlushStickers,
  drawMustache,
  drawDiscoShades,
  drawSnorkelMask,
  drawGoldenEyelashes,
  drawVrHeadset,
  drawKitsuneMask,
  drawThirdEye,
  drawMoonVisor,
} from '../accessories/face';
import {
  drawCollar,
  drawBow,
  drawBowtie,
  drawScarf,
  drawGoldChain,
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
  drawLei,
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
  drawWoolScarf,
  drawSeaweedScarf,
  drawHeadphonesNeck,
  drawPearlNecklace,
  drawFilmstripScarf,
  drawDiscoChain,
  drawLavaAmulet,
  drawAuroraScarf,
  drawKrakenCharm,
  drawCloakBack,
  drawCloakFront,
  isCloakId,
} from '../accessories/neck';

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
  cloak: { claspY: 18.4, collarHw: 5, bodyCY: 21.5, bodyRx: 4.9, bodyRy: 4.4 },
};

/** Kragenbreite bei Ei-Körpern: so weit, wie der Körper auf Höhe der Kragen-Enden reicht. */
const eggCollar = (claspY: number, cy: number, rx: number, ry: number): number =>
  rx * Math.sqrt(Math.max(0, 1 - ((claspY - 1.5 - cy) / ry) ** 2)) + 0.2;

export function getAnchors(
  petType:
    'cat' | 'dog' | 'bird' | 'dragon' | 'fox' | 'rabbit' | 'panda' | 'owl' | 'penguin' | 'axolotl',
  level: number
): PetAnchors {
  const cx = 16;
  // Kawaii-Skelett (seit Redesign Juli 2026): Kopf r=6.2*s bei y13, Körper bei y21.5
  const s = level >= 50 ? 1.16 : level >= 20 ? 1.12 : level >= 15 ? 1.08 : level >= 10 ? 1.05 : 1;
  // Sprite-Wachstum inkl. Lv5-Stufe, für Umhänge, die sich an den Körper schmiegen
  const b = level >= 5 && level < 10 ? 1.02 : s;
  const torso = { bodyCY: 21.5, bodyRx: 4.9 * b, bodyRy: 4.4 * b };
  switch (petType) {
    case 'cat':
      return {
        headTopY: 13 - 6.2 * s,
        headCenterX: cx,
        headHalfWidth: 5.6 * s,
        eyeY: 13.3,
        eyeLeftX: -3.6,
        eyeRightX: 1.6,
        eyeWidth: 2,
        neckY: 18.6,
        neckHalfWidth: 4.4 * s,
        cloak: { claspY: 12.7 + 6.2 * b, collarHw: 4.4 * b + 0.6, ...torso },
      };
    case 'dog':
    case 'dragon':
    case 'fox':
      // Diese drei zeichnen ihre Augen etwas höher (headCY-0.2 bis -0.4)
      return {
        headTopY: 13 - 6.2 * s,
        headCenterX: cx,
        headHalfWidth: 5.6 * s,
        eyeY: 12.7,
        eyeLeftX: -3.6,
        eyeRightX: 1.6,
        eyeWidth: 2,
        neckY: 18.6,
        neckHalfWidth: 4.4 * s,
        cloak: { claspY: 12.7 + 6.2 * b, collarHw: 4.4 * b + 0.6, ...torso },
      };
    case 'bird': {
      // Ei-Silhouette (Küken): Körper-Oben = Kopf
      const claspY = 17.5 - 6.2 * b * 0.35 + 3.3;
      return {
        headTopY: 17.5 - 6.2 * s,
        headCenterX: cx,
        headHalfWidth: 4.6 * s,
        eyeY: 17.5 - 6.2 * s * 0.35,
        eyeLeftX: -3.2,
        eyeRightX: 1.2,
        eyeWidth: 2,
        neckY: 19.5,
        neckHalfWidth: 4 * s,
        cloak: {
          claspY,
          collarHw: eggCollar(claspY, 17.5, 5.4 * b, 6.2 * b),
          bodyCY: 17.5,
          bodyRx: 5.4 * b,
          bodyRy: 6.2 * b,
        },
      };
    }
    case 'rabbit':
      // Kopf r=6*s bei y13.5 (Ohren ragen darüber hinaus)
      return {
        headTopY: 13.5 - 6 * s,
        headCenterX: cx,
        headHalfWidth: 5.4 * s,
        eyeY: 13.8,
        eyeLeftX: -3.5,
        eyeRightX: 1.5,
        eyeWidth: 2,
        neckY: 18.6,
        neckHalfWidth: 4.4 * s,
        cloak: { claspY: 13.2 + 6 * b, collarHw: 4.4 * b + 0.6, ...torso, bodyRy: 4.3 * b },
      };
    case 'panda':
      // Lv50+ = Kung-Fu-Wächter-Form (Kopf r=6.7 bei centerY-3.5=12.5)
      if (level >= 50) {
        const bodyR = level >= 75 ? 7 : level >= 60 ? 6.5 : 6;
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
          cloak: {
            claspY: 12.2 + (level >= 75 ? 7 : 6.7),
            collarHw: 5.6,
            bodyCY: 22,
            bodyRx: bodyR,
            bodyRy: bodyR,
          },
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
        cloak: {
          claspY: 12.7 + 6.5 * b,
          collarHw: 4.4 * b + 0.6,
          bodyCY: 22,
          bodyRx: 5.5 * b,
          bodyRy: 5.5 * b,
        },
      };
    case 'owl': {
      // Ei-Silhouette: Körper-Oben = Kopf (Top ~10.1), Augen bei y≈14.7 (cx±2.6)
      const s =
        level >= 50
          ? 1.18
          : level >= 20
            ? 1.12
            : level >= 15
              ? 1.08
              : level >= 10
                ? 1.05
                : level >= 5
                  ? 1.02
                  : 1;
      const claspY = 17.5 - 7.4 * s * 0.38 + 4;
      return {
        headTopY: 17.5 - 7.4 * s,
        headCenterX: cx,
        headHalfWidth: 5.6 * s,
        eyeY: 17.5 - 7.4 * s * 0.38,
        eyeLeftX: -3.6,
        eyeRightX: 1.6,
        eyeWidth: 2,
        neckY: 19.5,
        neckHalfWidth: 4.5 * s,
        cloak: {
          claspY,
          collarHw: eggCollar(claspY, 17.5, 6.2 * s, 7.4 * s),
          bodyCY: 17.5,
          bodyRx: 6.2 * s,
          bodyRy: 7.4 * s,
        },
      };
    }
    case 'penguin': {
      // Kopf-Rundung oben (Top ~7.6), Augen bei y≈13.2 (cx±1.7)
      const s = level >= 50 ? 1.16 : level >= 20 ? 1.12 : level >= 10 ? 1.05 : 1;
      return {
        headTopY: 18 - 7.2 * s * 0.72 - 5.6 * s * 0.78,
        headCenterX: cx,
        headHalfWidth: 4.2 * s,
        eyeY: 18 - 7.2 * s * 0.62,
        eyeLeftX: -2.6,
        eyeRightX: 0.8,
        eyeWidth: 1.8,
        neckY: 18 - 7.2 * s * 0.62 + 3,
        neckHalfWidth: 4 * s,
        cloak: {
          claspY: 18 - 7.2 * b * 0.62 + 3.3,
          collarHw: eggCollar(18 - 7.2 * b * 0.62 + 3.3, 18, 5.6 * b, 7.2 * b),
          bodyCY: 18,
          bodyRx: 5.6 * b,
          bodyRy: 7.2 * b,
        },
      };
    }
    case 'axolotl': {
      // Großer Rundkopf r≈6.3 bei y=13 → Top ~6.7, Augen bei y≈13.3 (cx±3.1)
      const s = level >= 50 ? 1.16 : level >= 20 ? 1.12 : level >= 10 ? 1.05 : 1;
      return {
        headTopY: 13 - 6.3 * s,
        headCenterX: cx,
        headHalfWidth: 5.2 * s,
        eyeY: 13.3,
        eyeLeftX: -4.1,
        eyeRightX: 2.1,
        eyeWidth: 2,
        neckY: 18.5,
        neckHalfWidth: 4 * s,
        cloak: {
          claspY: 12.7 + 6.3 * b,
          collarHw: 4 * b + 0.6,
          bodyCY: 22,
          bodyRx: 4.6 * b,
          bodyRy: 4.2 * b,
        },
      };
    }
    default:
      return DEFAULT_ANCHORS;
  }
}

/** Teile, die hinter dem Körper liegen — vor dem Pet zeichnen. */
export const drawAccessoryBack = (
  ctx: CanvasRenderingContext2D,
  accessory: PetAccessory,
  ps: number,
  offset: number,
  petType: Parameters<typeof getAnchors>[0] = 'cat',
  level: number = 1
): void => {
  const a = getAnchors(petType, level);
  if (isCloakId(accessory.id)) drawCloakBack(ctx, ps, offset, a, accessory.id);
};

export const drawAccessory = (
  ctx: CanvasRenderingContext2D,
  accessory: PetAccessory,
  ps: number,
  offset: number,
  petType:
    | 'cat'
    | 'dog'
    | 'bird'
    | 'dragon'
    | 'fox'
    | 'rabbit'
    | 'panda'
    | 'owl'
    | 'penguin'
    | 'axolotl' = 'cat',
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
      drawCloakFront(ctx, ps, offset, a, 'cape');
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
      drawCloakFront(ctx, ps, offset, a, 'royalCape');
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
      drawCloakFront(ctx, ps, offset, a, 'galaxyCape');
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

    // ── Erweiterung Juli 2026 ──
    case 'sproutHat':
      drawSproutHat(ctx, ps, offset, a);
      break;
    case 'popcornHat':
      drawPopcornHat(ctx, ps, offset, a);
      break;
    case 'propellerCap':
      drawPropellerCap(ctx, ps, offset, a);
      break;
    case 'jesterHat':
      drawJesterHat(ctx, ps, offset, a);
      break;
    case 'detectiveHat':
      drawDetectiveHat(ctx, ps, offset, a);
      break;
    case 'winterCrown':
      drawWinterCrown(ctx, ps, offset, a);
      break;
    case 'divingHelmet':
      drawDivingHelmet(ctx, ps, offset, a);
      break;
    case 'crystalHorns':
      drawCrystalHorns(ctx, ps, offset, a);
      break;
    case 'jellyfishCrown':
      drawJellyfishCrown(ctx, ps, offset, a);
      break;
    case 'galaxyCrown':
      drawGalaxyCrown(ctx, ps, offset, a);
      break;
    case 'eyepatch':
      drawEyepatch(ctx, ps, offset, a);
      break;
    case 'blushStickers':
      drawBlushStickers(ctx, ps, offset, a);
      break;
    case 'mustache':
      drawMustache(ctx, ps, offset, a);
      break;
    case 'discoShades':
      drawDiscoShades(ctx, ps, offset, a);
      break;
    case 'snorkelMask':
      drawSnorkelMask(ctx, ps, offset, a);
      break;
    case 'goldenEyelashes':
      drawGoldenEyelashes(ctx, ps, offset, a);
      break;
    case 'vrHeadset':
      drawVrHeadset(ctx, ps, offset, a);
      break;
    case 'kitsuneMask':
      drawKitsuneMask(ctx, ps, offset, a);
      break;
    case 'thirdEye':
      drawThirdEye(ctx, ps, offset, a);
      break;
    case 'moonVisor':
      drawMoonVisor(ctx, ps, offset, a);
      break;
    case 'woolScarf':
      drawWoolScarf(ctx, ps, offset, a);
      break;
    case 'leafCape':
      drawCloakFront(ctx, ps, offset, a, 'leafCape');
      break;
    case 'seaweedScarf':
      drawSeaweedScarf(ctx, ps, offset, a);
      break;
    case 'headphonesNeck':
      drawHeadphonesNeck(ctx, ps, offset, a);
      break;
    case 'pearlNecklace':
      drawPearlNecklace(ctx, ps, offset, a);
      break;
    case 'filmstripScarf':
      drawFilmstripScarf(ctx, ps, offset, a);
      break;
    case 'discoChain':
      drawDiscoChain(ctx, ps, offset, a);
      break;
    case 'lavaAmulet':
      drawLavaAmulet(ctx, ps, offset, a);
      break;
    case 'auroraScarf':
      drawAuroraScarf(ctx, ps, offset, a);
      break;
    case 'krakenCharm':
      drawKrakenCharm(ctx, ps, offset, a);
      break;
  }
};
