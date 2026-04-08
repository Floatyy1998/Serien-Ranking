import type { Pet, AccessorySlot } from '../../types/pet.types';

export const drawDog = (
  ctx: CanvasRenderingContext2D,
  pet: Pet,
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

  // === STUFE 8+ (Lv50): WOLF-FORM ===
  if (level >= 50) {
    drawWolf(
      ctx,
      pet,
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

  // === STUFEN 1-7: NORMALER HUND (Lv1-49) ===
  const headSize =
    level >= 20 ? 1.35 : level >= 15 ? 1.3 : level >= 10 ? 1.2 : level >= 5 ? 1.1 : 1;

  // Kopf
  ctx.fillStyle = color;
  ctx.fillRect(
    (centerX - 4 * headSize) * ps,
    (centerY - 3) * ps + offset,
    ps * 8 * headSize,
    ps * 6
  );
  ctx.fillRect((centerX - 3 * headSize) * ps, (centerY - 4) * ps + offset, ps * 6 * headSize, ps);

  // Schnauze
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 1) * ps + offset, ps * 4, ps * 3);
  ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps * 2);

  // Ohren Evolution
  ctx.fillStyle = dark;
  if (level < 10) {
    const hangAmount = level >= 5 ? 4 : 5;
    ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 2, ps * hangAmount);
    ctx.fillRect((centerX - 6) * ps, (centerY - 2) * ps + offset, ps * 2, ps * (hangAmount - 1));
    ctx.fillRect((centerX + 3) * ps, (centerY - 3) * ps + offset, ps * 2, ps * hangAmount);
    ctx.fillRect((centerX + 4) * ps, (centerY - 2) * ps + offset, ps * 2, ps * (hangAmount - 1));
  } else {
    // Aufrechte Ohren ab Lv10
    ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 2) * ps, (centerY - 4) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX + 4) * ps, (centerY - 3) * ps + offset, ps, ps * 2);
  }

  // Körper
  const bodyWidth = level >= 20 ? 11 : level >= 15 ? 10 : level >= 10 ? 9 : level >= 5 ? 8.5 : 8;
  const bodyHeight = level >= 20 ? 10 : level >= 15 ? 9 : level >= 10 ? 8 : level >= 5 ? 7.5 : 7;
  ctx.fillStyle = color;
  ctx.fillRect(
    (centerX - bodyWidth / 2) * ps,
    (centerY + 4) * ps + offset,
    ps * bodyWidth,
    ps * bodyHeight
  );
  ctx.fillRect((centerX - 3) * ps, (centerY + 4 + bodyHeight) * ps + offset, ps * 6, ps);

  // Muskeln ab Lv10
  if (level >= 10) {
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - 1) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 0.2);
  }

  // Bauch
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 3) * ps, (centerY + 6) * ps + offset, ps * 6, ps * 4);

  // Beine
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 4) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 4);
  ctx.fillRect((centerX + 2) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 4);
  ctx.fillRect((centerX - 4) * ps, (centerY + 12) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY + 12) * ps + offset, ps * 2, ps * 2);

  // Pfoten
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 4) * ps, (centerY + 13) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY + 13) * ps + offset, ps * 2, ps);

  // Schwanz (wedelt)
  const tailWag = animated ? Math.sin(frame * 0.15 * animationSpeed) * 2 : 0;
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 4 + tailWag) * ps, (centerY + 6) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 6 + tailWag) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 7 + tailWag) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

  // Augen
  const eyeColor =
    level >= 40
      ? '#FF8C00'
      : level >= 30
        ? '#B8860B'
        : level >= 20
          ? '#DAA520'
          : level >= 10
            ? '#CD853F'
            : '#8B4513';
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps * 2, ps * 2);
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 1) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps, ps);
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 2.5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);

  // Nase
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 1) * ps, (centerY + 2.5) * ps + offset, ps * 2, ps * 1.5);
  ctx.fillStyle = '#333';
  ctx.fillRect((centerX - 0.7) * ps, (centerY + 3) * ps + offset, ps * 0.5, ps * 0.5);
  ctx.fillRect((centerX + 0.2) * ps, (centerY + 3) * ps + offset, ps * 0.5, ps * 0.5);

  // Mund
  ctx.strokeStyle = dark;
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo(centerX * ps, (centerY + 4) * ps + offset);
  ctx.lineTo((centerX - 1) * ps, (centerY + 4.5) * ps + offset);
  ctx.moveTo(centerX * ps, (centerY + 4) * ps + offset);
  ctx.lineTo((centerX + 1) * ps, (centerY + 4.5) * ps + offset);
  ctx.stroke();

  // Zunge
  if (pet.happiness > 60) {
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect((centerX - 0.5) * ps, (centerY + 4.5) * ps + offset, ps * 1.5, ps * 2);
    ctx.fillRect(centerX * ps, (centerY + 6.5) * ps + offset, ps * 0.8, ps * 0.5);
  }

  // Stufe 3 (Lv5+): Fell-Flecken
  if (level >= 5) {
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - 2) * ps, (centerY + 6) * ps + offset, ps * 1.5, ps * 1.5);
    ctx.fillRect((centerX + 1) * ps, (centerY + 7) * ps + offset, ps * 2, ps);
    ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps, ps * 1.5);
  }

  // Stufe 3 (Lv5+): Reißzähne
  if (level >= 5) {
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX - 2) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 0.6);
    ctx.fillRect((centerX + 1.6) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 0.6);
  }

  // Stufe 4 (Lv15+): Wolf-Mähne
  if (level >= 15) {
    ctx.fillStyle = dark;
    for (let i = -2; i <= 2; i++) {
      const height = 2.5 - Math.abs(i) * 0.3;
      ctx.fillRect((centerX + i * 1.5) * ps, (centerY + 3) * ps + offset, ps, ps * height);
    }
  }

  // Stufe 4 (Lv15+): Leuchtende Pfoten
  if (level >= 15) {
    const pawGlow = animated ? 0.3 + Math.sin(frame * 0.04 * animationSpeed) * 0.2 : 0.3;
    ctx.fillStyle = `rgba(218, 165, 32, ${pawGlow})`;
    ctx.beginPath();
    ctx.arc((centerX - 3) * ps, (centerY + 14.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
    ctx.arc((centerX + 3) * ps, (centerY + 14.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Größere Mähne
    ctx.fillStyle = dark;
    for (let i = -3; i <= 3; i++) {
      const height = 3.5 - Math.abs(i) * 0.4;
      ctx.fillRect((centerX + i * 1.2) * ps, (centerY + 2.5) * ps + offset, ps * 0.8, ps * height);
    }
  }

  // Stufe 5 (Lv20+): Stachelhalsband + leuchtende Augen
  if (level >= 20) {
    if (equippedSlot !== 'neck') {
      ctx.fillStyle = '#2C2C2C';
      ctx.fillRect((centerX - 4) * ps, (centerY + 4) * ps + offset, ps * 8, ps * 1.2);
      ctx.fillStyle = '#C0C0C0';
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect((centerX + i * 1.3) * ps, (centerY + 3.8) * ps + offset, ps * 0.4, ps * 0.8);
      }
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY + 6) * ps + offset, ps * 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Narbe
    ctx.strokeStyle = `rgba(218, 165, 32, 0.5)`;
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 2.5) * ps + offset);
    ctx.lineTo((centerX - 2) * ps, centerY * ps + offset);
    ctx.stroke();

    // Leuchtende Augen
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 3;
    ctx.fillStyle = eyeColor;
    ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps * 2);
    ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps * 2, ps * 2);
    ctx.shadowBlur = 0;

    // Fenrir-Ketten
    ctx.fillStyle = '#808080';
    ctx.fillRect((centerX - 5) * ps, (centerY + 11) * ps + offset, ps * 1.5, ps * 0.5);
    ctx.fillRect((centerX - 5.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 11) * ps + offset, ps * 1.5, ps * 0.5);
    ctx.fillRect((centerX + 4.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);

    // Eisatem
    if (animated && Math.random() > 0.4) {
      ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
      ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps);
      ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
      ctx.fillRect((centerX - 7) * ps, (centerY + 1.5) * ps + offset, ps * 2, ps * 0.8);
    }
  }

  // === STUFE 6 (Lv30-39): VETERAN ===
  if (level >= 30) {
    // Kampfnarben
    ctx.strokeStyle = light + 'AA';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.moveTo((centerX + 2) * ps, (centerY - 2) * ps + offset);
    ctx.lineTo((centerX + 4) * ps, centerY * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX - 3) * ps, (centerY + 5) * ps + offset);
    ctx.lineTo((centerX - 1) * ps, (centerY + 7) * ps + offset);
    ctx.stroke();

    // Dichteres Nackenfell
    ctx.fillStyle = dark + 'CC';
    for (let i = -4; i <= 4; i++) {
      const h = 4 - Math.abs(i) * 0.4;
      ctx.fillRect((centerX + i * 1) * ps, (centerY + 2) * ps + offset, ps * 0.8, ps * h);
    }

    // Verstärkte Beinmuskulatur
    ctx.fillStyle = dark + '44';
    ctx.fillRect((centerX - 4.5) * ps, (centerY + 10) * ps + offset, ps * 0.5, ps * 3);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 10) * ps + offset, ps * 0.5, ps * 3);
  }

  // === STUFE 7 (Lv40-49): ELITE ===
  if (level >= 40) {
    // Rüstungs-artige Fellmuster
    ctx.strokeStyle = eyeColor + '66';
    ctx.lineWidth = ps * 0.3;
    // V-Muster auf Brust
    ctx.beginPath();
    ctx.moveTo((centerX - 2) * ps, (centerY + 5) * ps + offset);
    ctx.lineTo(centerX * ps, (centerY + 8) * ps + offset);
    ctx.lineTo((centerX + 2) * ps, (centerY + 5) * ps + offset);
    ctx.stroke();

    // Schulterplatten (Fell-Verdickung)
    ctx.fillStyle = dark + 'AA';
    ctx.fillRect((centerX - 5) * ps, (centerY + 4) * ps + offset, ps * 2, ps * 3);
    ctx.fillRect((centerX + 3) * ps, (centerY + 4) * ps + offset, ps * 2, ps * 3);

    // Leuchtende Krallenspitzen
    ctx.fillStyle = eyeColor + '66';
    ctx.fillRect((centerX - 4.5) * ps, (centerY + 13) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 13) * ps + offset, ps * 0.5, ps * 0.5);
  }
};

// === WOLF-FORM (Level 50+) ===
function drawWolf(
  ctx: CanvasRenderingContext2D,
  pet: Pet,
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

  // Wolfskopf (längere Schnauze, schmaler)
  const headSize = isLegend ? 1.45 : isChampion ? 1.35 : 1.3;
  ctx.fillStyle = mainColor;
  ctx.fillRect(
    (centerX - 4 * headSize) * ps,
    (centerY - 4) * ps + offset,
    ps * 8 * headSize,
    ps * 6
  );

  // Lange Wolfsschnauze
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 6, ps * 3);
  ctx.fillRect((centerX - 4) * ps, (centerY + 2) * ps + offset, ps * 3, ps * 2);
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 2);

  // Spitze aufrechte Ohren (Wolf-typisch)
  ctx.fillStyle = dark + bodyAlpha;
  ctx.fillRect((centerX - 5) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 3);
  ctx.fillRect((centerX - 4) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX - 3) * ps, (centerY - 10) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 3);
  ctx.fillRect((centerX + 2) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 10) * ps + offset, ps, ps * 2);

  // Ohren-Inneres
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((centerX - 3) * ps, (centerY - 6) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps, ps * 2);

  // Massiver Wolfskörper
  const bodyWidth = isLegend ? 12 : isChampion ? 11 : 10;
  const bodyHeight = isLegend ? 10 : isChampion ? 9.5 : 9;
  ctx.fillStyle = mainColor;
  ctx.fillRect(
    (centerX - bodyWidth / 2) * ps,
    (centerY + 4) * ps + offset,
    ps * bodyWidth,
    ps * bodyHeight
  );

  // Mächtige Schultern
  ctx.fillRect((centerX - bodyWidth / 2 - 0.5) * ps, (centerY + 4) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + bodyWidth / 2 - 1.5) * ps, (centerY + 4) * ps + offset, ps * 2, ps * 3);

  // Bauch
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX - 3) * ps, (centerY + 6) * ps + offset, ps * 6, ps * 5);

  // Dichte Nackenmähne
  ctx.fillStyle = dark + bodyAlpha;
  for (let i = -5; i <= 5; i++) {
    const h = isLegend ? 5 - Math.abs(i) * 0.4 : 4 - Math.abs(i) * 0.35;
    ctx.fillRect((centerX + i * 0.9) * ps, (centerY + 2) * ps + offset, ps * 0.7, ps * h);
  }

  // Kräftige Beine
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 5) * ps, (centerY + 11) * ps + offset, ps * 3, ps * 4);
  ctx.fillRect((centerX + 2) * ps, (centerY + 11) * ps + offset, ps * 3, ps * 4);

  // Pfoten (groß mit Krallen)
  ctx.fillStyle = dark + bodyAlpha;
  ctx.fillRect((centerX - 5) * ps, (centerY + 14) * ps + offset, ps * 3, ps * 1.5);
  ctx.fillRect((centerX + 2) * ps, (centerY + 14) * ps + offset, ps * 3, ps * 1.5);
  // Krallen
  ctx.fillStyle = '#FFFFF0';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect((centerX - 5 + i) * ps, (centerY + 15) * ps + offset, ps * 0.4, ps * 0.6);
    ctx.fillRect((centerX + 2 + i) * ps, (centerY + 15) * ps + offset, ps * 0.4, ps * 0.6);
  }

  // Buschiger Wolfsschwanz
  const tailWag = animated ? Math.sin(frame * 0.08 * animationSpeed) * 1.5 : 0;
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX + 5 + tailWag) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 3);
  ctx.fillRect((centerX + 8 + tailWag) * ps, (centerY + 4) * ps + offset, ps * 3, ps * 4);
  ctx.fillRect((centerX + 10 + tailWag) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
  // Schwanzspitze
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX + 11 + tailWag) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);

  // Wolfs-Augen (schmal, intensiv)
  const eyeColor = isLegend ? '#FFD700' : isChampion ? '#FF8C00' : '#DAA520';
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 1.5);
  ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 1.5);
  // Pupillen
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * 0.5, ps * 1.5);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * 0.5, ps * 1.5);
  // Glanz
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 3) * ps, (centerY - 2.3) * ps + offset, ps * 0.4, ps * 0.4);
  ctx.fillRect((centerX + 2.5) * ps, (centerY - 2.3) * ps + offset, ps * 0.4, ps * 0.4);

  // Augen-Glühen
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = ps * (isLegend ? 5 : 2.5);
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 1.5);
  ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 1.5);
  ctx.shadowBlur = 0;

  // Nase (groß)
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 1.5) * ps, (centerY + 2) * ps + offset, ps * 3, ps * 1.5);

  // Reißzähne (sichtbar)
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 3.5) * ps + offset, ps * 0.6, ps * 1);
  ctx.fillRect((centerX + 1.9) * ps, (centerY + 3.5) * ps + offset, ps * 0.6, ps * 1);

  // Zunge bei hoher Happiness
  if (pet.happiness > 60) {
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect((centerX - 0.5) * ps, (centerY + 3.5) * ps + offset, ps * 1.5, ps * 1.5);
  }

  // Wolfsfell-Muster
  ctx.fillStyle = dark + '66';
  // Rückenstreifen
  ctx.fillRect((centerX - 0.3) * ps, (centerY + 4) * ps + offset, ps * 0.6, ps * 6);
  // Schulterflecken
  ctx.fillRect((centerX - 4) * ps, (centerY + 5) * ps + offset, ps * 1.5, ps * 2);
  ctx.fillRect((centerX + 2.5) * ps, (centerY + 5) * ps + offset, ps * 1.5, ps * 2);

  // Halsband (nur ohne Neck-Accessory)
  if (equippedSlot !== 'neck') {
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect((centerX - 4.5) * ps, (centerY + 4) * ps + offset, ps * 9, ps * 1.2);
    // Gebrochene Ketten
    ctx.fillStyle = '#808080';
    ctx.fillRect((centerX - 5.5) * ps, (centerY + 4.5) * ps + offset, ps * 1.5, ps * 0.5);
    ctx.fillRect((centerX + 4) * ps, (centerY + 4.5) * ps + offset, ps * 1.5, ps * 0.5);
  }

  // Eisatem
  if (animated && Math.random() > 0.35) {
    ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
    ctx.fillRect((centerX - 5) * ps, (centerY + 1) * ps + offset, ps * 2, ps);
    ctx.fillStyle = 'rgba(135, 206, 235, 0.25)';
    ctx.fillRect((centerX - 7) * ps, (centerY + 0.5) * ps + offset, ps * 2.5, ps * 0.8);
    ctx.fillStyle = 'rgba(224, 255, 255, 0.35)';
    ctx.fillRect((centerX - 6) * ps, (centerY + 1.5) * ps + offset, ps * 1.5, ps * 0.5);
  }

  // === CHAMPION (Lv60+): Extra Features ===
  if (isChampion) {
    // Breitere Schultern
    ctx.fillStyle = dark + bodyAlpha;
    ctx.fillRect((centerX - bodyWidth / 2 - 1) * ps, (centerY + 4) * ps + offset, ps * 1.5, ps * 4);
    ctx.fillRect(
      (centerX + bodyWidth / 2 - 0.5) * ps,
      (centerY + 4) * ps + offset,
      ps * 1.5,
      ps * 4
    );

    // Leuchtende Narbe
    ctx.strokeStyle = eyeColor + '88';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 3) * ps + offset);
    ctx.lineTo((centerX - 1.5) * ps, centerY * ps + offset);
    ctx.stroke();

    // Runen an den Beinen
    ctx.strokeStyle = eyeColor + '44';
    ctx.lineWidth = ps * 0.25;
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY + 12) * ps + offset);
    ctx.lineTo((centerX - 3.5) * ps, (centerY + 14) * ps + offset);
    ctx.lineTo((centerX - 4.5) * ps, (centerY + 14) * ps + offset);
    ctx.stroke();
  }

  // === LEGENDE (Lv75+) ===
  if (isLegend) {
    // Leuchtende Pfoten-Aura
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 3;
    ctx.fillStyle = eyeColor + '44';
    ctx.fillRect((centerX - 5.5) * ps, (centerY + 14) * ps + offset, ps * 4, ps * 2);
    ctx.fillRect((centerX + 1.5) * ps, (centerY + 14) * ps + offset, ps * 4, ps * 2);
    ctx.shadowBlur = 0;

    // Heiliger Wolfsheulen-Effekt (Mond-Symbol über Kopf, nur ohne Head-Accessory)
    if (equippedSlot !== 'head') {
      ctx.fillStyle = '#E0E0FF';
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY - 12) * ps + offset, ps * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.arc((centerX + 0.5) * ps, (centerY - 12) * ps + offset, ps * 0.9, 0, Math.PI * 2);
      ctx.fill();
      // Mondschein
      ctx.shadowColor = '#E0E0FF';
      ctx.shadowBlur = ps * 4;
      ctx.fillStyle = '#E0E0FF44';
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY - 12) * ps + offset, ps * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Verstärkte Nackenmähne (leuchtet)
    ctx.fillStyle = dark + (bodyAlpha || 'CC');
    for (let i = -6; i <= 6; i++) {
      const h = 6 - Math.abs(i) * 0.45;
      ctx.fillRect((centerX + i * 0.8) * ps, (centerY + 1) * ps + offset, ps * 0.6, ps * h);
    }
  }

  // === MYTHISCH (Lv100) ===
  if (isMythical) {
    // Ätherisches Glühen
    ctx.shadowColor = '#87CEEB';
    ctx.shadowBlur = ps * 8;
    ctx.strokeStyle = '#87CEEB44';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.ellipse(
      centerX * ps,
      (centerY + 6) * ps + offset,
      (bodyWidth / 2 + 3) * ps,
      (bodyHeight / 2 + 2) * ps,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Geisterhafte Silhouette
    ctx.fillStyle = color + '22';
    ctx.fillRect(
      (centerX - 4 * headSize + 1) * ps,
      (centerY - 5) * ps + offset,
      ps * 8 * headSize,
      ps * 7
    );

    // Leuchtende Augen (weiß)
    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = ps * 6;
    ctx.fillStyle = '#FFFFFFDD';
    ctx.fillRect((centerX - 3.5) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 1.5);
    ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 1.5);
    ctx.shadowBlur = 0;

    // Eisige Pfotenabdrücke auf dem Boden
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.beginPath();
    ctx.arc((centerX - 3) * ps, (centerY + 16) * ps + offset, ps * 1, 0, Math.PI * 2);
    ctx.arc((centerX + 3) * ps, (centerY + 16) * ps + offset, ps * 1, 0, Math.PI * 2);
    ctx.fill();
  }
}
