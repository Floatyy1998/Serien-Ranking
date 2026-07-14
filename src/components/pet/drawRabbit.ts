import type { AccessorySlot } from '../../types/pet.types';

export const drawRabbit = (
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

  // STUFE 8+ (Lv50): MONDHASE / TSUKIMI-FORM
  if (level >= 50) {
    drawMoonRabbit(
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

  // STUFEN 1-7: NORMALER HASE (Lv1-49)

  const headSize =
    level >= 20 ? 1.2 : level >= 15 ? 1.15 : level >= 10 ? 1.1 : level >= 5 ? 1.05 : 1;
  const earHeight = level >= 20 ? 6 : level >= 15 ? 5.5 : level >= 10 ? 5 : level >= 5 ? 4 : 3;
  const bodyWidth = level >= 20 ? 12 : level >= 15 ? 11 : level >= 10 ? 10 : level >= 5 ? 9 : 8;

  // Ohren — breit, gespreizt nach außen, leicht abgewinkelt
  // Stufen-Treppe nach außen: je höher, desto weiter weg vom Zentrum
  const drawEar = (sign: number) => {
    // sign = -1 (links) oder +1 (rechts)
    const baseX = centerX + sign * 4.5;
    ctx.fillStyle = color;
    // Basis (breit, am Kopf angesetzt)
    ctx.fillRect((baseX - 1.5) * ps, (centerY - 4) * ps + offset, ps * 3, ps * 2);
    // Mittelteil
    ctx.fillRect((baseX + sign * 0.3 - 1.5) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 2);
    // Oberer Teil (weiter nach außen)
    ctx.fillRect((baseX + sign * 0.8 - 1.5) * ps, (centerY - 8) * ps + offset, ps * 3, ps * 2);
    // Spitze (abgerundet, am weitesten außen)
    if (earHeight >= 4) {
      ctx.fillRect(
        (baseX + sign * 1.2 - 1.2) * ps,
        (centerY - 9.5) * ps + offset,
        ps * 2.4,
        ps * 1.5
      );
    }
    if (earHeight >= 5) {
      ctx.fillRect((baseX + sign * 1.5 - 1) * ps, (centerY - 10.5) * ps + offset, ps * 2, ps * 1);
    }
    if (earHeight >= 6) {
      ctx.fillRect(
        (baseX + sign * 1.8 - 0.7) * ps,
        (centerY - 11.2) * ps + offset,
        ps * 1.4,
        ps * 0.7
      );
    }

    // Rosa Innenohr (etwas schmaler)
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect((baseX - 0.8) * ps, (centerY - 3.5) * ps + offset, ps * 1.6, ps * 1.5);
    ctx.fillRect((baseX + sign * 0.3 - 0.8) * ps, (centerY - 5.5) * ps + offset, ps * 1.6, ps * 2);
    ctx.fillRect((baseX + sign * 0.8 - 0.7) * ps, (centerY - 7.5) * ps + offset, ps * 1.4, ps * 2);
    if (earHeight >= 4) {
      ctx.fillRect((baseX + sign * 1.2 - 0.5) * ps, (centerY - 9) * ps + offset, ps * 1, ps * 1);
    }
  };
  drawEar(-1);
  drawEar(1);

  // Großer runder Kopf
  const hw = 5 * headSize;
  const hh = 5 * headSize;
  ctx.fillStyle = color;
  // Hauptkopf (Oval)
  ctx.fillRect((centerX - hw) * ps, (centerY - 3) * ps + offset, ps * (hw * 2), ps * hh);
  // Oberseite (schmaler)
  ctx.fillRect((centerX - hw + 1) * ps, (centerY - 4) * ps + offset, ps * (hw * 2 - 2), ps);
  // Unterseite (Kinn)
  ctx.fillRect((centerX - hw + 1) * ps, (centerY + hh - 3) * ps + offset, ps * (hw * 2 - 2), ps);

  // Helle Schnauze unten
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 0.5) * ps + offset, ps * 5, ps * 2);

  // Wangen-Tupfen
  ctx.fillStyle = '#FFD8E0';
  ctx.fillRect((centerX - 4) * ps, (centerY + 0.5) * ps + offset, ps * 1.5, ps * 1.5);
  ctx.fillRect((centerX + 2.5) * ps, (centerY + 0.5) * ps + offset, ps * 1.5, ps * 1.5);

  // Rundlicher Körper (breit, hockend)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - bodyWidth / 2) * ps, (centerY + 3) * ps + offset, ps * bodyWidth, ps * 7);
  // Bauch-Verbreiterung
  ctx.fillRect(
    (centerX - bodyWidth / 2 - 1) * ps,
    (centerY + 5) * ps + offset,
    ps * (bodyWidth + 2),
    ps * 4
  );
  // Unten abgerundet
  ctx.fillRect(
    (centerX - bodyWidth / 2 + 1) * ps,
    (centerY + 10) * ps + offset,
    ps * (bodyWidth - 2),
    ps * 1.5
  );

  // Weißer Bauch (groß, oval)
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 3) * ps, (centerY + 4) * ps + offset, ps * 6, ps * 6);
  ctx.fillRect((centerX - 4) * ps, (centerY + 5) * ps + offset, ps * 8, ps * 4);

  // Hinterbeine seitlich
  ctx.fillStyle = color;
  ctx.fillRect((centerX - bodyWidth / 2 - 1) * ps, (centerY + 9) * ps + offset, ps * 2.5, ps * 3);
  ctx.fillRect((centerX + bodyWidth / 2 - 1.5) * ps, (centerY + 9) * ps + offset, ps * 2.5, ps * 3);
  // Pfoten unten
  ctx.fillRect(
    (centerX - bodyWidth / 2 - 1.5) * ps,
    (centerY + 11) * ps + offset,
    ps * 3.5,
    ps * 1.5
  );
  ctx.fillRect(
    (centerX + bodyWidth / 2 - 2) * ps,
    (centerY + 11) * ps + offset,
    ps * 3.5,
    ps * 1.5
  );
  // Helle Sohlen
  ctx.fillStyle = light;
  ctx.fillRect(
    (centerX - bodyWidth / 2 - 1) * ps,
    (centerY + 12) * ps + offset,
    ps * 2.5,
    ps * 0.5
  );
  ctx.fillRect(
    (centerX + bodyWidth / 2 - 1.5) * ps,
    (centerY + 12) * ps + offset,
    ps * 2.5,
    ps * 0.5
  );

  // Vorderpfoten (zentral, klein)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 0.5) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 2);

  // Pom-Pom Schwanz
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX + bodyWidth / 2) * ps, (centerY + 6) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect(
    (centerX + bodyWidth / 2 + 0.5) * ps,
    (centerY + 5.5) * ps + offset,
    ps * 1.5,
    ps * 0.5
  );
  ctx.fillRect(
    (centerX + bodyWidth / 2 + 0.5) * ps,
    (centerY + 8) * ps + offset,
    ps * 1.5,
    ps * 0.5
  );

  // Augen (groß, glänzend, weit auseinander)
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 1.5, ps * 1.8);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 1) * ps + offset, ps * 1.5, ps * 1.8);
  // Glanzpunkte (weiß)
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 2.5) * ps, (centerY - 0.7) * ps + offset, ps * 0.5, ps * 0.6);
  ctx.fillRect((centerX + 2) * ps, (centerY - 0.7) * ps + offset, ps * 0.5, ps * 0.6);

  // Rosa Nase
  ctx.fillStyle = '#FF85A1';
  ctx.fillRect((centerX - 0.7) * ps, (centerY + 1) * ps + offset, ps * 1.4, ps * 0.7);
  ctx.fillRect((centerX - 0.4) * ps, (centerY + 1.7) * ps + offset, ps * 0.8, ps * 0.3);

  // Mund (Y-förmig)
  ctx.strokeStyle = '#222';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo(centerX * ps, (centerY + 2) * ps + offset);
  ctx.lineTo(centerX * ps, (centerY + 2.5) * ps + offset);
  ctx.moveTo(centerX * ps, (centerY + 2.5) * ps + offset);
  ctx.lineTo((centerX - 1) * ps, (centerY + 3) * ps + offset);
  ctx.moveTo(centerX * ps, (centerY + 2.5) * ps + offset);
  ctx.lineTo((centerX + 1) * ps, (centerY + 3) * ps + offset);
  ctx.stroke();

  // Stufe 3 (Lv5+): Schnurrhaare + Hasenzähne
  if (level >= 5) {
    ctx.strokeStyle = '#FFFFFFAA';
    ctx.lineWidth = ps * 0.25;
    ctx.beginPath();
    ctx.moveTo((centerX - 2) * ps, (centerY + 1.5) * ps + offset);
    ctx.lineTo((centerX - 5.5) * ps, (centerY + 1) * ps + offset);
    ctx.moveTo((centerX - 2) * ps, (centerY + 2) * ps + offset);
    ctx.lineTo((centerX - 5.5) * ps, (centerY + 2) * ps + offset);
    ctx.moveTo((centerX + 2) * ps, (centerY + 1.5) * ps + offset);
    ctx.lineTo((centerX + 5.5) * ps, (centerY + 1) * ps + offset);
    ctx.moveTo((centerX + 2) * ps, (centerY + 2) * ps + offset);
    ctx.lineTo((centerX + 5.5) * ps, (centerY + 2) * ps + offset);
    ctx.stroke();

    // Süße Hasenzähne
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX - 0.7) * ps, (centerY + 3) * ps + offset, ps * 0.5, ps * 0.8);
    ctx.fillRect((centerX + 0.2) * ps, (centerY + 3) * ps + offset, ps * 0.5, ps * 0.8);
  }

  // Stufe 4 (Lv10+): Rosa Wangen, dichteres Fell
  if (level >= 10) {
    ctx.fillStyle = '#FFB6C1AA';
    ctx.beginPath();
    ctx.arc((centerX - 3.5) * ps, (centerY + 1.3) * ps + offset, ps * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc((centerX + 3.5) * ps, (centerY + 1.3) * ps + offset, ps * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Fell-Linien am Bauch
    ctx.strokeStyle = dark + '55';
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.moveTo((centerX - 2) * ps, (centerY + 5) * ps + offset);
    ctx.lineTo((centerX - 2) * ps, (centerY + 7) * ps + offset);
    ctx.moveTo((centerX + 2) * ps, (centerY + 5) * ps + offset);
    ctx.lineTo((centerX + 2) * ps, (centerY + 7) * ps + offset);
    ctx.stroke();
  }

  // Stufe 5 (Lv20+): Kleeblatt + Funken
  if (level >= 20) {
    if (equippedSlot !== 'head') {
      ctx.fillStyle = '#50C878';
      // 4-blättriges Kleeblatt
      ctx.beginPath();
      ctx.arc((centerX - 0.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc((centerX + 0.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY - 3) * ps + offset, ps * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY - 2) * ps + offset, ps * 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Stiel
      ctx.fillStyle = '#3D8B5C';
      ctx.fillRect((centerX - 0.15) * ps, (centerY - 1.8) * ps + offset, ps * 0.3, ps * 0.7);
    }

    if (animated) {
      const sparklePhase = frame * 0.05 * animationSpeed;
      for (let i = 0; i < 4; i++) {
        const angle = sparklePhase + i * (Math.PI / 2);
        const sx = centerX * ps + Math.cos(angle) * ps * 8;
        const sy = (centerY + 2) * ps + offset + Math.sin(angle) * ps * 5;
        const alpha = 0.3 + Math.sin(sparklePhase * 2 + i) * 0.2;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fillRect(sx - ps * 0.2, sy - ps * 0.2, ps * 0.4, ps * 0.4);
      }
    }
  }

  // Stufe 6 (Lv30+): Veteran
  if (level >= 30) {
    ctx.strokeStyle = '#FFF8';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.moveTo((centerX + 1.2) * ps, (centerY - 2.5) * ps + offset);
    ctx.lineTo((centerX + 2.5) * ps, (centerY - 0.5) * ps + offset);
    ctx.stroke();

    ctx.fillStyle = dark;
    ctx.fillRect(
      (centerX - bodyWidth / 2 - 1) * ps,
      (centerY + 10) * ps + offset,
      ps * 0.5,
      ps * 2
    );
    ctx.fillRect(
      (centerX + bodyWidth / 2 + 0.5) * ps,
      (centerY + 10) * ps + offset,
      ps * 0.5,
      ps * 2
    );
  }

  // Stufe 7 (Lv40+): Elite
  if (level >= 40) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = '#FFD700AA';
    ctx.fillRect((centerX - 2.5) * ps, (centerY - 0.7) * ps + offset, ps * 0.5, ps * 0.6);
    ctx.fillRect((centerX + 2) * ps, (centerY - 0.7) * ps + offset, ps * 0.5, ps * 0.6);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFD700';
    ctx.fillRect((centerX - 0.7) * ps, (centerY + 5.5) * ps + offset, ps * 1.4, ps * 1);
    ctx.fillRect((centerX - 1.2) * ps, (centerY + 6) * ps + offset, ps * 2.4, ps * 0.4);
  }
};

// MONDHASE / TSUKIMI-FORM (Level 50+)
function drawMoonRabbit(
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
  const moonSilver = light + bodyAlpha;

  const earH = isLegend ? 9 : isChampion ? 8 : 7;

  // Lange majestätische Ohren, gespreizt
  const drawMoonEar = (sign: number) => {
    const baseX = centerX + sign * 5;
    ctx.fillStyle = mainColor;
    // Basis
    ctx.fillRect((baseX - 1.5) * ps, (centerY - 4) * ps + offset, ps * 3, ps * 2);
    for (let i = 0; i < earH - 1; i++) {
      ctx.fillRect(
        (baseX + sign * (0.3 + i * 0.3) - 1.5) * ps,
        (centerY - 6 - i * 1.2) * ps + offset,
        ps * 3,
        ps * 1.5
      );
    }
    // Spitze
    ctx.fillRect(
      (baseX + sign * (0.3 + (earH - 1) * 0.3) - 1) * ps,
      (centerY - 5 - (earH - 1) * 1.2 - 1) * ps + offset,
      ps * 2,
      ps * 1
    );

    // Silbernes Innenohr
    ctx.fillStyle = moonSilver;
    ctx.fillRect((baseX - 0.8) * ps, (centerY - 3.5) * ps + offset, ps * 1.6, ps * 1.5);
    for (let i = 0; i < earH - 2; i++) {
      ctx.fillRect(
        (baseX + sign * (0.3 + i * 0.3) - 0.8) * ps,
        (centerY - 5.5 - i * 1.2) * ps + offset,
        ps * 1.6,
        ps * 1.5
      );
    }
  };
  drawMoonEar(-1);
  drawMoonEar(1);

  // Mondsichel-Markierung an der Ohrenspitze
  ctx.fillStyle = '#FFFFFFCC';
  ctx.fillRect(
    (centerX - 5 - earH * 0.3) * ps,
    (centerY - 7 - earH) * ps + offset,
    ps * 0.8,
    ps * 0.3
  );
  ctx.fillRect(
    (centerX + 5 + earH * 0.3 - 0.8) * ps,
    (centerY - 7 - earH) * ps + offset,
    ps * 0.8,
    ps * 0.3
  );

  // Eleganter großer Kopf
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 6) * ps, (centerY - 3) * ps + offset, ps * 12, ps * 6);
  ctx.fillRect((centerX - 5) * ps, (centerY - 4) * ps + offset, ps * 10, ps);
  ctx.fillRect((centerX - 5) * ps, (centerY + 3) * ps + offset, ps * 10, ps);

  // Helle Schnauze
  ctx.fillStyle = moonSilver;
  ctx.fillRect((centerX - 3) * ps, (centerY + 0.5) * ps + offset, ps * 6, ps * 2.5);

  // Silberne Wangen
  ctx.fillStyle = light + bodyAlpha;
  ctx.fillRect((centerX - 5.5) * ps, (centerY + 0.5) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 3.5) * ps, (centerY + 0.5) * ps + offset, ps * 2, ps * 2);

  // Massiver runder Körper
  const bodyW = isLegend ? 14 : isChampion ? 13 : 12;
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - bodyW / 2) * ps, (centerY + 3) * ps + offset, ps * bodyW, ps * 8);
  ctx.fillRect(
    (centerX - bodyW / 2 - 1) * ps,
    (centerY + 5) * ps + offset,
    ps * (bodyW + 2),
    ps * 4
  );
  ctx.fillRect(
    (centerX - bodyW / 2 + 1) * ps,
    (centerY + 11) * ps + offset,
    ps * (bodyW - 2),
    ps * 1.5
  );

  // Mond-Bauch
  ctx.fillStyle = moonSilver;
  ctx.fillRect((centerX - 4) * ps, (centerY + 4) * ps + offset, ps * 8, ps * 6);
  ctx.fillRect((centerX - 5) * ps, (centerY + 5) * ps + offset, ps * 10, ps * 4);

  if (animated) {
    const shimmer = 0.15 + Math.sin(frame * 0.04 * animationSpeed) * 0.1;
    ctx.fillStyle = `rgba(200, 220, 255, ${shimmer})`;
    ctx.fillRect((centerX - 4) * ps, (centerY + 5) * ps + offset, ps * 8, ps * 3);
  }

  // Hinterbeine
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - bodyW / 2 - 1) * ps, (centerY + 9) * ps + offset, ps * 3, ps * 3);
  ctx.fillRect((centerX + bodyW / 2 - 2) * ps, (centerY + 9) * ps + offset, ps * 3, ps * 3);
  // Pfoten
  ctx.fillRect((centerX - bodyW / 2 - 1.5) * ps, (centerY + 11) * ps + offset, ps * 4, ps * 1.5);
  ctx.fillRect((centerX + bodyW / 2 - 2.5) * ps, (centerY + 11) * ps + offset, ps * 4, ps * 1.5);
  // Silberne Sohlen
  ctx.fillStyle = moonSilver;
  ctx.fillRect((centerX - bodyW / 2 - 1) * ps, (centerY + 12) * ps + offset, ps * 3, ps * 0.6);
  ctx.fillRect((centerX + bodyW / 2 - 2) * ps, (centerY + 12) * ps + offset, ps * 3, ps * 0.6);

  // Vorderpfoten
  ctx.fillStyle = mainColor;
  ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 2);

  // Großer leuchtender Mond-Pom-Pom
  ctx.fillStyle = '#FFF' + bodyAlpha;
  ctx.fillRect((centerX + bodyW / 2) * ps, (centerY + 5) * ps + offset, ps * 3, ps * 3);
  ctx.fillRect((centerX + bodyW / 2 + 0.5) * ps, (centerY + 4.5) * ps + offset, ps * 2, ps * 0.5);
  ctx.fillRect((centerX + bodyW / 2 + 0.5) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 0.5);

  if (animated) {
    const pomGlow = 0.2 + Math.sin(frame * 0.05 * animationSpeed) * 0.15;
    ctx.fillStyle = `rgba(230, 230, 255, ${pomGlow})`;
    ctx.fillRect((centerX + bodyW / 2 - 0.5) * ps, (centerY + 4) * ps + offset, ps * 4.5, ps * 4.5);
  }

  // Mystische Augen
  const eyeColor = isLegend ? '#FFD700' : '#9CACFF';
  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
  ctx.fillRect((centerX + 1.7) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
  // Glow
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = ps * 3;
  ctx.fillStyle = eyeColor + '88';
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
  ctx.fillRect((centerX + 1.7) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
  ctx.shadowBlur = 0;
  // Pupillen
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY - 0.7) * ps + offset, ps * 0.6, ps * 1.2);
  ctx.fillRect((centerX + 2.2) * ps, (centerY - 0.7) * ps + offset, ps * 0.6, ps * 1.2);

  // Nase
  ctx.fillStyle = '#FF85A1';
  ctx.fillRect((centerX - 0.7) * ps, (centerY + 1) * ps + offset, ps * 1.4, ps * 0.7);

  // Süße Mondhasen-Zähne
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 0.7) * ps, (centerY + 2.5) * ps + offset, ps * 0.5, ps * 0.8);
  ctx.fillRect((centerX + 0.2) * ps, (centerY + 2.5) * ps + offset, ps * 0.5, ps * 0.8);

  // Mondstein-Symbol auf der Stirn
  if (equippedSlot !== 'head') {
    ctx.fillStyle = '#FFFFFF' + bodyAlpha;
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 4.5) * ps + offset, ps * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Halbmond
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc((centerX + 0.6) * ps, (centerY - 4.5) * ps + offset, ps * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#A9C4FF';
    ctx.shadowBlur = ps * 4;
    ctx.strokeStyle = '#A9C4FF' + bodyAlpha;
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 4.5) * ps + offset, ps * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Wangenmarkierungen
  ctx.fillStyle = '#A9C4FF' + bodyAlpha;
  for (let i = 0; i < 2; i++) {
    ctx.fillRect((centerX - 5.5) * ps, (centerY + 0.5 + i * 0.8) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 5) * ps, (centerY + 0.5 + i * 0.8) * ps + offset, ps * 0.5, ps * 0.5);
  }

  // Schnurrhaare
  ctx.strokeStyle = '#FFF' + bodyAlpha;
  ctx.lineWidth = ps * 0.25;
  ctx.beginPath();
  ctx.moveTo((centerX - 2) * ps, (centerY + 1.5) * ps + offset);
  ctx.lineTo((centerX - 6.5) * ps, (centerY + 1) * ps + offset);
  ctx.moveTo((centerX - 2) * ps, (centerY + 2) * ps + offset);
  ctx.lineTo((centerX - 6.5) * ps, (centerY + 2) * ps + offset);
  ctx.moveTo((centerX + 2) * ps, (centerY + 1.5) * ps + offset);
  ctx.lineTo((centerX + 6.5) * ps, (centerY + 1) * ps + offset);
  ctx.moveTo((centerX + 2) * ps, (centerY + 2) * ps + offset);
  ctx.lineTo((centerX + 6.5) * ps, (centerY + 2) * ps + offset);
  ctx.stroke();

  // Sternenstaub auf dem Bauch
  if (animated) {
    const dustPhase = frame * 0.03 * animationSpeed;
    const dustPositions = [
      { x: centerX - 2, y: centerY + 5.5 },
      { x: centerX + 1.5, y: centerY + 7 },
      { x: centerX - 1.5, y: centerY + 7.5 },
      { x: centerX + 0.5, y: centerY + 5.5 },
      { x: centerX - 0.5, y: centerY + 8 },
      { x: centerX + 2, y: centerY + 6 },
    ];
    for (let i = 0; i < dustPositions.length; i++) {
      const alpha = 0.25 + Math.sin(dustPhase + i * 1.3) * 0.15;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(dustPositions[i].x * ps, dustPositions[i].y * ps + offset, ps * 0.4, ps * 0.4);
    }
  }

  // CHAMPION (Lv60+)
  if (isChampion) {
    if (equippedSlot !== 'head') {
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = ps * 3;
      ctx.fillStyle = '#FFFFFFCC';
      ctx.fillRect(
        (centerX - 5 - earH * 0.3) * ps,
        (centerY - 8 - earH) * ps + offset,
        ps * 1,
        ps * 0.5
      );
      ctx.fillRect(
        (centerX + 5 + earH * 0.3 - 1) * ps,
        (centerY - 8 - earH) * ps + offset,
        ps * 1,
        ps * 0.5
      );
      ctx.shadowBlur = 0;
    }

    if (animated) {
      const auraPhase = frame * 0.03 * animationSpeed;
      const auraAlpha = 0.08 + Math.sin(auraPhase) * 0.05;
      ctx.fillStyle = `rgba(200, 220, 255, ${auraAlpha})`;
      ctx.beginPath();
      ctx.ellipse(centerX * ps, (centerY + 4) * ps + offset, 8 * ps, 10 * ps, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // LEGENDE (Lv75+)
  if (isLegend) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 5;
    ctx.fillStyle = '#FFD700DD';
    ctx.fillRect((centerX - 3.5) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
    ctx.fillRect((centerX + 1.7) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
    ctx.shadowBlur = 0;

    // Mond-Halo
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.6)';
    ctx.lineWidth = ps * 0.6;
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 11 - earH) * ps + offset, ps * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 230, 0.2)';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 11 - earH) * ps + offset, ps * 2.7, 0, Math.PI * 2);
    ctx.fill();

    if (animated) {
      const trailPhase = frame * 0.04 * animationSpeed;
      for (let i = 0; i < 4; i++) {
        const tx = centerX * ps + (Math.sin(trailPhase + i) * 4 - 2) * ps;
        const ty = (centerY + 14 + i * 0.3) * ps + offset;
        const tAlpha = 0.3 - i * 0.05;
        ctx.fillStyle = `rgba(255, 255, 200, ${tAlpha})`;
        ctx.fillRect(tx - ps * 0.3, ty, ps * 0.6, ps * 0.6);
      }
    }
  }

  // MYTHISCH (Lv100)
  if (isMythical) {
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = ps * 10;
    ctx.strokeStyle = '#FFFFFF33';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY + 3) * ps + offset, 10 * ps, 12 * ps, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (animated) {
      const constPhase = frame * 0.02 * animationSpeed;
      for (let i = 0; i < 7; i++) {
        const angle = constPhase + i * ((Math.PI * 2) / 7);
        const sx = centerX * ps + Math.cos(angle) * ps * 9;
        const sy = (centerY + 2) * ps + offset + Math.sin(angle) * ps * 7;
        const alpha = 0.4 + Math.sin(constPhase * 3 + i * 1.5) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(sx - ps * 0.3, sy - ps * 0.3, ps * 0.6, ps * 0.6);
        ctx.fillRect(sx - ps * 0.7, sy - ps * 0.1, ps * 1.4, ps * 0.2);
        ctx.fillRect(sx - ps * 0.1, sy - ps * 0.7, ps * 0.2, ps * 1.4);
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(
      centerX * ps,
      (centerY - 12 - earH) * ps + offset,
      ps * 4,
      ps * 1.2,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = ps * 8;
    ctx.fillStyle = '#FFFFFFDD';
    ctx.fillRect((centerX - 3.5) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
    ctx.fillRect((centerX + 1.7) * ps, (centerY - 1) * ps + offset, ps * 1.8, ps * 1.8);
    ctx.shadowBlur = 0;
  }
}
