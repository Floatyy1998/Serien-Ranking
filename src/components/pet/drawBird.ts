export const drawBird = (ctx: CanvasRenderingContext2D, level: number, ps: number, color: string, dark: string, light: string, offset: number, animated: boolean, frame: number, animationSpeed: number): void => {
  const centerX = 16;
  const centerY = 16;
  const wingFlap = animated ? Math.sin(frame * 0.2 * animationSpeed) * 3 : 0;

  // Kopf (rund mit Federkrone)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY - 5) * ps + offset, ps * 6, ps * 5);
  ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps * 4, ps);

  // Federkamm oben (Papagei-Style)
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 7) * ps + offset, ps, ps * 2);

  // Bunter Kamm bei höherem Level
  if (level >= 5) {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(centerX * ps, (centerY - 9) * ps + offset, ps, ps * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((centerX - 1) * ps, (centerY - 9) * ps + offset, ps, ps);
  }

  // Körper (stromlinienförmig)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY) * ps + offset, ps * 6, ps * 8);
  ctx.fillRect((centerX - 2) * ps, (centerY + 8) * ps + offset, ps * 4, ps * 2);

  // Bauchbereich (heller)
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 5);

  // Flügel (detailliert mit Federn)
  // Linker Flügel
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 6 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
  // Flügelfedern
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 3) * ps + offset, ps, ps * 3);
  ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

  // Rechter Flügel
  ctx.fillStyle = dark;
  ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 6);
  ctx.fillRect((centerX + 5 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
  // Flügelfedern
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 7 + wingFlap) * ps, (centerY + 3) * ps + offset, ps, ps * 3);
  ctx.fillRect((centerX + 8 + wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

  // Schnabel (gebogen wie Papagei) - Farbe hängt von Vogelfarbe ab
  const beakColor = color === '#FFA500' ? '#DC143C' : '#FFA500'; // Dunkelrot wenn Vogel orange ist
  const beakTipColor = color === '#FFA500' ? '#8B0000' : '#FF8C00';
  ctx.fillStyle = beakColor;
  ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * 4, ps * 2);
  ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps);
  // Schnabelspitze
  ctx.fillStyle = beakTipColor;
  ctx.fillRect((centerX - 3) * ps, (centerY) * ps + offset, ps * 2, ps * 0.5);

  // Augen (groß und ausdrucksstark)
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 4) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
  // Iris
  ctx.fillStyle = '#4169E1';
  ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
  ctx.fillRect((centerX + 2) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
  // Pupille
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);
  ctx.fillRect((centerX + 2.2) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);

  // Level 3+ Kleiner bunter Kamm
  if (level >= 3) {
    // Einfacher roter Kamm
    ctx.fillStyle = '#FF6347';
    ctx.fillRect((centerX - 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
    ctx.fillRect((centerX - 0.5) * ps, (centerY - 9) * ps + offset, ps, ps);

    // Flügelspitzen bekommen Farbe
    ctx.fillStyle = '#00CED1';
    ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 6 + wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
  }

  // Level 5+ Bunter Kamm und Schwanz
  if (level >= 5) {
    // Dreifarbiger Kamm (Papagei-Style)
    ctx.fillStyle = '#FF1493';
    ctx.fillRect((centerX - 1.5) * ps, (centerY - 8) * ps + offset, ps, ps * 3);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect((centerX - 0.5) * ps, (centerY - 9) * ps + offset, ps, ps * 4);
    ctx.fillStyle = '#00CED1';
    ctx.fillRect((centerX + 0.5) * ps, (centerY - 8) * ps + offset, ps, ps * 3);

    // Bunte Schwanzfedern (3 Farben)
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect((centerX - 2) * ps, (centerY + 11) * ps + offset, ps, ps * 4);
    ctx.fillStyle = '#40E0D0';
    ctx.fillRect((centerX - 1) * ps, (centerY + 11) * ps + offset, ps, ps * 5);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(centerX * ps, (centerY + 11) * ps + offset, ps, ps * 4);
  }

  // Level 7+ Kakadu-Kamm
  if (level >= 7) {
    // Aufstellbarer Kamm (5 Federn)
    const crestColors = ['#FFD700', '#FF6347', '#FFD700', '#FF6347', '#FFD700'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = crestColors[i];
      const height = 4 - Math.abs(i - 2) * 0.8;
      ctx.fillRect((centerX - 2 + i * 0.8) * ps, (centerY - 7 - height) * ps + offset, ps * 0.7, ps * height);
    }

    // Flügel mit Farbverläufen
    const gradient = ctx.createLinearGradient(
      (centerX - 8) * ps, centerY * ps,
      (centerX - 3) * ps, centerY * ps
    );
    gradient.addColorStop(0, dark);
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, '#00CED1');
    ctx.fillStyle = gradient;
    ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 5, ps * 6);
    ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 5, ps * 6);

    // Längere bunte Schwanzfedern
    for (let i = 0; i < 3; i++) {
      const colors = ['#FF1493', '#00CED1', '#FFD700'];
      ctx.fillStyle = colors[i];
      ctx.fillRect((centerX - 1 + i - 1) * ps, (centerY + 11) * ps + offset, ps, ps * (5 + i));
      // Weiße Spitzen
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX - 1 + i - 1) * ps, (centerY + 16 + i) * ps + offset, ps, ps * 0.5);
    }
  }

  // Level 10+ Paradiesvogel (aber dezenter)
  if (level >= 10) {
    // Goldene Federkrone (7 Federn)
    for (let i = 0; i < 7; i++) {
      const height = 5 - Math.abs(i - 3) * 0.7;
      // Abwechselnd Gold und Rot
      ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF6347';
      ctx.fillRect((centerX - 3 + i * 0.9) * ps, (centerY - 8 - height) * ps + offset, ps * 0.8, ps * height);
      // Weiße Spitzen
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX - 3 + i * 0.9) * ps, (centerY - 8 - height) * ps + offset, ps * 0.8, ps * 0.3);
    }

    // Flügel mit mehreren Farben
    const wingColors = [dark, color, '#00CED1', '#9400D3', '#FF1493'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = wingColors[i];
      ctx.fillRect((centerX - 8 + i - wingFlap) * ps, (centerY + 1 + i) * ps + offset, ps * (6 - i), ps);
      ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1 + i) * ps + offset, ps * (6 - i), ps);
    }

    // Prächtiger Schwanz (5 lange Federn)
    const tailColors = ['#FF1493', '#00CED1', '#FFD700', '#9400D3', '#FF6347'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = tailColors[i];
      const length = 7 - Math.abs(i - 2);
      ctx.fillRect((centerX - 2 + i) * ps, (centerY + 10) * ps + offset, ps, ps * length);

      // Pfauenauge am Ende (nur bei mittleren Federn)
      if (i >= 1 && i <= 3) {
        ctx.fillStyle = '#00CED1';
        ctx.beginPath();
        ctx.arc((centerX - 2 + i + 0.5) * ps, (centerY + 9 + length) * ps + offset, ps * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc((centerX - 2 + i + 0.5) * ps, (centerY + 9 + length) * ps + offset, ps * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Füße (Krallen)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 9) * ps + offset, ps, ps * 2);
  // Krallen
  ctx.fillStyle = '#FFA500';
  ctx.fillRect((centerX - 2.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX - 1.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);

  // Level 10+ Goldene Krone
  if (level >= 10) {
    ctx.fillStyle = 'gold';
    ctx.fillRect((centerX - 2) * ps, (centerY - 10) * ps + offset, ps * 4, ps);
    ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
    ctx.fillRect(centerX * ps, (centerY - 11) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
  }

  if (level >= 15) {
    // Phoenix-Funken an den Flügelspitzen
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
      ctx.fillRect((centerX - 3 + i * 0.9) * ps, (centerY - 8 - height - 0.5) * ps + offset, ps * 0.8, ps * 0.5);
    }
  }

  if (level >= 20) {
    // Phoenix-Flammenfedern (Flügel brennen)
    if (animated) {
      const flamePhase = frame * 0.06 * animationSpeed;
      ctx.fillStyle = `rgba(255, 69, 0, ${0.2 + Math.sin(flamePhase) * 0.1})`;
      ctx.fillRect((centerX - 10 - wingFlap) * ps, (centerY) * ps + offset, ps * 5, ps * 7);
      ctx.fillRect((centerX + 5 + wingFlap) * ps, (centerY) * ps + offset, ps * 5, ps * 7);
      ctx.fillStyle = `rgba(255, 215, 0, ${0.15 + Math.sin(flamePhase + 1) * 0.1})`;
      ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 5);
      ctx.fillRect((centerX + 6 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 5);
    }
  }

  if (level >= 25) {
    // Vollständiger Phoenix - Flammen-Schweif
    if (animated) {
      const trailPhase = frame * 0.04 * animationSpeed;
      const trailColors = ['rgba(255, 69, 0, 0.3)', 'rgba(255, 140, 0, 0.25)', 'rgba(255, 215, 0, 0.2)'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = trailColors[i];
        const trailY = (centerY + 12 + i * 2) * ps + offset;
        const trailWidth = 4 + i * 2 + Math.sin(trailPhase + i) * 1;
        ctx.fillRect((centerX - trailWidth / 2) * ps, trailY, ps * trailWidth, ps * 2);
      }
    }

    // Heiliger Heiligenschein
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = ps * 0.4;
    ctx.beginPath();
    ctx.ellipse(centerX * ps, (centerY - 12) * ps + offset, ps * 3, ps * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
};
