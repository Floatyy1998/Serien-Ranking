import type { Pet, AccessorySlot } from '../../types/pet.types';

export const drawCat = (
  ctx: CanvasRenderingContext2D,
  _pet: Pet,
  level: number,
  ps: number,
  color: string,
  dark: string,
  light: string,
  offset: number,
  equippedSlot?: AccessorySlot | null
): void => {
  const centerX = 16;
  const centerY = 16;

  // === STUFE 8+ (Lv50): SÄBELZAHN-FORM ===
  if (level >= 50) {
    drawSabertooth(ctx, level, ps, color, dark, light, offset, equippedSlot);
    return;
  }

  // === STUFEN 1-7: NORMALE KATZE (Lv1-49) ===

  // Evolution: Körpergröße wächst mit Level
  const headSize =
    level >= 20 ? 1.3 : level >= 15 ? 1.25 : level >= 10 ? 1.15 : level >= 5 ? 1.08 : 1;

  // Kopf
  ctx.fillStyle = color;
  ctx.fillRect(
    (centerX - 4 * headSize) * ps,
    (centerY - 4) * ps + offset,
    ps * 8 * headSize,
    ps * 6
  );
  ctx.fillRect((centerX - 3 * headSize) * ps, (centerY - 5) * ps + offset, ps * 6 * headSize, ps);
  ctx.fillRect((centerX - 3 * headSize) * ps, (centerY + 2) * ps + offset, ps * 6 * headSize, ps);

  // Ohren Evolution
  const earHeight = level >= 20 ? 3.5 : level >= 10 ? 3 : level >= 5 ? 2.5 : 2;
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX - 3) * ps, (centerY - 7) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps, ps * earHeight);
  ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 7) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 8) * ps + offset, ps, ps * earHeight);

  // Ohrenbüschel ab Lv10
  if (level >= 10) {
    ctx.fillStyle = light;
    ctx.fillRect((centerX - 3) * ps, (centerY - 9) * ps + offset, ps * 0.3, ps * 0.5);
    ctx.fillRect((centerX + 2.7) * ps, (centerY - 9) * ps + offset, ps * 0.3, ps * 0.5);
  }

  // Ohren-Inneres
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 6) * ps + offset, ps, ps);

  // Körper Evolution
  const bodyWidth = level >= 20 ? 9 : level >= 15 ? 8.5 : level >= 10 ? 8 : level >= 5 ? 6.5 : 6;
  const bodyHeight = level >= 20 ? 9 : level >= 15 ? 8.5 : level >= 10 ? 8 : level >= 5 ? 6.5 : 6;
  ctx.fillStyle = color;
  ctx.fillRect(
    (centerX - bodyWidth / 2) * ps,
    (centerY + 3) * ps + offset,
    ps * bodyWidth,
    ps * bodyHeight
  );
  ctx.fillRect((centerX - 2) * ps, (centerY + 3 + bodyHeight) * ps + offset, ps * 4, ps * 2);

  // Muskel-Definition ab Lv10
  if (level >= 10) {
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - bodyWidth / 2 + 1) * ps, (centerY + 4) * ps + offset, ps * 0.3, ps * 2);
    ctx.fillRect(
      (centerX + bodyWidth / 2 - 1.3) * ps,
      (centerY + 4) * ps + offset,
      ps * 0.3,
      ps * 2
    );
  }

  // Bauch
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 4) * ps + offset, ps * 4, ps * 4);

  // Pfoten
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 3) * ps, (centerY + 9) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + 1) * ps, (centerY + 9) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX - 3) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);

  // Schwanz Evolution
  const tailLength = level >= 20 ? 4.5 : level >= 10 ? 4 : level >= 5 ? 3.5 : 3;
  ctx.fillStyle = color;
  for (let i = 0; i < tailLength; i++) {
    const width = 2 + (level >= 10 ? 0.5 : 0);
    ctx.fillRect(
      (centerX + 3 + i * 2) * ps,
      (centerY + 7 - i * 2) * ps + offset,
      ps * width,
      ps * 2
    );
  }

  // Gestreifter Schwanz ab Lv5
  if (level >= 5) {
    ctx.fillStyle = dark;
    for (let i = 0; i < tailLength; i += 2) {
      ctx.fillRect(
        (centerX + 3 + i * 2) * ps,
        (centerY + 7 - i * 2) * ps + offset,
        ps * 2,
        ps * 0.3
      );
    }
  }

  // Schwanzspitze
  ctx.fillStyle = level >= 10 ? light : dark;
  ctx.fillRect(
    (centerX + 3 + tailLength * 2) * ps,
    (centerY + 7 - tailLength * 2) * ps + offset,
    ps,
    ps * 2
  );

  // Augen
  const eyeColor =
    level >= 40
      ? '#FF4500'
      : level >= 30
        ? '#DC143C'
        : level >= 20
          ? '#9400D3'
          : level >= 15
            ? '#00CED1'
            : level >= 10
              ? '#00FF7F'
              : '#00FF00';
  const eyeSize = level >= 10 ? 2.2 : 2;

  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);

  // Pupillen
  ctx.fillStyle = '#000';
  const pupilWidth = level >= 10 ? 0.4 : 0.5;
  ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * pupilWidth, ps);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * pupilWidth, ps);

  // Augen-Leuchten ab Lv10
  if (level >= 10) {
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 1.5;
    ctx.fillStyle = eyeColor;
    ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
    ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
    ctx.shadowBlur = 0;
  }

  // Nase
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((centerX - 0.5) * ps, centerY * ps + offset, ps, ps * 0.5);

  // Mund
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 1) * ps, (centerY + 0.5) * ps + offset, ps * 2, ps * 0.3);

  // Schnurrhaare
  ctx.strokeStyle = dark;
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((centerX - 4) * ps, (centerY - 1) * ps + offset);
  ctx.lineTo((centerX - 7) * ps, (centerY - 1.5) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX - 4) * ps, centerY * ps + offset);
  ctx.lineTo((centerX - 7) * ps, centerY * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX - 4) * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX - 7) * ps, (centerY + 0.5) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX + 4) * ps, (centerY - 1) * ps + offset);
  ctx.lineTo((centerX + 7) * ps, (centerY - 1.5) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX + 4) * ps, centerY * ps + offset);
  ctx.lineTo((centerX + 7) * ps, centerY * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX + 4) * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX + 7) * ps, (centerY + 0.5) * ps + offset);
  ctx.stroke();

  // Stufe 3 (Lv5+): Tiger-Streifen
  if (level >= 5) {
    ctx.fillStyle = dark;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect((centerX - 2.5) * ps, (centerY + 3 + i * 1.8) * ps + offset, ps * 5, ps * 0.4);
    }
  }

  // Stufe 3 (Lv10+): Kleine Flügel-Ansätze
  if (level >= 10) {
    ctx.fillStyle = light;
    ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);
  }

  // Stufe 4 (Lv15+): Größere Flügel
  if (level >= 15) {
    ctx.fillStyle = color + '88';
    ctx.fillRect((centerX - 6) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX + 4) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillStyle = light;
    ctx.fillRect((centerX - 5.5) * ps, (centerY + 2) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 4.5) * ps, (centerY + 2) * ps + offset, ps, ps * 2);
  }

  // Stufe 4 (Lv15+): Leuchtende Schnurrhaarspitzen
  if (level >= 15) {
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 3;
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.arc((centerX - 7) * ps, (centerY - 1.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.arc((centerX - 7) * ps, centerY * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.arc((centerX + 7) * ps, (centerY - 1.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.arc((centerX + 7) * ps, centerY * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Stufe 5 (Lv20+): Mähne + Krone
  if (level >= 20) {
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps, ps * 3);
    ctx.fillRect((centerX + 4) * ps, (centerY - 3) * ps + offset, ps, ps * 3);
    ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 8, ps * 0.5);

    if (equippedSlot !== 'head') {
      ctx.fillStyle = 'gold';
      ctx.fillRect((centerX - 2) * ps, (centerY - 10) * ps + offset, ps * 4, ps);
      ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      ctx.fillRect(centerX * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      ctx.fillStyle = '#FF1493';
      ctx.fillRect((centerX - 2) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
      ctx.fillStyle = '#00CED1';
      ctx.fillRect((centerX - 0.3) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
      ctx.fillStyle = '#9400D3';
      ctx.fillRect((centerX + 1.4) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
    }

    // Größere Flügel
    ctx.fillStyle = color + '66';
    ctx.fillRect((centerX - 8) * ps, centerY * ps + offset, ps * 3, ps * 6);
    ctx.fillRect((centerX + 5) * ps, centerY * ps + offset, ps * 3, ps * 6);
    ctx.fillStyle = light + '88';
    ctx.fillRect((centerX - 7) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX + 5.5) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);

    // Runen-Markierungen
    ctx.fillStyle = eyeColor + '66';
    ctx.fillRect((centerX - 2) * ps, (centerY + 5) * ps + offset, ps * 0.4, ps * 2);
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 5.5) * ps + offset, ps * 1.5, ps * 0.4);
    ctx.fillRect((centerX + 1.6) * ps, (centerY + 5) * ps + offset, ps * 0.4, ps * 2);
    ctx.fillRect((centerX + 1.1) * ps, (centerY + 5.5) * ps + offset, ps * 1.5, ps * 0.4);

    // Doppelte Schwanzspitze
    ctx.fillStyle = light;
    ctx.fillRect(
      (centerX + 3 + tailLength * 2) * ps,
      (centerY + 6 - tailLength * 2) * ps + offset,
      ps,
      ps
    );
    ctx.fillRect(
      (centerX + 3 + tailLength * 2 + 1) * ps,
      (centerY + 7 - tailLength * 2) * ps + offset,
      ps,
      ps
    );
  }

  // Stufe 5 (Lv20+): Drittes Auge
  if (level >= 20) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 4.5) * ps + offset, ps * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 4.5) * ps + offset, ps * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 4.5) * ps + offset, ps * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Kosmisches Schwanzmuster
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < tailLength; i++) {
      ctx.beginPath();
      ctx.arc(
        (centerX + 4 + i * 2) * ps,
        (centerY + 7.5 - i * 2) * ps + offset,
        ps * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // === STUFE 6 (Lv30-39): VETERAN — Narben/Streifen, markanter ===
  if (level >= 30) {
    // Kampfnarben über dem Auge
    ctx.strokeStyle = light + 'AA';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 3) * ps + offset);
    ctx.lineTo((centerX - 2) * ps, (centerY - 1) * ps + offset);
    ctx.stroke();
    // Narbe rechte Seite
    ctx.beginPath();
    ctx.moveTo((centerX + 3) * ps, (centerY + 4) * ps + offset);
    ctx.lineTo((centerX + 4.5) * ps, (centerY + 6) * ps + offset);
    ctx.stroke();

    // Dichteres Fell am Hals
    ctx.fillStyle = dark;
    for (let i = -3; i <= 3; i++) {
      const h = 2.5 - Math.abs(i) * 0.3;
      ctx.fillRect((centerX + i * 1.2) * ps, (centerY + 2.5) * ps + offset, ps * 0.8, ps * h);
    }

    // Verstärkte Streifen auf Rücken
    ctx.fillStyle = dark + 'AA';
    ctx.fillRect((centerX - 3.5) * ps, (centerY + 3) * ps + offset, ps * 0.6, ps * 5);
    ctx.fillRect((centerX + 2.9) * ps, (centerY + 3) * ps + offset, ps * 0.6, ps * 5);
  }

  // === STUFE 7 (Lv40-49): ELITE — Rüstungs-artige Muster ===
  if (level >= 40) {
    // Rüstungsmuster auf dem Rücken (geometrische Linien)
    ctx.strokeStyle = eyeColor + '88';
    ctx.lineWidth = ps * 0.3;
    // Schulterplatten
    ctx.fillStyle = dark + 'CC';
    ctx.fillRect((centerX - 4) * ps, (centerY + 3) * ps + offset, ps * 1.5, ps * 2);
    ctx.fillRect((centerX + 2.5) * ps, (centerY + 3) * ps + offset, ps * 1.5, ps * 2);
    // Rautenförmiges Muster auf der Brust
    ctx.strokeStyle = eyeColor + '66';
    ctx.lineWidth = ps * 0.25;
    ctx.beginPath();
    ctx.moveTo(centerX * ps, (centerY + 4) * ps + offset);
    ctx.lineTo((centerX + 1.5) * ps, (centerY + 5.5) * ps + offset);
    ctx.lineTo(centerX * ps, (centerY + 7) * ps + offset);
    ctx.lineTo((centerX - 1.5) * ps, (centerY + 5.5) * ps + offset);
    ctx.closePath();
    ctx.stroke();

    // Verstärkte Pfoten mit Krallen
    ctx.fillStyle = eyeColor + '44';
    ctx.fillRect((centerX - 3.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps * 0.8);
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps * 0.8);
    ctx.fillRect((centerX + 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps * 0.8);
    ctx.fillRect((centerX + 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps * 0.8);
  }
};

// === SÄBELZAHN-FORM (Level 50+) ===
function drawSabertooth(
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  dark: string,
  light: string,
  offset: number,
  equippedSlot?: AccessorySlot | null
): void {
  const centerX = 16;
  const centerY = 16;

  // Bestimme Sub-Stufe: Meister(50-59), Champion(60-74), Legende(75-99), Mythisch(100)
  const isMythical = level >= 100;
  const isLegend = level >= 75;
  const isChampion = level >= 60;

  // Mythisch: Halbtransparenz
  const bodyAlpha = isMythical ? 'BB' : '';
  const mainColor = color + bodyAlpha;

  // Massiverer Kopf (Säbelzahn-Proportionen)
  const headSize = isLegend ? 1.5 : isChampion ? 1.4 : 1.35;
  ctx.fillStyle = mainColor;
  ctx.fillRect(
    (centerX - 4.5 * headSize) * ps,
    (centerY - 5) * ps + offset,
    ps * 9 * headSize,
    ps * 7
  );
  ctx.fillRect((centerX - 3.5 * headSize) * ps, (centerY - 6) * ps + offset, ps * 7 * headSize, ps);

  // Ohren (kräftiger, mit Büscheln)
  ctx.fillStyle = dark + bodyAlpha;
  ctx.fillRect((centerX - 5) * ps, (centerY - 7) * ps + offset, ps * 2.5, ps);
  ctx.fillRect((centerX - 4) * ps, (centerY - 9) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX - 3) * ps, (centerY - 10) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 2.5) * ps, (centerY - 7) * ps + offset, ps * 2.5, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 9) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 10) * ps + offset, ps, ps);

  // Büschel oben
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps * 0.5, ps * 1.5);
  ctx.fillRect((centerX + 2.5) * ps, (centerY - 11) * ps + offset, ps * 0.5, ps * 1.5);

  // Ohren-Inneres
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 8) * ps + offset, ps, ps);

  // === SÄBELZÄHNE (das Hauptmerkmal!) ===
  const fangLength = isLegend ? 4 : isChampion ? 3.5 : 3;
  ctx.fillStyle = '#FFFFF0';
  // Linker Fang
  ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 1.2, ps * fangLength);
  ctx.fillRect((centerX - 2.8) * ps, (centerY + 1 + fangLength) * ps + offset, ps * 0.8, ps * 0.5);
  // Rechter Fang
  ctx.fillRect((centerX + 1.8) * ps, (centerY + 1) * ps + offset, ps * 1.2, ps * fangLength);
  ctx.fillRect((centerX + 2) * ps, (centerY + 1 + fangLength) * ps + offset, ps * 0.8, ps * 0.5);

  // Massiver Körper
  const bodyWidth = isLegend ? 11 : isChampion ? 10.5 : 10;
  const bodyHeight = isLegend ? 10 : isChampion ? 9.5 : 9;
  ctx.fillStyle = mainColor;
  ctx.fillRect(
    (centerX - bodyWidth / 2) * ps,
    (centerY + 2) * ps + offset,
    ps * bodyWidth,
    ps * bodyHeight
  );

  // Kräftige Schultern
  ctx.fillRect((centerX - bodyWidth / 2 - 0.5) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
  ctx.fillRect((centerX + bodyWidth / 2 - 1.5) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);

  // Bauch
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 4) * ps + offset, ps * 5, ps * 5);

  // Muskel-Definitionen
  ctx.fillStyle = dark + '44';
  ctx.fillRect((centerX - bodyWidth / 2 + 1) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 3);
  ctx.fillRect((centerX + bodyWidth / 2 - 1.4) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 3);

  // Kräftige Beine
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 4) * ps, (centerY + 10) * ps + offset, ps * 2.5, ps * 4);
  ctx.fillRect((centerX + 1.5) * ps, (centerY + 10) * ps + offset, ps * 2.5, ps * 4);

  // Große Krallen
  ctx.fillStyle = '#FFFFF0';
  ctx.fillRect((centerX - 4.5) * ps, (centerY + 13.5) * ps + offset, ps * 0.5, ps * 0.8);
  ctx.fillRect((centerX - 3.5) * ps, (centerY + 13.5) * ps + offset, ps * 0.5, ps * 0.8);
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 13.5) * ps + offset, ps * 0.5, ps * 0.8);
  ctx.fillRect((centerX + 1.5) * ps, (centerY + 13.5) * ps + offset, ps * 0.5, ps * 0.8);
  ctx.fillRect((centerX + 2.5) * ps, (centerY + 13.5) * ps + offset, ps * 0.5, ps * 0.8);
  ctx.fillRect((centerX + 3.5) * ps, (centerY + 13.5) * ps + offset, ps * 0.5, ps * 0.8);

  // Buschiger Schwanz (dicker als normale Katze)
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX + 4) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 3);
  ctx.fillRect((centerX + 7) * ps, (centerY + 4) * ps + offset, ps * 3, ps * 4);
  ctx.fillRect((centerX + 9) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);

  // Schwanz-Streifen
  ctx.fillStyle = dark + bodyAlpha;
  ctx.fillRect((centerX + 5) * ps, (centerY + 6) * ps + offset, ps * 0.5, ps * 2);
  ctx.fillRect((centerX + 8) * ps, (centerY + 4) * ps + offset, ps * 0.5, ps * 2);

  // Schwanzspitze
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX + 10) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);

  // Augen (wild und intensiv)
  const eyeColor = isLegend ? '#FF0000' : isChampion ? '#FF4500' : '#DC143C';
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 3) * ps + offset, ps * 2.5, ps * 1.5);
  ctx.fillRect((centerX + 1) * ps, (centerY - 3) * ps + offset, ps * 2.5, ps * 1.5);

  // Schlitz-Pupillen
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 3) * ps + offset, ps * 0.4, ps * 1.5);
  ctx.fillRect((centerX + 1.6) * ps, (centerY - 3) * ps + offset, ps * 0.4, ps * 1.5);

  // Augen-Glühen
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = ps * (isLegend ? 4 : 2);
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 3) * ps + offset, ps * 2.5, ps * 1.5);
  ctx.fillRect((centerX + 1) * ps, (centerY - 3) * ps + offset, ps * 2.5, ps * 1.5);
  ctx.shadowBlur = 0;

  // Nase (breiter)
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((centerX - 1) * ps, (centerY + 0.5) * ps + offset, ps * 2, ps * 0.8);

  // Schnurrhaare (dicker)
  ctx.strokeStyle = dark;
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.moveTo((centerX - 5) * ps, (centerY - 1) * ps + offset);
  ctx.lineTo((centerX - 8) * ps, (centerY - 2) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX - 5) * ps, centerY * ps + offset);
  ctx.lineTo((centerX - 8) * ps, (centerY - 0.5) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX + 5) * ps, (centerY - 1) * ps + offset);
  ctx.lineTo((centerX + 8) * ps, (centerY - 2) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX + 5) * ps, centerY * ps + offset);
  ctx.lineTo((centerX + 8) * ps, (centerY - 0.5) * ps + offset);
  ctx.stroke();

  // Tiger-Streifen am Körper
  ctx.fillStyle = dark + '88';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(
      (centerX - bodyWidth / 2 + 1) * ps,
      (centerY + 3 + i * 1.5) * ps + offset,
      ps * (bodyWidth - 2),
      ps * 0.3
    );
  }

  // Krone (nur ohne Head-Accessory)
  if (equippedSlot !== 'head') {
    if (isMythical) {
      // Göttliche Krone
      ctx.fillStyle = '#FFD700';
      ctx.fillRect((centerX - 3) * ps, (centerY - 12) * ps + offset, ps * 6, ps * 1.5);
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(
          (centerX - 3 + i * 1.5) * ps,
          (centerY - 14 + Math.abs(i - 2) * 0.5) * ps + offset,
          ps,
          ps * 2
        );
      }
      // Juwelen
      const jewelColors = ['#FF0000', '#00FFFF', '#FF00FF', '#00FF00', '#FFD700'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = jewelColors[i];
        ctx.fillRect(
          (centerX - 2.7 + i * 1.5) * ps,
          (centerY - 12.5) * ps + offset,
          ps * 0.5,
          ps * 0.5
        );
      }
    } else {
      // Normale Krone
      ctx.fillStyle = 'gold';
      ctx.fillRect((centerX - 2) * ps, (centerY - 12) * ps + offset, ps * 4, ps);
      ctx.fillRect((centerX - 3) * ps, (centerY - 13) * ps + offset, ps, ps * 2);
      ctx.fillRect(centerX * ps, (centerY - 13) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 2) * ps, (centerY - 13) * ps + offset, ps, ps * 2);
    }
  }

  // === CHAMPION (Lv60+): Extra Features ===
  if (isChampion) {
    // Nackenrüstung/Mähne
    ctx.fillStyle = dark + bodyAlpha;
    for (let i = -4; i <= 4; i++) {
      const h = 3.5 - Math.abs(i) * 0.3;
      ctx.fillRect((centerX + i * 1) * ps, (centerY + 1) * ps + offset, ps * 0.8, ps * h);
    }

    // Rüstungsmuster auf Schultern
    ctx.fillStyle = eyeColor + '44';
    ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 3);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 3);

    // Leuchtende Runen auf dem Körper
    ctx.strokeStyle = eyeColor + '66';
    ctx.lineWidth = ps * 0.25;
    ctx.beginPath();
    ctx.moveTo(centerX * ps, (centerY + 4) * ps + offset);
    ctx.lineTo((centerX + 2) * ps, (centerY + 6) * ps + offset);
    ctx.lineTo(centerX * ps, (centerY + 8) * ps + offset);
    ctx.lineTo((centerX - 2) * ps, (centerY + 6) * ps + offset);
    ctx.closePath();
    ctx.stroke();
  }

  // === LEGENDE (Lv75+): Majestätische Form ===
  if (isLegend) {
    // Leuchtende Augen intensiver
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 6;
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX - 3) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 2.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.shadowBlur = 0;

    // Drittes Auge (golden, größer)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5) * ps + offset, ps * 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5) * ps + offset, ps * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 5;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5) * ps + offset, ps * 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Leuchtende Krallenspitzen
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = eyeColor + '88';
    ctx.fillRect((centerX - 4.5) * ps, (centerY + 13.5) * ps + offset, ps * 3, ps * 0.5);
    ctx.fillRect((centerX + 1.5) * ps, (centerY + 13.5) * ps + offset, ps * 3, ps * 0.5);
    ctx.shadowBlur = 0;

    // Feine goldene Linien am Schwanz
    ctx.strokeStyle = '#FFD70066';
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.moveTo((centerX + 4) * ps, (centerY + 7) * ps + offset);
    ctx.lineTo((centerX + 10) * ps, (centerY + 3) * ps + offset);
    ctx.stroke();
  }

  // === MYTHISCH (Lv100): Ätherisch, göttlich ===
  if (isMythical) {
    // Ätherisches Leuchten um den ganzen Körper
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 8;
    ctx.strokeStyle = '#FFD70044';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.ellipse(
      centerX * ps,
      (centerY + 4) * ps + offset,
      (bodyWidth / 2 + 2) * ps,
      (bodyHeight / 2 + 2) * ps,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Säbelzähne leuchten
    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = ps * 3;
    ctx.fillStyle = '#FFFFFFCC';
    ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 1.2, ps * fangLength);
    ctx.fillRect((centerX + 1.8) * ps, (centerY + 1) * ps + offset, ps * 1.2, ps * fangLength);
    ctx.shadowBlur = 0;

    // Geisterhafte Doppelgänger-Silhouette (leicht versetzt)
    ctx.fillStyle = color + '22';
    ctx.fillRect(
      (centerX - 4.5 * headSize + 1) * ps,
      (centerY - 5 - 1) * ps + offset,
      ps * 9 * headSize,
      ps * 7
    );
  }
}
