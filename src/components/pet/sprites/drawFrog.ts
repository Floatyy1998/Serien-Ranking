import type { AccessorySlot } from '../../../types/pet.types';
import { beginLook, drawPoseEyes, NEUTRAL_POSE } from './pose';
import type { PetPose } from './pose';
import { arcFill, ellipseFill, growth } from './shapes';

/**
 * FROSCH — breiter Kopf mit zwei Augenhügeln obenauf, Dauergrinsen, dicke
 * Schenkel und Schwimmfüße. Ab Lv50 „Regenkönig"-Form mit Goldaugen,
 * Seerosenblüte auf dem Kopf und leuchtenden Rückenstreifen.
 */
export const drawFrog = (
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
  const king = level >= 50;
  const s = growth(level);
  const breathe = animated ? Math.sin(frame * 0.05 * animationSpeed) : 0;

  const headCY = 13.6;
  const headRx = 6.5 * s;
  const headRy = 5.2 * s;
  const bodyCY = 21.5;
  const bodyRx = 5 * s;
  const bodyRy = 4.3 * s;
  const footY = bodyCY + bodyRy - 0.35;

  // SCHENKEL (seitlich hinter dem Körper)
  ctx.fillStyle = dark;
  ellipseFill(ctx, cx - bodyRx * 0.95, bodyCY + 1.6, 2.4, 2.1, ps, offset, -0.35);
  ellipseFill(ctx, cx + bodyRx * 0.95, bodyCY + 1.6, 2.4, 2.1, ps, offset, 0.35);

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '2e';
  ellipseFill(ctx, cx + bodyRx * 0.45, bodyCY + 0.4, bodyRx * 0.55, bodyRy * 0.72, ps, offset);

  // BAUCH (atmet leicht)
  ctx.fillStyle = king ? '#FFE9A8' : light;
  ellipseFill(ctx, cx, bodyCY + 0.5, bodyRx * 0.66, bodyRy * 0.7 + breathe * 0.12, ps, offset);

  // SCHWIMMFÜSSE mit drei Zehen
  for (const side of [-1, 1]) {
    const lift = pose.pawLift[side < 0 ? 0 : 1];
    ctx.fillStyle = dark;
    ellipseFill(ctx, cx + side * 3.5, footY - lift, 2, 0.75, ps, offset);
    ctx.fillStyle = color;
    for (let i = -1; i <= 1; i++) {
      arcFill(ctx, cx + side * 3.5 + i * 1.25, footY + 0.25 - lift, 0.48, ps, offset);
    }
  }

  // VORDERÄRMCHEN
  ctx.fillStyle = color;
  ellipseFill(ctx, cx - 2, bodyCY + 2, 0.95, 1.75, ps, offset, 0.16);
  ellipseFill(ctx, cx + 2, bodyCY + 2, 0.95, 1.75, ps, offset, -0.16);
  ctx.fillStyle = dark + '55';
  ellipseFill(ctx, cx - 2.1, bodyCY + 3.4, 0.8, 0.3, ps, offset);
  ellipseFill(ctx, cx + 2.1, bodyCY + 3.4, 0.8, 0.3, ps, offset);

  // AUGENHÜGEL
  const eyeX = 3.3;
  const bumpCY = headCY - headRy * 0.72;
  const bumpR = 2.65 * s;
  ctx.fillStyle = color;
  arcFill(ctx, cx - eyeX, bumpCY, bumpR, ps, offset);
  arcFill(ctx, cx + eyeX, bumpCY, bumpR, ps, offset);

  // KOPF
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, headCY, headRx, headRy, ps, offset);
  ctx.fillStyle = dark + '24';
  ellipseFill(ctx, cx + headRx * 0.42, headCY + 0.5, headRx * 0.5, headRy * 0.72, ps, offset);

  // HELLE KEHLE
  ctx.fillStyle = (king ? '#FFE9A8' : light) + 'cc';
  ellipseFill(ctx, cx, headCY + headRy * 0.62, headRx * 0.6, headRy * 0.3, ps, offset);

  // FLECKEN (ab Lv5) / LEUCHTSTREIFEN (Regenkönig)
  if (king) {
    const glow = animated ? 0.55 + Math.sin(frame * 0.06 * animationSpeed) * 0.25 : 0.6;
    ctx.fillStyle = `rgba(255, 213, 79, ${glow})`;
    ellipseFill(ctx, cx - headRx * 0.72, headCY - 0.2, 0.5, 1.7, ps, offset, 0.35);
    ellipseFill(ctx, cx + headRx * 0.72, headCY - 0.2, 0.5, 1.7, ps, offset, -0.35);
    ellipseFill(ctx, cx - bodyRx * 0.8, bodyCY - 0.6, 0.45, 1.4, ps, offset, 0.3);
    ellipseFill(ctx, cx + bodyRx * 0.8, bodyCY - 0.6, 0.45, 1.4, ps, offset, -0.3);
  } else if (level >= 5) {
    ctx.fillStyle = dark + '70';
    arcFill(ctx, cx - headRx * 0.7, headCY - 0.4, 0.75, ps, offset);
    arcFill(ctx, cx + headRx * 0.72, headCY + 0.3, 0.6, ps, offset);
    if (level >= 15) {
      arcFill(ctx, cx - headRx * 0.52, headCY - 1.9, 0.5, ps, offset);
      arcFill(ctx, cx + bodyRx * 0.74, bodyCY - 1, 0.6, ps, offset);
      arcFill(ctx, cx - bodyRx * 0.78, bodyCY - 0.4, 0.5, ps, offset);
    }
  }

  // AUGEN (sitzen auf den Hügeln)
  const eyeCY = bumpCY + 0.3;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  ctx.fillStyle = '#FFFFFF';
  arcFill(ctx, cx - eyeX, eyeCY, 1.85, ps, offset);
  arcFill(ctx, cx + eyeX, eyeCY, 1.85, ps, offset);
  beginLook(ctx, pose, ps);
  if (pose.eyes !== 'auto') {
    drawPoseEyes(ctx, pose.eyes, cx, eyeCY, eyeX, ps, offset, 1.25);
  } else if (blink) {
    ctx.fillStyle = color;
    arcFill(ctx, cx - eyeX, eyeCY, 1.9, ps, offset);
    arcFill(ctx, cx + eyeX, eyeCY, 1.9, ps, offset);
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, cx - eyeX, eyeCY + 0.2, 1.4, 0.28, ps, offset);
    ellipseFill(ctx, cx + eyeX, eyeCY + 0.2, 1.4, 0.28, ps, offset);
  } else {
    if (king) {
      ctx.fillStyle = '#FFC107';
      arcFill(ctx, cx - eyeX, eyeCY + 0.1, 1.45, ps, offset);
      arcFill(ctx, cx + eyeX, eyeCY + 0.1, 1.45, ps, offset);
    }
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, cx - eyeX, eyeCY + 0.15, king ? 0.95 : 1.15, ps, offset);
    arcFill(ctx, cx + eyeX, eyeCY + 0.15, king ? 0.95 : 1.15, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, cx - eyeX - 0.4, eyeCY - 0.3, 0.4, ps, offset);
    arcFill(ctx, cx + eyeX - 0.4, eyeCY - 0.3, 0.4, ps, offset);
  }
  ctx.restore();

  // NASENLÖCHER + BREITES GRINSEN
  ctx.fillStyle = '#1A1A1A99';
  arcFill(ctx, cx - 0.75, headCY - 0.5, 0.22, ps, offset);
  arcFill(ctx, cx + 0.75, headCY - 0.5, 0.22, ps, offset);
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.32;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx * ps, (headCY - 1.9) * ps + offset, 4.7 * ps, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.5)';
  arcFill(ctx, cx - headRx * 0.74, headCY + 1.7, 0.8, ps, offset);
  arcFill(ctx, cx + headRx * 0.74, headCY + 1.7, 0.8, ps, offset);

  // SEEROSENBLÜTE (Regenkönig, weicht Kopf-Accessoires)
  if (king && !wornSlots?.has('head')) {
    const top = headCY - headRy + 0.5;
    ctx.fillStyle = '#66BB6A';
    ellipseFill(ctx, cx, top + 0.3, 2.6, 0.7, ps, offset);
    ctx.fillStyle = '#F8BBD0';
    ellipseFill(ctx, cx - 1.1, top - 0.7, 0.75, 1.3, ps, offset, -0.6);
    ellipseFill(ctx, cx + 1.1, top - 0.7, 0.75, 1.3, ps, offset, 0.6);
    ctx.fillStyle = '#F48FB1';
    ellipseFill(ctx, cx, top - 1, 0.8, 1.5, ps, offset);
    ctx.fillStyle = '#FFE082';
    arcFill(ctx, cx, top - 0.3, 0.45, ps, offset);
  }
};
