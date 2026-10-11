import type { PetPose } from '../../../lib/pet/petPose';

export { NEUTRAL_POSE } from '../../../lib/pet/petPose';
export type { PetPose } from '../../../lib/pet/petPose';

const INK = '#1A1A1A';

export function drawPoseEyes(
  ctx: CanvasRenderingContext2D,
  eyes: PetPose['eyes'],
  cx: number,
  eyeY: number,
  spread: number,
  ps: number,
  offset: number,
  size = 1
): void {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = ps * 0.42 * size;
  ctx.lineCap = 'round';
  const r = 0.85 * size;
  for (const side of [-1, 1]) {
    const x = (cx + side * spread) * ps;
    ctx.beginPath();
    if (eyes === 'happy') {
      ctx.arc(x, (eyeY + 0.35) * ps + offset, r * ps, Math.PI * 1.12, Math.PI * 1.88);
    } else {
      ctx.arc(x, (eyeY - 0.4) * ps + offset, r * ps, Math.PI * 0.15, Math.PI * 0.85);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function beginLook(ctx: CanvasRenderingContext2D, pose: PetPose, ps: number): void {
  ctx.save();
  ctx.translate(pose.lookX * ps * 0.38, 0);
}
