import type { AccessorySlot } from '../../../types/pet.types';
import { beginLook, drawPoseEyes, NEUTRAL_POSE } from './pose';
import type { PetPose } from './pose';
import { arcFill, ellipseFill, growth } from './shapes';

/**
 * OTTER — breiter, flacher Kopf mit heller Gesichtsmaske, Schnurrhaare,
 * langer Körper, dicker Ruderschwanz und eine Muschel in den Pfoten. Ab Lv50
 * „Gezeitenhüter": leuchtende Perle, Wellenzeichen und Flossenkamm.
 */
export const drawOtter = (
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
  const cx = 16;
  const keeper = level >= 50;
  const s = growth(level);
  const sway = animated ? Math.sin(frame * 0.05 * animationSpeed) * 0.3 : 0;

  const headRx = 6.5 * s;
  const headRy = 5.5 * s;
  const headCY = 13.2;
  const bodyCY = 21.4;
  const bodyRx = 4.5 * s;
  const bodyRy = 4.8 * s;

  // RUDERSCHWANZ (dick am Ansatz, schwingt nach oben aus)
  ctx.fillStyle = color;
  ellipseFill(
    ctx,
    cx + bodyRx + 1.4,
    bodyCY + 2.7 + sway * 0.3,
    3.7,
    1.75,
    ps,
    offset,
    -0.38 + sway * 0.1
  );
  ellipseFill(
    ctx,
    cx + bodyRx + 4.5,
    bodyCY + 0.7 + sway * 0.7,
    2,
    1.1,
    ps,
    offset,
    -0.85 + sway * 0.1
  );
  ctx.fillStyle = dark + '55';
  ellipseFill(
    ctx,
    cx + bodyRx + 4.9,
    bodyCY + 0.3 + sway * 0.7,
    1.2,
    0.8,
    ps,
    offset,
    -0.85 + sway * 0.1
  );
  if (keeper) {
    ctx.fillStyle = '#80DEEA';
    ellipseFill(
      ctx,
      cx + bodyRx + 5.5,
      bodyCY - 0.9 + sway * 0.7,
      1.15,
      1.6,
      ps,
      offset,
      0.55 + sway * 0.1
    );
  }

  // KÖRPER (lang und schlank)
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '30';
  ellipseFill(ctx, cx + bodyRx * 0.42, bodyCY + 0.4, bodyRx * 0.58, bodyRy * 0.75, ps, offset);

  // HELLER BAUCH
  ctx.fillStyle = light;
  ellipseFill(ctx, cx, bodyCY + 0.1, bodyRx * 0.68, bodyRy * 0.84, ps, offset);

  // FÜSSE (Schwimmhäute)
  ctx.fillStyle = dark;
  ellipseFill(ctx, cx - 2.3, bodyCY + bodyRy - 0.4 - pose.pawLift[0], 1.5, 0.8, ps, offset);
  ellipseFill(ctx, cx + 2.3, bodyCY + bodyRy - 0.4 - pose.pawLift[1], 1.5, 0.8, ps, offset);

  // MUSCHEL / PERLE in den Pfoten
  const holdY = bodyCY + 0.6;
  if (keeper) {
    const glow = animated ? 0.32 + Math.sin(frame * 0.06 * animationSpeed) * 0.15 : 0.35;
    ctx.fillStyle = `rgba(128, 222, 234, ${glow})`;
    arcFill(ctx, cx, holdY, 2.6, ps, offset);
    ctx.fillStyle = '#E0F7FA';
    arcFill(ctx, cx, holdY, 1.45, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, cx - 0.4, holdY - 0.45, 0.45, ps, offset);
  } else {
    ctx.fillStyle = '#FBE3D4';
    ctx.beginPath();
    ctx.ellipse(cx * ps, (holdY + 0.9) * ps + offset, 2 * ps, 2.1 * ps, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#D9A58A';
    ctx.lineWidth = ps * 0.2;
    for (const dx of [-1.15, -0.4, 0.4, 1.15]) {
      ctx.beginPath();
      ctx.moveTo((cx + dx * 0.3) * ps, (holdY + 0.8) * ps + offset);
      ctx.lineTo((cx + dx) * ps, (holdY - 0.85 + Math.abs(dx) * 0.4) * ps + offset);
      ctx.stroke();
    }
  }
  // Arme und Pfoten halten sie von beiden Seiten
  ctx.fillStyle = color;
  ellipseFill(ctx, cx - bodyRx * 0.8, bodyCY - 0.5, 1.05, 1.9, ps, offset, -0.5);
  ellipseFill(ctx, cx + bodyRx * 0.8, bodyCY - 0.5, 1.05, 1.9, ps, offset, 0.5);
  ctx.fillStyle = dark;
  ellipseFill(ctx, cx - 2.1, holdY + 0.5, 1.1, 0.85, ps, offset, 0.4);
  ellipseFill(ctx, cx + 2.1, holdY + 0.5, 1.1, 0.85, ps, offset, -0.4);

  // OHREN (klein, rund, tief seitlich)
  const earY = headCY - headRy * 0.6;
  ctx.fillStyle = color;
  arcFill(ctx, cx - headRx * 0.84, earY, 1.35, ps, offset);
  arcFill(ctx, cx + headRx * 0.84, earY, 1.35, ps, offset);
  ctx.fillStyle = dark;
  arcFill(ctx, cx - headRx * 0.84, earY + 0.1, 0.7, ps, offset);
  arcFill(ctx, cx + headRx * 0.84, earY + 0.1, 0.7, ps, offset);
  if (keeper && !wornSlots?.has('head')) {
    ctx.fillStyle = '#80DEEA';
    ellipseFill(ctx, cx - headRx * 0.98, earY - 1.2, 0.6, 1.3, ps, offset, -0.5);
    ellipseFill(ctx, cx + headRx * 0.98, earY - 1.2, 0.6, 1.3, ps, offset, 0.5);
  }

  // KOPF (breiter als hoch)
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, headCY, headRx, headRy, ps, offset);
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, cx + headRx * 0.45, headCY + 0.5, headRx * 0.5, headRy * 0.75, ps, offset);

  // HELLE GESICHTSMASKE + SCHNURRHAAR-POLSTER
  ctx.fillStyle = light;
  ellipseFill(ctx, cx, headCY + headRy * 0.4, headRx * 0.74, headRy * 0.56, ps, offset);
  ctx.fillStyle = '#FFFFFF';
  ellipseFill(ctx, cx - 1.5, headCY + 2.3, 1.7, 1.35, ps, offset);
  ellipseFill(ctx, cx + 1.5, headCY + 2.3, 1.7, 1.35, ps, offset);

  // WELLENZEICHEN (Gezeitenhüter)
  if (keeper) {
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = ps * 0.32;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        (cx + side * headRx * 0.6) * ps,
        (headCY - 2.6) * ps + offset,
        ps * 0.95,
        side < 0 ? Math.PI * 0.9 : Math.PI * 1.3,
        side < 0 ? Math.PI * 1.7 : Math.PI * 2.1
      );
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  // AUGEN
  const eyeY = headCY - 0.1;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  beginLook(ctx, pose, ps);
  if (pose.eyes !== 'auto') {
    drawPoseEyes(ctx, pose.eyes, cx, eyeY, 2.9, ps, offset, 1);
  } else if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, cx - 2.9, eyeY, 0.95, 0.25, ps, offset);
    ellipseFill(ctx, cx + 2.9, eyeY, 0.95, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, cx - 2.9, eyeY, 0.95, ps, offset);
    arcFill(ctx, cx + 2.9, eyeY, 0.95, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, cx - 3.2, eyeY - 0.35, 0.32, ps, offset);
    arcFill(ctx, cx + 2.6, eyeY - 0.35, 0.32, ps, offset);
  }
  ctx.restore();

  // NASE (breit, dunkel) + MUND
  ctx.fillStyle = '#3E2723';
  ellipseFill(ctx, cx, headCY + 1.35, 1.3, 0.85, ps, offset);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  arcFill(ctx, cx - 0.4, headCY + 1.1, 0.26, ps, offset);
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc((cx - 0.8) * ps, (headCY + 2.45) * ps + offset, ps * 0.8, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc((cx + 0.8) * ps, (headCY + 2.45) * ps + offset, ps * 0.8, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // SCHNURRHAARE
  ctx.strokeStyle = dark;
  ctx.lineWidth = ps * 0.18;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((cx + side * 2.7) * ps, (headCY + 1.9 + i * 0.55) * ps + offset);
      ctx.lineTo((cx + side * 5.7) * ps, (headCY + 1.2 + i * 1.05) * ps + offset);
      ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, cx - headRx * 0.7, headCY + 1.3, 0.75, ps, offset);
  arcFill(ctx, cx + headRx * 0.7, headCY + 1.3, 0.75, ps, offset);
};
