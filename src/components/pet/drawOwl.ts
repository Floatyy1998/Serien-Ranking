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
 * EULE — kompakte Kawaii-Silhouette: ei-förmiger Körper, riesige Ring-Augen,
 * Feder-Öhrchen, kleiner Schnabel, angelegte Flügel. Ab Lv50 „Erzmagier"-Form
 * mit großen Federhörnern, Stirnjuwel und aufgefächerten Flügeln.
 */
export const drawOwl = (
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
  const centerY = 16;
  const archmage = level >= 50;

  const sizeBoost = archmage
    ? 1.18
    : level >= 20
      ? 1.12
      : level >= 15
        ? 1.08
        : level >= 10
          ? 1.05
          : level >= 5
            ? 1.02
            : 1;

  // Sanftes Flügel-Wippen
  const wingSway = animated ? Math.sin(frame * 0.06 * animationSpeed) * 0.3 : 0;

  // KÖRPER (ein großes Ei — Kopf und Körper verschmelzen bei Eulen)
  const bodyRx = 6.2 * sizeBoost;
  const bodyRy = 7.4 * sizeBoost;
  const bodyCY = centerY + 1.5;
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);

  // Seitenschattierung
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.45, bodyCY + 0.6, bodyRx * 0.6, bodyRy * 0.75, ps, offset);

  // FEDER-ÖHRCHEN (kleine Büschel; Erzmagier: große Hörner)
  ctx.fillStyle = dark;
  const tuftH = archmage ? 4.2 : 2.4;
  const tuftY = bodyCY - bodyRy + 0.6;
  triFill(
    ctx,
    [
      [centerX - bodyRx * 0.62 - 0.8, tuftY + 1.4],
      [centerX - bodyRx * 0.62 + 1, tuftY + 1],
      [centerX - bodyRx * 0.62 - 0.2, tuftY - tuftH + 1],
    ],
    ps,
    offset
  );
  triFill(
    ctx,
    [
      [centerX + bodyRx * 0.62 + 0.8, tuftY + 1.4],
      [centerX + bodyRx * 0.62 - 1, tuftY + 1],
      [centerX + bodyRx * 0.62 + 0.2, tuftY - tuftH + 1],
    ],
    ps,
    offset
  );

  // BAUCH-FEDERKLEID (helles Oval mit Feder-Wellen)
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, bodyCY + 2.2, bodyRx * 0.62, bodyRy * 0.52, ps, offset);
  ctx.fillStyle = dark + '2a';
  for (let row = 0; row < 3; row++) {
    for (let i = -1; i <= 1; i++) {
      arcFill(
        ctx,
        centerX + i * 1.7 + (row % 2 === 0 ? 0.85 : 0),
        bodyCY + 2.2 + row * 1.5,
        0.55,
        ps,
        offset
      );
    }
  }

  // FLÜGEL (angelegt; Erzmagier: leicht aufgefächert)
  ctx.fillStyle = dark;
  const wingSpread = archmage ? 1.6 : 0;
  ellipseFill(
    ctx,
    centerX - bodyRx * 0.95 - wingSpread * 0.4,
    bodyCY + 1,
    1.7,
    4.2 + wingSpread,
    ps,
    offset,
    -0.28 - wingSway * 0.1 - wingSpread * 0.12
  );
  ellipseFill(
    ctx,
    centerX + bodyRx * 0.95 + wingSpread * 0.4,
    bodyCY + 1,
    1.7,
    4.2 + wingSpread,
    ps,
    offset,
    0.28 + wingSway * 0.1 + wingSpread * 0.12
  );

  // AUGEN-RINGE (das Eulen-Markenzeichen: riesige helle Scheiben)
  const eyeCY = bodyCY - bodyRy * 0.38;
  const ringR = 2.7 * sizeBoost;
  ctx.fillStyle = light;
  arcFill(ctx, centerX - 2.6, eyeCY, ringR, ps, offset);
  arcFill(ctx, centerX + 2.6, eyeCY, ringR, ps, offset);
  ctx.fillStyle = dark + '44';
  arcFill(ctx, centerX - 2.6, eyeCY, ringR, ps, offset);
  ctx.fillStyle = light;
  arcFill(ctx, centerX - 2.6, eyeCY, ringR * 0.85, ps, offset);
  arcFill(ctx, centerX + 2.6, eyeCY, ringR * 0.85, ps, offset);

  // Blinzeln alle ~4s
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.6, eyeCY, 1.5, 0.3, ps, offset);
    ellipseFill(ctx, centerX + 2.6, eyeCY, 1.5, 0.3, ps, offset);
  } else {
    // Große Pupillen mit Glanzpunkten
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.6, eyeCY, 1.55, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeCY, 1.55, ps, offset);
    ctx.fillStyle = '#FFD54F';
    arcFill(ctx, centerX - 2.6, eyeCY, 1.05, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeCY, 1.05, ps, offset);
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.6, eyeCY, 0.6, ps, offset);
    arcFill(ctx, centerX + 2.6, eyeCY, 0.6, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 3.1, eyeCY - 0.5, 0.4, ps, offset);
    arcFill(ctx, centerX + 2.1, eyeCY - 0.5, 0.4, ps, offset);
  }

  // SCHNABEL (kleines Dreieck zwischen den Augen)
  ctx.fillStyle = '#FF9E42';
  triFill(
    ctx,
    [
      [centerX - 0.8, eyeCY + 1.3],
      [centerX + 0.8, eyeCY + 1.3],
      [centerX, eyeCY + 2.8],
    ],
    ps,
    offset
  );

  // FÜSSE (kleine orange Krallen)
  ctx.fillStyle = '#FF9E42';
  ellipseFill(ctx, centerX - 2, bodyCY + bodyRy - 0.4, 1.1, 0.7, ps, offset);
  ellipseFill(ctx, centerX + 2, bodyCY + bodyRy - 0.4, 1.1, 0.7, ps, offset);

  // ERZMAGIER-DETAILS (Lv50+): Stirnjuwel + Mondsichel-Brustzeichen
  if (archmage) {
    if (equippedSlot !== 'head') {
      const gemPulse = animated ? 0.15 + Math.sin(frame * 0.05 * animationSpeed) * 0.1 : 0.15;
      ctx.fillStyle = '#B388FF';
      triFill(
        ctx,
        [
          [centerX - 0.9, eyeCY - ringR - 0.2],
          [centerX + 0.9, eyeCY - ringR - 0.2],
          [centerX, eyeCY - ringR - 1.8],
        ],
        ps,
        offset
      );
      ctx.fillStyle = `rgba(179, 136, 255, ${gemPulse})`;
      arcFill(ctx, centerX, eyeCY - ringR - 1, 1.8, ps, offset);
    }
    if (equippedSlot !== 'neck') {
      // Mondsichel auf der Brust
      ctx.fillStyle = '#FFE082';
      arcFill(ctx, centerX, bodyCY + 2.6, 1.3, ps, offset);
      ctx.fillStyle = light;
      arcFill(ctx, centerX + 0.7, bodyCY + 2.3, 1.15, ps, offset);
    }
  }
};
