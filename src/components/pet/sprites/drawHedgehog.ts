import type { AccessorySlot } from '../../../types/pet.types';
import { beginLook, drawPoseEyes, NEUTRAL_POSE } from './pose';
import type { PetPose } from './pose';
import { arcFill, ellipseFill, growth, polyFill } from './shapes';

const CREAM = '#FFEBD2';
const CREAM_SHADE = '#F0CBA4';

/** Stachelkranz: Zacken entlang einer Ellipse zwischen zwei Winkeln (Bogenmaß, 0 = rechts). */
function spikeRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  count: number,
  length: number,
  ps: number,
  offset: number
): void {
  const step = (to - from) / count;
  for (let i = 0; i < count; i++) {
    const a = from + step * (i + 0.5);
    const half = step * 0.62;
    polyFill(
      ctx,
      [
        [cx + Math.cos(a - half) * rx, cy + Math.sin(a - half) * ry],
        [cx + Math.cos(a + half) * rx, cy + Math.sin(a + half) * ry],
        [cx + Math.cos(a) * (rx + length), cy + Math.sin(a) * (ry + length)],
      ],
      ps,
      offset
    );
  }
}

/**
 * IGEL — eine Stachelkugel mit cremefarbenem Gesicht und Bauch, spitzer
 * Schnauze mit Knopfnase und runden Öhrchen. Ab Lv50 „Kristalligel": die
 * Stacheln werden zu leuchtenden Kristallspitzen.
 */
export const drawHedgehog = (
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
  wornSlots?: ReadonlySet<AccessorySlot>,
  pose: PetPose = NEUTRAL_POSE
): void => {
  const cx = 16;
  const crystal = level >= 50;
  const s = growth(level);
  const bristle = animated ? Math.sin(frame * 0.05 * animationSpeed) * 0.15 : 0;

  const headCY = 13.6;
  const bodyCY = 21.6;
  const mantleCY = 16.8;
  const mRx = 7.6 * s;
  const mRy = 9 * s;
  const from = Math.PI * 0.84;
  const to = Math.PI * 2.16;

  // STACHELKUGEL (drei versetzte Reihen, außen dunkel)
  ctx.fillStyle = dark;
  ellipseFill(ctx, cx, mantleCY, mRx, mRy, ps, offset);
  spikeRing(ctx, cx, mantleCY, mRx, mRy, from, to, 19, 1.7 + bristle, ps, offset);
  ctx.fillStyle = color;
  ellipseFill(ctx, cx, mantleCY + 0.2, mRx * 0.9, mRy * 0.93, ps, offset);
  spikeRing(
    ctx,
    cx,
    mantleCY + 0.2,
    mRx * 0.9,
    mRy * 0.93,
    from + 0.07,
    to - 0.07,
    18,
    1.3,
    ps,
    offset
  );
  // Stachel-Maserung auf dem Mantel
  ctx.fillStyle = dark + 'b0';
  spikeRing(
    ctx,
    cx,
    mantleCY + 0.5,
    mRx * 0.7,
    mRy * 0.76,
    from + 0.14,
    to - 0.14,
    15,
    1,
    ps,
    offset
  );

  // KRISTALLSPITZEN (Lv50+)
  if (crystal) {
    const glow = animated ? 0.75 + Math.sin(frame * 0.07 * animationSpeed) * 0.2 : 0.85;
    const tints = ['128, 222, 234', '179, 136, 255', '129, 212, 250'];
    const step = (to - from) / 19;
    for (let i = 0; i < 19; i++) {
      const a = from + step * (i + 0.5);
      const reach = i % 2 === 0 ? 3 : 2.1;
      ctx.fillStyle = `rgba(${tints[i % 3]}, ${glow})`;
      polyFill(
        ctx,
        [
          [
            cx + Math.cos(a - step * 0.42) * (mRx + 0.3),
            mantleCY + Math.sin(a - step * 0.42) * (mRy + 0.3),
          ],
          [
            cx + Math.cos(a + step * 0.42) * (mRx + 0.3),
            mantleCY + Math.sin(a + step * 0.42) * (mRy + 0.3),
          ],
          [cx + Math.cos(a) * (mRx + reach), mantleCY + Math.sin(a) * (mRy + reach)],
        ],
        ps,
        offset
      );
    }
  }

  // BAUCH
  ctx.fillStyle = CREAM;
  ellipseFill(ctx, cx, bodyCY + 0.2, 4.1 * s, 4.1 * s, ps, offset);
  ctx.fillStyle = CREAM_SHADE + '77';
  ellipseFill(ctx, cx + 1.4 * s, bodyCY + 0.7, 1.9 * s, 2.7 * s, ps, offset);

  // FÜSSE
  ctx.fillStyle = CREAM_SHADE;
  ellipseFill(ctx, cx - 2.2, bodyCY + 4.1 * s - 0.2 - pose.pawLift[0], 1.35, 0.8, ps, offset);
  ellipseFill(ctx, cx + 2.2, bodyCY + 4.1 * s - 0.2 - pose.pawLift[1], 1.35, 0.8, ps, offset);

  // ÄRMCHEN
  ctx.fillStyle = CREAM;
  ellipseFill(ctx, cx - 3.7 * s, bodyCY - 0.4, 0.95, 1.55, ps, offset, 0.5);
  ellipseFill(ctx, cx + 3.7 * s, bodyCY - 0.4, 0.95, 1.55, ps, offset, -0.5);
  ctx.fillStyle = CREAM_SHADE + '99';
  ellipseFill(ctx, cx - 3.9 * s, bodyCY + 0.5, 0.6, 0.35, ps, offset, 0.5);
  ellipseFill(ctx, cx + 3.9 * s, bodyCY + 0.5, 0.6, 0.35, ps, offset, -0.5);

  // ÖHRCHEN
  const faceRx = 5.1 * s;
  const faceRy = 4.6 * s;
  const earY = headCY - faceRy * 0.72;
  ctx.fillStyle = CREAM_SHADE;
  arcFill(ctx, cx - faceRx * 0.86, earY, 1.3, ps, offset);
  arcFill(ctx, cx + faceRx * 0.86, earY, 1.3, ps, offset);
  ctx.fillStyle = '#FFB6C1';
  arcFill(ctx, cx - faceRx * 0.84, earY + 0.15, 0.7, ps, offset);
  arcFill(ctx, cx + faceRx * 0.84, earY + 0.15, 0.7, ps, offset);

  // GESICHT
  ctx.fillStyle = CREAM;
  ellipseFill(ctx, cx, headCY, faceRx, faceRy, ps, offset);
  ctx.fillStyle = CREAM_SHADE + '55';
  ellipseFill(ctx, cx + faceRx * 0.45, headCY + 0.5, faceRx * 0.45, faceRy * 0.7, ps, offset);

  // STIRNSTACHELN (kurze Zacken, die ins Gesicht ragen)
  const browY = headCY - faceRy + 0.1;
  ctx.fillStyle = color;
  for (let i = -3; i <= 3; i++) {
    const w = 0.72;
    const edge = Math.abs(i) === 3;
    polyFill(
      ctx,
      [
        [cx + i * 1.3 - w, browY - 0.6 + Math.abs(i) * 0.22],
        [cx + i * 1.3 + w, browY - 0.6 + Math.abs(i) * 0.22],
        [cx + i * 1.3, browY + (edge ? 1.5 : 1.25) + Math.abs(i) * 0.3],
      ],
      ps,
      offset
    );
  }

  // AUGEN
  const eyeY = headCY + 0.2;
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  beginLook(ctx, pose, ps);
  if (pose.eyes !== 'auto') {
    drawPoseEyes(ctx, pose.eyes, cx, eyeY, 2.5, ps, offset, 1);
  } else if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, cx - 2.5, eyeY, 0.95, 0.25, ps, offset);
    ellipseFill(ctx, cx + 2.5, eyeY, 0.95, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, cx - 2.5, eyeY, 0.95, ps, offset);
    arcFill(ctx, cx + 2.5, eyeY, 0.95, ps, offset);
    ctx.fillStyle = crystal ? '#B2EBF2' : '#FFFFFF';
    arcFill(ctx, cx - 2.8, eyeY - 0.35, 0.32, ps, offset);
    arcFill(ctx, cx + 2.2, eyeY - 0.35, 0.32, ps, offset);
  }
  ctx.restore();

  // SPITZE SCHNAUZE mit Knopfnase
  ctx.fillStyle = '#FFF7EC';
  ellipseFill(ctx, cx, headCY + 2.35, 2.2, 1.6, ps, offset);
  ctx.fillStyle = '#3E2723';
  ellipseFill(ctx, cx, headCY + 1.65, 1.05, 0.8, ps, offset);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  arcFill(ctx, cx - 0.3, headCY + 1.4, 0.26, ps, offset);
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc((cx - 0.7) * ps, (headCY + 2.65) * ps + offset, ps * 0.7, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc((cx + 0.7) * ps, (headCY + 2.65) * ps + offset, ps * 0.7, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.5)';
  arcFill(ctx, cx - 3.8, headCY + 1.9, 0.8, ps, offset);
  arcFill(ctx, cx + 3.8, headCY + 1.9, 0.8, ps, offset);

  // Aufgespießter Apfel ab Lv20 (weicht Kopf-Accessoires)
  if (level >= 20 && !crystal && !wornSlots?.has('head')) {
    const ax = cx + mRx * 0.52;
    const ay = mantleCY - mRy * 0.86;
    ctx.fillStyle = '#E53935';
    arcFill(ctx, ax, ay, 1.25, ps, offset);
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect((ax - 0.1) * ps, (ay - 1.8) * ps + offset, 0.22 * ps, 0.7 * ps);
    ctx.fillStyle = '#66BB6A';
    ellipseFill(ctx, ax + 0.55, ay - 1.45, 0.65, 0.32, ps, offset, -0.4);
  }
};
