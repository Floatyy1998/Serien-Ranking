import { useEffect, useRef } from 'react';
import { adjustColor } from '../../components/pet/colorUtils';
import { drawDragonWingsOverlay } from '../../components/pet/drawDragon';
import { STICKER_DRAWERS } from './stickers';

/** Rendert einen Pet-Sticker (transparenter Hintergrund) auf Canvas. */
export const StickerCanvas = ({ stickerId, size }: { stickerId: string; size: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [pet, levelStr] = stickerId.split('-');
    const entry = STICKER_DRAWERS[pet];
    if (!entry) return;
    const level = Number(levelStr) || 25;
    // In Gerätepixeln rendern und CSS-Größe exakt darauf mappen — sonst wird
    // das Pixel-Art auf High-DPI-Displays matschig hochskaliert.
    const dpr = window.devicePixelRatio || 1;
    const ps = Math.max(1, Math.round((size * dpr) / 32));
    canvas.width = ps * 32;
    canvas.height = ps * 32;
    canvas.style.width = `${(ps * 32) / dpr}px`;
    canvas.style.height = `${(ps * 32) / dpr}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { fn, color } = entry;
    fn(ctx, level, ps, color, adjustColor(color, -40), adjustColor(color, 40), 0, false, 0, 1);
    if (pet === 'dragon') {
      drawDragonWingsOverlay(ctx, level, ps, color, adjustColor(color, -40), 0, false, 0, 1);
    }
  }, [stickerId, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
};
