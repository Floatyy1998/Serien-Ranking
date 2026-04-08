import type { AccessorySlot } from '../../types/pet.types';

export const drawBird = (
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

  // === STUFE 8+ (Lv50): PHÖNIX-FORM ===
  if (level >= 50) {
    drawPhoenix(
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

  // === STUFEN 1-7: NORMALER VOGEL (Lv1-49) ===
  const wingFlap = animated ? Math.sin(frame * 0.2 * animationSpeed) * 3 : 0;

  // Kopf
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY - 5) * ps + offset, ps * 6, ps * 5);
  ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps * 4, ps);

  // Federkamm
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 7) * ps + offset, ps, ps * 2);

  // Bunter Kamm ab Lv5
  if (level >= 5) {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(centerX * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((centerX - 1) * ps, (centerY - 9) * ps + offset, ps, ps);
  }

  // Körper
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, centerY * ps + offset, ps * 6, ps * 8);
  ctx.fillRect((centerX - 2) * ps, (centerY + 8) * ps + offset, ps * 4, ps * 2);

  // Bauch
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 5);

  // Flügel
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 6 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 3) * ps + offset, ps, ps * 3);
  ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX + 5 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 7 + wingFlap) * ps, (centerY + 3) * ps + offset, ps, ps * 3);
  ctx.fillRect((centerX + 8 + wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

  // Schnabel
  const beakColor = color === '#FFA500' ? '#DC143C' : '#FFA500';
  const beakTipColor = color === '#FFA500' ? '#8B0000' : '#FF8C00';
  ctx.fillStyle = beakColor;
  ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * 4, ps * 2);
  ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps);
  ctx.fillStyle = beakTipColor;
  ctx.fillRect((centerX - 3) * ps, centerY * ps + offset, ps * 2, ps * 0.5);

  // Augen
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 4) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillStyle = '#4169E1';
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
  ctx.fillRect((centerX + 2) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);
  ctx.fillRect((centerX + 2.2) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);

  // Stufe 3 (Lv5+): Roter Kamm + bunte Flügelspitzen
  if (level >= 5) {
    ctx.fillStyle = '#FF6347';
    ctx.fillRect((centerX - 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
    ctx.fillRect((centerX - 0.5) * ps, (centerY - 9) * ps + offset, ps, ps);
    ctx.fillStyle = '#00CED1';
    ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 6 + wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
  }

  // Stufe 3 (Lv5+): Dreifarbiger Kamm
  if (level >= 5) {
    ctx.fillStyle = '#FF1493';
    ctx.fillRect((centerX - 1.5) * ps, (centerY - 8) * ps + offset, ps, ps * 3);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((centerX - 0.5) * ps, (centerY - 9) * ps + offset, ps, ps * 4);
    ctx.fillStyle = '#00CED1';
    ctx.fillRect((centerX + 0.5) * ps, (centerY - 8) * ps + offset, ps, ps * 3);

    // Schwanzfedern
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect((centerX - 2) * ps, (centerY + 11) * ps + offset, ps, ps * 4);
    ctx.fillStyle = '#40E0D0';
    ctx.fillRect((centerX - 1) * ps, (centerY + 11) * ps + offset, ps, ps * 5);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(centerX * ps, (centerY + 11) * ps + offset, ps, ps * 4);
  }

  // Stufe 4 (Lv10+): Kakadu-Kamm
  if (level >= 10) {
    const crestColors = ['#FFD700', '#FF6347', '#FFD700', '#FF6347', '#FFD700'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = crestColors[i];
      const height = 4 - Math.abs(i - 2) * 0.8;
      ctx.fillRect(
        (centerX - 2 + i * 0.8) * ps,
        (centerY - 7 - height) * ps + offset,
        ps * 0.7,
        ps * height
      );
    }

    // Flügel mit Farbverläufen
    const gradient = ctx.createLinearGradient(
      (centerX - 8) * ps,
      centerY * ps,
      (centerX - 3) * ps,
      centerY * ps
    );
    gradient.addColorStop(0, dark);
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, '#00CED1');
    ctx.fillStyle = gradient;
    ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 5, ps * 6);
    ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 5, ps * 6);

    // Längere Schwanzfedern
    for (let i = 0; i < 3; i++) {
      const colors = ['#FF1493', '#00CED1', '#FFD700'];
      ctx.fillStyle = colors[i];
      ctx.fillRect((centerX - 1 + i - 1) * ps, (centerY + 11) * ps + offset, ps, ps * (5 + i));
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX - 1 + i - 1) * ps, (centerY + 16 + i) * ps + offset, ps, ps * 0.5);
    }
  }

  // Stufe 5 (Lv20+): Paradiesvogel
  if (level >= 20) {
    // Goldene Federkrone
    for (let i = 0; i < 7; i++) {
      const height = 5 - Math.abs(i - 3) * 0.7;
      ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF6347';
      ctx.fillRect(
        (centerX - 3 + i * 0.9) * ps,
        (centerY - 8 - height) * ps + offset,
        ps * 0.8,
        ps * height
      );
      ctx.fillStyle = '#FFF';
      ctx.fillRect(
        (centerX - 3 + i * 0.9) * ps,
        (centerY - 8 - height) * ps + offset,
        ps * 0.8,
        ps * 0.3
      );
    }

    // Mehrfarbige Flügel
    const wingColors = [dark, color, '#00CED1', '#9400D3', '#FF1493'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = wingColors[i];
      ctx.fillRect(
        (centerX - 8 + i - wingFlap) * ps,
        (centerY + 1 + i) * ps + offset,
        ps * (6 - i),
        ps
      );
      ctx.fillRect(
        (centerX + 3 + wingFlap) * ps,
        (centerY + 1 + i) * ps + offset,
        ps * (6 - i),
        ps
      );
    }

    // Prächtiger Schwanz
    const tailColors = ['#FF1493', '#00CED1', '#FFD700', '#9400D3', '#FF6347'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = tailColors[i];
      const length = 7 - Math.abs(i - 2);
      ctx.fillRect((centerX - 2 + i) * ps, (centerY + 10) * ps + offset, ps, ps * length);
      if (i >= 1 && i <= 3) {
        ctx.fillStyle = '#00CED1';
        ctx.beginPath();
        ctx.arc(
          (centerX - 2 + i + 0.5) * ps,
          (centerY + 9 + length) * ps + offset,
          ps * 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(
          (centerX - 2 + i + 0.5) * ps,
          (centerY + 9 + length) * ps + offset,
          ps * 0.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Krone (nur ohne Head-Accessory)
    if (equippedSlot !== 'head') {
      ctx.fillStyle = 'gold';
      ctx.fillRect((centerX - 2) * ps, (centerY - 10) * ps + offset, ps * 4, ps);
      ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      ctx.fillRect(centerX * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
    }

    // Phoenix-Funken
    if (animated) {
      const sparkPhase = frame * 0.08 * animationSpeed;
      for (let i = 0; i < 3; i++) {
        const sparkAlpha = 0.4 + Math.sin(sparkPhase + i * 2) * 0.3;
        const sparkY = (centerY + 2 + i * 1.5) * ps + offset + Math.sin(sparkPhase + i) * ps;
        ctx.fillStyle = `rgba(255, 99, 71, ${sparkAlpha})`;
        ctx.fillRect((centerX - 9 - wingFlap) * ps, sparkY, ps * 0.6, ps * 0.6);
        ctx.fillRect((centerX + 8 + wingFlap) * ps, sparkY, ps * 0.6, ps * 0.6);
      }
    }

    // Leuchtende Federspitzen
    ctx.fillStyle = '#FF634788';
    for (let i = 0; i < 7; i++) {
      const height = 5 - Math.abs(i - 3) * 0.7;
      ctx.fillRect(
        (centerX - 3 + i * 0.9) * ps,
        (centerY - 8 - height - 0.5) * ps + offset,
        ps * 0.8,
        ps * 0.5
      );
    }

    // Phoenix-Flammenfedern
    if (animated) {
      const flamePhase = frame * 0.06 * animationSpeed;
      ctx.fillStyle = `rgba(255, 69, 0, ${0.2 + Math.sin(flamePhase) * 0.1})`;
      ctx.fillRect((centerX - 10 - wingFlap) * ps, centerY * ps + offset, ps * 5, ps * 7);
      ctx.fillRect((centerX + 5 + wingFlap) * ps, centerY * ps + offset, ps * 5, ps * 7);
      ctx.fillStyle = `rgba(255, 215, 0, ${0.15 + Math.sin(flamePhase + 1) * 0.1})`;
      ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 5);
      ctx.fillRect((centerX + 6 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 5);
    }

    // Flammen-Schweif + Heiligenschein ab Lv20
    if (animated) {
      const trailPhase = frame * 0.04 * animationSpeed;
      const trailColors = [
        'rgba(255, 69, 0, 0.3)',
        'rgba(255, 140, 0, 0.25)',
        'rgba(255, 215, 0, 0.2)',
      ];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = trailColors[i];
        const trailY = (centerY + 12 + i * 2) * ps + offset;
        const trailWidth = 4 + i * 2 + Math.sin(trailPhase + i) * 1;
        ctx.fillRect((centerX - trailWidth / 2) * ps, trailY, ps * trailWidth, ps * 2);
      }
    }
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY - 12) * ps + offset, ps * 3, ps * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Füße
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 9) * ps + offset, ps, ps * 2);
  ctx.fillStyle = '#FFA500';
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX - 1.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);

  // === STUFE 6 (Lv30-39): VETERAN ===
  if (level >= 30) {
    // Kampfnarbe am Flügel
    ctx.strokeStyle = light + '88';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.moveTo((centerX - 5 - wingFlap) * ps, (centerY + 2) * ps + offset);
    ctx.lineTo((centerX - 3 - wingFlap) * ps, (centerY + 5) * ps + offset);
    ctx.stroke();

    // Dichtere Brustfedern
    ctx.fillStyle = dark + 'AA';
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect((centerX + i * 0.8) * ps, (centerY + 1) * ps + offset, ps * 0.6, ps * 1.5);
    }

    // Verstärkte Schwanzfedern
    ctx.fillStyle = dark + '88';
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 10) * ps + offset, ps * 0.5, ps * 3);
    ctx.fillRect((centerX + 2) * ps, (centerY + 10) * ps + offset, ps * 0.5, ps * 3);
  }

  // === STUFE 7 (Lv40-49): ELITE ===
  if (level >= 40) {
    // Metallische Flügelkanten
    ctx.fillStyle = '#C0C0C0AA';
    ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 0.5, ps * 5);
    ctx.fillRect((centerX + 6.5 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 0.5, ps * 5);

    // Leuchtende Augenringe
    ctx.shadowColor = '#4169E1';
    ctx.shadowBlur = ps * 2;
    ctx.strokeStyle = '#4169E188';
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.arc((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc((centerX + 3) * ps, (centerY - 2) * ps + offset, ps * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Elite-Muster auf der Brust
    ctx.strokeStyle = '#FFD70066';
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.moveTo(centerX * ps, (centerY + 2) * ps + offset);
    ctx.lineTo((centerX + 1.5) * ps, (centerY + 4) * ps + offset);
    ctx.lineTo(centerX * ps, (centerY + 6) * ps + offset);
    ctx.lineTo((centerX - 1.5) * ps, (centerY + 4) * ps + offset);
    ctx.closePath();
    ctx.stroke();
  }
};

// === PHÖNIX-FORM (Level 50+) ===
function drawPhoenix(
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  _dark: string,
  _light: string,
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

  // Phönix-Farben: Primär Feuerrot/Orange/Gold statt der normalen Farbe
  const fireRed = '#FF4500' + bodyAlpha;
  const fireOrange = '#FF8C00' + bodyAlpha;
  const fireGold = '#FFD700' + bodyAlpha;
  const mainColor = color + bodyAlpha;

  const wingFlap = animated ? Math.sin(frame * 0.15 * animationSpeed) * 4 : 0;

  // Eleganter Kopf
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 3) * ps, (centerY - 5) * ps + offset, ps * 6, ps * 5);
  ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps * 4, ps);

  // Prächtige Federkrone (Phönix-typisch, flammenartig)
  const crownHeight = isLegend ? 8 : isChampion ? 7 : 6;
  for (let i = 0; i < 9; i++) {
    const h = crownHeight - Math.abs(i - 4) * 0.8;
    const crownColors = [
      fireRed,
      fireOrange,
      fireGold,
      fireOrange,
      fireRed,
      fireOrange,
      fireGold,
      fireOrange,
      fireRed,
    ];
    ctx.fillStyle = crownColors[i];
    ctx.fillRect((centerX - 3.5 + i * 0.8) * ps, (centerY - 7 - h) * ps + offset, ps * 0.7, ps * h);
    // Leuchtende Spitzen
    if (animated) {
      const flickerAlpha = 0.3 + Math.sin(frame * 0.1 * animationSpeed + i) * 0.3;
      ctx.fillStyle = `rgba(255, 255, 200, ${flickerAlpha})`;
      ctx.fillRect(
        (centerX - 3.5 + i * 0.8) * ps,
        (centerY - 7 - h) * ps + offset,
        ps * 0.7,
        ps * 0.4
      );
    }
  }

  // Schlanker, eleganter Körper
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 3) * ps, centerY * ps + offset, ps * 6, ps * 8);
  ctx.fillRect((centerX - 2) * ps, (centerY + 8) * ps + offset, ps * 4, ps * 2);

  // Leuchtender Bauch (golden)
  ctx.fillStyle = fireGold;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 5);

  // Massive brennende Flügel
  const wingSpan = isLegend ? 5 : isChampion ? 4 : 3;
  // Linker Flügel
  ctx.fillStyle = fireRed;
  ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
  ctx.fillRect((centerX - 7 - wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 7);
  ctx.fillRect(
    (centerX - 9 - wingFlap - wingSpan) * ps,
    (centerY + 1) * ps + offset,
    ps * (3 + wingSpan),
    ps * 5
  );
  // Flügel-Farbverlauf
  ctx.fillStyle = fireOrange;
  ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 4);
  ctx.fillStyle = fireGold;
  ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 3) * ps + offset, ps * 2, ps * 2);

  // Rechter Flügel
  ctx.fillStyle = fireRed;
  ctx.fillRect((centerX + 2 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
  ctx.fillRect((centerX + 4 + wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 7);
  ctx.fillRect(
    (centerX + 6 + wingFlap) * ps,
    (centerY + 1) * ps + offset,
    ps * (3 + wingSpan),
    ps * 5
  );
  ctx.fillStyle = fireOrange;
  ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 4);
  ctx.fillStyle = fireGold;
  ctx.fillRect((centerX + 5 + wingFlap) * ps, (centerY + 3) * ps + offset, ps * 2, ps * 2);

  // Flammen-Effekte an Flügelspitzen
  if (animated) {
    const flamePhase = frame * 0.08 * animationSpeed;
    for (let i = 0; i < 5; i++) {
      const fAlpha = 0.3 + Math.sin(flamePhase + i * 1.2) * 0.25;
      const fy = (centerY + 1 + i * 1.2) * ps + offset + Math.sin(flamePhase + i) * ps * 0.5;
      ctx.fillStyle = `rgba(255, 69, 0, ${fAlpha})`;
      ctx.fillRect((centerX - 10 - wingFlap - wingSpan) * ps, fy, ps * 1.5, ps);
      ctx.fillRect((centerX + 8 + wingFlap + wingSpan) * ps, fy, ps * 1.5, ps);
      ctx.fillStyle = `rgba(255, 215, 0, ${fAlpha * 0.7})`;
      ctx.fillRect((centerX - 9 - wingFlap - wingSpan) * ps, fy + ps * 0.3, ps, ps * 0.5);
      ctx.fillRect((centerX + 9 + wingFlap + wingSpan) * ps, fy + ps * 0.3, ps, ps * 0.5);
    }
  }

  // Schnabel (elegant, gebogen)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * 4, ps * 2);
  ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps);
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect((centerX - 3) * ps, centerY * ps + offset, ps * 2, ps * 0.5);

  // Leuchtende Augen
  const eyeColor = isLegend ? '#FFD700' : '#FF4500';
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 4) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
  ctx.fillRect((centerX + 2) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 0.6, ps * 0.6);
  ctx.fillRect((centerX + 2.4) * ps, (centerY - 2) * ps + offset, ps * 0.6, ps * 0.6);
  // Augen-Glühen
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = ps * 3;
  ctx.fillStyle = eyeColor + '88';
  ctx.fillRect((centerX - 4) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.shadowBlur = 0;

  // Prächtiger Flammen-Schwanz
  const tailFeathers = isLegend ? 7 : isChampion ? 6 : 5;
  for (let i = 0; i < tailFeathers; i++) {
    const tailColors = [fireRed, fireOrange, fireGold];
    ctx.fillStyle = tailColors[i % 3];
    const length = 8 - Math.abs(i - Math.floor(tailFeathers / 2)) * 0.8;
    ctx.fillRect(
      (centerX - Math.floor(tailFeathers / 2) + i) * ps,
      (centerY + 10) * ps + offset,
      ps,
      ps * length
    );
    // Flammenspitze
    if (animated) {
      const tipPhase = frame * 0.06 * animationSpeed;
      const tipAlpha = 0.4 + Math.sin(tipPhase + i * 0.8) * 0.3;
      ctx.fillStyle = `rgba(255, 255, 200, ${tipAlpha})`;
      ctx.fillRect(
        (centerX - Math.floor(tailFeathers / 2) + i) * ps,
        (centerY + 9.5 + length) * ps + offset,
        ps,
        ps * 0.5
      );
    }
  }

  // Füße (goldene Krallen)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps * 1.5, ps * 2);
  ctx.fillRect((centerX + 0.5) * ps, (centerY + 9) * ps + offset, ps * 1.5, ps * 2);
  ctx.fillStyle = '#FF8C00';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect((centerX - 2.5 + i * 0.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.4, ps);
    ctx.fillRect((centerX + 0.5 + i * 0.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.4, ps);
  }

  // Heiligenschein
  ctx.strokeStyle = `rgba(255, 215, 0, ${isLegend ? 0.7 : 0.5})`;
  ctx.lineWidth = ps * (isLegend ? 0.6 : 0.4);
  ctx.beginPath();
  ctx.ellipse(centerX * ps, (centerY - 14) * ps + offset, ps * 3.5, ps * 1, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Krone (nur ohne Head-Accessory)
  if (equippedSlot !== 'head' && !isMythical) {
    ctx.fillStyle = 'gold';
    ctx.fillRect((centerX - 2) * ps, (centerY - 8) * ps + offset, ps * 4, ps);
    ctx.fillRect((centerX - 3) * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    ctx.fillRect(centerX * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 2) * ps, (centerY - 9) * ps + offset, ps, ps * 2);
  }

  // === CHAMPION (Lv60+) ===
  if (isChampion) {
    // Doppelte Flügel-Schicht (innere Flügel leuchten)
    if (animated) {
      const innerGlow = 0.15 + Math.sin(frame * 0.04 * animationSpeed) * 0.1;
      ctx.fillStyle = `rgba(255, 215, 0, ${innerGlow})`;
      ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 4, ps * 6);
      ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 4, ps * 6);
    }

    // Brustjuwel
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY + 3) * ps + offset, ps * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY + 3) * ps + offset, ps * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // === LEGENDE (Lv75+) ===
  if (isLegend) {
    // Permanenter Flammen-Schweif (intensiver)
    if (animated) {
      const trailPhase = frame * 0.03 * animationSpeed;
      for (let i = 0; i < 5; i++) {
        const tAlpha = 0.2 + Math.sin(trailPhase + i * 0.5) * 0.15;
        ctx.fillStyle = `rgba(255, 69, 0, ${tAlpha})`;
        const tw = 6 + i * 2 + Math.sin(trailPhase + i) * 1;
        ctx.fillRect(
          (centerX - tw / 2) * ps,
          (centerY + 14 + i * 1.5) * ps + offset,
          ps * tw,
          ps * 1.5
        );
      }
    }

    // Göttliche Aura um den ganzen Vogel
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 6;
    ctx.strokeStyle = '#FFD70033';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY + 3) * ps + offset, 8 * ps, 10 * ps, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // === MYTHISCH (Lv100) ===
  if (isMythical) {
    // Ätherischer Phönix — gesamter Körper leuchtet
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 10;
    ctx.strokeStyle = '#FFD70044';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY + 2) * ps + offset, 10 * ps, 12 * ps, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Geisterhafte Silhouette
    ctx.fillStyle = color + '1A';
    ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 8, ps * 7);

    // Augen leuchten weiß-golden
    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = ps * 8;
    ctx.fillStyle = '#FFFFFFDD';
    ctx.fillRect((centerX - 4) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
    ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
    ctx.shadowBlur = 0;

    // Göttlicher Heiligenschein (doppelt, intensiver)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = ps * 0.5;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY - 15) * ps + offset, ps * 4, ps * 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY - 16) * ps + offset, ps * 5, ps * 1.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}
