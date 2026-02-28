import { PetAccessory } from '../../types/pet.types';

export const drawAccessory = (
  ctx: CanvasRenderingContext2D,
  accessory: PetAccessory,
  ps: number,
  offset: number
): void => {
  const centerX = 16;
  const centerY = 16;

  // Zeichne Accessoire basierend auf Typ - ALLE Accessoires deutlich sichtbar
  switch (accessory.type) {
    case 'hat':
      if (accessory.id === 'santaHat') {
        // Weihnachtsmütze - größer und deutlicher
        ctx.fillStyle = '#DC143C';
        ctx.fillRect((centerX - 4) * ps, (centerY - 12) * ps + offset, ps * 8, ps * 4);
        ctx.fillRect((centerX - 3) * ps, (centerY - 13) * ps + offset, ps * 6, ps);
        ctx.fillRect((centerX - 2) * ps, (centerY - 14) * ps + offset, ps * 4, ps);
        ctx.fillStyle = '#FFF';
        ctx.fillRect((centerX - 4) * ps, (centerY - 9) * ps + offset, ps * 8, ps);
        ctx.fillRect((centerX + 2) * ps, (centerY - 15) * ps + offset, ps * 2, ps * 2);
      } else if (accessory.id === 'partyHat') {
        // Partyhut - bunter und auffälliger
        ctx.fillStyle = '#FFD700';
        ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps * 6, ps * 2);
        ctx.fillRect((centerX - 2) * ps, (centerY - 13) * ps + offset, ps * 4, ps * 2);
        ctx.fillRect((centerX - 1) * ps, (centerY - 15) * ps + offset, ps * 2, ps * 2);
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(centerX * ps, (centerY - 16) * ps + offset, ps * 2, ps * 2);
      }
      break;
    case 'glasses':
      if (accessory.id === 'sunglasses') {
        // Sonnenbrille - größer und dunkler
        ctx.fillStyle = '#000';
        ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
        ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
        ctx.fillRect((centerX - 2) * ps, (centerY - 2.5) * ps + offset, ps * 4, ps);
        // Rahmen
        ctx.strokeStyle = '#333';
        ctx.lineWidth = ps * 0.3;
        ctx.strokeRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
        ctx.strokeRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
      }
      break;
    case 'crown':
      // Krone - viel größer und königlicher
      ctx.fillStyle = '#FFD700';
      ctx.fillRect((centerX - 4) * ps, (centerY - 9) * ps + offset, ps * 8, ps * 2);
      // Zacken
      ctx.fillRect((centerX - 3) * ps, (centerY - 12) * ps + offset, ps, ps * 3);
      ctx.fillRect((centerX - 1) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY - 12) * ps + offset, ps, ps * 3);
      ctx.fillRect((centerX + 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      // Juwelen - größer und bunter
      ctx.fillStyle = '#FF0000';
      ctx.fillRect((centerX - 2.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.8, ps * 0.8);
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(centerX * ps, (centerY - 8.5) * ps + offset, ps * 0.8, ps * 0.8);
      ctx.fillStyle = '#00FF00';
      ctx.fillRect((centerX + 2.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.8, ps * 0.8);
      break;
    case 'collar':
      // Halsband - dicker und auffälliger
      ctx.fillStyle = accessory.color || '#8B4513';
      ctx.fillRect((centerX - 5) * ps, (centerY + 3) * ps + offset, ps * 10, ps * 1.5);
      // Nieten
      ctx.fillStyle = '#C0C0C0';
      for (let i = -4; i <= 4; i += 2) {
        ctx.fillRect((centerX + i) * ps, (centerY + 3.2) * ps + offset, ps * 0.6, ps * 0.6);
      }
      // Anhänger - größer
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(centerX * ps, (centerY + 5.5) * ps + offset, ps * 1, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'bow':
      // Schleife - größer und auffälliger
      ctx.fillStyle = accessory.color || '#FF69B4';
      ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps);
      ctx.fillRect((centerX - 4) * ps, (centerY + 1.5) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY + 1.5) * ps + offset, ps * 3, ps * 2);
      // Mittelknoten
      ctx.fillStyle = '#CC1493';
      ctx.fillRect((centerX - 1) * ps, (centerY + 1.5) * ps + offset, ps * 2, ps * 2);
      break;
    case 'scarf':
      // Schal - viel deutlicher
      ctx.fillStyle = '#B22222';
      ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 10, ps * 2);
      // Fransen links
      ctx.fillRect((centerX - 7) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 3);
      ctx.fillRect((centerX - 8) * ps, (centerY + 6) * ps + offset, ps, ps * 2);
      // Fransen rechts
      ctx.fillRect((centerX + 5) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 3);
      ctx.fillRect((centerX + 7) * ps, (centerY + 6) * ps + offset, ps, ps * 2);
      // Muster
      ctx.fillStyle = '#FFF';
      for (let i = -4; i <= 4; i += 2) {
        ctx.fillRect((centerX + i) * ps, (centerY + 2.5) * ps + offset, ps * 0.5, ps * 0.5);
      }
      break;
    case 'bandana':
      // Bandana - sehr auffällig
      ctx.fillStyle = accessory.color || '#FF0000';
      ctx.fillRect((centerX - 6) * ps, (centerY - 5) * ps + offset, ps * 12, ps * 3);
      ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 8, ps);
      // Knoten hinten
      ctx.fillRect((centerX + 5) * ps, (centerY - 4) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX + 6) * ps, (centerY - 3) * ps + offset, ps, ps);
      // Muster
      ctx.fillStyle = '#FFF';
      for (let i = -3; i <= 3; i += 2) {
        ctx.fillRect((centerX + i) * ps, (centerY - 4.5) * ps + offset, ps * 0.8, ps * 0.8);
      }
      break;
    default:
      // Fallback für unbekannte Accessoire-Typen
      break;
  }
};
