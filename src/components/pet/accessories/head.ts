import type { PetAnchors } from './shared';
import { darken, lighten } from './shared';

// Kleiner 4-Zack-Funkelstern
function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.3, y - r * 0.3);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.3, y + r * 0.3);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.3, y + r * 0.3);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.3, y - r * 0.3);
  ctx.closePath();
  ctx.fill();
}

export function drawBeanie(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth * 0.98;

  // Weiche Kuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.4) * ps + off, 0, (ty + 0.8) * ps + off);
  grad.addColorStop(0, '#7B96F0');
  grad.addColorStop(1, '#4169E1');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.4) * ps + off, ps * w, ps * 3.2, 0, Math.PI, 0);
  ctx.fill();
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - w * 0.4) * ps,
    (ty - 1.7) * ps + off,
    ps * 0.9,
    ps * 0.45,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Bündchen mit Rippen
  ctx.fillStyle = '#3157C0';
  ctx.fillRect((cx - w) * ps, (ty - 0.2) * ps + off, ps * w * 2, ps * 1.1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = ps * 0.18;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo((cx + i * w * 0.28) * ps, (ty - 0.1) * ps + off);
    ctx.lineTo((cx + i * w * 0.28) * ps, (ty + 0.8) * ps + off);
    ctx.stroke();
  }
  // Pompon mit Schatten und Glanz
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 3.5) * ps + off, ps * 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.beginPath();
  ctx.arc((cx + 0.25) * ps, (ty - 3.3) * ps + off, ps * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc((cx - 0.3) * ps, (ty - 3.8) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBaseballCap(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  const w = hw * 0.95;
  // Kuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 2.6) * ps + off, 0, (ty + 1) * ps + off);
  grad.addColorStop(0, '#E53935');
  grad.addColorStop(1, '#B71C1C');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.8) * ps + off, ps * w, ps * 3, 0, Math.PI, 0);
  ctx.fill();
  // Panelnähte
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = ps * 0.15;
  for (const dx of [-w * 0.55, 0, w * 0.55]) {
    ctx.beginPath();
    ctx.moveTo(cx * ps, (ty - 2) * ps + off);
    ctx.quadraticCurveTo(
      (cx + dx) * ps,
      (ty - 1.4) * ps + off,
      (cx + dx) * ps,
      (ty + 0.7) * ps + off
    );
    ctx.stroke();
  }
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse((cx - w * 0.4) * ps, (ty - 1.2) * ps + off, ps * 0.8, ps * 0.4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Schirm nach vorn (links)
  ctx.fillStyle = '#8E1414';
  ctx.beginPath();
  ctx.ellipse(
    (cx - w - 1.1) * ps,
    (ty + 0.8) * ps + off,
    ps * 2.1,
    ps * 0.6,
    -0.12,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - w - 1.2) * ps,
    (ty + 0.6) * ps + off,
    ps * 1.5,
    ps * 0.28,
    -0.12,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Knopf
  ctx.fillStyle = '#FF6659';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 2.1) * ps + off, ps * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFlowerCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  const w = hw * 1.0;
  // Geschwungene Ranke
  ctx.strokeStyle = '#2E8B57';
  ctx.lineWidth = ps * 0.45;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty + 0.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty - 0.5) * ps + off, (cx + w) * ps, (ty + 0.5) * ps + off);
  ctx.stroke();
  // Blätter an den Enden
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.ellipse(
    (cx - w - 0.4) * ps,
    (ty + 0.3) * ps + off,
    ps * 0.7,
    ps * 0.35,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + w + 0.4) * ps, (ty + 0.3) * ps + off, ps * 0.7, ps * 0.35, 0.6, 0, Math.PI * 2);
  ctx.fill();
  // Blüten mit runden Blättchen und Goldmitte
  const flowers: [number, number, string][] = [
    [-w * 0.9, 0.2, '#FF80AB'],
    [-w * 0.45, -0.3, '#FFD54F'],
    [0, -0.5, '#FF8A65'],
    [w * 0.45, -0.3, '#CE93D8'],
    [w * 0.9, 0.2, '#FF80AB'],
  ];
  for (const [dx, dy, c] of flowers) {
    ctx.fillStyle = c;
    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2 + Math.PI / 4;
      const px = cx + dx + Math.cos(ang) * 0.38;
      const py = ty + dy + Math.sin(ang) * 0.38;
      ctx.beginPath();
      ctx.arc(px * ps, py * ps + off, ps * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + dy) * ps + off, ps * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc((cx + dx - 0.1) * ps, (ty + dy - 0.1) * ps + off, ps * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBandana(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors,
  color?: string
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const c = color || '#FF0000';

  const w = hw * 1.0;
  // Gewelltes Stirnband
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo((cx - w - 0.3) * ps, (ty + 0.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty - 0.1) * ps + off, (cx + w + 0.3) * ps, (ty + 0.5) * ps + off);
  ctx.lineTo((cx + w + 0.3) * ps, (ty + 1.8) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 2.3) * ps + off, (cx - w - 0.3) * ps, (ty + 1.8) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Schattenfalte unten
  ctx.strokeStyle = darken(c, 40);
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - w - 0.3) * ps, (ty + 1.7) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 2.2) * ps + off, (cx + w + 0.3) * ps, (ty + 1.7) * ps + off);
  ctx.stroke();
  // Knoten rechts
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc((cx + w + 0.6) * ps, (ty + 1) * ps + off, ps * 0.8, 0, Math.PI * 2);
  ctx.fill();
  // Flatternde Zipfel
  ctx.beginPath();
  ctx.moveTo((cx + w + 0.4) * ps, (ty + 1.2) * ps + off);
  ctx.quadraticCurveTo(
    (cx + w + 2.4) * ps,
    (ty + 1.5) * ps + off,
    (cx + w + 2.1) * ps,
    (ty + 3.4) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + w + 1.2) * ps,
    (ty + 2.6) * ps + off,
    (cx + w + 0.5) * ps,
    (ty + 1.7) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(c, 25);
  ctx.beginPath();
  ctx.moveTo((cx + w + 0.9) * ps, (ty + 1.5) * ps + off);
  ctx.quadraticCurveTo(
    (cx + w + 1) * ps,
    (ty + 2.8) * ps + off,
    (cx + w + 0.5) * ps,
    (ty + 3.8) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + w + 0.1) * ps,
    (ty + 2.6) * ps + off,
    (cx + w + 0.3) * ps,
    (ty + 1.7) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Knoten-Glanz
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc((cx + w + 0.4) * ps, (ty + 0.8) * ps + off, ps * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // Pünktchenmuster
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc((cx - w + 0.6 + i * w * 0.55) * ps, (ty + 1.05) * ps + off, ps * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPartyHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3);

  const base = hw * 0.95;
  const tipY = ty - 6.2;
  // Kegel mit Verlauf
  const grad = ctx.createLinearGradient(0, tipY * ps + off, 0, (ty + 0.6) * ps + off);
  grad.addColorStop(0, '#FF8AC5');
  grad.addColorStop(1, '#FF4D9E');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - base) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo((cx + base) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo(cx * ps, tipY * ps + off);
  ctx.closePath();
  ctx.fill();
  // Schräge Streifen
  ctx.fillStyle = '#FFD54F';
  for (let i = 0; i < 3; i++) {
    const f0 = 0.15 + i * 0.3;
    const f1 = f0 + 0.14;
    ctx.beginPath();
    ctx.moveTo((cx - base * (1 - f0)) * ps, (ty + 0.6 - f0 * 6.8) * ps + off);
    ctx.lineTo((cx + base * (1 - f0)) * ps, (ty + 0.6 - f0 * 6.8 + 0.5) * ps + off);
    ctx.lineTo((cx + base * (1 - f1)) * ps, (ty + 0.6 - f1 * 6.8 + 0.5) * ps + off);
    ctx.lineTo((cx - base * (1 - f1)) * ps, (ty + 0.6 - f1 * 6.8) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Glanzkante
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo((cx - base * 0.75) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo((cx - base * 0.45) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo(cx * ps, tipY * ps + off);
  ctx.closePath();
  ctx.fill();
  // Pompon auf der Spitze
  ctx.fillStyle = '#26C6DA';
  ctx.beginPath();
  ctx.arc(cx * ps, (tipY - 0.4) * ps + off, ps * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc((cx - 0.2) * ps, (tipY - 0.6) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Konfetti
  ctx.fillStyle = '#FFD54F';
  sparkle(ctx, (cx - base - 0.7) * ps, (ty - 2.5) * ps + off, ps * 0.45);
  ctx.fillStyle = '#26C6DA';
  sparkle(ctx, (cx + base + 0.7) * ps, (ty - 3.6) * ps + off, ps * 0.4);
}

export function drawTopHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  const bw = hw * 0.8;
  // Zylinder mit seitlichem Verlauf
  const grad = ctx.createLinearGradient((cx - bw) * ps, 0, (cx + bw) * ps, 0);
  grad.addColorStop(0, '#3a3a3a');
  grad.addColorStop(0.35, '#1c1c1c');
  grad.addColorStop(1, '#111111');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - bw) * ps, (ty + 0.3) * ps + off);
  ctx.lineTo((cx - bw * 0.92) * ps, (ty - 5.2) * ps + off);
  ctx.lineTo((cx + bw * 0.92) * ps, (ty - 5.2) * ps + off);
  ctx.lineTo((cx + bw) * ps, (ty + 0.3) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Deckel
  ctx.fillStyle = '#2e2e2e';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 5.2) * ps + off, ps * bw * 0.92, ps * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Krempe
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.4) * ps + off, ps * (hw + 1), ps * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.25) * ps + off, ps * (hw + 0.8), ps * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // Satinband mit Verlauf
  const band = ctx.createLinearGradient(0, (ty - 1.6) * ps + off, 0, (ty - 0.4) * ps + off);
  band.addColorStop(0, '#B03040');
  band.addColorStop(1, '#7A1020');
  ctx.fillStyle = band;
  ctx.fillRect((cx - bw * 0.97) * ps, (ty - 1.6) * ps + off, ps * bw * 1.94, ps * 1.2);
  // Seidenglanz
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - bw * 0.45) * ps,
    (ty - 3.2) * ps + off,
    ps * 0.5,
    ps * 1.7,
    0.05,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawSantaHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  const w = hw * 0.95;
  // Roter Zipfel, nach rechts geschwungen
  const grad = ctx.createLinearGradient(0, (ty - 5.5) * ps + off, 0, (ty + 0.5) * ps + off);
  grad.addColorStop(0, '#E53935');
  grad.addColorStop(1, '#B71C1C');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty + 0.4) * ps + off);
  ctx.quadraticCurveTo(
    (cx - w * 0.6) * ps,
    (ty - 3.2) * ps + off,
    (cx + 1) * ps,
    (ty - 4.2) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + 3.4) * ps,
    (ty - 5.2) * ps + off,
    (cx + 4) * ps,
    (ty - 5.6) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + 3.2) * ps,
    (ty - 3.6) * ps + off,
    (cx + w * 0.9) * ps,
    (ty - 1.6) * ps + off
  );
  ctx.quadraticCurveTo((cx + w) * ps, (ty - 0.6) * ps + off, (cx + w) * ps, (ty + 0.4) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Faltenschatten
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.moveTo((cx - w * 0.3) * ps, (ty + 0.2) * ps + off);
  ctx.quadraticCurveTo((cx + 0.5) * ps, (ty - 2) * ps + off, (cx + 2.4) * ps, (ty - 4) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 0.8) * ps,
    (ty - 2.4) * ps + off,
    (cx + 0.2) * ps,
    (ty + 0.2) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Weisser Fellrand aus Bommelchen
  ctx.fillStyle = '#FFFFFF';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc((cx + (i * w) / 3) * ps, (ty + 0.5) * ps + off, ps * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc((cx + (i * w) / 3) * ps, (ty + 0.85) * ps + off, ps * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pompon
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc((cx + 4.2) * ps, (ty - 5.8) * ps + off, ps * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc((cx + 3.9) * ps, (ty - 6.1) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPirateHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Hutkrone
  const grad = ctx.createLinearGradient(0, (ty - 4) * ps + off, 0, (ty + 0.5) * ps + off);
  grad.addColorStop(0, '#3a2415');
  grad.addColorStop(1, '#1a0f06');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.2) * ps + off, ps * hw * 0.85, ps * 3.8, 0, Math.PI, 0);
  ctx.fill();
  // Aufgeschlagene Krempe links und rechts
  ctx.fillStyle = '#2B1B0E';
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo((cx + side * hw * 0.2) * ps, (ty + 0.6) * ps + off);
    ctx.quadraticCurveTo(
      (cx + side * (hw + 1.2)) * ps,
      (ty + 1) * ps + off,
      (cx + side * (hw + 1.6)) * ps,
      (ty - 2.2) * ps + off
    );
    ctx.quadraticCurveTo(
      (cx + side * hw) * ps,
      (ty - 0.9) * ps + off,
      (cx + side * hw * 0.2) * ps,
      (ty - 0.2) * ps + off
    );
    ctx.closePath();
    ctx.fill();
  }
  // Goldene Bordüre
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - hw - 1.5) * ps, (ty - 2.1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 1.2) * ps + off, (cx + hw + 1.5) * ps, (ty - 2.1) * ps + off);
  ctx.stroke();
  // Niedlicher Totenkopf
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 2) * ps + off, ps * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect((cx - 0.45) * ps, (ty - 1.6) * ps + off, ps * 0.9, ps * 0.55);
  ctx.fillStyle = '#1a0f06';
  ctx.beginPath();
  ctx.arc((cx - 0.32) * ps, (ty - 2.1) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.arc((cx + 0.32) * ps, (ty - 2.1) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Gekreuzte Knochen
  ctx.strokeStyle = '#E8E8E8';
  ctx.lineWidth = ps * 0.25;
  ctx.beginPath();
  ctx.moveTo((cx - 1.1) * ps, (ty - 0.5) * ps + off);
  ctx.lineTo((cx + 1.1) * ps, (ty - 1.3) * ps + off);
  ctx.moveTo((cx - 1.1) * ps, (ty - 1.3) * ps + off);
  ctx.lineTo((cx + 1.1) * ps, (ty - 0.5) * ps + off);
  ctx.stroke();
}

export function drawWizardHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Kegel mit geknickter Spitze
  const grad = ctx.createLinearGradient(0, (ty - 8) * ps + off, 0, (ty + 0.5) * ps + off);
  grad.addColorStop(0, '#5B2AB0');
  grad.addColorStop(1, '#2E1065');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.9) * ps, (ty + 0.4) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw * 0.5) * ps,
    (ty - 4) * ps + off,
    (cx - 0.3) * ps,
    (ty - 6.8) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + 0.6) * ps,
    (ty - 8.4) * ps + off,
    (cx + 2.2) * ps,
    (ty - 7.8) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + 1.2) * ps,
    (ty - 7.4) * ps + off,
    (cx + 0.9) * ps,
    (ty - 6) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + hw * 0.6) * ps,
    (ty - 3) * ps + off,
    (cx + hw * 0.9) * ps,
    (ty + 0.4) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Glanzkante
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.55) * ps, (ty + 0.2) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw * 0.35) * ps,
    (ty - 4) * ps + off,
    (cx + 0.1) * ps,
    (ty - 6.9) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx - hw * 0.15) * ps,
    (ty - 3.5) * ps + off,
    (cx - hw * 0.25) * ps,
    (ty + 0.2) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Breite Krempe
  ctx.fillStyle = '#2E1065';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.4) * ps + off, ps * (hw + 1.4), ps * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.25) * ps + off, ps * (hw + 1.1), ps * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sterne
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx - 1.2) * ps, (ty - 2.4) * ps + off, ps * 0.55);
  sparkle(ctx, (cx + 1) * ps, (ty - 4.4) * ps + off, ps * 0.45);
  sparkle(ctx, (cx - 0.3) * ps, (ty - 5.8) * ps + off, ps * 0.35);
  // Mondsichel
  ctx.fillStyle = '#E8E0FF';
  ctx.beginPath();
  ctx.arc((cx + 1.2) * ps, (ty - 1.6) * ps + off, ps * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2E1065';
  ctx.beginPath();
  ctx.arc((cx + 1.45) * ps, (ty - 1.75) * ps + off, ps * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

export function drawVikingHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Geschwungene Hörner
  for (let side = -1; side <= 1; side += 2) {
    const bx = cx + side * hw * 0.95;
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.moveTo(bx * ps, (ty + 0.6) * ps + off);
    ctx.quadraticCurveTo(
      (bx + side * 2.2) * ps,
      (ty - 0.4) * ps + off,
      (bx + side * 1.8) * ps,
      (ty - 3.4) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 1.7) * ps,
      (ty - 4.6) * ps + off,
      (bx + side * 1) * ps,
      (ty - 5.2) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 1) * ps,
      (ty - 3.2) * ps + off,
      (bx + side * 0.2) * ps,
      (ty - 1.4) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    // Hornringe
    ctx.strokeStyle = 'rgba(139, 105, 20, 0.35)';
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.moveTo((bx + side * 0.5) * ps, (ty - 0.9) * ps + off);
    ctx.lineTo((bx + side * 1.9) * ps, (ty - 1.4) * ps + off);
    ctx.stroke();
    // Helle Spitze
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc((bx + side * 1.1) * ps, (ty - 4.9) * ps + off, ps * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Metallkuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.2) * ps + off, 0, (ty + 1) * ps + off);
  grad.addColorStop(0, '#B8BCC2');
  grad.addColorStop(1, '#75797F');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.8) * ps + off, ps * hw, ps * 3.6, 0, Math.PI, 0);
  ctx.fill();
  // Unterer Rand
  ctx.fillStyle = '#5E6268';
  ctx.fillRect((cx - hw) * ps, (ty + 0.4) * ps + off, ps * hw * 2, ps * 0.5);
  // Mittelgrat mit Glanz
  ctx.strokeStyle = '#D8DCE2';
  ctx.lineWidth = ps * 0.45;
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ty - 2.8) * ps + off);
  ctx.quadraticCurveTo((cx + 0.1) * ps, (ty - 1) * ps + off, cx * ps, (ty + 0.6) * ps + off);
  ctx.stroke();
  // Nieten
  ctx.fillStyle = '#4E5258';
  for (const dx of [-hw * 0.6, hw * 0.6]) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + 0.1) * ps + off, ps * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.45) * ps,
    (ty - 1.4) * ps + off,
    ps * 0.7,
    ps * 0.35,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);

  const w = hw * 0.95;
  // Goldband mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 1.2) * ps + off, 0, (ty + 0.6) * ps + off);
  grad.addColorStop(0, '#FFE066');
  grad.addColorStop(1, '#DAA520');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty - 1) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty - 1) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty + 0.4) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 0.9) * ps + off, (cx - w) * ps, (ty + 0.4) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Zacken mit Kugelspitzen
  const px = [-w * 0.8, -w * 0.4, 0, w * 0.4, w * 0.8];
  const ph = [2.4, 3.2, 3.9, 3.2, 2.4];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((cx + px[i] - 0.55) * ps, (ty - 0.9) * ps + off);
    ctx.lineTo((cx + px[i] + 0.55) * ps, (ty - 0.9) * ps + off);
    ctx.lineTo((cx + px[i]) * ps, (ty - 1 - ph[i]) * ps + off);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc((cx + px[i]) * ps, (ty - 1.1 - ph[i]) * ps + off, ps * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  // Juwelen im Band
  const jewels: [number, string][] = [
    [-w * 0.55, '#FF4D6D'],
    [0, '#4FC3F7'],
    [w * 0.55, '#FF4D6D'],
  ];
  for (const [dx, c] of jewels) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty - 0.25) * ps + off, ps * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc((cx + dx - 0.12) * ps, (ty - 0.38) * ps + off, ps * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
  // Funkeln
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx + w * 0.4) * ps, (ty - 4.6) * ps + off, ps * 0.35);
  sparkle(ctx, (cx - w * 0.9) * ps, (ty - 3.4) * ps + off, ps * 0.3);
}

export function drawHalo(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  const rx = hw * 0.75 + 0.5;
  // Weicher Glow
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
  ctx.lineWidth = ps * 1.4;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 2.8) * ps + off, ps * rx, ps * 0.95, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Goldring
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.6;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 2.8) * ps + off, ps * rx, ps * 0.95, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Heller Innenschimmer
  ctx.strokeStyle = 'rgba(255, 250, 205, 0.9)';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 2.95) * ps + off, ps * (rx - 0.15), ps * 0.75, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Funkelsterne
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  sparkle(ctx, (cx - rx) * ps, (ty - 3.3) * ps + off, ps * 0.45);
  sparkle(ctx, (cx + rx * 0.8) * ps, (ty - 2.1) * ps + off, ps * 0.35);
  sparkle(ctx, (cx + 0.6) * ps, (ty - 3.8) * ps + off, ps * 0.3);
}

export function drawDevilHorns(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;

  // Geschwungene Teufelshörner
  for (let side = -1; side <= 1; side += 2) {
    const bx = cx + side * hw * 0.7;
    const grad = ctx.createLinearGradient(0, (ty - 5.4) * ps + off, 0, (ty + 0.4) * ps + off);
    grad.addColorStop(0, '#FF5252');
    grad.addColorStop(1, '#B71C1C');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((bx - side * 0.9) * ps, (ty + 0.4) * ps + off);
    ctx.quadraticCurveTo(
      (bx + side * 1.4) * ps,
      (ty - 0.6) * ps + off,
      (bx + side * 1.3) * ps,
      (ty - 3) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 1.2) * ps,
      (ty - 4.6) * ps + off,
      (bx + side * 0.5) * ps,
      (ty - 5.4) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 0.5) * ps,
      (ty - 3.2) * ps + off,
      (bx - side * 0.4) * ps,
      (ty - 1.2) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    // Glanzstreifen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = ps * 0.22;
    ctx.beginPath();
    ctx.moveTo((bx + side * 0.3) * ps, (ty - 1) * ps + off);
    ctx.quadraticCurveTo(
      (bx + side * 0.9) * ps,
      (ty - 2.4) * ps + off,
      (bx + side * 0.55) * ps,
      (ty - 4.6) * ps + off
    );
    ctx.stroke();
    // Helle Spitze
    ctx.fillStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc((bx + side * 0.55) * ps, (ty - 5.15) * ps + off, ps * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBeret(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Flache Baskenmütze, leicht nach rechts gekippt
  const grad = ctx.createLinearGradient(0, (ty - 2.8) * ps + off, 0, (ty + 0.6) * ps + off);
  grad.addColorStop(0, '#4A4A4A');
  grad.addColorStop(1, '#232323');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(
    (cx + 0.3) * ps,
    (ty - 1.1) * ps + off,
    ps * (hw + 0.6),
    ps * 1.7,
    0.12,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Bündchen am Kopf
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.3) * ps + off, ps * hw * 0.9, ps * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stielchen
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc((cx + 0.7) * ps, (ty - 2.7) * ps + off, ps * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Weiches Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.4) * ps,
    (ty - 1.7) * ps + off,
    ps * 1.2,
    ps * 0.5,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawHeadband(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw * 1.0;
  // Geschwungenes Schweissband mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty + 0.2) * ps + off, 0, (ty + 1.6) * ps + off);
  grad.addColorStop(0, '#FF6B6B');
  grad.addColorStop(1, '#E03131');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - w - 0.3) * ps, (ty + 0.6) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 0.1) * ps + off, (cx + w + 0.3) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo((cx + w + 0.3) * ps, (ty + 1.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 2) * ps + off, (cx - w - 0.3) * ps, (ty + 1.5) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Frottee-Struktur
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = ps * 0.12;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo((cx + i * w * 0.38 - 0.2) * ps, (ty + 0.45) * ps + off);
    ctx.lineTo((cx + i * w * 0.38 + 0.2) * ps, (ty + 1.7) * ps + off);
    ctx.stroke();
  }
  // Weisser Streifen
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - 1.2) * ps, (ty + 1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 0.7) * ps + off, (cx + 1.2) * ps, (ty + 1) * ps + off);
  ctx.stroke();
}

export function drawCowboyHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Krone mit Delle und Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 4.4) * ps + off, 0, (ty + 0.6) * ps + off);
  grad.addColorStop(0, '#C89B4A');
  grad.addColorStop(1, '#8B6914');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.85) * ps, (ty + 0.4) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw * 0.8) * ps,
    (ty - 3.6) * ps + off,
    (cx - hw * 0.45) * ps,
    (ty - 4.1) * ps + off
  );
  ctx.quadraticCurveTo(
    cx * ps,
    (ty - 3.2) * ps + off,
    (cx + hw * 0.45) * ps,
    (ty - 4.1) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + hw * 0.8) * ps,
    (ty - 3.6) * ps + off,
    (cx + hw * 0.85) * ps,
    (ty + 0.4) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Breite Krempe mit hochgebogenen Seiten
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.moveTo((cx - hw - 2.6) * ps, (ty - 1.4) * ps + off);
  ctx.quadraticCurveTo((cx - hw - 1.6) * ps, (ty + 1.1) * ps + off, cx * ps, (ty + 1.1) * ps + off);
  ctx.quadraticCurveTo(
    (cx + hw + 1.6) * ps,
    (ty + 1.1) * ps + off,
    (cx + hw + 2.6) * ps,
    (ty - 1.4) * ps + off
  );
  ctx.quadraticCurveTo((cx + hw + 1) * ps, (ty + 0.1) * ps + off, cx * ps, (ty + 0.1) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw - 1) * ps,
    (ty + 0.1) * ps + off,
    (cx - hw - 2.6) * ps,
    (ty - 1.4) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Krempen-Glanz
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx - hw - 1.8) * ps, (ty - 0.6) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 0.7) * ps + off, (cx + hw + 1.8) * ps, (ty - 0.6) * ps + off);
  ctx.stroke();
  // Hutband mit Schnalle
  ctx.fillStyle = '#5C3D10';
  ctx.fillRect((cx - hw * 0.82) * ps, (ty - 0.9) * ps + off, ps * hw * 1.64, ps * 0.7);
  ctx.fillStyle = '#DAA520';
  ctx.fillRect((cx - 0.35) * ps, (ty - 1) * ps + off, ps * 0.7, ps * 0.9);
}

export function drawGraduationCap(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Kappe unter dem Brett
  const cap = ctx.createLinearGradient(0, (ty - 1.6) * ps + off, 0, (ty + 0.8) * ps + off);
  cap.addColorStop(0, '#333333');
  cap.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.6) * ps + off, ps * hw * 0.9, ps * 2.1, 0, Math.PI, 0);
  ctx.fill();
  // Mortarboard als Raute
  const board = ctx.createLinearGradient((cx - hw - 2) * ps, 0, (cx + hw + 2) * ps, 0);
  board.addColorStop(0, '#2e2e2e');
  board.addColorStop(0.5, '#3c3c3c');
  board.addColorStop(1, '#222222');
  ctx.fillStyle = board;
  ctx.beginPath();
  ctx.moveTo((cx - hw - 1.8) * ps, (ty - 1.5) * ps + off);
  ctx.lineTo(cx * ps, (ty - 2.4) * ps + off);
  ctx.lineTo((cx + hw + 1.8) * ps, (ty - 1.5) * ps + off);
  ctx.lineTo(cx * ps, (ty - 0.6) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Kante mit Glanz
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = ps * 0.15;
  ctx.beginPath();
  ctx.moveTo((cx - hw - 1.8) * ps, (ty - 1.5) * ps + off);
  ctx.lineTo(cx * ps, (ty - 2.4) * ps + off);
  ctx.lineTo((cx + hw + 1.8) * ps, (ty - 1.5) * ps + off);
  ctx.stroke();
  // Knopf + Quaste
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 1.6) * ps + off, ps * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ty - 1.6) * ps + off);
  ctx.quadraticCurveTo(
    (cx + hw + 1.2) * ps,
    (ty - 1.9) * ps + off,
    (cx + hw + 1.4) * ps,
    (ty + 0.6) * ps + off
  );
  ctx.stroke();
  // Quastenbommel
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo((cx + hw + 1) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo((cx + hw + 1.8) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo((cx + hw + 1.55) * ps, (ty + 2) * ps + off);
  ctx.lineTo((cx + hw + 1.25) * ps, (ty + 2) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFE066';
  ctx.beginPath();
  ctx.arc((cx + hw + 1.4) * ps, (ty + 0.7) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStrawHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Runde Strohkuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.4) * ps + off, 0, (ty + 0.6) * ps + off);
  grad.addColorStop(0, '#FFF0C9');
  grad.addColorStop(1, '#E8C88A');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.3) * ps + off, ps * hw * 0.9, ps * 3.4, 0, Math.PI, 0);
  ctx.fill();
  // Flechtstruktur
  ctx.strokeStyle = 'rgba(180, 140, 80, 0.4)';
  ctx.lineWidth = ps * 0.15;
  for (let i = 0; i < 3; i++) {
    const y = ty - 2.4 + i * 0.9;
    const wx = hw * 0.9 * Math.sqrt(1 - ((ty + 0.3 - y) / 3.4) ** 2);
    ctx.beginPath();
    ctx.moveTo((cx - wx) * ps, y * ps + off);
    ctx.quadraticCurveTo(cx * ps, (y + 0.3) * ps + off, (cx + wx) * ps, y * ps + off);
    ctx.stroke();
  }
  // Breite weiche Krempe
  ctx.fillStyle = '#E8C88A';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.5) * ps + off, ps * (hw + 2), ps * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.35) * ps + off, ps * (hw + 1.6), ps * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rotes Band mit Schleife
  ctx.fillStyle = '#E05555';
  ctx.fillRect((cx - hw * 0.88) * ps, (ty - 0.9) * ps + off, ps * hw * 1.76, ps * 0.7);
  ctx.beginPath();
  ctx.arc((cx + hw * 0.7) * ps, (ty - 0.55) * ps + off, ps * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

export function drawMilitaryHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw * 1.02;
  // Kuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.2) * ps + off, 0, (ty + 1.2) * ps + off);
  grad.addColorStop(0, '#7A934A');
  grad.addColorStop(1, '#4B5320');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 1) * ps + off, ps * w, ps * 3.8, 0, Math.PI, 0);
  ctx.fill();
  // Camo-Flecken
  ctx.fillStyle = 'rgba(107, 142, 35, 0.7)';
  ctx.beginPath();
  ctx.ellipse((cx - 1.4) * ps, (ty - 1.2) * ps + off, ps * 0.8, ps * 0.5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1.2) * ps, (ty - 1.9) * ps + off, ps * 0.6, ps * 0.4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(59, 79, 26, 0.7)';
  ctx.beginPath();
  ctx.ellipse((cx + 0.2) * ps, (ty - 0.3) * ps + off, ps * 0.9, ps * 0.45, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Umlaufender Rand
  ctx.fillStyle = '#3B4218';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.9) * ps + off, ps * (w + 0.25), ps * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Kinnriemen-Nieten
  ctx.fillStyle = '#8A9A5B';
  for (const dx of [-w * 0.75, w * 0.75]) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + 0.75) * ps + off, ps * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.ellipse((cx - w * 0.4) * ps, (ty - 1.6) * ps + off, ps * 0.8, ps * 0.4, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAstronautHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw + 0.8;
  // Weisse Kugelschale mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.6) * ps + off, 0, (ty + 2.6) * ps + off);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(1, '#C9CDD4');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 0.4) * ps + off, ps * w, ps * 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Blaues Visier, abgerundet
  const visor = ctx.createLinearGradient(0, (ty - 1.2) * ps + off, 0, (ty + 1.6) * ps + off);
  visor.addColorStop(0, '#3A6EA5');
  visor.addColorStop(1, '#16283E');
  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.2) * ps + off, ps * (w - 0.8), ps * 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Visier-Spiegelung
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - w * 0.4) * ps,
    (ty - 0.3) * ps + off,
    ps * 0.7,
    ps * 0.35,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Goldschimmer unten im Visier
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
  ctx.lineWidth = ps * 0.25;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.2) * ps + off, ps * (w - 1), ps * 1.35, 0, 0.3, Math.PI - 0.3);
  ctx.stroke();
  // Schalen-Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.ellipse((cx - w * 0.5) * ps, (ty - 2.3) * ps + off, ps * 0.8, ps * 0.4, -0.6, 0, Math.PI * 2);
  ctx.fill();
  // Kleine Antenne
  ctx.fillStyle = '#B0B4BA';
  ctx.fillRect((cx + w - 0.4) * ps, (ty - 2.6) * ps + off, ps * 0.25, ps * 1.2);
  ctx.fillStyle = '#FF5252';
  ctx.beginPath();
  ctx.arc((cx + w - 0.28) * ps, (ty - 2.8) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawUnicornHorn(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const tipY = ty - 7.6;
  // Pastellkegel mit Verlauf
  const grad = ctx.createLinearGradient(0, tipY * ps + off, 0, (ty - 0.4) * ps + off);
  grad.addColorStop(0, '#FFF6FA');
  grad.addColorStop(0.5, '#E6D9FA');
  grad.addColorStop(1, '#FFB6C1');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - 1) * ps, (ty - 0.4) * ps + off);
  ctx.lineTo((cx + 1) * ps, (ty - 0.4) * ps + off);
  ctx.lineTo(cx * ps, tipY * ps + off);
  ctx.closePath();
  ctx.fill();
  // Spiralrillen
  ctx.strokeStyle = 'rgba(216, 160, 220, 0.7)';
  ctx.lineWidth = ps * 0.22;
  for (let i = 0; i < 4; i++) {
    const f = 0.12 + i * 0.22;
    const wHere = 1 * (1 - f);
    const y = ty - 0.4 - f * 7.2;
    ctx.beginPath();
    ctx.moveTo((cx - wHere) * ps, (y + 0.3) * ps + off);
    ctx.quadraticCurveTo(cx * ps, (y - 0.35) * ps + off, (cx + wHere) * ps, (y + 0.15) * ps + off);
    ctx.stroke();
  }
  // Glanzkante
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo((cx - 0.55) * ps, (ty - 0.5) * ps + off);
  ctx.lineTo((cx - 0.2) * ps, (ty - 0.5) * ps + off);
  ctx.lineTo(cx * ps, tipY * ps + off);
  ctx.closePath();
  ctx.fill();
  // Funkeln rundherum
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx - 1.5) * ps, (ty - 4.8) * ps + off, ps * 0.4);
  sparkle(ctx, (cx + 1.4) * ps, (ty - 3.4) * ps + off, ps * 0.35);
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx + 1.2) * ps, (ty - 6) * ps + off, ps * 0.3);
  sparkle(ctx, cx * ps, (tipY - 0.6) * ps + off, ps * 0.4);
}

export function drawRobotHead(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw * 0.95;
  // Abgerundete Metallhaube mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 2.6) * ps + off, 0, (ty + 0.8) * ps + off);
  grad.addColorStop(0, '#B0B4BA');
  grad.addColorStop(1, '#75797F');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.5) * ps + off, ps * w, ps * 3, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#5E6268';
  ctx.fillRect((cx - w) * ps, (ty + 0.2) * ps + off, ps * w * 2, ps * 0.5);
  // Naht in der Mitte
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = ps * 0.15;
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ty - 2.4) * ps + off);
  ctx.lineTo(cx * ps, (ty + 0.2) * ps + off);
  ctx.stroke();
  // Antenne mit Glühbirnchen
  ctx.fillStyle = '#555555';
  ctx.fillRect((cx - 0.18) * ps, (ty - 4.6) * ps + off, ps * 0.36, ps * 2.3);
  ctx.fillStyle = 'rgba(255, 82, 82, 0.3)';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 5) * ps + off, ps * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF5252';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 5) * ps + off, ps * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc((cx - 0.15) * ps, (ty - 5.15) * ps + off, ps * 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Schrauben
  ctx.fillStyle = '#D8DCE2';
  for (const dx of [-w * 0.7, w * 0.7]) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty - 0.4) * ps + off, ps * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  // Leuchtende Visierlinie
  ctx.strokeStyle = 'rgba(0, 255, 128, 0.35)';
  ctx.lineWidth = ps * 0.55;
  ctx.beginPath();
  ctx.moveTo((cx - w * 0.65) * ps, (ty + 0.45) * ps + off);
  ctx.lineTo((cx + w * 0.65) * ps, (ty + 0.45) * ps + off);
  ctx.stroke();
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx - w * 0.65) * ps, (ty + 0.45) * ps + off);
  ctx.lineTo((cx + w * 0.65) * ps, (ty + 0.45) * ps + off);
  ctx.stroke();
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - w * 0.45) * ps,
    (ty - 1.5) * ps + off,
    ps * 0.7,
    ps * 0.35,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawAlienAntenna(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Zwei geschwungene Fühler mit Leuchtkugeln
  const stalks: [number, number, number][] = [
    [-hw * 0.55, -5.2, -0.8],
    [hw * 0.55, -6, 0.8],
  ];
  ctx.strokeStyle = '#43A047';
  ctx.lineWidth = ps * 0.4;
  for (const [dx, topDy, bend] of stalks) {
    ctx.beginPath();
    ctx.moveTo((cx + dx) * ps, (ty + 0.2) * ps + off);
    ctx.quadraticCurveTo(
      (cx + dx + bend) * ps,
      (ty + topDy / 2) * ps + off,
      (cx + dx + bend * 0.4) * ps,
      (ty + topDy) * ps + off
    );
    ctx.stroke();
  }
  for (const [dx, topDy, bend] of stalks) {
    const ox = cx + dx + bend * 0.4;
    const oy = ty + topDy - 0.3;
    // Glow
    ctx.fillStyle = 'rgba(105, 240, 174, 0.3)';
    ctx.beginPath();
    ctx.arc(ox * ps, oy * ps + off, ps * 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Kugel mit Verlauf
    const grad = ctx.createRadialGradient(
      (ox - 0.25) * ps,
      (oy - 0.25) * ps + off,
      ps * 0.1,
      ox * ps,
      oy * ps + off,
      ps * 0.75
    );
    grad.addColorStop(0, '#B9F6CA');
    grad.addColorStop(1, '#00C853');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox * ps, oy * ps + off, ps * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc((ox - 0.25) * ps, (oy - 0.25) * ps + off, ps * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Weiches Haarband
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.95) * ps, (ty + 0.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, ty * ps + off, (cx + hw * 0.95) * ps, (ty + 0.5) * ps + off);
  ctx.lineTo((cx + hw * 0.95) * ps, (ty + 1.1) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ty + 0.6) * ps + off,
    (cx - hw * 0.95) * ps,
    (ty + 1.1) * ps + off
  );
  ctx.closePath();
  ctx.fill();
}

export function drawDiamondTiara(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw * 0.9;
  // Silberband mit Schimmer
  const band = ctx.createLinearGradient(0, (ty - 0.7) * ps + off, 0, (ty + 0.5) * ps + off);
  band.addColorStop(0, '#F2F4F8');
  band.addColorStop(1, '#AEB4BE');
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty - 0.4) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty - 0.9) * ps + off, (cx + w) * ps, (ty - 0.4) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty + 0.3) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty - 0.2) * ps + off, (cx - w) * ps, (ty + 0.3) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Geschwungene Spitzen mit Diamanten
  const peaks = [-w * 0.75, -w * 0.38, 0, w * 0.38, w * 0.75];
  const heights = [1.8, 2.7, 3.8, 2.7, 1.8];
  for (let i = 0; i < 5; i++) {
    const px = cx + peaks[i];
    const top = ty - 0.6 - heights[i];
    ctx.fillStyle = '#E4E8EE';
    ctx.beginPath();
    ctx.moveTo((px - 0.45) * ps, (ty - 0.4) * ps + off);
    ctx.quadraticCurveTo((px - 0.12) * ps, (top + 1) * ps + off, px * ps, top * ps + off);
    ctx.quadraticCurveTo(
      (px + 0.12) * ps,
      (top + 1) * ps + off,
      (px + 0.45) * ps,
      (ty - 0.4) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    // Diamant an der Spitze
    ctx.fillStyle = i === 2 ? '#6FE8F5' : '#B9F2FF';
    const r = i === 2 ? 0.5 : 0.32;
    ctx.beginPath();
    ctx.moveTo(px * ps, (top - r) * ps + off);
    ctx.lineTo((px + r) * ps, top * ps + off);
    ctx.lineTo(px * ps, (top + r) * ps + off);
    ctx.lineTo((px - r) * ps, top * ps + off);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc((px - r * 0.25) * ps, (top - r * 0.25) * ps + off, ps * r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  // Funkeln
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx + w * 0.55) * ps, (ty - 4.2) * ps + off, ps * 0.35);
  sparkle(ctx, (cx - w * 0.95) * ps, (ty - 2.6) * ps + off, ps * 0.3);
}

export function drawChefHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw * 0.9;
  // Bauschige Wolkenkrone aus Kreisen
  const grad = ctx.createLinearGradient(0, (ty - 6) * ps + off, 0, (ty - 1) * ps + off);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(1, '#E4E4E8');
  ctx.fillStyle = grad;
  const puffs: [number, number, number][] = [
    [-w * 0.75, -3.2, 1.5],
    [-w * 0.3, -4.5, 1.7],
    [w * 0.3, -4.5, 1.7],
    [w * 0.75, -3.2, 1.5],
    [0, -3.6, 1.9],
  ];
  for (const [dx, dy, r] of puffs) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + dy) * ps + off, ps * r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Mittelstück füllt Lücken
  ctx.fillRect((cx - w) * ps, (ty - 3.2) * ps + off, ps * w * 2, ps * 2.4);
  // Weiche Falten
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.07)';
  ctx.lineWidth = ps * 0.22;
  for (const dx of [-w * 0.4, 0.1, w * 0.45]) {
    ctx.beginPath();
    ctx.moveTo((cx + dx) * ps, (ty - 3.8) * ps + off);
    ctx.quadraticCurveTo(
      (cx + dx + 0.2) * ps,
      (ty - 2.6) * ps + off,
      (cx + dx) * ps,
      (ty - 1.2) * ps + off
    );
    ctx.stroke();
  }
  // Glanzlichter auf den Bäuschen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc((cx - w * 0.45) * ps, (ty - 4.9) * ps + off, ps * 0.35, 0, Math.PI * 2);
  ctx.fill();
  // Hutband
  ctx.fillStyle = '#F0F0F2';
  ctx.fillRect((cx - w) * ps, (ty - 0.9) * ps + off, ps * w * 2, ps * 1.3);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = ps * 0.15;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty - 0.9) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty - 0.9) * ps + off);
  ctx.stroke();
}

export function drawCatEars(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Weiche Katzenohren mit rosa Innenleben
  for (let side = -1; side <= 1; side += 2) {
    const bx = cx + side * hw * 0.62;
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo((bx - side * 1.5) * ps, (ty + 0.4) * ps + off);
    ctx.quadraticCurveTo(
      (bx - side * 1.3) * ps,
      (ty - 2.6) * ps + off,
      (bx + side * 0.35) * ps,
      (ty - 4.6) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 1.5) * ps,
      (ty - 2.2) * ps + off,
      (bx + side * 1.3) * ps,
      (ty + 0.4) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FF80AB';
    ctx.beginPath();
    ctx.moveTo((bx - side * 0.7) * ps, (ty + 0.2) * ps + off);
    ctx.quadraticCurveTo(
      (bx - side * 0.55) * ps,
      (ty - 1.9) * ps + off,
      (bx + side * 0.3) * ps,
      (ty - 3.5) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 0.9) * ps,
      (ty - 1.7) * ps + off,
      (bx + side * 0.8) * ps,
      (ty + 0.2) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    // Glanzpunkt
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc((bx + side * 0.1) * ps, (ty - 3.4) * ps + off, ps * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  // Haarreif
  ctx.strokeStyle = '#F48FB1';
  ctx.lineWidth = ps * 0.5;
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.95) * ps, (ty + 0.7) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ty + 0.05) * ps + off,
    (cx + hw * 0.95) * ps,
    (ty + 0.7) * ps + off
  );
  ctx.stroke();
}

export function drawSamuraiHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Shikoro (seitliche Nackenschirme)
  ctx.fillStyle = '#5C0F0F';
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo((cx + side * hw * 0.5) * ps, (ty + 0.3) * ps + off);
    ctx.quadraticCurveTo(
      (cx + side * (hw + 1.6)) * ps,
      (ty + 0.6) * ps + off,
      (cx + side * (hw + 1.3)) * ps,
      (ty + 2.4) * ps + off
    );
    ctx.quadraticCurveTo(
      (cx + side * hw * 0.7) * ps,
      (ty + 1.9) * ps + off,
      (cx + side * hw * 0.4) * ps,
      (ty + 1) * ps + off
    );
    ctx.closePath();
    ctx.fill();
  }
  // Kabuto-Kuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.2) * ps + off, 0, (ty + 1) * ps + off);
  grad.addColorStop(0, '#C62828');
  grad.addColorStop(1, '#7B1010');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.8) * ps + off, ps * hw, ps * 3.8, 0, Math.PI, 0);
  ctx.fill();
  // Lamellen-Linien
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = ps * 0.15;
  for (const dx of [-hw * 0.45, hw * 0.45]) {
    ctx.beginPath();
    ctx.moveTo((cx + dx * 0.4) * ps, (ty - 2.8) * ps + off);
    ctx.quadraticCurveTo(
      (cx + dx) * ps,
      (ty - 1.4) * ps + off,
      (cx + dx * 1.6) * ps,
      (ty + 0.5) * ps + off
    );
    ctx.stroke();
  }
  // Goldene Bordüre
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.35;
  ctx.beginPath();
  ctx.moveTo((cx - hw) * ps, (ty + 0.55) * ps + off);
  ctx.lineTo((cx + hw) * ps, (ty + 0.55) * ps + off);
  ctx.stroke();
  // Maedate: goldene Mondsichel
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = ps * 0.5;
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 3.4) * ps + off, ps * 1.5, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.22) * ps, (ty - 3.6) * ps + off, ps * 0.44, ps * 1.4);
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.4) * ps,
    (ty - 1.6) * ps + off,
    ps * 0.7,
    ps * 0.35,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawWitchHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Kegel mit umgeknickter Spitze
  const grad = ctx.createLinearGradient(0, (ty - 8) * ps + off, 0, (ty + 0.5) * ps + off);
  grad.addColorStop(0, '#4A1478');
  grad.addColorStop(1, '#22063A');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.9) * ps, (ty + 0.4) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw * 0.45) * ps,
    (ty - 4.2) * ps + off,
    (cx + 0.1) * ps,
    (ty - 7) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + 0.9) * ps,
    (ty - 8.6) * ps + off,
    (cx + 2.6) * ps,
    (ty - 7.6) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + 1.5) * ps,
    (ty - 7.4) * ps + off,
    (cx + 1.2) * ps,
    (ty - 5.9) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + hw * 0.65) * ps,
    (ty - 3) * ps + off,
    (cx + hw * 0.9) * ps,
    (ty + 0.4) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Mondschein-Kante
  ctx.fillStyle = 'rgba(206, 147, 216, 0.25)';
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.55) * ps, (ty + 0.2) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw * 0.3) * ps,
    (ty - 4) * ps + off,
    (cx + 0.3) * ps,
    (ty - 7) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx - hw * 0.1) * ps,
    (ty - 3.6) * ps + off,
    (cx - hw * 0.2) * ps,
    (ty + 0.2) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Breite wellige Krempe
  ctx.fillStyle = '#2A0845';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.4) * ps + off, ps * (hw + 1.5), ps * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(171, 71, 188, 0.2)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.25) * ps + off, ps * (hw + 1.2), ps * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lila Band mit Goldschnalle
  ctx.fillStyle = '#7B1FA2';
  ctx.fillRect((cx - hw * 0.72) * ps, (ty - 1.15) * ps + off, ps * hw * 1.44, ps * 0.85);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect((cx - 0.45) * ps, (ty - 1.3) * ps + off, ps * 0.9, ps * 1.1);
  ctx.fillStyle = '#22063A';
  ctx.fillRect((cx - 0.2) * ps, (ty - 1.05) * ps + off, ps * 0.4, ps * 0.6);
  // Sternfunkeln
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx + 1.3) * ps, (ty - 4.8) * ps + off, ps * 0.35);
  ctx.fillStyle = '#CE93D8';
  sparkle(ctx, (cx - 1.1) * ps, (ty - 3.2) * ps + off, ps * 0.3);
}

export function drawMushHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw * 0.9 + 1;
  // Heller Stiel
  ctx.fillStyle = '#F5E6C8';
  ctx.beginPath();
  ctx.ellipse(cx * ps, ty * ps + off, ps * 0.8, ps * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pilzkappe mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 4.4) * ps + off, 0, (ty - 0.4) * ps + off);
  grad.addColorStop(0, '#FF7043');
  grad.addColorStop(1, '#D32F2F');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 0.6) * ps + off, ps * w, ps * 3.6, 0, Math.PI, 0);
  ctx.fill();
  // Unterseite der Kappe
  ctx.fillStyle = '#B71C1C';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 0.6) * ps + off, ps * w, ps * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Weisse Tupfen
  ctx.fillStyle = '#FFF8F0';
  const dots: [number, number, number][] = [
    [-w * 0.5, -2.3, 0.55],
    [w * 0.35, -2.9, 0.45],
    [-0.1, -1.5, 0.4],
    [w * 0.7, -1.5, 0.35],
  ];
  for (const [dx, dy, r] of dots) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + dy) * ps + off, ps * r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse((cx - w * 0.45) * ps, (ty - 3) * ps + off, ps * 0.8, ps * 0.4, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFoxEars(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Spitze Fuchsohren mit weissem Inneren
  for (let side = -1; side <= 1; side += 2) {
    const bx = cx + side * hw * 0.6;
    const grad = ctx.createLinearGradient(0, (ty - 5.2) * ps + off, 0, (ty + 0.4) * ps + off);
    grad.addColorStop(0, '#FF8A3C');
    grad.addColorStop(1, '#E85D04');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((bx - side * 1.6) * ps, (ty + 0.4) * ps + off);
    ctx.quadraticCurveTo(
      (bx - side * 1.2) * ps,
      (ty - 2.8) * ps + off,
      (bx + side * 0.5) * ps,
      (ty - 5.2) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 1.6) * ps,
      (ty - 2.2) * ps + off,
      (bx + side * 1.4) * ps,
      (ty + 0.4) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    // Weisses Innenohr
    ctx.fillStyle = '#FFF4E6';
    ctx.beginPath();
    ctx.moveTo((bx - side * 0.7) * ps, (ty + 0.2) * ps + off);
    ctx.quadraticCurveTo(
      (bx - side * 0.5) * ps,
      (ty - 2) * ps + off,
      (bx + side * 0.4) * ps,
      (ty - 3.9) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 1) * ps,
      (ty - 1.7) * ps + off,
      (bx + side * 0.9) * ps,
      (ty + 0.2) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    // Dunkle Spitze
    ctx.fillStyle = '#5D2E0C';
    ctx.beginPath();
    ctx.moveTo((bx + side * 0.05) * ps, (ty - 4.3) * ps + off);
    ctx.quadraticCurveTo(
      (bx + side * 0.25) * ps,
      (ty - 4.6) * ps + off,
      (bx + side * 0.5) * ps,
      (ty - 5.2) * ps + off
    );
    ctx.quadraticCurveTo(
      (bx + side * 0.95) * ps,
      (ty - 4.35) * ps + off,
      (bx + side * 1.05) * ps,
      (ty - 3.9) * ps + off
    );
    ctx.closePath();
    ctx.fill();
  }
  // Haarreif
  ctx.strokeStyle = '#D9480F';
  ctx.lineWidth = ps * 0.45;
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.95) * ps, (ty + 0.7) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ty + 0.1) * ps + off,
    (cx + hw * 0.95) * ps,
    (ty + 0.7) * ps + off
  );
  ctx.stroke();
}

export function drawIceHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Frostige Kuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.4) * ps + off, 0, (ty + 1) * ps + off);
  grad.addColorStop(0, '#E1F5FE');
  grad.addColorStop(1, '#81D4FA');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.8) * ps + off, ps * hw, ps * 3.8, 0, Math.PI, 0);
  ctx.fill();
  // Eiszapfen-Aufsätze
  ctx.fillStyle = '#B3E5FC';
  const spikes: [number, number][] = [
    [-hw * 0.55, 2],
    [0, 3.2],
    [hw * 0.55, 2.4],
  ];
  for (const [dx, h] of spikes) {
    ctx.beginPath();
    ctx.moveTo((cx + dx - 0.55) * ps, (ty - 1.6) * ps + off);
    ctx.lineTo((cx + dx + 0.55) * ps, (ty - 1.6) * ps + off);
    ctx.lineTo((cx + dx) * ps, (ty - 1.6 - h) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Zapfen-Glanzkanten
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (const [dx, h] of spikes) {
    ctx.beginPath();
    ctx.moveTo((cx + dx - 0.3) * ps, (ty - 1.6) * ps + off);
    ctx.lineTo((cx + dx - 0.05) * ps, (ty - 1.6) * ps + off);
    ctx.lineTo((cx + dx) * ps, (ty - 1.6 - h) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Unterer Kristallrand
  ctx.fillStyle = '#4FC3F7';
  ctx.fillRect((cx - hw) * ps, (ty + 0.5) * ps + off, ps * hw * 2, ps * 0.5);
  // Glanzlicht + Funkeln
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.45) * ps,
    (ty - 1) * ps + off,
    ps * 0.75,
    ps * 0.35,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx + hw * 0.4) * ps, (ty - 0.4) * ps + off, ps * 0.35);
  sparkle(ctx, cx * ps, (ty - 5.2) * ps + off, ps * 0.4);
}

export function drawStarHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Nachtblaue Kuppel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 3.6) * ps + off, 0, (ty + 1.2) * ps + off);
  grad.addColorStop(0, '#1E3A7A');
  grad.addColorStop(1, '#081530');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 1) * ps + off, ps * hw, ps * 4.2, 0, Math.PI, 0);
  ctx.fill();
  // Goldene Sterne
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx - 1.4) * ps, (ty - 1.2) * ps + off, ps * 0.4);
  sparkle(ctx, (cx + 1.3) * ps, (ty - 2.2) * ps + off, ps * 0.35);
  sparkle(ctx, (cx - 0.3) * ps, (ty - 2.9) * ps + off, ps * 0.28);
  // Sternschnuppe mit Schweif
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx + hw * 0.7) * ps, (ty - 0.2) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 0.8) * ps,
    (ty - 1.6) * ps + off,
    (cx - 0.4) * ps,
    (ty - 1.7) * ps + off
  );
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx - 0.55) * ps, (ty - 1.7) * ps + off, ps * 0.42);
  // Kleine Lichtpunkte
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (const [dx, dy] of [
    [-hw * 0.65, -0.3],
    [hw * 0.5, -1],
    [0.4, -0.4],
  ]) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + dy) * ps + off, ps * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Visierband
  const visor = ctx.createLinearGradient(0, (ty + 0.3) * ps + off, 0, (ty + 1.2) * ps + off);
  visor.addColorStop(0, '#3A5F9F');
  visor.addColorStop(1, '#1E3A5F');
  ctx.fillStyle = visor;
  ctx.fillRect((cx - hw * 0.95) * ps, (ty + 0.35) * ps + off, ps * hw * 1.9, ps * 0.85);
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.45) * ps,
    (ty - 1.9) * ps + off,
    ps * 0.7,
    ps * 0.32,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawPhoenixFeatherHead(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Feuriger Glow hinter der Feder
  ctx.fillStyle = 'rgba(255, 69, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse((cx + 0.3) * ps, (ty - 4) * ps + off, ps * 2.2, ps * 3.6, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Geschwungene Feder mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 7.4) * ps + off, 0, (ty + 0.2) * ps + off);
  grad.addColorStop(0, '#FF5722');
  grad.addColorStop(0.55, '#FF8C00');
  grad.addColorStop(1, '#FFD700');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ty + 0.2) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 1.7) * ps,
    (ty - 3.4) * ps + off,
    (cx + 0.6) * ps,
    (ty - 7.2) * ps + off
  );
  ctx.quadraticCurveTo((cx + 2) * ps, (ty - 4) * ps + off, (cx + 0.7) * ps, (ty - 0.4) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Federkiel
  ctx.strokeStyle = 'rgba(183, 28, 28, 0.8)';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.moveTo((cx + 0.3) * ps, ty * ps + off);
  ctx.quadraticCurveTo(
    (cx - 0.1) * ps,
    (ty - 3.6) * ps + off,
    (cx + 0.6) * ps,
    (ty - 7) * ps + off
  );
  ctx.stroke();
  // Zarte Fiederäste
  ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
  ctx.lineWidth = ps * 0.16;
  for (let i = 0; i < 3; i++) {
    const y = ty - 2.2 - i * 1.5;
    ctx.beginPath();
    ctx.moveTo((cx + 0.15 - i * 0.05) * ps, y * ps + off);
    ctx.lineTo((cx + 1.3) * ps, (y - 0.7) * ps + off);
    ctx.moveTo((cx + 0.15 - i * 0.05) * ps, y * ps + off);
    ctx.lineTo((cx - 1) * ps, (y - 0.4) * ps + off);
    ctx.stroke();
  }
  // Glut-Funken
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx + 1.6) * ps, (ty - 6) * ps + off, ps * 0.35);
  sparkle(ctx, (cx - 1.4) * ps, (ty - 4.6) * ps + off, ps * 0.3);
  // Haltendes Stirnband
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.moveTo((cx - hw) * ps, (ty + 0.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, ty * ps + off, (cx + hw) * ps, (ty + 0.5) * ps + off);
  ctx.lineTo((cx + hw) * ps, (ty + 1.1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 0.6) * ps + off, (cx - hw) * ps, (ty + 1.1) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Goldene Brosche
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc((cx + 0.3) * ps, (ty + 0.5) * ps + off, ps * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAncientCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);
  const w = hw * 0.95;
  // Verwittertes Bronzeband mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 1.2) * ps + off, 0, (ty + 0.6) * ps + off);
  grad.addColorStop(0, '#A98B66');
  grad.addColorStop(1, '#6E5A40');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty - 1) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty - 1) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty + 0.3) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 0.8) * ps + off, (cx - w) * ps, (ty + 0.3) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Patina-Flecken
  ctx.fillStyle = 'rgba(46, 139, 87, 0.65)';
  ctx.beginPath();
  ctx.ellipse((cx - w * 0.7) * ps, (ty - 0.4) * ps + off, ps * 0.45, ps * 0.3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    (cx + w * 0.6) * ps,
    (ty - 0.6) * ps + off,
    ps * 0.35,
    ps * 0.25,
    -0.4,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Drei alte Zacken mit runden Kuppen
  const prongs: [number, number][] = [
    [-w * 0.65, 2.4],
    [0, 3.4],
    [w * 0.65, 2.4],
  ];
  for (const [dx, h] of prongs) {
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((cx + dx - 0.5) * ps, (ty - 0.9) * ps + off);
    ctx.lineTo((cx + dx + 0.5) * ps, (ty - 0.9) * ps + off);
    ctx.quadraticCurveTo(
      (cx + dx + 0.4) * ps,
      (ty - 0.9 - h) * ps + off,
      (cx + dx) * ps,
      (ty - 1 - h) * ps + off
    );
    ctx.quadraticCurveTo(
      (cx + dx - 0.4) * ps,
      (ty - 0.9 - h) * ps + off,
      (cx + dx - 0.5) * ps,
      (ty - 0.9) * ps + off
    );
    ctx.closePath();
    ctx.fill();
  }
  // Alte Gemmen mit mattem Glanz
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 3.8) * ps + off, ps * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8B1E1E';
  ctx.beginPath();
  ctx.arc((cx - w * 0.65) * ps, (ty - 2.7) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc((cx - 0.1) * ps, (ty - 3.9) * ps + off, ps * 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Feiner Riss im Band
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = ps * 0.1;
  ctx.beginPath();
  ctx.moveTo((cx + w * 0.25) * ps, (ty - 1) * ps + off);
  ctx.lineTo((cx + w * 0.15) * ps, (ty - 0.3) * ps + off);
  ctx.lineTo((cx + w * 0.3) * ps, (ty + 0.3) * ps + off);
  ctx.stroke();
}

export function drawCosmicHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Dunkle Kuppel mit Nachtverlauf
  const grad = ctx.createLinearGradient(0, (ty - 4) * ps + off, 0, (ty + 1.4) * ps + off);
  grad.addColorStop(0, '#1B1B4D');
  grad.addColorStop(1, '#07071F');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 1.2) * ps + off, ps * (hw + 0.3), ps * 4.6, 0, Math.PI, 0);
  ctx.fill();
  // Nebelschwaden
  ctx.fillStyle = 'rgba(156, 39, 176, 0.25)';
  ctx.beginPath();
  ctx.ellipse((cx - 0.8) * ps, (ty - 1.4) * ps + off, ps * 1.5, ps * 0.8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
  ctx.beginPath();
  ctx.ellipse((cx + 0.9) * ps, (ty - 2.3) * ps + off, ps * 1.4, ps * 0.7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Sternenstaub
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx - 1.1) * ps, (ty - 2.4) * ps + off, ps * 0.3);
  sparkle(ctx, (cx + 0.7) * ps, (ty - 1.2) * ps + off, ps * 0.25);
  for (const [dx, dy] of [
    [-0.2, -3.1],
    [hw * 0.55, -0.5],
    [-hw * 0.6, -0.9],
  ]) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + dy) * ps + off, ps * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Visier mit Sternchen
  const visor = ctx.createLinearGradient(0, (ty + 0.4) * ps + off, 0, (ty + 1.5) * ps + off);
  visor.addColorStop(0, '#2A2A5E');
  visor.addColorStop(1, '#14142E');
  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 0.95) * ps + off, ps * hw * 0.9, ps * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx - hw * 0.5) * ps, (ty + 0.9) * ps + off, ps * 0.22);
  sparkle(ctx, (cx + hw * 0.45) * ps, (ty + 0.8) * ps + off, ps * 0.2);
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.45) * ps,
    (ty - 2.2) * ps + off,
    ps * 0.7,
    ps * 0.32,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawShadowHood(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Weiche Kapuze mit Zipfel
  const grad = ctx.createLinearGradient(0, (ty - 4.6) * ps + off, 0, (ty + 3) * ps + off);
  grad.addColorStop(0, '#2E2E38');
  grad.addColorStop(1, '#101014');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - hw - 1) * ps, (ty + 3) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw - 1.1) * ps,
    (ty - 2.6) * ps + off,
    (cx - 1) * ps,
    (ty - 3.9) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx - 0.2) * ps,
    (ty - 5) * ps + off,
    (cx + 0.6) * ps,
    (ty - 4.1) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + hw + 1.1) * ps,
    (ty - 2.8) * ps + off,
    (cx + hw + 1) * ps,
    (ty + 3) * ps + off
  );
  ctx.quadraticCurveTo(cx * ps, (ty + 3.8) * ps + off, (cx - hw - 1) * ps, (ty + 3) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Dunkle Höhle innen
  ctx.fillStyle = '#050508';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 1.4) * ps + off, ps * (hw * 0.8), ps * 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Leuchtende Augen mit Glow
  ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
  for (const dx of [-1.1, 1.1]) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + 1.2) * ps + off, ps * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#CE4FE8';
  for (const dx of [-1.1, 1.1]) {
    ctx.beginPath();
    ctx.ellipse((cx + dx) * ps, (ty + 1.2) * ps + off, ps * 0.35, ps * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Saumkante mit leichtem Schimmer
  ctx.strokeStyle = 'rgba(120, 120, 140, 0.35)';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty + 1.4) * ps + off, ps * (hw * 0.82), ps * 1.65, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawCelestialCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);
  const w = hw * 0.9;
  // Sanfte Aura
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 2.6) * ps + off, ps * (w + 1), ps * 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ätherisches Band
  const band = ctx.createLinearGradient(0, (ty - 1.1) * ps + off, 0, (ty + 0.5) * ps + off);
  band.addColorStop(0, '#FFFFFF');
  band.addColorStop(1, '#C9D4FF');
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty - 0.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty - 1) * ps + off, (cx + w) * ps, (ty - 0.5) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty + 0.3) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty - 0.2) * ps + off, (cx - w) * ps, (ty + 0.3) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Kristallzacken mit Verlauf
  const spikes = [-w * 0.75, -w * 0.38, 0, w * 0.38, w * 0.75];
  const spikeH = [2.6, 3.6, 5, 3.6, 2.6];
  for (let i = 0; i < 5; i++) {
    const px = cx + spikes[i];
    const top = ty - 0.8 - spikeH[i];
    const grad = ctx.createLinearGradient(0, top * ps + off, 0, (ty - 0.5) * ps + off);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#A8CBFF');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((px - 0.5) * ps, (ty - 0.5) * ps + off);
    ctx.lineTo((px + 0.5) * ps, (ty - 0.5) * ps + off);
    ctx.lineTo(px * ps, top * ps + off);
    ctx.closePath();
    ctx.fill();
    // Facettenglanz
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo((px - 0.28) * ps, (ty - 0.5) * ps + off);
    ctx.lineTo((px - 0.02) * ps, (ty - 0.5) * ps + off);
    ctx.lineTo(px * ps, top * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Mondstein über der Mittelspitze
  ctx.fillStyle = 'rgba(224, 232, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 6.3) * ps + off, ps * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 6.3) * ps + off, ps * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Schwebende Sterne
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx - w * 0.9) * ps, (ty - 4.4) * ps + off, ps * 0.35);
  sparkle(ctx, (cx + w * 0.85) * ps, (ty - 3.9) * ps + off, ps * 0.3);
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx + 0.9) * ps, (ty - 5.8) * ps + off, ps * 0.3);
}

export function drawVolcanoHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Vulkankegel mit Verlauf
  const grad = ctx.createLinearGradient(0, (ty - 4) * ps + off, 0, (ty + 0.8) * ps + off);
  grad.addColorStop(0, '#6B3A10');
  grad.addColorStop(1, '#3A1E00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - hw) * ps, (ty + 0.6) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw * 0.5) * ps,
    (ty - 3) * ps + off,
    (cx - 1.1) * ps,
    (ty - 3.8) * ps + off
  );
  ctx.lineTo((cx + 1.1) * ps, (ty - 3.8) * ps + off);
  ctx.quadraticCurveTo(
    (cx + hw * 0.5) * ps,
    (ty - 3) * ps + off,
    (cx + hw) * ps,
    (ty + 0.6) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Glühender Kraterrand
  ctx.fillStyle = 'rgba(255, 87, 34, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 3.8) * ps + off, ps * 1.7, ps * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lava quillt heraus
  const lava = ctx.createLinearGradient(0, (ty - 5.4) * ps + off, 0, (ty - 3.2) * ps + off);
  lava.addColorStop(0, '#FFD54F');
  lava.addColorStop(1, '#FF4500');
  ctx.fillStyle = lava;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 3.8) * ps + off, ps * 1.15, ps * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx - 0.3) * ps, (ty - 4.6) * ps + off, ps * 0.55, ps * 0.8, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Lavatropfen am Hang
  ctx.fillStyle = '#FF6347';
  ctx.beginPath();
  ctx.moveTo((cx + 0.9) * ps, (ty - 3.5) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 1.35) * ps,
    (ty - 2.4) * ps + off,
    (cx + 1.1) * ps,
    (ty - 1.6) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx + 0.85) * ps,
    (ty - 2.4) * ps + off,
    (cx + 0.9) * ps,
    (ty - 3.5) * ps + off
  );
  ctx.fill();
  // Glut-Punkte
  ctx.fillStyle = '#FFB74D';
  for (const [dx, dy] of [
    [-hw * 0.55, -1.3],
    [0.5, -2.1],
    [-0.9, -0.5],
  ]) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + dy) * ps + off, ps * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Funken über dem Krater
  ctx.fillStyle = '#FFD700';
  sparkle(ctx, (cx + 0.9) * ps, (ty - 5.4) * ps + off, ps * 0.3);
}

export function drawLotusHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const w = hw * 0.85;
  // Äussere Blütenblätter
  const petals = [-w * 0.8, -w * 0.4, 0, w * 0.4, w * 0.8];
  const petalH = [1.8, 2.6, 3.1, 2.6, 1.8];
  for (let i = 0; i < 5; i++) {
    const px = cx + petals[i];
    const grad = ctx.createLinearGradient(0, (ty - petalH[i]) * ps + off, 0, (ty + 0.6) * ps + off);
    grad.addColorStop(0, '#FF8FB8');
    grad.addColorStop(1, '#F06292');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((px - 0.75) * ps, (ty + 0.5) * ps + off);
    ctx.quadraticCurveTo(
      (px - 0.7) * ps,
      (ty - petalH[i] * 0.6) * ps + off,
      px * ps,
      (ty - petalH[i]) * ps + off
    );
    ctx.quadraticCurveTo(
      (px + 0.7) * ps,
      (ty - petalH[i] * 0.6) * ps + off,
      (px + 0.75) * ps,
      (ty + 0.5) * ps + off
    );
    ctx.closePath();
    ctx.fill();
    // Helle Innenseite
    ctx.fillStyle = 'rgba(255, 235, 242, 0.75)';
    ctx.beginPath();
    ctx.moveTo((px - 0.35) * ps, (ty + 0.4) * ps + off);
    ctx.quadraticCurveTo(
      (px - 0.3) * ps,
      (ty - petalH[i] * 0.5) * ps + off,
      px * ps,
      (ty - petalH[i] * 0.75) * ps + off
    );
    ctx.quadraticCurveTo(
      (px + 0.3) * ps,
      (ty - petalH[i] * 0.5) * ps + off,
      (px + 0.35) * ps,
      (ty + 0.4) * ps + off
    );
    ctx.closePath();
    ctx.fill();
  }
  // Goldenes Blütenherz
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty + 0.1) * ps + off, ps * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc((cx - 0.15) * ps, (ty - 0.05) * ps + off, ps * 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Grüner Blattkranz
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = ps * 0.35;
  ctx.beginPath();
  ctx.moveTo((cx - w - 0.4) * ps, (ty + 0.9) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ty + 1.4) * ps + off, (cx + w + 0.4) * ps, (ty + 0.9) * ps + off);
  ctx.stroke();
  // Tautropfen
  ctx.fillStyle = 'rgba(179, 229, 252, 0.9)';
  ctx.beginPath();
  ctx.arc((cx + w * 0.5) * ps, (ty - 1.7) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGlitchCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = Math.min(a.headHalfWidth, 3.5);
  const w = hw * 0.9;
  // Versetzte Geister-Kopien (Glitch-Echo)
  for (const [gx, gy, c] of [
    [-0.35, 0.15, 'rgba(255, 0, 255, 0.35)'],
    [0.35, -0.15, 'rgba(0, 255, 255, 0.35)'],
  ] as [number, number, string][]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo((cx - w + gx) * ps, (ty - 0.9 + gy) * ps + off);
    ctx.lineTo((cx + gx) * ps, (ty - 4 + gy) * ps + off);
    ctx.lineTo((cx + w + gx) * ps, (ty - 0.9 + gy) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Neon-Band mit Verlauf
  const band = ctx.createLinearGradient((cx - w) * ps, 0, (cx + w) * ps, 0);
  band.addColorStop(0, '#00E676');
  band.addColorStop(0.5, '#69F0AE');
  band.addColorStop(1, '#00E676');
  ctx.fillStyle = band;
  ctx.fillRect((cx - w) * ps, (ty - 0.9) * ps + off, ps * w * 2, ps * 1.2);
  // Zacken abwechselnd grün/magenta
  const px = [-w * 0.75, -w * 0.38, 0, w * 0.38, w * 0.75];
  const ph = [1.8, 2.6, 3.2, 2.4, 1.8];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#00E676' : '#EA80FC';
    ctx.beginPath();
    ctx.moveTo((cx + px[i] - 0.5) * ps, (ty - 0.8) * ps + off);
    ctx.lineTo((cx + px[i] + 0.5) * ps, (ty - 0.8) * ps + off);
    ctx.lineTo((cx + px[i]) * ps, (ty - 0.9 - ph[i]) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Scanline-Störung
  ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
  ctx.fillRect((cx - w * 0.7) * ps, (ty - 2.1) * ps + off, ps * 1.6, ps * 0.22);
  ctx.fillRect((cx + w * 0.15) * ps, (ty - 0.4) * ps + off, ps * 1.1, ps * 0.18);
  // Pixel-Funkeln
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx + w * 0.5) * ps, (ty - 3.6) * ps + off, ps * 0.3);
  ctx.fillRect((cx - w * 0.9) * ps, (ty - 2.8) * ps + off, ps * 0.25, ps * 0.25);
}

export function drawPyramidHelm(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  const base = '#DAA520';
  const w = hw * 0.95;
  // Goldene Pyramide mit Seitenverlauf
  const grad = ctx.createLinearGradient((cx - w) * ps, 0, (cx + w) * ps, 0);
  grad.addColorStop(0, lighten(base, 45));
  grad.addColorStop(0.5, base);
  grad.addColorStop(1, darken(base, 40));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo((cx - w) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo((cx + w) * ps, (ty + 0.6) * ps + off);
  ctx.lineTo(cx * ps, (ty - 4.8) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Kantenlinie
  ctx.strokeStyle = darken(base, 60);
  ctx.lineWidth = ps * 0.15;
  ctx.beginPath();
  ctx.moveTo(cx * ps, (ty - 4.8) * ps + off);
  ctx.lineTo((cx + 0.2) * ps, (ty + 0.6) * ps + off);
  ctx.stroke();
  // Stufenlinien
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  for (let i = 1; i <= 3; i++) {
    const f = i * 0.24;
    ctx.beginPath();
    ctx.moveTo((cx - w * (1 - f)) * ps, (ty + 0.6 - f * 5.4) * ps + off);
    ctx.lineTo((cx + w * (1 - f)) * ps, (ty + 0.6 - f * 5.4) * ps + off);
    ctx.stroke();
  }
  // Leuchtende Spitze
  ctx.fillStyle = 'rgba(255, 236, 139, 0.4)';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 4.6) * ps + off, ps * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFEC8B';
  ctx.beginPath();
  ctx.moveTo((cx - 0.5) * ps, (ty - 3.7) * ps + off);
  ctx.lineTo((cx + 0.5) * ps, (ty - 3.7) * ps + off);
  ctx.lineTo(cx * ps, (ty - 4.8) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Blaues Skarabäus-Juwel
  ctx.fillStyle = '#29B6F6';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ty - 0.4) * ps + off, ps * 0.45, ps * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc((cx - 0.13) * ps, (ty - 0.6) * ps + off, ps * 0.13, 0, Math.PI * 2);
  ctx.fill();
  // Funkeln
  ctx.fillStyle = '#FFFFFF';
  sparkle(ctx, (cx + w * 0.6) * ps, (ty - 2.2) * ps + off, ps * 0.3);
}

// ─── Erweiterung Juli 2026: neue Kopf-Accessoires ──────────────────────────

export function drawSproutHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  // Kleiner Keimling: Stiel + zwei Blätter
  ctx.fillStyle = '#66BB6A';
  ctx.fillRect((cx - 0.2) * ps, (ty - 1.6) * ps + off, ps * 0.4, ps * 1.6);
  ctx.fillStyle = '#81C784';
  ctx.beginPath();
  ctx.ellipse((cx - 1.2) * ps, (ty - 2) * ps + off, ps * 1.2, ps * 0.6, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1.2) * ps, (ty - 2) * ps + off, ps * 1.2, ps * 0.6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.ellipse((cx - 1.1) * ps, (ty - 1.9) * ps + off, ps * 0.5, ps * 0.25, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPopcornHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  // Rot-weiß gestreifte Tüte
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.moveTo((cx - 2.4) * ps, (ty - 3.4) * ps + off);
  ctx.lineTo((cx + 2.4) * ps, (ty - 3.4) * ps + off);
  ctx.lineTo((cx + 1.6) * ps, (ty + 0.4) * ps + off);
  ctx.lineTo((cx - 1.6) * ps, (ty + 0.4) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo((cx + i * 1.2 - 0.45) * ps, (ty - 3.4) * ps + off);
    ctx.lineTo((cx + i * 1.2 + 0.45) * ps, (ty - 3.4) * ps + off);
    ctx.lineTo((cx + i * 0.8 + 0.3) * ps, (ty + 0.4) * ps + off);
    ctx.lineTo((cx + i * 0.8 - 0.3) * ps, (ty + 0.4) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Popcorn-Knubbel oben
  ctx.fillStyle = '#FFF3C4';
  const kernels: [number, number, number][] = [
    [-1.8, -3.9, 0.7],
    [-0.6, -4.4, 0.8],
    [0.7, -4.1, 0.75],
    [1.8, -3.8, 0.6],
  ];
  for (const [dx, dy, r] of kernels) {
    ctx.beginPath();
    ctx.arc((cx + dx) * ps, (ty + dy) * ps + off, ps * r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#F4D06F';
  ctx.beginPath();
  ctx.arc((cx + 0.2) * ps, (ty - 4.2) * ps + off, ps * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPropellerCap(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Kappe (bunte Segmente)
  ctx.fillStyle = '#FFB300';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty + 0.2) * ps + off, ps * (hw * 0.75), Math.PI, Math.PI * 1.5);
  ctx.lineTo(cx * ps, (ty + 0.2) * ps + off);
  ctx.fill();
  ctx.fillStyle = '#29B6F6';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty + 0.2) * ps + off, ps * (hw * 0.75), Math.PI * 1.5, 0);
  ctx.lineTo(cx * ps, (ty + 0.2) * ps + off);
  ctx.fill();
  ctx.fillStyle = '#EF5350';
  ctx.fillRect((cx - hw * 0.75) * ps, (ty + 0.1) * ps + off, ps * hw * 1.5, ps * 0.5);
  // Stiel + Propeller
  ctx.fillStyle = '#616161';
  ctx.fillRect((cx - 0.15) * ps, (ty - 2.6) * ps + off, ps * 0.3, ps * 1.2);
  ctx.fillStyle = '#66BB6A';
  ctx.fillRect((cx - 2) * ps, (ty - 3) * ps + off, ps * 1.7, ps * 0.55);
  ctx.fillStyle = '#AB47BC';
  ctx.fillRect((cx + 0.3) * ps, (ty - 3) * ps + off, ps * 1.7, ps * 0.55);
  ctx.fillStyle = '#FDD835';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 2.75) * ps + off, ps * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

export function drawJesterHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Drei Zipfel (lila, gelb, türkis) mit Glöckchen
  const tips: [number, number, string][] = [
    [-hw * 0.7, 2.6, '#AB47BC'],
    [0, 3.4, '#FDD835'],
    [hw * 0.7, 2.6, '#26C6DA'],
  ];
  for (const [dx, h, c] of tips) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo((cx + dx - 1) * ps, (ty + 0.3) * ps + off);
    ctx.lineTo((cx + dx + 1) * ps, (ty + 0.3) * ps + off);
    ctx.lineTo((cx + dx * 1.6) * ps, (ty - h) * ps + off);
    ctx.closePath();
    ctx.fill();
    // Glöckchen
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc((cx + dx * 1.6) * ps, (ty - h - 0.3) * ps + off, ps * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  // Basis-Band
  ctx.fillStyle = '#8E24AA';
  ctx.fillRect((cx - hw * 0.9) * ps, (ty - 0.1) * ps + off, ps * hw * 1.8, ps * 0.8);
}

export function drawDetectiveHat(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Deerstalker-Kuppel mit Karo
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath();
  ctx.arc(cx * ps, ty * ps + off, ps * (hw * 0.9), Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = ps * 0.2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo((cx + i * 1.2 - 1) * ps, ty * ps + off);
    ctx.lineTo((cx + i * 1.2 + 1) * ps, (ty - hw * 0.9) * ps + off);
    ctx.stroke();
  }
  // Doppelte Schirme vorn + hinten
  ctx.fillStyle = '#6D4C41';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.95) * ps,
    (ty + 0.3) * ps + off,
    ps * 1.5,
    ps * 0.5,
    -0.2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    (cx + hw * 0.95) * ps,
    (ty + 0.3) * ps + off,
    ps * 1.5,
    ps * 0.5,
    0.2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Schleife oben
  ctx.fillStyle = '#5D4037';
  ctx.fillRect((cx - 0.6) * ps, (ty - hw * 0.9 - 0.4) * ps + off, ps * 1.2, ps * 0.5);
}

export function drawWinterCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Eiszacken
  ctx.fillStyle = '#B3E5FC';
  for (let i = -2; i <= 2; i++) {
    const h = i === 0 ? 3 : Math.abs(i) === 1 ? 2.2 : 1.5;
    ctx.beginPath();
    ctx.moveTo((cx + i * (hw * 0.45) - 0.7) * ps, (ty + 0.2) * ps + off);
    ctx.lineTo((cx + i * (hw * 0.45) + 0.7) * ps, (ty + 0.2) * ps + off);
    ctx.lineTo((cx + i * (hw * 0.45)) * ps, (ty - h) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Basis-Band mit Schimmer
  ctx.fillStyle = '#81D4FA';
  ctx.fillRect((cx - hw * 0.95) * ps, (ty - 0.1) * ps + off, ps * hw * 1.9, ps * 0.8);
  ctx.fillStyle = '#E1F5FE';
  ctx.fillRect((cx - hw * 0.95) * ps, (ty - 0.1) * ps + off, ps * hw * 1.9, ps * 0.25);
  // Funkel-Punkte
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - 1.5) * ps, (ty - 1.8) * ps + off, ps * 0.35, ps * 0.35);
  ctx.fillRect((cx + 1.1) * ps, (ty - 1.2) * ps + off, ps * 0.3, ps * 0.3);
}

export function drawDivingHelmet(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Messing-Kugelhelm (nur obere Hälfte, Bullauge frei)
  ctx.fillStyle = '#C9A227';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty + 0.6) * ps + off, ps * (hw * 0.98), Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#A8861D';
  ctx.fillRect((cx - hw * 0.98) * ps, (ty + 0.4) * ps + off, ps * hw * 1.96, ps * 0.5);
  // Nieten
  ctx.fillStyle = '#7A6215';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc((cx + i * hw * 0.42) * ps, (ty + 0.65) * ps + off, ps * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  // Seitliche Ventile
  ctx.fillStyle = '#C9A227';
  ctx.beginPath();
  ctx.arc((cx - hw * 1.05) * ps, (ty + 0.2) * ps + off, ps * 0.55, 0, Math.PI * 2);
  ctx.arc((cx + hw * 1.05) * ps, (ty + 0.2) * ps + off, ps * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Glanzlicht
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw * 0.4) * ps,
    (ty - hw * 0.5) * ps + off,
    ps * 0.9,
    ps * 0.45,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawCrystalHorns(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Zwei facettierte Kristallhörner
  for (let side = -1; side <= 1; side += 2) {
    const bx = cx + side * hw * 0.55;
    ctx.fillStyle = '#CE93D8';
    ctx.beginPath();
    ctx.moveTo((bx - 0.8) * ps, (ty + 0.3) * ps + off);
    ctx.lineTo((bx + 0.8) * ps, (ty + 0.3) * ps + off);
    ctx.lineTo((bx + side * 0.9) * ps, (ty - 3) * ps + off);
    ctx.closePath();
    ctx.fill();
    // Facetten-Glanz
    ctx.fillStyle = '#F3E5F5';
    ctx.beginPath();
    ctx.moveTo((bx - side * 0.4) * ps, (ty + 0.3) * ps + off);
    ctx.lineTo((bx + side * 0.2) * ps, (ty + 0.3) * ps + off);
    ctx.lineTo((bx + side * 0.75) * ps, (ty - 2.5) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
  // Funkeln
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw * 0.55 - 0.5) * ps, (ty - 2.2) * ps + off, ps * 0.35, ps * 0.35);
  ctx.fillRect((cx + hw * 0.55 + 0.3) * ps, (ty - 1.6) * ps + off, ps * 0.3, ps * 0.3);
}

export function drawJellyfishCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  // Leuchtende Quallen-Glocke
  ctx.fillStyle = 'rgba(128, 222, 234, 0.85)';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 1.4) * ps + off, ps * 2.2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(178, 235, 242, 0.9)';
  ctx.beginPath();
  ctx.arc(cx * ps, (ty - 1.6) * ps + off, ps * 1.5, Math.PI, 0);
  ctx.fill();
  // Innen-Glow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc((cx - 0.6) * ps, (ty - 2.2) * ps + off, ps * 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Tentakel-Fransen
  ctx.strokeStyle = 'rgba(77, 208, 225, 0.9)';
  ctx.lineWidth = ps * 0.3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo((cx + i * 0.9) * ps, (ty - 1.2) * ps + off);
    ctx.quadraticCurveTo(
      (cx + i * 0.9 + 0.4) * ps,
      (ty - 0.4) * ps + off,
      (cx + i * 0.9 - 0.2) * ps,
      (ty + 0.5) * ps + off
    );
    ctx.stroke();
  }
  // Leucht-Punkte auf der Glocke
  ctx.fillStyle = '#E0F7FA';
  ctx.fillRect((cx + 0.8) * ps, (ty - 2.6) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx - 1.4) * ps, (ty - 1.9) * ps + off, ps * 0.25, ps * 0.25);
}

export function drawGalaxyCrown(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const hw = a.headHalfWidth;
  // Nebel-Band (Verlauf lila→blau)
  const grad = ctx.createLinearGradient((cx - hw) * ps, 0, (cx + hw) * ps, 0);
  grad.addColorStop(0, '#7E57C2');
  grad.addColorStop(0.5, '#5C6BC0');
  grad.addColorStop(1, '#AB47BC');
  ctx.fillStyle = grad;
  ctx.fillRect((cx - hw * 0.95) * ps, (ty - 0.4) * ps + off, ps * hw * 1.9, ps * 1);
  // Zacken mit Sternen-Spitzen
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((cx + i * hw * 0.6 - 0.8) * ps, (ty - 0.3) * ps + off);
    ctx.lineTo((cx + i * hw * 0.6 + 0.8) * ps, (ty - 0.3) * ps + off);
    ctx.lineTo((cx + i * hw * 0.6) * ps, (ty - (i === 0 ? 3 : 2.2)) * ps + off);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFF59D';
    const sy = ty - (i === 0 ? 3.3 : 2.5);
    ctx.fillRect((cx + i * hw * 0.6 - 0.2) * ps, (sy - 0.2) * ps + off, ps * 0.5, ps * 0.5);
  }
  // Sternenstaub im Band
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((cx - hw * 0.6) * ps, (ty + 0.05) * ps + off, ps * 0.25, ps * 0.25);
  ctx.fillRect((cx + hw * 0.4) * ps, (ty - 0.2) * ps + off, ps * 0.3, ps * 0.3);
  ctx.fillRect((cx - 0.2) * ps, (ty + 0.2) * ps + off, ps * 0.2, ps * 0.2);
}
