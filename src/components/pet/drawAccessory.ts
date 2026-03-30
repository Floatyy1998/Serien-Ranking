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
      const hs = level >= 10 ? 1.25 : level >= 7 ? 1.15 : level >= 3 ? 1.08 : 1;
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
      const hs = level >= 10 ? 1.3 : level >= 7 ? 1.2 : level >= 3 ? 1.1 : 1;
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
      return {
        headTopY: 11,
        headCenterX: cx,
        headHalfWidth: 3.5,
        eyeY: 13,
        eyeLeftX: -3,
        eyeRightX: 1,
        eyeWidth: 2,
        neckY: 15.5,
        neckHalfWidth: 4,
      };
    case 'fox':
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
