import type { AccessorySlot } from '../../../types/pet.types';
import { beginLook, drawPoseEyes, NEUTRAL_POSE } from './pose';
import type { PetPose } from './pose';
import { arcFill, ellipseFill, shadeEllipse } from './shapes';

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
  shadeEllipse(ctx, (cx - px) * ps, (cy - py) * ps, rx * ps, ry * ps, ps, rot, 0.9);
  ctx.restore();
};

/**
 * VOGEL — Kawaii-Küken: rundes Ei-Körperchen, Stummelflügel, Federschopf,
 * kleiner Schnabel, Stelzenbeinchen. Ab Lv50 „Phönix"-Form mit Flammenkamm,
 * Glut-Schweif und leuchtenden Flügelspitzen.
 */
export const drawBird = (
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
  wornSlots?: ReadonlySet<AccessorySlot>,
  pose: PetPose = NEUTRAL_POSE
): void => {
  const centerX = 16;
  const centerY = 16;
  const phoenix = level >= 50;

  const sizeBoost = phoenix
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

  const flap = animated ? Math.sin(frame * 0.09 * animationSpeed) * 0.3 : 0;

  // KÖRPER (rundes Ei — Kopf und Körper verschmelzen)
  const bodyRx = 5.4 * sizeBoost;
  const bodyRy = 6.2 * sizeBoost;
  const bodyCY = centerY + 1.5;

  // PHÖNIX-SCHWEIF (Lv50+, hinter dem Körper)
  if (phoenix) {
    const emberAlpha = animated ? 0.6 + Math.sin(frame * 0.06 * animationSpeed) * 0.2 : 0.6;
    const plumeColors = ['#FF7043', '#FFB300', '#FFD54F'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = plumeColors[i];
      ellipseFill(
        ctx,
        centerX - 1.5 + i * 1.5,
        bodyCY + bodyRy + 1.2,
        0.9,
        2.4 - i * 0.3,
        ps,
        offset,
        -0.5 + i * 0.5
      );
    }
    ctx.fillStyle = `rgba(255, 179, 0, ${emberAlpha * 0.35})`;
    arcFill(ctx, centerX, bodyCY + bodyRy + 1, 3.2, ps, offset);
  }

  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '33';
  ellipseFill(ctx, centerX + bodyRx * 0.45, bodyCY + 0.5, bodyRx * 0.6, bodyRy * 0.75, ps, offset);

  // BAUCH (helles Oval)
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, bodyCY + 1.8, bodyRx * 0.6, bodyRy * 0.55, ps, offset);

  // FLÜGEL (näher am Körper und tiefer; flattern um das Schulter-Ende)
  const wingCx = bodyRx * 0.82;
  const wingCy = bodyCY + 1.2;
  ctx.fillStyle = dark;
  swingLimb(ctx, centerX - wingCx, wingCy, 1.5, 3.2, -0.26, -flap, -1, ps, offset);
  swingLimb(ctx, centerX + wingCx, wingCy, 1.5, 3.2, 0.26, flap, -1, ps, offset);
  if (phoenix) {
    ctx.fillStyle = '#FF7043';
    swingLimb(ctx, centerX - wingCx - 0.2, wingCy + 1.6, 0.9, 1.6, -0.34, -flap, -1, ps, offset);
    swingLimb(ctx, centerX + wingCx + 0.2, wingCy + 1.6, 0.9, 1.6, 0.34, flap, -1, ps, offset);
  }

  // FEDERSCHOPF (weicht Kopf-Accessoires; Phönix: Flammenkamm)
  if (!wornSlots?.has('head')) {
    const crownY = bodyCY - bodyRy;
    if (phoenix) {
      const crestColors = ['#FF7043', '#FFB300', '#FFD54F'];
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = crestColors[i + 1];
        triFill(
          ctx,
          [
            [centerX + i * 1.5 - 0.8, crownY + 0.9],
            [centerX + i * 1.5 + 0.8, crownY + 0.9],
            [centerX + i * 1.5 + flap * 2, crownY - (i === 0 ? 3 : 2)],
          ],
          ps,
          offset
        );
      }
    } else {
      ctx.strokeStyle = dark;
      ctx.lineWidth = ps * 0.45;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo((centerX + i * 0.5) * ps, (crownY + 1) * ps + offset);
        ctx.quadraticCurveTo(
          (centerX + i * 1.6) * ps,
          (crownY - 1.4) * ps + offset,
          (centerX + i * 2 + flap) * ps,
          (crownY - 1.8) * ps + offset
        );
        ctx.stroke();
      }
    }
  }

  // AUGEN (groß und glänzend)
  const eyeY = bodyCY - bodyRy * 0.35;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  beginLook(ctx, pose, ps);
  if (pose.eyes !== 'auto') {
    drawPoseEyes(ctx, pose.eyes, centerX, eyeY, 2.2, ps, offset, 1);
  } else if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 2.2, eyeY, 0.95, 0.25, ps, offset);
    ellipseFill(ctx, centerX + 2.2, eyeY, 0.95, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 2.2, eyeY, 1, ps, offset);
    arcFill(ctx, centerX + 2.2, eyeY, 1, ps, offset);
    if (phoenix) {
      ctx.fillStyle = '#FFB300';
      arcFill(ctx, centerX - 2.2, eyeY, 0.55, ps, offset);
      arcFill(ctx, centerX + 2.2, eyeY, 0.55, ps, offset);
      ctx.fillStyle = '#1A1A1A';
      arcFill(ctx, centerX - 2.2, eyeY, 0.28, ps, offset);
      arcFill(ctx, centerX + 2.2, eyeY, 0.28, ps, offset);
    }
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 2.5, eyeY - 0.35, 0.32, ps, offset);
    arcFill(ctx, centerX + 1.9, eyeY - 0.35, 0.32, ps, offset);
  }

  ctx.restore();

  // SCHNABEL
  ctx.fillStyle = '#FF9E42';
  triFill(
    ctx,
    [
      [centerX - 0.9, eyeY + 1.2],
      [centerX + 0.9, eyeY + 1.2],
      [centerX, eyeY + 2.5],
    ],
    ps,
    offset
  );

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, centerX - bodyRx * 0.62, eyeY + 1.3, 0.7, ps, offset);
  arcFill(ctx, centerX + bodyRx * 0.62, eyeY + 1.3, 0.7, ps, offset);

  // BEINCHEN
  ctx.strokeStyle = '#FF9E42';
  ctx.lineWidth = ps * 0.45;
  for (let side = -1; side <= 1; side += 2) {
    const lift = side < 0 ? pose.pawLift[0] : pose.pawLift[1];
    ctx.beginPath();
    ctx.moveTo((centerX + side * 1.8) * ps, (bodyCY + bodyRy - 0.6) * ps + offset);
    ctx.lineTo((centerX + side * 1.8) * ps, (bodyCY + bodyRy + 1.4 - lift) * ps + offset);
    ctx.stroke();
  }
  ctx.fillStyle = '#FF9E42';
  ellipseFill(ctx, centerX - 1.8, bodyCY + bodyRy + 1.5 - pose.pawLift[0], 1, 0.5, ps, offset);
  ellipseFill(ctx, centerX + 1.8, bodyCY + bodyRy + 1.5 - pose.pawLift[1], 1, 0.5, ps, offset);
};
