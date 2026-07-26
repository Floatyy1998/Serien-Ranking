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

// Helper: Glied-Ellipse wie im Original (Zentrum cx,cy, Eigen-Rotation rot), die
// aber um ihren Ansatz (px,py) am Körper schwingt (delta) statt um die eigene
// Mitte. delta=0 ergibt exakt die Ruhelage — nur das freie Ende bewegt sich.
const swingAround = (
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  delta: number,
  ps: number,
  offset: number
) => {
  ctx.save();
  ctx.translate(px * ps, py * ps + offset);
  ctx.rotate(delta);
  ctx.beginPath();
  ctx.ellipse((cx - px) * ps, (cy - py) * ps, rx * ps, ry * ps, rot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/**
 * HUND — Kawaii-Welpe: lange Beagle-Schlappohren, die VOR dem Kopf hängen,
 * große helle Schnauze mit Knopfnase und Zunge, Augenbrauen-Punkte,
 * wedelnder Schwanz. Ab Lv50 „Wolf"-Form mit Stehohren, Brustfell und Fängen.
 */
export const drawDog = (
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
  const wolf = level >= 50;

  const sizeBoost = wolf
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

  const wag = animated ? Math.sin(frame * 0.14 * animationSpeed) * 0.45 : 0;
  const sway = animated ? Math.sin(frame * 0.05 * animationSpeed) * 0.3 : 0;

  const headR = 6.2 * sizeBoost;
  const headCY = 13;
  const bodyCY = 21.5;
  const bodyRx = 4.9 * sizeBoost;
  const bodyRy = 4.4 * sizeBoost;

  // SCHWANZ (wedelt um den Ansatz am Körper — nur die Spitze schwingt)
  const tailCx = centerX + bodyRx + 1.4;
  const tailCy = bodyCY - 1.6;
  const tailPx = centerX + bodyRx - 0.2;
  const tailPy = bodyCY + 0.2;
  ctx.fillStyle = color;
  swingAround(
    ctx,
    tailPx,
    tailPy,
    tailCx,
    tailCy,
    wolf ? 1.5 : 1.1,
    wolf ? 3 : 2.5,
    0.75,
    wag,
    ps,
    offset
  );
  // Helle Spitze um denselben Ansatz mitdrehen.
  ctx.save();
  ctx.translate(tailPx * ps, tailPy * ps + offset);
  ctx.rotate(wag);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(
    (centerX + bodyRx + 2.3 - tailPx) * ps,
    (bodyCY - 3.1 - tailPy) * ps,
    (wolf ? 1 : 0.75) * ps,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.4, bodyCY + 0.4, bodyRx * 0.6, bodyRy * 0.75, ps, offset);
  // Brustfleck
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, bodyCY + 0.6, bodyRx * 0.55, bodyRy * 0.62, ps, offset);
  // Wolfs-Brustfell (Lv50+, weicht Hals-Accessoires)
  if (wolf && equippedSlot !== 'neck') {
    ctx.fillStyle = light;
    for (let i = -1; i <= 1; i++) {
      triFill(
        ctx,
        [
          [centerX + i * 1.7 - 0.8, bodyCY - bodyRy * 0.55],
          [centerX + i * 1.7 + 0.8, bodyCY - bodyRy * 0.55],
          [centerX + i * 1.7, bodyCY - bodyRy * 0.05],
        ],
        ps,
        offset
      );
    }
  }

  // PFOTEN
  ctx.fillStyle = dark;
  ellipseFill(ctx, centerX - 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);
  ellipseFill(ctx, centerX + 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);

  // WOLFS-OHREN (Lv50+): breit und aufrecht mit runder Spitze — bewusst
  // anders als die schmalen Katzen-Dreiecke
  if (wolf) {
    const earTipY = headCY - headR - 1.7;
    for (let side = -1; side <= 1; side += 2) {
      const tipX = centerX + side * headR * 0.42 - side * sway * 0.2;
      ctx.fillStyle = dark;
      triFill(
        ctx,
        [
          [centerX + side * headR * 0.88, headCY - headR * 0.35],
          [centerX + side * headR * 0.08, headCY - headR * 0.85],
          [tipX, earTipY],
        ],
        ps,
        offset
      );
      arcFill(ctx, tipX, earTipY + 0.3, 0.6, ps, offset);
      // helles Innenohr-Fell
      ctx.fillStyle = light;
      triFill(
        ctx,
        [
          [centerX + side * headR * 0.64, headCY - headR * 0.5],
          [centerX + side * headR * 0.26, headCY - headR * 0.72],
          [tipX, earTipY + 1.3],
        ],
        ps,
        offset
      );
    }
  }

  // KOPF
  ctx.fillStyle = color;
  arcFill(ctx, centerX, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, centerX + headR * 0.45, headCY + 0.5, headR * 0.5, headR * 0.75, ps, offset);

  // WOLFS-BACKENFELL (Lv50+): buschige Fellwangen seitlich am Kopf
  if (wolf) {
    ctx.fillStyle = color;
    for (let side = -1; side <= 1; side += 2) {
      triFill(
        ctx,
        [
          [centerX + side * headR * 0.9, headCY + 0.2],
          [centerX + side * headR * 0.55, headCY + 2.6],
          [centerX + side * (headR + 1.8), headCY + 2.2],
        ],
        ps,
        offset
      );
      triFill(
        ctx,
        [
          [centerX + side * headR * 0.95, headCY - 1.2],
          [centerX + side * headR * 0.75, headCY + 0.9],
          [centerX + side * (headR + 1.5), headCY + 0.2],
        ],
        ps,
        offset
      );
    }
  }

  // BEAGLE-SCHLAPPOHREN (VOR dem Kopf: hängen von oben seitlich weit herunter)
  if (!wolf) {
    ctx.fillStyle = dark;
    ellipseFill(
      ctx,
      centerX - headR * 0.92,
      headCY + 0.6 + sway * 0.35,
      1.9,
      4.4,
      ps,
      offset,
      0.22
    );
    ellipseFill(
      ctx,
      centerX + headR * 0.92,
      headCY + 0.6 - sway * 0.35,
      1.9,
      4.4,
      ps,
      offset,
      -0.22
    );
    // Ohr-Glanzkante
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ellipseFill(
      ctx,
      centerX - headR * 0.98,
      headCY - 0.4 + sway * 0.35,
      0.8,
      2.2,
      ps,
      offset,
      0.22
    );
    ellipseFill(
      ctx,
      centerX + headR * 0.98,
      headCY - 0.4 - sway * 0.35,
      0.8,
      2.2,
      ps,
      offset,
      -0.22
    );
  }

  // Brauner Fleck überm Auge ab Lv30
  if (level >= 30 && !wolf) {
    ctx.fillStyle = dark + '77';
    ellipseFill(ctx, centerX + 2.6, headCY - 2, 1.6, 1.3, ps, offset, 0.25);
  }

  // GROSSE SCHNAUZE (helles Oval über die untere Kopfhälfte)
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, headCY + headR * 0.52, headR * 0.62, headR * 0.46, ps, offset);
  // Knopfnase
  ctx.fillStyle = '#3E2723';
  ellipseFill(ctx, centerX, headCY + 1.3, 1, 0.75, ps, offset);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  arcFill(ctx, centerX - 0.3, headCY + 1.05, 0.25, ps, offset);

  // AUGEN + BRAUEN-PUNKTE
  const eyeY = headCY - 0.4;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.6, eyeY, 0.95, 0.25, ps, offset);
    ellipseFill(ctx, centerX + 2.6, eyeY, 0.95, 0.25, ps, offset);
  } else if (wolf) {
    ctx.fillStyle = '#FFB300';
    arcFill(ctx, centerX - 2.6, eyeY, 1, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeY, 1, ps, offset);
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.6, eyeY, 0.5, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeY, 0.5, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.6, eyeY, 0.95, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeY, 0.95, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 2.9, eyeY - 0.35, 0.32, ps, offset);
    arcFill(ctx, centerX + 2.3, eyeY - 0.35, 0.32, ps, offset);
  }
  if (!wolf) {
    ctx.fillStyle = dark;
    ellipseFill(ctx, centerX - 2.6, eyeY - 1.7, 0.55, 0.32, ps, offset);
    ellipseFill(ctx, centerX + 2.6, eyeY - 1.7, 0.55, 0.32, ps, offset);
  }

  // MUND + ZUNGE
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(
    (centerX - 0.7) * ps,
    (headCY + 2.1) * ps + offset,
    ps * 0.7,
    0.15 * Math.PI,
    0.85 * Math.PI
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    (centerX + 0.7) * ps,
    (headCY + 2.1) * ps + offset,
    ps * 0.7,
    0.15 * Math.PI,
    0.85 * Math.PI
  );
  ctx.stroke();
  if (!wolf) {
    ctx.fillStyle = '#FF8A9D';
    ellipseFill(
      ctx,
      centerX + 0.6,
      headCY + 3.3,
      0.65,
      0.95 + (animated ? Math.abs(wag) * 0.4 : 0),
      ps,
      offset
    );
  }

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, centerX - headR * 0.6, headCY + 1.6, 0.75, ps, offset);
  arcFill(ctx, centerX + headR * 0.6, headCY + 1.6, 0.75, ps, offset);
};
