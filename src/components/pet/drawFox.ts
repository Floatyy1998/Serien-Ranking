import type { AccessorySlot } from '../../types/pet.types';

export const drawFox = (
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

  // === STUFE 8+ (Lv50): GÖTTLICHE KITSUNE-FORM ===
  if (level >= 50) {
    drawDivineKitsune(
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

  // === STUFEN 1-7: NORMALER FUCHS / KITSUNE (Lv1-49) ===

  // Kopf
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 8, ps * 5);
  ctx.fillRect((centerX - 3) * ps, (centerY - 5) * ps + offset, ps * 6, ps);

  // Spitze Schnauze
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 5) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX - 6) * ps, centerY * ps + offset, ps * 2, ps);

  // Große spitze Ohren
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX - 2) * ps, (centerY - 9) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 9) * ps + offset, ps, ps);

  // Ohren-Inneres
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 7) * ps + offset, ps, ps * 2);

  // Weiße Wangen
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 4) * ps, (centerY - 2) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + 2) * ps, (centerY - 2) * ps + offset, ps * 2, ps * 3);

  // Körper
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 6, ps * 8);
  ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps * 4, ps * 2);

  // Weißer Bauch/Brust
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);
  ctx.fillRect((centerX - 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 2);

  // Beine
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX - 3) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 2);

  // Schwarze Socken
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);

  // Buschiger Schwanz
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 3) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 3);
  ctx.fillRect((centerX + 6) * ps, (centerY + 4) * ps + offset, ps * 3, ps * 4);
  ctx.fillRect((centerX + 8) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 5);
  ctx.fillRect((centerX + 9) * ps, centerY * ps + offset, ps * 2, ps * 4);
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX + 9) * ps, (centerY - 1) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 10) * ps, (centerY - 2) * ps + offset, ps, ps * 2);

  // Augen
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
  ctx.fillStyle = '#FFA500';
  ctx.fillRect((centerX - 2.5) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);
  ctx.fillRect((centerX + 1.7) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);

  // Nase
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 0.5) * ps, (centerY + 0.5) * ps + offset, ps, ps * 0.5);

  // Mund
  ctx.strokeStyle = '#000';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo(centerX * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX - 1) * ps, (centerY + 1.5) * ps + offset);
  ctx.moveTo(centerX * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX + 1) * ps, (centerY + 1.5) * ps + offset);
  ctx.stroke();

  // Stufe 3 (Lv5+): Zweiter Schwanz + rote Markierungen
  if (level >= 5) {
    ctx.fillStyle = color;
    ctx.fillRect((centerX + 4) * ps, (centerY + 7) * ps + offset, ps * 3, ps * 1.5);
    ctx.fillRect((centerX + 6) * ps, (centerY + 6) * ps + offset, ps * 2, ps * 1.5);
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX + 7) * ps, (centerY + 6) * ps + offset, ps, ps);
    ctx.fillStyle = '#DC143C';
    ctx.fillRect((centerX - 4.5) * ps, (centerY - 1) * ps + offset, ps * 0.8, ps * 0.8);
    ctx.fillRect((centerX + 3.7) * ps, (centerY - 1) * ps + offset, ps * 0.8, ps * 0.8);
  }

  // Stufe 3 (Lv5+): Dritter Schwanz + Torii-Symbol + blaue Flammen
  if (level >= 5) {
    ctx.fillStyle = light;
    ctx.fillRect((centerX + 3) * ps, (centerY + 4) * ps + offset, ps * 4, ps * 2);
    ctx.fillRect((centerX + 6) * ps, (centerY + 3) * ps + offset, ps * 2, ps * 2);
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX + 7) * ps, (centerY + 3) * ps + offset, ps, ps * 1.5);

    if (equippedSlot !== 'head') {
      ctx.fillStyle = '#DC143C';
      ctx.fillRect((centerX - 1) * ps, (centerY - 5) * ps + offset, ps * 2, ps * 0.3);
      ctx.fillRect((centerX - 0.5) * ps, (centerY - 4.5) * ps + offset, ps * 0.3, ps);
      ctx.fillRect((centerX + 0.2) * ps, (centerY - 4.5) * ps + offset, ps * 0.3, ps);
    }

    ctx.fillStyle = '#4169E1';
    ctx.fillRect((centerX - 3.5) * ps, (centerY + 12) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 1.5) * ps, (centerY + 12) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 2.5) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 0.5);
  }

  // Stufe 4 (Lv10+): 5 Schwänze + Magatama + rote Augen
  if (level >= 10) {
    for (let i = 0; i < 5; i++) {
      const angle = (i - 2) * 0.4;
      const xOffset = Math.sin(angle) * 3;
      const yOffset = i * 1.5;
      ctx.fillStyle = i % 2 === 0 ? color : light;
      ctx.fillRect(
        (centerX + 3 + xOffset) * ps,
        (centerY + 2 + yOffset) * ps + offset,
        ps * 4,
        ps * 1.5
      );
      ctx.fillRect(
        (centerX + 6 + xOffset) * ps,
        (centerY + 1 + yOffset) * ps + offset,
        ps * 2,
        ps * 1.5
      );
      ctx.fillStyle = i % 2 === 0 ? '#87CEEB' : '#E0FFFF';
      ctx.fillRect((centerX + 7 + xOffset) * ps, (centerY + 1 + yOffset) * ps + offset, ps, ps);
    }

    if (equippedSlot !== 'neck') {
      ctx.fillStyle = '#2E8B57';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc((centerX + i * 1.5) * ps, (centerY + 3.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#DC143C';
    ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
    ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX - 2.8) * ps, (centerY - 2.3) * ps + offset, ps * 0.3, ps * 0.3);
    ctx.fillRect((centerX + 2.5) * ps, (centerY - 2.3) * ps + offset, ps * 0.3, ps * 0.3);
  }

  // Stufe 5 (Lv20+): 9 Schwänze + Torii + Magatama + mystische Linien
  if (level >= 20) {
    for (let i = 0; i < 9; i++) {
      const angle = (i - 4) * 0.25;
      const xOffset = Math.sin(angle) * 3;
      const yOffset = Math.abs(i - 4) * 0.8;
      ctx.fillStyle = i % 2 === 0 ? color : light;
      ctx.fillRect(
        (centerX + 3 + xOffset) * ps,
        (centerY + 3 + yOffset) * ps + offset,
        ps * 5,
        ps * 2
      );
      ctx.fillRect(
        (centerX + 7 + xOffset) * ps,
        (centerY + 2 + yOffset) * ps + offset,
        ps * 3,
        ps * 2
      );
      ctx.fillStyle = '#FFF';
      ctx.fillRect(
        (centerX + 9 + xOffset) * ps,
        (centerY + 2 + yOffset) * ps + offset,
        ps * 1.5,
        ps * 2
      );
      if (i % 3 === 0) {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(
          (centerX + 10 + xOffset) * ps,
          (centerY + 2.5 + yOffset) * ps + offset,
          ps * 0.8,
          ps
        );
      }
    }

    if (equippedSlot !== 'head') {
      ctx.fillStyle = '#DC143C';
      ctx.fillRect((centerX - 1.5) * ps, (centerY - 5) * ps + offset, ps * 3, ps * 0.4);
      ctx.fillRect((centerX - 1) * ps, (centerY - 4.5) * ps + offset, ps * 0.4, ps * 1.5);
      ctx.fillRect((centerX + 0.6) * ps, (centerY - 4.5) * ps + offset, ps * 0.4, ps * 1.5);
    }

    if (equippedSlot !== 'neck') {
      ctx.fillStyle = '#FFD700';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc((centerX + i * 1.5) * ps, (centerY + 3) * ps + offset, ps * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mystische Linien
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 1) * ps + offset);
    ctx.lineTo((centerX - 5) * ps, (centerY - 0.5) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, centerY * ps + offset);
    ctx.lineTo((centerX - 5) * ps, (centerY + 0.5) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX + 4) * ps, (centerY - 1) * ps + offset);
    ctx.lineTo((centerX + 5) * ps, (centerY - 0.5) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX + 4) * ps, centerY * ps + offset);
    ctx.lineTo((centerX + 5) * ps, (centerY + 0.5) * ps + offset);
    ctx.stroke();

    // Spirituelle Flammen + leuchtende Ohrenspitzen
    if (animated) {
      const flamePhase = frame * 0.06 * animationSpeed;
      for (let i = 0; i < 9; i++) {
        const angle = (i - 4) * 0.25;
        const xOff = Math.sin(angle) * 3;
        const yOff = Math.abs(i - 4) * 0.8;
        const flameAlpha = 0.3 + Math.sin(flamePhase + i * 0.7) * 0.2;
        ctx.fillStyle = `rgba(65, 105, 225, ${flameAlpha})`;
        ctx.fillRect(
          (centerX + 10 + xOff) * ps,
          (centerY + 2 + yOff) * ps + offset,
          ps * 1.2,
          ps * 1.2
        );
      }
    }
    ctx.fillStyle = '#87CEEB88';
    ctx.fillRect((centerX - 2) * ps, (centerY - 9.5) * ps + offset, ps, ps * 0.5);
    ctx.fillRect((centerX + 1) * ps, (centerY - 9.5) * ps + offset, ps, ps * 0.5);

    // Himmlisches Fellmuster + göttliches Stirnsymbol
    if (animated) {
      const starPhase = frame * 0.03 * animationSpeed;
      const starPositions = [
        { x: centerX - 1, y: centerY + 3 },
        { x: centerX + 1, y: centerY + 5 },
        { x: centerX - 2, y: centerY + 6 },
        { x: centerX + 2, y: centerY + 4 },
      ];
      for (let i = 0; i < starPositions.length; i++) {
        const starAlpha = 0.2 + Math.sin(starPhase + i * 1.5) * 0.2;
        ctx.fillStyle = `rgba(255, 215, 0, ${starAlpha})`;
        ctx.fillRect(starPositions[i].x * ps, starPositions[i].y * ps + offset, ps * 0.5, ps * 0.5);
      }
    }

    if (equippedSlot !== 'head') {
      ctx.fillStyle = '#DC143C';
      ctx.fillRect((centerX - 2) * ps, (centerY - 5.5) * ps + offset, ps * 4, ps * 0.5);
      ctx.fillRect((centerX - 1.5) * ps, (centerY - 5) * ps + offset, ps * 0.5, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY - 5) * ps + offset, ps * 0.5, ps * 2);

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY - 5) * ps + offset, ps * 1, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const rayAngle = (i / 8) * Math.PI * 2;
        const rx = centerX * ps + Math.cos(rayAngle) * ps * 1.5;
        const ry = (centerY - 5) * ps + offset + Math.sin(rayAngle) * ps * 1.5;
        ctx.fillRect(rx - ps * 0.15, ry - ps * 0.15, ps * 0.3, ps * 0.3);
      }
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = ps * 4;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY - 5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Göttlicher Glow um alle Schwänze
    if (animated) {
      const divinePhase = frame * 0.04 * animationSpeed;
      for (let i = 0; i < 9; i++) {
        const angle = (i - 4) * 0.25;
        const xOff = Math.sin(angle) * 3;
        const yOff = Math.abs(i - 4) * 0.8;
        const glowAlpha = 0.15 + Math.sin(divinePhase + i * 0.5) * 0.1;
        ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
        ctx.fillRect((centerX + 2 + xOff) * ps, (centerY + 2 + yOff) * ps + offset, ps * 9, ps * 3);
      }
    }
  }

  // === STUFE 6 (Lv30-39): VETERAN ===
  if (level >= 30) {
    // Kampfnarbe über dem linken Auge
    ctx.strokeStyle = '#FFF8';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 3) * ps + offset);
    ctx.lineTo((centerX - 2) * ps, (centerY - 1) * ps + offset);
    ctx.stroke();

    // Dichteres Fell um den Hals
    ctx.fillStyle = color + 'CC';
    for (let i = -3; i <= 3; i++) {
      const h = 2.5 - Math.abs(i) * 0.3;
      ctx.fillRect((centerX + i * 0.9) * ps, (centerY + 1) * ps + offset, ps * 0.7, ps * h);
    }

    // Verstärkte Wangenstreifen (3 Linien statt 2)
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 1.5) * ps + offset);
    ctx.lineTo((centerX - 5.5) * ps, (centerY - 1) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX + 4) * ps, (centerY - 1.5) * ps + offset);
    ctx.lineTo((centerX + 5.5) * ps, (centerY - 1) * ps + offset);
    ctx.stroke();
  }

  // === STUFE 7 (Lv40-49): ELITE ===
  if (level >= 40) {
    // Rüstungsartige Muster (japanische Krieger-Markierungen)
    ctx.strokeStyle = '#DC143C66';
    ctx.lineWidth = ps * 0.25;
    // Brust-Symbol
    ctx.beginPath();
    ctx.moveTo(centerX * ps, (centerY + 2.5) * ps + offset);
    ctx.lineTo((centerX + 1.5) * ps, (centerY + 4) * ps + offset);
    ctx.lineTo(centerX * ps, (centerY + 5.5) * ps + offset);
    ctx.lineTo((centerX - 1.5) * ps, (centerY + 4) * ps + offset);
    ctx.closePath();
    ctx.stroke();

    // Leuchtende Ohrenspitzen
    ctx.shadowColor = '#4169E1';
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = '#4169E188';
    ctx.fillRect((centerX - 2) * ps, (centerY - 9) * ps + offset, ps, ps * 0.5);
    ctx.fillRect((centerX + 1) * ps, (centerY - 9) * ps + offset, ps, ps * 0.5);
    ctx.shadowBlur = 0;

    // Verstärkte blaue Flammen an den Pfoten
    ctx.fillStyle = '#4169E1AA';
    ctx.fillRect((centerX - 3.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.8, ps * 0.8);
    ctx.fillRect((centerX + 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.8, ps * 0.8);
  }
};

// === GÖTTLICHE KITSUNE-FORM (Level 50+) ===
function drawDivineKitsune(
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  _dark: string,
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

  // Göttliche Kitsune — eleganter, majestätischer Fuchs
  // Eleganter Kopf (etwas schmaler, nobler)
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 4) * ps, (centerY - 5) * ps + offset, ps * 8, ps * 5);
  ctx.fillRect((centerX - 3) * ps, (centerY - 6) * ps + offset, ps * 6, ps);

  // Spitze, elegante Schnauze
  ctx.fillRect((centerX - 5) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX - 6) * ps, centerY * ps + offset, ps * 2, ps);

  // Große, majestätische Ohren (mit inneren Flammen)
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 5) * ps, (centerY - 7) * ps + offset, ps * 3, ps * 3);
  ctx.fillRect((centerX - 4) * ps, (centerY - 10) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 7) * ps + offset, ps * 3, ps * 3);
  ctx.fillRect((centerX + 2) * ps, (centerY - 10) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps);

  // Blaues Feuer in den Ohren
  ctx.fillStyle = '#4169E1' + bodyAlpha;
  ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 8) * ps + offset, ps, ps * 2);
  if (animated) {
    const earFlame = 0.3 + Math.sin(frame * 0.08 * animationSpeed) * 0.2;
    ctx.fillStyle = `rgba(65, 105, 225, ${earFlame})`;
    ctx.fillRect((centerX - 3) * ps, (centerY - 10) * ps + offset, ps, ps);
    ctx.fillRect((centerX + 2) * ps, (centerY - 10) * ps + offset, ps, ps);
  }

  // Weiße Wangen (größer, nobler)
  ctx.fillStyle = '#FFF' + bodyAlpha;
  ctx.fillRect((centerX - 5) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 3);
  ctx.fillRect((centerX + 2.5) * ps, (centerY - 2) * ps + offset, ps * 2.5, ps * 3);

  // Eleganter Körper
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 6, ps * 8);
  ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps * 4, ps * 2);

  // Weißer Bauch mit goldenem Schimmer
  ctx.fillStyle = '#FFF' + bodyAlpha;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);
  if (animated) {
    const shimmer = 0.1 + Math.sin(frame * 0.03 * animationSpeed) * 0.08;
    ctx.fillStyle = `rgba(255, 215, 0, ${shimmer})`;
    ctx.fillRect((centerX - 1.5) * ps, (centerY + 3) * ps + offset, ps * 3, ps * 4);
  }

  // Elegante Beine
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
  ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
  // Schwarze Socken mit blauen Flammen
  ctx.fillStyle = '#000' + bodyAlpha;
  ctx.fillRect((centerX - 3) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
  // Blaue Flammen an den Pfoten
  if (animated) {
    const pawFlame = 0.3 + Math.sin(frame * 0.06 * animationSpeed) * 0.2;
    ctx.fillStyle = `rgba(65, 105, 225, ${pawFlame})`;
    ctx.fillRect((centerX - 3.5) * ps, (centerY + 12) * ps + offset, ps, ps);
    ctx.fillRect((centerX + 2) * ps, (centerY + 12) * ps + offset, ps, ps);
  }

  // === 9 GÖTTLICHE SCHWÄNZE (das Hauptmerkmal) ===
  const tailGlow = isLegend ? 0.3 : 0.2;
  for (let i = 0; i < 9; i++) {
    const angle = (i - 4) * 0.25;
    const xOff = Math.sin(angle) * 3;
    const yOff = Math.abs(i - 4) * 0.8;

    // Schwanz-Körper
    ctx.fillStyle = (i % 2 === 0 ? color : light) + bodyAlpha;
    ctx.fillRect((centerX + 3 + xOff) * ps, (centerY + 3 + yOff) * ps + offset, ps * 5, ps * 2);
    ctx.fillRect((centerX + 7 + xOff) * ps, (centerY + 2 + yOff) * ps + offset, ps * 3, ps * 2);

    // Weiße Spitzen
    ctx.fillStyle = '#FFF' + bodyAlpha;
    ctx.fillRect((centerX + 9 + xOff) * ps, (centerY + 2 + yOff) * ps + offset, ps * 1.5, ps * 2);

    // Spirituelle Flammen an jeder Schwanzspitze
    if (animated) {
      const flamePhase = frame * 0.06 * animationSpeed;
      const flameAlpha = tailGlow + Math.sin(flamePhase + i * 0.7) * 0.15;
      ctx.fillStyle = `rgba(65, 105, 225, ${flameAlpha})`;
      ctx.fillRect(
        (centerX + 10 + xOff) * ps,
        (centerY + 2 + yOff) * ps + offset,
        ps * 1.5,
        ps * 1.5
      );
      ctx.fillStyle = `rgba(135, 206, 235, ${flameAlpha * 0.7})`;
      ctx.fillRect(
        (centerX + 10.5 + xOff) * ps,
        (centerY + 2.5 + yOff) * ps + offset,
        ps * 0.8,
        ps * 0.8
      );
    }
  }

  // Goldener Glow um Schwänze
  if (animated) {
    const divinePhase = frame * 0.04 * animationSpeed;
    for (let i = 0; i < 9; i++) {
      const angle = (i - 4) * 0.25;
      const xOff = Math.sin(angle) * 3;
      const yOff = Math.abs(i - 4) * 0.8;
      const glowAlpha = 0.1 + Math.sin(divinePhase + i * 0.5) * 0.08;
      ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
      ctx.fillRect((centerX + 2 + xOff) * ps, (centerY + 2 + yOff) * ps + offset, ps * 10, ps * 3);
    }
  }

  // Rote mystische Augen (intensiver)
  const eyeColor = isLegend ? '#FFD700' : '#DC143C';
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.4, ps * 1.2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 2.5) * ps + offset, ps * 0.4, ps * 1.2);
  // Augen-Glühen
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = ps * 3;
  ctx.fillStyle = eyeColor + '88';
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
  ctx.shadowBlur = 0;

  // Nase
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 0.5) * ps, (centerY + 0.5) * ps + offset, ps, ps * 0.5);

  // Mystische Wangenstreifen (3 pro Seite)
  ctx.strokeStyle = '#DC143C' + bodyAlpha;
  ctx.lineWidth = ps * 0.3;
  for (let j = 0; j < 3; j++) {
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 1.5 + j * 0.8) * ps + offset);
    ctx.lineTo((centerX - 5.5) * ps, (centerY - 1 + j * 0.8) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX + 4) * ps, (centerY - 1.5 + j * 0.8) * ps + offset);
    ctx.lineTo((centerX + 5.5) * ps, (centerY - 1 + j * 0.8) * ps + offset);
    ctx.stroke();
  }

  // Goldene Magatama-Kette (nur ohne Neck)
  if (equippedSlot !== 'neck') {
    ctx.fillStyle = '#FFD700' + bodyAlpha;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc((centerX + i * 1.2) * ps, (centerY + 2.5) * ps + offset, ps * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Goldener Glow um die Kette
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = '#FFD70044';
    ctx.fillRect((centerX - 4) * ps, (centerY + 2) * ps + offset, ps * 8, ps * 1.2);
    ctx.shadowBlur = 0;
  }

  // Göttliches Stirnsymbol (nur ohne Head)
  if (equippedSlot !== 'head') {
    // Großes Torii-Symbol
    ctx.fillStyle = '#DC143C' + bodyAlpha;
    ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps * 4, ps * 0.5);
    ctx.fillRect((centerX - 1.5) * ps, (centerY - 5.5) * ps + offset, ps * 0.5, ps * 2);
    ctx.fillRect((centerX + 1) * ps, (centerY - 5.5) * ps + offset, ps * 0.5, ps * 2);

    // Goldener Sonnenstein
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 6.5) * ps + offset, ps * 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 6.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Strahlen um den Sonnenstein
    for (let i = 0; i < 8; i++) {
      const rayAngle = (i / 8) * Math.PI * 2;
      const rx = centerX * ps + Math.cos(rayAngle) * ps * 1.8;
      const ry = (centerY - 6.5) * ps + offset + Math.sin(rayAngle) * ps * 1.8;
      ctx.fillStyle = '#FFD700' + bodyAlpha;
      ctx.fillRect(rx - ps * 0.15, ry - ps * 0.15, ps * 0.3, ps * 0.3);
    }
  }

  // Himmlisches Sternenmuster im Fell
  if (animated) {
    const starPhase = frame * 0.025 * animationSpeed;
    const starPositions = [
      { x: centerX - 1.5, y: centerY + 3 },
      { x: centerX + 1, y: centerY + 5 },
      { x: centerX - 2, y: centerY + 6 },
      { x: centerX + 2, y: centerY + 4 },
      { x: centerX, y: centerY + 7 },
      { x: centerX - 1, y: centerY + 5 },
    ];
    for (let i = 0; i < starPositions.length; i++) {
      const starAlpha = 0.15 + Math.sin(starPhase + i * 1.2) * 0.15;
      ctx.fillStyle = `rgba(255, 215, 0, ${starAlpha})`;
      ctx.fillRect(starPositions[i].x * ps, starPositions[i].y * ps + offset, ps * 0.4, ps * 0.4);
    }
  }

  // === CHAMPION (Lv60+) ===
  if (isChampion) {
    // Spirituelle Aura um den Körper
    if (animated) {
      const auraPhase = frame * 0.03 * animationSpeed;
      const auraAlpha = 0.08 + Math.sin(auraPhase) * 0.05;
      ctx.fillStyle = `rgba(65, 105, 225, ${auraAlpha})`;
      ctx.beginPath();
      ctx.ellipse(centerX * ps, (centerY + 4) * ps + offset, 6 * ps, 8 * ps, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Verstärkte Ohrflammen
    if (animated) {
      const earFlame = 0.4 + Math.sin(frame * 0.08 * animationSpeed) * 0.3;
      ctx.fillStyle = `rgba(65, 105, 225, ${earFlame})`;
      ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps * 1.5);
      ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps * 1.5);
    }
  }

  // === LEGENDE (Lv75+) ===
  if (isLegend) {
    // Goldene Augen statt rote
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 5;
    ctx.fillStyle = '#FFD700DD';
    ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
    ctx.fillRect((centerX + 1.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
    ctx.shadowBlur = 0;

    // Heiliger Halo
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = ps * 0.5;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY - 13) * ps + offset, ps * 3.5, ps * 1, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Blaue Flammen-Spur unter dem Fuchs
    if (animated) {
      const trailPhase = frame * 0.04 * animationSpeed;
      for (let i = 0; i < 3; i++) {
        const tAlpha = 0.15 + Math.sin(trailPhase + i) * 0.1;
        ctx.fillStyle = `rgba(65, 105, 225, ${tAlpha})`;
        ctx.fillRect(
          (centerX - 3 - i) * ps,
          (centerY + 13 + i) * ps + offset,
          ps * (6 + i * 2),
          ps
        );
      }
    }
  }

  // === MYTHISCH (Lv100) ===
  if (isMythical) {
    // Ätherischer göttlicher Kitsune
    ctx.shadowColor = '#4169E1';
    ctx.shadowBlur = ps * 10;
    ctx.strokeStyle = '#4169E133';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY + 3) * ps + offset, 8 * ps, 10 * ps, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Geisterhafte Silhouette
    ctx.fillStyle = color + '1A';
    ctx.fillRect((centerX - 5) * ps, (centerY - 6) * ps + offset, ps * 10, ps * 7);

    // Leuchtende Augen (göttlich weiß-golden)
    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = ps * 8;
    ctx.fillStyle = '#FFFFFFDD';
    ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
    ctx.fillRect((centerX + 1.5) * ps, (centerY - 2.5) * ps + offset, ps * 2, ps * 1.2);
    ctx.shadowBlur = 0;

    // Doppelter Heiligenschein
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY - 14) * ps + offset, ps * 4, ps * 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(65, 105, 225, 0.4)';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY - 15) * ps + offset, ps * 5, ps * 1.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Alle Schwänze leuchten intensiv
    if (animated) {
      const mythPhase = frame * 0.05 * animationSpeed;
      for (let i = 0; i < 9; i++) {
        const angle = (i - 4) * 0.25;
        const xOff = Math.sin(angle) * 3;
        const yOff = Math.abs(i - 4) * 0.8;
        const mythAlpha = 0.2 + Math.sin(mythPhase + i * 0.4) * 0.15;
        ctx.fillStyle = `rgba(255, 255, 255, ${mythAlpha})`;
        ctx.fillRect((centerX + 8 + xOff) * ps, (centerY + 2 + yOff) * ps + offset, ps * 3, ps * 2);
      }
    }
  }
}
