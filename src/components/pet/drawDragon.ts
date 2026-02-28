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
  animationSpeed: number
): void => {
  const centerX = 16;
  const centerY = 16;

  // Kopf (länglich wie Echse)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 4) * ps, (centerY - 5) * ps + offset, ps * 8, ps * 5);
  ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 10, ps * 3);

  // Schnauze (spitz zulaufend)
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 6) * ps, (centerY - 2) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX - 7) * ps, (centerY - 1) * ps + offset, ps * 2, ps);

  // Hörner (gebogen)
  ctx.fillStyle = '#FFD700';
  // Linkes Horn
  ctx.fillRect((centerX - 3) * ps, (centerY - 6) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX - 4) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX - 5) * ps, (centerY - 8) * ps + offset, ps, ps);
  // Rechtes Horn
  ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 3) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 4) * ps, (centerY - 8) * ps + offset, ps, ps);

  // Nackenstacheln
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 1) * ps, (centerY - 5) * ps + offset, ps, ps);
  ctx.fillRect(centerX * ps, (centerY - 6) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 5) * ps + offset, ps, ps);

  // Körper (muskulös und schuppig)
  for (let y = 0; y < 10; y++) {
    const width = 8 - Math.abs(y - 5) * 0.5;
    // Schuppenmuster
    ctx.fillStyle = y % 2 === 0 ? color : dark;
    ctx.fillRect((centerX - width / 2) * ps, (centerY + y) * ps + offset, ps * width, ps);
  }

  // Bauch (heller, mit Schuppen-Textur)
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);
  // Bauchschuppen-Linien
  ctx.strokeStyle = color;
  ctx.lineWidth = ps * 0.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((centerX - 2) * ps, (centerY + 3 + i * 1.5) * ps + offset);
    ctx.lineTo((centerX + 2) * ps, (centerY + 3 + i * 1.5) * ps + offset);
    ctx.stroke();
  }

  // Flügel (Fledermaus-artig)
  const wingFlap = animated ? Math.sin(frame * 0.1 * animationSpeed) * 2 : 0;
  // Linker Flügel
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
  ctx.fillRect((centerX - 7 - wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
  // Flügelmembran
  ctx.fillStyle = color + '88';
  ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);

  // Rechter Flügel
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 2 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
  ctx.fillRect((centerX + 4 + wingFlap) * ps, centerY * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX + 7 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
  // Flügelmembran
  ctx.fillStyle = color + '88';
  ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);

  // Beine (kräftig mit Krallen)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
  ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
  // Krallen
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 3.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX - 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 0.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);

  // Schwanz (lang mit Stacheln)
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 3) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 2);
  ctx.fillRect((centerX + 6) * ps, (centerY + 5) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 8) * ps, (centerY + 4) * ps + offset, ps * 2, ps * 2);
  // Schwanzstacheln
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 4) * ps, (centerY + 5) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 6) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 8) * ps, (centerY + 3) * ps + offset, ps, ps * 2);
  // Schwanzspitze (Pfeil)
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 9) * ps, (centerY + 3) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 10) * ps, (centerY + 2) * ps + offset, ps, ps * 3);

  // Augen (reptilienartig)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 3) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  // Schlitzpupillen
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 3) * ps + offset, ps * 0.3, ps * 2);
  ctx.fillRect((centerX + 1.7) * ps, (centerY - 3) * ps + offset, ps * 0.3, ps * 2);
  // Rotes Glühen bei höherem Level
  if (level >= 5) {
    ctx.fillStyle = '#FF0000';
    ctx.fillRect((centerX - 2.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 1.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
  }

  // Nasenlöcher (Rauch)
  ctx.fillStyle = '#333';
  ctx.fillRect((centerX - 5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);
  ctx.fillRect((centerX - 4) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);

  // Feueratem Evolution
  if (level >= 3 && animated && Math.random() > 0.3) {
    const fireSize = 1 + (level - 3) * 0.15;
    // Farbe ändert sich dramatisch
    const fireColor =
      level >= 10 ? '#00FFFF' : level >= 7 ? '#9400FF' : level >= 5 ? '#FF1493' : '#FF4500';
    const innerColor =
      level >= 10 ? '#FFFFFF' : level >= 7 ? '#FF00FF' : level >= 5 ? '#FFB6C1' : '#FFD700';

    // Hauptfeuer
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

    // Inneres Feuer
    ctx.fillStyle = innerColor;
    ctx.fillRect(
      (centerX - 7 * fireSize) * ps,
      (centerY + 0.3) * ps + offset,
      ps * 1.5 * fireSize,
      ps * 0.8
    );

    // Level 5+ mehr Flammen
    if (level >= 5) {
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

    // Level 10+ Explosion
    if (level >= 10) {
      ctx.fillStyle = fireColor + '44';
      ctx.fillRect((centerX - 11) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 3);
    }
  }

  // Level Features
  if (level >= 5) {
    // Größere Flügel
    const wingFlap5 = animated ? Math.sin(frame * 0.1 * animationSpeed) * 1.5 : 0;
    ctx.fillStyle = dark + 'AA';
    ctx.fillRect((centerX - 6 - wingFlap5) * ps, centerY * ps + offset, ps * 2, ps * 6);
    ctx.fillRect((centerX + 4 + wingFlap5) * ps, centerY * ps + offset, ps * 2, ps * 6);
  }

  if (level >= 10) {
    // Drachenrüstung
    ctx.fillStyle = '#808080';
    ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps * 3);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 2.5) * ps + offset, ps * 5, ps * 2);
    // Goldene Verzierung
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((centerX - 0.5) * ps, (centerY + 3) * ps + offset, ps, ps * 0.5);
  }

  if (level >= 15) {
    // Kristallhörner (upgraden die goldenen)
    ctx.fillStyle = '#00CED1';
    ctx.fillRect((centerX - 5) * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 4) * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    // Kristall-Glanz
    ctx.fillStyle = '#E0FFFF';
    ctx.fillRect((centerX - 4.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.3, ps * 0.5);
    ctx.fillRect((centerX + 4.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.3, ps * 0.5);

    // Schuppenleuchten entlang des Rückens
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

  if (level >= 20) {
    // Runen auf der Rüstung
    ctx.fillStyle = '#00FFFF88';
    // Rune 1
    ctx.fillRect((centerX - 2) * ps, (centerY + 2.8) * ps + offset, ps * 0.3, ps * 1.5);
    ctx.fillRect((centerX - 2.3) * ps, (centerY + 3.2) * ps + offset, ps * 1, ps * 0.3);
    // Rune 2
    ctx.fillRect((centerX + 1.7) * ps, (centerY + 2.8) * ps + offset, ps * 0.3, ps * 1.5);
    ctx.fillRect((centerX + 1.3) * ps, (centerY + 3.2) * ps + offset, ps * 1, ps * 0.3);

    // Zweites Hornpaar (kleiner, dahinter)
    ctx.fillStyle = '#B0C4DE';
    ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps * 0.6, ps * 1.5);
    ctx.fillRect((centerX + 1.4) * ps, (centerY - 7) * ps + offset, ps * 0.6, ps * 1.5);
  }

  if (level >= 25) {
    // Kosmisches Feuer als permanente Aura um die Flügel
    if (animated) {
      const cosmicPhase = frame * 0.03 * animationSpeed;
      const wingFlap25 = Math.sin(frame * 0.1 * animationSpeed) * 2;
      // Linker Flügel-Aura
      ctx.fillStyle = `rgba(0, 255, 255, ${0.15 + Math.sin(cosmicPhase) * 0.1})`;
      ctx.fillRect((centerX - 10 - wingFlap25) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 7);
      // Rechter Flügel-Aura
      ctx.fillRect((centerX + 8 + wingFlap25) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 7);
    }

    // Drittes Auge auf der Stirn
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
};
