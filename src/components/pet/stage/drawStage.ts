import type { Particle, PetView, Prop } from '../../../lib/pet/petBrain';
import type { SeasonId } from '../../../theme/seasonalThemes';
import type { Pet } from '../../../types/pet.types';
import { drawPetFigure, petColors, type PetColors } from '../renderPet';
import { seasonCostume } from '../seasonCostume';
import { drawGravestone } from './drawGravestone';

const feetCache = new Map<string, BodyGeom>();

function levelBucket(level: number): number {
  return level >= 50
    ? 50
    : level >= 20
      ? 20
      : level >= 15
        ? 15
        : level >= 10
          ? 10
          : level >= 5
            ? 5
            : 1;
}

interface BodyGeom {
  feet: number;
  top: number;
  halfW: number;
}

/** Unterkante der Füße im 32er-Raster, einmal pro Typ/Stufe ausgemessen. */
export function feetY(pet: Pet): number {
  return bodyGeom(pet).feet;
}

/** Umriss der Figur im 32er-Raster: Füße, Scheitel und halbe Breite. */
function bodyGeom(pet: Pet): BodyGeom {
  const key = `${pet.type}:${levelBucket(pet.level)}`;
  const cached = feetCache.get(key);
  if (cached !== undefined) return cached;
  const result: BodyGeom = { feet: 27, top: 5, halfW: 10 };
  try {
    const scale = 4;
    const canvas = document.createElement('canvas');
    canvas.width = 32 * scale;
    canvas.height = 34 * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawPetFigure(
        ctx,
        { ...pet, accessories: [] },
        {
          ps: scale,
          offset: 0,
          animated: false,
          frame: 0,
          animationSpeed: 1,
        }
      );
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let minX = width;
      let maxX = -1;
      let minY = height;
      let maxY = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] > 40) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxY >= 0) {
        result.feet = (maxY + 1) / scale;
        result.top = minY / scale;
        result.halfW = Math.max(16 - minX / scale, (maxX + 1) / scale - 16);
      }
    }
  } catch {
    // jsdom und Canvas ohne getImageData: Standardwert
  }
  feetCache.set(key, result);
  return result;
}

export interface StageFrame {
  pet: Pet;
  view: PetView;
  props: Prop[];
  particles: Particle[];
  groundY: number;
  ps: number;
  time: number;
  season: SeasonId | null;
  accent: string;
  colors?: PetColors;
}

const CONFETTI = ['#ff5c8a', '#ffd166', '#7bdff2', '#b388ff', '#9be15d'];
const NOTE_COLORS = ['#ffd166', '#7bdff2', '#ff8fb1', '#b9f6ca', '#d1b3ff'];

export function drawStageFrame(ctx: CanvasRenderingContext2D, f: StageFrame): void {
  const { view, ps, groundY } = f;

  if (view.activity === 'dead') {
    drawGravestone(ctx, f.pet.name, view.x, groundY, ps, f.time);
    drawParticles(ctx, f.particles, groundY, ps);
    return;
  }

  drawShadow(ctx, view.x, groundY, view.h, ps);

  drawProps(ctx, f.props, groundY, ps, f.time, f.accent);

  const body = bodyGeom(f.pet);
  const feet = body.feet;
  const turn = Math.sign(view.turn || 1) * Math.max(0.14, Math.abs(view.turn));
  ctx.save();
  ctx.translate(view.x, groundY - view.h - view.bob);
  ctx.rotate(view.tilt);
  if (view.roll) {
    // um die Körpermitte drehen und so weit absenken, dass die Figur auf dem Boden bleibt
    const halfH = (feet - body.top) / 2;
    const c = Math.cos(view.roll);
    const s = Math.sin(view.roll);
    const reach = Math.sqrt((halfH * c) ** 2 + (body.halfW * s) ** 2);
    const mid = halfH * ps;
    ctx.translate(0, (halfH - reach) * ps - mid);
    ctx.rotate(view.roll);
    ctx.translate(0, mid);
  }
  ctx.scale(view.flip * view.squashX * turn, view.squashY);
  ctx.translate(-16 * ps, -feet * ps);
  drawPetFigure(ctx, f.pet, {
    ps,
    offset: 0,
    animated: true,
    frame: f.time * 60,
    animationSpeed: 1,
    pose: view.pose,
    colors: f.colors ?? petColors(f.pet),
    overlay: seasonCostume(f.pet, f.season, ps, 0),
  });
  ctx.restore();

  for (const p of f.props) {
    if (p.carried) drawCarried(ctx, p, view, groundY, ps, f.time);
  }

  drawParticles(ctx, f.particles, groundY, ps);
}

export function drawProps(
  ctx: CanvasRenderingContext2D,
  props: Prop[],
  groundY: number,
  ps: number,
  time: number,
  accent: string
): void {
  for (const p of props) if (!p.carried) drawProp(ctx, p, groundY, ps, time, accent);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  groundY: number,
  ps: number
): void {
  for (const p of particles) drawParticle(ctx, p, groundY, ps);
}

function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  h: number,
  ps: number
) {
  const k = Math.max(0.35, 1 - h / 180);
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${0.26 * k})`;
  ctx.beginPath();
  ctx.ellipse(x, groundY - ps * 0.3, 7 * ps * k, 1.6 * ps * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.45, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.4, x, y + s * 0.35);
  ctx.closePath();
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.32;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, groundY: number, ps: number) {
  const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
  const x = p.x;
  const y = groundY - p.h;
  ctx.save();
  ctx.globalAlpha = p.kind === 'dust' ? alpha * 0.45 : alpha;
  switch (p.kind) {
    case 'heart': {
      ctx.fillStyle = '#ff5c8a';
      heartPath(ctx, x, y, 3.2 * ps * p.size);
      ctx.fill();
      break;
    }
    case 'z': {
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.round(5 * ps * p.size)}px Satoshi, system-ui, sans-serif`;
      ctx.fillText('z', x, y);
      break;
    }
    case 'confetti': {
      ctx.translate(x, y);
      ctx.rotate(p.rot);
      ctx.fillStyle = CONFETTI[p.tint % CONFETTI.length];
      ctx.fillRect(-1.6 * ps, -0.8 * ps, 3.2 * ps, 1.6 * ps);
      break;
    }
    case 'sparkle': {
      ctx.fillStyle = '#fff6c9';
      starPath(ctx, x, y, 2.6 * ps * p.size);
      ctx.fill();
      break;
    }
    case 'crumb': {
      ctx.fillStyle = '#c98b4a';
      ctx.fillRect(x - ps * 0.5, y - ps * 0.5, ps, ps);
      break;
    }
    case 'popcorn': {
      ctx.fillStyle = '#fff4d6';
      ctx.beginPath();
      ctx.arc(x, y, ps * 0.9, 0, Math.PI * 2);
      ctx.arc(x + ps * 0.7, y - ps * 0.3, ps * 0.7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'note': {
      ctx.translate(x, y);
      ctx.rotate(Math.sin(p.rot) * 0.3);
      ctx.fillStyle = NOTE_COLORS[p.tint % NOTE_COLORS.length];
      const s = ps * p.size;
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.5 * s, 1.1 * s, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(1.1 * s, -5.5 * s, 0.6 * s, 5.5 * s);
      ctx.beginPath();
      ctx.moveTo(1.7 * s, -5.5 * s);
      ctx.quadraticCurveTo(3.6 * s, -4.6 * s, 3.2 * s, -2.6 * s);
      ctx.lineTo(2.6 * s, -3);
      ctx.quadraticCurveTo(2.9 * s, -4.2 * s, 1.7 * s, -4.4 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'fire': {
      const r = ps * 1.6 * p.size * (0.6 + alpha * 0.6);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#fff3b0');
      g.addColorStop(0.45, '#ffb347');
      g.addColorStop(1, 'rgba(255, 90, 40, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bubble': {
      ctx.strokeStyle = 'rgba(200, 240, 255, 0.85)';
      ctx.lineWidth = Math.max(1, ps * 0.35);
      ctx.beginPath();
      ctx.arc(x, y, ps * 1.3 * p.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(x - ps * 0.45, y - ps * 0.45, ps * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'dust': {
      ctx.fillStyle = '#d9d2e6';
      ctx.beginPath();
      ctx.arc(x, y, ps * 1.6 * p.size * (1.6 - alpha * 0.6), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  p: Prop,
  groundY: number,
  ps: number,
  time: number,
  accent: string
) {
  const fade = Number.isFinite(p.ttl) ? Math.min(1, p.ttl / 0.6) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  if (p.kind === 'ball') {
    const r = 3.3 * ps;
    const y = groundY - p.h - r;
    drawShadow(ctx, p.x, groundY, p.h, ps * 0.5);
    ctx.translate(p.x, y);
    ctx.rotate(p.rot);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -0.5, 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff5c8a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, 2.6, 3.65);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = ps * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (p.kind === 'letter') {
    const glow = 0.5 + Math.sin(time * 4) * 0.25;
    const y = groundY - p.h - 4 * ps;
    ctx.translate(p.x, y);
    ctx.rotate(-0.12);
    ctx.shadowColor = `rgba(255, 220, 140, ${glow})`;
    ctx.shadowBlur = 10;
    drawEnvelope(ctx, ps, accent);
  } else if (p.kind === 'butterfly') {
    const y = groundY - p.h;
    const flap = Math.abs(Math.sin(time * 18));
    ctx.translate(p.x, y);
    ctx.rotate(Math.sin(time * 3) * 0.2);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * (0.35 + flap * 0.65), 1);
      const g = ctx.createLinearGradient(0, -4 * ps, 4 * ps, 3 * ps);
      g.addColorStop(0, '#ffd166');
      g.addColorStop(1, '#ff7aa8');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(1.8 * ps, -1.4 * ps, 2 * ps, 1.5 * ps, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(1.4 * ps, 1.1 * ps, 1.3 * ps, 1 * ps, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#2b1d33';
    ctx.fillRect(-0.3 * ps, -1.6 * ps, 0.6 * ps, 3.2 * ps);
  } else if (p.kind === 'snack') {
    const y = groundY - p.h - 2 * ps;
    drawShadow(ctx, p.x, groundY, p.h, ps * 0.45);
    ctx.translate(p.x, y);
    drawSnack(ctx, ps);
  }
  ctx.restore();
}

function drawCarried(
  ctx: CanvasRenderingContext2D,
  p: Prop,
  view: PetView,
  groundY: number,
  ps: number,
  time: number
) {
  ctx.save();
  if (p.kind === 'letter') {
    ctx.translate(view.x - view.flip * 1.5 * ps, groundY - view.h - view.bob - 9.6 * ps);
    ctx.rotate(view.tilt * 1.4 + Math.sin(time * 6) * 0.05 - view.flip * 0.12);
    drawEnvelope(ctx, ps * 0.8, '#ff5c8a');
  } else if (p.kind === 'popcorn') {
    ctx.translate(view.x + 4.5 * ps * -view.flip, groundY - view.h - 3.6 * ps);
    drawPopcornBucket(ctx, ps);
  }
  ctx.restore();
}

function drawEnvelope(ctx: CanvasRenderingContext2D, ps: number, seal: string) {
  const w = 9 * ps;
  const h = 6 * ps;
  ctx.fillStyle = '#fbf6ec';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#d9cdb4';
  ctx.lineWidth = ps * 0.35;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(0, h * 0.1);
  ctx.lineTo(w / 2, -h / 2);
  ctx.stroke();
  ctx.fillStyle = seal;
  heartPath(ctx, 0, h * 0.12, 1.5 * ps);
  ctx.fill();
}

function drawSnack(ctx: CanvasRenderingContext2D, ps: number) {
  // Knochen-Keks
  ctx.fillStyle = '#e8b36a';
  const w = 3.2 * ps;
  ctx.fillRect(-w, -ps * 0.8, w * 2, ps * 1.6);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * w, sy * ps * 0.9, ps * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(120, 70, 20, 0.35)';
  ctx.fillRect(-w * 0.6, -ps * 0.2, w * 1.2, ps * 0.4);
}

function drawPopcornBucket(ctx: CanvasRenderingContext2D, ps: number) {
  const top = -4.2 * ps;
  ctx.fillStyle = '#fff4d6';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc((-1.8 + i * 0.9) * ps, top - (i % 2) * ps * 0.6, ps * 1.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-2.6 * ps, top);
  ctx.lineTo(2.6 * ps, top);
  ctx.lineTo(2 * ps, 0);
  ctx.lineTo(-2 * ps, 0);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#e8414b';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo((i * 1.7 - 0.45) * ps, top);
    ctx.lineTo((i * 1.7 + 0.45) * ps, top);
    ctx.lineTo((i * 1.35 + 0.35) * ps, 0);
    ctx.lineTo((i * 1.35 - 0.35) * ps, 0);
    ctx.closePath();
    ctx.fill();
  }
}
