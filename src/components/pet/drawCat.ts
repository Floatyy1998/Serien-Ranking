import { Pet } from '../../types/pet.types';

export const drawCat = (ctx: CanvasRenderingContext2D, _pet: Pet, level: number, ps: number, color: string, dark: string, light: string, offset: number): void => {
  const centerX = 16;
  const centerY = 16;

  // Evolution: Körpergröße wächst mit Level
  const headSize = level >= 10 ? 1.25 : level >= 7 ? 1.15 : level >= 3 ? 1.08 : 1;

  // Kopf (wird größer und ändert Form mit Level)
  ctx.fillStyle = color;
  // Hauptkopf
  ctx.fillRect((centerX - 4 * headSize) * ps, (centerY - 4) * ps + offset, ps * 8 * headSize, ps * 6);

  // Rundungen oben und unten ZUERST
  ctx.fillRect((centerX - 3 * headSize) * ps, (centerY - 5) * ps + offset, ps * 6 * headSize, ps);
  ctx.fillRect((centerX - 3 * headSize) * ps, (centerY + 2) * ps + offset, ps * 6 * headSize, ps);

  // Ohren Evolution (werden etwas spitzer)
  const earHeight = level >= 10 ? 3 : level >= 5 ? 2.5 : 2;
  ctx.fillStyle = dark;
  // Linkes Ohr
  ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX - 3) * ps, (centerY - 7) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps, ps * earHeight);
  // Rechtes Ohr
  ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 7) * ps + offset, ps * 2, ps);
  ctx.fillRect((centerX + 2) * ps, (centerY - 8) * ps + offset, ps, ps * earHeight);

  // Level 10+ kleine Ohrenbüschel
  if (level >= 10) {
    ctx.fillStyle = light;
    ctx.fillRect((centerX - 3) * ps, (centerY - 9) * ps + offset, ps * 0.3, ps * 0.5);
    ctx.fillRect((centerX + 2.7) * ps, (centerY - 9) * ps + offset, ps * 0.3, ps * 0.5);
  }

  // Ohren-Inneres (rosa)
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 6) * ps + offset, ps, ps);

  // KEINE MUSTER MEHR - sauberes Design

  // Körper Evolution (wird größer)
  const bodyWidth = level >= 10 ? 8 : level >= 7 ? 7.5 : level >= 3 ? 6.5 : 6;
  const bodyHeight = level >= 10 ? 8 : level >= 7 ? 7.5 : level >= 3 ? 6.5 : 6;
  ctx.fillStyle = color;
  ctx.fillRect((centerX - bodyWidth/2) * ps, (centerY + 3) * ps + offset, ps * bodyWidth, ps * bodyHeight);
  ctx.fillRect((centerX - 2) * ps, (centerY + 3 + bodyHeight) * ps + offset, ps * 4, ps * 2);

  // Level 7+ subtile Muskel-Definition
  if (level >= 7) {
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - bodyWidth/2 + 1) * ps, (centerY + 4) * ps + offset, ps * 0.3, ps * 2);
    ctx.fillRect((centerX + bodyWidth/2 - 1.3) * ps, (centerY + 4) * ps + offset, ps * 0.3, ps * 2);
  }

  // Bauch (heller)
  ctx.fillStyle = light;
  ctx.fillRect((centerX - 2) * ps, (centerY + 4) * ps + offset, ps * 4, ps * 4);

  // Pfoten
  ctx.fillStyle = dark;
  // Vorderpfoten
  ctx.fillRect((centerX - 3) * ps, (centerY + 9) * ps + offset, ps * 2, ps * 3);
  ctx.fillRect((centerX + 1) * ps, (centerY + 9) * ps + offset, ps * 2, ps * 3);
  // Hinterpfoten
  ctx.fillRect((centerX - 3) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
  ctx.fillRect((centerX + 1) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);

  // Schwanz Evolution (wird etwas flauschiger)
  const tailLength = level >= 10 ? 4 : level >= 5 ? 3.5 : 3;
  ctx.fillStyle = color;
  for (let i = 0; i < tailLength; i++) {
    const width = 2 + (level >= 7 ? 0.5 : 0);
    ctx.fillRect((centerX + 3 + i * 2) * ps, (centerY + 7 - i * 2) * ps + offset, ps * width, ps * 2);
  }

  // Level 5+ Gestreifter Schwanz
  if (level >= 5) {
    ctx.fillStyle = dark;
    for (let i = 0; i < tailLength; i += 2) {
      ctx.fillRect((centerX + 3 + i * 2) * ps, (centerY + 7 - i * 2) * ps + offset, ps * 2, ps * 0.3);
    }
  }

  // Schwanzspitze
  ctx.fillStyle = level >= 10 ? light : dark;
  ctx.fillRect((centerX + 3 + tailLength * 2) * ps, (centerY + 7 - tailLength * 2) * ps + offset, ps, ps * 2);

  // Gesicht Details
  // Augen Evolution (ändern Farbe deutlicher)
  const eyeColor = level >= 10 ? '#9400D3' : level >= 7 ? '#00CED1' : level >= 5 ? '#00FF7F' : '#00FF00'; // Violett > Türkis > Mint > Grün
  const eyeSize = level >= 7 ? 2.2 : 2;

  ctx.fillStyle = eyeColor;
  ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
  ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);

  // Pupillen (werden etwas schmaler)
  ctx.fillStyle = '#000';
  const pupilWidth = level >= 7 ? 0.4 : 0.5;
  ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * pupilWidth, ps);
  ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * pupilWidth, ps);

  // Level 10+ subtiles Leuchten
  if (level >= 10) {
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 1.5;
    ctx.fillStyle = eyeColor;
    ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
    ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
    ctx.shadowBlur = 0;
  }

  // Nase (klein, rosa)
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect((centerX - 0.5) * ps, (centerY) * ps + offset, ps, ps * 0.5);

  // Mund (Y-förmig)
  ctx.fillStyle = dark;
  ctx.fillRect((centerX - 1) * ps, (centerY + 0.5) * ps + offset, ps * 2, ps * 0.3);

  // SCHNURRHAARE (immer sichtbar!)
  ctx.strokeStyle = dark;
  ctx.lineWidth = ps * 0.3;
  // Links
  ctx.beginPath();
  ctx.moveTo((centerX - 4) * ps, (centerY - 1) * ps + offset);
  ctx.lineTo((centerX - 7) * ps, (centerY - 1.5) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX - 4) * ps, (centerY) * ps + offset);
  ctx.lineTo((centerX - 7) * ps, (centerY) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX - 4) * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX - 7) * ps, (centerY + 0.5) * ps + offset);
  ctx.stroke();
  // Rechts
  ctx.beginPath();
  ctx.moveTo((centerX + 4) * ps, (centerY - 1) * ps + offset);
  ctx.lineTo((centerX + 7) * ps, (centerY - 1.5) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX + 4) * ps, (centerY) * ps + offset);
  ctx.lineTo((centerX + 7) * ps, (centerY) * ps + offset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((centerX + 4) * ps, (centerY + 1) * ps + offset);
  ctx.lineTo((centerX + 7) * ps, (centerY + 0.5) * ps + offset);
  ctx.stroke();

  // Level-basierte Features
  if (level >= 3) {
    // Tiger-Streifen (deutlicher)
    ctx.fillStyle = dark;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect((centerX - 2.5) * ps, (centerY + 3 + i * 1.8) * ps + offset, ps * 5, ps * 0.4);
    }
  }

  if (level >= 5) {
    // Kleine Flügel-Ansätze
    ctx.fillStyle = light;
    ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);
    ctx.fillRect((centerX + 3.5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);
  }

  if (level >= 7) {
    // Größere Flügel
    ctx.fillStyle = color + '88';
    ctx.fillRect((centerX - 6) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX + 4) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillStyle = light;
    ctx.fillRect((centerX - 5.5) * ps, (centerY + 2) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 4.5) * ps, (centerY + 2) * ps + offset, ps, ps * 2);
  }

  if (level >= 10) {
    // Majestätische Krone + Mähne
    // Mähne
    ctx.fillStyle = dark;
    ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps, ps * 3);
    ctx.fillRect((centerX + 4) * ps, (centerY - 3) * ps + offset, ps, ps * 3);
    ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 8, ps * 0.5);

    // Goldene Krone
    ctx.fillStyle = 'gold';
    ctx.fillRect((centerX - 2) * ps, (centerY - 10) * ps + offset, ps * 4, ps);
    ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
    ctx.fillRect(centerX * ps, (centerY - 11) * ps + offset, ps, ps * 2);
    ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
    // Drei Juwelen
    ctx.fillStyle = '#FF1493';
    ctx.fillRect((centerX - 2) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
    ctx.fillStyle = '#00CED1';
    ctx.fillRect((centerX - 0.3) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
    ctx.fillStyle = '#9400D3';
    ctx.fillRect((centerX + 1.4) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
  }

  if (level >= 15) {
    // Leuchtende Schnurrhaarspitzen
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = ps * 3;
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.arc((centerX - 7) * ps, (centerY - 1.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.arc((centerX - 7) * ps, (centerY) * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.arc((centerX + 7) * ps, (centerY - 1.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.arc((centerX + 7) * ps, (centerY) * ps + offset, ps * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Größere, majestätischere Flügel
    ctx.fillStyle = color + '66';
    ctx.fillRect((centerX - 8) * ps, (centerY) * ps + offset, ps * 3, ps * 6);
    ctx.fillRect((centerX + 5) * ps, (centerY) * ps + offset, ps * 3, ps * 6);
    ctx.fillStyle = light + '88';
    ctx.fillRect((centerX - 7) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
    ctx.fillRect((centerX + 5.5) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
  }

  if (level >= 20) {
    // Runen-Markierungen auf dem Körper
    ctx.fillStyle = eyeColor + '66';
    // Rune links
    ctx.fillRect((centerX - 2) * ps, (centerY + 5) * ps + offset, ps * 0.4, ps * 2);
    ctx.fillRect((centerX - 2.5) * ps, (centerY + 5.5) * ps + offset, ps * 1.5, ps * 0.4);
    // Rune rechts
    ctx.fillRect((centerX + 1.6) * ps, (centerY + 5) * ps + offset, ps * 0.4, ps * 2);
    ctx.fillRect((centerX + 1.1) * ps, (centerY + 5.5) * ps + offset, ps * 1.5, ps * 0.4);

    // Doppelte Schwanzspitze (gespalten)
    ctx.fillStyle = light;
    ctx.fillRect((centerX + 3 + tailLength * 2) * ps, (centerY + 6 - tailLength * 2) * ps + offset, ps, ps);
    ctx.fillRect((centerX + 3 + tailLength * 2 + 1) * ps, (centerY + 7 - tailLength * 2) * ps + offset, ps, ps);
  }

  if (level >= 25) {
    // Drittes Auge auf der Stirn
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 4.5) * ps + offset, ps * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX * ps, (centerY - 4.5) * ps + offset, ps * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Leuchten um das dritte Auge
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
      ctx.arc((centerX + 4 + i * 2) * ps, (centerY + 7.5 - i * 2) * ps + offset, ps * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
