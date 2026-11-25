import type { AccessorySlot } from '../../../types/pet.types';
import { beginLook, drawPoseEyes, NEUTRAL_POSE } from './pose';
import type { PetPose } from './pose';
import { arcFill, ellipseFill, growth, polyFill } from './shapes';

const MANE = ['#FF9ECF', '#FFE27A', '#8EE3F5', '#C3A6FF'];

/** Kopfmaße des Einhorns; das Horn wird auch nach den Accessoires noch einmal gezeichnet. */
function hornBase(level: number): { cx: number; baseY: number; h: number; evolved: boolean } {
  const s = growth(level);
  return { cx: 16, baseY: 13 - 6.1 * s + 1.5, h: level >= 50 ? 5 : 4.1, evolved: level >= 50 };
}

/** Gedrehtes Goldhorn; ragt durch Hüte hindurch. */
export const drawUnicornHorn = (
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  offset: number,
  animated: boolean,
  frame: number,
  animationSpeed: number
): void => {
  const { cx, baseY, h, evolved } = hornBase(level);
  const tipY = baseY - h;
  if (evolved) {
    const glow = animated ? 0.3 + Math.sin(frame * 0.06 * animationSpeed) * 0.15 : 0.3;
    const g = ctx.createRadialGradient(
      cx * ps,
      (tipY + 1) * ps + offset,
      0,
      cx * ps,
      (tipY + 1) * ps + offset,
      3.4 * ps
    );
    g.addColorStop(0, `rgba(255, 244, 179, ${glow + 0.25})`);
    g.addColorStop(1, 'rgba(255, 244, 179, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx * ps, (tipY + 1) * ps + offset, 3.4 * ps, 0, Math.PI * 2);
    ctx.fill();
  }
  const grad = ctx.createLinearGradient((cx - 1) * ps, 0, (cx + 1) * ps, 0);
  grad.addColorStop(0, '#FFF3B0');
  grad.addColorStop(0.55, '#FFD54F');
  grad.addColorStop(1, '#F0A92B');
  ctx.fillStyle = grad;
  polyFill(
    ctx,
    [
      [cx - 1, baseY],
      [cx + 1, baseY],
      [cx, tipY],
    ],
    ps,
    offset
  );
  ctx.strokeStyle = 'rgba(176, 110, 12, 0.7)';
  ctx.lineWidth = ps * 0.18;
  for (let i = 1; i <= 3; i++) {
    const y = baseY - (h * i) / 4.2;
    const w = 1 - i / 4.2;
    ctx.beginPath();
    ctx.moveTo((cx - w) * ps, (y + 0.25) * ps + offset);
    ctx.lineTo((cx + w) * ps, (y - 0.25) * ps + offset);
    ctx.stroke();
  }
};

/**
 * EINHORN — Chibi-Pony mit Goldhorn, Regenbogenmähne und wehendem Schweif.
 * Ab Lv50 „Alicorn": Federflügel, leuchtendes Horn und Sternzeichen.
 */
export const drawUnicorn = (
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
  _wornSlots?: ReadonlySet<AccessorySlot>,
  pose: PetPose = NEUTRAL_POSE
): void => {
  const cx = 16;
  const alicorn = level >= 50;
  const s = growth(level);
  const sway = animated ? Math.sin(frame * 0.05 * animationSpeed) * 0.35 : 0;

  const headR = 6.1 * s;
  const headCY = 13;
  const bodyCY = 21.5;
  const bodyRx = 4.8 * s;
  const bodyRy = 4.4 * s;

  // FLÜGEL (Alicorn, hinter dem Körper)
  if (alicorn) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F1EAFF';
        ellipseFill(
          ctx,
          cx + side * (bodyRx + 2.6 - i * 0.25),
          bodyCY - 3.4 + i * 1.35 - sway * 0.5,
          3.4 - i * 0.5,
          1,
          ps,
          offset,
          side * (-0.7 + i * 0.3)
        );
      }
      ctx.fillStyle = '#E1D5FF';
      ellipseFill(
        ctx,
        cx + side * (bodyRx + 1),
        bodyCY - 1.2 - sway * 0.3,
        1.4,
        1.7,
        ps,
        offset,
        side * -0.3
      );
    }
  }

  // SCHWEIF (drei Regenbogensträhnen, rechts)
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = MANE[i];
    ellipseFill(
      ctx,
      cx + bodyRx + 1.3 + i * 0.75,
      bodyCY + 0.3 + i * 1.05 + sway * 0.5,
      1.35,
      2.7 - i * 0.3,
      ps,
      offset,
      -0.75 + i * 0.22 + sway * 0.12
    );
  }

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '2e';
  ellipseFill(ctx, cx + bodyRx * 0.42, bodyCY + 0.4, bodyRx * 0.58, bodyRy * 0.75, ps, offset);
  ctx.fillStyle = light + 'cc';
  ellipseFill(ctx, cx, bodyCY + 0.7, bodyRx * 0.55, bodyRy * 0.6, ps, offset);

  // STERNZEICHEN auf der Flanke (ab Lv20)
  if (level >= 20) {
    ctx.fillStyle = alicorn ? '#FFE27A' : '#FFFFFFaa';
    const mx = cx + bodyRx * 0.55;
    const my = bodyCY - 0.6;
    polyFill(
      ctx,
      [
        [mx, my - 0.95],
        [mx + 0.28, my - 0.28],
        [mx + 0.95, my],
        [mx + 0.28, my + 0.28],
        [mx, my + 0.95],
        [mx - 0.28, my + 0.28],
        [mx - 0.95, my],
        [mx - 0.28, my - 0.28],
      ],
      ps,
      offset
    );
  }

  // BEINE mit Hufen
  for (const side of [-1, 1]) {
    const lift = pose.pawLift[side < 0 ? 0 : 1];
    const fy = bodyCY + bodyRy - 0.75 - lift;
    ctx.fillStyle = color;
    ellipseFill(ctx, cx + side * 2.2, fy, 1.35, 1.15, ps, offset);
    ctx.fillStyle = alicorn ? '#FFD54F' : dark;
    ellipseFill(ctx, cx + side * 2.2, fy + 0.72, 1.3, 0.55, ps, offset);
  }

  // MÄHNE hinten (fällt links am Kopf herab)
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = MANE[(i + 1) % 4];
    ellipseFill(
      ctx,
      cx - headR * 0.9 - (i % 2) * 0.55,
      headCY - headR * 0.5 + i * 2 + sway * (0.15 + i * 0.1),
      1.85,
      1.9,
      ps,
      offset,
      0.25
    );
  }

  // OHREN
  const earTipY = headCY - headR - 1.7;
  for (const side of [-1, 1]) {
    ctx.fillStyle = color;
    polyFill(
      ctx,
      [
        [cx + side * headR * 0.86, headCY - headR * 0.4],
        [cx + side * headR * 0.3, headCY - headR * 0.9],
        [cx + side * headR * 0.72, earTipY],
      ],
      ps,
      offset
    );
    ctx.fillStyle = '#FFB6C1';
    polyFill(
      ctx,
      [
        [cx + side * headR * 0.74, headCY - headR * 0.55],
        [cx + side * headR * 0.46, headCY - headR * 0.82],
        [cx + side * headR * 0.68, earTipY + 1],
      ],
      ps,
      offset
    );
  }

  // KOPF
  ctx.fillStyle = color;
  arcFill(ctx, cx, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '24';
  ellipseFill(ctx, cx + headR * 0.45, headCY + 0.5, headR * 0.5, headR * 0.75, ps, offset);

  // SCHNAUZE mit Nüstern
  ctx.fillStyle = light;
  ellipseFill(ctx, cx, headCY + headR * 0.46, headR * 0.6, headR * 0.4, ps, offset);
  ctx.fillStyle = dark + 'bb';
  ellipseFill(ctx, cx - 1, headCY + headR * 0.4, 0.26, 0.4, ps, offset, 0.3);
  ellipseFill(ctx, cx + 1, headCY + headR * 0.4, 0.26, 0.4, ps, offset, -0.3);
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(cx * ps, (headCY + headR * 0.42) * ps + offset, ps * 1.5, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  // AUGEN mit Wimpern
  const eyeY = headCY + 0.1;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  beginLook(ctx, pose, ps);
  if (pose.eyes !== 'auto') {
    drawPoseEyes(ctx, pose.eyes, cx, eyeY, 2.7, ps, offset, 1.05);
  } else if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, cx - 2.7, eyeY, 1, 0.25, ps, offset);
    ellipseFill(ctx, cx + 2.7, eyeY, 1, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, cx - 2.7, eyeY, 1.05, ps, offset);
    arcFill(ctx, cx + 2.7, eyeY, 1.05, ps, offset);
    ctx.fillStyle = alicorn ? '#C3A6FF' : '#7E57C2';
    arcFill(ctx, cx - 2.7, eyeY + 0.3, 0.6, ps, offset);
    arcFill(ctx, cx + 2.7, eyeY + 0.3, 0.6, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, cx - 3.05, eyeY - 0.38, 0.36, ps, offset);
    arcFill(ctx, cx + 2.35, eyeY - 0.38, 0.36, ps, offset);
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = ps * 0.2;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo((cx + side * 3.45) * ps, (eyeY - 0.55) * ps + offset);
      ctx.lineTo((cx + side * 4.25) * ps, (eyeY - 1.05) * ps + offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((cx + side * 3.65) * ps, (eyeY - 0.05) * ps + offset);
      ctx.lineTo((cx + side * 4.45) * ps, (eyeY - 0.25) * ps + offset);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  ctx.restore();

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, cx - headR * 0.72, headCY + 1.9, 0.8, ps, offset);
  arcFill(ctx, cx + headR * 0.72, headCY + 1.9, 0.8, ps, offset);

  // STIRNLOCKE (fällt neben dem Horn in die Stirn)
  const lockY = headCY - headR * 0.72;
  ctx.fillStyle = MANE[0];
  ellipseFill(ctx, cx - 2.3, lockY + 0.2, 1.9, 1.2, ps, offset, -0.5);
  ctx.fillStyle = MANE[1];
  ellipseFill(ctx, cx - 0.9, lockY - 0.5, 1.5, 1, ps, offset, -0.25);
  ctx.fillStyle = MANE[2];
  ellipseFill(ctx, cx + 1.9, lockY, 1.6, 1.05, ps, offset, 0.5);

  drawUnicornHorn(ctx, level, ps, offset, animated, frame, animationSpeed);
};
