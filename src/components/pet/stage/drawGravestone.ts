/** Grabstein mit Namen an der Stelle eines verstorbenen Pets (Maße im 32er-Raster wie die Pets). */
export function drawGravestone(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  groundY: number,
  ps: number,
  time: number
): void {
  const u = ps;
  const w = 20 * u;
  const h = 25 * u;
  const left = x - w / 2;
  const right = x + w / 2;
  const base = groundY - 1.4 * u;
  const archY = base - h + w / 2;

  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, groundY - 0.3 * u, 13 * u, 2 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  const stone = new Path2D();
  stone.moveTo(left, base);
  stone.lineTo(left, archY);
  stone.arc(x, archY, w / 2, Math.PI, 0);
  stone.lineTo(right, base);
  stone.closePath();

  const fill = ctx.createLinearGradient(0, base - h, 0, base);
  fill.addColorStop(0, '#b4bcc6');
  fill.addColorStop(1, '#828b96');
  ctx.fillStyle = fill;
  ctx.fill(stone);

  // Licht links, Schatten rechts
  ctx.save();
  ctx.clip(stone);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(left, base - h, 2.2 * u, h);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fillRect(right - 3.4 * u, base - h, 3.4 * u, h);
  // Moos an der oberen Kante
  ctx.fillStyle = '#7fae6a';
  for (const [mx, my, r] of [
    [-7.2, -1.2, 1.7],
    [-5.4, -2.8, 1.3],
    [-8.4, 1.0, 1.2],
  ]) {
    ctx.beginPath();
    ctx.arc(x + mx * u, archY + my * u, r * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.lineWidth = Math.max(1, 0.7 * u);
  ctx.strokeStyle = '#5c646e';
  ctx.stroke(stone);

  // eingravierte Pfote
  const pawY = archY - 2.6 * u;
  engrave(ctx, u, () => {
    ctx.beginPath();
    ctx.ellipse(x, pawY + 1.3 * u, 1.9 * u, 1.5 * u, 0, 0, Math.PI * 2);
    for (const [tx, ty] of [
      [-2.1, -0.9],
      [-0.75, -2],
      [0.75, -2],
      [2.1, -0.9],
    ]) {
      ctx.moveTo(x + tx * u + 0.75 * u, pawY + ty * u);
      ctx.arc(x + tx * u, pawY + ty * u, 0.75 * u, 0, Math.PI * 2);
    }
    ctx.fill();
  });

  // Name, so groß wie er auf den Stein passt; lange Namen auf zwei Zeilen
  const maxWidth = 16.5 * u;
  const lines = layoutName(ctx, name.trim() || '?', maxWidth, u);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${lines.size}px Satoshi, system-ui, sans-serif`;
  const lineGap = lines.size * 1.05;
  const nameY = archY + 4.6 * u - ((lines.text.length - 1) * lineGap) / 2;
  lines.text.forEach((line, k) => {
    engrave(ctx, u, () => ctx.fillText(line, x, nameY + k * lineGap));
  });

  // Zierlinie unter einzeiligen Namen
  if (lines.text.length === 1) {
    const lineY = nameY + lines.size * 0.9;
    engrave(ctx, u, () => ctx.fillRect(x - 4 * u, lineY, 8 * u, 0.55 * u));
  }

  // Erdhügel und Blumen
  ctx.fillStyle = '#5a4434';
  ctx.beginPath();
  ctx.ellipse(x, groundY - 0.4 * u, 12.5 * u, 2.6 * u, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#6f5542';
  ctx.beginPath();
  ctx.ellipse(x, groundY - 1.1 * u, 9 * u, 1.3 * u, 0, Math.PI, 0);
  ctx.fill();

  drawFlower(ctx, x - 8.5 * u, groundY - 1 * u, u, '#ff8fb1', Math.sin(time * 1.6) * 0.12);
  drawFlower(ctx, x + 9 * u, groundY - 0.8 * u, u, '#ffd166', Math.sin(time * 1.6 + 1.3) * 0.12);

  ctx.restore();
}

function engrave(ctx: CanvasRenderingContext2D, u: number, draw: () => void): void {
  ctx.save();
  ctx.translate(0, 0.35 * u);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  draw();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(52, 58, 66, 0.88)';
  draw();
  ctx.restore();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  color: string,
  sway: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.strokeStyle = '#4f8a43';
  ctx.lineWidth = Math.max(1, 0.55 * u);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -4 * u);
  ctx.stroke();
  ctx.fillStyle = '#4f8a43';
  ctx.beginPath();
  ctx.ellipse(0.9 * u, -1.8 * u, 0.9 * u, 0.45 * u, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 0.9 * u, -4 * u + Math.sin(a) * 0.9 * u, 0.75 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(0, -4 * u, 0.55 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fits(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  maxWidth: number
): boolean {
  ctx.font = `800 ${size}px Satoshi, system-ui, sans-serif`;
  return ctx.measureText(text).width <= maxWidth;
}

function shrinkToFit(
  ctx: CanvasRenderingContext2D,
  text: string[],
  start: number,
  min: number,
  maxWidth: number,
  step: number
): number {
  let size = start;
  while (size > min && !text.every((t) => fits(ctx, t, size, maxWidth))) size -= step;
  return size;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, size: number, maxWidth: number) {
  let out = text;
  while (!fits(ctx, out, size, maxWidth) && out.length > 2) out = `${out.slice(0, -2)}…`;
  return out;
}

function layoutName(
  ctx: CanvasRenderingContext2D,
  name: string,
  maxWidth: number,
  u: number
): { text: string[]; size: number } {
  const single = shrinkToFit(ctx, [name], 4.4 * u, 2.6 * u, maxWidth, 0.2 * u);
  const words = name.split(/\s+/);
  if (fits(ctx, name, single, maxWidth) && (single >= 3.4 * u || words.length < 2)) {
    return { text: [name], size: single };
  }
  if (words.length >= 2) {
    // an der Lücke trennen, die die Zeilen am gleichmäßigsten macht
    let best: [string, string] = [words[0], words.slice(1).join(' ')];
    let bestDiff = Infinity;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(' ');
      const b = words.slice(k).join(' ');
      const diff = Math.abs(a.length - b.length);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = [a, b];
      }
    }
    const size = shrinkToFit(ctx, best, 3.8 * u, 2.2 * u, maxWidth, 0.1 * u);
    return { text: best.map((t) => ellipsize(ctx, t, size, maxWidth)), size };
  }
  return { text: [ellipsize(ctx, name, single, maxWidth)], size: single };
}
