import type { PetAnchors } from './shared';
import { darken, lighten } from './shared';

// Abgerundetes Rechteck mit Fallback für ältere Canvas-Implementierungen
function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export function drawRoundGlasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lcx = cx + a.eyeLeftX + a.eyeWidth / 2;
  const rcx = cx + a.eyeRightX + a.eyeWidth / 2;
  const r = a.eyeWidth / 2 + 0.55;
  const cy = (ey + 0.3) * ps + off;
  // Zart getönte Gläser mit weichem Verlauf
  for (const gx of [lcx, rcx]) {
    const g = ctx.createLinearGradient(gx * ps, cy - r * ps, gx * ps, cy + r * ps);
    g.addColorStop(0, 'rgba(255,255,255,0.24)');
    g.addColorStop(1, 'rgba(255,255,255,0.06)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx * ps, cy, r * ps, 0, Math.PI * 2);
    ctx.fill();
  }
  // Feine Drahtfassung
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = ps * 0.42;
  for (const gx of [lcx, rcx]) {
    ctx.beginPath();
    ctx.arc(gx * ps, cy, r * ps, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Heller Lichtbogen auf der Fassung
  ctx.strokeStyle = lighten('#8B7355', 45);
  ctx.lineWidth = ps * 0.16;
  for (const gx of [lcx, rcx]) {
    ctx.beginPath();
    ctx.arc(gx * ps, cy, (r - 0.12) * ps, -Math.PI * 0.85, -Math.PI * 0.35);
    ctx.stroke();
  }
  // Geschwungener Steg
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = ps * 0.38;
  ctx.beginPath();
  ctx.moveTo((lcx + r - 0.1) * ps, cy);
  ctx.quadraticCurveTo(cx * ps, (ey - 0.5) * ps + off, (rcx - r + 0.1) * ps, cy);
  ctx.stroke();
  // Sanft gebogene Bügel
  ctx.beginPath();
  ctx.moveTo((lcx - r) * ps, cy);
  ctx.quadraticCurveTo(
    (lcx - r - 0.6) * ps,
    (ey + 0.15) * ps + off,
    (cx - a.headHalfWidth) * ps,
    (ey - 0.2) * ps + off
  );
  ctx.moveTo((rcx + r) * ps, cy);
  ctx.quadraticCurveTo(
    (rcx + r + 0.6) * ps,
    (ey + 0.15) * ps + off,
    (cx + a.headHalfWidth) * ps,
    (ey - 0.2) * ps + off
  );
  ctx.stroke();
  // Glanzpunkte auf den Gläsern
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const gx of [lcx, rcx]) {
    ctx.beginPath();
    ctx.arc((gx - r * 0.35) * ps, cy - r * 0.4 * ps, ps * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSunglasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  // Coole dunkle Gläser mit blauem Schimmer
  for (const x of [lx, rx]) {
    const g = ctx.createLinearGradient(
      x * ps,
      (ey - 0.7) * ps + off,
      x * ps,
      (ey + 1.5) * ps + off
    );
    g.addColorStop(0, '#263238');
    g.addColorStop(0.55, '#0D0D0D');
    g.addColorStop(1, '#1A237E');
    ctx.fillStyle = g;
    rr(ctx, (x - 0.55) * ps, (ey - 0.7) * ps + off, ps * (ew + 1.1), ps * 2.2, ps * 0.8);
    ctx.fill();
    // Schräger Glanzstreifen
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = ps * 0.3;
    ctx.beginPath();
    ctx.moveTo((x - 0.1) * ps, (ey + 1.1) * ps + off);
    ctx.lineTo((x + 0.9) * ps, (ey - 0.3) * ps + off);
    ctx.stroke();
  }
  // Weiche Oberkante der Fassung
  ctx.strokeStyle = '#37474F';
  ctx.lineWidth = ps * 0.35;
  ctx.beginPath();
  ctx.moveTo((lx - 0.55) * ps, (ey - 0.55) * ps + off);
  ctx.lineTo((rx + ew + 0.55) * ps, (ey - 0.55) * ps + off);
  ctx.stroke();
  // Geschwungener Steg + Bügel
  ctx.beginPath();
  ctx.moveTo((lx + ew + 0.4) * ps, (ey - 0.1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ey - 0.55) * ps + off, (rx - 0.4) * ps, (ey - 0.1) * ps + off);
  ctx.moveTo((lx - 0.55) * ps, (ey + 0.2) * ps + off);
  ctx.lineTo((cx - a.headHalfWidth - 0.3) * ps, ey * ps + off);
  ctx.moveTo((rx + ew + 0.55) * ps, (ey + 0.2) * ps + off);
  ctx.lineTo((cx + a.headHalfWidth + 0.3) * ps, ey * ps + off);
  ctx.stroke();
}

export function drawHeartGlasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  // Herzform aus Bögen und weichen Kurven
  const heart = (hx: number, hy: number, s: number) => {
    ctx.beginPath();
    ctx.arc((hx - s * 0.42) * ps, (hy - s * 0.3) * ps + off, ps * s * 0.52, 0, Math.PI * 2);
    ctx.arc((hx + s * 0.42) * ps, (hy - s * 0.3) * ps + off, ps * s * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo((hx - s * 0.92) * ps, (hy - s * 0.12) * ps + off);
    ctx.quadraticCurveTo(
      (hx - s * 0.55) * ps,
      (hy + s * 0.55) * ps + off,
      hx * ps,
      (hy + s) * ps + off
    );
    ctx.quadraticCurveTo(
      (hx + s * 0.55) * ps,
      (hy + s * 0.55) * ps + off,
      (hx + s * 0.92) * ps,
      (hy - s * 0.12) * ps + off
    );
    ctx.closePath();
    ctx.fill();
  };

  for (const hx of [lx + ew / 2, rx + ew / 2]) {
    // Dunkler Rand, dann rosa Herzglas
    ctx.fillStyle = '#C2185B';
    heart(hx, ey + 0.36, 1.72);
    ctx.fillStyle = '#FF1493';
    heart(hx, ey + 0.3, 1.5);
    // Glanzpunkt oben links
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc((hx - 0.55) * ps, (ey - 0.2) * ps + off, ps * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  // Geschwungener Steg
  ctx.strokeStyle = '#FF1493';
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.moveTo((lx + ew * 0.9) * ps, (ey + 0.1) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ey - 0.35) * ps + off,
    (rx + ew * 0.1) * ps,
    (ey + 0.1) * ps + off
  );
  ctx.stroke();
  // Bügel
  ctx.strokeStyle = '#CC1177';
  ctx.beginPath();
  ctx.moveTo((lx - 0.9) * ps, (ey + 0.2) * ps + off);
  ctx.lineTo((cx - a.headHalfWidth - 0.2) * ps, ey * ps + off);
  ctx.moveTo((rx + ew + 0.9) * ps, (ey + 0.2) * ps + off);
  ctx.lineTo((cx + a.headHalfWidth + 0.2) * ps, ey * ps + off);
  ctx.stroke();
}

export function drawMonocle(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  const mx = rx + ew / 2;
  const my = ey + 0.3;
  const r = ew / 2 + 0.7;

  // Zart getöntes Glas
  const g = ctx.createRadialGradient(
    (mx - 0.3) * ps,
    (my - 0.3) * ps + off,
    ps * 0.2,
    mx * ps,
    my * ps + off,
    ps * r
  );
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(220,240,255,0.1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(mx * ps, my * ps + off, ps * (r - 0.1), 0, Math.PI * 2);
  ctx.fill();
  // Goldfassung mit hellem Lichtbogen
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.5;
  ctx.beginPath();
  ctx.arc(mx * ps, my * ps + off, ps * r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = lighten('#DAA520', 55);
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.arc(mx * ps, my * ps + off, ps * (r - 0.15), -Math.PI * 0.85, -Math.PI * 0.3);
  ctx.stroke();
  // Sichelförmiger Glasglanz
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(mx * ps, my * ps + off, ps * (r - 0.5), -Math.PI * 0.8, -Math.PI * 0.4);
  ctx.stroke();
  // Kette mit kleinen Goldperlen
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo(mx * ps, (my + r) * ps + off);
  ctx.quadraticCurveTo(
    (mx - 1.4) * ps,
    (ey + 3.2) * ps + off,
    (mx - 0.6) * ps,
    (ey + 5.2) * ps + off
  );
  ctx.stroke();
  ctx.fillStyle = lighten('#DAA520', 30);
  ctx.beginPath();
  ctx.arc((mx - 0.75) * ps, (ey + 3.1) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((mx - 0.6) * ps, (ey + 5.2) * ps + off, ps * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStarShades(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;

  // Fünfzackiger Stern mit weichen Proportionen
  const star = (sx: number, sy: number, s: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? s : s * 0.48;
      const px = (sx + Math.cos(ang) * rad) * ps;
      const py = (sy + Math.sin(ang) * rad) * ps + off;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  for (const sx of [lx + ew / 2, rx + ew / 2]) {
    // Weicher Schattenrand, dann goldener Verlauf
    ctx.fillStyle = '#E65100';
    star(sx + 0.08, ey + 0.42, 1.78);
    const g = ctx.createLinearGradient(
      sx * ps,
      (ey - 1.4) * ps + off,
      sx * ps,
      (ey + 2) * ps + off
    );
    g.addColorStop(0, '#FFE082');
    g.addColorStop(1, '#FFA000');
    ctx.fillStyle = g;
    star(sx, ey + 0.3, 1.68);
    // Glanzpunkt
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc((sx - 0.35) * ps, (ey - 0.25) * ps + off, ps * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  // Steg und Bügel
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.38;
  ctx.beginPath();
  ctx.moveTo((lx + ew * 0.9) * ps, (ey + 0.1) * ps + off);
  ctx.quadraticCurveTo(
    cx * ps,
    (ey - 0.25) * ps + off,
    (rx + ew * 0.1) * ps,
    (ey + 0.1) * ps + off
  );
  ctx.moveTo((lx - 1) * ps, (ey + 0.25) * ps + off);
  ctx.lineTo((cx - a.headHalfWidth - 0.2) * ps, (ey + 0.05) * ps + off);
  ctx.moveTo((rx + ew + 1) * ps, (ey + 0.25) * ps + off);
  ctx.lineTo((cx + a.headHalfWidth + 0.2) * ps, (ey + 0.05) * ps + off);
  ctx.stroke();
}

export function drawLaserVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;

  // Abgerundetes Visierband
  ctx.fillStyle = '#1a1a1a';
  rr(ctx, (cx - hw - 0.5) * ps, (ey - 0.45) * ps + off, ps * (hw * 2 + 1), ps * 1.5, ps * 0.7);
  ctx.fill();
  // Weicher Lichtschein an der Oberkante
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, (cx - hw - 0.2) * ps, (ey - 0.35) * ps + off, ps * (hw * 2 + 0.4), ps * 0.4, ps * 0.2);
  ctx.fill();
  // Roter Laserstreifen mit Glühen
  ctx.shadowColor = '#FF1744';
  ctx.shadowBlur = ps * 3;
  ctx.fillStyle = '#FF1744';
  rr(ctx, (cx - hw) * ps, (ey + 0.05) * ps + off, ps * hw * 2, ps * 0.5, ps * 0.25);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Heller Laserkern
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  rr(ctx, (cx - hw + 0.3) * ps, (ey + 0.18) * ps + off, ps * (hw * 2 - 0.6), ps * 0.24, ps * 0.12);
  ctx.fill();
  // Runde Seitenmodule mit leuchtender LED
  for (const side of [-1, 1]) {
    const sx = cx + side * (hw + 0.9);
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.arc(sx * ps, (ey + 0.3) * ps + off, ps * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FF1744';
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(sx * ps, (ey + 0.3) * ps + off, ps * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function drawTheatreMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  const mx = cx + hw * 0.5;
  // Goldene Halbmaske mit weichem Verlauf
  const g = ctx.createLinearGradient(
    mx * ps,
    (ey - 1.8) * ps + off,
    mx * ps,
    (ey + 2.2) * ps + off
  );
  g.addColorStop(0, '#FFE082');
  g.addColorStop(1, '#DAA520');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(mx * ps, (ey + 0.2) * ps + off, ps * (hw * 0.72 + 0.6), ps * 2.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lachendes Augenloch
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse((mx + 0.2) * ps, (ey + 0.1) * ps + off, ps * 0.85, ps * 0.42, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Zierschnörkel am Wangenrand
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc((mx + 0.3) * ps, (ey + 1.3) * ps + off, ps * 0.55, Math.PI * 0.1, Math.PI * 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc((mx - 1) * ps, (ey + 1.1) * ps + off, ps * 0.35, -Math.PI * 0.4, Math.PI * 0.9);
  ctx.stroke();
  // Glanzlicht oben
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse((mx - 0.7) * ps, (ey - 1.1) * ps + off, ps * 0.7, ps * 0.32, -0.35, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSurgeonMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Weich gerundete Maske
  ctx.fillStyle = '#87CEEB';
  ctx.beginPath();
  ctx.moveTo((cx - hw) * ps, (ey + 0.7) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ey + 0.3) * ps + off, (cx + hw) * ps, (ey + 0.7) * ps + off);
  ctx.quadraticCurveTo((cx + hw) * ps, (ey + 3.3) * ps + off, cx * ps, (ey + 3.8) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw) * ps,
    (ey + 3.3) * ps + off,
    (cx - hw) * ps,
    (ey + 0.7) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Heller Schimmer oben
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  rr(ctx, (cx - hw + 0.5) * ps, (ey + 0.75) * ps + off, ps * (hw * 2 - 1), ps * 0.45, ps * 0.22);
  ctx.fill();
  // Falten als sanfte Bögen
  ctx.strokeStyle = darken('#87CEEB', 45);
  ctx.lineWidth = ps * 0.18;
  for (const fy of [1.6, 2.3]) {
    ctx.beginPath();
    ctx.moveTo((cx - hw + 0.6) * ps, (ey + fy) * ps + off);
    ctx.quadraticCurveTo(
      cx * ps,
      (ey + fy + 0.35) * ps + off,
      (cx + hw - 0.6) * ps,
      (ey + fy) * ps + off
    );
    ctx.stroke();
  }
  // Ohrbänder
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = ps * 0.24;
  ctx.beginPath();
  ctx.moveTo((cx - hw) * ps, (ey + 0.9) * ps + off);
  ctx.quadraticCurveTo(
    (cx - hw - 0.8) * ps,
    (ey + 0.2) * ps + off,
    (cx - hw - 0.5) * ps,
    (ey - 0.5) * ps + off
  );
  ctx.moveTo((cx + hw) * ps, (ey + 0.9) * ps + off);
  ctx.quadraticCurveTo(
    (cx + hw + 0.8) * ps,
    (ey + 0.2) * ps + off,
    (cx + hw + 0.5) * ps,
    (ey - 0.5) * ps + off
  );
  ctx.stroke();
}

export function drawNerdGlasses(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Dicke schwarze Fassung mit runden Ecken
  for (const x of [lx, rx]) {
    ctx.fillStyle = '#1a1a1a';
    rr(ctx, (x - 0.8) * ps, (ey - 0.8) * ps + off, ps * (ew + 1.6), ps * 2.5, ps * 0.9);
    ctx.fill();
    // Glas mit kühlem Verlauf
    const g = ctx.createLinearGradient(
      x * ps,
      (ey - 0.35) * ps + off,
      x * ps,
      (ey + 1.35) * ps + off
    );
    g.addColorStop(0, 'rgba(190,225,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.fillStyle = g;
    rr(ctx, (x - 0.35) * ps, (ey - 0.35) * ps + off, ps * (ew + 0.7), ps * 1.7, ps * 0.6);
    ctx.fill();
    // Schräger Glanzstrich
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.moveTo(x * ps, (ey + 0.9) * ps + off);
    ctx.lineTo((x + 0.8) * ps, (ey - 0.1) * ps + off);
    ctx.stroke();
  }
  // Kräftiger Steg
  ctx.fillStyle = '#1a1a1a';
  const bw = ps * (rx - lx - ew + 0.2);
  rr(ctx, (lx + ew - 0.1) * ps, (ey - 0.2) * ps + off, bw, ps * 0.8, ps * 0.3);
  ctx.fill();
  // Pflaster-Tape auf dem Steg
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  rr(ctx, (cx - 0.35) * ps, (ey - 0.5) * ps + off, ps * 0.7, ps * 1.3, ps * 0.2);
  ctx.fill();
  // Bügel
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.moveTo((lx - 0.7) * ps, (ey + 0.35) * ps + off);
  ctx.lineTo((cx - a.headHalfWidth - 0.2) * ps, (ey + 0.1) * ps + off);
  ctx.moveTo((rx + ew + 0.7) * ps, (ey + 0.35) * ps + off);
  ctx.lineTo((cx + a.headHalfWidth + 0.2) * ps, (ey + 0.1) * ps + off);
  ctx.stroke();
}

export function drawClownNose(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  // Rote Knollennase mit weichem Verlauf
  const g = ctx.createRadialGradient(
    (cx - 0.4) * ps,
    (ey + 1.1) * ps + off,
    ps * 0.15,
    cx * ps,
    (ey + 1.5) * ps + off,
    ps * 1.3
  );
  g.addColorStop(0, '#FF6659');
  g.addColorStop(1, '#D32F2F');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 1.5) * ps + off, ps * 1.25, 0, Math.PI * 2);
  ctx.fill();
  // Weicher Schattenbogen unten
  ctx.strokeStyle = 'rgba(139,0,0,0.45)';
  ctx.lineWidth = ps * 0.22;
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 1.5) * ps + off, ps * 1.05, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  // Glanzlichter
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc((cx - 0.45) * ps, (ey + 1.05) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc((cx + 0.35) * ps, (ey + 1.85) * ps + off, ps * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCyclopsEye(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  // Großes rundes Auge mit weichem Rand
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 0.3) * ps + off, ps * 1.9, ps * 1.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,120,120,0.35)';
  ctx.lineWidth = ps * 0.15;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 0.3) * ps + off, ps * 1.9, ps * 1.75, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Iris mit Verlauf
  const g = ctx.createRadialGradient(
    cx * ps,
    (ey + 0.3) * ps + off,
    ps * 0.2,
    cx * ps,
    (ey + 0.3) * ps + off,
    ps * 1.1
  );
  g.addColorStop(0, '#C62828');
  g.addColorStop(1, '#7F0000');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.3) * ps + off, ps * 1.1, 0, Math.PI * 2);
  ctx.fill();
  // Pupille
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.3) * ps + off, ps * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Glanzlichter
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc((cx - 0.4) * ps, (ey - 0.15) * ps + off, ps * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc((cx + 0.4) * ps, (ey + 0.75) * ps + off, ps * 0.14, 0, Math.PI * 2);
  ctx.fill();
  // Sanft geschwungene Braue
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = ps * 0.45;
  ctx.beginPath();
  ctx.moveTo((cx - 1.6) * ps, (ey - 1) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ey - 1.8) * ps + off, (cx + 1.6) * ps, (ey - 1) * ps + off);
  ctx.stroke();
}

export function drawSkiGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Breites Kopfband
  ctx.fillStyle = '#37474F';
  rr(ctx, (cx - hw - 1) * ps, (ey - 0.45) * ps + off, ps * (hw * 2 + 2), ps * 0.55, ps * 0.27);
  ctx.fill();
  // Oranger Rahmen mit runden Ecken
  ctx.fillStyle = '#FF5722';
  rr(ctx, (cx - hw) * ps, (ey - 0.9) * ps + off, ps * hw * 2, ps * 2.4, ps * 1);
  ctx.fill();
  ctx.fillStyle = lighten('#FF5722', 40);
  rr(ctx, (cx - hw + 0.3) * ps, (ey - 0.75) * ps + off, ps * (hw * 2 - 0.6), ps * 0.35, ps * 0.17);
  ctx.fill();
  // Verspiegeltes Glas mit Farbverlauf
  const g = ctx.createLinearGradient(
    (cx - hw) * ps,
    (ey - 0.4) * ps + off,
    (cx + hw) * ps,
    (ey + 1.2) * ps + off
  );
  g.addColorStop(0, '#7C4DFF');
  g.addColorStop(0.5, '#2979FF');
  g.addColorStop(1, '#00E5FF');
  ctx.fillStyle = g;
  rr(ctx, (cx - hw + 0.5) * ps, (ey - 0.4) * ps + off, ps * (hw * 2 - 1), ps * 1.6, ps * 0.7);
  ctx.fill();
  // Schräger Glanz auf dem Glas
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = ps * 0.3;
  ctx.beginPath();
  ctx.moveTo((cx - hw + 1.2) * ps, (ey + 0.9) * ps + off);
  ctx.lineTo((cx - hw + 2.6) * ps, (ey - 0.2) * ps + off);
  ctx.stroke();
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.moveTo((cx - hw + 2) * ps, (ey + 1) * ps + off);
  ctx.lineTo((cx - hw + 3.4) * ps, (ey - 0.1) * ps + off);
  ctx.stroke();
}

export function drawVisionVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Schlankes Visier mit runden Ecken
  ctx.fillStyle = '#37474F';
  rr(ctx, (cx - hw - 0.5) * ps, (ey - 0.55) * ps + off, ps * (hw * 2 + 1), ps * 1.6, ps * 0.7);
  ctx.fill();
  // Grünes HUD-Display
  ctx.fillStyle = 'rgba(0,255,120,0.35)';
  rr(ctx, (cx - hw) * ps, (ey - 0.25) * ps + off, ps * hw * 2, ps * 1.05, ps * 0.45);
  ctx.fill();
  // Zielkreis mit Fadenkreuz
  ctx.strokeStyle = '#00FF66';
  ctx.lineWidth = ps * 0.15;
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.28) * ps + off, ps * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((cx - 0.7) * ps, (ey + 0.28) * ps + off);
  ctx.lineTo((cx + 0.7) * ps, (ey + 0.28) * ps + off);
  ctx.moveTo(cx * ps, (ey - 0.42) * ps + off);
  ctx.lineTo(cx * ps, (ey + 0.98) * ps + off);
  ctx.stroke();
  // Zarte Scanline
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  rr(ctx, (cx - hw + 0.4) * ps, (ey - 0.15) * ps + off, ps * (hw * 2 - 0.8), ps * 0.22, ps * 0.11);
  ctx.fill();
  // Runde Seitenmodule mit blauer LED
  for (const side of [-1, 1]) {
    const sx = cx + side * (hw + 0.9);
    ctx.fillStyle = '#455A64';
    ctx.beginPath();
    ctx.arc(sx * ps, (ey + 0.2) * ps + off, ps * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#00AAFF';
    ctx.shadowBlur = ps * 2;
    ctx.fillStyle = '#00AAFF';
    ctx.beginPath();
    ctx.arc(sx * ps, (ey + 0.2) * ps + off, ps * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function drawDiamondMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  const lx = cx + a.eyeLeftX + a.eyeWidth / 2;
  const rx = cx + a.eyeRightX + a.eyeWidth / 2;
  // Eisblaue Maske mit weicher Kontur
  const g = ctx.createLinearGradient(
    cx * ps,
    (ey - 1.7) * ps + off,
    cx * ps,
    (ey + 1.9) * ps + off
  );
  g.addColorStop(0, '#E0FFFF');
  g.addColorStop(1, '#8FD9EA');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 0.15) * ps + off, ps * (hw + 0.3), ps * 1.85, 0, 0, Math.PI * 2);
  ctx.fill();
  // Facettenlinien
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = ps * 0.14;
  ctx.beginPath();
  ctx.moveTo((cx - hw + 0.8) * ps, (ey - 1) * ps + off);
  ctx.lineTo((cx - hw + 1.6) * ps, (ey + 1.4) * ps + off);
  ctx.moveTo(cx * ps, (ey - 1.6) * ps + off);
  ctx.lineTo(cx * ps, (ey + 1.9) * ps + off);
  ctx.moveTo((cx + hw - 0.8) * ps, (ey - 1) * ps + off);
  ctx.lineTo((cx + hw - 1.6) * ps, (ey + 1.4) * ps + off);
  ctx.stroke();
  // Mandelförmige Augenöffnungen
  ctx.fillStyle = '#0d1b2a';
  ctx.beginPath();
  ctx.ellipse(lx * ps, (ey + 0.25) * ps + off, ps * 0.85, ps * 0.45, -0.12, 0, Math.PI * 2);
  ctx.ellipse(rx * ps, (ey + 0.25) * ps + off, ps * 0.85, ps * 0.45, 0.12, 0, Math.PI * 2);
  ctx.fill();
  // Vierstrahlige Funkel-Sterne
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = ps * 0.16;
  for (const [sx, sy] of [
    [cx - hw + 0.7, ey - 0.7],
    [cx + hw - 0.6, ey + 0.9],
  ]) {
    ctx.beginPath();
    ctx.moveTo((sx - 0.35) * ps, sy * ps + off);
    ctx.lineTo((sx + 0.35) * ps, sy * ps + off);
    ctx.moveTo(sx * ps, (sy - 0.35) * ps + off);
    ctx.lineTo(sx * ps, (sy + 0.35) * ps + off);
    ctx.stroke();
  }
}

export function drawNinjaMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Maskentuch mit runder Silhouette
  ctx.fillStyle = '#212121';
  rr(ctx, (cx - hw - 0.5) * ps, (ey - 1.1) * ps + off, ps * (hw * 2 + 1), ps * 3.2, ps * 1.1);
  ctx.fill();
  // Weiche Stoff-Lichtkante
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx - hw) * ps, (ey + 1.6) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ey + 2) * ps + off, (cx + hw) * ps, (ey + 1.6) * ps + off);
  ctx.stroke();
  // Augenschlitz
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 0.2) * ps + off, ps * hw * 0.82, ps * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rotes Stirnband mit dunkler Kante
  ctx.fillStyle = '#D32F2F';
  rr(ctx, (cx - hw - 0.5) * ps, (ey - 1.45) * ps + off, ps * (hw * 2 + 1), ps * 0.6, ps * 0.3);
  ctx.fill();
  ctx.strokeStyle = darken('#D32F2F', 50);
  ctx.lineWidth = ps * 0.12;
  ctx.beginPath();
  ctx.moveTo((cx - hw - 0.3) * ps, (ey - 0.9) * ps + off);
  ctx.lineTo((cx + hw + 0.3) * ps, (ey - 0.9) * ps + off);
  ctx.stroke();
  // Wehende Bänder
  ctx.strokeStyle = '#D32F2F';
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.moveTo((cx + hw + 0.2) * ps, (ey - 1.15) * ps + off);
  ctx.quadraticCurveTo(
    (cx + hw + 1.6) * ps,
    (ey - 1.6) * ps + off,
    (cx + hw + 2.6) * ps,
    (ey - 0.9) * ps + off
  );
  ctx.moveTo((cx + hw + 0.2) * ps, (ey - 1.05) * ps + off);
  ctx.quadraticCurveTo(
    (cx + hw + 1.3) * ps,
    (ey - 0.5) * ps + off,
    (cx + hw + 2.2) * ps,
    (ey + 0.1) * ps + off
  );
  ctx.stroke();
}

export function drawAviatorGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  const r = ew / 2 + 0.8;
  // Ledernes Kopfband
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = ps * 0.55;
  ctx.beginPath();
  ctx.moveTo((cx - a.headHalfWidth - 0.6) * ps, (ey + 0.35) * ps + off);
  ctx.lineTo((cx + a.headHalfWidth + 0.6) * ps, (ey + 0.35) * ps + off);
  ctx.stroke();
  for (const gx of [lx + ew / 2, rx + ew / 2]) {
    // Bernstein-Glas mit warmem Verlauf
    const g = ctx.createRadialGradient(
      (gx - 0.3) * ps,
      (ey - 0.1) * ps + off,
      ps * 0.2,
      gx * ps,
      (ey + 0.3) * ps + off,
      ps * r
    );
    g.addColorStop(0, 'rgba(255,224,130,0.7)');
    g.addColorStop(1, 'rgba(255,111,0,0.45)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx * ps, (ey + 0.3) * ps + off, ps * (r - 0.25), 0, Math.PI * 2);
    ctx.fill();
    // Chromfassung mit Lichtkante
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = ps * 0.42;
    ctx.beginPath();
    ctx.arc(gx * ps, (ey + 0.3) * ps + off, ps * r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = lighten('#B0BEC5', 45);
    ctx.lineWidth = ps * 0.16;
    ctx.beginPath();
    ctx.arc(gx * ps, (ey + 0.3) * ps + off, ps * (r - 0.14), -Math.PI * 0.85, -Math.PI * 0.35);
    ctx.stroke();
    // Sichel-Glanz
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = ps * 0.2;
    ctx.beginPath();
    ctx.arc(gx * ps, (ey + 0.3) * ps + off, ps * (r - 0.55), -Math.PI * 0.8, -Math.PI * 0.45);
    ctx.stroke();
  }
  // Niete am Steg
  ctx.fillStyle = '#B0BEC5';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.15) * ps + off, ps * 0.24, 0, Math.PI * 2);
  ctx.fill();
}

export function drawNightOwlGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  const cy = (ey + 0.3) * ps + off;
  // Weiches Außenglühen
  ctx.fillStyle = 'rgba(0,255,100,0.14)';
  for (const gx of [lx + ew / 2, rx + ew / 2]) {
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (ew / 2 + 1.55), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const gx of [lx + ew / 2, rx + ew / 2]) {
    // Runde Tuben mit heller Kante
    ctx.fillStyle = '#311B92';
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (ew / 2 + 1.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lighten('#311B92', 45);
    ctx.lineWidth = ps * 0.16;
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (ew / 2 + 1.05), -Math.PI * 0.85, -Math.PI * 0.3);
    ctx.stroke();
    // Grüne Linse mit Verlauf
    const g = ctx.createRadialGradient(gx * ps, cy, ps * 0.15, gx * ps, cy, ps * (ew / 2 + 0.6));
    g.addColorStop(0, 'rgba(185,255,185,0.75)');
    g.addColorStop(1, 'rgba(0,200,60,0.4)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (ew / 2 + 0.6), 0, Math.PI * 2);
    ctx.fill();
    // Glanzpunkt
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc((gx - 0.45) * ps, cy - ps * 0.5, ps * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  // Abgerundeter Steg
  ctx.fillStyle = '#2E1065';
  const bw = ps * (rx - lx - ew + 0.2);
  rr(ctx, (lx + ew - 0.1) * ps, (ey - 0.2) * ps + off, bw, ps * 0.8, ps * 0.3);
  ctx.fill();
}

export function drawPixelShades(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Retro-Fassung mit sanft gerundeten Ecken
  ctx.fillStyle = '#1a1a1a';
  for (const x of [lx, rx]) {
    rr(ctx, (x - 0.55) * ps, (ey - 0.55) * ps + off, ps * (ew + 1.1), ps * 2.1, ps * 0.45);
    ctx.fill();
  }
  rr(ctx, (lx + ew - 0.1) * ps, ey * ps + off, ps * (rx - lx - ew + 0.2), ps * 0.7, ps * 0.3);
  ctx.fill();
  // Pixel-Raster in zwei Neon-Tönen
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < Math.floor(ew) + 1; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(0,229,255,0.5)' : 'rgba(41,98,255,0.5)';
      for (const x of [lx, rx]) {
        const px = (x - 0.2 + c * 0.8) * ps;
        rr(ctx, px, (ey - 0.2 + r * 0.85) * ps + off, ps * 0.7, ps * 0.7, ps * 0.16);
        ctx.fill();
      }
    }
  }
  // Glanzpixel oben links
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (const x of [lx, rx]) {
    rr(ctx, (x - 0.1) * ps, (ey - 0.1) * ps + off, ps * 0.4, ps * 0.4, ps * 0.12);
    ctx.fill();
  }
}

export function drawSteamGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  const cy = (ey + 0.3) * ps + off;
  const r = ew / 2 + 1;
  // Ledernes Kopfband
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = ps * 0.55;
  ctx.beginPath();
  ctx.moveTo((cx - a.headHalfWidth - 0.6) * ps, (ey + 0.35) * ps + off);
  ctx.lineTo((cx + a.headHalfWidth + 0.6) * ps, (ey + 0.35) * ps + off);
  ctx.stroke();
  for (const gx of [lx + ew / 2, rx + ew / 2]) {
    // Messingfassung in zwei Tönen
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lighten('#B8860B', 50);
    ctx.lineWidth = ps * 0.18;
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (r - 0.18), -Math.PI * 0.85, -Math.PI * 0.3);
    ctx.stroke();
    // Olivgrünes Glas mit Innenschein
    const g = ctx.createRadialGradient(
      (gx - 0.25) * ps,
      cy - ps * 0.25,
      ps * 0.15,
      gx * ps,
      cy,
      ps * (r - 0.5)
    );
    g.addColorStop(0, 'rgba(170,190,110,0.85)');
    g.addColorStop(1, 'rgba(85,107,47,0.75)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (r - 0.5), 0, Math.PI * 2);
    ctx.fill();
    // Glanzsichel
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = ps * 0.18;
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (r - 0.75), -Math.PI * 0.8, -Math.PI * 0.4);
    ctx.stroke();
    // Kleine Nieten rund um die Fassung
    ctx.fillStyle = lighten('#B8860B', 65);
    for (let i = 0; i < 4; i++) {
      const ang = Math.PI / 4 + (i * Math.PI) / 2;
      const nx = (gx + Math.cos(ang) * r) * ps;
      ctx.beginPath();
      ctx.arc(nx, cy + Math.sin(ang) * r * ps, ps * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Verbindungsschraube am Steg
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.1) * ps + off, ps * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

export function drawButterflyMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  const lx = cx + a.eyeLeftX + a.eyeWidth / 2;
  const rx = cx + a.eyeRightX + a.eyeWidth / 2;
  // Flügel als weiche, gedrehte Ellipsen
  for (const side of [-1, 1]) {
    const wx = cx + side * hw * 0.55;
    ctx.fillStyle = '#F06292';
    ctx.beginPath();
    ctx.ellipse(wx * ps, (ey - 0.15) * ps + off, ps * 2.1, ps * 1.35, side * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EC407A';
    ctx.beginPath();
    ctx.ellipse(
      (wx + side * 0.4) * ps,
      (ey + 1.15) * ps + off,
      ps * 1.25,
      ps * 0.85,
      side * 0.7,
      0,
      Math.PI * 2
    );
    ctx.fill();
    // Helle Innenzeichnung + Goldpunkt
    ctx.fillStyle = 'rgba(248,187,208,0.75)';
    ctx.beginPath();
    ctx.ellipse(wx * ps, (ey - 0.15) * ps + off, ps * 1.3, ps * 0.8, side * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc((cx + side * (hw - 0.7)) * ps, (ey - 0.4) * ps + off, ps * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
  // Augenöffnungen
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(lx * ps, (ey + 0.2) * ps + off, ps * 0.75, ps * 0.42, -0.1, 0, Math.PI * 2);
  ctx.ellipse(rx * ps, (ey + 0.2) * ps + off, ps * 0.75, ps * 0.42, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Körper und geschwungene Fühler
  ctx.fillStyle = '#4E342E';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 0.2) * ps + off, ps * 0.28, ps * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.moveTo((cx - 0.15) * ps, (ey - 0.9) * ps + off);
  ctx.quadraticCurveTo(
    (cx - 0.9) * ps,
    (ey - 1.9) * ps + off,
    (cx - 1.2) * ps,
    (ey - 2.3) * ps + off
  );
  ctx.moveTo((cx + 0.15) * ps, (ey - 0.9) * ps + off);
  ctx.quadraticCurveTo(
    (cx + 0.9) * ps,
    (ey - 1.9) * ps + off,
    (cx + 1.2) * ps,
    (ey - 2.3) * ps + off
  );
  ctx.stroke();
  ctx.fillStyle = '#FF69B4';
  ctx.beginPath();
  ctx.arc((cx - 1.2) * ps, (ey - 2.3) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.arc((cx + 1.2) * ps, (ey - 2.3) * ps + off, ps * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGhostMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  const lx = cx + a.eyeLeftX + a.eyeWidth / 2;
  const rx = cx + a.eyeRightX + a.eyeWidth / 2;
  // Geisterkörper mit rundem Kopf und Wellensaum
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.moveTo((cx - hw) * ps, (ey + 1.9) * ps + off);
  ctx.lineTo((cx - hw) * ps, (ey - 0.2) * ps + off);
  ctx.arc(cx * ps, (ey - 0.2) * ps + off, hw * ps, Math.PI, 0);
  ctx.lineTo((cx + hw) * ps, (ey + 1.9) * ps + off);
  // Drei weiche Wellen am unteren Saum
  ctx.quadraticCurveTo(
    (cx + hw * 0.66) * ps,
    (ey + 2.9) * ps + off,
    (cx + hw * 0.33) * ps,
    (ey + 1.9) * ps + off
  );
  ctx.quadraticCurveTo(
    cx * ps,
    (ey + 2.9) * ps + off,
    (cx - hw * 0.33) * ps,
    (ey + 1.9) * ps + off
  );
  ctx.quadraticCurveTo(
    (cx - hw * 0.66) * ps,
    (ey + 2.9) * ps + off,
    (cx - hw) * ps,
    (ey + 1.9) * ps + off
  );
  ctx.closePath();
  ctx.fill();
  // Zarter Rand
  ctx.strokeStyle = 'rgba(120,144,156,0.35)';
  ctx.lineWidth = ps * 0.14;
  ctx.stroke();
  // Ovale Kulleraugen mit Glanz
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(lx * ps, (ey + 0.1) * ps + off, ps * 0.55, ps * 0.75, 0, 0, Math.PI * 2);
  ctx.ellipse(rx * ps, (ey + 0.1) * ps + off, ps * 0.55, ps * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc((lx - 0.18) * ps, (ey - 0.15) * ps + off, ps * 0.16, 0, Math.PI * 2);
  ctx.arc((rx - 0.18) * ps, (ey - 0.15) * ps + off, ps * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // Staunender Mund
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 1.25) * ps + off, ps * 0.42, ps * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPrismVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Silbernes Visier mit runden Ecken
  ctx.fillStyle = '#ECEFF1';
  rr(ctx, (cx - hw - 0.5) * ps, (ey - 0.55) * ps + off, ps * (hw * 2 + 1), ps * 1.6, ps * 0.75);
  ctx.fill();
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = ps * 0.14;
  rr(ctx, (cx - hw - 0.5) * ps, (ey - 0.55) * ps + off, ps * (hw * 2 + 1), ps * 1.6, ps * 0.75);
  ctx.stroke();
  // Weiche Regenbogen-Bänder, ins Glas geclippt
  const prismColors = [
    'rgba(255,80,80,0.4)',
    'rgba(255,160,60,0.4)',
    'rgba(255,235,80,0.4)',
    'rgba(80,220,120,0.4)',
    'rgba(70,150,255,0.4)',
    'rgba(170,90,255,0.4)',
  ];
  ctx.save();
  rr(ctx, (cx - hw) * ps, (ey - 0.25) * ps + off, ps * hw * 2, ps * 1.1, ps * 0.5);
  ctx.clip();
  const sw = (hw * 2) / prismColors.length;
  for (let i = 0; i < prismColors.length; i++) {
    ctx.fillStyle = prismColors[i];
    ctx.fillRect((cx - hw + i * sw) * ps, (ey - 0.25) * ps + off, ps * (sw + 0.15), ps * 1.1);
  }
  ctx.restore();
  // Glanzstrich
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo((cx - hw + 0.6) * ps, (ey + 0.55) * ps + off);
  ctx.lineTo((cx - hw + 1.8) * ps, (ey - 0.25) * ps + off);
  ctx.stroke();
  // Runde Seitenkappen
  ctx.fillStyle = '#B0BEC5';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc((cx + side * (hw + 0.8)) * ps, (ey + 0.25) * ps + off, ps * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCrystalMonocle(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  const mx = rx + ew / 2;
  const my = ey + 0.3;
  const r = ew / 2 + 0.8;
  // Violett schimmerndes Kristallglas
  const g = ctx.createRadialGradient(
    (mx - 0.3) * ps,
    (my - 0.3) * ps + off,
    ps * 0.15,
    mx * ps,
    my * ps + off,
    ps * r
  );
  g.addColorStop(0, 'rgba(224,64,251,0.35)');
  g.addColorStop(1, 'rgba(156,39,176,0.2)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(mx * ps, my * ps + off, ps * (r - 0.2), 0, Math.PI * 2);
  ctx.fill();
  // Kristallfassung mit hellem Lichtbogen
  ctx.strokeStyle = '#9C27B0';
  ctx.lineWidth = ps * 0.5;
  ctx.beginPath();
  ctx.arc(mx * ps, my * ps + off, ps * r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#E1BEE7';
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.arc(mx * ps, my * ps + off, ps * (r - 0.15), -Math.PI * 0.85, -Math.PI * 0.3);
  ctx.stroke();
  // Prismatische Reflexe
  ctx.fillStyle = 'rgba(255,105,180,0.5)';
  ctx.beginPath();
  ctx.arc((mx - 0.45) * ps, (my - 0.35) * ps + off, ps * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,255,255,0.4)';
  ctx.beginPath();
  ctx.arc((mx + 0.4) * ps, (my + 0.4) * ps + off, ps * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Kette mit Kristall-Raute am Ende
  ctx.strokeStyle = '#9C27B0';
  ctx.lineWidth = ps * 0.2;
  ctx.beginPath();
  ctx.moveTo(mx * ps, (my + r) * ps + off);
  ctx.quadraticCurveTo(
    (mx - 1.3) * ps,
    (ey + 2.9) * ps + off,
    (mx - 1) * ps,
    (ey + 3.9) * ps + off
  );
  ctx.stroke();
  ctx.fillStyle = '#E040FB';
  ctx.beginPath();
  ctx.moveTo((mx - 1) * ps, (ey + 3.7) * ps + off);
  ctx.lineTo((mx - 0.65) * ps, (ey + 4.15) * ps + off);
  ctx.lineTo((mx - 1) * ps, (ey + 4.6) * ps + off);
  ctx.lineTo((mx - 1.35) * ps, (ey + 4.15) * ps + off);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc((mx - 1.08) * ps, (ey + 4) * ps + off, ps * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTimeTravelerGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  const cy = (ey + 0.3) * ps + off;
  const r = ew / 2 + 1;
  for (const gx of [lx + ew / 2, rx + ew / 2]) {
    // Messingfassung mit Lichtkante
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lighten('#B8860B', 50);
    ctx.lineWidth = ps * 0.16;
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (r - 0.15), -Math.PI * 0.85, -Math.PI * 0.3);
    ctx.stroke();
    // Zifferblatt mit Stundenpunkten
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (r - 0.45), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8D6E63';
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(
        (gx + Math.cos(ang) * (r - 0.75)) * ps,
        cy + Math.sin(ang) * (r - 0.75) * ps,
        ps * 0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  // Zeiger auf beiden Zifferblättern
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = ps * 0.16;
  ctx.beginPath();
  ctx.moveTo((lx + ew / 2) * ps, cy);
  ctx.lineTo((lx + ew / 2 - 0.35) * ps, cy - ps * 0.55);
  ctx.moveTo((lx + ew / 2) * ps, cy);
  ctx.lineTo((lx + ew / 2 + 0.5) * ps, cy + ps * 0.15);
  ctx.moveTo((rx + ew / 2) * ps, cy);
  ctx.lineTo((rx + ew / 2) * ps, cy - ps * 0.6);
  ctx.moveTo((rx + ew / 2) * ps, cy);
  ctx.lineTo((rx + ew / 2 + 0.45) * ps, cy + ps * 0.3);
  ctx.stroke();
  // Kleines Zahnrad auf dem Steg
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey - 0.5) * ps + off, ps * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = ps * 0.18;
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo((cx + Math.cos(ang) * 0.42) * ps, (ey - 0.5) * ps + off + Math.sin(ang) * 0.42 * ps);
    ctx.lineTo((cx + Math.cos(ang) * 0.68) * ps, (ey - 0.5) * ps + off + Math.sin(ang) * 0.68 * ps);
    ctx.stroke();
  }
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey - 0.5) * ps + off, ps * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAbyssVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Dunkles Visier mit runder Kontur
  ctx.fillStyle = '#0a0a0a';
  rr(ctx, (cx - hw - 0.5) * ps, (ey - 0.85) * ps + off, ps * (hw * 2 + 1), ps * 2.1, ps * 0.9);
  ctx.fill();
  // Tiefviolettes Sichtfenster mit Verlauf
  const g = ctx.createLinearGradient(cx * ps, (ey - 0.35) * ps + off, cx * ps, (ey + 1) * ps + off);
  g.addColorStop(0, '#2a0a4a');
  g.addColorStop(1, '#12002b');
  ctx.fillStyle = g;
  rr(ctx, (cx - hw) * ps, (ey - 0.35) * ps + off, ps * hw * 2, ps * 1.3, ps * 0.55);
  ctx.fill();
  // Nebelschwaden im Glas
  ctx.fillStyle = 'rgba(156,39,176,0.4)';
  ctx.beginPath();
  ctx.ellipse(
    (cx - hw + 1.3) * ps,
    (ey + 0.25) * ps + off,
    ps * 0.9,
    ps * 0.3,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1) * ps, (ey + 0.05) * ps + off, ps * 0.7, ps * 0.24, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Funkelnde Sterne
  ctx.fillStyle = '#FFFFFF';
  for (const [sx, sy, sr] of [
    [cx - 0.1, ey + 0.2, 0.13],
    [cx + 1.1, ey + 0.45, 0.09],
    [cx - hw + 0.9, ey - 0.05, 0.08],
  ]) {
    ctx.beginPath();
    ctx.arc(sx * ps, sy * ps + off, ps * sr, 0, Math.PI * 2);
    ctx.fill();
  }
  // Runde Seitenpods mit Glühen
  for (const side of [-1, 1]) {
    const sx = cx + side * (hw + 0.7);
    ctx.fillStyle = '#6A0DAD';
    ctx.beginPath();
    ctx.arc(sx * ps, (ey + 0.3) * ps + off, ps * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(224,64,251,0.75)';
    ctx.beginPath();
    ctx.arc(sx * ps, (ey + 0.3) * ps + off, ps * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawEclipseGoggles(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  const cy = (ey + 0.3) * ps + off;
  // Dunkle runde Tuben mit zarter Lichtkante
  ctx.fillStyle = '#1a1a1a';
  for (const gx of [lx + ew / 2, rx + ew / 2]) {
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (ew / 2 + 1.05), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = ps * 0.14;
  for (const gx of [lx + ew / 2, rx + ew / 2]) {
    ctx.beginPath();
    ctx.arc(gx * ps, cy, ps * (ew / 2 + 0.9), -Math.PI * 0.85, -Math.PI * 0.3);
    ctx.stroke();
  }
  // Linke Korona: goldene Sonnenfinsternis
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = ps * 2.5;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc((lx + ew / 2) * ps, cy, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc((lx + ew / 2 + 0.2) * ps, cy, ps * (ew / 2 + 0.1), 0, Math.PI * 2);
  ctx.fill();
  // Rechte Korona: orange, gespiegelt
  ctx.shadowColor = '#FF8C00';
  ctx.shadowBlur = ps * 2.5;
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.arc((rx + ew / 2) * ps, cy, ps * (ew / 2 + 0.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc((rx + ew / 2 - 0.2) * ps, cy, ps * (ew / 2 + 0.1), 0, Math.PI * 2);
  ctx.fill();
  // Kleine Lichtreflexe
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc((lx + ew / 2 - 0.5) * ps, cy - ps * 0.55, ps * 0.14, 0, Math.PI * 2);
  ctx.arc((rx + ew / 2 + 0.5) * ps, cy - ps * 0.55, ps * 0.14, 0, Math.PI * 2);
  ctx.fill();
  // Abgerundeter Steg
  ctx.fillStyle = '#333333';
  rr(ctx, (lx + ew - 0.1) * ps, ey * ps + off, ps * (rx - lx - ew + 0.2), ps * 0.5, ps * 0.25);
  ctx.fill();
}

export function drawVoidMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  const lx = cx + a.eyeLeftX + a.eyeWidth / 2;
  const rx = cx + a.eyeRightX + a.eyeWidth / 2;
  // Violette Aura um die Maske
  ctx.fillStyle = 'rgba(106,13,173,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 0.8) * ps + off, ps * (hw + 0.9), ps * 3.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dunkle Maske mit runder Silhouette
  ctx.fillStyle = '#0d0d12';
  rr(ctx, (cx - hw) * ps, (ey - 1.5) * ps + off, ps * hw * 2, ps * 4.4, ps * 1.3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(156,39,176,0.35)';
  ctx.lineWidth = ps * 0.16;
  rr(ctx, (cx - hw) * ps, (ey - 1.5) * ps + off, ps * hw * 2, ps * 4.4, ps * 1.3);
  ctx.stroke();
  // Leuchtende Augen mit Glüh-Halo und weißem Kern
  for (const gx of [lx, rx]) {
    ctx.fillStyle = 'rgba(106,13,173,0.55)';
    ctx.beginPath();
    ctx.ellipse(gx * ps, (ey + 0.05) * ps + off, ps * 1, ps * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B388FF';
    ctx.beginPath();
    ctx.ellipse(gx * ps, (ey + 0.05) * ps + off, ps * 0.6, ps * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc((gx - 0.15) * ps, (ey - 0.05) * ps + off, ps * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
  // Stiller Mundschlitz
  ctx.strokeStyle = 'rgba(179,136,255,0.5)';
  ctx.lineWidth = ps * 0.18;
  ctx.beginPath();
  ctx.moveTo((cx - 0.6) * ps, (ey + 1.5) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ey + 1.75) * ps + off, (cx + 0.6) * ps, (ey + 1.5) * ps + off);
  ctx.stroke();
}

export function drawMirrorShades(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Verspiegelte Gläser mit Himmel-Verlauf
  for (const x of [lx, rx]) {
    const g = ctx.createLinearGradient(
      (x - 0.5) * ps,
      (ey - 0.6) * ps + off,
      (x + ew + 0.5) * ps,
      (ey + 1.6) * ps + off
    );
    g.addColorStop(0, '#E3F2FD');
    g.addColorStop(0.5, '#90CAF9');
    g.addColorStop(1, '#B0BEC5');
    ctx.fillStyle = g;
    rr(ctx, (x - 0.55) * ps, (ey - 0.6) * ps + off, ps * (ew + 1.1), ps * 2.2, ps * 0.85);
    ctx.fill();
    // Silberne Fassung
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = ps * 0.2;
    rr(ctx, (x - 0.55) * ps, (ey - 0.6) * ps + off, ps * (ew + 1.1), ps * 2.2, ps * 0.85);
    ctx.stroke();
    // Horizontlinie der Spiegelung
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = ps * 0.16;
    ctx.beginPath();
    ctx.moveTo((x - 0.35) * ps, (ey + 0.5) * ps + off);
    ctx.lineTo((x + ew + 0.35) * ps, (ey + 0.5) * ps + off);
    ctx.stroke();
    // Schräger Glanzstreifen
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = ps * 0.28;
    ctx.beginPath();
    ctx.moveTo((x - 0.05) * ps, (ey + 1.2) * ps + off);
    ctx.lineTo((x + 0.9) * ps, (ey - 0.25) * ps + off);
    ctx.stroke();
  }
  // Steg und Bügel
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.moveTo((lx + ew + 0.4) * ps, (ey + 0.05) * ps + off);
  ctx.quadraticCurveTo(cx * ps, (ey - 0.35) * ps + off, (rx - 0.4) * ps, (ey + 0.05) * ps + off);
  ctx.moveTo((lx - 0.55) * ps, (ey + 0.25) * ps + off);
  ctx.lineTo((cx - a.headHalfWidth - 0.3) * ps, (ey + 0.05) * ps + off);
  ctx.moveTo((rx + ew + 0.55) * ps, (ey + 0.25) * ps + off);
  ctx.lineTo((cx + a.headHalfWidth + 0.3) * ps, (ey + 0.05) * ps + off);
  ctx.stroke();
}

// ─── Erweiterung Juli 2026: neue Gesichts-Accessoires ──────────────────────

export function drawEyepatch(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const ew = a.eyeWidth;
  // Klappe über dem linken Auge
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.ellipse(
    (lx + ew / 2) * ps,
    (ey + 0.3) * ps + off,
    ps * (ew / 2 + 0.6),
    ps * (ew / 2 + 0.4),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Band schräg über den Kopf
  ctx.strokeStyle = '#212121';
  ctx.lineWidth = ps * 0.35;
  ctx.beginPath();
  ctx.moveTo((lx - a.headHalfWidth * 0.6) * ps, (ey - 1.6) * ps + off);
  ctx.lineTo((lx + ew + a.headHalfWidth) * ps, (ey - 0.4) * ps + off);
  ctx.stroke();
  // Glanzpunkt
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc((lx + ew / 2 - 0.4) * ps, (ey - 0.1) * ps + off, ps * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBlushStickers(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const spread = Math.abs(a.eyeLeftX) + a.eyeWidth + 1.2;
  // Rosa Herz-Sticker auf den Wangen
  ctx.fillStyle = '#FF8A80';
  for (let side = -1; side <= 1; side += 2) {
    const bx = cx + side * spread;
    const by = ey + 1.6;
    ctx.beginPath();
    ctx.arc((bx - 0.35) * ps, (by - 0.2) * ps + off, ps * 0.42, 0, Math.PI * 2);
    ctx.arc((bx + 0.35) * ps, (by - 0.2) * ps + off, ps * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo((bx - 0.75) * ps, by * ps + off);
    ctx.lineTo((bx + 0.75) * ps, by * ps + off);
    ctx.lineTo(bx * ps, (by + 0.9) * ps + off);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawMustache(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  // Gezwirbelter Schnurrbart unter der Nase
  ctx.fillStyle = '#4E342E';
  ctx.beginPath();
  ctx.ellipse((cx - 1.3) * ps, (ey + 2) * ps + off, ps * 1.3, ps * 0.5, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse((cx + 1.3) * ps, (ey + 2) * ps + off, ps * 1.3, ps * 0.5, 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Gezwirbelte Enden
  ctx.beginPath();
  ctx.arc((cx - 2.6) * ps, (ey + 1.6) * ps + off, ps * 0.45, 0, Math.PI * 2);
  ctx.arc((cx + 2.6) * ps, (ey + 1.6) * ps + off, ps * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDiscoShades(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Facettierte Spiegel-Gläser (Disco-Kugel-Optik)
  const lens = (x: number) => {
    const g = ctx.createLinearGradient(x * ps, (ey - 1) * ps, (x + ew) * ps, (ey + 1) * ps);
    g.addColorStop(0, '#E1BEE7');
    g.addColorStop(0.5, '#B39DDB');
    g.addColorStop(1, '#90CAF9');
    ctx.fillStyle = g;
    ctx.fillRect(x * ps, (ey - 0.6) * ps + off, ps * ew, ps * 1.6);
    // Facetten-Raster
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = ps * 0.12;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((x + (ew * i) / 3) * ps, (ey - 0.6) * ps + off);
      ctx.lineTo((x + (ew * i) / 3) * ps, (ey + 1) * ps + off);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x * ps, (ey + 0.2) * ps + off);
    ctx.lineTo((x + ew) * ps, (ey + 0.2) * ps + off);
    ctx.stroke();
  };
  lens(lx);
  lens(rx);
  // Steg + Bügel
  ctx.fillStyle = '#7E57C2';
  ctx.fillRect((lx + ew) * ps, (ey - 0.1) * ps + off, ps * (rx - lx - ew), ps * 0.4);
  ctx.fillRect((lx - 1.1) * ps, (ey - 0.1) * ps + off, ps * 1.1, ps * 0.35);
  ctx.fillRect((rx + ew) * ps, (ey - 0.1) * ps + off, ps * 1.1, ps * 0.35);
}

export function drawSnorkelMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Ein großes Sichtfenster über beiden Augen
  ctx.fillStyle = '#00838F';
  ctx.beginPath();
  ctx.ellipse(
    cx * ps,
    (ey + 0.2) * ps + off,
    ps * (rx - lx + ew) * 0.72,
    ps * 1.6,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.fillStyle = 'rgba(178, 235, 242, 0.55)';
  ctx.beginPath();
  ctx.ellipse(
    cx * ps,
    (ey + 0.2) * ps + off,
    ps * (rx - lx + ew) * 0.6,
    ps * 1.25,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse((cx - 1.4) * ps, (ey - 0.5) * ps + off, ps * 0.8, ps * 0.35, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Schnorchel rechts
  ctx.fillStyle = '#FF7043';
  ctx.fillRect((rx + ew + 0.9) * ps, (ey - 2.6) * ps + off, ps * 0.55, ps * 3.2);
  ctx.beginPath();
  ctx.arc((rx + ew + 1.17) * ps, (ey - 2.7) * ps + off, ps * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGoldenEyelashes(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Geschwungene Gold-Wimpern über beiden Augen
  ctx.strokeStyle = '#FFC107';
  ctx.lineWidth = ps * 0.28;
  for (const x of [lx, rx]) {
    for (let i = 0; i < 3; i++) {
      const bx = x + (ew * (i + 0.5)) / 3;
      ctx.beginPath();
      ctx.moveTo(bx * ps, (ey - 0.7) * ps + off);
      ctx.quadraticCurveTo(
        (bx + 0.25) * ps,
        (ey - 1.5) * ps + off,
        (bx + 0.65) * ps,
        (ey - 1.7) * ps + off
      );
      ctx.stroke();
    }
  }
  // Funkeln
  ctx.fillStyle = '#FFF8E1';
  ctx.fillRect((lx + ew + 0.1) * ps, (ey - 1.9) * ps + off, ps * 0.3, ps * 0.3);
}

export function drawVrHeadset(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Klobiges VR-Visier über beiden Augen
  ctx.fillStyle = '#263238';
  const w = hw * 1.7;
  ctx.beginPath();
  const x0 = (cx - w / 2) * ps;
  const y0 = (ey - 1.2) * ps + off;
  if (ctx.roundRect) {
    ctx.roundRect(x0, y0, ps * w, ps * 2.6, ps * 0.7);
  } else {
    ctx.rect(x0, y0, ps * w, ps * 2.6);
  }
  ctx.fill();
  // Front-Blende mit Neon-Streifen
  ctx.fillStyle = '#37474F';
  ctx.fillRect((cx - w / 2 + 0.4) * ps, (ey - 0.8) * ps + off, ps * (w - 0.8), ps * 1.8);
  ctx.fillStyle = '#00E5FF';
  ctx.fillRect((cx - w / 2 + 0.4) * ps, (ey - 0.05) * ps + off, ps * (w - 0.8), ps * 0.28);
  // Kopfband
  ctx.strokeStyle = '#455A64';
  ctx.lineWidth = ps * 0.4;
  ctx.beginPath();
  ctx.moveTo((cx - w / 2) * ps, ey * ps + off);
  ctx.lineTo((cx - hw - 0.6) * ps, (ey - 0.6) * ps + off);
  ctx.moveTo((cx + w / 2) * ps, ey * ps + off);
  ctx.lineTo((cx + hw + 0.6) * ps, (ey - 0.6) * ps + off);
  ctx.stroke();
}

export function drawKitsuneMask(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const hw = a.headHalfWidth;
  // Weiße Halbmaske (auf die Stirn geschoben, Seite)
  const mx = cx + hw * 0.75;
  const my = ey - hw * 0.9;
  ctx.fillStyle = '#FAFAFA';
  ctx.beginPath();
  ctx.ellipse(mx * ps, my * ps + off, ps * 1.7, ps * 2, 0.35, 0, Math.PI * 2);
  ctx.fill();
  // Öhrchen der Maske
  ctx.beginPath();
  ctx.moveTo((mx - 1.2) * ps, (my - 1.2) * ps + off);
  ctx.lineTo((mx - 0.2) * ps, (my - 2.6) * ps + off);
  ctx.lineTo((mx + 0.5) * ps, (my - 1.4) * ps + off);
  ctx.closePath();
  ctx.fill();
  // Rote Zeichnung
  ctx.strokeStyle = '#D32F2F';
  ctx.lineWidth = ps * 0.25;
  ctx.beginPath();
  ctx.moveTo((mx - 0.9) * ps, (my - 0.5) * ps + off);
  ctx.lineTo((mx - 0.3) * ps, (my - 0.1) * ps + off);
  ctx.moveTo((mx + 0.9) * ps, (my - 0.6) * ps + off);
  ctx.lineTo((mx + 0.3) * ps, (my - 0.2) * ps + off);
  ctx.stroke();
  // Augen-Schlitze
  ctx.fillStyle = '#D32F2F';
  ctx.beginPath();
  ctx.ellipse((mx - 0.5) * ps, (my + 0.3) * ps + off, ps * 0.4, ps * 0.18, 0.4, 0, Math.PI * 2);
  ctx.ellipse((mx + 0.6) * ps, (my + 0.2) * ps + off, ps * 0.4, ps * 0.18, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawThirdEye(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  // Mystisches drittes Auge auf der Stirn
  const ty = ey - 2.2;
  ctx.fillStyle = '#4A148C';
  ctx.beginPath();
  ctx.ellipse(cx * ps, ty * ps + off, ps * 1.15, ps * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#CE93D8';
  ctx.beginPath();
  ctx.ellipse(cx * ps, ty * ps + off, ps * 0.85, ps * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4A148C';
  ctx.beginPath();
  ctx.arc(cx * ps, ty * ps + off, ps * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc((cx - 0.15) * ps, (ty - 0.15) * ps + off, ps * 0.12, 0, Math.PI * 2);
  ctx.fill();
  // Strahlen
  ctx.strokeStyle = 'rgba(206, 147, 216, 0.8)';
  ctx.lineWidth = ps * 0.2;
  for (let i = 0; i < 5; i++) {
    const ang = Math.PI + (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo((cx + Math.cos(ang) * 1.4) * ps, (ty + Math.sin(ang) * 0.9) * ps + off);
    ctx.lineTo((cx + Math.cos(ang) * 2) * ps, (ty + Math.sin(ang) * 1.5) * ps + off);
    ctx.stroke();
  }
}

export function drawMoonVisor(
  ctx: CanvasRenderingContext2D,
  ps: number,
  off: number,
  a: PetAnchors
): void {
  const cx = a.headCenterX;
  const ey = a.eyeY;
  const lx = cx + a.eyeLeftX;
  const rx = cx + a.eyeRightX;
  const ew = a.eyeWidth;
  // Durchscheinendes Mondlicht-Visier
  const w = rx - lx + ew + 1.6;
  const grad = ctx.createLinearGradient((cx - w / 2) * ps, 0, (cx + w / 2) * ps, 0);
  grad.addColorStop(0, 'rgba(179, 157, 219, 0.85)');
  grad.addColorStop(0.5, 'rgba(159, 168, 218, 0.75)');
  grad.addColorStop(1, 'rgba(129, 212, 250, 0.85)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx * ps, (ey + 0.2) * ps + off, ps * (w / 2), ps * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  // Mondsichel-Emblem mittig
  ctx.fillStyle = '#FFF9C4';
  ctx.beginPath();
  ctx.arc(cx * ps, (ey + 0.2) * ps + off, ps * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc((cx + 0.3) * ps, (ey + 0.05) * ps + off, ps * 0.48, 0, Math.PI * 2);
  ctx.fill();
  // Sternenpunkte
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect((lx + 0.3) * ps, (ey - 0.4) * ps + off, ps * 0.25, ps * 0.25);
  ctx.fillRect((rx + ew - 0.4) * ps, (ey + 0.6) * ps + off, ps * 0.22, ps * 0.22);
}
