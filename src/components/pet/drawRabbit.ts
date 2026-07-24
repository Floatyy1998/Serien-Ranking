import type { AccessorySlot } from '../../types/pet.types';

// Helper: gefüllter Kreis via Canvas-Arc (sieht beim Pixel-Skalieren weich-rund aus)
const arcFill = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ps: number,
  offset: number
) => {
  ctx.beginPath();
  ctx.arc(cx * ps, cy * ps + offset, r * ps, 0, Math.PI * 2);
  ctx.fill();
};

// Helper: gefüllte Ellipse
const ellipseFill = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ps: number,
  offset: number,
  rotation: number = 0
) => {
  ctx.beginPath();
  ctx.ellipse(cx * ps, cy * ps + offset, rx * ps, ry * ps, rotation, 0, Math.PI * 2);
  ctx.fill();
};

/**
 * HASE — Kawaii-Silhouette: großer runder Kopf, lange Stehohren mit rosa
 * Innenohr, Hasenzähnchen, Puschelschwanz. Ab Lv50 „Mondhase"-Form mit
 * goldener Mondscheibe, Mondsichel-Brustzeichen und Sternenstaub.
 */
export const drawRabbit = (
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  dark: string,
  light: string,
  offset: number,
  animated: boolean,
  frame: number,
  animationSpeed: number,
  equippedSlot?: AccessorySlot | null
): void => {
  const centerX = 16;
  const moonRabbit = level >= 50;

  const sizeBoost = moonRabbit
    ? 1.16
    : level >= 20
      ? 1.12
      : level >= 15
        ? 1.08
        : level >= 10
          ? 1.05
          : level >= 5
            ? 1.02
            : 1;

  const sway = animated ? Math.sin(frame * 0.05 * animationSpeed) * 0.3 : 0;

  const headR = 6 * sizeBoost;
  const headCY = 13.5;
  const bodyCY = 21.5;
  const bodyRx = 4.9 * sizeBoost;
  const bodyRy = 4.3 * sizeBoost;

  // MONDSCHEIBE (Lv50+, hinter dem Kopf; weicht Kopf-Accessoires)
  if (moonRabbit && equippedSlot !== 'head') {
    const moonAlpha = animated ? 0.5 + Math.sin(frame * 0.04 * animationSpeed) * 0.15 : 0.5;
    ctx.fillStyle = `rgba(255, 224, 130, ${moonAlpha})`;
    arcFill(ctx, centerX, headCY - 2, headR + 3, ps, offset);
    ctx.fillStyle = '#FFE082';
    arcFill(ctx, centerX, headCY - 2, headR + 2.2, ps, offset);
  }

  // OHREN (lang und aufrecht, wippen leicht)
  const earLen = 5.6 * sizeBoost;
  ctx.fillStyle = color;
  ellipseFill(
    ctx,
    centerX - 2.4 + sway * 0.3,
    headCY - headR - earLen * 0.55,
    1.45,
    earLen * 0.62,
    ps,
    offset,
    -0.12
  );
  ellipseFill(
    ctx,
    centerX + 2.4 - sway * 0.3,
    headCY - headR - earLen * 0.55,
    1.45,
    earLen * 0.62,
    ps,
    offset,
    0.12
  );
  ctx.fillStyle = '#FFB6C1';
  ellipseFill(
    ctx,
    centerX - 2.4 + sway * 0.3,
    headCY - headR - earLen * 0.5,
    0.75,
    earLen * 0.45,
    ps,
    offset,
    -0.12
  );
  ellipseFill(
    ctx,
    centerX + 2.4 - sway * 0.3,
    headCY - headR - earLen * 0.5,
    0.75,
    earLen * 0.45,
    ps,
    offset,
    0.12
  );

  // PUSCHELSCHWANZ (seitlich hinter dem Körper)
  ctx.fillStyle = light;
  arcFill(ctx, centerX + bodyRx + 0.8, bodyCY + 1.2, 1.4, ps, offset);

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.4, bodyCY + 0.4, bodyRx * 0.6, bodyRy * 0.75, ps, offset);
  // Bauch
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, bodyCY + 0.6, bodyRx * 0.55, bodyRy * 0.62, ps, offset);

  // MONDSICHEL-BRUSTZEICHEN (Lv50+, weicht Hals-Accessoires)
  if (moonRabbit && equippedSlot !== 'neck') {
    ctx.fillStyle = '#FFB300';
    arcFill(ctx, centerX, bodyCY + 0.6, 1.2, ps, offset);
    ctx.fillStyle = light;
    arcFill(ctx, centerX + 0.65, bodyCY + 0.35, 1.05, ps, offset);
  }

  // FÜSSE (große Ovale)
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX - 2.4, bodyCY + bodyRy - 0.3, 1.7, 0.95, ps, offset);
  ellipseFill(ctx, centerX + 2.4, bodyCY + bodyRy - 0.3, 1.7, 0.95, ps, offset);
  ctx.fillStyle = '#FFB6C1';
  ellipseFill(ctx, centerX - 2.4, bodyCY + bodyRy - 0.25, 0.9, 0.45, ps, offset);
  ellipseFill(ctx, centerX + 2.4, bodyCY + bodyRy - 0.25, 0.9, 0.45, ps, offset);

  // KOPF
  ctx.fillStyle = color;
  arcFill(ctx, centerX, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, centerX + headR * 0.45, headCY + 0.5, headR * 0.5, headR * 0.75, ps, offset);

  // SCHNAUZE
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, headCY + headR * 0.45, headR * 0.48, headR * 0.36, ps, offset);

  // AUGEN
  const eyeY = headCY + 0.3;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.5, eyeY, 0.95, 0.25, ps, offset);
    ellipseFill(ctx, centerX + 2.5, eyeY, 0.95, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.5, eyeY, 0.95, ps, offset);
    arcFill(ctx, centerX + 2.5, eyeY, 0.95, ps, offset);
    if (moonRabbit) {
      ctx.fillStyle = '#FFE082';
      arcFill(ctx, centerX - 2.5, eyeY, 0.45, ps, offset);
      arcFill(ctx, centerX + 2.5, eyeY, 0.45, ps, offset);
      ctx.fillStyle = '#1A1A1A';
      arcFill(ctx, centerX - 2.5, eyeY, 0.22, ps, offset);
      arcFill(ctx, centerX + 2.5, eyeY, 0.22, ps, offset);
    }
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 2.8, eyeY - 0.35, 0.32, ps, offset);
    arcFill(ctx, centerX + 2.2, eyeY - 0.35, 0.32, ps, offset);
  }

  // NASE + HASENZÄHNE
  ctx.fillStyle = '#FF8A9D';
  ellipseFill(ctx, centerX, headCY + 1.6, 0.55, 0.42, ps, offset);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((centerX - 0.75) * ps, (headCY + 2.25) * ps + offset, ps * 0.72, ps * 1.05);
  ctx.fillRect((centerX + 0.03) * ps, (headCY + 2.25) * ps + offset, ps * 0.72, ps * 1.05);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = ps * 0.12;
  ctx.beginPath();
  ctx.moveTo(centerX * ps, (headCY + 2.25) * ps + offset);
  ctx.lineTo(centerX * ps, (headCY + 3.3) * ps + offset);
  ctx.stroke();

  // STERNENSTAUB (Lv50+): funkelnde Punkte um den Kopf
  if (moonRabbit) {
    const dotAlpha = animated ? 0.5 + Math.sin(frame * 0.07 * animationSpeed) * 0.3 : 0.5;
    ctx.fillStyle = `rgba(255, 245, 200, ${dotAlpha})`;
    arcFill(ctx, centerX - headR - 1.6, headCY - 2.5, 0.35, ps, offset);
    arcFill(ctx, centerX + headR + 1.4, headCY - 1.2, 0.3, ps, offset);
    arcFill(ctx, centerX - headR - 0.6, headCY + 2.6, 0.28, ps, offset);
  }

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, centerX - headR * 0.68, headCY + 1.9, 0.75, ps, offset);
  arcFill(ctx, centerX + headR * 0.68, headCY + 1.9, 0.75, ps, offset);
};
