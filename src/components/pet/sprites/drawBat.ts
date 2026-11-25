import type { AccessorySlot } from '../../../types/pet.types';
import { beginLook, drawPoseEyes, NEUTRAL_POSE } from './pose';
import type { PetPose } from './pose';
import { arcFill, ellipseFill, growth, polyFill } from './shapes';

/**
 * FLEDERMAUS — riesige Ohren, ausgebreitete Flughäute mit Bogenkante,
 * Brustflausch und zwei winzige Eckzähne. Ab Lv50 „Nachtfürst": weite
 * Schwingen mit rotem Futter, Sternsprenkel und Mondsichel auf der Stirn.
 */
export const drawBat = (
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
  const lord = level >= 50;
  const s = growth(level);
  const flap = animated ? Math.sin(frame * 0.07 * animationSpeed) : 0;

  const headR = 6.1 * s;
  const headCY = 13;
  const bodyCY = 21.4;
  const bodyRx = 4.2 * s;
  const bodyRy = 4.3 * s;

  // FLUGHÄUTE (setzen an den Schultern an, Bogenkante unten)
  const k = (lord ? 1.14 : 1) * s;
  const lift = flap * 0.6;
  for (const side of [-1, 1]) {
    const x = (dx: number) => (cx + side * dx * k) * ps;
    const y = (v: number) => v * ps + offset;
    const wristY = 14.7 - lift;
    const tipY = 17.3 - lift * 1.5;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x(3), y(18.8));
      ctx.quadraticCurveTo(x(5.2), y(15.6 - lift * 0.5), x(7.5), y(wristY));
      ctx.quadraticCurveTo(x(10.5), y(14.8 - lift), x(11.5), y(tipY));
      ctx.quadraticCurveTo(x(9.6), y(18.2), x(9), y(21.3));
      ctx.quadraticCurveTo(x(7.5), y(19.7), x(6.4), y(22.7));
      ctx.quadraticCurveTo(x(5), y(20.6), x(3.2), y(23.4));
      ctx.closePath();
    };
    ctx.fillStyle = dark;
    path();
    ctx.fill();
    ctx.fillStyle = 'rgba(30, 10, 60, 0.22)';
    path();
    ctx.fill();
    if (lord) {
      const g = ctx.createLinearGradient(x(3), 0, x(11.3), 0);
      g.addColorStop(0, 'rgba(198, 40, 40, 0)');
      g.addColorStop(1, 'rgba(239, 83, 80, 0.7)');
      ctx.fillStyle = g;
      path();
      ctx.fill();
    }
    // Arm und Fingerknochen (fächern vom Handgelenk aus)
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = ps * 0.5;
    ctx.beginPath();
    ctx.moveTo(x(3), y(18.8));
    ctx.quadraticCurveTo(x(5.2), y(15.6 - lift * 0.5), x(7.5), y(wristY));
    ctx.quadraticCurveTo(x(10.5), y(14.8 - lift), x(11.4), y(tipY - 0.1));
    ctx.stroke();
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.moveTo(x(7.5), y(wristY));
    ctx.lineTo(x(8.95), y(21));
    ctx.moveTo(x(7.5), y(wristY));
    ctx.lineTo(x(6.4), y(22.4));
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    // Daumen: runder Knubbel am Handgelenk
    ctx.fillStyle = light;
    arcFill(ctx, cx + side * 7.5 * k, wristY - 0.35, 0.5, ps, offset);
    if (lord) {
      ctx.fillStyle = 'rgba(255, 236, 179, 0.9)';
      arcFill(ctx, cx + side * 8.6 * k, 18 - lift, 0.26, ps, offset);
      arcFill(ctx, cx + side * 9.9 * k, 17.2 - lift, 0.2, ps, offset);
      arcFill(ctx, cx + side * 6.2 * k, 19.4, 0.22, ps, offset);
      arcFill(ctx, cx + side * 7.6 * k, 20.4, 0.18, ps, offset);
    }
  }

  // KÖRPER
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '30';
  ellipseFill(ctx, cx + bodyRx * 0.42, bodyCY + 0.4, bodyRx * 0.58, bodyRy * 0.75, ps, offset);

  // BRUSTFLAUSCH (gezackter Kragen aus hellem Fell)
  ctx.fillStyle = light;
  ellipseFill(ctx, cx, bodyCY - 0.6, bodyRx * 0.7, bodyRy * 0.5, ps, offset);
  for (let i = -2; i <= 2; i++) {
    polyFill(
      ctx,
      [
        [cx + i * 1.25 - 0.75, bodyCY + 0.7],
        [cx + i * 1.25 + 0.75, bodyCY + 0.7],
        [cx + i * 1.25, bodyCY + 2.1 - Math.abs(i) * 0.3],
      ],
      ps,
      offset
    );
  }

  // FÜSSCHEN
  ctx.fillStyle = dark;
  ellipseFill(ctx, cx - 2, bodyCY + bodyRy - 0.3 - pose.pawLift[0], 1.15, 0.75, ps, offset);
  ellipseFill(ctx, cx + 2, bodyCY + bodyRy - 0.3 - pose.pawLift[1], 1.15, 0.75, ps, offset);

  // OHREN (riesige Löffel mit runder Spitze, wackeln leicht)
  const earH = lord ? 4.9 : 4.3;
  for (const side of [-1, 1]) {
    const ex = cx + side * (headR * 0.66 + flap * 0.08);
    const ey = headCY - headR * 0.62 - earH * 0.55;
    ctx.fillStyle = color;
    ellipseFill(ctx, ex, ey, 2.5, earH, ps, offset, side * 0.3);
    ctx.fillStyle = dark;
    ellipseFill(ctx, ex + side * 0.15, ey + 0.5, 1.6, earH * 0.76, ps, offset, side * 0.3);
    ctx.fillStyle = '#F8A5B8';
    ellipseFill(ctx, ex + side * 0.1, ey + 0.9, 1.05, earH * 0.6, ps, offset, side * 0.3);
  }

  // KOPF
  ctx.fillStyle = color;
  arcFill(ctx, cx, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '26';
  ellipseFill(ctx, cx + headR * 0.45, headCY + 0.5, headR * 0.5, headR * 0.75, ps, offset);

  // HELLES SCHNÄUZCHEN
  ctx.fillStyle = light;
  ellipseFill(ctx, cx, headCY + headR * 0.46, headR * 0.46, headR * 0.32, ps, offset);

  // AUGEN
  const eyeY = headCY + 0.2;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  beginLook(ctx, pose, ps);
  if (pose.eyes !== 'auto') {
    drawPoseEyes(ctx, pose.eyes, cx, eyeY, 2.6, ps, offset, 1.05);
  } else if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, cx - 2.6, eyeY, 1, 0.25, ps, offset);
    ellipseFill(ctx, cx + 2.6, eyeY, 1, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, cx - 2.6, eyeY, 1.05, ps, offset);
    arcFill(ctx, cx + 2.6, eyeY, 1.05, ps, offset);
    if (lord) {
      ctx.fillStyle = '#EF5350';
      arcFill(ctx, cx - 2.6, eyeY + 0.25, 0.58, ps, offset);
      arcFill(ctx, cx + 2.6, eyeY + 0.25, 0.58, ps, offset);
    }
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, cx - 2.95, eyeY - 0.38, 0.36, ps, offset);
    arcFill(ctx, cx + 2.25, eyeY - 0.38, 0.36, ps, offset);
  }
  ctx.restore();

  // NÄSCHEN + MUND + ECKZÄHNE
  ctx.fillStyle = '#F06292';
  ellipseFill(ctx, cx, headCY + 1.75, 0.6, 0.42, ps, offset);
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(cx * ps, (headCY + 1.7) * ps + offset, ps * 1.6, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  polyFill(
    ctx,
    [
      [cx - 1.15, headCY + 2.95],
      [cx - 0.45, headCY + 3.2],
      [cx - 0.85, headCY + 4],
    ],
    ps,
    offset
  );
  polyFill(
    ctx,
    [
      [cx + 1.15, headCY + 2.95],
      [cx + 0.45, headCY + 3.2],
      [cx + 0.85, headCY + 4],
    ],
    ps,
    offset
  );

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.45)';
  arcFill(ctx, cx - headR * 0.7, headCY + 1.9, 0.78, ps, offset);
  arcFill(ctx, cx + headR * 0.7, headCY + 1.9, 0.78, ps, offset);

  // MONDSICHEL auf der Stirn (Nachtfürst, weicht Kopf-Accessoires)
  if (lord && !wornSlots?.has('head')) {
    ctx.fillStyle = '#FFE082';
    arcFill(ctx, cx, headCY - headR * 0.6, 1.15, ps, offset);
    ctx.fillStyle = color;
    arcFill(ctx, cx + 0.55, headCY - headR * 0.66, 0.98, ps, offset);
  }
};
