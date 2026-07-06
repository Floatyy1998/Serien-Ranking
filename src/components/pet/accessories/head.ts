import type { PetAnchors } from './shared';
import { darken } from './shared';

export function drawBeanie(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawBaseballCap(
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

export function drawFlowerCrown(
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

export function drawBandana(
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

export function drawPartyHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawTopHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawSantaHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawPirateHat(
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

export function drawWizardHat(
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

export function drawVikingHelmet(
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

export function drawCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawHalo(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawDevilHorns(
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

export function drawBeret(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawHeadband(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawCowboyHat(
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

export function drawGraduationCap(
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

export function drawStrawHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawMilitaryHelmet(
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

export function drawAstronautHelmet(
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

export function drawUnicornHorn(
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

export function drawRobotHead(
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

export function drawAlienAntenna(
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

export function drawDiamondTiara(
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

export function drawChefHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawCatEars(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawSamuraiHelmet(
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

export function drawWitchHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawMushHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawFoxEars(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawIceHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawStarHelmet(
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

export function drawPhoenixFeatherHead(
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

export function drawAncientCrown(
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

export function drawCosmicHelm(
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

export function drawShadowHood(
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

export function drawCelestialCrown(
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

export function drawVolcanoHelm(
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

export function drawLotusHelm(
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

export function drawGlitchCrown(
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

export function drawPyramidHelm(
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
