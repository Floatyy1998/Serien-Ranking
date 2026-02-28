export const drawFox = (
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  _dark: string,
  light: string,
  offset: number,
  animated: boolean,
  frame: number,
  animationSpeed: number
): void => {
  const centerX = 16;
  const centerY = 16;

  // Kopf (spitze Schnauze)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 8, ps * 5);
  ctx.fillRect((centerX - 3) * ps, (centerY - 5) * ps + offset, ps * 6, ps);

  // Spitze Schnauze
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 5) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX - 6) * ps, centerY * ps + offset, ps * 2, ps);

  // Große spitze Ohren (charakteristisch für Füchse)
  ctx.fillStyle = color;
  // Linkes Ohr
  ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX - 2) * ps, (centerY - 9) * ps + offset, ps, ps);
  // Rechtes Ohr
  ctx.fillRect((centerX + 1) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 9) * ps + offset, ps, ps);

  // Ohren-Inneres (schwarz/dunkel)
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY - 7) * ps + offset, ps, ps * 2);

  // Weiße Wangen (charakteristisch)
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 4) * ps, (centerY - 2) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + 2) * ps, (centerY - 2) * ps + offset, ps * 2, ps * 3);

  // Körper (schlank und elegant)
  ctx.fillStyle = color;
  ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 6, ps * 8);
  ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps * 4, ps * 2);

  // Weißer Bauch/Brust
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);
  ctx.fillRect((centerX - 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 2);

  // Beine (schwarz am Ende)
  ctx.fillStyle = color;
  // Vorderbeine
  ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 3);
  // Hinterbeine
  ctx.fillRect((centerX - 3) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 2);

  // Schwarze "Socken"
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);

  // Buschiger Schwanz (das Markenzeichen!)
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 3) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 3);
  ctx.fillRect((centerX + 6) * ps, (centerY + 4) * ps + offset, ps * 3, ps * 4);
  ctx.fillRect((centerX + 8) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 5);
  ctx.fillRect((centerX + 9) * ps, centerY * ps + offset, ps * 2, ps * 4);

  // Weiße Schwanzspitze (typisch für Füchse)
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX + 9) * ps, (centerY - 1) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 10) * ps, (centerY - 2) * ps + offset, ps, ps * 2);

  // Augen (schmal und schlau)
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
  // Bernstein-farbene Iris
  ctx.fillStyle = '#FFA500';
  ctx.fillRect((centerX - 2.5) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);
  ctx.fillRect((centerX + 1.7) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);

  // Kleine schwarze Nase
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 0.5) * ps, (centerY + 0.5) * ps + offset, ps, ps * 0.5);

  // Mund (V-förmig)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo(centerX * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX - 1) * ps, (centerY + 1.5) * ps + offset);
  ctx.moveTo(centerX * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX + 1) * ps, (centerY + 1.5) * ps + offset);
  ctx.stroke();

  // Japanische Mythologie Evolution

  // Level 3+ Erste spirituelle Zeichen
  if (level >= 3) {
    // Zweiter Schwanz beginnt zu wachsen
    ctx.fillStyle = color;
    ctx.fillRect((centerX + 4) * ps, (centerY + 7) * ps + offset, ps * 3, ps * 1.5);
    ctx.fillRect((centerX + 6) * ps, (centerY + 6) * ps + offset, ps * 2, ps * 1.5);
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX + 7) * ps, (centerY + 6) * ps + offset, ps, ps);

    // Rote Markierungen auf Wangen (japanisch)
    ctx.fillStyle = '#DC143C';
    ctx.fillRect((centerX - 4.5) * ps, (centerY - 1) * ps + offset, ps * 0.8, ps * 0.8);
    ctx.fillRect((centerX + 3.7) * ps, (centerY - 1) * ps + offset, ps * 0.8, ps * 0.8);
  }

  // Level 5+ Torii-Tor Symbole und 3 Schwänze
  if (level >= 5) {
    // Dritter Schwanz
    ctx.fillStyle = light;
    ctx.fillRect((centerX + 3) * ps, (centerY + 4) * ps + offset, ps * 4, ps * 2);
    ctx.fillRect((centerX + 6) * ps, (centerY + 3) * ps + offset, ps * 2, ps * 2);
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX + 7) * ps, (centerY + 3) * ps + offset, ps, ps * 1.5);

    // Torii-Tor Symbol auf Stirn (vereinfacht)
    ctx.fillStyle = '#DC143C';
    ctx.fillRect((centerX - 1) * ps, (centerY - 5) * ps + offset, ps * 2, ps * 0.3);
    ctx.fillRect((centerX - 0.5) * ps, (centerY - 4.5) * ps + offset, ps * 0.3, ps);
    ctx.fillRect((centerX + 0.2) * ps, (centerY - 4.5) * ps + offset, ps * 0.3, ps);

    // Spirituelle blaue Flammen an Pfoten
    ctx.fillStyle = '#4169E1';
    ctx.fillRect((centerX - 3.5) * ps, (centerY + 12) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 1.5) * ps, (centerY + 12) * ps + offset, ps * 0.5, ps * 0.5);
    ctx.fillRect((centerX + 2.5) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 0.5);
  }

  // Level 7+ Inari-Fuchs mit 5 Schwänzen
  if (level >= 7) {
    // Fünf Schwänze
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

      // Spirituelle Flammen (blau/weiß)
      ctx.fillStyle = i % 2 === 0 ? '#87CEEB' : '#E0FFFF';
      ctx.fillRect((centerX + 7 + xOffset) * ps, (centerY + 1 + yOffset) * ps + offset, ps, ps);
    }

    // Magatama-Halskette (japanisches Symbol)
    ctx.fillStyle = '#2E8B57';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc((centerX + i * 1.5) * ps, (centerY + 3.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rote Augen mit spirituellem Glanz
    ctx.fillStyle = '#DC143C';
    ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
    ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX - 2.8) * ps, (centerY - 2.3) * ps + offset, ps * 0.3, ps * 0.3);
    ctx.fillRect((centerX + 2.5) * ps, (centerY - 2.3) * ps + offset, ps * 0.3, ps * 0.3);
  }

  // Level 10+ Kitsune mit 9 Schwänzen (klarer erkennbar)
  if (level >= 10) {
    // Neun Schwänze in Fächer-Formation
    for (let i = 0; i < 9; i++) {
      const angle = (i - 4) * 0.25;
      const xOffset = Math.sin(angle) * 3;
      const yOffset = Math.abs(i - 4) * 0.8;

      // Abwechselnde Farben für bessere Sichtbarkeit
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

      // Weiße Schwanzspitzen (typisch für Kitsune)
      ctx.fillStyle = '#FFF';
      ctx.fillRect(
        (centerX + 9 + xOffset) * ps,
        (centerY + 2 + yOffset) * ps + offset,
        ps * 1.5,
        ps * 2
      );

      // Blaue spirituelle Flamme nur an jedem 3. Schwanz
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

    // Rotes Torii-Symbol auf Stirn (einfacher)
    ctx.fillStyle = '#DC143C';
    // Horizontaler Balken
    ctx.fillRect((centerX - 1.5) * ps, (centerY - 5) * ps + offset, ps * 3, ps * 0.4);
    // Vertikale Pfosten
    ctx.fillRect((centerX - 1) * ps, (centerY - 4.5) * ps + offset, ps * 0.4, ps * 1.5);
    ctx.fillRect((centerX + 0.6) * ps, (centerY - 4.5) * ps + offset, ps * 0.4, ps * 1.5);

    // Goldene Magatama-Kette (deutlicher)
    ctx.fillStyle = '#FFD700';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc((centerX + i * 1.5) * ps, (centerY + 3) * ps + offset, ps * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rote mystische Linien an den Wangen
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = ps * 0.4;
    // Links
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 1) * ps + offset);
    ctx.lineTo((centerX - 5) * ps, (centerY - 0.5) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, centerY * ps + offset);
    ctx.lineTo((centerX - 5) * ps, (centerY + 0.5) * ps + offset);
    ctx.stroke();
    // Rechts
    ctx.beginPath();
    ctx.moveTo((centerX + 4) * ps, (centerY - 1) * ps + offset);
    ctx.lineTo((centerX + 5) * ps, (centerY - 0.5) * ps + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((centerX + 4) * ps, centerY * ps + offset);
    ctx.lineTo((centerX + 5) * ps, (centerY + 0.5) * ps + offset);
    ctx.stroke();
  }

  if (level >= 15) {
    // Intensivere spirituelle Flammen an allen Schwanzspitzen
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

    // Leuchtende Ohrenspitzen
    ctx.fillStyle = '#87CEEB88';
    ctx.fillRect((centerX - 2) * ps, (centerY - 9.5) * ps + offset, ps, ps * 0.5);
    ctx.fillRect((centerX + 1) * ps, (centerY - 9.5) * ps + offset, ps, ps * 0.5);
  }

  if (level >= 20) {
    // Himmlisches Fellmuster (leuchtende Sterne im Fell)
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

    // Größeres Torii-Symbol
    ctx.fillStyle = '#DC143C';
    ctx.fillRect((centerX - 2) * ps, (centerY - 5.5) * ps + offset, ps * 4, ps * 0.5);
    ctx.fillRect((centerX - 1.5) * ps, (centerY - 5) * ps + offset, ps * 0.5, ps * 2);
    ctx.fillRect((centerX + 1) * ps, (centerY - 5) * ps + offset, ps * 0.5, ps * 2);
  }

  if (level >= 25) {
    // Göttliche Kitsune-Form - Alle 9 Schwänze leuchten
    if (animated) {
      const divinePhase = frame * 0.04 * animationSpeed;
      for (let i = 0; i < 9; i++) {
        const angle = (i - 4) * 0.25;
        const xOff = Math.sin(angle) * 3;
        const yOff = Math.abs(i - 4) * 0.8;
        const glowAlpha = 0.15 + Math.sin(divinePhase + i * 0.5) * 0.1;
        // Goldener Glow um jeden Schwanz
        ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
        ctx.fillRect((centerX + 2 + xOff) * ps, (centerY + 2 + yOff) * ps + offset, ps * 9, ps * 3);
      }
    }

    // Göttliches Stirnsymbol (Sonne statt Torii)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5) * ps + offset, ps * 1, 0, Math.PI * 2);
    ctx.fill();
    // Sonnenstrahlen
    for (let i = 0; i < 8; i++) {
      const rayAngle = (i / 8) * Math.PI * 2;
      const rx = centerX * ps + Math.cos(rayAngle) * ps * 1.5;
      const ry = (centerY - 5) * ps + offset + Math.sin(rayAngle) * ps * 1.5;
      ctx.fillRect(rx - ps * 0.15, ry - ps * 0.15, ps * 0.3, ps * 0.3);
    }
    // Leuchten
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = ps * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};
