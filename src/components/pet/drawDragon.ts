import type { AccessorySlot } from '../../types/pet.types';

export const drawDragon = (
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

  // === STUFE 8+ (Lv50): WYVERN-FORM ===
  if (level >= 50) {
    drawWyvern(
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

  // === STUFEN 1-7: NORMALER DRACHE (Lv1-49) ===

  // Kopf
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 4) * ps, (centerY - 5) * ps + offset, ps * 8, ps * 5);
  ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 10, ps * 3);

  // Schnauze
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 6) * ps, (centerY - 2) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX - 7) * ps, (centerY - 1) * ps + offset, ps * 2, ps);

  // Hörner
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 3) * ps, (centerY - 6) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX - 4) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX - 5) * ps, (centerY - 8) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 3) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 4) * ps, (centerY - 8) * ps + offset, ps, ps);

  // Nackenstacheln
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 1) * ps, (centerY - 5) * ps + offset, ps, ps);
  ctx.fillRect(centerX * ps, (centerY - 6) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 5) * ps + offset, ps, ps);

  // Körper (Schuppenmuster)
  for (let y = 0; y < 10; y++) {
    const width = 8 - Math.abs(y - 5) * 0.5;
    ctx.fillStyle = y % 2 === 0 ? color : dark;
    ctx.fillRect((centerX - width / 2) * ps, (centerY + y) * ps + offset, ps * width, ps);
  }

  // Bauch
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);
  ctx.strokeStyle = color;
  ctx.lineWidth = ps * 0.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((centerX - 2) * ps, (centerY + 3 + i * 1.5) * ps + offset);
    ctx.lineTo((centerX + 2) * ps, (centerY + 3 + i * 1.5) * ps + offset);
    ctx.stroke();
  }

  // Flügel
  const wingFlap = animated ? Math.sin(frame * 0.1 * animationSpeed) * 2 : 0;
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
  ctx.fillRect((centerX - 7 - wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
  ctx.fillStyle = color + '88';
  ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 2 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
  ctx.fillRect((centerX + 4 + wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX + 7 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
  ctx.fillStyle = color + '88';
  ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);

  // Beine
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
  ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 3.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX - 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 0.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);

  // Schwanz
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 3) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 2);
  ctx.fillRect((centerX + 6) * ps, (centerY + 5) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 8) * ps, (centerY + 4) * ps + offset, ps * 2, ps * 2);
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 4) * ps, (centerY + 5) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 6) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 8) * ps, (centerY + 3) * ps + offset, ps, ps * 2);
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 9) * ps, (centerY + 3) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 10) * ps, (centerY + 2) * ps + offset, ps, ps * 3);

  // Augen
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 3) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 3) * ps + offset, ps * 0.3, ps * 2);
  ctx.fillRect((centerX + 1.7) * ps, (centerY - 3) * ps + offset, ps * 0.3, ps * 2);
  if (level >= 5) {
    ctx.fillStyle = '#FF0000';
    ctx.fillRect((centerX - 2.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 1.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
  }

  // Nasenlöcher
  ctx.fillStyle = '#333';
  ctx.fillRect((centerX - 5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);
  ctx.fillRect((centerX - 4) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);

  // Feueratem
  if (level >= 5 && animated && Math.random() > 0.3) {
    const fireSize = 1 + (level - 3) * 0.15;
    const fireColor =
      level >= 20 ? '#00FFFF' : level >= 15 ? '#9400FF' : level >= 10 ? '#FF1493' : '#FF4500';
    const innerColor =
      level >= 20 ? '#FFFFFF' : level >= 15 ? '#FF00FF' : level >= 10 ? '#FFB6C1' : '#FFD700';

    ctx.fillStyle = fireColor;
    ctx.fillRect(
      (centerX - 6 * fireSize) * ps,
      centerY * ps + offset,
      ps * 2 * fireSize,
      ps * 1.5 * fireSize
    );
    ctx.fillRect(
      (centerX - 8 * fireSize) * ps,
      (centerY + 0.5) * ps + offset,
      ps * 2 * fireSize,
      ps * fireSize
    );
    ctx.fillStyle = innerColor;
    ctx.fillRect(
      (centerX - 7 * fireSize) * ps,
      (centerY + 0.3) * ps + offset,
      ps * 1.5 * fireSize,
      ps * 0.8
    );

    if (level >= 10) {
      ctx.fillStyle = fireColor;
      ctx.fillRect(
        (centerX - 9 * fireSize) * ps,
        (centerY - 0.5) * ps + offset,
        ps * fireSize,
        ps * 0.8
      );
      ctx.fillRect(
        (centerX - 10 * fireSize) * ps,
        (centerY + 1) * ps + offset,
        ps * fireSize * 0.8,
        ps * 0.5
      );
    }

    if (level >= 20) {
      ctx.fillStyle = fireColor + '44';
      ctx.fillRect((centerX - 11) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 3);
    }
  }

  // Stufe 3 (Lv5+): Größere Flügel
  if (level >= 5) {
    const wingFlap5 = animated ? Math.sin(frame * 0.1 * animationSpeed) * 1.5 : 0;
    ctx.fillStyle = dark + 'AA';
    ctx.fillRect((centerX - 6 - wingFlap5) * ps, centerY * ps + offset, ps * 2, ps * 6);
    ctx.fillRect((centerX + 4 + wingFlap5) * ps, centerY * ps + offset, ps * 2, ps * 6);
  }

  // Stufe 4 (Lv10+): Drachenrüstung — nur wenn kein Neck-Accessory equipped
  if (level >= 10 && equippedSlot !== 'neck') {
    ctx.fillStyle = '#808080';
    ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps * 3);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 2.5) * ps + offset, ps * 5, ps * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((centerX - 0.5) * ps, (centerY + 3) * ps + offset, ps, ps * 0.5);
  }

  // Stufe 4 (Lv15+): Kristallhörner
  if (level >= 15) {
    ctx.fillStyle = '#00CED1';
    ctx.fillRect((centerX - 5) * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 4) * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    ctx.fillStyle = '#E0FFFF';
    ctx.fillRect((centerX - 4.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.3, ps * 0.5);
    ctx.fillRect((centerX + 4.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.3, ps * 0.5);

    const shimmerPhase = animated ? frame * 0.05 * animationSpeed : 0;
    for (let i = 0; i < 5; i++) {
      const shimmerAlpha = 0.2 + Math.sin(shimmerPhase + i * 0.8) * 0.2;
      ctx.fillStyle = `rgba(0, 206, 209, ${shimmerAlpha})`;
      ctx.fillRect(
        (centerX - 1 + i * 0.3) * ps,
        (centerY - 5 + i * 0.8) * ps + offset,
        ps * 0.5,
        ps * 0.5
      );
    }
  }

  // Stufe 5 (Lv20+): Runen + zweites Hornpaar + drittes Auge
  if (level >= 20) {
    ctx.fillStyle = '#00FFFF88';
    ctx.fillRect((centerX - 2) * ps, (centerY + 2.8) * ps + offset, ps * 0.3, ps * 1.5);
    ctx.fillRect((centerX - 2.3) * ps, (centerY + 3.2) * ps + offset, ps * 1, ps * 0.3);
    ctx.fillRect((centerX + 1.7) * ps, (centerY + 2.8) * ps + offset, ps * 0.3, ps * 1.5);
    ctx.fillRect((centerX + 1.3) * ps, (centerY + 3.2) * ps + offset, ps * 1, ps * 0.3);

    ctx.fillStyle = '#B0C4DE';
    ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps * 0.6, ps * 1.5);
    ctx.fillRect((centerX + 1.4) * ps, (centerY - 7) * ps + offset, ps * 0.6, ps * 1.5);

    // Kosmisches Feuer-Aura
    if (animated) {
      const cosmicPhase = frame * 0.03 * animationSpeed;
      const wf25 = Math.sin(frame * 0.1 * animationSpeed) * 2;
      ctx.fillStyle = `rgba(0, 255, 255, ${0.15 + Math.sin(cosmicPhase) * 0.1})`;
      ctx.fillRect((centerX - 10 - wf25) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 7);
      ctx.fillRect((centerX + 8 + wf25) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 7);
    }

    // Drittes Auge
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = ps * 3;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // === STUFE 6 (Lv30-39): VETERAN ===
  if (level >= 30) {
    // Kampfnarben auf Schuppen
    ctx.strokeStyle = light + '88';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.moveTo((centerX - 3) * ps, (centerY + 3) * ps + offset);
    ctx.lineTo((centerX - 1) * ps, (centerY + 5) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX + 2) * ps, (centerY + 4) * ps + offset);
    ctx.lineTo((centerX + 3.5) * ps, (centerY + 6) * ps + offset);
    ctx.stroke();

    // Verstärkte Schuppen (dickere Ränder)
    ctx.fillStyle = dark + 'AA';
    for (let y = 0; y < 8; y += 2) {
      ctx.fillRect((centerX - 3.5) * ps, (centerY + 1 + y) * ps + offset, ps * 7, ps * 0.3);
    }

    // Stacheln entlang des Rückens (mehr)
    ctx.fillStyle = light;
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(
        (centerX + i * 0.8) * ps,
        (centerY - 6 - Math.abs(i) * 0.3) * ps + offset,
        ps * 0.5,
        ps
      );
    }
  }

  // === STUFE 7 (Lv40-49): ELITE ===
  if (level >= 40) {
    // Rüstungsplatten auf Schultern
    ctx.fillStyle = '#808080CC';
    ctx.fillRect((centerX - 5) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 3);
    ctx.fillRect((centerX + 3) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 3);
    // Gold-Verzierung
    ctx.fillStyle = '#FFD70088';
    ctx.fillRect((centerX - 4.5) * ps, (centerY + 1.5) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 1.5) * ps + offset, ps, ps * 2);

    // Leuchtende Schwanzspitze
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = '#00FFFF88';
    ctx.fillRect((centerX + 9) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 3);
    ctx.shadowBlur = 0;
  }
};

/**
 * Zeichnet die Drachen-Flügel als Overlay ÜBER Accessories.
 * Wird nach drawAccessory aufgerufen, damit Flügel vor dem Schal/etc erscheinen.
 */
export const drawDragonWingsOverlay = (
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  dark: string,
  offset: number,
  animated: boolean,
  frame: number,
  animationSpeed: number
): void => {
  const centerX = 16;
  const centerY = 16;

  if (level >= 50) {
    // Wyvern-Flügel
    const bodyAlpha = level >= 100 ? 'BB' : '';
    const isLegend = level >= 75;
    const wingSpan = isLegend ? 4 : 3;
    const wingFlap = animated ? Math.sin(frame * 0.1 * animationSpeed) * 3 : 0;
    const hornColor = isLegend ? '#00FFFF' : '#FFD700';

    // Linker Flügel
    ctx.fillStyle = dark + bodyAlpha;
    ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 2) * ps + offset, ps * 3, ps * 10);
    ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 8);
    ctx.fillRect(
      (centerX - 10 - wingFlap - wingSpan) * ps,
      centerY * ps + offset,
      ps * (3 + wingSpan),
      ps * 6
    );
    ctx.fillStyle = color + '88' + (bodyAlpha ? '88' : '');
    ctx.fillRect(
      (centerX - 9 - wingFlap - wingSpan) * ps,
      (centerY + 1) * ps + offset,
      ps * (5 + wingSpan),
      ps * 5
    );
    ctx.fillStyle = hornColor;
    ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 3) * ps + offset, ps * 0.5, ps);

    // Rechter Flügel
    ctx.fillStyle = dark + bodyAlpha;
    ctx.fillRect((centerX + 2 + wingFlap) * ps, (centerY - 2) * ps + offset, ps * 3, ps * 10);
    ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 8);
    ctx.fillRect((centerX + 7 + wingFlap) * ps, centerY * ps + offset, ps * (3 + wingSpan), ps * 6);
    ctx.fillStyle = color + '88' + (bodyAlpha ? '88' : '');
    ctx.fillRect(
      (centerX + 5 + wingFlap) * ps,
      (centerY + 1) * ps + offset,
      ps * (5 + wingSpan),
      ps * 5
    );
    ctx.fillStyle = hornColor;
    ctx.fillRect((centerX + 4.5 + wingFlap) * ps, (centerY - 3) * ps + offset, ps * 0.5, ps);
  } else {
    // Normale Drachen-Flügel
    const wingFlap = animated ? Math.sin(frame * 0.1 * animationSpeed) * 2 : 0;
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
    ctx.fillRect((centerX - 7 - wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 6);
    ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillStyle = color + '88';
    ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);
    ctx.fillStyle = dark;
    ctx.fillRect((centerX + 2 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
    ctx.fillRect((centerX + 4 + wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 6);
    ctx.fillRect((centerX + 7 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillStyle = color + '88';
    ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);

    // Stufe 3 (Lv5+): Größere Flügel
    if (level >= 5) {
      const wingFlap5 = animated ? Math.sin(frame * 0.1 * animationSpeed) * 1.5 : 0;
      ctx.fillStyle = dark + 'AA';
      ctx.fillRect((centerX - 6 - wingFlap5) * ps, centerY * ps + offset, ps * 2, ps * 6);
      ctx.fillRect((centerX + 4 + wingFlap5) * ps, centerY * ps + offset, ps * 2, ps * 6);
    }
  }
};

// === WYVERN-FORM (Level 50+) ===
function drawWyvern(
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

  // Wyvern hat keinen Vorderbeinkörper — Flügel SIND die Arme
  const wingFlap = animated ? Math.sin(frame * 0.1 * animationSpeed) * 3 : 0;

  // Schlanker, aerodynamischer Kopf
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 4) * ps, (centerY - 5) * ps + offset, ps * 8, ps * 5);
  ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 10, ps * 3);
  // Lange spitze Schnauze
  ctx.fillStyle = dark + bodyAlpha;
  ctx.fillRect((centerX - 7) * ps, (centerY - 2) * ps + offset, ps * 4, ps * 2);
  ctx.fillRect((centerX - 8) * ps, (centerY - 1) * ps + offset, ps * 2, ps);

  // Massive Hörner (Wyvern-typisch, nach hinten gebogen)
  const hornColor = isLegend ? '#00FFFF' : '#FFD700';
  ctx.fillStyle = hornColor;
  // Links
  ctx.fillRect((centerX - 3) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX - 4) * ps, (centerY - 9) * ps + offset, ps, ps * 3);
  ctx.fillRect((centerX - 5) * ps, (centerY - 10) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX - 6) * ps, (centerY - 11) * ps + offset, ps, ps);
  // Rechts
  ctx.fillRect((centerX + 2) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 3) * ps, (centerY - 9) * ps + offset, ps, ps * 3);
  ctx.fillRect((centerX + 4) * ps, (centerY - 10) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 5) * ps, (centerY - 11) * ps + offset, ps, ps);

  // Nackenstacheln (größer)
  ctx.fillStyle = light + bodyAlpha;
  for (let i = -2; i <= 2; i++) {
    const h = 2 - Math.abs(i) * 0.3;
    ctx.fillRect((centerX + i * 0.8) * ps, (centerY - 6 - h) * ps + offset, ps * 0.6, ps * h);
  }

  // Schlanker Körper (Wyvern = weniger bulky als Drache)
  const bodyWidth = isLegend ? 9 : isChampion ? 8.5 : 8;
  for (let y = 0; y < 10; y++) {
    const width = bodyWidth - Math.abs(y - 5) * 0.6;
    ctx.fillStyle = (y % 2 === 0 ? color : dark) + bodyAlpha;
    ctx.fillRect((centerX - width / 2) * ps, (centerY + y) * ps + offset, ps * width, ps);
  }

  // Bauch
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);

  // MASSIVE Flügel (Wyvern-Hauptmerkmal — Flügel = Arme)
  const wingSpan = isLegend ? 4 : 3;
  // Linker Flügel (Arm-Flügel)
  ctx.fillStyle = dark + bodyAlpha;
  ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 2) * ps + offset, ps * 3, ps * 10);
  ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 8);
  ctx.fillRect(
    (centerX - 10 - wingFlap - wingSpan) * ps,
    centerY * ps + offset,
    ps * (3 + wingSpan),
    ps * 6
  );
  // Flügelmembran
  ctx.fillStyle = color + '88' + (bodyAlpha ? '88' : '');
  ctx.fillRect(
    (centerX - 9 - wingFlap - wingSpan) * ps,
    (centerY + 1) * ps + offset,
    ps * (5 + wingSpan),
    ps * 5
  );
  // Flügelkralle
  ctx.fillStyle = hornColor;
  ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 3) * ps + offset, ps * 0.5, ps);

  // Rechter Flügel
  ctx.fillStyle = dark + bodyAlpha;
  ctx.fillRect((centerX + 2 + wingFlap) * ps, (centerY - 2) * ps + offset, ps * 3, ps * 10);
  ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 8);
  ctx.fillRect((centerX + 7 + wingFlap) * ps, centerY * ps + offset, ps * (3 + wingSpan), ps * 6);
  ctx.fillStyle = color + '88' + (bodyAlpha ? '88' : '');
  ctx.fillRect(
    (centerX + 5 + wingFlap) * ps,
    (centerY + 1) * ps + offset,
    ps * (5 + wingSpan),
    ps * 5
  );
  ctx.fillStyle = hornColor;
  ctx.fillRect((centerX + 4.5 + wingFlap) * ps, (centerY - 3) * ps + offset, ps * 0.5, ps);

  // Hinterbeine (kräftig, da Wyvern auf Hinterbeinen steht)
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2.5, ps * 5);
  ctx.fillRect((centerX + 0.5) * ps, (centerY + 8) * ps + offset, ps * 2.5, ps * 5);
  // Große Krallen
  ctx.fillStyle = hornColor;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect((centerX - 3.5 + i) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 1);
    ctx.fillRect((centerX + 0.5 + i) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 1);
  }

  // Langer Schwanz mit Stacheln
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX + 3) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 2);
  ctx.fillRect((centerX + 6) * ps, (centerY + 5) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 8) * ps, (centerY + 4) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 10) * ps, (centerY + 3) * ps + offset, ps * 2, ps * 2);
  // Stacheln am Schwanz
  ctx.fillStyle = dark + bodyAlpha;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect((centerX + 4 + i * 2) * ps, (centerY + 4 - i * 0.8) * ps + offset, ps * 0.5, ps);
  }
  // Pfeilspitze
  ctx.fillStyle = hornColor;
  ctx.fillRect((centerX + 11) * ps, (centerY + 2) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 12) * ps, (centerY + 1) * ps + offset, ps, ps * 3);

  // Reptilien-Augen (größer, bedrohlicher)
  const eyeColor = isLegend ? '#00FFFF' : isChampion ? '#FF0000' : '#FFD700';
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 4) * ps + offset, ps * 2.5, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 4) * ps + offset, ps * 2.5, ps * 2);
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 4) * ps + offset, ps * 0.4, ps * 2);
  ctx.fillRect((centerX + 1.6) * ps, (centerY - 4) * ps + offset, ps * 0.4, ps * 2);
  // Augen-Glühen
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = ps * (isLegend ? 5 : 3);
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 4) * ps + offset, ps * 2.5, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 4) * ps + offset, ps * 2.5, ps * 2);
  ctx.shadowBlur = 0;

  // Nasenlöcher mit Rauch
  ctx.fillStyle = '#333';
  ctx.fillRect((centerX - 6) * ps, (centerY - 1.5) * ps + offset, ps * 0.6, ps * 0.6);
  ctx.fillRect((centerX - 5) * ps, (centerY - 1.5) * ps + offset, ps * 0.6, ps * 0.6);

  // Feueratem (mächtiger als normaler Drache)
  if (animated && Math.random() > 0.25) {
    const fireColor = isLegend ? '#00FFFF' : isChampion ? '#9400FF' : '#FF4500';
    const innerColor = isLegend ? '#FFFFFF' : isChampion ? '#FF00FF' : '#FFD700';
    const fireSize = isLegend ? 2.5 : isChampion ? 2 : 1.5;

    ctx.fillStyle = fireColor;
    ctx.fillRect(
      (centerX - 8 * fireSize) * ps,
      (centerY - 0.5) * ps + offset,
      ps * 3 * fireSize,
      ps * 2 * fireSize
    );
    ctx.fillRect(
      (centerX - 10 * fireSize) * ps,
      centerY * ps + offset,
      ps * 2 * fireSize,
      ps * 1.5 * fireSize
    );
    ctx.fillStyle = innerColor;
    ctx.fillRect(
      (centerX - 9 * fireSize) * ps,
      (centerY + 0.2) * ps + offset,
      ps * 2 * fireSize,
      ps
    );

    if (isLegend) {
      ctx.fillStyle = fireColor + '44';
      ctx.fillRect((centerX - 14) * ps, (centerY - 2) * ps + offset, ps * 5, ps * 5);
    }
  }

  // Rüstung (Brustplatte) — nur wenn kein Neck-Accessory equipped
  if (equippedSlot !== 'neck') {
    ctx.fillStyle = '#808080' + bodyAlpha;
    ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 6, ps * 3);
    ctx.fillStyle = '#C0C0C0' + bodyAlpha;
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 1.5) * ps + offset, ps * 5, ps * 2);
    ctx.fillStyle = hornColor;
    ctx.fillRect((centerX - 0.3) * ps, (centerY + 2) * ps + offset, ps * 0.6, ps);
  }

  // === CHAMPION (Lv60+) ===
  if (isChampion) {
    // Doppelte Flügelmembran-Schicht
    ctx.fillStyle = dark + '44';
    ctx.fillRect((centerX - 11 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 3, ps * 4);
    ctx.fillRect((centerX + 8 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 3, ps * 4);

    // Leuchtende Runen auf Rüstung
    ctx.fillStyle = eyeColor + '66';
    ctx.fillRect((centerX - 2) * ps, (centerY + 1.5) * ps + offset, ps * 0.3, ps * 2);
    ctx.fillRect((centerX + 1.7) * ps, (centerY + 1.5) * ps + offset, ps * 0.3, ps * 2);
    ctx.fillRect((centerX - 1.5) * ps, (centerY + 2.5) * ps + offset, ps * 3, ps * 0.3);

    // Zweites Schwanzstachel-Paar
    ctx.fillStyle = hornColor;
    ctx.fillRect((centerX + 11) * ps, (centerY + 1) * ps + offset, ps, ps);
    ctx.fillRect((centerX + 12) * ps, (centerY + 0) * ps + offset, ps, ps);
  }

  // === LEGENDE (Lv75+) ===
  if (isLegend) {
    // Kristallhörner leuchten
    ctx.shadowColor = hornColor;
    ctx.shadowBlur = ps * 4;
    ctx.fillStyle = hornColor;
    ctx.fillRect((centerX - 6) * ps, (centerY - 11) * ps + offset, ps, ps);
    ctx.fillRect((centerX + 5) * ps, (centerY - 11) * ps + offset, ps, ps);
    ctx.shadowBlur = 0;

    // Drittes Auge
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5.5) * ps + offset, ps * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = ps * 4;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5.5) * ps + offset, ps * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Schuppenleuchten
    if (animated) {
      const shimmer = frame * 0.04 * animationSpeed;
      for (let i = 0; i < 8; i++) {
        const a = 0.15 + Math.sin(shimmer + i * 0.6) * 0.15;
        ctx.fillStyle = `rgba(0, 255, 255, ${a})`;
        ctx.fillRect(
          (centerX - 3 + (i % 3) * 2) * ps,
          (centerY + 1 + Math.floor(i / 3) * 2) * ps + offset,
          ps * 0.5,
          ps * 0.5
        );
      }
    }
  }

  // === MYTHISCH (Lv100) ===
  if (isMythical) {
    // Ätherischer Wyvern — ganzer Körper schimmert
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = ps * 10;
    ctx.strokeStyle = '#00FFFF33';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(
      centerX * ps,
      (centerY + 4) * ps + offset,
      (bodyWidth / 2 + 4) * ps,
      8 * ps,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Geisterhafte Doppelgänger-Silhouette
    ctx.fillStyle = color + '1A';
    ctx.fillRect((centerX - 5) * ps, (centerY - 6) * ps + offset, ps * 10, ps * 7);

    // Kosmisches Feuer permanent
    if (animated) {
      const cosmicPhase = frame * 0.03 * animationSpeed;
      ctx.fillStyle = `rgba(0, 255, 255, ${0.12 + Math.sin(cosmicPhase) * 0.08})`;
      ctx.fillRect((centerX - 12 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 8);
      ctx.fillRect((centerX + 9 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 8);
    }

    // Leuchtende Augen (weiß-göttlich)
    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = ps * 6;
    ctx.fillStyle = '#FFFFFFDD';
    ctx.fillRect((centerX - 3.5) * ps, (centerY - 4) * ps + offset, ps * 2.5, ps * 2);
    ctx.fillRect((centerX + 1) * ps, (centerY - 4) * ps + offset, ps * 2.5, ps * 2);
    ctx.shadowBlur = 0;
  }
}
