import type { AccessorySlot } from '../../../types/pet.types';
import { beginLook, drawPoseEyes, NEUTRAL_POSE } from './pose';
import type { PetPose } from './pose';
import { arcFill, ellipseFill, growth } from './shapes';

/**
 * CAPYBARA — kantiger Kopf mit großer Schnauze, winzige Ohren, entspannter
 * Blick aus halb geschlossenen Augen, tonnenförmiger Körper. Ab Lv50
 * „Onsen-Meister": Handtuch mit Yuzu auf dem Kopf und aufsteigender Dampf.
 */
export const drawCapybara = (
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
  const master = level >= 50;
  const s = growth(level);
  const chew = animated ? Math.sin(frame * 0.09 * animationSpeed) * 0.12 : 0;

  const headCY = 13;
  const headRx = 5.9 * s;
  const headRy = 5.7 * s;
  const bodyCY = 22;
  const bodyRx = 5.9 * s;
  const bodyRy = 4.2 * s;

  // KÖRPER (Tonne)
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '30';
  ellipseFill(ctx, cx + bodyRx * 0.45, bodyCY + 0.4, bodyRx * 0.55, bodyRy * 0.75, ps, offset);
  ctx.fillStyle = light + 'aa';
  ellipseFill(ctx, cx, bodyCY + 1, bodyRx * 0.55, bodyRy * 0.55, ps, offset);

  // STUMMELBEINE
  ctx.fillStyle = dark;
  ellipseFill(ctx, cx - 2.6, bodyCY + bodyRy - 0.3 - pose.pawLift[0], 1.5, 0.85, ps, offset);
  ellipseFill(ctx, cx + 2.6, bodyCY + bodyRy - 0.3 - pose.pawLift[1], 1.5, 0.85, ps, offset);

  // VORDERPFOTEN (ruhen vor dem Bauch)
  ctx.fillStyle = color;
  ellipseFill(ctx, cx - bodyRx * 0.78, bodyCY + 0.9, 1.1, 1.7, ps, offset, 0.25);
  ellipseFill(ctx, cx + bodyRx * 0.78, bodyCY + 0.9, 1.1, 1.7, ps, offset, -0.25);

  // OHREN (winzig, oben seitlich)
  const earY = headCY - headRy * 0.86;
  ctx.fillStyle = dark;
  arcFill(ctx, cx - headRx * 0.66, earY, 1.3, ps, offset);
  arcFill(ctx, cx + headRx * 0.66, earY, 1.3, ps, offset);
  ctx.fillStyle = '#C98B7A';
  arcFill(ctx, cx - headRx * 0.66, earY + 0.2, 0.65, ps, offset);
  arcFill(ctx, cx + headRx * 0.66, earY + 0.2, 0.65, ps, offset);

  // KOPF (kantig: abgerundetes Rechteck)
  ctx.fillStyle = color;
  ctx.beginPath();
  const hx = (cx - headRx) * ps;
  const hy = (headCY - headRy) * ps + offset;
  if (ctx.roundRect) ctx.roundRect(hx, hy, headRx * 2 * ps, headRy * 2 * ps, headRx * 0.66 * ps);
  else ctx.rect(hx, hy, headRx * 2 * ps, headRy * 2 * ps);
  ctx.fill();
  // Volumen: Glanz oben links, Schatten rechts
  ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
  ellipseFill(
    ctx,
    cx - headRx * 0.35,
    headCY - headRy * 0.5,
    headRx * 0.5,
    headRy * 0.3,
    ps,
    offset
  );
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, cx + headRx * 0.5, headCY + 0.6, headRx * 0.42, headRy * 0.72, ps, offset);

  // SCHNAUZE (kastig, so breit wie der Kopf, ragt unten über)
  const sw = headRx * 1.86;
  const sh = headRy * 1.08;
  const snoutCY = headCY + headRy + 0.55 - sh / 2;
  ctx.fillStyle = light;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(
      (cx - sw / 2) * ps,
      (snoutCY - sh / 2) * ps + offset,
      sw * ps,
      sh * ps,
      sh * 0.46 * ps
    );
  } else {
    ctx.rect((cx - sw / 2) * ps, (snoutCY - sh / 2) * ps + offset, sw * ps, sh * ps);
  }
  ctx.fill();

  // NASE (breit) + NASENLÖCHER
  ctx.fillStyle = '#4E342E';
  ellipseFill(ctx, cx, snoutCY - sh * 0.22, 2.1, 1.05, ps, offset);
  ctx.fillStyle = '#2B1B17';
  arcFill(ctx, cx - 0.95, snoutCY - sh * 0.22 + 0.1, 0.34, ps, offset);
  arcFill(ctx, cx + 0.95, snoutCY - sh * 0.22 + 0.1, 0.34, ps, offset);

  // MUND (kaut gemächlich)
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = ps * 0.24;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (snoutCY + 0.4) * ps + offset);
  ctx.lineTo(cx * ps, (snoutCY + 1.35 + chew) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx * ps, (snoutCY + 0.3 + chew) * ps + offset, ps * 1.7, 0.24 * Math.PI, 0.76 * Math.PI);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // AUGEN (klein, hoch, mit schwerem Lid — der unerschütterliche Blick)
  const eyeY = headCY - headRy * 0.36;
  const eyeX = 3.6;
  beginLook(ctx, pose, ps);
  if (pose.eyes !== 'auto') {
    drawPoseEyes(ctx, pose.eyes, cx, eyeY, eyeX, ps, offset, 0.9);
  } else {
    const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
    if (!blink) {
      ctx.fillStyle = '#1A1A1A';
      arcFill(ctx, cx - eyeX, eyeY, 0.85, ps, offset);
      arcFill(ctx, cx + eyeX, eyeY, 0.85, ps, offset);
      ctx.fillStyle = '#FFFFFF';
      arcFill(ctx, cx - eyeX - 0.25, eyeY + 0.15, 0.24, ps, offset);
      arcFill(ctx, cx + eyeX - 0.25, eyeY + 0.15, 0.24, ps, offset);
      // Lid deckt das obere Drittel
      ctx.fillStyle = color;
      ctx.fillRect((cx - eyeX - 1.05) * ps, (eyeY - 1.05) * ps + offset, 2.1 * ps, 0.72 * ps);
      ctx.fillRect((cx + eyeX - 1.05) * ps, (eyeY - 1.05) * ps + offset, 2.1 * ps, 0.72 * ps);
    }
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = ps * 0.3;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo((cx + side * eyeX - 0.95) * ps, (eyeY - (blink ? 0 : 0.33)) * ps + offset);
      ctx.lineTo((cx + side * eyeX + 0.95) * ps, (eyeY - (blink ? 0 : 0.33)) * ps + offset);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  ctx.restore();

  // WANGENRÖTE (Onsen-Meister: kräftiger)
  ctx.fillStyle = master ? 'rgba(255, 112, 100, 0.6)' : 'rgba(255, 138, 128, 0.42)';
  arcFill(ctx, cx - headRx * 0.8, headCY - 0.4, 0.75, ps, offset);
  arcFill(ctx, cx + headRx * 0.8, headCY - 0.4, 0.75, ps, offset);

  const top = headCY - headRy;
  if (master) {
    // DAMPF
    if (animated) {
      for (let i = 0; i < 3; i++) {
        const t = (frame * 0.012 * animationSpeed + i / 3) % 1;
        const x = cx + (i - 1) * 4.6 + Math.sin(t * Math.PI * 2 + i) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.42 * (1 - t)})`;
        ellipseFill(ctx, x, top - 0.5 - t * 3.6, 0.7 + t * 0.5, 1 + t * 0.6, ps, offset);
      }
    }
    if (!wornSlots?.has('head')) {
      // Gefaltetes Handtuch + Yuzu
      ctx.fillStyle = '#FAFAFA';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect((cx - 3.1) * ps, (top - 1) * ps + offset, 6.2 * ps, 1.7 * ps, 0.6 * ps);
      } else ctx.rect((cx - 3.1) * ps, (top - 1) * ps + offset, 6.2 * ps, 1.7 * ps);
      ctx.fill();
      ctx.fillStyle = '#90CAF9';
      ctx.fillRect((cx - 3.1) * ps, (top - 0.35) * ps + offset, 6.2 * ps, 0.4 * ps);
      ctx.fillStyle = '#FFB300';
      arcFill(ctx, cx, top - 2.1, 1.45, ps, offset);
      ctx.fillStyle = '#66BB6A';
      ellipseFill(ctx, cx + 0.6, top - 3.5, 0.8, 0.38, ps, offset, -0.5);
    }
  } else if (level >= 20 && !wornSlots?.has('head')) {
    // Yuzu balanciert auf dem Kopf
    ctx.fillStyle = '#FFB300';
    arcFill(ctx, cx, top - 1, 1.35, ps, offset);
    ctx.fillStyle = '#66BB6A';
    ellipseFill(ctx, cx + 0.55, top - 2.3, 0.75, 0.35, ps, offset, -0.5);
  }
};
