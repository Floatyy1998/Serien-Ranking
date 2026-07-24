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
 * KATZE — Kawaii-Silhouette: großer runder Kopf, spitze Dreiecksohren,
 * Schnurrhaare, geringelter Schwanz. Ab Lv50 „Säbelzahn"-Form mit Fängen,
 * Mähnenkranz und Bernstein-Schlitzaugen.
 */
export const drawCat = (
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
  const sabertooth = level >= 50;

  const sizeBoost = sabertooth
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

  const headR = 6.2 * sizeBoost;
  const headCY = 13;
  const bodyCY = 21.5;
  const bodyRx = 4.9 * sizeBoost;
  const bodyRy = 4.4 * sizeBoost;

  // SCHWANZ (geringelt, hinter dem Körper; wippt sanft)
  ctx.fillStyle = color;
  ctx.lineWidth = ps * 1.5;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(
    (centerX + bodyRx + 1.6) * ps,
    (bodyCY - 0.5 + sway * 0.5) * ps + offset,
    ps * 2.6,
    Math.PI * 0.9,
    Math.PI * 1.9
  );
  ctx.stroke();
  // Schwanzspitze
  ctx.fillStyle = sabertooth ? dark : light;
  arcFill(ctx, centerX + bodyRx + 4, bodyCY - 2 + sway * 0.5, 0.85, ps, offset);
  // Ringel-Streifen ab Lv5
  if (level >= 5) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = ps * 0.45;
    ctx.beginPath();
    ctx.arc(
      (centerX + bodyRx + 1.6) * ps,
      (bodyCY - 0.5 + sway * 0.5) * ps + offset,
      ps * 2.6,
      Math.PI * 1.15,
      Math.PI * 1.35
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      (centerX + bodyRx + 1.6) * ps,
      (bodyCY - 0.5 + sway * 0.5) * ps + offset,
      ps * 2.6,
      Math.PI * 1.55,
      Math.PI * 1.75
    );
    ctx.stroke();
  }

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.4, bodyCY + 0.4, bodyRx * 0.6, bodyRy * 0.75, ps, offset);
  // Brustfleck
  if (level >= 20 || sabertooth) {
    ctx.fillStyle = light;
    ellipseFill(ctx, centerX, bodyCY + 0.6, bodyRx * 0.55, bodyRy * 0.6, ps, offset);
  }

  // PFOTEN
  ctx.fillStyle = dark;
  ellipseFill(ctx, centerX - 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);
  ellipseFill(ctx, centerX + 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);

  // OHREN (spitze Dreiecke mit rosa Innenohr)
  const earTipY = headCY - headR - (sabertooth ? 2.6 : 2.1);
  ctx.fillStyle = color;
  triFill(
    ctx,
    [
      [centerX - headR * 0.85, headCY - headR * 0.45],
      [centerX - headR * 0.15, headCY - headR * 0.92],
      [centerX - headR * 0.62 + sway * 0.2, earTipY],
    ],
    ps,
    offset
  );
  triFill(
    ctx,
    [
      [centerX + headR * 0.85, headCY - headR * 0.45],
      [centerX + headR * 0.15, headCY - headR * 0.92],
      [centerX + headR * 0.62 - sway * 0.2, earTipY],
    ],
    ps,
    offset
  );
  ctx.fillStyle = '#FFB6C1';
  triFill(
    ctx,
    [
      [centerX - headR * 0.68, headCY - headR * 0.58],
      [centerX - headR * 0.34, headCY - headR * 0.82],
      [centerX - headR * 0.58 + sway * 0.2, earTipY + 1.1],
    ],
    ps,
    offset
  );
  triFill(
    ctx,
    [
      [centerX + headR * 0.68, headCY - headR * 0.58],
      [centerX + headR * 0.34, headCY - headR * 0.82],
      [centerX + headR * 0.58 - sway * 0.2, earTipY + 1.1],
    ],
    ps,
    offset
  );
  // Ohrbüschel ab Lv30 (weicht Kopf-Accessoires)
  if ((level >= 30 || sabertooth) && equippedSlot !== 'head') {
    ctx.fillStyle = light;
    triFill(
      ctx,
      [
        [centerX - headR * 0.66, earTipY + 1.2],
        [centerX - headR * 0.5, earTipY + 1.3],
        [centerX - headR * 0.58, earTipY - 0.8],
      ],
      ps,
      offset
    );
    triFill(
      ctx,
      [
        [centerX + headR * 0.66, earTipY + 1.2],
        [centerX + headR * 0.5, earTipY + 1.3],
        [centerX + headR * 0.58, earTipY - 0.8],
      ],
      ps,
      offset
    );
  }

  // KOPF (großer Kreis)
  ctx.fillStyle = color;
  arcFill(ctx, centerX, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, centerX + headR * 0.45, headCY + 0.5, headR * 0.5, headR * 0.75, ps, offset);

  // SÄBELZAHN-MÄHNE (Lv50+): Fellkranz um die Wangen
  if (sabertooth) {
    ctx.fillStyle = dark;
    for (let i = -2; i <= 2; i++) {
      triFill(
        ctx,
        [
          [centerX + i * 2.2 - 1, headCY + headR * 0.75],
          [centerX + i * 2.2 + 1, headCY + headR * 0.75],
          [centerX + i * 2.2, headCY + headR * 1.15],
        ],
        ps,
        offset
      );
    }
  }

  // SCHNAUZE (helles Feld unten am Kopf)
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, headCY + headR * 0.42, headR * 0.52, headR * 0.38, ps, offset);

  // AUGEN
  const eyeY = headCY + 0.3;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.6, eyeY, 0.95, 0.25, ps, offset);
    ellipseFill(ctx, centerX + 2.6, eyeY, 0.95, 0.25, ps, offset);
  } else if (sabertooth) {
    // Bernstein-Augen mit Schlitzpupille
    ctx.fillStyle = '#FFB300';
    arcFill(ctx, centerX - 2.6, eyeY, 1.05, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeY, 1.05, ps, offset);
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.6, eyeY, 0.3, 0.95, ps, offset);
    ellipseFill(ctx, centerX + 2.6, eyeY, 0.3, 0.95, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.6, eyeY, 0.95, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeY, 0.95, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 2.9, eyeY - 0.35, 0.32, ps, offset);
    arcFill(ctx, centerX + 2.3, eyeY - 0.35, 0.32, ps, offset);
  }

  // NASE + MUND
  ctx.fillStyle = '#FF8A9D';
  triFill(
    ctx,
    [
      [centerX - 0.55, headCY + 1.7],
      [centerX + 0.55, headCY + 1.7],
      [centerX, headCY + 2.45],
    ],
    ps,
    offset
  );
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(
    (centerX - 0.8) * ps,
    (headCY + 2.6) * ps + offset,
    ps * 0.8,
    0.15 * Math.PI,
    0.85 * Math.PI
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    (centerX + 0.8) * ps,
    (headCY + 2.6) * ps + offset,
    ps * 0.8,
    0.15 * Math.PI,
    0.85 * Math.PI
  );
  ctx.stroke();

  // SÄBELZÄHNE (Lv50+)
  if (sabertooth) {
    ctx.fillStyle = '#FFFFFF';
    triFill(
      ctx,
      [
        [centerX - 1.9, headCY + 3],
        [centerX - 0.9, headCY + 3],
        [centerX - 1.4, headCY + 4.9],
      ],
      ps,
      offset
    );
    triFill(
      ctx,
      [
        [centerX + 0.9, headCY + 3],
        [centerX + 1.9, headCY + 3],
        [centerX + 1.4, headCY + 4.9],
      ],
      ps,
      offset
    );
  }

  // SCHNURRHAARE
  ctx.strokeStyle = dark;
  ctx.lineWidth = ps * 0.2;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo((centerX + side * headR * 0.42) * ps, (headCY + 1.6 + i * 0.9) * ps + offset);
      ctx.lineTo(
        (centerX + side * (headR * 0.42 + 2.6)) * ps,
        (headCY + 1.2 + i * 1.1) * ps + offset
      );
      ctx.stroke();
    }
  }

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, centerX - headR * 0.68, headCY + 1.9, 0.75, ps, offset);
  arcFill(ctx, centerX + headR * 0.68, headCY + 1.9, 0.75, ps, offset);
};
