import type { PetAccessory } from '../../types/pet.types';

/**
 * Anchor points per pet type - where accessories attach on the 32x32 grid.
 */
interface PetAnchors {
  headTopY: number;
  headCenterX: number;
  headHalfWidth: number;
  eyeY: number;
  eyeLeftX: number;
  eyeRightX: number;
  eyeWidth: number;
  neckY: number;
  neckHalfWidth: number;
}

function getAnchors(petType: 'cat' | 'dog' | 'bird' | 'dragon' | 'fox', level: number): PetAnchors {
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
  }
}

export const drawAccessory = (
  ctx: CanvasRenderingContext2D,
  accessory: PetAccessory,
  ps: number,
  offset: number,
  petType: 'cat' | 'dog' | 'bird' | 'dragon' | 'fox' = 'cat',
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

// ════════════════════════════════════════════════════════════
// HEAD ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawBeanie(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Cuff band
  ctx.fillStyle = '#4169E1';
  ctx.fillRect((cx - hw - 0.3) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 0.6), ps * 1.5);
  // Ribbed texture on cuff
  ctx.fillStyle = '#3157C0';
  for (let i = 0; i < Math.floor(hw * 2); i++) {
    ctx.fillRect((cx - hw + i + 0.3) * ps, (ty - 0.3) * ps + off, ps * 0.2, ps * 1.2);
  }
  // Dome
  ctx.fillStyle = '#4169E1';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 - 1), ps * 2.5);
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 3), ps * 1.5);
  // Pompom
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.8) * ps, (ty - 4.5) * ps + off, ps * 1.6, ps * 1.5);
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect((cx - 0.3) * ps, (ty - 4.2) * ps + off, ps * 0.4, ps * 0.4);
}

function drawBaseballCap(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Cap dome
  ctx.fillStyle = '#CC0000';
  ctx.fillRect((cx - hw) * ps, (ty - 1) * ps + off, ps * hw * 2, ps * 1.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2) * ps + off, ps * (hw * 2 - 1), ps * 1.5);
  // Brim - extends forward (left)
  ctx.fillStyle = '#990000';
  ctx.fillRect((cx - hw - 2.5) * ps, (ty + 0.2) * ps + off, ps * (hw + 2.5), ps * 0.8);
  ctx.fillRect((cx - hw - 3) * ps, (ty + 0.4) * ps + off, ps * 1.5, ps * 0.5);
  // Button on top
  ctx.fillStyle = '#FF3333';
  ctx.fillRect((cx - 0.3) * ps, (ty - 2.2) * ps + off, ps * 0.6, ps * 0.6);
}

function drawFlowerCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Vine base
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 0.3) * ps + off, ps * (hw * 2 + 1), ps * 0.6);
  // Flowers along the crown
  const flowerColors = ['#FF69B4', '#FFD700', '#FF6347', '#DA70D6', '#FFD700'];
  const positions = [-hw, -hw / 2, 0, hw / 2, hw - 0.5];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = flowerColors[i];
    ctx.fillRect((cx + positions[i] - 0.3) * ps, (ty - 1.2) * ps + off, ps * 0.8, ps * 0.8);
    ctx.fillRect((cx + positions[i] - 0.6) * ps, (ty - 0.8) * ps + off, ps * 0.4, ps * 0.4);
    ctx.fillRect((cx + positions[i] + 0.4) * ps, (ty - 0.8) * ps + off, ps * 0.4, ps * 0.4);
    // Center dot
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((cx + positions[i] - 0.1) * ps, (ty - 1) * ps + off, ps * 0.3, ps * 0.3);
  }
  // Leaves
  ctx.fillStyle = '#32CD32';
  ctx.fillRect((cx - hw - 0.8) * ps, (ty - 0.5) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx + hw + 0.3) * ps, (ty - 0.5) * ps + off, ps * 0.5, ps * 0.5);
}

function drawBandana(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors,
  color?: string
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const c = color || '#FF0000';

  // Band across forehead
  ctx.fillStyle = c;
  ctx.fillRect((cx - hw - 0.5) * ps, (ty + 0.5) * ps + off, ps * (hw * 2 + 1), ps * 1.5);
  // Darker fold
  ctx.fillStyle = darken(c, 40);
  ctx.fillRect((cx - hw - 0.5) * ps, (ty + 1.5) * ps + off, ps * (hw * 2 + 1), ps * 0.3);
  // Knot + tails on right
  ctx.fillStyle = c;
  ctx.fillRect((cx + hw) * ps, (ty + 0.2) * ps + off, ps * 2.5, ps * 1.5);
  ctx.fillRect((cx + hw + 1.5) * ps, (ty + 1.2) * ps + off, ps * 1, ps * 2.5);
  ctx.fillRect((cx + hw + 2) * ps, (ty + 0.8) * ps + off, ps * 0.8, ps * 2);
  // Tail tips
  ctx.fillStyle = darken(c, 40);
  ctx.fillRect((cx + hw + 1.5) * ps, (ty + 3.2) * ps + off, ps * 1, ps * 0.5);
  ctx.fillRect((cx + hw + 2) * ps, (ty + 2.3) * ps + off, ps * 0.8, ps * 0.5);
  // Dot pattern
  ctx.fillStyle = '#FFFFFF33';
  const spacing = (hw * 2) / 4;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect((cx - hw + 0.5 + i * spacing) * ps, (ty + 0.9) * ps + off, ps * 0.4, ps * 0.4);
  }
}

function drawPartyHat(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3);

  // Base band
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 1);
  // Striped cone
  const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FFD700', '#FF69B4'];
  for (let i = 0; i < 5; i++) {
    const w = hw * 2 - (i * (hw * 2 - 1)) / 5;
    ctx.fillStyle = colors[i];
    ctx.fillRect((cx - w / 2) * ps, (ty - 1.5 - i * 1.2) * ps + off, ps * w, ps * 1.2);
  }
  // Star on top
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.5) * ps, (ty - 8) * ps + off, ps * 1, ps * 1);
  ctx.fillRect((cx - 1) * ps, (ty - 7.5) * ps + off, ps * 2, ps * 0.5);
}

function drawTopHat(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Brim
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx - hw - 1) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 2), ps * 1);
  // Cylinder body
  ctx.fillStyle = '#222222';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 5.5) * ps + off, ps * (hw * 2 - 1), ps * 5.5);
  // Top
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 5.5) * ps + off, ps * (hw * 2 - 1), ps * 0.5);
  // Satin band
  ctx.fillStyle = '#8B0000';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 1.5) * ps + off, ps * (hw * 2 - 1), ps * 1);
  // Shine highlight
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - hw + 1) * ps, (ty - 4.5) * ps + off, ps * 0.5, ps * 3);
}

function drawSantaHat(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // White fur brim
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 1), ps * 1.5);
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty + 0.5) * ps + off, ps * (hw * 2 + 1), ps * 0.5);
  // Red body
  ctx.fillStyle = '#CC0000';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2) * ps + off, ps * (hw * 2 - 1), ps * 2);
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 3), ps * 2);
  ctx.fillRect((cx + 1) * ps, (ty - 4.5) * ps + off, ps * 3, ps * 1.5);
  ctx.fillRect((cx + 2.5) * ps, (ty - 5.5) * ps + off, ps * 2, ps * 1.5);
  // Dark fold
  ctx.fillStyle = '#990000';
  ctx.fillRect((cx - hw + 1) * ps, (ty - 1.5) * ps + off, ps * (hw - 1), ps * 0.5);
  // Pompom
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx + 3.5) * ps, (ty - 6.5) * ps + off, ps * 2, ps * 2);
  ctx.fillRect((cx + 3) * ps, (ty - 6) * ps + off, ps * 3, ps * 1);
}

function drawPirateHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Tricorn brim
  ctx.fillStyle = '#2B1B0E';
  ctx.fillRect((cx - hw - 2) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 4), ps * 1);
  // Upturned sides
  ctx.fillRect((cx - hw - 2) * ps, (ty - 2) * ps + off, ps * 2, ps * 2);
  ctx.fillRect((cx + hw) * ps, (ty - 2) * ps + off, ps * 2, ps * 2);
  // Crown
  ctx.fillStyle = '#1a0f06';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 1), ps * 3.5);
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 4.5) * ps + off, ps * (hw * 2 - 3), ps * 1.5);
  // Gold trim
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 0.8) * ps + off, ps * (hw * 2 - 1), ps * 0.4);
  // Skull & crossbones
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.6) * ps, (ty - 3) * ps + off, ps * 1.2, ps * 1.2);
  ctx.fillStyle = '#000000';
  ctx.fillRect((cx - 0.3) * ps, (ty - 2.7) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + 0.2) * ps, (ty - 2.7) * ps + off, ps * 0.3, ps * 0.3);
}

function drawWizardHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Wide brim
  ctx.fillStyle = '#2E1065';
  ctx.fillRect((cx - hw - 1.5) * ps, (ty - 0.3) * ps + off, ps * (hw * 2 + 3), ps * 1);
  // Cone
  ctx.fillStyle = '#3B1080';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 3) * ps + off, ps * (hw * 2 - 1), ps * 3);
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 5.5) * ps + off, ps * (hw * 2 - 3), ps * 3);
  ctx.fillRect((cx - 0.5) * ps, (ty - 7.5) * ps + off, ps * 2, ps * 2.5);
  ctx.fillRect(cx * ps, (ty - 8.5) * ps + off, ps * 1, ps * 1.5);
  // Bent tip
  ctx.fillRect((cx + 0.5) * ps, (ty - 8) * ps + off, ps * 1.5, ps * 1);
  // Stars
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, (ty - 2.5) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillRect((cx + 1) * ps, (ty - 4.5) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx - 0.5) * ps, (ty - 6) * ps + off, ps * 0.4, ps * 0.4);
  // Moon
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((cx + 0.5) * ps, (ty - 2) * ps + off, ps * 0.8, ps * 0.8);
}

function drawVikingHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Metal helmet dome
  ctx.fillStyle = '#808080';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2) * ps + off, ps * (hw * 2 - 1), ps * 2);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  // Nose guard
  ctx.fillStyle = '#6B6B6B';
  ctx.fillRect((cx - 0.4) * ps, (ty + 0.5) * ps + off, ps * 0.8, ps * 2);
  // Center ridge
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect((cx - 0.3) * ps, (ty - 3) * ps + off, ps * 0.6, ps * 3.5);
  // Horns!
  ctx.fillStyle = '#F5DEB3';
  // Left horn
  ctx.fillRect((cx - hw - 1) * ps, (ty - 1) * ps + off, ps * 1.5, ps * 1.5);
  ctx.fillRect((cx - hw - 2) * ps, (ty - 2.5) * ps + off, ps * 1.5, ps * 2);
  ctx.fillRect((cx - hw - 2.5) * ps, (ty - 4) * ps + off, ps * 1, ps * 2);
  ctx.fillRect((cx - hw - 2) * ps, (ty - 5) * ps + off, ps * 0.8, ps * 1.5);
  // Right horn
  ctx.fillRect((cx + hw - 0.5) * ps, (ty - 1) * ps + off, ps * 1.5, ps * 1.5);
  ctx.fillRect((cx + hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * 1.5, ps * 2);
  ctx.fillRect((cx + hw + 1.5) * ps, (ty - 4) * ps + off, ps * 1, ps * 2);
  ctx.fillRect((cx + hw + 1.2) * ps, (ty - 5) * ps + off, ps * 0.8, ps * 1.5);
  // Horn tips (lighter)
  ctx.fillStyle = '#FFF8DC';
  ctx.fillRect((cx - hw - 2) * ps, (ty - 5) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx + hw + 1.2) * ps, (ty - 5) * ps + off, ps * 0.5, ps * 0.5);
}

function drawCrown(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);

  // Base band
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - hw) * ps, (ty - 1) * ps + off, ps * hw * 2, ps * 1.5);
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - hw) * ps, (ty - 0.2) * ps + off, ps * hw * 2, ps * 0.5);
  // 5 prongs
  const px = [-hw + 0.5, -hw / 2, 0, hw / 2, hw - 0.5];
  const ph = [2.5, 3.5, 4, 3.5, 2.5];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((cx + px[i] - 0.4) * ps, (ty - 1 - ph[i]) * ps + off, ps * 0.8, ps * ph[i]);
  }
  // Jewels
  const jc = ['#FF0044', '#4488FF', '#FF0044', '#4488FF', '#FF0044'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = jc[i];
    ctx.fillRect((cx + px[i] - 0.3) * ps, (ty - 1 - ph[i] + 0.2) * ps + off, ps * 0.6, ps * 0.6);
  }
  // Band jewels
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - 1.2) * ps, (ty - 0.6) * ps + off, ps * 0.7, ps * 0.7);
  ctx.fillStyle = '#00AAFF';
  ctx.fillRect((cx + 0.5) * ps, (ty - 0.6) * ps + off, ps * 0.7, ps * 0.7);
}

function drawHalo(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Glowing ellipse above head
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.7;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 3) * ps + off, ps * (hw + 0.5), ps * 1, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Inner glow
  ctx.strokeStyle = '#FFEC8B';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 3) * ps + off, ps * (hw + 0.3), ps * 0.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Sparkle highlights
  ctx.fillStyle = '#FFFFFF88';
  ctx.fillRect((cx - hw) * ps, (ty - 3.3) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillRect((cx + hw - 0.5) * ps, (ty - 3.3) * ps + off, ps * 0.4, ps * 0.4);
}

function drawDevilHorns(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Left horn
  ctx.fillStyle = '#CC0000';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 1.5) * ps + off, ps * 1.5, ps * 1.5);
  ctx.fillRect((cx - hw) * ps, (ty - 3) * ps + off, ps * 1.2, ps * 2);
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 4.5) * ps + off, ps * 1, ps * 2);
  ctx.fillRect((cx - hw - 1) * ps, (ty - 5.5) * ps + off, ps * 0.8, ps * 1.5);
  // Right horn
  ctx.fillRect((cx + hw - 2) * ps, (ty - 1.5) * ps + off, ps * 1.5, ps * 1.5);
  ctx.fillRect((cx + hw - 0.2) * ps, (ty - 3) * ps + off, ps * 1.2, ps * 2);
  ctx.fillRect((cx + hw + 0.5) * ps, (ty - 4.5) * ps + off, ps * 1, ps * 2);
  ctx.fillRect((cx + hw + 1) * ps, (ty - 5.5) * ps + off, ps * 0.8, ps * 1.5);
  // Tips (brighter)
  ctx.fillStyle = '#FF3333';
  ctx.fillRect((cx - hw - 1) * ps, (ty - 5.5) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx + hw + 1) * ps, (ty - 5.5) * ps + off, ps * 0.5, ps * 0.5);
  // Dark inner shading
  ctx.fillStyle = '#8B0000';
  ctx.fillRect((cx - hw + 0.8) * ps, (ty - 1) * ps + off, ps * 0.3, ps * 1);
  ctx.fillRect((cx + hw - 1.1) * ps, (ty - 1) * ps + off, ps * 0.3, ps * 1);
}

// ════════════════════════════════════════════════════════════
// FACE ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawRoundGlasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  // Wire frames (thin circles)
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = ps * 0.4;
  // Left lens
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.stroke();
  // Right lens
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.stroke();
  // Bridge
  ctx.fillStyle = '#8B7355';
  ctx.fillRect((lx + ew) * ps, (ey + 0.1) * ps + off, ps * (rx - lx - ew), ps * 0.4);
  // Lens tint
  ctx.fillStyle = '#FFFFFF11';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.2), 0, Math.PI * 2);
  ctx.fill();
  // Temple arms
  ctx.fillStyle = '#8B7355';
  ctx.fillRect((lx - 1.2) * ps, (ey + 0.2) * ps + off, ps * 1, ps * 0.3);
  ctx.fillRect((rx + ew + 0.2) * ps, (ey + 0.2) * ps + off, ps * 1, ps * 0.3);
}

function drawSunglasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  // Bridge
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((lx + ew - 0.2) * ps, (ey + 0.2) * ps + off, ps * (rx - lx - ew + 0.4), ps * 0.6);
  // Left lens
  ctx.fillStyle = '#0D0D0D';
  ctx.fillRect((lx - 0.5) * ps, (ey - 0.5) * ps + off, ps * (ew + 1), ps * 2);
  ctx.fillStyle = '#FFFFFF22';
  ctx.fillRect((lx - 0.2) * ps, (ey - 0.2) * ps + off, ps * 0.8, ps * 0.5);
  // Right lens
  ctx.fillStyle = '#0D0D0D';
  ctx.fillRect((rx - 0.5) * ps, (ey - 0.5) * ps + off, ps * (ew + 1), ps * 2);
  ctx.fillStyle = '#FFFFFF22';
  ctx.fillRect((rx - 0.2) * ps, (ey - 0.2) * ps + off, ps * 0.8, ps * 0.5);
  // Frame top edge
  ctx.fillStyle = '#333333';
  ctx.fillRect((lx - 0.7) * ps, (ey - 0.7) * ps + off, ps * (ew + 1.4), ps * 0.5);
  ctx.fillRect((rx - 0.7) * ps, (ey - 0.7) * ps + off, ps * (ew + 1.4), ps * 0.5);
  // Arms
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((lx - 1.5) * ps, (ey + 0.2) * ps + off, ps * 1.2, ps * 0.5);
  ctx.fillRect((rx + ew + 0.3) * ps, (ey + 0.2) * ps + off, ps * 1.2, ps * 0.5);
}

function drawHeartGlasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  const drawHeart = (hx: number, hy: number, s: number) => {
    ctx.fillStyle = '#FF1493';
    // Top bumps
    ctx.fillRect((hx - s * 0.8) * ps, (hy - s * 0.3) * ps + off, ps * s * 0.8, ps * s * 0.6);
    ctx.fillRect((hx + s * 0.1) * ps, (hy - s * 0.3) * ps + off, ps * s * 0.8, ps * s * 0.6);
    // Body
    ctx.fillRect((hx - s * 0.7) * ps, (hy + s * 0.2) * ps + off, ps * s * 1.5, ps * s * 0.5);
    ctx.fillRect((hx - s * 0.5) * ps, (hy + s * 0.6) * ps + off, ps * s * 1.1, ps * s * 0.4);
    ctx.fillRect((hx - s * 0.2) * ps, (hy + s * 0.9) * ps + off, ps * s * 0.5, ps * s * 0.3);
    // Shine
    ctx.fillStyle = '#FF69B488';
    ctx.fillRect((hx - s * 0.6) * ps, (hy - s * 0.1) * ps + off, ps * 0.3, ps * 0.3);
  };

  // Left heart
  drawHeart(lx + ew / 2, ey + 0.3, 1.5);
  // Right heart
  drawHeart(rx + ew / 2, ey + 0.3, 1.5);
  // Bridge
  ctx.fillStyle = '#FF1493';
  ctx.fillRect((lx + ew) * ps, (ey + 0.2) * ps + off, ps * (rx - lx - ew), ps * 0.4);
  // Arms
  ctx.fillStyle = '#CC1177';
  ctx.fillRect((lx - 1.2) * ps, (ey + 0.2) * ps + off, ps * 1, ps * 0.4);
  ctx.fillRect((rx + ew + 0.2) * ps, (ey + 0.2) * ps + off, ps * 1, ps * 0.4);
}

function drawMonocle(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  // Gold rim
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.5;
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.7), 0, Math.PI * 2);
  ctx.stroke();
  // Glass with slight tint
  ctx.fillStyle = '#FFFFFF15';
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.4), 0, Math.PI * 2);
  ctx.fill();
  // Shine
  ctx.fillStyle = '#FFFFFF33';
  ctx.fillRect((rx + 0.2) * ps, (ey - 0.2) * ps + off, ps * 0.4, ps * 0.4);
  // Chain hanging down
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((rx + ew / 2) * ps, (ey + 0.3 + ew / 2 + 0.7) * ps + off);
  ctx.lineTo((rx + ew / 2 - 1) * ps, (ey + 4) * ps + off);
  ctx.lineTo((rx + ew / 2 - 0.5) * ps, (ey + 5.5) * ps + off);
  ctx.stroke();
}

function drawStarShades(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  const drawStar = (sx: number, sy: number, s: number) => {
    ctx.fillStyle = '#FFD700';
    // Horizontal bar
    ctx.fillRect((sx - s) * ps, (sy - s * 0.3) * ps + off, ps * s * 2, ps * s * 0.6);
    // Vertical bar
    ctx.fillRect((sx - s * 0.3) * ps, (sy - s) * ps + off, ps * s * 0.6, ps * s * 2);
    // Diagonals
    ctx.fillRect((sx - s * 0.7) * ps, (sy - s * 0.7) * ps + off, ps * s * 1.4, ps * s * 0.4);
    ctx.fillRect((sx - s * 0.7) * ps, (sy + s * 0.3) * ps + off, ps * s * 1.4, ps * s * 0.4);
    // Center
    ctx.fillStyle = '#FFA500';
    ctx.fillRect((sx - s * 0.2) * ps, (sy - s * 0.2) * ps + off, ps * s * 0.4, ps * s * 0.4);
  };

  drawStar(lx + ew / 2, ey + 0.3, 1.3);
  drawStar(rx + ew / 2, ey + 0.3, 1.3);
  // Bridge
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((lx + ew) * ps, (ey + 0.1) * ps + off, ps * (rx - lx - ew), ps * 0.4);
  // Arms
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((lx - 1.2) * ps, (ey + 0.1) * ps + off, ps * 1, ps * 0.4);
  ctx.fillRect((rx + ew + 0.2) * ps, (ey + 0.1) * ps + off, ps * 1, ps * 0.4);
}

function drawLaserVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;

  // Visor band
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 0.3) * ps + off, ps * (hw * 2 + 1), ps * 1.2);
  // Red laser line
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - hw) * ps, (ey + 0.1) * ps + off, ps * hw * 2, ps * 0.5);
  // Glow effect
  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = ps * 3;
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - hw) * ps, (ey + 0.2) * ps + off, ps * hw * 2, ps * 0.3);
  ctx.shadowBlur = 0;
  // Side pieces
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - hw - 1.5) * ps, (ey - 0.1) * ps + off, ps * 1.2, ps * 0.8);
  ctx.fillRect((cx + hw + 0.3) * ps, (ey - 0.1) * ps + off, ps * 1.2, ps * 0.8);
  // Red dots on sides
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - hw - 1) * ps, (ey + 0.1) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + hw + 0.8) * ps, (ey + 0.1) * ps + off, ps * 0.3, ps * 0.3);
}

// ════════════════════════════════════════════════════════════
// NECK ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawCollar(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors,
  color?: string
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const c = color || '#8B4513';

  // Band
  ctx.fillStyle = c;
  ctx.fillRect((cx - nhw) * ps, ny * ps + off, ps * nhw * 2, ps * 1.2);
  // Top edge shadow
  ctx.fillStyle = darken(c, 30);
  ctx.fillRect((cx - nhw) * ps, ny * ps + off, ps * nhw * 2, ps * 0.3);
  // Bottom edge highlight
  ctx.fillStyle = lighten(c, 20);
  ctx.fillRect((cx - nhw) * ps, (ny + 0.9) * ps + off, ps * nhw * 2, ps * 0.3);
  // Studs
  ctx.fillStyle = '#C0C0C0';
  const cnt = Math.max(3, Math.floor(nhw * 2));
  const sp = (nhw * 2 - 0.5) / (cnt - 1);
  for (let i = 0; i < cnt; i++) {
    ctx.fillRect((cx - nhw + 0.25 + i * sp) * ps, (ny + 0.3) * ps + off, ps * 0.5, ps * 0.5);
  }
  // Tag
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2.2) * ps + off, ps * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 1.5) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBow(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors,
  color?: string
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const c = color || '#FF69B4';
  const dk = darken(c, 40);

  // Left loop
  ctx.fillStyle = c;
  ctx.fillRect((cx - 3.5) * ps, (ny - 0.5) * ps + off, ps * 2.5, ps * 2);
  ctx.fillRect((cx - 4) * ps, ny * ps + off, ps * 3, ps * 1);
  ctx.fillStyle = dk;
  ctx.fillRect((cx - 3.5) * ps, (ny + 1) * ps + off, ps * 2, ps * 0.5);
  // Right loop
  ctx.fillStyle = c;
  ctx.fillRect((cx + 1) * ps, (ny - 0.5) * ps + off, ps * 2.5, ps * 2);
  ctx.fillRect((cx + 1) * ps, ny * ps + off, ps * 3, ps * 1);
  ctx.fillStyle = dk;
  ctx.fillRect((cx + 1.5) * ps, (ny + 1) * ps + off, ps * 2, ps * 0.5);
  // Knot
  ctx.fillStyle = dk;
  ctx.fillRect((cx - 0.8) * ps, (ny - 0.3) * ps + off, ps * 1.6, ps * 1.6);
  ctx.fillStyle = c;
  ctx.fillRect((cx - 0.5) * ps, (ny - 0.1) * ps + off, ps * 0.4, ps * 0.4);
  // Tails
  ctx.fillStyle = c;
  ctx.fillRect((cx - 1.5) * ps, (ny + 1.5) * ps + off, ps * 0.8, ps * 2);
  ctx.fillRect((cx + 0.7) * ps, (ny + 1.5) * ps + off, ps * 0.8, ps * 2.5);
}

function drawBowtie(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ny = a.neckY;

  // Butterfly shape
  ctx.fillStyle = '#1a1a1a';
  // Left wing
  ctx.fillRect((cx - 3) * ps, (ny - 0.2) * ps + off, ps * 2.5, ps * 1.5);
  ctx.fillRect((cx - 3.5) * ps, (ny + 0.2) * ps + off, ps * 3, ps * 0.8);
  // Right wing
  ctx.fillRect((cx + 0.5) * ps, (ny - 0.2) * ps + off, ps * 2.5, ps * 1.5);
  ctx.fillRect((cx + 0.5) * ps, (ny + 0.2) * ps + off, ps * 3, ps * 0.8);
  // Center knot
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - 0.5) * ps, (ny - 0.1) * ps + off, ps * 1, ps * 1.3);
  // Subtle texture
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect((cx - 2.5) * ps, (ny + 0.3) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + 2) * ps, (ny + 0.3) * ps + off, ps * 0.3, ps * 0.3);
}

function drawScarf(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;

  // Wrap
  ctx.fillStyle = '#B22222';
  ctx.fillRect((cx - nhw - 0.5) * ps, (ny - 0.5) * ps + off, ps * (nhw * 2 + 1), ps * 2);
  ctx.fillStyle = '#CC3333';
  ctx.fillRect((cx - nhw) * ps, (ny + 0.2) * ps + off, ps * nhw * 2, ps * 1.2);
  // Texture
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx - nhw) * ps, (ny + 0.2) * ps + off, ps * nhw * 2, ps * 0.2);
  ctx.fillRect((cx - nhw) * ps, (ny + 0.8) * ps + off, ps * nhw * 2, ps * 0.2);
  // Hanging end
  ctx.fillStyle = '#B22222';
  ctx.fillRect((cx - nhw - 1) * ps, (ny + 1.5) * ps + off, ps * 2, ps * 4);
  ctx.fillRect((cx - nhw - 1.5) * ps, (ny + 2) * ps + off, ps * 2.5, ps * 3);
  // Stripes on hanging end
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - nhw - 1) * ps, (ny + 2.5) * ps + off, ps * 2, ps * 0.4);
  ctx.fillRect((cx - nhw - 1) * ps, (ny + 3.5) * ps + off, ps * 2, ps * 0.4);
  // Fringe
  ctx.fillStyle = '#8B1A1A';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect((cx - nhw - 1.2 + i * 0.8) * ps, (ny + 5.5) * ps + off, ps * 0.4, ps * 1);
  }
}

function drawGoldChain(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;

  // Chain links across neck
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < Math.floor(nhw * 2); i++) {
    const lx = cx - nhw + 0.3 + i;
    ctx.fillRect(lx * ps, (ny + 0.2) * ps + off, ps * 0.7, ps * 0.7);
    // Link connector
    if (i < Math.floor(nhw * 2) - 1) {
      ctx.fillStyle = '#DAA520';
      ctx.fillRect((lx + 0.6) * ps, (ny + 0.4) * ps + off, ps * 0.4, ps * 0.3);
      ctx.fillStyle = '#FFD700';
    }
  }
  // Hanging V-shape
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, (ny + 0.9) * ps + off, ps * 0.5, ps * 1.5);
  ctx.fillRect((cx + 1) * ps, (ny + 0.9) * ps + off, ps * 0.5, ps * 1.5);
  ctx.fillRect((cx - 1) * ps, (ny + 2) * ps + off, ps * 0.5, ps * 1);
  ctx.fillRect((cx + 0.5) * ps, (ny + 2) * ps + off, ps * 0.5, ps * 1);
  // Pendant
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.6) * ps, (ny + 2.8) * ps + off, ps * 1.2, ps * 1.2);
  // Diamond in pendant
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect((cx - 0.3) * ps, (ny + 3.1) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx - 0.1) * ps, (ny + 3.2) * ps + off, ps * 0.2, ps * 0.2);
}

function drawCape(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;

  // Cape clasp at neck
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1) * ps, (ny - 0.3) * ps + off, ps * 2, ps * 1);
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - 0.3) * ps, (ny - 0.1) * ps + off, ps * 0.6, ps * 0.6);
  // Cape body (flowing behind)
  ctx.fillStyle = '#8B0000';
  ctx.fillRect((cx - nhw - 1) * ps, (ny + 0.5) * ps + off, ps * (nhw * 2 + 2), ps * 8);
  ctx.fillRect((cx - nhw - 1.5) * ps, (ny + 2) * ps + off, ps * (nhw * 2 + 3), ps * 5);
  ctx.fillRect((cx - nhw - 1) * ps, (ny + 7) * ps + off, ps * (nhw * 2 + 2), ps * 2);
  // Inner lining
  ctx.fillStyle = '#4B0082';
  ctx.fillRect((cx - nhw) * ps, (ny + 1) * ps + off, ps * nhw * 2, ps * 6);
  // Bottom edge (scalloped)
  ctx.fillStyle = '#8B0000';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(
      (cx - nhw + (i * (nhw * 2)) / 3) * ps,
      (ny + 8.5) * ps + off,
      ps * ((nhw * 2) / 3 - 0.3),
      ps * 0.8
    );
  }
}

function drawMedal(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ny = a.neckY;

  // Ribbon (V-shape)
  ctx.fillStyle = '#1E90FF';
  ctx.fillRect((cx - 1.2) * ps, ny * ps + off, ps * 0.6, ps * 2.5);
  ctx.fillRect((cx + 0.6) * ps, ny * ps + off, ps * 0.6, ps * 2.5);
  // Ribbon cross
  ctx.fillRect((cx - 0.8) * ps, (ny + 0.5) * ps + off, ps * 1.6, ps * 0.4);
  // Medal disc
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 3.5) * ps + off, ps * 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Medal rim
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 3.5) * ps + off, ps * 1, 0, Math.PI * 2);
  ctx.stroke();
  // Star on medal
  ctx.fillStyle = '#FFA500';
  ctx.fillRect((cx - 0.3) * ps, (ny + 3) * ps + off, ps * 0.6, ps * 1);
  ctx.fillRect((cx - 0.6) * ps, (ny + 3.2) * ps + off, ps * 1.2, ps * 0.6);
  // Shine
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx - 0.6) * ps, (ny + 3) * ps + off, ps * 0.3, ps * 0.3);
}

// ════════════════════════════════════════════════════════════
// NEW HEAD ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawBeret(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Flat body leaning right
  ctx.fillStyle = '#2E2E2E';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 1), ps * 1.2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 1.5) * ps + off, ps * (hw * 2 + 0.5), ps * 1.5);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 - 0.5), ps * 1.5);
  // Stem on top
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx + 0.5) * ps, (ty - 3) * ps + off, ps * 0.8, ps * 0.8);
  // Highlight
  ctx.fillStyle = '#444444';
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 1.8) * ps + off, ps * 1, ps * 0.5);
}

function drawHeadband(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Elastic band
  ctx.fillStyle = '#FF4444';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty + 0.5) * ps + off, ps * (hw * 2 + 1), ps * 1);
  // Nike-style swoosh
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 1) * ps, (ty + 0.7) * ps + off, ps * 2, ps * 0.3);
  ctx.fillRect((cx - 0.5) * ps, (ty + 0.9) * ps + off, ps * 1.5, ps * 0.3);
}

function drawCowboyHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Wide brim
  ctx.fillStyle = '#8B6914';
  ctx.fillRect((cx - hw - 2.5) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 5), ps * 1);
  // Curved up edges
  ctx.fillRect((cx - hw - 3) * ps, (ty - 1.5) * ps + off, ps * 1.5, ps * 1.5);
  ctx.fillRect((cx + hw + 1.5) * ps, (ty - 1.5) * ps + off, ps * 1.5, ps * 1.5);
  // Crown
  ctx.fillStyle = '#A0782C';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 1), ps * 3.5);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 4.5) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  // Flat top with indent
  ctx.fillStyle = '#8B6914';
  ctx.fillRect((cx - 1) * ps, (ty - 4.5) * ps + off, ps * 2, ps * 0.5);
  // Band
  ctx.fillStyle = '#5C3D10';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 1) * ps + off, ps * (hw * 2 - 1), ps * 0.6);
}

function drawGraduationCap(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Square board (mortarboard)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx - hw - 2) * ps, (ty - 2) * ps + off, ps * (hw * 2 + 4), ps * 1);
  // Skull cap
  ctx.fillStyle = '#222222';
  ctx.fillRect((cx - hw) * ps, (ty - 1.5) * ps + off, ps * hw * 2, ps * 2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2) * ps + off, ps * (hw * 2 - 1), ps * 1);
  // Button on top
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.3) * ps, (ty - 2.3) * ps + off, ps * 0.6, ps * 0.6);
  // Tassel
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx + hw + 1) * ps, (ty - 2) * ps + off, ps * 0.3, ps * 3);
  ctx.fillRect((cx + hw + 0.5) * ps, (ty + 0.5) * ps + off, ps * 0.5, ps * 1.5);
  ctx.fillRect((cx + hw + 0.3) * ps, (ty + 1.5) * ps + off, ps * 0.8, ps * 0.5);
}

function drawStrawHat(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Wide brim
  ctx.fillStyle = '#DEB887';
  ctx.fillRect((cx - hw - 2) * ps, (ty - 0.3) * ps + off, ps * (hw * 2 + 4), ps * 0.8);
  // Dome
  ctx.fillStyle = '#F5DEB3';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 - 1), ps * 2.5);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  // Straw weave texture
  ctx.fillStyle = '#D2B48C';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect((cx - hw + 1) * ps, (ty - 3 + i * 0.8) * ps + off, ps * (hw * 2 - 2), ps * 0.2);
  }
  // Red ribbon
  ctx.fillStyle = '#CC0000';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 0.8) * ps + off, ps * (hw * 2 - 1), ps * 0.6);
}

function drawMilitaryHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Dome
  ctx.fillStyle = '#556B2F';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 1), ps * 2);
  ctx.fillRect((cx - hw) * ps, (ty - 2) * ps + off, ps * hw * 2, ps * 2);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  // Rim
  ctx.fillStyle = '#4B5320';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty + 0.8) * ps + off, ps * (hw * 2 + 1), ps * 0.5);
  // Camo spots
  ctx.fillStyle = '#6B8E23';
  ctx.fillRect((cx - 1.5) * ps, (ty - 1.5) * ps + off, ps * 1, ps * 0.8);
  ctx.fillRect((cx + 0.5) * ps, (ty - 2.2) * ps + off, ps * 0.8, ps * 0.6);
  ctx.fillStyle = '#3B4F1A';
  ctx.fillRect((cx - 0.5) * ps, (ty - 0.5) * ps + off, ps * 1.2, ps * 0.6);
}

function drawAstronautHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // White outer shell
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect((cx - hw - 1) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 2), ps * 3);
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 + 1), ps * 2.5);
  ctx.fillRect((cx - hw) * ps, (ty - 3.5) * ps + off, ps * hw * 2, ps * 1.5);
  // Blue visor
  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 - 1), ps * 2);
  // Visor reflection
  ctx.fillStyle = '#4488BB55';
  ctx.fillRect((cx - hw + 1) * ps, (ty - 0.3) * ps + off, ps * 1, ps * 1.2);
  // Gold visor strip
  ctx.fillStyle = '#FFD70066';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty + 0.5) * ps + off, ps * (hw * 2 - 1), ps * 0.3);
}

function drawUnicornHorn(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  // Spiral horn
  const colors = ['#FFB6C1', '#E6E6FA', '#FFD700', '#FFB6C1', '#E6E6FA'];
  for (let i = 0; i < 5; i++) {
    const w = 1.5 - i * 0.2;
    ctx.fillStyle = colors[i];
    ctx.fillRect((cx - w / 2) * ps, (ty - 2 - i * 1.3) * ps + off, ps * w, ps * 1.5);
  }
  // Sparkle tip
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.2) * ps, (ty - 8.5) * ps + off, ps * 0.4, ps * 0.6);
  // Sparkles around
  ctx.fillStyle = '#FFD70088';
  ctx.fillRect((cx - 1.5) * ps, (ty - 5) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + 1.2) * ps, (ty - 3.5) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + 1.5) * ps, (ty - 6) * ps + off, ps * 0.3, ps * 0.3);
}

function drawRobotHead(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Metal plate
  ctx.fillStyle = '#808080';
  ctx.fillRect((cx - hw) * ps, (ty - 1) * ps + off, ps * hw * 2, ps * 1.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 - 1), ps * 2);
  // Antenna
  ctx.fillStyle = '#555555';
  ctx.fillRect((cx - 0.2) * ps, (ty - 5) * ps + off, ps * 0.4, ps * 2.5);
  // Antenna tip (blinking)
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - 0.4) * ps, (ty - 5.5) * ps + off, ps * 0.8, ps * 0.8);
  // Bolts
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 1.5) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx + hw - 1) * ps, (ty - 1.5) * ps + off, ps * 0.5, ps * 0.5);
  // Visor line
  ctx.fillStyle = '#00FF00';
  ctx.fillRect((cx - hw + 1) * ps, (ty - 0.3) * ps + off, ps * (hw * 2 - 2), ps * 0.3);
}

function drawAlienAntenna(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Left stalk
  ctx.fillStyle = '#32CD32';
  ctx.fillRect((cx - hw + 1) * ps, (ty - 5) * ps + off, ps * 0.4, ps * 4.5);
  // Right stalk
  ctx.fillRect((cx + hw - 1.4) * ps, (ty - 6) * ps + off, ps * 0.4, ps * 5.5);
  // Left orb (glowing)
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.arc((cx - hw + 1.2) * ps, (ty - 5.5) * ps + off, ps * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF55';
  ctx.fillRect((cx - hw + 0.8) * ps, (ty - 5.8) * ps + off, ps * 0.3, ps * 0.3);
  // Right orb
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.arc((cx + hw - 1.2) * ps, (ty - 6.5) * ps + off, ps * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF55';
  ctx.fillRect((cx + hw - 1.6) * ps, (ty - 6.8) * ps + off, ps * 0.3, ps * 0.3);
  // Headband
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - hw) * ps, (ty - 0.3) * ps + off, ps * hw * 2, ps * 0.8);
}

// ════════════════════════════════════════════════════════════
// NEW FACE ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawTheatreMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Half mask (right side)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.5) * ps, (ey - 1) * ps + off, ps * (hw + 1), ps * 3);
  ctx.fillRect(cx * ps, (ey - 1.5) * ps + off, ps * hw, ps * 1);
  // Eye hole
  ctx.fillStyle = '#000000';
  ctx.fillRect((cx + 1) * ps, (ey - 0.3) * ps + off, ps * 1.5, ps * 0.8);
  // Decorative swirl
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx + 0.5) * ps, (ey + 1) * ps + off, ps * 2, ps * 0.3);
  ctx.fillRect((cx + 2) * ps, (ey + 0.5) * ps + off, ps * 0.3, ps * 0.8);
}

function drawSurgeonMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Mask body
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect((cx - hw) * ps, (ey + 0.5) * ps + off, ps * hw * 2, ps * 2.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ey + 2.5) * ps + off, ps * (hw * 2 - 1), ps * 1);
  // Ear straps
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey + 0.5) * ps + off, ps * 0.8, ps * 0.3);
  ctx.fillRect((cx + hw - 0.3) * ps, (ey + 0.5) * ps + off, ps * 0.8, ps * 0.3);
  // Pleats
  ctx.fillStyle = '#6BB8D6';
  ctx.fillRect((cx - hw + 0.5) * ps, (ey + 1.2) * ps + off, ps * (hw * 2 - 1), ps * 0.2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ey + 1.8) * ps + off, ps * (hw * 2 - 1), ps * 0.2);
}

function drawNerdGlasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Thick black frames
  ctx.fillStyle = '#1a1a1a';
  // Left lens frame
  ctx.fillRect((lx - 0.8) * ps, (ey - 0.8) * ps + off, ps * (ew + 1.6), ps * 2.5);
  ctx.fillStyle = '#FFFFFF22';
  ctx.fillRect((lx - 0.3) * ps, (ey - 0.3) * ps + off, ps * (ew + 0.6), ps * 1.8);
  // Right lens frame
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((rx - 0.8) * ps, (ey - 0.8) * ps + off, ps * (ew + 1.6), ps * 2.5);
  ctx.fillStyle = '#FFFFFF22';
  ctx.fillRect((rx - 0.3) * ps, (ey - 0.3) * ps + off, ps * (ew + 0.6), ps * 1.8);
  // Thick bridge
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((lx + ew) * ps, (ey - 0.2) * ps + off, ps * (rx - lx - ew), ps * 0.8);
  // Tape on bridge
  ctx.fillStyle = '#FFFFFF88';
  ctx.fillRect((cx - 0.3) * ps, (ey - 0.4) * ps + off, ps * 0.6, ps * 1.2);
  // Arms
  ctx.fillRect((lx - 1.5) * ps, (ey + 0.2) * ps + off, ps * 1, ps * 0.4);
  ctx.fillRect((rx + ew + 0.3) * ps, (ey + 0.2) * ps + off, ps * 1, ps * 0.4);
}

function drawClownNose(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  // Big red nose
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 1.5) * ps + off, ps * 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#FF666688';
  ctx.fillRect((cx - 0.5) * ps, (ey + 0.8) * ps + off, ps * 0.4, ps * 0.4);
  // Shine
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx - 0.3) * ps, (ey + 1) * ps + off, ps * 0.3, ps * 0.3);
}

function drawCyclopsEye(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  // Large single eye
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.3) * ps + off, ps * 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Iris
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.3) * ps + off, ps * 1.1, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.3) * ps + off, ps * 0.6, 0, Math.PI * 2);
  ctx.fill();
  // Reflection
  ctx.fillStyle = '#FFFFFF88';
  ctx.fillRect((cx - 0.4) * ps, (ey - 0.3) * ps + off, ps * 0.4, ps * 0.4);
  // Eyebrow
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - 1.5) * ps, (ey - 1.2) * ps + off, ps * 3, ps * 0.5);
}

function drawSkiGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Strap
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - hw - 1) * ps, (ey - 0.5) * ps + off, ps * (hw * 2 + 2), ps * 0.5);
  // Frame
  ctx.fillStyle = '#FF4500';
  ctx.fillRect((cx - hw) * ps, (ey - 0.8) * ps + off, ps * hw * 2, ps * 2.2);
  // Lens (mirrored)
  ctx.fillStyle = '#4169E1';
  ctx.fillRect((cx - hw + 0.5) * ps, (ey - 0.4) * ps + off, ps * (hw * 2 - 1), ps * 1.5);
  // Rainbow reflection
  ctx.fillStyle = '#FFD70044';
  ctx.fillRect((cx - hw + 1) * ps, (ey - 0.2) * ps + off, ps * 2, ps * 0.5);
  ctx.fillStyle = '#FF450044';
  ctx.fillRect((cx - hw + 1) * ps, (ey + 0.3) * ps + off, ps * 1.5, ps * 0.4);
}

function drawVisionVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Sleek visor
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 0.5) * ps + off, ps * (hw * 2 + 1), ps * 1.5);
  // Green HUD display
  ctx.fillStyle = '#00FF0066';
  ctx.fillRect((cx - hw) * ps, (ey - 0.2) * ps + off, ps * hw * 2, ps * 1);
  // Targeting reticle
  ctx.fillStyle = '#00FF00';
  ctx.fillRect((cx - 0.5) * ps, (ey + 0.1) * ps + off, ps * 1, ps * 0.15);
  ctx.fillRect((cx - 0.1) * ps, (ey - 0.2) * ps + off, ps * 0.15, ps * 1);
  // Side modules
  ctx.fillStyle = '#444444';
  ctx.fillRect((cx - hw - 1.5) * ps, (ey - 0.3) * ps + off, ps * 1.2, ps * 1);
  ctx.fillRect((cx + hw + 0.3) * ps, (ey - 0.3) * ps + off, ps * 1.2, ps * 1);
  // Blue LED
  ctx.fillStyle = '#00AAFF';
  ctx.fillRect((cx + hw + 0.6) * ps, (ey + 0.1) * ps + off, ps * 0.3, ps * 0.3);
}

function drawDiamondMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Faceted mask
  ctx.fillStyle = '#B9F2FF';
  ctx.fillRect((cx - hw) * ps, (ey - 1) * ps + off, ps * hw * 2, ps * 2.5);
  // Facet lines
  ctx.fillStyle = '#E0FFFF44';
  ctx.fillRect((cx - hw + 1) * ps, (ey - 0.8) * ps + off, ps * 0.2, ps * 2);
  ctx.fillRect((cx + hw - 1.2) * ps, (ey - 0.8) * ps + off, ps * 0.2, ps * 2);
  ctx.fillRect((cx - 0.1) * ps, (ey - 1) * ps + off, ps * 0.2, ps * 2.5);
  // Eye holes with sparkle
  ctx.fillStyle = '#000000';
  ctx.fillRect((cx - hw + 1) * ps, (ey - 0.2) * ps + off, ps * 1.5, ps * 0.8);
  ctx.fillRect((cx + hw - 2.5) * ps, (ey - 0.2) * ps + off, ps * 1.5, ps * 0.8);
  // Diamond sparkles
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw + 0.3) * ps, (ey - 0.8) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + hw - 0.6) * ps, (ey + 0.8) * ps + off, ps * 0.3, ps * 0.3);
}

// ════════════════════════════════════════════════════════════
// NEW NECK ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawTie(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Knot
  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect((cx - 0.6) * ps, (ny - 0.2) * ps + off, ps * 1.2, ps * 1);
  // Tie body (widening)
  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect((cx - 0.8) * ps, (ny + 0.8) * ps + off, ps * 1.6, ps * 2);
  ctx.fillRect((cx - 1) * ps, (ny + 2.5) * ps + off, ps * 2, ps * 2.5);
  ctx.fillRect((cx - 1.2) * ps, (ny + 4) * ps + off, ps * 2.4, ps * 1.5);
  // Tip (pointed)
  ctx.fillRect((cx - 0.8) * ps, (ny + 5.5) * ps + off, ps * 1.6, ps * 1);
  ctx.fillRect((cx - 0.4) * ps, (ny + 6.5) * ps + off, ps * 0.8, ps * 0.5);
  // Diagonal stripe
  ctx.fillStyle = '#CC0000';
  ctx.fillRect((cx - 0.5) * ps, (ny + 2) * ps + off, ps * 1.5, ps * 0.4);
  ctx.fillRect((cx - 0.3) * ps, (ny + 3.5) * ps + off, ps * 1.8, ps * 0.4);
}

function drawBandkerchief(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Triangular bandana around neck
  ctx.fillStyle = '#FF6347';
  ctx.fillRect((cx - nhw) * ps, ny * ps + off, ps * nhw * 2, ps * 1);
  // Triangle pointing down
  ctx.fillRect((cx - nhw + 0.5) * ps, (ny + 1) * ps + off, ps * (nhw * 2 - 1), ps * 1);
  ctx.fillRect((cx - nhw + 1) * ps, (ny + 2) * ps + off, ps * (nhw * 2 - 2), ps * 1);
  ctx.fillRect((cx - 1) * ps, (ny + 3) * ps + off, ps * 2, ps * 0.8);
  ctx.fillRect((cx - 0.5) * ps, (ny + 3.5) * ps + off, ps * 1, ps * 0.5);
  // Pattern dots
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx - 1.5) * ps, (ny + 1.5) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + 1.2) * ps, (ny + 1.5) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect(cx * ps, (ny + 2.5) * ps + off, ps * 0.3, ps * 0.3);
}

function drawLocket(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Thin chain
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((cx - 1) * ps, ny * ps + off, ps * 0.3, ps * 2);
  ctx.fillRect((cx + 0.7) * ps, ny * ps + off, ps * 0.3, ps * 2);
  ctx.fillRect((cx - 0.5) * ps, (ny + 1.8) * ps + off, ps * 0.3, ps * 1);
  ctx.fillRect((cx + 0.2) * ps, (ny + 1.8) * ps + off, ps * 0.3, ps * 1);
  // Heart locket
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.8) * ps, (ny + 2.8) * ps + off, ps * 0.8, ps * 0.8);
  ctx.fillRect(cx * ps, (ny + 2.8) * ps + off, ps * 0.8, ps * 0.8);
  ctx.fillRect((cx - 0.6) * ps, (ny + 3.4) * ps + off, ps * 1.2, ps * 0.6);
  ctx.fillRect((cx - 0.3) * ps, (ny + 3.8) * ps + off, ps * 0.6, ps * 0.4);
  // Heart center
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect((cx - 0.2) * ps, (ny + 3) * ps + off, ps * 0.4, ps * 0.6);
}

function drawBellCollar(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Red collar
  ctx.fillStyle = '#CC0000';
  ctx.fillRect((cx - nhw) * ps, ny * ps + off, ps * nhw * 2, ps * 1);
  // Bell
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2) * ps + off, ps * 0.9, 0, Math.PI * 2);
  ctx.fill();
  // Bell slit
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - 0.1) * ps, (ny + 1.5) * ps + off, ps * 0.2, ps * 1.2);
  // Bell clapper
  ctx.fillStyle = '#B8860B';
  ctx.fillRect((cx - 0.15) * ps, (ny + 2.5) * ps + off, ps * 0.3, ps * 0.3);
  // Shine
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx - 0.5) * ps, (ny + 1.5) * ps + off, ps * 0.3, ps * 0.3);
}

function drawFlowerGarland(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Vine
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - nhw) * ps, (ny + 0.2) * ps + off, ps * nhw * 2, ps * 0.5);
  // Flowers
  const colors = ['#FF69B4', '#FFD700', '#FF6347', '#DA70D6', '#87CEEB'];
  const cnt = Math.max(3, Math.floor(nhw * 2));
  const sp = (nhw * 2 - 0.5) / (cnt - 1);
  for (let i = 0; i < cnt; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect((cx - nhw + 0.1 + i * sp) * ps, (ny - 0.2) * ps + off, ps * 0.6, ps * 0.6);
    // Leaf
    ctx.fillStyle = '#32CD32';
    ctx.fillRect((cx - nhw + 0.3 + i * sp) * ps, (ny + 0.5) * ps + off, ps * 0.3, ps * 0.3);
  }
}

function drawRubyPendant(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Silver chain
  ctx.fillStyle = '#C0C0C0';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect((cx + i * 0.8) * ps, (ny + Math.abs(i) * 0.3) * ps + off, ps * 0.4, ps * 0.4);
  }
  // Ruby gem
  ctx.fillStyle = '#DC143C';
  ctx.fillRect((cx - 0.6) * ps, (ny + 1.5) * ps + off, ps * 1.2, ps * 1.2);
  ctx.fillRect((cx - 0.3) * ps, (ny + 1.2) * ps + off, ps * 0.6, ps * 0.5);
  ctx.fillRect((cx - 0.3) * ps, (ny + 2.5) * ps + off, ps * 0.6, ps * 0.3);
  // Facet shine
  ctx.fillStyle = '#FF6B6B44';
  ctx.fillRect((cx - 0.3) * ps, (ny + 1.6) * ps + off, ps * 0.4, ps * 0.4);
}

function drawAnchorChain(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Chain
  ctx.fillStyle = '#808080';
  ctx.fillRect((cx - 1) * ps, ny * ps + off, ps * 0.3, ps * 2);
  ctx.fillRect((cx + 0.7) * ps, ny * ps + off, ps * 0.3, ps * 2);
  // Anchor
  ctx.fillStyle = '#4a4a4a';
  // Shaft
  ctx.fillRect((cx - 0.15) * ps, (ny + 2) * ps + off, ps * 0.3, ps * 2.5);
  // Cross bar
  ctx.fillRect((cx - 1) * ps, (ny + 2.5) * ps + off, ps * 2, ps * 0.3);
  // Flukes (curved bottom)
  ctx.fillRect((cx - 1.2) * ps, (ny + 4) * ps + off, ps * 0.5, ps * 0.8);
  ctx.fillRect((cx + 0.7) * ps, (ny + 4) * ps + off, ps * 0.5, ps * 0.8);
  ctx.fillRect((cx - 1.5) * ps, (ny + 3.8) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx + 1) * ps, (ny + 3.8) * ps + off, ps * 0.5, ps * 0.5);
  // Ring at top
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 1.8) * ps + off, ps * 0.5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRoyalSash(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Diagonal sash
  ctx.fillStyle = '#4169E1';
  ctx.fillRect((cx - nhw - 0.5) * ps, (ny - 0.5) * ps + off, ps * 2, ps * 8);
  ctx.fillRect((cx - nhw + 1) * ps, (ny + 0.5) * ps + off, ps * 2, ps * 7);
  // Gold trim
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - nhw - 0.5) * ps, (ny - 0.5) * ps + off, ps * 0.3, ps * 8);
  ctx.fillRect((cx - nhw + 1.5) * ps, (ny - 0.5) * ps + off, ps * 0.3, ps * 8);
  // Medal on sash
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc((cx - nhw + 0.7) * ps, (ny + 3) * ps + off, ps * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - nhw + 0.4) * ps, (ny + 2.8) * ps + off, ps * 0.5, ps * 0.5);
}

function drawDragonPendant(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Dark chain
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 0.3, ps * 1.5);
  ctx.fillRect((cx + 1.2) * ps, ny * ps + off, ps * 0.3, ps * 1.5);
  // Dragon head pendant
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - 1) * ps, (ny + 1.5) * ps + off, ps * 2, ps * 2);
  ctx.fillRect((cx - 0.5) * ps, (ny + 3.5) * ps + off, ps * 1, ps * 0.8);
  // Dragon eyes
  ctx.fillStyle = '#FF4500';
  ctx.fillRect((cx - 0.5) * ps, (ny + 1.8) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillRect((cx + 0.3) * ps, (ny + 1.8) * ps + off, ps * 0.4, ps * 0.4);
  // Horns
  ctx.fillStyle = '#1a5c1a';
  ctx.fillRect((cx - 1.2) * ps, (ny + 1.2) * ps + off, ps * 0.5, ps * 0.6);
  ctx.fillRect((cx + 0.7) * ps, (ny + 1.2) * ps + off, ps * 0.5, ps * 0.6);
  // Gem in mouth
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - 0.2) * ps, (ny + 2.8) * ps + off, ps * 0.4, ps * 0.4);
}

function drawPhoenixFeatherNeck(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Gold chain
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.4);
  // Feather shape
  ctx.fillStyle = '#FF4500';
  ctx.fillRect((cx - 0.3) * ps, (ny + 0.5) * ps + off, ps * 0.6, ps * 5);
  ctx.fillStyle = '#FF6347';
  ctx.fillRect((cx - 0.8) * ps, (ny + 1.5) * ps + off, ps * 1.6, ps * 3);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.5) * ps, (ny + 2) * ps + off, ps * 1, ps * 2);
  // Quill center
  ctx.fillStyle = '#FFFFFF88';
  ctx.fillRect((cx - 0.05) * ps, (ny + 0.8) * ps + off, ps * 0.1, ps * 4.5);
  // Fire tips
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.2) * ps, (ny + 5) * ps + off, ps * 0.4, ps * 0.5);
}

function drawCosmicAmulet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Silver chain
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.3);
  // Amulet circle
  ctx.fillStyle = '#1a0a3e';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2.5) * ps + off, ps * 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Galaxy swirl inside
  ctx.fillStyle = '#9C27B0';
  ctx.fillRect((cx - 0.8) * ps, (ny + 1.8) * ps + off, ps * 0.4, ps * 0.8);
  ctx.fillRect((cx + 0.3) * ps, (ny + 2.5) * ps + off, ps * 0.5, ps * 0.8);
  // Stars
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.5) * ps, (ny + 2.2) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx + 0.5) * ps, (ny + 1.8) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx - 0.2) * ps, (ny + 3) * ps + off, ps * 0.2, ps * 0.2);
  // Outer glow
  ctx.strokeStyle = '#9C27B044';
  ctx.lineWidth = ps * 0.5;
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2.5) * ps + off, ps * 1.8, 0, Math.PI * 2);
  ctx.stroke();
  // Gold rim
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2.5) * ps + off, ps * 1.5, 0, Math.PI * 2);
  ctx.stroke();
}

// ════════════════════════════════════════════════════════════
// SPIN EXCLUSIVE ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawDiamondTiara(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Silver band
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 1);
  // Tiara peaks
  const peaks = [-hw + 0.5, -1, 0, 1, hw - 0.5];
  const heights = [2, 3, 4, 3, 2];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(
      (cx + peaks[i] - 0.3) * ps,
      (ty - 0.5 - heights[i]) * ps + off,
      ps * 0.6,
      ps * heights[i]
    );
    // Diamond on each peak
    ctx.fillStyle = '#B9F2FF';
    ctx.fillRect(
      (cx + peaks[i] - 0.2) * ps,
      (ty - 0.5 - heights[i] + 0.2) * ps + off,
      ps * 0.4,
      ps * 0.4
    );
  }
  // Center large diamond
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect((cx - 0.4) * ps, (ty - 4.8) * ps + off, ps * 0.8, ps * 0.8);
  ctx.fillStyle = '#FFFFFF55';
  ctx.fillRect((cx - 0.2) * ps, (ty - 4.6) * ps + off, ps * 0.3, ps * 0.3);
}

function drawNinjaMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Black mask wrapping around head
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 1) * ps + off, ps * (hw * 2 + 1), ps * 3);
  // Eye slit
  ctx.fillStyle = '#000000';
  ctx.fillRect((cx - hw) * ps, (ey - 0.3) * ps + off, ps * hw * 2, ps * 1);
  // Red headband accent
  ctx.fillStyle = '#CC0000';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 1.3) * ps + off, ps * (hw * 2 + 1), ps * 0.5);
  // Trailing tails
  ctx.fillRect((cx + hw) * ps, (ey - 1.3) * ps + off, ps * 2.5, ps * 0.4);
  ctx.fillRect((cx + hw + 1.5) * ps, (ey - 0.8) * ps + off, ps * 2, ps * 0.3);
}

function drawRoyalCape(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Gold clasp
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, (ny - 0.3) * ps + off, ps * 3, ps * 1);
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - 0.3) * ps, (ny - 0.1) * ps + off, ps * 0.6, ps * 0.6);
  // Deep purple cape
  ctx.fillStyle = '#4B0082';
  ctx.fillRect((cx - nhw - 2) * ps, (ny + 0.5) * ps + off, ps * (nhw * 2 + 4), ps * 9);
  ctx.fillRect((cx - nhw - 2.5) * ps, (ny + 2) * ps + off, ps * (nhw * 2 + 5), ps * 6);
  // Ermine fur trim (white with black spots)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - nhw - 2.5) * ps, (ny + 8) * ps + off, ps * (nhw * 2 + 5), ps * 1.5);
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect((cx - nhw - 2 + i * (nhw + 1)) * ps, (ny + 8.3) * ps + off, ps * 0.4, ps * 0.8);
  }
  // Inner gold lining
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - nhw - 0.5) * ps, (ny + 1) * ps + off, ps * (nhw * 2 + 1), ps * 7);
}

function drawAviatorGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Leather strap
  ctx.fillStyle = '#8B4513';
  ctx.fillRect((lx - 1.5) * ps, (ey + 0.1) * ps + off, ps * (rx - lx + ew + 3), ps * 0.5);
  // Chrome frames
  ctx.fillStyle = '#C0C0C0';
  ctx.strokeStyle = '#A0A0A0';
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.8), 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.8), 0, Math.PI * 2);
  ctx.stroke();
  // Amber lenses
  ctx.fillStyle = '#FFD70055';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.4), 0, Math.PI * 2);
  ctx.fill();
}

function drawChefHat(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Band
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 1.5);
  // Puffy top
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 3) * ps + off, ps * (hw * 2 + 1), ps * 3);
  ctx.fillRect((cx - hw) * ps, (ty - 5) * ps + off, ps * hw * 2, ps * 2.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 6) * ps + off, ps * (hw * 2 - 1), ps * 1.5);
  // Subtle folds
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect((cx - 1) * ps, (ty - 4) * ps + off, ps * 0.3, ps * 2);
  ctx.fillRect((cx + 0.7) * ps, (ty - 3.5) * ps + off, ps * 0.3, ps * 1.5);
}

function drawLei(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Draping garland
  const flowerColors = ['#FF69B4', '#FFD700', '#FF4500', '#FF69B4', '#FFD700', '#FF4500'];
  const cnt = Math.max(4, Math.floor(nhw * 2) + 1);
  const sp = (nhw * 2) / (cnt - 1);
  for (let i = 0; i < cnt; i++) {
    const fx = cx - nhw + i * sp;
    const fy = ny + Math.sin(i * 0.8) * 0.5;
    ctx.fillStyle = flowerColors[i % flowerColors.length];
    ctx.fillRect((fx - 0.4) * ps, (fy - 0.1) * ps + off, ps * 0.8, ps * 0.8);
    // Leaf between
    if (i < cnt - 1) {
      ctx.fillStyle = '#228B22';
      ctx.fillRect((fx + sp / 2 - 0.2) * ps, (fy + 0.2) * ps + off, ps * 0.4, ps * 0.4);
    }
  }
}

function drawCatEars(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Left ear
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((cx - hw) * ps, (ty - 3) * ps + off, ps * 2.5, ps * 2.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 4.5) * ps + off, ps * 1.5, ps * 2);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 5.5) * ps + off, ps * 0.8, ps * 1.5);
  // Left inner
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect((cx - hw + 0.8) * ps, (ty - 3.5) * ps + off, ps * 1, ps * 1.5);
  // Right ear
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((cx + hw - 2.5) * ps, (ty - 3) * ps + off, ps * 2.5, ps * 2.5);
  ctx.fillRect((cx + hw - 2) * ps, (ty - 4.5) * ps + off, ps * 1.5, ps * 2);
  ctx.fillRect((cx + hw - 1.8) * ps, (ty - 5.5) * ps + off, ps * 0.8, ps * 1.5);
  // Right inner
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect((cx + hw - 1.8) * ps, (ty - 3.5) * ps + off, ps * 1, ps * 1.5);
  // Headband
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((cx - hw) * ps, (ty - 0.3) * ps + off, ps * hw * 2, ps * 0.6);
}

function drawNightOwlGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Large round goggles
  ctx.fillStyle = '#2E1065';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1.2), 0, Math.PI * 2);
  ctx.fill();
  // Green night vision lenses
  ctx.fillStyle = '#00FF0055';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.6), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.6), 0, Math.PI * 2);
  ctx.fill();
  // Glow effect
  ctx.fillStyle = '#00FF0022';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1.5), 0, Math.PI * 2);
  ctx.fill();
  // Bridge
  ctx.fillStyle = '#2E1065';
  ctx.fillRect((lx + ew) * ps, (ey - 0.2) * ps + off, ps * (rx - lx - ew), ps * 0.8);
}

function drawGalaxyCape(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Star clasp
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.5) * ps, (ny - 0.3) * ps + off, ps * 1, ps * 1);
  // Deep space cape
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect((cx - nhw - 1.5) * ps, (ny + 0.5) * ps + off, ps * (nhw * 2 + 3), ps * 9);
  // Stars scattered
  ctx.fillStyle = '#FFFFFF';
  const starPositions = [
    [-2, 2],
    [1.5, 3],
    [-1, 5],
    [2, 6],
    [0, 7],
    [-2.5, 4],
    [2.5, 5],
  ];
  for (const [sx, sy] of starPositions) {
    ctx.fillRect((cx + sx) * ps, (ny + sy) * ps + off, ps * 0.3, ps * 0.3);
  }
  // Nebula colors
  ctx.fillStyle = '#9C27B033';
  ctx.fillRect((cx - 2) * ps, (ny + 3) * ps + off, ps * 3, ps * 2);
  ctx.fillStyle = '#2196F322';
  ctx.fillRect((cx - 1) * ps, (ny + 5) * ps + off, ps * 3, ps * 2);
  ctx.fillStyle = '#E040FB22';
  ctx.fillRect((cx - 2.5) * ps, (ny + 6) * ps + off, ps * 2, ps * 2);
}

function drawSamuraiHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Kabuto dome
  ctx.fillStyle = '#8B0000';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2) * ps + off, ps * (hw * 2 - 1), ps * 2);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  // Maedate (front crest)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.3) * ps, (ty - 5.5) * ps + off, ps * 0.6, ps * 3);
  ctx.fillRect((cx - 1) * ps, (ty - 5) * ps + off, ps * 2, ps * 0.5);
  // Shikoro (neck guard flaps)
  ctx.fillStyle = '#660000';
  ctx.fillRect((cx - hw - 1.5) * ps, (ty + 0.5) * ps + off, ps * (hw * 2 + 3), ps * 1.5);
  ctx.fillRect((cx - hw - 2) * ps, (ty + 1.5) * ps + off, ps * (hw * 2 + 4), ps * 1);
  // Gold trim
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - hw) * ps, (ty - 0.8) * ps + off, ps * hw * 2, ps * 0.4);
}

function drawPixelShades(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Chunky pixel frames
  ctx.fillStyle = '#1a1a1a';
  // Left lens (blocky)
  ctx.fillRect((lx - 0.5) * ps, (ey - 0.5) * ps + off, ps * (ew + 1), ps * 2);
  // Right lens (blocky)
  ctx.fillRect((rx - 0.5) * ps, (ey - 0.5) * ps + off, ps * (ew + 1), ps * 2);
  // Bridge
  ctx.fillRect((lx + ew) * ps, ey * ps + off, ps * (rx - lx - ew), ps * 0.8);
  // Pixel grid pattern on lenses
  ctx.fillStyle = '#00000088';
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < Math.floor(ew); c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillRect((lx + c) * ps, (ey + r * 0.8) * ps + off, ps * 0.8, ps * 0.8);
        ctx.fillRect((rx + c) * ps, (ey + r * 0.8) * ps + off, ps * 0.8, ps * 0.8);
      }
    }
  }
}

function drawLuckyClover(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Thin gold chain
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.3);
  // Four-leaf clover
  const drawLeaf = (lx: number, ly: number) => {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(lx * ps, ly * ps + off, ps * 0.8, ps * 0.8);
    ctx.fillStyle = '#32CD32';
    ctx.fillRect((lx + 0.1) * ps, (ly + 0.1) * ps + off, ps * 0.3, ps * 0.3);
  };
  drawLeaf(cx - 0.9, ny + 0.8);
  drawLeaf(cx + 0.1, ny + 0.8);
  drawLeaf(cx - 0.9, ny + 1.7);
  drawLeaf(cx + 0.1, ny + 1.7);
  // Stem
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect((cx - 0.1) * ps, (ny + 2.5) * ps + off, ps * 0.2, ps * 1.5);
}

// ════════════════════════════════════════════════════════════
// MILESTONE EXCLUSIVE ACCESSORIES
// ════════════════════════════════════════════════════════════

function drawTrophyNecklace(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Gold chain
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.4);
  // Mini trophy
  ctx.fillStyle = '#FFD700';
  // Cup
  ctx.fillRect((cx - 0.8) * ps, (ny + 1) * ps + off, ps * 1.6, ps * 1.5);
  ctx.fillRect((cx - 1) * ps, (ny + 0.8) * ps + off, ps * 2, ps * 0.5);
  // Handles
  ctx.fillRect((cx - 1.3) * ps, (ny + 1.2) * ps + off, ps * 0.5, ps * 0.8);
  ctx.fillRect((cx + 0.8) * ps, (ny + 1.2) * ps + off, ps * 0.5, ps * 0.8);
  // Base
  ctx.fillRect((cx - 0.5) * ps, (ny + 2.5) * ps + off, ps * 1, ps * 0.3);
  ctx.fillRect((cx - 0.7) * ps, (ny + 2.8) * ps + off, ps * 1.4, ps * 0.3);
  // Star
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.2) * ps, (ny + 1.2) * ps + off, ps * 0.4, ps * 0.4);
}

function drawStarHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Dark blue helmet
  ctx.fillStyle = '#0a1a3e';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 - 1), ps * 2.5);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  // Stars on helmet
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, (ty - 1.5) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx + 1) * ps, (ty - 2.5) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillRect((cx - 0.5) * ps, (ty - 2.8) * ps + off, ps * 0.3, ps * 0.3);
  // Shooting star
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.2) * ps, (ty - 3.2) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx + 0.2) * ps, (ty - 2.8) * ps + off, ps * 0.8, ps * 0.2);
  // Visor
  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty + 0.3) * ps + off, ps * (hw * 2 - 1), ps * 0.8);
}

function drawCrystalMonocle(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Crystal rim (prismatic)
  ctx.strokeStyle = '#9C27B0';
  ctx.lineWidth = ps * 0.5;
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.8), 0, Math.PI * 2);
  ctx.stroke();
  // Crystal lens (purple tinted)
  ctx.fillStyle = '#9C27B033';
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.fill();
  // Prismatic reflections
  ctx.fillStyle = '#FF69B444';
  ctx.fillRect(rx * ps, (ey - 0.2) * ps + off, ps * 0.5, ps * 0.3);
  ctx.fillStyle = '#00FFFF44';
  ctx.fillRect((rx + 0.8) * ps, (ey + 0.5) * ps + off, ps * 0.4, ps * 0.3);
  // Crystal chain
  ctx.strokeStyle = '#9C27B0';
  ctx.lineWidth = ps * 0.25;
  ctx.beginPath();
  ctx.moveTo((rx + ew / 2) * ps, (ey + 0.3 + ew / 2 + 0.8) * ps + off);
  ctx.lineTo((rx + ew / 2 - 1) * ps, (ey + 4) * ps + off);
  ctx.stroke();
  // Crystal at end
  ctx.fillStyle = '#E040FB';
  ctx.fillRect((rx + ew / 2 - 1.2) * ps, (ey + 3.8) * ps + off, ps * 0.5, ps * 0.5);
}

function drawPhoenixFeatherHead(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  // Tall feather
  ctx.fillStyle = '#FF4500';
  ctx.fillRect((cx - 0.3) * ps, (ty - 7) * ps + off, ps * 0.6, ps * 7);
  ctx.fillStyle = '#FF6347';
  ctx.fillRect((cx - 0.8) * ps, (ty - 5) * ps + off, ps * 1.6, ps * 4);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.5) * ps, (ty - 3.5) * ps + off, ps * 1, ps * 2.5);
  // Barbs
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect((cx - 1.2) * ps, (ty - 4) * ps + off, ps * 0.5, ps * 1.5);
  ctx.fillRect((cx + 0.7) * ps, (ty - 5) * ps + off, ps * 0.5, ps * 2);
  // Ember tips
  ctx.fillStyle = '#FFD70088';
  ctx.fillRect((cx - 0.2) * ps, (ty - 7.5) * ps + off, ps * 0.4, ps * 0.8);
  // Fire glow
  ctx.fillStyle = '#FF450022';
  ctx.fillRect((cx - 1.5) * ps, (ty - 6) * ps + off, ps * 3, ps * 5);
  // Headband to hold feather
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(
    (cx - a.headHalfWidth) * ps,
    (ty - 0.3) * ps + off,
    ps * a.headHalfWidth * 2,
    ps * 0.6
  );
}

function drawInfinityScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Wrapped scarf (infinity loop shape)
  ctx.fillStyle = '#708090';
  // Top loop
  ctx.fillRect((cx - nhw - 0.5) * ps, (ny - 0.5) * ps + off, ps * (nhw * 2 + 1), ps * 1.5);
  // Cross-over in front
  ctx.fillStyle = '#5F6B7A';
  ctx.fillRect((cx - 1.5) * ps, (ny + 0.5) * ps + off, ps * 1.5, ps * 2.5);
  ctx.fillStyle = '#708090';
  ctx.fillRect(cx * ps, (ny + 0.5) * ps + off, ps * 1.5, ps * 2.5);
  // Bottom loop
  ctx.fillStyle = '#607080';
  ctx.fillRect((cx - 1.8) * ps, (ny + 2.5) * ps + off, ps * 3.6, ps * 1);
  // Knit texture
  ctx.fillStyle = '#FFFFFF11';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect((cx - nhw + i * 1.2) * ps, (ny + 0.1) * ps + off, ps * 0.3, ps * 0.8);
  }
}

function drawAncientCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);
  // Weathered bronze base
  ctx.fillStyle = '#8B7355';
  ctx.fillRect((cx - hw) * ps, (ty - 1) * ps + off, ps * hw * 2, ps * 1.5);
  // Patina spots
  ctx.fillStyle = '#2E8B57';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 0.5) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillRect((cx + hw - 1.5) * ps, (ty - 0.7) * ps + off, ps * 0.5, ps * 0.5);
  // Three prongs (ancient style)
  ctx.fillStyle = '#8B7355';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 3.5) * ps + off, ps * 0.8, ps * 3);
  ctx.fillRect((cx - 0.4) * ps, (ty - 4.5) * ps + off, ps * 0.8, ps * 4);
  ctx.fillRect((cx + hw - 1.3) * ps, (ty - 3.5) * ps + off, ps * 0.8, ps * 3);
  // Ancient gems (cracked)
  ctx.fillStyle = '#006400';
  ctx.fillRect((cx - 0.2) * ps, (ty - 4.2) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillStyle = '#8B0000';
  ctx.fillRect((cx - hw + 0.7) * ps, (ty - 3.2) * ps + off, ps * 0.4, ps * 0.4);
}

function drawChampionBelt(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  // Gürtel sitzt am Bauch, nicht am Hals — 3 Pixel unterhalb neckY
  const by = a.neckY + 3;
  const nhw = a.neckHalfWidth;
  // Leather belt
  ctx.fillStyle = '#8B4513';
  ctx.fillRect((cx - nhw - 0.5) * ps, (by + 0.5) * ps + off, ps * (nhw * 2 + 1), ps * 2);
  // Gold plate
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, (by + 0.3) * ps + off, ps * 3, ps * 2.5);
  // Inner design
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - 1.2) * ps, (by + 0.6) * ps + off, ps * 2.4, ps * 1.8);
  // Star in center
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.4) * ps, (by + 1) * ps + off, ps * 0.8, ps * 0.3);
  ctx.fillRect((cx - 0.15) * ps, (by + 0.7) * ps + off, ps * 0.3, ps * 0.9);
  // Side gems
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - 1) * ps, (by + 1.1) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + 0.7) * ps, (by + 1.1) * ps + off, ps * 0.3, ps * 0.3);
}

function drawCosmicHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Dark helm
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 0.5) * ps + off, ps * (hw * 2 + 1), ps * 2.5);
  ctx.fillRect((cx - hw) * ps, (ty - 3) * ps + off, ps * hw * 2, ps * 3);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 4) * ps + off, ps * (hw * 2 - 1), ps * 1.5);
  // Galaxy pattern
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 1) * ps, (ty - 2.5) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx + 0.5) * ps, (ty - 1.5) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx - 0.3) * ps, (ty - 0.5) * ps + off, ps * 0.2, ps * 0.2);
  // Nebula glow
  ctx.fillStyle = '#9C27B033';
  ctx.fillRect((cx - 1.5) * ps, (ty - 2) * ps + off, ps * 2, ps * 1.5);
  ctx.fillStyle = '#2196F322';
  ctx.fillRect((cx - 0.5) * ps, (ty - 3) * ps + off, ps * 2, ps * 1.5);
  // Visor with starfield
  ctx.fillStyle = '#1a1a3e';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty + 0.5) * ps + off, ps * (hw * 2 - 1), ps * 1);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - hw + 1) * ps, (ty + 0.8) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx + hw - 1.5) * ps, (ty + 0.7) * ps + off, ps * 0.2, ps * 0.2);
}

function drawTimeTravelerGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Brass frames
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1), 0, Math.PI * 2);
  ctx.fill();
  // Clock face lenses
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.fill();
  // Clock hands
  ctx.fillStyle = '#333333';
  ctx.fillRect((rx + ew / 2 - 0.05) * ps, (ey - 0.3) * ps + off, ps * 0.1, ps * 0.8);
  ctx.fillRect((rx + ew / 2) * ps, (ey + 0.2) * ps + off, ps * 0.6, ps * 0.1);
  // Gears
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((lx + ew) * ps, (ey - 0.5) * ps + off, ps * (rx - lx - ew), ps * 0.4);
  // Small gear details
  ctx.fillRect((cx - 0.3) * ps, (ey - 0.8) * ps + off, ps * 0.6, ps * 0.6);
}

function drawEnchantedRose(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Vine chain
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.3);
  // Rose petals (layered)
  ctx.fillStyle = '#FF1744';
  ctx.fillRect((cx - 0.8) * ps, (ny + 0.8) * ps + off, ps * 1.6, ps * 1.6);
  ctx.fillRect((cx - 1.1) * ps, (ny + 1) * ps + off, ps * 2.2, ps * 1);
  ctx.fillStyle = '#D50000';
  ctx.fillRect((cx - 0.5) * ps, (ny + 0.5) * ps + off, ps * 1, ps * 0.5);
  ctx.fillRect((cx - 0.3) * ps, (ny + 2.2) * ps + off, ps * 0.6, ps * 0.3);
  // Center
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.2) * ps, (ny + 1.2) * ps + off, ps * 0.4, ps * 0.4);
  // Leaves
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - 1.5) * ps, (ny + 1.5) * ps + off, ps * 0.6, ps * 0.8);
  ctx.fillRect((cx + 0.9) * ps, (ny + 1.8) * ps + off, ps * 0.6, ps * 0.6);
  // Magic sparkles
  ctx.fillStyle = '#FFD70066';
  ctx.fillRect((cx - 1.5) * ps, (ny + 0.5) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx + 1.3) * ps, (ny + 0.8) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx + 0.2) * ps, (ny + 2.5) * ps + off, ps * 0.2, ps * 0.2);
}

function drawShadowHood(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Hood shape
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx - hw - 1) * ps, (ty - 1) * ps + off, ps * (hw * 2 + 2), ps * 4);
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 3) * ps + off, ps * (hw * 2 + 1), ps * 2.5);
  ctx.fillRect((cx - hw) * ps, (ty - 4) * ps + off, ps * hw * 2, ps * 1.5);
  // Inner shadow (darker)
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect((cx - hw + 0.5) * ps, ty * ps + off, ps * (hw * 2 - 1), ps * 2.5);
  // Glowing eyes peering out
  ctx.fillStyle = '#9C27B0';
  ctx.fillRect((cx - 1.5) * ps, (ty + 0.8) * ps + off, ps * 0.5, ps * 0.3);
  ctx.fillRect((cx + 1) * ps, (ty + 0.8) * ps + off, ps * 0.5, ps * 0.3);
  // Hood peak
  ctx.fillStyle = '#222222';
  ctx.fillRect((cx - 0.5) * ps, (ty - 4.5) * ps + off, ps * 1, ps * 1);
}

function drawCelestialCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);
  // Ethereal crown base
  ctx.fillStyle = '#E8E8FF';
  ctx.fillRect((cx - hw) * ps, (ty - 1) * ps + off, ps * hw * 2, ps * 1.5);
  // Crystal spikes
  const spikes = [-hw + 0.5, -1, 0, 1, hw - 0.5];
  const spikeH = [3, 4, 5.5, 4, 3];
  for (let i = 0; i < 5; i++) {
    // Gradient from white to blue
    ctx.fillStyle = '#C8E6FF';
    ctx.fillRect(
      (cx + spikes[i] - 0.3) * ps,
      (ty - 1 - spikeH[i]) * ps + off,
      ps * 0.6,
      ps * spikeH[i]
    );
    ctx.fillStyle = '#E8F4FF';
    ctx.fillRect(
      (cx + spikes[i] - 0.15) * ps,
      (ty - 1 - spikeH[i]) * ps + off,
      ps * 0.3,
      ps * spikeH[i] * 0.6
    );
  }
  // Floating stars
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, (ty - 5) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + 1.2) * ps, (ty - 4.5) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect(cx * ps, (ty - 6.5) * ps + off, ps * 0.4, ps * 0.4);
  // Glow aura
  ctx.fillStyle = '#FFFFFF22';
  ctx.fillRect((cx - hw - 0.5) * ps, (ty - 6) * ps + off, ps * (hw * 2 + 1), ps * 6);
  // Center moonstone
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.3) * ps, (ty - 6.3) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillStyle = '#E0E8FF';
  ctx.fillRect((cx - 0.15) * ps, (ty - 6.1) * ps + off, ps * 0.3, ps * 0.3);
}

// ════════════════════════════════════════════════════════════
// SPIN EXCLUSIVE BATCH 2
// ════════════════════════════════════════════════════════════

function drawWitchHat(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#2a0845';
  ctx.fillRect((cx - hw - 1.5) * ps, (ty - 0.3) * ps + off, ps * (hw * 2 + 3), ps * 1);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 3) * ps + off, ps * (hw * 2 - 1), ps * 3);
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 5.5) * ps + off, ps * (hw * 2 - 3), ps * 3);
  ctx.fillRect((cx - 0.5) * ps, (ty - 7.5) * ps + off, ps * 1.5, ps * 2.5);
  ctx.fillRect((cx + 0.5) * ps, (ty - 8) * ps + off, ps * 1.5, ps * 1);
  ctx.fillStyle = '#6A0DAD';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 1) * ps + off, ps * (hw * 2 - 1), ps * 0.8);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.3) * ps, (ty - 1.3) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillRect((cx + 1) * ps, (ty - 5) * ps + off, ps * 0.3, ps * 0.3);
}

function drawSteamGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  ctx.fillStyle = '#8B4513';
  ctx.fillRect((lx - 1.5) * ps, (ey + 0.1) * ps + off, ps * (rx - lx + ew + 3), ps * 0.5);
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#556B2F88';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((lx - 0.5) * ps, (ey - 0.8) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillRect((rx + ew) * ps, (ey - 0.8) * ps + off, ps * 0.4, ps * 0.4);
}

function drawRainbowScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'];
  const stripeH = 0.35;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(
      (cx - nhw - 0.5) * ps,
      (ny - 0.3 + i * stripeH) * ps + off,
      ps * (nhw * 2 + 1),
      ps * stripeH
    );
  }
  ctx.fillStyle = '#FF0000';
  ctx.fillRect((cx - nhw - 1) * ps, (ny + 1.8) * ps + off, ps * 2, ps * 3);
  ctx.fillStyle = '#FFFF00';
  ctx.fillRect((cx - nhw - 0.5) * ps, (ny + 2.5) * ps + off, ps * 1.5, ps * 2);
}

function drawMushHat(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#CD853F';
  ctx.fillRect((cx - 0.5) * ps, (ty - 1) * ps + off, ps * 1, ps * 1.5);
  ctx.fillStyle = '#FF4444';
  ctx.fillRect((cx - hw - 1) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 + 2), ps * 2);
  ctx.fillRect((cx - hw) * ps, (ty - 3.5) * ps + off, ps * hw * 2, ps * 1.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 4) * ps + off, ps * (hw * 2 - 1), ps * 1);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 1.5) * ps, (ty - 3) * ps + off, ps * 0.8, ps * 0.8);
  ctx.fillRect((cx + 0.7) * ps, (ty - 2.5) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillRect((cx - 0.3) * ps, (ty - 3.5) * ps + off, ps * 0.5, ps * 0.5);
}

function drawButterflyMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect((cx - hw) * ps, (ey - 0.8) * ps + off, ps * hw, ps * 2);
  ctx.fillRect(cx * ps, (ey - 0.8) * ps + off, ps * hw, ps * 2);
  ctx.fillStyle = '#FF1493';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 0.3) * ps + off, ps * 1, ps * 1);
  ctx.fillRect((cx + hw - 0.5) * ps, (ey - 0.3) * ps + off, ps * 1, ps * 1);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - hw + 1) * ps, (ey - 0.3) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillRect((cx + hw - 1.5) * ps, (ey - 0.3) * ps + off, ps * 0.4, ps * 0.4);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx - 0.1) * ps, (ey - 0.5) * ps + off, ps * 0.2, ps * 1.5);
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect((cx - 0.8) * ps, (ey - 1.5) * ps + off, ps * 0.3, ps * 1);
  ctx.fillRect((cx + 0.5) * ps, (ey - 1.5) * ps + off, ps * 0.3, ps * 1);
}

function drawShellNecklace(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  ctx.fillStyle = '#D2B48C';
  ctx.fillRect((cx - nhw) * ps, ny * ps + off, ps * nhw * 2, ps * 0.3);
  const cnt = Math.max(3, Math.floor(nhw * 2) - 1);
  const sp = (nhw * 2 - 0.5) / (cnt - 1);
  for (let i = 0; i < cnt; i++) {
    const sx = cx - nhw + 0.2 + i * sp;
    ctx.fillStyle = i % 2 === 0 ? '#FFF5EE' : '#FFE4C4';
    ctx.fillRect(sx * ps, (ny + 0.3) * ps + off, ps * 0.6, ps * 0.5);
    ctx.fillRect((sx + 0.1) * ps, (ny + 0.7) * ps + off, ps * 0.4, ps * 0.3);
  }
}

function drawFoxEars(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#FF6600';
  ctx.fillRect((cx - hw) * ps, (ty - 3) * ps + off, ps * 2, ps * 2.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 4.5) * ps + off, ps * 1.2, ps * 2);
  ctx.fillRect((cx - hw + 0.8) * ps, (ty - 5.5) * ps + off, ps * 0.6, ps * 1.5);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * 1, ps * 1);
  ctx.fillStyle = '#FF6600';
  ctx.fillRect((cx + hw - 2) * ps, (ty - 3) * ps + off, ps * 2, ps * 2.5);
  ctx.fillRect((cx + hw - 1.7) * ps, (ty - 4.5) * ps + off, ps * 1.2, ps * 2);
  ctx.fillRect((cx + hw - 1.4) * ps, (ty - 5.5) * ps + off, ps * 0.6, ps * 1.5);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx + hw - 1.5) * ps, (ty - 2.5) * ps + off, ps * 1, ps * 1);
  ctx.fillStyle = '#FF6600';
  ctx.fillRect((cx - hw) * ps, (ty - 0.3) * ps + off, ps * hw * 2, ps * 0.5);
}

function drawGhostMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#FFFFFFCC';
  ctx.fillRect((cx - hw) * ps, (ey - 1.5) * ps + off, ps * hw * 2, ps * 3.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ey + 1.5) * ps + off, ps * 1.5, ps * 1);
  ctx.fillRect((cx + hw - 2) * ps, (ey + 1.5) * ps + off, ps * 1.5, ps * 1);
  ctx.fillRect((cx - 0.5) * ps, (ey + 2) * ps + off, ps * 1, ps * 0.8);
  ctx.fillStyle = '#000000';
  ctx.fillRect((cx - hw + 1) * ps, (ey - 0.5) * ps + off, ps * 1.5, ps * 1.2);
  ctx.fillRect((cx + hw - 2.5) * ps, (ey - 0.5) * ps + off, ps * 1.5, ps * 1.2);
  ctx.fillStyle = '#00000088';
  ctx.fillRect((cx - 0.5) * ps, (ey + 0.8) * ps + off, ps * 1, ps * 0.8);
}

function drawThunderChain(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 2) * ps, ny * ps + off, ps * 4, ps * 0.4);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx + 0.2) * ps, (ny + 0.5) * ps + off, ps * 0.8, ps * 1);
  ctx.fillRect((cx - 0.3) * ps, (ny + 1.2) * ps + off, ps * 1, ps * 0.4);
  ctx.fillRect((cx - 0.5) * ps, (ny + 1.5) * ps + off, ps * 0.8, ps * 1);
  ctx.fillRect((cx - 1) * ps, (ny + 2.2) * ps + off, ps * 1, ps * 0.4);
  ctx.fillRect((cx - 0.8) * ps, (ny + 2.5) * ps + off, ps * 0.6, ps * 0.8);
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect((cx + 0.3) * ps, (ny + 0.6) * ps + off, ps * 0.3, ps * 0.3);
}

function drawIceHelm(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#ADD8E6';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 - 1), ps * 2.5);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  ctx.fillStyle = '#E0FFFF';
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 2) * ps + off, ps * 0.5, ps * 1.5);
  ctx.fillRect((cx + 0.5) * ps, (ty - 1.5) * ps + off, ps * 0.3, ps * 1);
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect((cx - 0.3) * ps, (ty - 5) * ps + off, ps * 0.6, ps * 2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 4) * ps + off, ps * 0.5, ps * 1.5);
  ctx.fillRect((cx + hw - 1) * ps, (ty - 4.5) * ps + off, ps * 0.5, ps * 2);
  ctx.fillStyle = '#FFFFFF55';
  ctx.fillRect((cx - 0.2) * ps, (ty - 5.2) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx - hw + 0.6) * ps, (ty - 4.2) * ps + off, ps * 0.2, ps * 0.2);
}

function drawPrismVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 0.5) * ps + off, ps * (hw * 2 + 1), ps * 1.5);
  const prismColors = [
    '#FF000044',
    '#FF880044',
    '#FFFF0044',
    '#00FF0044',
    '#0088FF44',
    '#8800FF44',
  ];
  const sw = (hw * 2) / prismColors.length;
  for (let i = 0; i < prismColors.length; i++) {
    ctx.fillStyle = prismColors[i];
    ctx.fillRect((cx - hw + i * sw) * ps, (ey - 0.2) * ps + off, ps * sw, ps * 1);
  }
  ctx.fillStyle = '#FFFFFF33';
  ctx.fillRect((cx - hw + 0.5) * ps, (ey - 0.2) * ps + off, ps * 1, ps * 0.3);
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((cx - hw - 1.5) * ps, (ey - 0.2) * ps + off, ps * 1.2, ps * 0.8);
  ctx.fillRect((cx + hw + 0.3) * ps, (ey - 0.2) * ps + off, ps * 1.2, ps * 0.8);
}

function drawSolarAmulet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.3);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2.2) * ps + off, ps * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2.2) * ps + off, ps * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const rx = cx + Math.cos(angle) * 1.8;
    const ry = ny + 2.2 + Math.sin(angle) * 1.8;
    ctx.fillRect((rx - 0.15) * ps, (ry - 0.15) * ps + off, ps * 0.3, ps * 0.3);
  }
  ctx.fillStyle = '#FFFFFF55';
  ctx.fillRect((cx - 0.3) * ps, (ny + 1.8) * ps + off, ps * 0.3, ps * 0.3);
}

// ════════════════════════════════════════════════════════════
// MILESTONE EXCLUSIVE BATCH 2
// ════════════════════════════════════════════════════════════

function drawVolcanoHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#4a2800';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 2);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2.5) * ps + off, ps * (hw * 2 - 1), ps * 2.5);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3.5) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  ctx.fillStyle = '#FF4500';
  ctx.fillRect((cx - 0.8) * ps, (ty - 4.5) * ps + off, ps * 1.6, ps * 1.5);
  ctx.fillRect((cx - 0.5) * ps, (ty - 5.5) * ps + off, ps * 1, ps * 1.5);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.3) * ps, (ty - 5) * ps + off, ps * 0.6, ps * 0.5);
  ctx.fillStyle = '#FF6347';
  ctx.fillRect((cx - hw + 1) * ps, (ty - 1.5) * ps + off, ps * 0.5, ps * 0.5);
  ctx.fillRect((cx + 0.5) * ps, (ty - 2) * ps + off, ps * 0.4, ps * 0.4);
}

function drawAbyssVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 0.8) * ps + off, ps * (hw * 2 + 1), ps * 2);
  ctx.fillStyle = '#1a0030';
  ctx.fillRect((cx - hw) * ps, (ey - 0.3) * ps + off, ps * hw * 2, ps * 1.2);
  ctx.fillStyle = '#9C27B066';
  ctx.fillRect((cx - hw + 0.5) * ps, ey * ps + off, ps * 1, ps * 0.4);
  ctx.fillRect((cx + 0.5) * ps, (ey - 0.1) * ps + off, ps * 0.8, ps * 0.3);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 0.1) * ps, (ey + 0.1) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx + 1) * ps, (ey + 0.3) * ps + off, ps * 0.15, ps * 0.15);
  ctx.fillStyle = '#6A0DAD';
  ctx.fillRect((cx - hw - 1) * ps, ey * ps + off, ps * 0.8, ps * 0.6);
  ctx.fillRect((cx + hw + 0.2) * ps, ey * ps + off, ps * 0.8, ps * 0.6);
}

function drawDragonScaleCollar(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - nhw) * ps, ny * ps + off, ps * nhw * 2, ps * 1.5);
  const cnt = Math.max(4, Math.floor(nhw * 2));
  const sp = (nhw * 2) / cnt;
  for (let i = 0; i < cnt; i++) {
    const shade = i % 2 === 0 ? '#2E8B57' : '#1a6b1a';
    ctx.fillStyle = shade;
    ctx.fillRect((cx - nhw + i * sp) * ps, (ny - 0.2) * ps + off, ps * (sp - 0.1), ps * 0.8);
    ctx.fillRect((cx - nhw + i * sp + 0.1) * ps, (ny + 0.5) * ps + off, ps * (sp - 0.2), ps * 0.8);
  }
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.3) * ps, (ny + 0.2) * ps + off, ps * 0.6, ps * 0.6);
}

function drawLotusHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 1.5);
  const petalPositions = [-hw + 0.5, -1.5, 0, 1.5, hw - 0.5];
  for (const px of petalPositions) {
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect((cx + px - 0.5) * ps, (ty - 2.5) * ps + off, ps * 1, ps * 2);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect((cx + px - 0.3) * ps, (ty - 2) * ps + off, ps * 0.6, ps * 1);
  }
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.3) * ps, (ty - 1) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillStyle = '#228B22';
  ctx.fillRect((cx - hw) * ps, (ty + 0.5) * ps + off, ps * hw * 2, ps * 0.3);
}

function drawEclipseGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc((lx + ew / 2 + 0.2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc((rx + ew / 2 - 0.2) * ps, (ey + 0.3) * ps + off, ps * (ew / 2), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333333';
  ctx.fillRect((lx + ew) * ps, ey * ps + off, ps * (rx - lx - ew), ps * 0.5);
}

function drawRuneNecklace(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  ctx.fillStyle = '#555555';
  ctx.fillRect((cx - 2) * ps, ny * ps + off, ps * 4, ps * 0.3);
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - 0.8) * ps, (ny + 0.5) * ps + off, ps * 1.6, ps * 1.6);
  ctx.fillStyle = '#00FF88';
  ctx.fillRect((cx - 0.5) * ps, (ny + 0.8) * ps + off, ps * 0.2, ps * 1);
  ctx.fillRect((cx - 0.1) * ps, (ny + 0.7) * ps + off, ps * 0.2, ps * 1.2);
  ctx.fillRect((cx + 0.3) * ps, (ny + 0.9) * ps + off, ps * 0.2, ps * 0.8);
  ctx.fillRect((cx - 0.3) * ps, (ny + 1.1) * ps + off, ps * 0.8, ps * 0.2);
  ctx.fillStyle = '#00FF8844';
  ctx.fillRect((cx - 1.2) * ps, (ny + 0.3) * ps + off, ps * 2.4, ps * 2);
}

function drawGlitchCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect((cx - hw) * ps, (ty - 1) * ps + off, ps * hw * 2, ps * 1.5);
  const px = [-hw + 0.5, -1, 0, 1, hw - 0.5];
  const ph = [2, 3, 3.5, 2.5, 2];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#00FF00' : '#FF00FF';
    ctx.fillRect((cx + px[i] - 0.4) * ps, (ty - 1 - ph[i]) * ps + off, ps * 0.8, ps * ph[i]);
  }
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 0.3) * ps + off, ps * 1, ps * 0.3);
  ctx.fillRect((cx + 0.5) * ps, (ty - 2) * ps + off, ps * 0.8, ps * 0.2);
  ctx.fillStyle = '#FF000088';
  ctx.fillRect((cx - 0.5) * ps, (ty - 3.5) * ps + off, ps * 2, ps * 0.3);
}

function drawVoidMask(ctx: CanvasRenderingContext2D, ps: number, off: number, a: PetAnchors): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect((cx - hw) * ps, (ey - 1.5) * ps + off, ps * hw * 2, ps * 4);
  ctx.fillRect((cx - hw + 0.5) * ps, (ey + 2) * ps + off, ps * (hw * 2 - 1), ps * 1);
  ctx.fillStyle = '#6A0DAD';
  ctx.fillRect((cx - hw + 1) * ps, (ey - 0.5) * ps + off, ps * 1.5, ps * 1);
  ctx.fillRect((cx + hw - 2.5) * ps, (ey - 0.5) * ps + off, ps * 1.5, ps * 1);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw + 1.3) * ps, (ey - 0.2) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx + hw - 1.8) * ps, (ey - 0.2) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect((cx - 0.5) * ps, (ey + 1) * ps + off, ps * 1, ps * 0.8);
  ctx.fillStyle = '#6A0DAD22';
  ctx.fillRect((cx - hw - 0.5) * ps, (ey - 1) * ps + off, ps * (hw * 2 + 1), ps * 3.5);
}

function drawSakuraPendant(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.3);
  ctx.fillStyle = '#FF69B4';
  ctx.fillRect((cx - 0.3) * ps, (ny + 0.5) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillRect((cx - 0.6) * ps, (ny + 0.8) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillRect((cx + 0.1) * ps, (ny + 0.8) * ps + off, ps * 0.6, ps * 0.6);
  ctx.fillRect((cx - 0.5) * ps, (ny + 1.2) * ps + off, ps * 1, ps * 0.4);
  ctx.fillRect((cx - 0.2) * ps, (ny + 1.4) * ps + off, ps * 0.4, ps * 0.3);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.1) * ps, (ny + 0.9) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillStyle = '#FFB6C188';
  ctx.fillRect((cx - 1) * ps, (ny + 0.3) * ps + off, ps * 0.2, ps * 0.2);
  ctx.fillRect((cx + 0.8) * ps, (ny + 1.3) * ps + off, ps * 0.2, ps * 0.2);
}

function drawPyramidHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - hw) * ps, (ty - 0.5) * ps + off, ps * hw * 2, ps * 1.5);
  ctx.fillRect((cx - hw + 0.5) * ps, (ty - 2) * ps + off, ps * (hw * 2 - 1), ps * 2);
  ctx.fillRect((cx - hw + 1) * ps, (ty - 3) * ps + off, ps * (hw * 2 - 2), ps * 1.5);
  ctx.fillRect((cx - hw + 1.5) * ps, (ty - 4) * ps + off, ps * (hw * 2 - 3), ps * 1.5);
  ctx.fillRect((cx - 0.5) * ps, (ty - 5) * ps + off, ps * 1, ps * 1.5);
  ctx.fillStyle = '#B8860B';
  ctx.fillRect((cx - 0.1) * ps, (ty - 4.5) * ps + off, ps * 0.2, ps * 4.5);
  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect((cx - 0.3) * ps, (ty - 0.5) * ps + off, ps * 0.6, ps * 1);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.2) * ps, (ty - 5) * ps + off, ps * 0.4, ps * 0.4);
}

function drawMirrorShades(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((lx - 0.5) * ps, (ey - 0.5) * ps + off, ps * (ew + 1), ps * 2);
  ctx.fillRect((rx - 0.5) * ps, (ey - 0.5) * ps + off, ps * (ew + 1), ps * 2);
  ctx.fillRect((lx + ew - 0.2) * ps, (ey + 0.1) * ps + off, ps * (rx - lx - ew + 0.4), ps * 0.5);
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect((lx - 0.2) * ps, (ey - 0.2) * ps + off, ps * 0.8, ps * 0.5);
  ctx.fillRect((rx - 0.2) * ps, (ey - 0.2) * ps + off, ps * 0.8, ps * 0.5);
  ctx.fillStyle = '#87CEEB55';
  ctx.fillRect(lx * ps, (ey + 0.3) * ps + off, ps * ew, ps * 0.8);
  ctx.fillRect(rx * ps, (ey + 0.3) * ps + off, ps * ew, ps * 0.8);
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect((lx - 1.5) * ps, (ey + 0.1) * ps + off, ps * 1.2, ps * 0.4);
  ctx.fillRect((rx + ew + 0.3) * ps, (ey + 0.1) * ps + off, ps * 1.2, ps * 0.4);
}

function drawObsidianAmulet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  ctx.fillStyle = '#333333';
  ctx.fillRect((cx - 1.5) * ps, ny * ps + off, ps * 3, ps * 0.3);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect((cx - 0.8) * ps, (ny + 0.5) * ps + off, ps * 1.6, ps * 0.5);
  ctx.fillRect((cx - 1) * ps, (ny + 0.8) * ps + off, ps * 2, ps * 1.2);
  ctx.fillRect((cx - 0.8) * ps, (ny + 1.8) * ps + off, ps * 1.6, ps * 0.8);
  ctx.fillRect((cx - 0.5) * ps, (ny + 2.4) * ps + off, ps * 1, ps * 0.5);
  ctx.fillRect((cx - 0.2) * ps, (ny + 2.7) * ps + off, ps * 0.4, ps * 0.3);
  ctx.fillStyle = '#6A0DAD';
  ctx.fillRect((cx - 0.3) * ps, (ny + 1.2) * ps + off, ps * 0.6, ps * 0.4);
  ctx.fillStyle = '#9C27B044';
  ctx.fillRect((cx - 1.3) * ps, (ny + 0.5) * ps + off, ps * 2.6, ps * 2.5);
  ctx.fillStyle = '#FFFFFF33';
  ctx.fillRect((cx - 0.5) * ps, (ny + 0.9) * ps + off, ps * 0.3, ps * 0.3);
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.min(255, parseInt(c.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(c.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(c.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
