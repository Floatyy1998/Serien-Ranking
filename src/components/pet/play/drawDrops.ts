import type { DropKind } from '../../../lib/pet/snackRain';

/** Zeichnet einen fallenden Gegenstand im Mini-Spiel, zentriert auf (x, y). */
export function drawDrop(
  ctx: CanvasRenderingContext2D,
  kind: DropKind,
  x: number,
  y: number,
  spin: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(spin) * 0.35);
  switch (kind) {
    case 'bone': {
      ctx.fillStyle = '#f1d3a5';
      ctx.fillRect(-8, -2.5, 16, 5);
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(sx * 8, sy * 2.6, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'fish': {
      ctx.fillStyle = '#7fd3f7';
      ctx.beginPath();
      ctx.ellipse(-1, 0, 8, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(12, -5);
      ctx.lineTo(12, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(-5, -1, 1.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cookie': {
      ctx.fillStyle = '#d9a35f';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5b3a1e';
      for (const [cx, cy] of [
        [-3, -2],
        [2.5, -3],
        [1, 2.5],
        [-2.5, 3],
        [4, 1],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'star': {
      ctx.shadowColor = 'rgba(255, 214, 102, 0.9)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd666';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 9 : 4;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'broccoli': {
      ctx.fillStyle = '#7cb342';
      ctx.fillRect(-2, 0, 4, 8);
      ctx.fillStyle = '#4c8b2b';
      for (const [cx, cy, r] of [
        [-4, -2, 4.2],
        [4, -2, 4.2],
        [0, -5, 4.6],
        [0, 0, 3.8],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}
