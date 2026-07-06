import type { PetAnchors } from './shared';

export function drawRoundGlasses(
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

export function drawSunglasses(
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

export function drawHeartGlasses(
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

export function drawMonocle(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawStarShades(
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

export function drawLaserVisor(
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

export function drawTheatreMask(
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

export function drawSurgeonMask(
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

export function drawNerdGlasses(
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

export function drawClownNose(
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

export function drawCyclopsEye(
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

export function drawSkiGoggles(
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

export function drawVisionVisor(
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

export function drawDiamondMask(
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

export function drawNinjaMask(
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

export function drawAviatorGoggles(
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

export function drawNightOwlGoggles(
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

export function drawPixelShades(
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

export function drawSteamGoggles(
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

export function drawButterflyMask(
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

export function drawGhostMask(
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

export function drawPrismVisor(
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

export function drawCrystalMonocle(
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

export function drawTimeTravelerGoggles(
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

export function drawAbyssVisor(
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

export function drawEclipseGoggles(
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

export function drawVoidMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawMirrorShades(
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
