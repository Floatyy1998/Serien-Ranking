import type { PetAnchors } from './shared';
import { darken, lighten } from './shared';

export function drawCollar(
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

export function drawBow(
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

export function drawBowtie(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawGoldChain(
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

export function drawCape(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawMedal(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawTie(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawBandkerchief(
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

export function drawLocket(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawBellCollar(
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

export function drawFlowerGarland(
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

export function drawRubyPendant(
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

export function drawAnchorChain(
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

export function drawRoyalSash(
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

export function drawDragonPendant(
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

export function drawPhoenixFeatherNeck(
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

export function drawCosmicAmulet(
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

export function drawRoyalCape(
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

export function drawLei(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
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

export function drawGalaxyCape(
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

export function drawLuckyClover(
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

export function drawRainbowScarf(
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

export function drawShellNecklace(
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

export function drawThunderChain(
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

export function drawSolarAmulet(
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

export function drawTrophyNecklace(
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

export function drawInfinityScarf(
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

export function drawChampionBelt(
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

export function drawEnchantedRose(
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

export function drawDragonScaleCollar(
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

export function drawRuneNecklace(
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

export function drawSakuraPendant(
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

export function drawObsidianAmulet(
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
