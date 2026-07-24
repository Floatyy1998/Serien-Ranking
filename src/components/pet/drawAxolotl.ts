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

/**
 * AXOLOTL — Chibi-Wassermolch: großer runder Kopf mit je drei wedelnden
 * Kiemen-Ästen, Dauer-Lächeln, Mini-Ärmchen, Schwanzflosse. Ab Lv50
 * „Leviathan"-Form mit leuchtenden Kiemen, Rückenkamm und Glanz-Punkten.
 */
export const drawAxolotl = (
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
  _equippedSlot?: AccessorySlot | null
): void => {
  const centerX = 16;
  const centerY = 16;
  const leviathan = level >= 50;

  const sizeBoost = leviathan
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

  // Kiemen wedeln sanft wie im Wasser
  const sway = animated ? Math.sin(frame * 0.05 * animationSpeed) * 0.5 : 0;

  // SCHWANZFLOSSE (hinter dem Körper, seitlich rechts)
  ctx.fillStyle = light;
  ellipseFill(
    ctx,
    centerX + 6.5 * sizeBoost,
    centerY + 6,
    2.6,
    3.4,
    ps,
    offset,
    0.55 + sway * 0.08
  );
  ctx.fillStyle = color;
  ellipseFill(
    ctx,
    centerX + 5.6 * sizeBoost,
    centerY + 6.2,
    1.7,
    2.6,
    ps,
    offset,
    0.55 + sway * 0.08
  );

  // KÖRPER (klein, gedrungen)
  const bodyRx = 4.6 * sizeBoost;
  const bodyRy = 4.2 * sizeBoost;
  const bodyCY = centerY + 6;
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX, bodyCY, bodyRx, bodyRy, ps, offset);
  ctx.fillStyle = dark + '2e';
  ellipseFill(ctx, centerX + bodyRx * 0.45, bodyCY + 0.5, bodyRx * 0.6, bodyRy * 0.7, ps, offset);

  // BAUCH
  ctx.fillStyle = light;
  ellipseFill(ctx, centerX, bodyCY + 1, bodyRx * 0.6, bodyRy * 0.55, ps, offset);

  // MINI-ÄRMCHEN
  ctx.fillStyle = color;
  ellipseFill(ctx, centerX - bodyRx * 0.9, bodyCY + 0.8, 1, 1.6, ps, offset, -0.35);
  ellipseFill(ctx, centerX + bodyRx * 0.9, bodyCY + 0.8, 1, 1.6, ps, offset, 0.35);

  // RÜCKENKAMM (Leviathan)
  if (leviathan) {
    ctx.fillStyle = light;
    for (let i = 0; i < 3; i++) {
      ellipseFill(
        ctx,
        centerX - 1.5 + i * 1.6,
        bodyCY - bodyRy - 0.4,
        0.7,
        1.2 + (i === 1 ? 0.5 : 0),
        ps,
        offset
      );
    }
  }

  // KOPF (groß und rund — Chibi-Look)
  const headR = 6.3 * sizeBoost;
  const headCY = centerY - 3;
  ctx.fillStyle = color;
  arcFill(ctx, centerX, headCY, headR, ps, offset);
  ctx.fillStyle = dark + '22';
  arcFill(ctx, centerX + headR * 0.32, headCY + 0.5, headR * 0.72, ps, offset);

  // KIEMEN (je Seite drei Äste mit Fransen-Punkten — DAS Axolotl-Merkmal)
  const gillColor = leviathan ? '#FF8A80' : dark;
  const gillGlow = leviathan && animated ? 0.35 + Math.sin(frame * 0.06 * animationSpeed) * 0.2 : 0;
  const gillLen = leviathan ? 3.6 : 2.8;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const baseY = headCY - 2 + i * 2.1;
      const ang = side * (0.55 + i * 0.28) + sway * 0.06 * side;
      const gx = centerX + side * (headR * 0.88);
      ctx.fillStyle = gillColor;
      ellipseFill(
        ctx,
        gx + side * Math.cos(ang) * gillLen * 0.45,
        baseY + Math.sin(Math.abs(ang)) * 0.4,
        gillLen * 0.55,
        0.75,
        ps,
        offset,
        ang
      );
      // Fransen-Knubbel am Ende
      arcFill(
        ctx,
        gx + side * Math.cos(ang) * gillLen * 0.95,
        baseY + Math.sin(Math.abs(ang)) * 0.8,
        0.65,
        ps,
        offset
      );
      if (gillGlow > 0) {
        ctx.fillStyle = `rgba(255, 138, 128, ${gillGlow})`;
        arcFill(
          ctx,
          gx + side * Math.cos(ang) * gillLen * 0.95,
          baseY + Math.sin(Math.abs(ang)) * 0.8,
          1.25,
          ps,
          offset
        );
      }
    }
  }

  // AUGEN (weit auseinander, freundliche Knopfaugen)
  const blink = animated && Math.floor(frame * 0.02 * animationSpeed) % 8 === 7;
  const eyeY = headCY + 0.3;
  if (blink) {
    ctx.fillStyle = '#1A1A1A';
    ellipseFill(ctx, centerX - 3.1, eyeY, 0.95, 0.25, ps, offset);
    ellipseFill(ctx, centerX + 3.1, eyeY, 0.95, 0.25, ps, offset);
  } else {
    ctx.fillStyle = '#1A1A1A';
    arcFill(ctx, centerX - 3.1, eyeY, 1, ps, offset);
    arcFill(ctx, centerX + 3.1, eyeY, 1, ps, offset);
    ctx.fillStyle = '#FFFFFF';
    arcFill(ctx, centerX - 3.4, eyeY - 0.35, 0.35, ps, offset);
    arcFill(ctx, centerX + 2.8, eyeY - 0.35, 0.35, ps, offset);
  }

  // DAS AXOLOTL-LÄCHELN (breiter, zufriedener Bogen)
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.45;
  ctx.beginPath();
  ctx.arc(centerX * ps, (eyeY + 0.9) * ps + offset, 2.1 * ps, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // WANGENRÖTE
  ctx.fillStyle = 'rgba(255, 138, 128, 0.5)';
  arcFill(ctx, centerX - 4.3, eyeY + 1.5, 0.85, ps, offset);
  arcFill(ctx, centerX + 4.3, eyeY + 1.5, 0.85, ps, offset);

  // LEVIATHAN-GLANZPUNKTE (Lv50+): Biolumineszenz auf Kopf und Rücken
  if (leviathan) {
    const dotAlpha = animated ? 0.5 + Math.sin(frame * 0.07 * animationSpeed) * 0.25 : 0.5;
    ctx.fillStyle = `rgba(128, 222, 234, ${dotAlpha})`;
    arcFill(ctx, centerX - 2, headCY - headR * 0.55, 0.45, ps, offset);
    arcFill(ctx, centerX + 1.4, headCY - headR * 0.68, 0.35, ps, offset);
    arcFill(ctx, centerX + 3.2, headCY - headR * 0.4, 0.4, ps, offset);
    arcFill(ctx, centerX - 1, bodyCY - bodyRy * 0.5, 0.35, ps, offset);
  }
};
