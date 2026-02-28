import { Pet } from '../../types/pet.types';

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
  animationSpeed: number
): void => {
  const centerX = 16;
  const centerY = 16;

  // Evolution: Vom Welpen zum Wolf-Hund
  const headSize = level >= 10 ? 1.3 : level >= 7 ? 1.2 : level >= 3 ? 1.1 : 1;

  // Kopf (wird wolfartiger mit Level)
  ctx.fillStyle = color;
  ctx.fillRect(
    (centerX - 4 * headSize) * ps,
    (centerY - 3) * ps + offset,
    ps * 8 * headSize,
    ps * 6
  );
  ctx.fillRect((centerX - 3 * headSize) * ps, (centerY - 4) * ps + offset, ps * 6 * headSize, ps);

  // Schnauze (hervorstehend)
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 1) * ps + offset, ps * 4, ps * 3);
  ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps * 2);

  // Ohren Evolution (werden etwas aufrechter)
  ctx.fillStyle = dark;
  if (level < 7) {
    // Hängende Ohren (werden allmählich aufrechter)
    const hangAmount = level >= 5 ? 4 : 5;
    ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 2, ps * hangAmount);
    ctx.fillRect((centerX - 6) * ps, (centerY - 2) * ps + offset, ps * 2, ps * (hangAmount - 1));
    ctx.fillRect((centerX + 3) * ps, (centerY - 3) * ps + offset, ps * 2, ps * hangAmount);
    ctx.fillRect((centerX + 4) * ps, (centerY - 2) * ps + offset, ps * 2, ps * (hangAmount - 1));
  } else {
    // Halb-aufrechte Ohren
    ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 2) * ps, (centerY - 4) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX + 4) * ps, (centerY - 3) * ps + offset, ps, ps * 2);
  }

  // Körper Evolution (wird deutlich kräftiger)
  const bodyWidth = level >= 10 ? 10 : level >= 7 ? 9 : level >= 3 ? 8.5 : 8;
  const bodyHeight = level >= 10 ? 9 : level >= 7 ? 8 : level >= 3 ? 7.5 : 7;
  ctx.fillStyle = color;
  ctx.fillRect(
    (centerX - bodyWidth / 2) * ps,
    (centerY + 4) * ps + offset,
    ps * bodyWidth,
    ps * bodyHeight
  );
  ctx.fillRect((centerX - 3) * ps, (centerY + 4 + bodyHeight) * ps + offset, ps * 6, ps);

  // Level 7+ dezente Muskeln
  if (level >= 7) {
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - 1) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 0.2);
  }

  // Bauch
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 3) * ps, (centerY + 6) * ps + offset, ps * 6, ps * 4);

  // Beine (stämmiger)
  ctx.fillStyle = color;
  // Vorderbeine
  ctx.fillRect((centerX - 4) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 4);
  ctx.fillRect((centerX + 2) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 4);
  // Hinterbeine
  ctx.fillRect((centerX - 4) * ps, (centerY + 12) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 2) * ps, (centerY + 12) * ps + offset, ps * 2, ps * 2);

  // Pfoten (dunkler)
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 4) * ps, (centerY + 13) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY + 13) * ps + offset, ps * 2, ps);

  // Schwanz (wedelt)
  const tailWag = animated ? Math.sin(frame * 0.15 * animationSpeed) * 2 : 0;
  ctx.fillStyle = color;
  ctx.fillRect((centerX + 4 + tailWag) * ps, (centerY + 6) * ps + offset, ps * 3, ps * 2);
  ctx.fillRect((centerX + 6 + tailWag) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 7 + tailWag) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

  // Gesicht Details
  // Augen Evolution (werden etwas intensiver)
  const eyeColor = level >= 10 ? '#DAA520' : level >= 7 ? '#CD853F' : '#8B4513'; // Goldbraun > Hellbraun > Braun
  const eyeShape = 2;

  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps * eyeShape);
  ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps * 2, ps * eyeShape);

  // Pupillen
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 2) * ps, (centerY - 1) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps, ps);
  // Glanzpunkte
  ctx.fillStyle = '#FFF';
  ctx.fillRect((centerX - 2.5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);

  // Nase (groß, schwarz)
  ctx.fillStyle = '#000';
  ctx.fillRect((centerX - 1) * ps, (centerY + 2.5) * ps + offset, ps * 2, ps * 1.5);
  // Nasenlöcher
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

  // Zunge (wenn glücklich)
  if (pet.happiness > 60) {
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect((centerX - 0.5) * ps, (centerY + 4.5) * ps + offset, ps * 1.5, ps * 2);
    ctx.fillRect(centerX * ps, (centerY + 6.5) * ps + offset, ps * 0.8, ps * 0.5);
  }

  // Level Features
  if (level >= 3) {
    // Fell-Flecken
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - 2) * ps, (centerY + 6) * ps + offset, ps * 1.5, ps * 1.5);
    ctx.fillRect((centerX + 1) * ps, (centerY + 7) * ps + offset, ps * 2, ps);
    ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps, ps * 1.5);
  }

  if (level >= 5) {
    // Reißzähne
    ctx.fillStyle = '#FFF';
    ctx.fillRect((centerX - 2) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 0.6);
    ctx.fillRect((centerX + 1.6) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 0.6);
  }

  if (level >= 7) {
    // Wolf-Mähne um den Hals
    ctx.fillStyle = dark;
    for (let i = -2; i <= 2; i++) {
      const height = 2.5 - Math.abs(i) * 0.3;
      ctx.fillRect((centerX + i * 1.5) * ps, (centerY + 3) * ps + offset, ps, ps * height);
    }
  }

  if (level >= 10) {
    // Alpha-Status
    // Leichtes Glühen
    ctx.shadowColor = color;
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = color;
    ctx.fillRect((centerX - 4) * ps, (centerY - 1) * ps + offset, ps * 8, ps * 0.1);
    ctx.shadowBlur = 0;

    // Stachelhalsband
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect((centerX - 4) * ps, (centerY + 4) * ps + offset, ps * 8, ps * 1.2);
    // Metallstacheln
    ctx.fillStyle = '#C0C0C0';
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect((centerX + i * 1.3) * ps, (centerY + 3.8) * ps + offset, ps * 0.4, ps * 0.8);
    }
    // Goldmedaillon
    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY + 6) * ps + offset, ps * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  if (level >= 15) {
    // Leuchtende Pfotenabdrücke unter dem Hund
    const pawGlow = animated ? 0.3 + Math.sin(frame * 0.04 * animationSpeed) * 0.2 : 0.3;
    ctx.fillStyle = `rgba(218, 165, 32, ${pawGlow})`;
    ctx.beginPath();
    ctx.arc((centerX - 3) * ps, (centerY + 14.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
    ctx.arc((centerX + 3) * ps, (centerY + 14.5) * ps + offset, ps * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Größere Wolf-Mähne
    ctx.fillStyle = dark;
    for (let i = -3; i <= 3; i++) {
      const height = 3.5 - Math.abs(i) * 0.4;
      ctx.fillRect((centerX + i * 1.2) * ps, (centerY + 2.5) * ps + offset, ps * 0.8, ps * height);
    }
  }

  if (level >= 20) {
    // Narben-Markierungen (leuchten)
    ctx.strokeStyle = `rgba(218, 165, 32, 0.5)`;
    ctx.lineWidth = ps * 0.4;
    // Narbe über dem linken Auge
    ctx.beginPath();
    ctx.moveTo((centerX - 4) * ps, (centerY - 2.5) * ps + offset);
    ctx.lineTo((centerX - 2) * ps, centerY * ps + offset);
    ctx.stroke();

    // Leuchtende Augen
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 3;
    ctx.fillStyle = eyeColor;
    ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps * eyeShape);
    ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps * 2, ps * eyeShape);
    ctx.shadowBlur = 0;
  }

  if (level >= 25) {
    // Fenrir-Ketten (gebrochen) an den Beinen
    ctx.fillStyle = '#808080';
    ctx.fillRect((centerX - 5) * ps, (centerY + 11) * ps + offset, ps * 1.5, ps * 0.5);
    ctx.fillRect((centerX - 5.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps * 1);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 11) * ps + offset, ps * 1.5, ps * 0.5);
    ctx.fillRect((centerX + 4.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps * 1);

    // Eisatem-Effekt
    if (animated && Math.random() > 0.4) {
      ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
      ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps);
      ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
      ctx.fillRect((centerX - 7) * ps, (centerY + 1.5) * ps + offset, ps * 2, ps * 0.8);
      ctx.fillStyle = 'rgba(224, 255, 255, 0.4)';
      ctx.fillRect((centerX - 6) * ps, (centerY + 2.3) * ps + offset, ps, ps * 0.5);
    }
  }
};
