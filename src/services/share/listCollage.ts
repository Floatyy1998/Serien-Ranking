/**
 * Collage-Bild einer geteilten Liste (bis zu vier Poster + Name), wird beim
 * externen Teilen als Foto angehängt. Poster kommen per fetch als Blob, damit
 * der Canvas nicht durch Cross-Origin-Bilder gesperrt wird.
 */
import { getImageUrl } from '../../utils/imageUrl';

const WIDTH = 1200;
const HEIGHT = 780;
const POSTER_H = 440;
const POSTER_W = 293;

const cssVar = (name: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

async function loadPoster(path: string): Promise<ImageBitmap | null> {
  const url = getImageUrl(path, 'w500', '');
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 22;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

export async function renderListCollage(options: {
  name: string;
  subtitle: string;
  posterPaths: string[];
}): Promise<Blob | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return null;

  const bitmaps = (await Promise.all(options.posterPaths.slice(0, 4).map(loadPoster))).filter(
    (b): b is ImageBitmap => !!b
  );

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bg = cssVar('--theme-background', '#2b1a2e');
  const primary = cssVar('--theme-primary', '#ef6f8a');
  const accent = cssVar('--theme-accent', '#f2a648');
  const text = cssVar('--theme-text-secondary', '#f1e8ee');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(WIDTH / 2, 0, 40, WIDTH / 2, 0, WIDTH * 0.8);
  const hex = /^#[0-9a-f]{6}$/i.test(primary) ? primary : '#ef6f8a';
  glow.addColorStop(0, `${hex}66`);
  glow.addColorStop(1, `${hex}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const n = bitmaps.length;
  const top = 60;
  if (n > 0) {
    const step = n > 1 ? Math.min(POSTER_W + 24, (WIDTH - 60 - POSTER_W) / (n - 1)) : 0;
    const total = POSTER_W + step * (n - 1);
    const left = (WIDTH - total) / 2;
    bitmaps.forEach((bmp, i) => {
      const x = left + step * i;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 18;
      roundedRect(ctx, x, top, POSTER_W, POSTER_H);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();
      ctx.save();
      roundedRect(ctx, x, top, POSTER_W, POSTER_H);
      ctx.clip();
      const scale = Math.max(POSTER_W / bmp.width, POSTER_H / bmp.height);
      const dw = bmp.width * scale;
      const dh = bmp.height * scale;
      ctx.drawImage(bmp, x + (POSTER_W - dw) / 2, top + (POSTER_H - dh) / 2, dw, dh);
      ctx.restore();
    });
  }

  const family = cssVar('--font-display', 'system-ui, sans-serif');
  ctx.textAlign = 'center';
  ctx.fillStyle = text;
  ctx.font = `800 64px ${family}`;
  ctx.fillText(fitText(ctx, options.name, WIDTH - 120), WIDTH / 2, top + POSTER_H + 100);

  ctx.globalAlpha = 0.72;
  ctx.font = `500 32px ${family}`;
  ctx.fillText(fitText(ctx, options.subtitle, WIDTH - 120), WIDTH / 2, top + POSTER_H + 150);
  ctx.globalAlpha = 1;

  const brand = ctx.createLinearGradient(WIDTH / 2 - 90, 0, WIDTH / 2 + 90, 0);
  brand.addColorStop(0, primary);
  brand.addColorStop(1, accent);
  ctx.fillStyle = brand;
  ctx.font = `800 28px ${family}`;
  ctx.fillText('TV-RANK', WIDTH / 2, HEIGHT - 36);

  bitmaps.forEach((b) => b.close());
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9));
}
