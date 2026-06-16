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

export const drawPanda = (
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
  const centerY = 16;

  // === STUFE 8+ (Lv50): KUNG-FU-WÄCHTER FORM ===
  if (level >= 50) {
    drawGuardianPanda(
      ctx,
      level,
      ps,
      color,
      dark,
      light,
      offset,
      animated,
      frame,
      animationSpeed,
      equippedSlot
    );
    return;
  }

  // === STUFEN 1-7: KAWAII PANDA (Lv1-49) ===
  // Snowman-Silhouette: Kopf + Körper als zwei klar erkennbare Kugeln,
  // Mickey-Mouse-Ohren oben, klassische Panda-Markierungen.

  const sizeBoost =
    level >= 20 ? 1.12 : level >= 15 ? 1.08 : level >= 10 ? 1.05 : level >= 5 ? 1.02 : 1;

  // === KÖRPER (untere Kugel, User-Farbe) ===
  const bodyR = 5.5 * sizeBoost;
  const bodyCY = centerY + 6;
  ctx.fillStyle = color;
  arcFill(ctx, centerX, bodyCY, bodyR, ps, offset);

  // Sanfte Seitenschattierung
  ctx.fillStyle = dark + '33';
  arcFill(ctx, centerX + bodyR * 0.4, bodyCY + 0.5, bodyR * 0.7, ps, offset);

  // === KLEINE SCHWARZE PFOTEN unten ===
  ctx.fillStyle = '#1A1A1A';
  ellipseFill(ctx, centerX - 2.5, bodyCY + bodyR - 0.5, 1.5, 0.9, ps, offset);
  ellipseFill(ctx, centerX + 2.5, bodyCY + bodyR - 0.5, 1.5, 0.9, ps, offset);
  // Pfotenballen (kleine braune Punkte)
  ctx.fillStyle = '#5C3A2E';
  arcFill(ctx, centerX - 2.5, bodyCY + bodyR - 0.3, 0.4, ps, offset);
  arcFill(ctx, centerX + 2.5, bodyCY + bodyR - 0.3, 0.4, ps, offset);

  // === KLEINE SCHWARZE ÄRMCHEN (kuschelnd seitlich angelegt) ===
  ctx.fillStyle = '#1A1A1A';
  ellipseFill(ctx, centerX - bodyR * 0.85, bodyCY + 0.5, 1.2, 1.8, ps, offset, -0.3);
  ellipseFill(ctx, centerX + bodyR * 0.85, bodyCY + 0.5, 1.2, 1.8, ps, offset, 0.3);

  // === WEISSER BAUCH-OVAL ===
  ctx.fillStyle = '#FFFFFF';
  ellipseFill(ctx, centerX, bodyCY + 0.5, bodyR * 0.65, bodyR * 0.75, ps, offset);

  // === KOPF (obere Kugel, größer als Körper für Chibi-Look) ===
  const headR = 6.5 * sizeBoost;
  const headCY = centerY - 3;
  ctx.fillStyle = color;
  arcFill(ctx, centerX, headCY, headR, ps, offset);

  // Sanfte Schattierung am Kopf
  ctx.fillStyle = dark + '22';
  arcFill(ctx, centerX + headR * 0.3, headCY + 0.5, headR * 0.75, ps, offset);

  // === MICKEY-MOUSE-OHREN (groß, klar erkennbar OBEN auf dem Kopf) ===
  const earR = (level >= 15 ? 2.6 : level >= 10 ? 2.4 : level >= 5 ? 2.2 : 2) * sizeBoost;
  const earOffsetX = headR * 0.75;
  const earOffsetY = headCY - headR * 0.85;

  // Schwarz, deutlich über dem Kopf
  ctx.fillStyle = '#1A1A1A';
  arcFill(ctx, centerX - earOffsetX, earOffsetY, earR, ps, offset);
  arcFill(ctx, centerX + earOffsetX, earOffsetY, earR, ps, offset);

  // Warmer Innenohr-Punkt
  ctx.fillStyle = '#7A4D3F';
  arcFill(ctx, centerX - earOffsetX, earOffsetY + 0.3, earR * 0.5, ps, offset);
  arcFill(ctx, centerX + earOffsetX, earOffsetY + 0.3, earR * 0.5, ps, offset);

  // === WEISSE SCHNAUZE (großes weiches Oval) ===
  ctx.fillStyle = '#FFFFFF';
  ellipseFill(ctx, centerX, headCY + 2, 3.5, 2.8, ps, offset);

  // === SCHWARZE AUGENFLECKEN (klassisches Panda-Merkmal, schräg gestellt) ===
  ctx.fillStyle = '#1A1A1A';
  ellipseFill(ctx, centerX - 2.8, headCY - 0.3, 1.8, 2.2, ps, offset, -0.4);
  ellipseFill(ctx, centerX + 2.8, headCY - 0.3, 1.8, 2.2, ps, offset, 0.4);

  // === GROSSE KAWAII-AUGEN ===
  // Weißer Hintergrund
  ctx.fillStyle = '#FFFFFF';
  arcFill(ctx, centerX - 2.6, headCY + 0.3, 0.9, ps, offset);
  arcFill(ctx, centerX + 2.6, headCY + 0.3, 0.9, ps, offset);
  // Schwarze Pupille
  ctx.fillStyle = '#000';
  arcFill(ctx, centerX - 2.4, headCY + 0.5, 0.55, ps, offset);
  arcFill(ctx, centerX + 2.8, headCY + 0.5, 0.55, ps, offset);
  // Großer Glanzpunkt (kawaii sparkle)
  ctx.fillStyle = '#FFFFFF';
  arcFill(ctx, centerX - 2.2, headCY + 0.3, 0.3, ps, offset);
  arcFill(ctx, centerX + 3.0, headCY + 0.3, 0.3, ps, offset);
  // Mini-Glanz
  arcFill(ctx, centerX - 2.7, headCY + 0.7, 0.15, ps, offset);
  arcFill(ctx, centerX + 2.5, headCY + 0.7, 0.15, ps, offset);

  // === ROSA WANGEN (Pummel-Look) ===
  ctx.fillStyle = '#FFB6C1CC';
  arcFill(ctx, centerX - 4.3, headCY + 1.8, 1.3, ps, offset);
  arcFill(ctx, centerX + 4.3, headCY + 1.8, 1.3, ps, offset);

  // === KLEINE SCHWARZE KNUBBEL-NASE ===
  ctx.fillStyle = '#1A1A1A';
  ellipseFill(ctx, centerX, headCY + 2, 0.7, 0.55, ps, offset);

  // === FREUNDLICHES LÄCHELN ===
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = ps * 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX * ps, (headCY + 2.5) * ps + offset);
  ctx.lineTo(centerX * ps, (headCY + 3) * ps + offset);
  ctx.moveTo((centerX - 1) * ps, (headCY + 3) * ps + offset);
  ctx.quadraticCurveTo(
    centerX * ps,
    (headCY + 4) * ps + offset,
    (centerX + 1) * ps,
    (headCY + 3) * ps + offset
  );
  ctx.stroke();
  ctx.lineCap = 'butt';

  // === Stufe 3 (Lv5+): Bambusblatt in der Hand ===
  if (level >= 5 && equippedSlot !== 'neck') {
    // Stamm
    ctx.fillStyle = '#558B2F';
    ctx.fillRect((centerX + bodyR * 0.85) * ps, (bodyCY - 1) * ps + offset, ps * 0.6, ps * 2.5);
    // Blatt
    ctx.fillStyle = '#8BC34A';
    ellipseFill(ctx, centerX + bodyR * 0.85 + 1.2, bodyCY - 1.5, 1.5, 0.5, ps, offset, -0.3);
    ctx.fillStyle = '#7CB342';
    ellipseFill(ctx, centerX + bodyR * 0.85 + 1.5, bodyCY - 2, 1, 0.4, ps, offset, -0.5);
  }

  // === Stufe 4 (Lv10+): Schläfrige Augen + Schlaf-Z ===
  if (level >= 10) {
    // Augenlid-Andeutung (oberer Teil der Augen leicht abgedunkelt)
    ctx.fillStyle = '#1A1A1A88';
    ellipseFill(ctx, centerX - 2.6, headCY - 0.3, 1, 0.4, ps, offset);
    ellipseFill(ctx, centerX + 2.6, headCY - 0.3, 1, 0.4, ps, offset);

    if (animated) {
      const zPhase = frame * 0.02 * animationSpeed;
      const zAlpha = 0.5 + Math.sin(zPhase) * 0.3;
      ctx.fillStyle = `rgba(180, 200, 255, ${zAlpha})`;
      ctx.font = `bold ${ps * 2.8}px Arial`;
      ctx.fillText(
        'z',
        (centerX + headR + 0.5) * ps,
        (headCY - headR + Math.sin(zPhase) * 0.5) * ps + offset
      );
    }
  }

  // === Stufe 5 (Lv20+): Herz auf der Brust + Funken ===
  if (level >= 20) {
    if (equippedSlot !== 'neck') {
      ctx.fillStyle = '#FF6B9D';
      // Pixel-Herz
      ctx.fillRect((centerX - 1.2) * ps, bodyCY * ps + offset, ps * 0.8, ps * 0.8);
      ctx.fillRect((centerX + 0.4) * ps, bodyCY * ps + offset, ps * 0.8, ps * 0.8);
      ctx.fillRect((centerX - 1.2) * ps, (bodyCY + 0.6) * ps + offset, ps * 2.4, ps * 0.8);
      ctx.fillRect((centerX - 0.8) * ps, (bodyCY + 1.2) * ps + offset, ps * 1.6, ps * 0.6);
      ctx.fillRect((centerX - 0.3) * ps, (bodyCY + 1.7) * ps + offset, ps * 0.6, ps * 0.5);
    }

    if (animated) {
      const sparkPhase = frame * 0.04 * animationSpeed;
      for (let i = 0; i < 4; i++) {
        const angle = sparkPhase + i * (Math.PI / 2);
        const sx = centerX * ps + Math.cos(angle) * ps * 9;
        const sy = (centerY + 2) * ps + offset + Math.sin(angle) * ps * 7;
        const alpha = 0.3 + Math.sin(sparkPhase * 2 + i) * 0.2;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fillRect(sx - ps * 0.2, sy - ps * 0.2, ps * 0.4, ps * 0.4);
      }
    }
  }

  // === Stufe 6 (Lv30+): Bambusblatt am Ohr + dickere Wangen ===
  if (level >= 30) {
    if (equippedSlot !== 'head') {
      ctx.fillStyle = '#8BC34A';
      ellipseFill(ctx, centerX + earOffsetX + 1, earOffsetY - 0.5, 1.3, 0.5, ps, offset, -0.5);
      ctx.fillStyle = '#558B2F';
      ctx.fillRect(
        (centerX + earOffsetX + 0.5) * ps,
        (earOffsetY - 0.3) * ps + offset,
        ps * 0.4,
        ps * 0.6
      );
    }

    // Intensivere Wangen
    ctx.fillStyle = '#FF85A1AA';
    arcFill(ctx, centerX - 4.3, headCY + 1.8, 1.5, ps, offset);
    arcFill(ctx, centerX + 4.3, headCY + 1.8, 1.5, ps, offset);
  }

  // === Stufe 7 (Lv40+): Qi-Glow um die Ohren + leuchtende Augen ===
  if (level >= 40) {
    ctx.shadowColor = '#90EE90';
    ctx.shadowBlur = ps * 3;
    ctx.fillStyle = '#90EE9066';
    arcFill(ctx, centerX - earOffsetX, earOffsetY, earR + 0.4, ps, offset);
    arcFill(ctx, centerX + earOffsetX, earOffsetY, earR + 0.4, ps, offset);
    ctx.shadowBlur = 0;

    // Leuchtende Pupillen
    ctx.fillStyle = '#90EE90DD';
    arcFill(ctx, centerX - 2.4, headCY + 0.5, 0.5, ps, offset);
    arcFill(ctx, centerX + 2.8, headCY + 0.5, 0.5, ps, offset);
    ctx.fillStyle = '#FFF';
    arcFill(ctx, centerX - 2.2, headCY + 0.3, 0.25, ps, offset);
    arcFill(ctx, centerX + 3.0, headCY + 0.3, 0.25, ps, offset);
  }
};

// === KUNG-FU-WÄCHTER-FORM (Level 50+) ===
function drawGuardianPanda(
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
): void {
  const centerX = 16;
  const centerY = 16;

  const isMythical = level >= 100;
  const isLegend = level >= 75;
  const isChampion = level >= 60;

  const bodyAlpha = isMythical ? 'BB' : '';
  const mainColor = color + bodyAlpha;
  const lightColor = light + bodyAlpha;
  const darkColor = dark + bodyAlpha;
  const blackInk = '#1A1A1A' + bodyAlpha;
  const whiteFur = '#FFFFFF' + bodyAlpha;

  // === GROSSER WÄCHTER-KÖRPER ===
  const bodyR = isLegend ? 7 : isChampion ? 6.5 : 6;
  const bodyCY = centerY + 6;
  ctx.fillStyle = mainColor;
  arcFill(ctx, centerX, bodyCY, bodyR, ps, offset);

  ctx.fillStyle = darkColor + '33';
  arcFill(ctx, centerX + bodyR * 0.4, bodyCY + 0.5, bodyR * 0.75, ps, offset);

  // Pfoten unten
  ctx.fillStyle = blackInk;
  ellipseFill(ctx, centerX - 3, bodyCY + bodyR - 0.5, 1.7, 1, ps, offset);
  ellipseFill(ctx, centerX + 3, bodyCY + bodyR - 0.5, 1.7, 1, ps, offset);
  ctx.fillStyle = '#5C3A2E' + bodyAlpha;
  arcFill(ctx, centerX - 3, bodyCY + bodyR - 0.3, 0.5, ps, offset);
  arcFill(ctx, centerX + 3, bodyCY + bodyR - 0.3, 0.5, ps, offset);

  // Schwarze Fäuste seitlich (Kampfbereit)
  ctx.fillStyle = blackInk;
  arcFill(ctx, centerX - bodyR * 0.9, bodyCY + 0.5, 1.6, ps, offset);
  arcFill(ctx, centerX + bodyR * 0.9, bodyCY + 0.5, 1.6, ps, offset);

  // Weißer Bauch
  ctx.fillStyle = whiteFur;
  ellipseFill(ctx, centerX, bodyCY + 0.5, bodyR * 0.7, bodyR * 0.75, ps, offset);

  // === KOPF (groß, klar erkennbar) ===
  const headR = isLegend ? 7 : 6.7;
  const headCY = centerY - 3.5;
  ctx.fillStyle = mainColor;
  arcFill(ctx, centerX, headCY, headR, ps, offset);

  ctx.fillStyle = darkColor + '22';
  arcFill(ctx, centerX + headR * 0.3, headCY + 0.5, headR * 0.75, ps, offset);

  // === Große Mickey-Style-Ohren ===
  const earR = 2.7;
  const earOffsetX = headR * 0.75;
  const earOffsetY = headCY - headR * 0.85;
  ctx.fillStyle = blackInk;
  arcFill(ctx, centerX - earOffsetX, earOffsetY, earR, ps, offset);
  arcFill(ctx, centerX + earOffsetX, earOffsetY, earR, ps, offset);
  ctx.fillStyle = '#7A4D3F' + bodyAlpha;
  arcFill(ctx, centerX - earOffsetX, earOffsetY + 0.3, earR * 0.5, ps, offset);
  arcFill(ctx, centerX + earOffsetX, earOffsetY + 0.3, earR * 0.5, ps, offset);

  // Qi-Schimmer im Ohr
  if (animated) {
    const earGlow = 0.3 + Math.sin(frame * 0.06 * animationSpeed) * 0.2;
    ctx.fillStyle = `rgba(144, 238, 144, ${earGlow})`;
    arcFill(ctx, centerX - earOffsetX, earOffsetY + 0.3, earR * 0.3, ps, offset);
    arcFill(ctx, centerX + earOffsetX, earOffsetY + 0.3, earR * 0.3, ps, offset);
  }

  // === Schnauze ===
  ctx.fillStyle = lightColor;
  ellipseFill(ctx, centerX, headCY + 2.2, 3.8, 3, ps, offset);

  // === Augenflecken ===
  ctx.fillStyle = blackInk;
  ellipseFill(ctx, centerX - 3, headCY - 0.3, 2, 2.4, ps, offset, -0.4);
  ellipseFill(ctx, centerX + 3, headCY - 0.3, 2, 2.4, ps, offset, 0.4);

  // Leuchtende Wächter-Augen
  const eyeColor = isLegend ? '#FFD700' : '#90EE90';
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = ps * 4;
  ctx.fillStyle = eyeColor;
  arcFill(ctx, centerX - 2.7, headCY + 0.3, 1, ps, offset);
  arcFill(ctx, centerX + 2.9, headCY + 0.3, 1, ps, offset);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  arcFill(ctx, centerX - 2.5, headCY + 0.5, 0.55, ps, offset);
  arcFill(ctx, centerX + 3.1, headCY + 0.5, 0.55, ps, offset);
  ctx.fillStyle = '#FFF';
  arcFill(ctx, centerX - 2.3, headCY + 0.3, 0.25, ps, offset);
  arcFill(ctx, centerX + 3.3, headCY + 0.3, 0.25, ps, offset);

  // Rosa Wangen (auch im Wächter-Modus, für Kuschel-Faktor)
  ctx.fillStyle = '#FFB6C188';
  arcFill(ctx, centerX - 4.7, headCY + 2.2, 1.4, ps, offset);
  arcFill(ctx, centerX + 4.7, headCY + 2.2, 1.4, ps, offset);

  // Nase
  ctx.fillStyle = blackInk;
  ellipseFill(ctx, centerX, headCY + 2.2, 0.9, 0.7, ps, offset);

  // Freundliches Lächeln (auch der Wächter ist gemütlich!)
  ctx.strokeStyle = blackInk;
  ctx.lineWidth = ps * 0.45;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX * ps, (headCY + 2.9) * ps + offset);
  ctx.lineTo(centerX * ps, (headCY + 3.3) * ps + offset);
  ctx.moveTo((centerX - 1.2) * ps, (headCY + 3.4) * ps + offset);
  ctx.quadraticCurveTo(
    centerX * ps,
    (headCY + 4.6) * ps + offset,
    (centerX + 1.2) * ps,
    (headCY + 3.4) * ps + offset
  );
  ctx.stroke();
  ctx.lineCap = 'butt';

  // === Yin-Yang auf der Brust ===
  if (equippedSlot !== 'neck') {
    ctx.fillStyle = whiteFur;
    arcFill(ctx, centerX, bodyCY + 0.5, 1.9, ps, offset);
    ctx.fillStyle = blackInk;
    ctx.beginPath();
    ctx.arc(centerX * ps, (bodyCY + 0.5) * ps + offset, ps * 1.9, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.fillStyle = whiteFur;
    arcFill(ctx, centerX, bodyCY - 0.45, 0.6, ps, offset);
    ctx.fillStyle = blackInk;
    arcFill(ctx, centerX, bodyCY + 1.45, 0.6, ps, offset);
    ctx.fillStyle = blackInk;
    arcFill(ctx, centerX, bodyCY - 0.45, 0.2, ps, offset);
    ctx.fillStyle = whiteFur;
    arcFill(ctx, centerX, bodyCY + 1.45, 0.2, ps, offset);
  }

  // === Rotes Stirnband ===
  if (equippedSlot !== 'head') {
    ctx.fillStyle = '#DC143C' + bodyAlpha;
    ctx.fillRect(
      (centerX - headR + 1) * ps,
      (headCY - 1.8) * ps + offset,
      ps * (headR * 2 - 2),
      ps * 0.9
    );
    ctx.fillStyle = '#FFD700' + bodyAlpha;
    ctx.fillRect((centerX - 0.5) * ps, (headCY - 1.6) * ps + offset, ps, ps * 0.25);
    ctx.fillRect((centerX - 0.8) * ps, (headCY - 1.3) * ps + offset, ps * 1.6, ps * 0.25);
    ctx.fillRect((centerX - 0.4) * ps, (headCY - 1) * ps + offset, ps * 0.8, ps * 0.25);
    ctx.fillStyle = '#DC143C' + bodyAlpha;
    ctx.fillRect((centerX - headR) * ps, (headCY - 1.8) * ps + offset, ps * 1.3, ps * 1.7);
    ctx.fillStyle = '#B0102C' + bodyAlpha;
    ctx.fillRect((centerX - headR) * ps, (headCY - 0.1) * ps + offset, ps * 0.6, ps * 1.5);
    ctx.fillRect((centerX - headR + 0.7) * ps, (headCY - 0.1) * ps + offset, ps * 0.6, ps * 1.5);
  }

  // Qi-Flammen um die Fäuste
  if (animated) {
    const fistFlame = 0.35 + Math.sin(frame * 0.07 * animationSpeed) * 0.25;
    ctx.fillStyle = `rgba(144, 238, 144, ${fistFlame})`;
    arcFill(ctx, centerX - bodyR * 0.9 - 0.5, bodyCY + 0.5, 1, ps, offset);
    arcFill(ctx, centerX + bodyR * 0.9 + 0.5, bodyCY + 0.5, 1, ps, offset);
  }

  // === CHAMPION (Lv60+) ===
  if (isChampion) {
    if (animated) {
      const auraPhase = frame * 0.03 * animationSpeed;
      const auraAlpha = 0.1 + Math.sin(auraPhase) * 0.06;
      ctx.fillStyle = `rgba(144, 238, 144, ${auraAlpha})`;
      ctx.beginPath();
      ctx.ellipse(centerX * ps, (centerY + 3) * ps + offset, 9 * ps, 11 * ps, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === LEGENDE (Lv75+) ===
  if (isLegend) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 5;
    ctx.fillStyle = '#FFD700DD';
    arcFill(ctx, centerX - 2.7, headCY + 0.3, 1, ps, offset);
    arcFill(ctx, centerX + 2.9, headCY + 0.3, 1, ps, offset);
    ctx.shadowBlur = 0;

    const haloY = headCY - headR - 4;
    ctx.fillStyle = '#FFFFFFBB';
    arcFill(ctx, centerX, haloY, 2.5, ps, offset);
    ctx.fillStyle = blackInk;
    ctx.beginPath();
    ctx.arc(centerX * ps, haloY * ps + offset, ps * 2.5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFFBB';
    arcFill(ctx, centerX, haloY - 1.25, 0.7, ps, offset);
    ctx.fillStyle = blackInk;
    arcFill(ctx, centerX, haloY + 1.25, 0.7, ps, offset);

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 6;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.arc(centerX * ps, haloY * ps + offset, ps * 2.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // === MYTHISCH (Lv100) ===
  if (isMythical) {
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = ps * 12;
    ctx.strokeStyle = '#FFFFFF33';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY + 3) * ps + offset, 10 * ps, 12 * ps, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (animated) {
      const dragonPhase = frame * 0.04 * animationSpeed;
      for (let i = 0; i < 8; i++) {
        const angle = dragonPhase + i * ((Math.PI * 2) / 8);
        const dx = centerX * ps + Math.cos(angle) * ps * 10;
        const dy = (centerY + 3) * ps + offset + Math.sin(angle) * ps * 8;
        const dAlpha = 0.3 + Math.sin(dragonPhase * 2 + i) * 0.2;
        ctx.fillStyle = `rgba(144, 238, 144, ${dAlpha})`;
        ctx.fillRect(dx - ps * 0.4, dy - ps * 0.4, ps * 0.8, ps * 0.8);

        for (let t = 1; t <= 3; t++) {
          const tAngle = angle - t * 0.15;
          ctx.fillStyle = `rgba(144, 238, 144, ${dAlpha * (0.3 / t)})`;
          ctx.fillRect(
            centerX * ps + Math.cos(tAngle) * ps * 10 - ps * 0.3,
            (centerY + 3) * ps + offset + Math.sin(tAngle) * ps * 8 - ps * 0.3,
            ps * 0.6,
            ps * 0.6
          );
        }
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = ps * 0.5;
    ctx.beginPath();
    ctx.ellipse(
      centerX * ps,
      (headCY - headR - 5) * ps + offset,
      ps * 4,
      ps * 1.2,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.strokeStyle = 'rgba(144, 238, 144, 0.4)';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.ellipse(
      centerX * ps,
      (headCY - headR - 6.5) * ps + offset,
      ps * 5,
      ps * 1.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
}
