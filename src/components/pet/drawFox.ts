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
 * FUCHS — Kawaii-Silhouette mit klassischer Fuchs-Optik: große Ohren mit
 * dunklen Spitzen OBEN auf dem Kopf, weiße Gesichtsmaske (untere Hälfte),
 * dunkle Nase, großer Puschelschwanz mit weißer Spitze, der seitlich neben
 * dem Körper hochsteht. Ab Lv50 „Göttliche Kitsune"-Form mit drei Schweifen,
 * roten Zeichen und Fuchsfeuer.
 */
export const drawFox = (
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
  const kitsune = level >= 50;

  const sizeBoost = kitsune
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
  const white = '#FFF8F0';

  // PUSCHELSCHWANZ (groß, steht seitlich neben dem Körper hoch; Kitsune: drei)
  const tailRots = kitsune ? [-0.55, 0, 0.55] : [0];
  for (const rot of tailRots) {
    const tx = centerX + bodyRx + 2 + rot * 2.6;
    const ty = bodyCY - 2.6 - Math.abs(rot) * 1.4 + sway * 0.4;
    ctx.fillStyle = color;
    ellipseFill(ctx, tx, ty, 2.1, 4.4, ps, offset, 0.35 + rot * 0.5);
    // weiße Spitze (oberes Drittel)
    ctx.fillStyle = white;
    ellipseFill(
      ctx,
      tx - Math.sin(0.35 + rot * 0.5) * 2.9,
      ty - Math.cos(0.35 + rot * 0.5) * 2.9,
      1.35,
      1.7,
      ps,
      offset,
      0.35 + rot * 0.5
    );
  }

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.4, bodyCY + 0.4, bodyRx * 0.6, bodyRy * 0.75, ps, offset);
  // Weiße Brust
  ctx.fillStyle = white;
  ellipseFill(ctx, centerX, bodyCY + 0.6, bodyRx * 0.55, bodyRy * 0.62, ps, offset);

  // PFOTEN (dunkle „Socken")
  ctx.fillStyle = dark;
  ellipseFill(ctx, centerX - 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);
  ellipseFill(ctx, centerX + 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);

  // OHREN (groß, OBEN auf dem Kopf, mit dunklen Spitzen und hellem Innenohr)
  const earBaseY = headCY - headR * 0.62;
  const earTipY = headCY - headR - 3.6;
  ctx.fillStyle = color;
  triFill(
    ctx,
    [
      [centerX - headR * 0.78, earBaseY],
      [centerX - headR * 0.08, earBaseY - 0.8],
      [centerX - headR * 0.52 + sway * 0.2, earTipY],
    ],
    ps,
    offset
  );
  triFill(
    ctx,
    [
      [centerX + headR * 0.78, earBaseY],
      [centerX + headR * 0.08, earBaseY - 0.8],
      [centerX + headR * 0.52 - sway * 0.2, earTipY],
    ],
    ps,
    offset
  );
  // dunkle Ohrspitzen
  ctx.fillStyle = dark;
  triFill(
    ctx,
    [
      [centerX - headR * 0.66, earTipY + 2.2],
      [centerX - headR * 0.36, earTipY + 2],
      [centerX - headR * 0.52 + sway * 0.2, earTipY],
    ],
    ps,
    offset
  );
  triFill(
    ctx,
    [
      [centerX + headR * 0.66, earTipY + 2.2],
      [centerX + headR * 0.36, earTipY + 2],
      [centerX + headR * 0.52 - sway * 0.2, earTipY],
    ],
    ps,
    offset
  );
  // helles Innenohr
  ctx.fillStyle = white;
  triFill(
    ctx,
    [
      [centerX - headR * 0.62, earBaseY - 0.3],
      [centerX - headR * 0.26, earBaseY - 0.75],
      [centerX - headR * 0.48 + sway * 0.2, earTipY + 2.6],
    ],
    ps,
    offset
  );
  triFill(
    ctx,
    [
      [centerX + headR * 0.62, earBaseY - 0.3],
      [centerX + headR * 0.26, earBaseY - 0.75],
      [centerX + headR * 0.48 - sway * 0.2, earTipY + 2.6],
    ],
    ps,
    offset
  );

  // KOPF
  ctx.fillStyle = color;
  arcFill(ctx, centerX, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, centerX + headR * 0.45, headCY + 0.5, headR * 0.5, headR * 0.75, ps, offset);

  // WEISSE GESICHTSMASKE (zwei große Wangenfelder, die unten zusammenlaufen)
  ctx.fillStyle = white;
  ellipseFill(
    ctx,
    centerX - headR * 0.42,
    headCY + headR * 0.42,
    headR * 0.46,
    headR * 0.44,
    ps,
    offset,
    0.3
  );
  ellipseFill(
    ctx,
    centerX + headR * 0.42,
    headCY + headR * 0.42,
    headR * 0.46,
    headR * 0.44,
    ps,
    offset,
    -0.3
  );
  ellipseFill(ctx, centerX, headCY + headR * 0.58, headR * 0.4, headR * 0.36, ps, offset);

  // KITSUNE-ZEICHEN (Lv50+): rote Schwünge über den Augen
  if (kitsune) {
    ctx.strokeStyle = '#E53935';
    ctx.lineWidth = ps * 0.35;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo((centerX + side * 1.6) * ps, (headCY - 2) * ps + offset);
      ctx.lineTo((centerX + side * 3.4) * ps, (headCY - 2.8) * ps + offset);
      ctx.stroke();
    }
  }

  // AUGEN (leicht schräg — Fuchs-Charme)
  const eyeY = headCY - 0.2;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.6, eyeY, 0.95, 0.25, ps, offset, -0.15);
    ellipseFill(ctx, centerX + 2.6, eyeY, 0.95, 0.25, ps, offset, 0.15);
  } else if (kitsune) {
    ctx.fillStyle = '#FFB300';
    ellipseFill(ctx, centerX - 2.6, eyeY, 0.95, 1.05, ps, offset, -0.15);
    ellipseFill(ctx, centerX + 2.6, eyeY, 0.95, 1.05, ps, offset, 0.15);
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.6, eyeY, 0.3, 0.9, ps, offset);
    ellipseFill(ctx, centerX + 2.6, eyeY, 0.3, 0.9, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.6, eyeY, 0.85, 1, ps, offset, -0.15);
    ellipseFill(ctx, centerX + 2.6, eyeY, 0.85, 1, ps, offset, 0.15);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 2.9, eyeY - 0.35, 0.3, ps, offset);
    arcFill(ctx, centerX + 2.3, eyeY - 0.35, 0.3, ps, offset);
  }

  // NASE (dunkel, sitzt auf der Masken-Spitze) + MUND
  ctx.fillStyle = '#3E2723';
  ellipseFill(ctx, centerX, headCY + 1.9, 0.6, 0.45, ps, offset);
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(centerX * ps, (headCY + 2.6) * ps + offset, ps * 0.7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // FUCHSFEUER (Lv50+): schwebende blaue Flamme neben dem Kopf
  if (kitsune && equippedSlot !== 'head') {
    const flameAlpha = animated ? 0.55 + Math.sin(frame * 0.08 * animationSpeed) * 0.25 : 0.55;
    const flameY = headCY - headR - 1 + (animated ? Math.sin(frame * 0.04 * animationSpeed) : 0);
    ctx.fillStyle = `rgba(64, 196, 255, ${flameAlpha})`;
    ellipseFill(ctx, centerX - headR - 2, flameY, 0.9, 1.5, ps, offset);
    ctx.fillStyle = `rgba(179, 229, 252, ${flameAlpha})`;
    ellipseFill(ctx, centerX - headR - 2, flameY + 0.4, 0.45, 0.8, ps, offset);
  }

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, centerX - headR * 0.66, headCY + 1.7, 0.75, ps, offset);
  arcFill(ctx, centerX + headR * 0.66, headCY + 1.7, 0.75, ps, offset);
};
