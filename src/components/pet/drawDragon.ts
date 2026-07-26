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

// Helper: Glied-Ellipse (Zentrum cx,cy, Eigen-Rotation rot) wie im Original, die
// aber um ein Ende ihrer langen Achse (den Körper-Ansatz) schwingt statt um die
// Mitte. pivotEnd -1 = oberes Ende (Schulter), +1 = unteres Ende. delta = Schwung;
// delta=0 = exakte Ruhelage, nur das freie Ende bewegt sich.
const swingLimb = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  delta: number,
  pivotEnd: number,
  ps: number,
  offset: number
) => {
  const px = cx - pivotEnd * ry * Math.sin(rot);
  const py = cy + pivotEnd * ry * Math.cos(rot);
  ctx.save();
  ctx.translate(px * ps, py * ps + offset);
  ctx.rotate(delta);
  ctx.beginPath();
  ctx.ellipse((cx - px) * ps, (cy - py) * ps, rx * ps, ry * ps, rot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const sizeBoostFor = (level: number): number =>
  level >= 50
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

/**
 * DRACHE — Kawaii-Babydrache im Toothless-Stil: runder Kopf mit weichem
 * Rückenkamm aus hellen Halbkreis-Zacken, kleine runde Hörnchen, großer
 * heller Bauch, Schwanz mit runder Pfeilspitze; Flügel liegen im Overlay
 * (über den Accessoires). Ab Lv50 „Wyvern"-Form mit größerem Kamm,
 * Bernstein-Augen, Schuppen-Emblem und Glut-Atem.
 */
export const drawDragon = (
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
  const wyvern = level >= 50;
  const sizeBoost = sizeBoostFor(level);

  const sway = animated ? Math.sin(frame * 0.05 * animationSpeed) * 0.3 : 0;

  const headR = 6.2 * sizeBoost;
  const headCY = 13;
  const bodyCY = 21.5;
  const bodyRx = 4.9 * sizeBoost;
  const bodyRy = 4.4 * sizeBoost;

  // SCHWANZ (dick und geschwungen, runde Pfeilspitze)
  ctx.strokeStyle = color;
  ctx.lineWidth = ps * 1.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo((centerX + bodyRx * 0.6) * ps, (bodyCY + bodyRy * 0.45) * ps + offset);
  ctx.quadraticCurveTo(
    (centerX + bodyRx + 3) * ps,
    (bodyCY + 2.6) * ps + offset,
    (centerX + bodyRx + 3.3) * ps,
    (bodyCY - 1 + sway) * ps + offset
  );
  ctx.stroke();
  ctx.lineCap = 'butt';
  // Runde Pfeilspitze (Herzform-artig, kuschelig statt scharf)
  ctx.fillStyle = dark;
  arcFill(ctx, centerX + bodyRx + 2.5, bodyCY - 1.9 + sway, 0.85, ps, offset);
  arcFill(ctx, centerX + bodyRx + 4.1, bodyCY - 1.9 + sway, 0.85, ps, offset);
  triFill(
    ctx,
    [
      [centerX + bodyRx + 1.75, bodyCY - 1.7 + sway],
      [centerX + bodyRx + 4.85, bodyCY - 1.7 + sway],
      [centerX + bodyRx + 3.3, bodyCY - 3.6 + sway],
    ],
    ps,
    offset
  );

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.4, bodyCY + 0.4, bodyRx * 0.6, bodyRy * 0.75, ps, offset);

  // GROSSER HELLER BAUCH mit sanften Plattenlinien
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, bodyCY + 0.7, bodyRx * 0.6, bodyRy * 0.68, ps, offset);
  ctx.strokeStyle = dark + '40';
  ctx.lineWidth = ps * 0.22;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(
      centerX * ps,
      (bodyCY - 0.4 + i * 1.5) * ps + offset,
      ps * bodyRx * 0.5,
      0.25 * Math.PI,
      0.75 * Math.PI
    );
    ctx.stroke();
  }

  // WYVERN-SCHUPPEN-EMBLEM (Lv50+, weicht Hals-Accessoires)
  if (wyvern && equippedSlot !== 'neck') {
    ctx.fillStyle = '#FFB300';
    triFill(
      ctx,
      [
        [centerX - 1, bodyCY - bodyRy * 0.5],
        [centerX + 1, bodyCY - bodyRy * 0.5],
        [centerX, bodyCY - bodyRy * 0.02],
      ],
      ps,
      offset
    );
  }

  // PFOTEN
  ctx.fillStyle = dark;
  ellipseFill(ctx, centerX - 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);
  ellipseFill(ctx, centerX + 2.2, bodyCY + bodyRy - 0.4, 1.25, 0.8, ps, offset);

  // KLEINE RUNDE HÖRNCHEN (cremefarben, weichen Kopf-Accessoires)
  if (equippedSlot !== 'head') {
    const hornH = wyvern ? 2.6 : 1.9;
    ctx.fillStyle = '#FFECB3';
    ellipseFill(
      ctx,
      centerX - headR * 0.72 + sway * 0.15,
      headCY - headR * 0.78 - hornH * 0.4,
      0.85,
      hornH,
      ps,
      offset,
      -0.45
    );
    ellipseFill(
      ctx,
      centerX + headR * 0.72 - sway * 0.15,
      headCY - headR * 0.78 - hornH * 0.4,
      0.85,
      hornH,
      ps,
      offset,
      0.45
    );
  }

  // KOPF
  ctx.fillStyle = color;
  arcFill(ctx, centerX, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, centerX + headR * 0.45, headCY + 0.5, headR * 0.5, headR * 0.75, ps, offset);

  // WEICHER KAMM (helle Halbkreis-Zacken auf dem Scheitel, weicht Kopf-Accessoires)
  if (equippedSlot !== 'head') {
    ctx.fillStyle = light;
    const bumps = wyvern ? [-2.2, 0, 2.2] : [-1.8, 0, 1.8];
    for (let i = 0; i < bumps.length; i++) {
      const bx = centerX + bumps[i];
      const dist = Math.abs(bumps[i]) / headR;
      const by = headCY - Math.sqrt(1 - dist * dist) * headR + 0.15;
      arcFill(ctx, bx, by, i === 1 ? (wyvern ? 1.5 : 1.2) : wyvern ? 1.1 : 0.9, ps, offset);
    }
  }

  // SCHNAUZE (helles breites Feld mit Nasenlöchern)
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, headCY + headR * 0.5, headR * 0.55, headR * 0.4, ps, offset);
  ctx.fillStyle = dark;
  arcFill(ctx, centerX - 1, headCY + 1.7, 0.28, ps, offset);
  arcFill(ctx, centerX + 1, headCY + 1.7, 0.28, ps, offset);

  // AUGEN (groß und freundlich; Wyvern: Bernstein)
  const eyeY = headCY - 0.3;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.7, eyeY, 1, 0.25, ps, offset);
    ellipseFill(ctx, centerX + 2.7, eyeY, 1, 0.25, ps, offset);
  } else if (wyvern) {
    ctx.fillStyle = '#FFB300';
    arcFill(ctx, centerX - 2.7, eyeY, 1.15, ps, offset);
    arcFill(ctx, centerX + 2.7, eyeY, 1.15, ps, offset);
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.7, eyeY, 0.65, ps, offset);
    arcFill(ctx, centerX + 2.7, eyeY, 0.65, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 3, eyeY - 0.4, 0.3, ps, offset);
    arcFill(ctx, centerX + 2.4, eyeY - 0.4, 0.3, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.7, eyeY, 1.05, ps, offset);
    arcFill(ctx, centerX + 2.7, eyeY, 1.05, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 3, eyeY - 0.4, 0.35, ps, offset);
    arcFill(ctx, centerX + 2.4, eyeY - 0.4, 0.35, ps, offset);
  }

  // MUND (breites Lächeln + ein Zähnchen)
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(centerX * ps, (headCY + 2.2) * ps + offset, ps * 1.1, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  triFill(
    ctx,
    [
      [centerX + 0.6, headCY + 3.15],
      [centerX + 1.3, headCY + 3.05],
      [centerX + 0.95, headCY + 3.9],
    ],
    ps,
    offset
  );

  // GLUT-ATEM (Lv50+): kleine Flammenwölkchen vor der Schnauze
  if (wyvern && animated) {
    const puff = 0.4 + Math.sin(frame * 0.1 * animationSpeed) * 0.3;
    if (puff > 0.45) {
      ctx.fillStyle = `rgba(255, 112, 67, ${puff})`;
      arcFill(ctx, centerX - headR - 1.2, headCY + 2.4, 0.7, ps, offset);
      ctx.fillStyle = `rgba(255, 213, 79, ${puff})`;
      arcFill(ctx, centerX - headR - 2.1, headCY + 2.2, 0.45, ps, offset);
    }
  }

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, centerX - headR * 0.68, headCY + 1.7, 0.75, ps, offset);
  arcFill(ctx, centerX + headR * 0.68, headCY + 1.7, 0.75, ps, offset);
};

/**
 * Flügel werden ÜBER den Accessoires gezeichnet (damit sie z. B. vor einem
 * Schal liegen). Runde Kuschel-Flügel in Körperfarbe mit dunkler Membran;
 * Wyvern (Lv50+): größer, mit Fingerlinien.
 */
export const drawDragonWingsOverlay = (
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  dark: string,
  offset: number,
  animated: boolean,
  frame: number,
  animationSpeed: number
): void => {
  const centerX = 16;
  const wyvern = level >= 50;
  const sizeBoost = sizeBoostFor(level);
  const bodyCY = 21.5;
  const bodyRx = 4.9 * sizeBoost;

  const flap = animated ? Math.sin(frame * 0.08 * animationSpeed) * 0.25 : 0;
  const wingRy = wyvern ? 3.8 : 2.8;
  const wingRx = wyvern ? 2 : 1.5;

  for (let side = -1; side <= 1; side += 2) {
    const wx = centerX + side * (bodyRx + wingRx * 0.55);
    const wy = bodyCY - 1.2;
    const wingRot = side * 0.5;
    // Flügel sitzen mit dem unteren, körpernahen Ende fest; nur die Spitze schwingt.
    ctx.fillStyle = dark;
    swingLimb(ctx, wx, wy, wingRx, wingRy, wingRot, side * flap, 1, ps, offset);
    ctx.fillStyle = color;
    swingLimb(
      ctx,
      wx + side * 0.3,
      wy + 0.5,
      wingRx * 0.62,
      wingRy * 0.62,
      wingRot,
      side * flap,
      1,
      ps,
      offset
    );
    if (wyvern) {
      // Membranadern um dasselbe untere Ende mitdrehen.
      const px = wx - wingRy * Math.sin(wingRot);
      const py = wy + wingRy * Math.cos(wingRot);
      ctx.save();
      ctx.translate(px * ps, py * ps + offset);
      ctx.rotate(side * flap);
      ctx.strokeStyle = dark;
      ctx.lineWidth = ps * 0.22;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo((wx - px) * ps, (wy + wingRy * 0.5 - py) * ps);
        ctx.lineTo(
          (wx + side * wingRx * (0.5 + i * 0.5) - px) * ps,
          (wy - wingRy * (0.5 + i * 0.3) - py) * ps
        );
        ctx.stroke();
      }
      ctx.restore();
    }
  }
};
