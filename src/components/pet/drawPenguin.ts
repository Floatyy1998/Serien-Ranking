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

// Helper: gefülltes Dreieck
const triFill = (
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  ps: number,
  offset: number
) => {
  ctx.beginPath();
  ctx.moveTo(points[0][0] * ps, points[0][1] * ps + offset);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * ps, points[i][1] * ps + offset);
  ctx.closePath();
  ctx.fill();
};

/**
 * PINGUIN — birnenförmiger Körper (User-Farbe als Frack), weißer Bauch,
 * wackelnde Flossen, oranger Schnabel + Füße. Ab Lv50 „Kaiserpinguin"-Form
 * mit goldenem Kragen, Eiskronen-Zacken und Brust-Emblem.
 */
export const drawPenguin = (
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  dark: string,
  _light: string,
  offset: number,
  animated: boolean,
  frame: number,
  animationSpeed: number,
  equippedSlot?: AccessorySlot | null
): void => {
  const centerX = 16;
  const centerY = 16;
  const emperor = level >= 50;

  const sizeBoost = emperor
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

  // Flossen-Wackeln (Watschel-Charme)
  const flap = animated ? Math.sin(frame * 0.08 * animationSpeed) * 0.25 : 0;

  // KÖRPER (Birne: unten breiter)
  const bodyRx = 5.6 * sizeBoost;
  const bodyRy = 7.2 * sizeBoost;
  const bodyCY = centerY + 2;
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  // Kopf-Rundung oben (schmaler)
  ctx.fillStyle = color;
  arcFill(ctx, centerX, bodyCY - bodyRy * 0.72, bodyRx * 0.78, ps, offset);

  // Seitenschattierung
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.45, bodyCY + 0.5, bodyRx * 0.62, bodyRy * 0.8, ps, offset);

  // WEISSER BAUCH (das Pinguin-Markenzeichen)
  ctx.fillStyle = '#FFFFFF';
  ellipseFill(ctx, centerX, bodyCY + 1.2, bodyRx * 0.6, bodyRy * 0.68, ps, offset);

  // GESICHTS-FELD (weiße Wangen, die in den Bauch übergehen)
  const headCY = bodyCY - bodyRy * 0.62;
  ctx.fillStyle = '#FFFFFF';
  arcFill(ctx, centerX - 1.9, headCY + 0.4, 1.7, ps, offset);
  arcFill(ctx, centerX + 1.9, headCY + 0.4, 1.7, ps, offset);

  // FLOSSEN (seitlich, wackeln beim Watscheln)
  ctx.fillStyle = dark;
  ellipseFill(ctx, centerX - bodyRx * 1.02, bodyCY + 0.5, 1.4, 3.8, ps, offset, -0.35 - flap);
  ellipseFill(ctx, centerX + bodyRx * 1.02, bodyCY + 0.5, 1.4, 3.8, ps, offset, 0.35 + flap);

  // AUGEN
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 1.7, headCY, 0.9, 0.25, ps, offset);
    ellipseFill(ctx, centerX + 1.7, headCY, 0.9, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 1.7, headCY, 0.95, ps, offset);
    arcFill(ctx, centerX + 1.7, headCY, 0.95, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 2, headCY - 0.35, 0.32, ps, offset);
    arcFill(ctx, centerX + 1.4, headCY - 0.35, 0.32, ps, offset);
  }

  // SCHNABEL
  ctx.fillStyle = '#FF9E42';
  triFill(
    ctx,
    [
      [centerX - 1, headCY + 1],
      [centerX + 1, headCY + 1],
      [centerX, headCY + 2.4],
    ],
    ps,
    offset
  );
  ctx.fillStyle = '#E8842E';
  triFill(
    ctx,
    [
      [centerX - 0.5, headCY + 1.8],
      [centerX + 0.5, headCY + 1.8],
      [centerX, headCY + 2.4],
    ],
    ps,
    offset
  );

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, centerX - 3, headCY + 1.1, 0.7, ps, offset);
  arcFill(ctx, centerX + 3, headCY + 1.1, 0.7, ps, offset);

  // FÜSSE
  ctx.fillStyle = '#FF9E42';
  ellipseFill(ctx, centerX - 2.1, bodyCY + bodyRy - 0.3, 1.5, 0.8, ps, offset, -0.15);
  ellipseFill(ctx, centerX + 2.1, bodyCY + bodyRy - 0.3, 1.5, 0.8, ps, offset, 0.15);

  // KAISER-DETAILS (Lv50+): Eiskrone, Gold-Kragen, Schneeflocken-Emblem
  if (emperor) {
    if (equippedSlot !== 'head') {
      const crownY = bodyCY - bodyRy * 0.72 - bodyRx * 0.78;
      ctx.fillStyle = '#B3E5FC';
      for (let i = -1; i <= 1; i++) {
        triFill(
          ctx,
          [
            [centerX + i * 2 - 0.9, crownY + 0.8],
            [centerX + i * 2 + 0.9, crownY + 0.8],
            [centerX + i * 2, crownY - (i === 0 ? 2.2 : 1.4)],
          ],
          ps,
          offset
        );
      }
    }
    // Gold-Kragen um den Hals
    if (equippedSlot !== 'neck') {
      ctx.fillStyle = '#FFD54F';
      ellipseFill(ctx, centerX, headCY + 3.1, bodyRx * 0.66, 0.55, ps, offset);
    }
    // Schneeflocken-Emblem auf der Brust
    const glow = animated ? 0.5 + Math.sin(frame * 0.05 * animationSpeed) * 0.2 : 0.5;
    ctx.strokeStyle = `rgba(79, 195, 247, ${glow + 0.3})`;
    ctx.lineWidth = ps * 0.4;
    const ex = centerX * ps;
    const ey = (bodyCY + 1.6) * ps + offset;
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(ex - Math.cos(ang) * 1.6 * ps, ey - Math.sin(ang) * 1.6 * ps);
      ctx.lineTo(ex + Math.cos(ang) * 1.6 * ps, ey + Math.sin(ang) * 1.6 * ps);
      ctx.stroke();
    }
  }
};
