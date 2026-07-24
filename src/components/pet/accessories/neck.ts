import type { PetAnchors } from './shared';
import { darken, lighten } from './shared';

export function drawCollar(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors,
  color?: string
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const c = color || '#8B4513';
  // Weiches Lederband
  ctx.strokeStyle = c;
  ctx.lineWidth = ps * 1.1;
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, (ny + 0.1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1) * ps + off, (cx + nhw) * ps, (ny + 0.1) * ps + off);
  ctx.stroke();
  // Glanzkante oben
  ctx.strokeStyle = lighten(c, 40);
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx - nhw + 0.4) * ps, (ny - 0.15) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ny + 0.65) * ps + off,
    (cx + nhw - 0.4) * ps,
    (ny - 0.15) * ps + off
  );
  ctx.stroke();
  // Silberne Nieten mit Glanzpunkt
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = cx - nhw + 0.6 + t * (nhw * 2 - 1.2);
    const y = ny + 0.1 + Math.sin(t * Math.PI) * 0.8;
    ctx.fillStyle = '#CFD8DC';
    ctx.beginPath();
    ctx.arc(x * ps, y * ps + off, ps * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc((x - 0.07) * ps, (y - 0.07) * ps + off, ps * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ring und goldene Marke
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 1.3) * ps + off, ps * 0.26, 0, Math.PI * 2);
  ctx.stroke();
  const grad = ctx.createRadialGradient(
    (cx - 0.25) * ps,
    (ny + 1.95) * ps + off,
    ps * 0.1,
    cx * ps,
    (ny + 2.2) * ps + off,
    ps * 0.85
  );
  grad.addColorStop(0, '#FFE082');
  grad.addColorStop(1, '#DAA520');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 2.2) * ps + off, ps * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc((cx - 0.25) * ps, (ny + 1.95) * ps + off, ps * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBow(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors,
  color?: string
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const c = color || '#FF69B4';
  const dk = darken(c, 45);
  // Baender hinter der Schleife
  ctx.fillStyle = dk;
  ctx.beginPath();
  ctx.moveTo((cx - 0.3) * ps, (ny + 1) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 1.6) * ps,
    (ny + 2.2) * ps + off,
    (cx - 1.2) * ps,
    (ny + 3.4) * ps + off
  );
  ctx.lineTo((cx - 0.4) * ps, (ny + 3.1) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 0.7) * ps,
    (ny + 2) * ps + off,
    (cx - 0.1) * ps,
    (ny + 1.2) * ps + off
  );
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo((cx + 0.3) * ps, (ny + 1) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 1.6) * ps,
    (ny + 2.4) * ps + off,
    (cx + 1.1) * ps,
    (ny + 3.7) * ps + off
  );
  ctx.lineTo((cx + 0.3) * ps, (ny + 3.3) * ps + off);
  ctx.quadraticCurveTo((cx + 0.6) * ps, (ny + 2.1) * ps + off, cx * ps, (ny + 1.2) * ps + off);
  ctx.fill();
  // Weiche Schleifen
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse((cx - 1.9) * ps, (ny + 0.5) * ps + off, ps * 1.75, ps * 1.2, -0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1.9) * ps, (ny + 0.5) * ps + off, ps * 1.75, ps * 1.2, 0.22, 0, Math.PI * 2);
  ctx.fill();
  // Stofffalten
  ctx.strokeStyle = dk;
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.moveTo((cx - 0.6) * ps, (ny + 0.4) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 2.2) * ps,
    (ny + 0.2) * ps + off,
    (cx - 3) * ps,
    (ny + 0.9) * ps + off
  );
  ctx.moveTo((cx + 0.6) * ps, (ny + 0.4) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 2.2) * ps,
    (ny + 0.2) * ps + off,
    (cx + 3) * ps,
    (ny + 0.9) * ps + off
  );
  ctx.stroke();
  // Knoten mit Glanz
  ctx.fillStyle = dk;
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 0.5) * ps + off, ps * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lighten(c, 35);
  ctx.beginPath();
  ctx.arc((cx - 0.25) * ps, (ny + 0.25) * ps + off, ps * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBowtie(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Satin-Fluegel
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.ellipse((cx - 1.8) * ps, (ny + 0.55) * ps + off, ps * 1.6, ps * 1, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1.8) * ps, (ny + 0.55) * ps + off, ps * 1.6, ps * 1, 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Stofffalten
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.moveTo((cx - 0.5) * ps, (ny + 0.4) * ps + off);
  ctx.lineTo((cx - 2.6) * ps, (ny + 0.1) * ps + off);
  ctx.moveTo((cx - 0.5) * ps, (ny + 0.7) * ps + off);
  ctx.lineTo((cx - 2.6) * ps, (ny + 1) * ps + off);
  ctx.moveTo((cx + 0.5) * ps, (ny + 0.4) * ps + off);
  ctx.lineTo((cx + 2.6) * ps, (ny + 0.1) * ps + off);
  ctx.moveTo((cx + 0.5) * ps, (ny + 0.7) * ps + off);
  ctx.lineTo((cx + 2.6) * ps, (ny + 1) * ps + off);
  ctx.stroke();
  // Knoten
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 0.55) * ps + off, ps * 0.7, 0, Math.PI * 2);
  ctx.fill();
  // Seidenglanz
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse((cx - 2) * ps, (ny + 0.15) * ps + off, ps * 0.55, ps * 0.22, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1.6) * ps, (ny + 0.15) * ps + off, ps * 0.55, ps * 0.22, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx - 0.2) * ps, (ny + 0.3) * ps + off, ps * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

export function drawScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Gewickelter Schal
  ctx.strokeStyle = '#B22222';
  ctx.lineWidth = ps * 1.5;
  ctx.beginPath();
  ctx.moveTo((cx - nhw - 0.3) * ps, (ny + 0.1) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ny + 1.15) * ps + off,
    (cx + nhw + 0.3) * ps,
    (ny + 0.1) * ps + off
  );
  ctx.stroke();
  // Lichtkante oben
  ctx.strokeStyle = lighten('#B22222', 45);
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, (ny - 0.35) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.5) * ps + off, (cx + nhw) * ps, (ny - 0.35) * ps + off);
  ctx.stroke();
  // Strick-Falten
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = ps * 0.14;
  for (let i = -2; i <= 2; i++) {
    const fx = cx + i * (nhw * 0.42);
    ctx.beginPath();
    ctx.moveTo((fx - 0.15) * ps, (ny - 0.4 + Math.abs(i) * 0.12) * ps + off);
    ctx.lineTo((fx + 0.15) * ps, (ny + 0.75 + Math.abs(i) * 0.12) * ps + off);
    ctx.stroke();
  }
  // Haengendes Ende
  const ex = cx - nhw + 0.6;
  ctx.fillStyle = '#B22222';
  ctx.beginPath();
  ctx.moveTo((ex - 0.8) * ps, (ny + 0.7) * ps + off);
  ctx.quadraticCurveTo((ex - 1.6) * ps, (ny + 3) * ps + off, (ex - 1) * ps, (ny + 5.3) * ps + off);
  ctx.lineTo((ex + 1) * ps, (ny + 5.3) * ps + off);
  ctx.quadraticCurveTo((ex + 1.1) * ps, (ny + 3) * ps + off, (ex + 1) * ps, (ny + 1) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Gruene Streifen
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.moveTo((ex - 1.35) * ps, (ny + 2.6) * ps + off);
  ctx.quadraticCurveTo(ex * ps, (ny + 2.9) * ps + off, (ex + 1.05) * ps, (ny + 2.6) * ps + off);
  ctx.moveTo((ex - 1.25) * ps, (ny + 3.9) * ps + off);
  ctx.quadraticCurveTo(ex * ps, (ny + 4.2) * ps + off, (ex + 1) * ps, (ny + 3.9) * ps + off);
  ctx.stroke();
  // Fransen
  ctx.strokeStyle = '#8B1A1A';
  ctx.lineWidth = ps * 0.22;
  for (let i = 0; i < 4; i++) {
    const fx = ex - 0.9 + i * 0.55;
    ctx.beginPath();
    ctx.moveTo(fx * ps, (ny + 5.3) * ps + off);
    ctx.lineTo((fx + (i - 1.5) * 0.1) * ps, (ny + 6.2) * ps + off);
    ctx.stroke();
  }
}

export function drawGoldChain(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Kettenglieder im Bogen
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const x = cx - nhw + 0.3 + t * (nhw * 2 - 0.6);
    const y = ny + 0.2 + Math.sin(t * Math.PI) * 0.55;
    ctx.fillStyle = i % 2 === 0 ? '#FFD700' : darken('#FFD700', 35);
    ctx.beginPath();
    ctx.arc(x * ps, y * ps + off, ps * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc((x - 0.08) * ps, (y - 0.08) * ps + off, ps * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  // Herabhaengende Kette
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.24;
  ctx.beginPath();
  ctx.moveTo((cx - 1.4) * ps, (ny + 0.8) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 2.4) * ps + off, (cx + 1.4) * ps, (ny + 0.8) * ps + off);
  ctx.stroke();
  // Medaillon mit Goldglanz
  const my = ny + 3.1;
  const grad = ctx.createRadialGradient(
    (cx - 0.3) * ps,
    (my - 0.3) * ps + off,
    ps * 0.1,
    cx * ps,
    my * ps + off,
    ps * 1
  );
  grad.addColorStop(0, '#FFF3B0');
  grad.addColorStop(0.6, '#FFD700');
  grad.addColorStop(1, '#B8860B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx * ps, my * ps + off, ps * 0.95, 0, Math.PI * 2);
  ctx.fill();
  // Diamant
  ctx.fillStyle = '#4DD0E1';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (my - 0.5) * ps + off);
  ctx.lineTo((cx + 0.45) * ps, my * ps + off);
  ctx.lineTo(cx * ps, (my + 0.5) * ps + off);
  ctx.lineTo((cx - 0.45) * ps, my * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc((cx - 0.12) * ps, (my - 0.15) * ps + off, ps * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCape(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const bl = cx - nhw - 1.3;
  const br = cx + nhw + 1.3;
  // Wehender Umhang mit gewelltem Saum
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.moveTo((cx - nhw + 0.2) * ps, (ny + 0.4) * ps + off);
  ctx.quadraticCurveTo((bl - 0.9) * ps, (ny + 4.5) * ps + off, bl * ps, (ny + 8.6) * ps + off);
  const w = (br - bl) / 3;
  for (let i = 0; i < 3; i++) {
    ctx.quadraticCurveTo(
      (bl + w * (i + 0.5)) * ps,
      (ny + 9.5) * ps + off,
      (bl + w * (i + 1)) * ps,
      (ny + 8.6) * ps + off
    );
  }
  ctx.quadraticCurveTo(
    (br + 0.9) * ps,
    (ny + 4.5) * ps + off,
    (cx + nhw - 0.2) * ps,
    (ny + 0.4) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Falten
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = ps * 0.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo((cx + i * nhw * 0.8) * ps, (ny + 1.2) * ps + off);
    ctx.quadraticCurveTo(
      (cx + i * (nhw + 0.9)) * ps,
      (ny + 5) * ps + off,
      (cx + i * (nhw + 0.5)) * ps,
      (ny + 8.2) * ps + off
    );
    ctx.stroke();
  }
  // Lichtkante
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = ps * 0.25;
  ctx.beginPath();
  ctx.moveTo((cx - nhw + 0.4) * ps, (ny + 0.8) * ps + off);
  ctx.quadraticCurveTo((bl + 0.4) * ps, (ny + 4.4) * ps + off, (bl + 1) * ps, (ny + 8) * ps + off);
  ctx.stroke();
  // Goldene Schliesse
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc((cx - 0.9) * ps, (ny + 0.2) * ps + off, ps * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx + 0.9) * ps, (ny + 0.2) * ps + off, ps * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo((cx - 0.55) * ps, (ny + 0.2) * ps + off);
  ctx.lineTo((cx + 0.55) * ps, (ny + 0.2) * ps + off);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc((cx - 1) * ps, (ny + 0.08) * ps + off, ps * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function drawMedal(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Band im V
  ctx.fillStyle = '#1E88E5';
  ctx.beginPath();
  ctx.moveTo((cx - 1.5) * ps, (ny - 0.2) * ps + off);
  ctx.lineTo((cx - 0.55) * ps, (ny - 0.2) * ps + off);
  ctx.lineTo((cx + 0.4) * ps, (ny + 2.5) * ps + off);
  ctx.lineTo((cx - 0.4) * ps, (ny + 2.9) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo((cx + 1.5) * ps, (ny - 0.2) * ps + off);
  ctx.lineTo((cx + 0.55) * ps, (ny - 0.2) * ps + off);
  ctx.lineTo((cx - 0.4) * ps, (ny + 2.5) * ps + off);
  ctx.lineTo((cx + 0.4) * ps, (ny + 2.9) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Bandschatten
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = ps * 0.12;
  ctx.beginPath();
  ctx.moveTo((cx - 1.05) * ps, (ny - 0.1) * ps + off);
  ctx.lineTo(cx * ps, (ny + 2.6) * ps + off);
  ctx.stroke();
  // Medaille mit Goldverlauf
  const my = ny + 3.6;
  const grad = ctx.createRadialGradient(
    (cx - 0.35) * ps,
    (my - 0.35) * ps + off,
    ps * 0.15,
    cx * ps,
    my * ps + off,
    ps * 1.3
  );
  grad.addColorStop(0, '#FFF3B0');
  grad.addColorStop(0.6, '#FFD700');
  grad.addColorStop(1, '#B8860B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx * ps, my * ps + off, ps * 1.25, 0, Math.PI * 2);
  ctx.fill();
  // Praegering
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.arc(cx * ps, my * ps + off, ps * 1, 0, Math.PI * 2);
  ctx.stroke();
  // Stern
  ctx.fillStyle = '#FFA000';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 0.62 : 0.26;
    const sx = cx + Math.cos(ang) * r;
    const sy = my + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(sx * ps, sy * ps + off);
    else ctx.lineTo(sx * ps, sy * ps + off);
  }
  ctx.closePath();
  ctx.fill();
  // Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc((cx - 0.5) * ps, (my - 0.6) * ps + off, ps * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTie(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Knoten
  ctx.fillStyle = '#1E3A5F';
  ctx.beginPath();
  ctx.moveTo((cx - 0.7) * ps, (ny - 0.1) * ps + off);
  ctx.lineTo((cx + 0.7) * ps, (ny - 0.1) * ps + off);
  ctx.lineTo((cx + 0.45) * ps, (ny + 0.85) * ps + off);
  ctx.lineTo((cx - 0.45) * ps, (ny + 0.85) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lighten('#1E3A5F', 30);
  ctx.beginPath();
  ctx.ellipse((cx - 0.15) * ps, (ny + 0.25) * ps + off, ps * 0.3, ps * 0.16, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Krawattenblatt mit weichen Kanten
  ctx.fillStyle = '#1E3A5F';
  ctx.beginPath();
  ctx.moveTo((cx - 0.45) * ps, (ny + 0.85) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 1.25) * ps,
    (ny + 3.4) * ps + off,
    (cx - 1.05) * ps,
    (ny + 5.3) * ps + off
  );
  ctx.lineTo(cx * ps, (ny + 6.7) * ps + off);
  ctx.lineTo((cx + 1.05) * ps, (ny + 5.3) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 1.25) * ps,
    (ny + 3.4) * ps + off,
    (cx + 0.45) * ps,
    (ny + 0.85) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Rote Diagonalstreifen
  ctx.strokeStyle = '#D32F2F';
  ctx.lineWidth = ps * 0.4;
  const stripes: [number, number][] = [
    [2.1, 0.95],
    [3.4, 1.1],
    [4.6, 1.05],
  ];
  for (const [sy, w] of stripes) {
    ctx.beginPath();
    ctx.moveTo((cx - w) * ps, (ny + sy + 0.35) * ps + off);
    ctx.lineTo((cx + w) * ps, (ny + sy - 0.35) * ps + off);
    ctx.stroke();
  }
  // Seidenglanz
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx - 0.35) * ps, (ny + 1.1) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 0.85) * ps,
    (ny + 3.4) * ps + off,
    (cx - 0.55) * ps,
    (ny + 5.5) * ps + off
  );
  ctx.stroke();
}

export function drawBandkerchief(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Bandana-Tuch mit weicher Spitze
  ctx.fillStyle = '#FF6347';
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, (ny - 0.1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.55) * ps + off, (cx + nhw) * ps, (ny - 0.1) * ps + off);
  ctx.lineTo((cx + nhw - 0.6) * ps, (ny + 1.1) * ps + off);
  ctx.quadraticCurveTo((cx + 1.2) * ps, (ny + 2.3) * ps + off, cx * ps, (ny + 3.8) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 1.2) * ps,
    (ny + 2.3) * ps + off,
    (cx - nhw + 0.6) * ps,
    (ny + 1.1) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Falten
  ctx.strokeStyle = darken('#FF6347', 55);
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.moveTo((cx - 1.1) * ps, (ny + 0.8) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 0.6) * ps,
    (ny + 2) * ps + off,
    (cx - 0.25) * ps,
    (ny + 3.1) * ps + off
  );
  ctx.moveTo((cx + 1.1) * ps, (ny + 0.8) * ps + off);
  ctx.quadraticCurveTo((cx + 0.6) * ps, (ny + 2) * ps + off, (cx + 0.3) * ps, (ny + 3) * ps + off);
  ctx.stroke();
  // Weisse Tupfen
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const dots: [number, number][] = [
    [-1.4, 0.9],
    [1.3, 0.9],
    [0, 1.7],
    [-0.6, 2.5],
    [0.7, 2.5],
  ];
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ny + dy) * ps + off, ps * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawLocket(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Feine Silberkette
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.moveTo((cx - 1.6) * ps, ny * ps + off);
  ctx.quadraticCurveTo((cx - 0.5) * ps, (ny + 1.9) * ps + off, cx * ps, (ny + 2.7) * ps + off);
  ctx.moveTo((cx + 1.6) * ps, ny * ps + off);
  ctx.quadraticCurveTo((cx + 0.5) * ps, (ny + 1.9) * ps + off, cx * ps, (ny + 2.7) * ps + off);
  ctx.stroke();
  // Herzmedaillon mit Goldverlauf
  const hy = ny + 3.5;
  const grad = ctx.createRadialGradient(
    (cx - 0.3) * ps,
    (hy - 0.5) * ps + off,
    ps * 0.1,
    cx * ps,
    hy * ps + off,
    ps * 1.1
  );
  grad.addColorStop(0, '#FFE082');
  grad.addColorStop(1, '#DAA520');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - 0.8) * ps, (hy - 0.25) * ps + off);
  ctx.arc((cx - 0.4) * ps, (hy - 0.25) * ps + off, ps * 0.4, Math.PI, 0);
  ctx.arc((cx + 0.4) * ps, (hy - 0.25) * ps + off, ps * 0.4, Math.PI, 0);
  ctx.quadraticCurveTo((cx + 0.75) * ps, (hy + 0.35) * ps + off, cx * ps, (hy + 0.85) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 0.75) * ps,
    (hy + 0.35) * ps + off,
    (cx - 0.8) * ps,
    (hy - 0.25) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Rosa Herz-Gravur
  ctx.fillStyle = '#F06292';
  ctx.beginPath();
  ctx.arc((cx - 0.16) * ps, (hy - 0.15) * ps + off, ps * 0.16, Math.PI, 0);
  ctx.arc((cx + 0.16) * ps, (hy - 0.15) * ps + off, ps * 0.16, Math.PI, 0);
  ctx.quadraticCurveTo((cx + 0.3) * ps, (hy + 0.1) * ps + off, cx * ps, (hy + 0.35) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 0.3) * ps,
    (hy + 0.1) * ps + off,
    (cx - 0.32) * ps,
    (hy - 0.15) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Glanzpunkt
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc((cx - 0.4) * ps, (hy - 0.45) * ps + off, ps * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBellCollar(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Rotes Halsband
  ctx.strokeStyle = '#C62828';
  ctx.lineWidth = ps * 0.9;
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, (ny + 0.1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + nhw) * ps, (ny + 0.1) * ps + off);
  ctx.stroke();
  // Lichtkante
  ctx.strokeStyle = lighten('#C62828', 45);
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo((cx - nhw + 0.4) * ps, (ny - 0.1) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ny + 0.6) * ps + off,
    (cx + nhw - 0.4) * ps,
    (ny - 0.1) * ps + off
  );
  ctx.stroke();
  // Aufhaenger-Ring
  const by = ny + 1.9;
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = ps * 0.12;
  ctx.beginPath();
  ctx.arc(cx * ps, (by - 0.95) * ps + off, ps * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  // Goldgloeckchen
  const grad = ctx.createRadialGradient(
    (cx - 0.25) * ps,
    (by - 0.3) * ps + off,
    ps * 0.1,
    cx * ps,
    by * ps + off,
    ps * 0.95
  );
  grad.addColorStop(0, '#FFF59D');
  grad.addColorStop(0.6, '#FFD700');
  grad.addColorStop(1, '#B8860B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 0.85, 0, Math.PI * 2);
  ctx.fill();
  // Schlitz und Kloeppel
  ctx.strokeStyle = '#795548';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.moveTo((cx - 0.5) * ps, (by + 0.15) * ps + off);
  ctx.lineTo((cx + 0.5) * ps, (by + 0.15) * ps + off);
  ctx.stroke();
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.arc(cx * ps, (by + 0.55) * ps + off, ps * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // Glanzpunkt
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc((cx - 0.3) * ps, (by - 0.35) * ps + off, ps * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFlowerGarland(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Ranke
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = ps * 0.28;
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + nhw) * ps, ny * ps + off);
  ctx.stroke();
  // Blaettchen zwischen den Blueten
  ctx.fillStyle = '#66BB6A';
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4;
    const x = cx - nhw + 0.4 + t * (nhw * 2 - 0.8);
    const y = ny + 0.35 + Math.sin(t * Math.PI) * 0.65;
    ctx.beginPath();
    ctx.ellipse(x * ps, y * ps + off, ps * 0.28, ps * 0.16, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Blueten mit fuenf Blaettern
  const colors = ['#F06292', '#FFD54F', '#FF8A65', '#BA68C8', '#4FC3F7'];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = cx - nhw + 0.4 + t * (nhw * 2 - 0.8);
    const y = ny + 0.15 + Math.sin(t * Math.PI) * 0.65;
    ctx.fillStyle = colors[i];
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2;
      const px = x + Math.cos(ang) * 0.26;
      const py = y + Math.sin(ang) * 0.26;
      ctx.beginPath();
      ctx.arc(px * ps, py * ps + off, ps * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.arc(x * ps, y * ps + off, ps * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawRubyPendant(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Silberkette
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo((cx - nhw * 0.55) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1) * ps + off, (cx + nhw * 0.55) * ps, ny * ps + off);
  ctx.stroke();
  // Fassung
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 1.35) * ps + off, ps * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Rubin im Tropfenschliff
  const by = ny + 2.3;
  ctx.fillStyle = '#C62828';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (by - 0.85) * ps + off);
  ctx.lineTo((cx + 0.7) * ps, (by - 0.1) * ps + off);
  ctx.lineTo(cx * ps, (by + 0.95) * ps + off);
  ctx.lineTo((cx - 0.7) * ps, (by - 0.1) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Facetten
  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (by - 0.85) * ps + off);
  ctx.lineTo((cx + 0.35) * ps, (by - 0.1) * ps + off);
  ctx.lineTo(cx * ps, (by + 0.2) * ps + off);
  ctx.lineTo((cx - 0.35) * ps, (by - 0.1) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = ps * 0.08;
  ctx.beginPath();
  ctx.moveTo((cx - 0.7) * ps, (by - 0.1) * ps + off);
  ctx.lineTo((cx + 0.7) * ps, (by - 0.1) * ps + off);
  ctx.stroke();
  // Glanz und roter Schein
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc((cx - 0.18) * ps, (by - 0.35) * ps + off, ps * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(229,57,53,0.25)';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAnchorChain(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Kettenglieder
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = ps * 0.16;
  const pts: [number, number][] = [
    [-1.6, 0.05],
    [-1.05, 0.6],
    [-0.5, 1.1],
    [0, 1.5],
    [0.5, 1.1],
    [1.05, 0.6],
    [1.6, 0.05],
  ];
  for (const [dx, dy] of pts) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ny + dy) * ps + off, ps * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Anker
  const ay = ny + 3.3;
  ctx.strokeStyle = '#546E7A';
  ctx.lineWidth = ps * 0.32;
  ctx.beginPath();
  ctx.arc(cx * ps, (ay - 1.5) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ay - 1.2) * ps + off);
  ctx.lineTo(cx * ps, (ay + 0.9) * ps + off);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((cx - 0.75) * ps, (ay - 0.7) * ps + off);
  ctx.lineTo((cx + 0.75) * ps, (ay - 0.7) * ps + off);
  ctx.stroke();
  // Gebogene Arme
  ctx.beginPath();
  ctx.arc(cx * ps, (ay + 0.05) * ps + off, ps * 0.95, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();
  // Flunken
  ctx.fillStyle = '#546E7A';
  ctx.beginPath();
  ctx.moveTo((cx + 1.3) * ps, (ay + 0.05) * ps + off);
  ctx.lineTo((cx + 0.65) * ps, (ay + 0.3) * ps + off);
  ctx.lineTo((cx + 1.05) * ps, (ay + 0.75) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo((cx - 1.3) * ps, (ay + 0.05) * ps + off);
  ctx.lineTo((cx - 0.65) * ps, (ay + 0.3) * ps + off);
  ctx.lineTo((cx - 1.05) * ps, (ay + 0.75) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Metallglanz
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = ps * 0.1;
  ctx.beginPath();
  ctx.moveTo((cx - 0.08) * ps, (ay - 1.1) * ps + off);
  ctx.lineTo((cx - 0.08) * ps, (ay + 0.6) * ps + off);
  ctx.stroke();
}

export function drawRoyalSash(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const sx = cx - nhw + 0.6;
  // Fliessende Schaerpe
  ctx.fillStyle = '#3F51B5';
  ctx.beginPath();
  ctx.moveTo((sx - 1.2) * ps, (ny - 0.4) * ps + off);
  ctx.lineTo((sx + 0.9) * ps, (ny - 0.4) * ps + off);
  ctx.quadraticCurveTo((sx + 2) * ps, (ny + 3.4) * ps + off, (sx + 1.4) * ps, (ny + 7) * ps + off);
  ctx.lineTo((sx - 0.6) * ps, (ny + 7) * ps + off);
  ctx.quadraticCurveTo(
    (sx - 0.1) * ps,
    (ny + 3.4) * ps + off,
    (sx - 1.2) * ps,
    (ny - 0.4) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Goldborten
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((sx - 1) * ps, (ny - 0.3) * ps + off);
  ctx.quadraticCurveTo(
    (sx - 0.05) * ps,
    (ny + 3.4) * ps + off,
    (sx - 0.45) * ps,
    (ny + 6.9) * ps + off
  );
  ctx.moveTo((sx + 0.75) * ps, (ny - 0.3) * ps + off);
  ctx.quadraticCurveTo(
    (sx + 1.8) * ps,
    (ny + 3.4) * ps + off,
    (sx + 1.25) * ps,
    (ny + 6.9) * ps + off
  );
  ctx.stroke();
  // Stoffschimmer
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = ps * 0.35;
  ctx.beginPath();
  ctx.moveTo((sx - 0.1) * ps, (ny - 0.2) * ps + off);
  ctx.quadraticCurveTo(
    (sx + 0.9) * ps,
    (ny + 3.4) * ps + off,
    (sx + 0.4) * ps,
    (ny + 6.8) * ps + off
  );
  ctx.stroke();
  // Ordensrosette
  const rx = sx + 0.4;
  const ryy = ny + 3.1;
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(rx * ps, ryy * ps + off, ps * 0.66, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(rx * ps, ryy * ps + off, ps * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.arc(rx * ps, ryy * ps + off, ps * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc((rx - 0.2) * ps, (ryy - 0.22) * ps + off, ps * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDragonPendant(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Lederband
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - 1.7) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1.1) * ps + off, (cx + 1.7) * ps, ny * ps + off);
  ctx.stroke();
  // Drachenkopf
  const by = ny + 2.4;
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.ellipse(cx * ps, by * ps + off, ps * 1.05, ps * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Schnauze
  ctx.fillStyle = '#43A047';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (by + 0.7) * ps + off, ps * 0.55, ps * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hoerner
  ctx.fillStyle = '#1B5E20';
  ctx.beginPath();
  ctx.moveTo((cx - 0.85) * ps, (by - 0.45) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 1.45) * ps,
    (by - 1.2) * ps + off,
    (cx - 1.15) * ps,
    (by - 1.45) * ps + off
  );
  ctx.lineTo((cx - 0.45) * ps, (by - 0.75) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo((cx + 0.85) * ps, (by - 0.45) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 1.45) * ps,
    (by - 1.2) * ps + off,
    (cx + 1.15) * ps,
    (by - 1.45) * ps + off
  );
  ctx.lineTo((cx + 0.45) * ps, (by - 0.75) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Gluehende Augen
  ctx.fillStyle = 'rgba(255,109,0,0.3)';
  ctx.beginPath();
  ctx.arc((cx - 0.4) * ps, (by - 0.15) * ps + off, ps * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx + 0.4) * ps, (by - 0.15) * ps + off, ps * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF6D00';
  ctx.beginPath();
  ctx.arc((cx - 0.4) * ps, (by - 0.15) * ps + off, ps * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx + 0.4) * ps, (by - 0.15) * ps + off, ps * 0.17, 0, Math.PI * 2);
  ctx.fill();
  // Rubin im Maul
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (by + 0.5) * ps + off);
  ctx.lineTo((cx + 0.22) * ps, (by + 0.75) * ps + off);
  ctx.lineTo(cx * ps, (by + 1) * ps + off);
  ctx.lineTo((cx - 0.22) * ps, (by + 0.75) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Schuppen-Glanz
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = ps * 0.12;
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 0.7, Math.PI * 1.15, Math.PI * 1.6);
  ctx.stroke();
}

export function drawPhoenixFeatherNeck(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Goldkette
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx - 1.6) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + 1.6) * ps, ny * ps + off);
  ctx.stroke();
  // Feder in warmen Schichten
  const fy = ny + 2.9;
  ctx.fillStyle = '#E64A19';
  ctx.beginPath();
  ctx.ellipse(cx * ps, fy * ps + off, ps * 0.95, ps * 2.2, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF7043';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (fy - 0.15) * ps + off, ps * 0.6, ps * 1.7, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (fy - 0.3) * ps + off, ps * 0.3, ps * 1.15, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Kiel
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = ps * 0.12;
  ctx.beginPath();
  ctx.moveTo((cx - 0.1) * ps, (fy - 2) * ps + off);
  ctx.quadraticCurveTo((cx + 0.15) * ps, fy * ps + off, (cx + 0.3) * ps, (fy + 2) * ps + off);
  ctx.stroke();
  // Federaeste
  ctx.strokeStyle = 'rgba(255,171,64,0.8)';
  ctx.lineWidth = ps * 0.1;
  for (let i = 0; i < 4; i++) {
    const yy = fy - 1.2 + i * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx * ps, yy * ps + off);
    ctx.lineTo((cx - 0.75) * ps, (yy + 0.45) * ps + off);
    ctx.moveTo((cx + 0.05) * ps, yy * ps + off);
    ctx.lineTo((cx + 0.8) * ps, (yy + 0.4) * ps + off);
    ctx.stroke();
  }
  // Glut an der Spitze
  ctx.fillStyle = 'rgba(255,109,0,0.3)';
  ctx.beginPath();
  ctx.arc((cx + 0.3) * ps, (fy + 2.1) * ps + off, ps * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc((cx + 0.3) * ps, (fy + 2.1) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCosmicAmulet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Silberkette
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx - 1.7) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + 1.7) * ps, ny * ps + off);
  ctx.stroke();
  // Nachthimmel-Scheibe
  const by = ny + 2.5;
  const grad = ctx.createRadialGradient(
    cx * ps,
    by * ps + off,
    ps * 0.2,
    cx * ps,
    by * ps + off,
    ps * 1.45
  );
  grad.addColorStop(0, '#4527A0');
  grad.addColorStop(1, '#12005E');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.45, 0, Math.PI * 2);
  ctx.fill();
  // Spiralnebel
  ctx.strokeStyle = 'rgba(186,104,200,0.85)';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 0.35, 0, Math.PI * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc((cx + 0.15) * ps, (by + 0.1) * ps + off, ps * 0.75, Math.PI * 0.9, Math.PI * 1.9);
  ctx.stroke();
  // Sterne
  ctx.fillStyle = '#FFFFFF';
  const stars: [number, number, number][] = [
    [-0.6, -0.4, 0.11],
    [0.55, -0.6, 0.09],
    [0.7, 0.5, 0.1],
    [-0.3, 0.75, 0.08],
  ];
  for (const [dx, dy, r] of stars) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (by + dy) * ps + off, ps * r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Goldrand
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.45, 0, Math.PI * 2);
  ctx.stroke();
  // Kosmischer Schein
  ctx.fillStyle = 'rgba(156,39,176,0.2)';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.95, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRoyalCape(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const bl = cx - nhw - 2;
  const br = cx + nhw + 2;
  // Koenigsmantel
  ctx.fillStyle = '#4B0082';
  ctx.beginPath();
  ctx.moveTo((cx - nhw + 0.2) * ps, (ny + 0.3) * ps + off);
  ctx.quadraticCurveTo((bl - 0.8) * ps, (ny + 4.4) * ps + off, bl * ps, (ny + 8.6) * ps + off);
  ctx.lineTo(br * ps, (ny + 8.6) * ps + off);
  ctx.quadraticCurveTo(
    (br + 0.8) * ps,
    (ny + 4.4) * ps + off,
    (cx + nhw - 0.2) * ps,
    (ny + 0.3) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Falten
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = ps * 0.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo((cx + i * nhw * 0.9) * ps, (ny + 1.4) * ps + off);
    ctx.quadraticCurveTo(
      (cx + i * (nhw + 1.1)) * ps,
      (ny + 5) * ps + off,
      (cx + i * (nhw + 0.7)) * ps,
      (ny + 8) * ps + off
    );
    ctx.stroke();
  }
  // Hermelin-Saum
  ctx.strokeStyle = '#FAFAFA';
  ctx.lineWidth = ps * 1.1;
  ctx.beginPath();
  ctx.moveTo((bl + 0.1) * ps, (ny + 8.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 9.3) * ps + off, (br - 0.1) * ps, (ny + 8.5) * ps + off);
  ctx.stroke();
  // Hermelin-Tupfen
  ctx.fillStyle = '#263238';
  for (let i = 0; i < 5; i++) {
    const x = bl + ((br - bl) * (i + 0.5)) / 5;
    const y = ny + 8.55 + Math.sin(((i + 0.5) / 5) * Math.PI) * 0.55;
    ctx.beginPath();
    ctx.ellipse(x * ps, y * ps + off, ps * 0.13, ps * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Goldkordel mit Rubin
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx - 1.1) * ps, (ny + 0.2) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.7) * ps + off, (cx + 1.1) * ps, (ny + 0.2) * ps + off);
  ctx.stroke();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc((cx - 1.15) * ps, (ny + 0.15) * ps + off, ps * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx + 1.15) * ps, (ny + 0.15) * ps + off, ps * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 0.55) * ps + off, ps * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc((cx - 1.25) * ps, (ny + 0.02) * ps + off, ps * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawLei(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const colors = ['#F06292', '#FFD54F', '#FF7043'];
  // Bluetenkranz mit tiefem Bogen
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = cx - nhw - 0.2 + t * (nhw * 2 + 0.4);
    const y = ny + 0.2 + Math.sin(t * Math.PI) * 1.3;
    // Blaettchen zwischen den Blueten
    if (i > 0) {
      ctx.fillStyle = '#66BB6A';
      ctx.beginPath();
      ctx.ellipse((x - 0.45) * ps, (y + 0.1) * ps + off, ps * 0.26, ps * 0.14, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = colors[i % 3];
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2 + i;
      const px = x + Math.cos(ang) * 0.3;
      const py = y + Math.sin(ang) * 0.3;
      ctx.beginPath();
      ctx.arc(px * ps, py * ps + off, ps * 0.24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath();
    ctx.arc(x * ps, y * ps + off, ps * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawGalaxyCape(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const bl = cx - nhw - 1.4;
  const br = cx + nhw + 1.4;
  // Weltraum-Umhang mit gewelltem Saum
  ctx.fillStyle = '#12123E';
  ctx.beginPath();
  ctx.moveTo((cx - nhw + 0.2) * ps, (ny + 0.4) * ps + off);
  ctx.quadraticCurveTo((bl - 0.8) * ps, (ny + 4.6) * ps + off, bl * ps, (ny + 8.8) * ps + off);
  const w = (br - bl) / 3;
  for (let i = 0; i < 3; i++) {
    ctx.quadraticCurveTo(
      (bl + w * (i + 0.5)) * ps,
      (ny + 9.6) * ps + off,
      (bl + w * (i + 1)) * ps,
      (ny + 8.8) * ps + off
    );
  }
  ctx.quadraticCurveTo(
    (br + 0.8) * ps,
    (ny + 4.6) * ps + off,
    (cx + nhw - 0.2) * ps,
    (ny + 0.4) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Nebelschwaden
  ctx.fillStyle = 'rgba(156,39,176,0.3)';
  ctx.beginPath();
  ctx.ellipse((cx - 1.6) * ps, (ny + 3.6) * ps + off, ps * 1.7, ps * 1, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(33,150,243,0.28)';
  ctx.beginPath();
  ctx.ellipse((cx + 1.2) * ps, (ny + 5.6) * ps + off, ps * 1.9, ps * 1.1, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(224,64,251,0.22)';
  ctx.beginPath();
  ctx.ellipse((cx - 0.6) * ps, (ny + 7.2) * ps + off, ps * 1.4, ps * 0.9, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Sterne
  ctx.fillStyle = '#FFFFFF';
  const stars: [number, number, number][] = [
    [-2.1, 2, 0.13],
    [1.6, 3, 0.11],
    [-1, 5, 0.14],
    [2.1, 6.2, 0.1],
    [0.2, 7.4, 0.12],
    [-2.6, 4.2, 0.1],
    [2.6, 4.8, 0.12],
  ];
  for (const [dx, dy, r] of stars) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ny + dy) * ps + off, ps * r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Funkelnder Stern
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = ps * 0.08;
  ctx.beginPath();
  ctx.moveTo((cx - 1) * ps, (ny + 4.6) * ps + off);
  ctx.lineTo((cx - 1) * ps, (ny + 5.4) * ps + off);
  ctx.moveTo((cx - 1.4) * ps, (ny + 5) * ps + off);
  ctx.lineTo((cx - 0.6) * ps, (ny + 5) * ps + off);
  ctx.stroke();
  // Sternen-Schliesse
  ctx.fillStyle = '#FFF176';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ny - 0.4) * ps + off);
  ctx.lineTo((cx + 0.3) * ps, (ny + 0.15) * ps + off);
  ctx.lineTo(cx * ps, (ny + 0.7) * ps + off);
  ctx.lineTo((cx - 0.3) * ps, (ny + 0.15) * ps + off);
  ctx.closePath();
  ctx.fill();
}

export function drawLuckyClover(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Goldkettchen
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx - 1.5) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.7) * ps + off, (cx + 1.5) * ps, ny * ps + off);
  ctx.stroke();
  // Vier Herzblaetter
  const byc = ny + 2;
  for (let i = 0; i < 4; i++) {
    const ang = Math.PI / 4 + (i * Math.PI) / 2;
    const lx = cx + Math.cos(ang) * 0.55;
    const ly = byc + Math.sin(ang) * 0.55;
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.ellipse(lx * ps, ly * ps + off, ps * 0.52, ps * 0.4, ang, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(lx * ps, ly * ps + off, ps * 0.3, ps * 0.2, ang, 0, Math.PI * 2);
    ctx.fill();
  }
  // Stiel
  ctx.strokeStyle = '#1B5E20';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo(cx * ps, (byc + 0.7) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 0.5) * ps,
    (byc + 1.5) * ps + off,
    (cx + 0.25) * ps,
    (byc + 2.1) * ps + off
  );
  ctx.stroke();
  // Gluecks-Funkeln
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc((cx - 0.75) * ps, (byc - 0.75) * ps + off, ps * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRainbowScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  const colors = ['#EF5350', '#FFA726', '#FFEE58', '#66BB6A', '#42A5F5', '#AB47BC'];
  // Bogenfoermige Farbbaender
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = ps * 0.42;
    ctx.beginPath();
    ctx.moveTo((cx - nhw - 0.4) * ps, (ny - 0.5 + i * 0.38) * ps + off);
    ctx.quadraticCurveTo(
      cx * ps,
      (ny + 0.3 + i * 0.38) * ps + off,
      (cx + nhw + 0.4) * ps,
      (ny - 0.5 + i * 0.38) * ps + off
    );
    ctx.stroke();
  }
  // Wehendes Ende
  const ex = cx - nhw + 0.3;
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = ps * 0.34;
    ctx.beginPath();
    ctx.moveTo((ex + i * 0.3) * ps, (ny + 1.6) * ps + off);
    ctx.quadraticCurveTo(
      (ex + i * 0.3 - 0.55) * ps,
      (ny + 2.9) * ps + off,
      (ex + i * 0.3 - 0.25) * ps,
      (ny + 4.2) * ps + off
    );
    ctx.stroke();
  }
  // Lichtschimmer
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, (ny - 0.55) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.2) * ps + off, (cx + nhw) * ps, (ny - 0.55) * ps + off);
  ctx.stroke();
}

export function drawShellNecklace(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Kordel
  ctx.strokeStyle = '#A1887F';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1.1) * ps + off, (cx + nhw) * ps, ny * ps + off);
  ctx.stroke();
  // Muscheln mit Rillen und Perlmutt-Glanz
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = cx - nhw + 0.5 + t * (nhw * 2 - 1);
    const y = ny + 0.25 + Math.sin(t * Math.PI) * 0.85;
    ctx.fillStyle = i % 2 === 0 ? '#FFF3E0' : '#FFE0B2';
    ctx.beginPath();
    ctx.arc(x * ps, y * ps + off, ps * 0.45, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#D7CCC8';
    ctx.lineWidth = ps * 0.08;
    ctx.beginPath();
    ctx.moveTo(x * ps, y * ps + off);
    ctx.lineTo((x - 0.22) * ps, (y + 0.36) * ps + off);
    ctx.moveTo(x * ps, y * ps + off);
    ctx.lineTo(x * ps, (y + 0.43) * ps + off);
    ctx.moveTo(x * ps, y * ps + off);
    ctx.lineTo((x + 0.22) * ps, (y + 0.36) * ps + off);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc((x - 0.12) * ps, (y + 0.12) * ps + off, ps * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawThunderChain(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Goldkette
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.24;
  ctx.beginPath();
  ctx.moveTo((cx - 1.9) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + 1.9) * ps, ny * ps + off);
  ctx.stroke();
  // Blitz-Anhaenger mit Verlauf
  const by = ny + 1.1;
  const grad = ctx.createLinearGradient(cx * ps, by * ps + off, cx * ps, (by + 2.6) * ps + off);
  grad.addColorStop(0, '#FFEE58');
  grad.addColorStop(1, '#FFA000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx + 0.5) * ps, by * ps + off);
  ctx.lineTo((cx - 0.4) * ps, (by + 1.25) * ps + off);
  ctx.lineTo((cx + 0.05) * ps, (by + 1.35) * ps + off);
  ctx.lineTo((cx - 0.5) * ps, (by + 2.6) * ps + off);
  ctx.lineTo((cx + 0.55) * ps, (by + 1.15) * ps + off);
  ctx.lineTo((cx + 0.15) * ps, (by + 1.05) * ps + off);
  ctx.closePath();
  ctx.fill();
  // dunkle Kontur, damit der Blitz auch auf hellem Fell lesbar bleibt
  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = ps * 0.18;
  ctx.stroke();
  // Glanzkante
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = ps * 0.1;
  ctx.beginPath();
  ctx.moveTo((cx + 0.4) * ps, (by + 0.15) * ps + off);
  ctx.lineTo((cx - 0.25) * ps, (by + 1.15) * ps + off);
  ctx.stroke();
  // Elektrischer Schein
  ctx.fillStyle = 'rgba(255,238,88,0.25)';
  ctx.beginPath();
  ctx.arc(cx * ps, (by + 1.3) * ps + off, ps * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSolarAmulet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Goldkette
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx - 1.7) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.8) * ps + off, (cx + 1.7) * ps, ny * ps + off);
  ctx.stroke();
  // Strahlenkranz
  const sy = ny + 2.3;
  ctx.fillStyle = '#FFB300';
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const tipX = cx + Math.cos(ang) * 1.95;
    const tipY = sy + Math.sin(ang) * 1.95;
    const bx1 = cx + Math.cos(ang + 0.28) * 1.15;
    const by1 = sy + Math.sin(ang + 0.28) * 1.15;
    const bx2 = cx + Math.cos(ang - 0.28) * 1.15;
    const by2 = sy + Math.sin(ang - 0.28) * 1.15;
    ctx.beginPath();
    ctx.moveTo(tipX * ps, tipY * ps + off);
    ctx.lineTo(bx1 * ps, by1 * ps + off);
    ctx.lineTo(bx2 * ps, by2 * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Sonnenscheibe
  const grad = ctx.createRadialGradient(
    (cx - 0.35) * ps,
    (sy - 0.35) * ps + off,
    ps * 0.15,
    cx * ps,
    sy * ps + off,
    ps * 1.25
  );
  grad.addColorStop(0, '#FFF59D');
  grad.addColorStop(0.6, '#FFC107');
  grad.addColorStop(1, '#F57F17');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx * ps, sy * ps + off, ps * 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Glanzbogen
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.arc(cx * ps, sy * ps + off, ps * 0.75, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
  // Warmer Schein
  ctx.fillStyle = 'rgba(255,193,7,0.22)';
  ctx.beginPath();
  ctx.arc(cx * ps, sy * ps + off, ps * 2.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTrophyNecklace(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Goldkette
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx - 1.6) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.8) * ps + off, (cx + 1.6) * ps, ny * ps + off);
  ctx.stroke();
  // Pokal-Kelch mit Goldverlauf
  const ty = ny + 1.2;
  const grad = ctx.createLinearGradient((cx - 1) * ps, 0, (cx + 1) * ps, 0);
  grad.addColorStop(0, '#B8860B');
  grad.addColorStop(0.5, '#FFE082');
  grad.addColorStop(1, '#DAA520');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - 0.9) * ps, ty * ps + off);
  ctx.quadraticCurveTo((cx - 0.8) * ps, (ty + 1.5) * ps + off, cx * ps, (ty + 1.7) * ps + off);
  ctx.quadraticCurveTo((cx + 0.8) * ps, (ty + 1.5) * ps + off, (cx + 0.9) * ps, ty * ps + off);
  ctx.closePath();
  ctx.fill();
  // Henkel
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.arc((cx - 1.05) * ps, (ty + 0.45) * ps + off, ps * 0.35, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc((cx + 1.05) * ps, (ty + 0.45) * ps + off, ps * 0.35, Math.PI * 1.5, Math.PI * 0.5);
  ctx.stroke();
  // Fuss
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - 0.14) * ps, (ty + 1.7) * ps + off, ps * 0.28, ps * 0.55);
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 2.5) * ps + off, ps * 0.75, ps * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stern und Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ty + 0.35) * ps + off);
  ctx.lineTo((cx + 0.2) * ps, (ty + 0.75) * ps + off);
  ctx.lineTo(cx * ps, (ty + 1.15) * ps + off);
  ctx.lineTo((cx - 0.2) * ps, (ty + 0.75) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc((cx - 0.45) * ps, (ty + 0.4) * ps + off, ps * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

export function drawInfinityScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Oberer Loop
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = ps * 1.35;
  ctx.beginPath();
  ctx.moveTo((cx - nhw - 0.4) * ps, (ny - 0.1) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ny + 0.9) * ps + off,
    (cx + nhw + 0.4) * ps,
    (ny - 0.1) * ps + off
  );
  ctx.stroke();
  // Unterer Loop
  ctx.strokeStyle = '#607D8B';
  ctx.lineWidth = ps * 1.15;
  ctx.beginPath();
  ctx.moveTo((cx - nhw * 0.75) * ps, (ny + 0.7) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ny + 2.2) * ps + off,
    (cx + nhw * 0.75) * ps,
    (ny + 0.7) * ps + off
  );
  ctx.stroke();
  // Kreuzungs-Falte
  ctx.strokeStyle = '#546E7A';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx - 0.9) * ps, (ny + 1.4) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1.9) * ps + off, (cx + 0.9) * ps, (ny + 1.4) * ps + off);
  ctx.stroke();
  // Strickrippen
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = ps * 0.12;
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * (nhw * 0.4);
    ctx.beginPath();
    ctx.moveTo((x - 0.1) * ps, (ny - 0.6 + Math.abs(i) * 0.1) * ps + off);
    ctx.lineTo((x + 0.15) * ps, (ny + 0.55 + Math.abs(i) * 0.1) * ps + off);
    ctx.stroke();
  }
}

export function drawChampionBelt(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  // Guertel sitzt am Bauch, nicht am Hals
  const by = a.neckY + 3;
  const nhw = a.neckHalfWidth;
  // Ledergurt
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = ps * 1.5;
  ctx.beginPath();
  ctx.moveTo((cx - nhw - 0.4) * ps, (by + 1.4) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (by + 1.8) * ps + off,
    (cx + nhw + 0.4) * ps,
    (by + 1.4) * ps + off
  );
  ctx.stroke();
  // Ziernaht
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = ps * 0.12;
  ctx.beginPath();
  ctx.moveTo((cx - nhw - 0.2) * ps, (by + 1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (by + 1.4) * ps + off, (cx + nhw + 0.2) * ps, (by + 1) * ps + off);
  ctx.stroke();
  // Goldplatte mit Verlauf
  const grad = ctx.createRadialGradient(
    (cx - 0.4) * ps,
    (by + 0.9) * ps + off,
    ps * 0.2,
    cx * ps,
    (by + 1.3) * ps + off,
    ps * 1.8
  );
  grad.addColorStop(0, '#FFF3B0');
  grad.addColorStop(0.6, '#FFD700');
  grad.addColorStop(1, '#B8860B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (by + 1.3) * ps + off, ps * 1.75, ps * 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Zierring
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (by + 1.3) * ps + off, ps * 1.4, ps * 1.05, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Stern
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 0.6 : 0.25;
    const sx = cx + Math.cos(ang) * r;
    const sy = by + 1.3 + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(sx * ps, sy * ps + off);
    else ctx.lineTo(sx * ps, sy * ps + off);
  }
  ctx.closePath();
  ctx.fill();
  // Seitliche Rubine
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.arc((cx - 1.35) * ps, (by + 1.35) * ps + off, ps * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx + 1.35) * ps, (by + 1.35) * ps + off, ps * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc((cx - 1.42) * ps, (by + 1.28) * ps + off, ps * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

export function drawEnchantedRose(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Ranke
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = ps * 0.24;
  ctx.beginPath();
  ctx.moveTo((cx - 1.6) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.8) * ps + off, (cx + 1.6) * ps, ny * ps + off);
  ctx.stroke();
  // Rosenbluete aus weichen Blaettern
  const ry = ny + 1.9;
  ctx.fillStyle = '#C62828';
  for (let p = 0; p < 5; p++) {
    const ang = (p / 5) * Math.PI * 2;
    const px = cx + Math.cos(ang) * 0.5;
    const py = ry + Math.sin(ang) * 0.5;
    ctx.beginPath();
    ctx.arc(px * ps, py * ps + off, ps * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#E53935';
  for (let p = 0; p < 3; p++) {
    const ang = (p / 3) * Math.PI * 2 + 0.5;
    const px = cx + Math.cos(ang) * 0.24;
    const py = ry + Math.sin(ang) * 0.24;
    ctx.beginPath();
    ctx.arc(px * ps, py * ps + off, ps * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Spiral-Herz
  ctx.strokeStyle = '#8E0000';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.arc(cx * ps, ry * ps + off, ps * 0.2, 0, Math.PI * 1.5);
  ctx.stroke();
  // Blaetter
  ctx.fillStyle = '#388E3C';
  ctx.beginPath();
  ctx.ellipse((cx - 0.95) * ps, (ry + 0.55) * ps + off, ps * 0.42, ps * 0.22, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 0.95) * ps, (ry + 0.5) * ps + off, ps * 0.42, ps * 0.22, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Zauberfunkeln
  ctx.fillStyle = 'rgba(255,215,0,0.8)';
  ctx.beginPath();
  ctx.arc((cx - 1.3) * ps, (ry - 0.9) * ps + off, ps * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx + 1.25) * ps, (ry - 0.5) * ps + off, ps * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((cx + 0.3) * ps, (ry + 1.2) * ps + off, ps * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Zauber-Schein
  ctx.fillStyle = 'rgba(255,215,0,0.15)';
  ctx.beginPath();
  ctx.arc(cx * ps, ry * ps + off, ps * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDragonScaleCollar(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nhw = a.neckHalfWidth;
  // Basisband
  ctx.strokeStyle = '#1B5E20';
  ctx.lineWidth = ps * 1.3;
  ctx.beginPath();
  ctx.moveTo((cx - nhw) * ps, (ny + 0.1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + nhw) * ps, (ny + 0.1) * ps + off);
  ctx.stroke();
  // Schuppenreihen
  const cnt = 5;
  const sp = (nhw * 2 - 1) / (cnt - 1);
  for (let row = 0; row < 2; row++) {
    const n = row === 0 ? cnt : cnt - 1;
    for (let i = 0; i < n; i++) {
      const x = cx - nhw + 0.5 + i * sp + (row === 1 ? sp / 2 : 0);
      const t = (x - (cx - nhw)) / (nhw * 2);
      const y = ny - 0.15 + row * 0.55 + Math.sin(t * Math.PI) * 0.5;
      ctx.fillStyle = (i + row) % 2 === 0 ? '#2E8B57' : '#43A047';
      ctx.beginPath();
      ctx.arc(x * ps, y * ps + off, ps * 0.42, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc((x - 0.1) * ps, (y + 0.08) * ps + off, ps * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Goldener Schmuckstein
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx * ps, (ny + 0.95) * ps + off, ps * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc((cx - 0.1) * ps, (ny + 0.85) * ps + off, ps * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRuneNecklace(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Lederkordel
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = ps * 0.26;
  ctx.beginPath();
  ctx.moveTo((cx - 1.9) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + 1.9) * ps, ny * ps + off);
  ctx.stroke();
  // Steinamulett
  const by = ny + 2;
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.ellipse(cx * ps, by * ps + off, ps * 0.95, ps * 1.1, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#263238';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.ellipse(cx * ps, by * ps + off, ps * 0.95, ps * 1.1, 0.1, 0, Math.PI * 2);
  ctx.stroke();
  // Leuchtende Rune
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.moveTo((cx - 0.25) * ps, (by - 0.65) * ps + off);
  ctx.lineTo((cx - 0.25) * ps, (by + 0.65) * ps + off);
  ctx.moveTo((cx - 0.25) * ps, (by - 0.45) * ps + off);
  ctx.lineTo((cx + 0.4) * ps, (by - 0.1) * ps + off);
  ctx.moveTo((cx - 0.25) * ps, (by + 0.1) * ps + off);
  ctx.lineTo((cx + 0.4) * ps, (by + 0.45) * ps + off);
  ctx.stroke();
  // Runen-Schein
  ctx.fillStyle = 'rgba(0,230,118,0.22)';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Glanzpunkt
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc((cx - 0.4) * ps, (by - 0.6) * ps + off, ps * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSakuraPendant(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Zarte Kette
  ctx.strokeStyle = '#F48FB1';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo((cx - 1.6) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.8) * ps + off, (cx + 1.6) * ps, ny * ps + off);
  ctx.stroke();
  // Kirschbluete
  const by = ny + 1.9;
  ctx.fillStyle = '#F8BBD0';
  for (let p = 0; p < 5; p++) {
    const ang = (p / 5) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(ang) * 0.42;
    const py = by + Math.sin(ang) * 0.42;
    ctx.beginPath();
    ctx.arc(px * ps, py * ps + off, ps * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  // Staubblaetter
  ctx.fillStyle = '#F57F17';
  for (let p = 0; p < 3; p++) {
    const ang = (p / 3) * Math.PI * 2 + 0.4;
    const px = cx + Math.cos(ang) * 0.22;
    const py = by + Math.sin(ang) * 0.22;
    ctx.beginPath();
    ctx.arc(px * ps, py * ps + off, ps * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Schwebende Bluetenblaetter
  ctx.fillStyle = 'rgba(248,187,208,0.8)';
  ctx.beginPath();
  ctx.ellipse((cx - 1.6) * ps, (by - 0.7) * ps + off, ps * 0.2, ps * 0.12, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1.5) * ps, (by + 0.4) * ps + off, ps * 0.18, ps * 0.11, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc((cx - 0.15) * ps, (by - 0.55) * ps + off, ps * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawObsidianAmulet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  // Dunkle Kordel
  ctx.strokeStyle = '#424242';
  ctx.lineWidth = ps * 0.26;
  ctx.beginPath();
  ctx.moveTo((cx - 1.7) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.9) * ps + off, (cx + 1.7) * ps, ny * ps + off);
  ctx.stroke();
  // Obsidian-Scherbe mit Verlauf
  const by = ny + 2.1;
  const grad = ctx.createLinearGradient(
    cx * ps,
    (by - 1.2) * ps + off,
    cx * ps,
    (by + 1.4) * ps + off
  );
  grad.addColorStop(0, '#37474F');
  grad.addColorStop(1, '#0D0D0D');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx * ps, (by - 1.2) * ps + off);
  ctx.lineTo((cx + 0.8) * ps, (by - 0.25) * ps + off);
  ctx.lineTo((cx + 0.45) * ps, (by + 0.95) * ps + off);
  ctx.lineTo(cx * ps, (by + 1.4) * ps + off);
  ctx.lineTo((cx - 0.45) * ps, (by + 0.95) * ps + off);
  ctx.lineTo((cx - 0.8) * ps, (by - 0.25) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Violette Ader
  ctx.strokeStyle = '#7C4DFF';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.moveTo((cx - 0.3) * ps, (by - 0.7) * ps + off);
  ctx.lineTo((cx + 0.15) * ps, (by + 0.05) * ps + off);
  ctx.lineTo((cx - 0.15) * ps, (by + 0.85) * ps + off);
  ctx.stroke();
  // Glaskante
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = ps * 0.1;
  ctx.beginPath();
  ctx.moveTo((cx - 0.05) * ps, (by - 1.1) * ps + off);
  ctx.lineTo((cx - 0.7) * ps, (by - 0.25) * ps + off);
  ctx.stroke();
  // Mystischer Schein
  ctx.fillStyle = 'rgba(124,77,255,0.2)';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Erweiterung Juli 2026: neue Hals-Accessoires ──────────────────────────

export function drawWoolScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Gestreifter Wollschal mit hängendem Ende
  const stripes = ['#EF5350', '#FFCA28', '#EF5350', '#FFCA28'];
  const segW = (nw * 2) / 4;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = stripes[i];
    ctx.fillRect((cx - nw + i * segW) * ps, (ny - 0.4) * ps + off, ps * segW, ps * 1.2);
  }
  // Hängendes Ende mit Fransen
  ctx.fillStyle = '#EF5350';
  ctx.fillRect((cx + nw * 0.35) * ps, (ny + 0.6) * ps + off, ps * 1.2, ps * 2.4);
  ctx.fillStyle = '#FFCA28';
  ctx.fillRect((cx + nw * 0.35) * ps, (ny + 1.6) * ps + off, ps * 1.2, ps * 0.7);
  ctx.fillStyle = '#D32F2F';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect((cx + nw * 0.35 + i * 0.45) * ps, (ny + 3) * ps + off, ps * 0.2, ps * 0.6);
  }
}

export function drawLeafCape(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Umhang aus überlappenden Blättern
  const greens = ['#66BB6A', '#4CAF50', '#81C784'];
  for (let row = 0; row < 2; row++) {
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = greens[(i + row + 2) % 3];
      ctx.beginPath();
      ctx.ellipse(
        (cx + i * (nw * 0.42)) * ps,
        (ny + 0.5 + row * 1.1) * ps + off,
        ps * 0.9,
        ps * 1.2,
        i * 0.15,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  // Ranken-Kordel
  ctx.strokeStyle = '#33691E';
  ctx.lineWidth = ps * 0.25;
  ctx.beginPath();
  ctx.moveTo((cx - nw) * ps, (ny - 0.2) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 0.4) * ps + off, (cx + nw) * ps, (ny - 0.2) * ps + off);
  ctx.stroke();
}

export function drawSeaweedScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Wellige Algen-Bänder
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = ps * 0.55;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo((cx - nw) * ps, (ny + i * 0.4) * ps + off);
    ctx.quadraticCurveTo(
      (cx - nw / 2) * ps,
      (ny + i * 0.4 + 0.6) * ps + off,
      cx * ps,
      (ny + i * 0.4) * ps + off
    );
    ctx.quadraticCurveTo(
      (cx + nw / 2) * ps,
      (ny + i * 0.4 - 0.6) * ps + off,
      (cx + nw) * ps,
      (ny + i * 0.4) * ps + off
    );
    ctx.stroke();
  }
  // Hängende Algen-Spitze mit Bläschen
  ctx.strokeStyle = '#43A047';
  ctx.beginPath();
  ctx.moveTo((cx - nw * 0.4) * ps, (ny + 0.5) * ps + off);
  ctx.quadraticCurveTo(
    (cx - nw * 0.6) * ps,
    (ny + 1.6) * ps + off,
    (cx - nw * 0.3) * ps,
    (ny + 2.6) * ps + off
  );
  ctx.stroke();
  ctx.fillStyle = 'rgba(178, 235, 242, 0.8)';
  ctx.beginPath();
  ctx.arc((cx + nw * 0.5) * ps, (ny + 1.4) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.arc((cx + nw * 0.8) * ps, (ny + 2.1) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHeadphonesNeck(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const hw = a.headHalfWidth;
  const earY = a.eyeY + 0.5;
  // Bügel über der Kopfkrone
  ctx.strokeStyle = '#37474F';
  ctx.lineWidth = ps * 0.55;
  ctx.beginPath();
  ctx.arc(cx * ps, earY * ps + off, ps * (hw * 0.98), Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();
  // Ohrmuscheln seitlich am Kopf
  ctx.fillStyle = '#455A64';
  ctx.beginPath();
  ctx.ellipse((cx - hw * 0.95) * ps, earY * ps + off, ps * 0.85, ps * 1.1, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + hw * 0.95) * ps, earY * ps + off, ps * 0.85, ps * 1.1, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Polster-Highlights
  ctx.fillStyle = '#00E5FF';
  ctx.beginPath();
  ctx.ellipse((cx - hw * 0.95) * ps, earY * ps + off, ps * 0.4, ps * 0.6, -0.15, 0, Math.PI * 2);
  ctx.ellipse((cx + hw * 0.95) * ps, earY * ps + off, ps * 0.4, ps * 0.6, 0.15, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPearlNecklace(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Perlenbogen
  const count = 7;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = cx - nw + t * nw * 2;
    const y = ny + Math.sin(t * Math.PI) * 1.1;
    ctx.fillStyle = '#FAFAFA';
    ctx.beginPath();
    ctx.arc(x * ps, y * ps + off, ps * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc((x - 0.12) * ps, (y - 0.12) * ps + off, ps * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(179, 157, 219, 0.35)';
    ctx.beginPath();
    ctx.arc((x + 0.1) * ps, (y + 0.12) * ps + off, ps * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawFilmstripScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Filmstreifen als Schal (TV-Rank!)
  ctx.fillStyle = '#212121';
  ctx.fillRect((cx - nw) * ps, (ny - 0.4) * ps + off, ps * nw * 2, ps * 1.3);
  // Perforation oben/unten
  ctx.fillStyle = '#FAFAFA';
  const holes = Math.floor(nw * 2);
  for (let i = 0; i < holes; i++) {
    const x = cx - nw + 0.3 + i;
    ctx.fillRect(x * ps, (ny - 0.25) * ps + off, ps * 0.28, ps * 0.22);
    ctx.fillRect(x * ps, (ny + 0.63) * ps + off, ps * 0.28, ps * 0.22);
  }
  // Frames (kleine Bilder)
  ctx.fillStyle = '#64B5F6';
  for (let i = 0; i < Math.floor(holes / 2); i++) {
    ctx.fillRect((cx - nw + 0.4 + i * 2) * ps, (ny + 0.07) * ps + off, ps * 1.15, ps * 0.5);
  }
  // Hängendes Ende
  ctx.fillStyle = '#212121';
  ctx.fillRect((cx + nw * 0.3) * ps, (ny + 0.8) * ps + off, ps * 1.3, ps * 2.2);
  ctx.fillStyle = '#64B5F6';
  ctx.fillRect((cx + nw * 0.3 + 0.15) * ps, (ny + 1.2) * ps + off, ps * 1, ps * 0.55);
  ctx.fillRect((cx + nw * 0.3 + 0.15) * ps, (ny + 2.1) * ps + off, ps * 1, ps * 0.55);
}

export function drawDiscoChain(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Kette
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - nw * 0.8) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1.2) * ps + off, (cx + nw * 0.8) * ps, ny * ps + off);
  ctx.stroke();
  // Discokugel-Anhänger
  const bx = cx;
  const by = ny + 1.9;
  const grad = ctx.createRadialGradient(
    (bx - 0.3) * ps,
    (by - 0.3) * ps + off,
    ps * 0.1,
    bx * ps,
    by * ps + off,
    ps * 1.05
  );
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#CFD8DC');
  grad.addColorStop(1, '#90A4AE');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(bx * ps, by * ps + off, ps * 1.05, 0, Math.PI * 2);
  ctx.fill();
  // Spiegel-Facetten
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = ps * 0.12;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo((bx + i * 0.5) * ps, (by - 1) * ps + off);
    ctx.lineTo((bx + i * 0.5) * ps, (by + 1) * ps + off);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo((bx - 1) * ps, by * ps + off);
  ctx.lineTo((bx + 1) * ps, by * ps + off);
  ctx.stroke();
  // Funkel-Reflexe
  ctx.fillStyle = '#FFF176';
  ctx.fillRect((bx + 1.2) * ps, (by - 0.9) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillStyle = '#80DEEA';
  ctx.fillRect((bx - 1.5) * ps, (by + 0.3) * ps + off, ps * 0.28, ps * 0.28);
}

export function drawLavaAmulet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Obsidian-Kette
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = ps * 0.35;
  ctx.beginPath();
  ctx.moveTo((cx - nw * 0.8) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1) * ps + off, (cx + nw * 0.8) * ps, ny * ps + off);
  ctx.stroke();
  // Tropfenförmiger Lava-Stein
  const by = ny + 2;
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.moveTo(cx * ps, (by - 1.1) * ps + off);
  ctx.quadraticCurveTo((cx + 1.1) * ps, by * ps + off, cx * ps, (by + 1.2) * ps + off);
  ctx.quadraticCurveTo((cx - 1.1) * ps, by * ps + off, cx * ps, (by - 1.1) * ps + off);
  ctx.fill();
  // Glühende Lava-Adern
  ctx.strokeStyle = '#FF6D00';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo((cx - 0.4) * ps, (by - 0.6) * ps + off);
  ctx.lineTo((cx + 0.2) * ps, by * ps + off);
  ctx.lineTo((cx - 0.25) * ps, (by + 0.7) * ps + off);
  ctx.stroke();
  ctx.strokeStyle = '#FFAB00';
  ctx.beginPath();
  ctx.moveTo((cx + 0.45) * ps, (by - 0.4) * ps + off);
  ctx.lineTo((cx + 0.1) * ps, (by + 0.5) * ps + off);
  ctx.stroke();
  // Glut-Schein
  ctx.fillStyle = 'rgba(255, 109, 0, 0.25)';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAuroraScarf(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Polarlicht-Schleier: drei überlagerte, halbtransparente Farbbänder
  const bands: [string, number][] = [
    ['rgba(0, 230, 118, 0.55)', -0.35],
    ['rgba(64, 196, 255, 0.5)', 0.15],
    ['rgba(224, 64, 251, 0.45)', 0.65],
  ];
  for (const [c, dy] of bands) {
    ctx.strokeStyle = c;
    ctx.lineWidth = ps * 0.75;
    ctx.beginPath();
    ctx.moveTo((cx - nw - 0.6) * ps, (ny + dy) * ps + off);
    ctx.quadraticCurveTo(
      (cx - nw / 2) * ps,
      (ny + dy + 0.8) * ps + off,
      cx * ps,
      (ny + dy + 0.2) * ps + off
    );
    ctx.quadraticCurveTo(
      (cx + nw / 2) * ps,
      (ny + dy - 0.5) * ps + off,
      (cx + nw + 0.6) * ps,
      (ny + dy + 0.4) * ps + off
    );
    ctx.stroke();
  }
  // Wehendes Schleier-Ende
  ctx.fillStyle = 'rgba(64, 196, 255, 0.35)';
  ctx.beginPath();
  ctx.moveTo((cx + nw * 0.4) * ps, (ny + 0.8) * ps + off);
  ctx.quadraticCurveTo(
    (cx + nw + 1.4) * ps,
    (ny + 2) * ps + off,
    (cx + nw * 0.6) * ps,
    (ny + 3.2) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + nw * 0.2) * ps,
    (ny + 2) * ps + off,
    (cx + nw * 0.4) * ps,
    (ny + 0.8) * ps + off
  );
  ctx.fill();
  // Sternchen
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - nw * 0.5) * ps, (ny - 0.1) * ps + off, ps * 0.22, ps * 0.22);
  ctx.fillRect((cx + nw * 0.7) * ps, (ny + 1.6) * ps + off, ps * 0.26, ps * 0.26);
}

export function drawKrakenCharm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const nw = a.neckHalfWidth;
  // Dunkle Kordel
  ctx.strokeStyle = '#1A237E';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - nw * 0.8) * ps, ny * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ny + 1) * ps + off, (cx + nw * 0.8) * ps, ny * ps + off);
  ctx.stroke();
  // Kraken-Kopf-Anhänger
  const by = ny + 1.9;
  ctx.fillStyle = '#283593';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 0.95, Math.PI, 0);
  ctx.fill();
  ctx.fillRect((cx - 0.95) * ps, by * ps + off, ps * 1.9, ps * 0.5);
  // Tentakel
  ctx.strokeStyle = '#283593';
  ctx.lineWidth = ps * 0.3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo((cx + i * 0.4) * ps, (by + 0.45) * ps + off);
    ctx.quadraticCurveTo(
      (cx + i * 0.65) * ps,
      (by + 1.15) * ps + off,
      (cx + i * 0.35) * ps,
      (by + 1.6) * ps + off
    );
    ctx.stroke();
  }
  // Leuchtende Augen
  ctx.fillStyle = '#00E5FF';
  ctx.beginPath();
  ctx.arc((cx - 0.4) * ps, (by - 0.15) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.arc((cx + 0.4) * ps, (by - 0.15) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Tiefsee-Glow
  ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(cx * ps, by * ps + off, ps * 1.7, 0, Math.PI * 2);
  ctx.fill();
}
