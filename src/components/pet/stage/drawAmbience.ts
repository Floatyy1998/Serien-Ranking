/** Stimmung für die Pet-Bühne: Lichtstrahlen, schwebende Lichtpunkte und unscharfe Kugeln im Vordergrund. */

const MOTES = 16;
const BOKEH = 3;

const frac = (n: number) => n - Math.floor(n);
const rand = (i: number, k: number) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

/** „r, g, b" aus einer rgb()/rgba()-Farbe, aufgehellt zu Licht; sonst warmes Weiß. */
export function tintOf(color: string | undefined): string {
  const m = color ? /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color) : null;
  if (!m) return '255, 244, 214';
  const light = (v: string) => Math.round(Number(v) * 0.35 + 255 * 0.65);
  return `${light(m[1])}, ${light(m[2])}, ${light(m[3])}`;
}

/** Hinter dem Pet: Strahlen und aufsteigende Lichtpunkte. */
export function drawAmbienceBack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  tint: string
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < 3; i++) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.35 + i * 2.1);
    const alpha = 0.035 + 0.035 * pulse;
    const x = width * (0.12 + i * 0.2) + Math.sin(time * 0.12 + i) * 12;
    const beam = width * (0.07 + 0.03 * i);
    const g = ctx.createLinearGradient(x, 0, x + beam, 0);
    g.addColorStop(0, `rgba(${tint}, 0)`);
    g.addColorStop(0.5, `rgba(${tint}, ${alpha})`);
    g.addColorStop(1, `rgba(${tint}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + beam, -10);
    ctx.lineTo(x + beam + height * 0.55, height);
    ctx.lineTo(x + height * 0.45, height);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < MOTES; i++) {
    const speed = 7 + rand(i, 1) * 12;
    const span = height + 24;
    const y = height + 12 - ((time * speed + rand(i, 2) * span) % span);
    const x = rand(i, 3) * width + Math.sin(time * 0.5 + i * 1.7) * 14;
    const fade = Math.min(1, y / (height * 0.35));
    const twinkle = 0.5 + 0.5 * Math.sin(time * 1.6 + i * 2.3);
    const r = 0.9 + rand(i, 4) * 1.8;
    ctx.fillStyle = `rgba(${tint}, ${(0.18 + 0.4 * twinkle) * fade})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Vor dem Pet: wenige große, unscharfe Lichtkugeln für Tiefe. */
export function drawAmbienceFront(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  tint: string
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < BOKEH; i++) {
    const x = frac(rand(i, 5) + time * (0.006 + rand(i, 6) * 0.008)) * (width + 80) - 40;
    const y = height * (0.18 + rand(i, 7) * 0.5) + Math.sin(time * 0.3 + i * 3) * 10;
    const r = 12 + rand(i, 8) * 14;
    const a = 0.05 + 0.04 * (0.5 + 0.5 * Math.sin(time * 0.5 + i));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${tint}, ${a})`);
    g.addColorStop(0.7, `rgba(${tint}, ${a * 0.6})`);
    g.addColorStop(1, `rgba(${tint}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
