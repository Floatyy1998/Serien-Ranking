/** Gemeinsame Formen der Pet-Zeichner; runde Formen bekommen ein weiches Volumen. */

let volumeOn = true;

/** Für Vergleichsansichten: Volumen an- oder abschalten. */
export function setVolume(on: boolean): void {
  volumeOn = on;
}

const shadeCache = new Map<string, string | null>();

/** Dunklere, leicht ins Violette gezogene Variante desselben Farbtons. */
function shadeOf(fill: string): string | null {
  const hit = shadeCache.get(fill);
  if (hit !== undefined) return hit;
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(fill);
  const shade = m
    ? `${Math.round(parseInt(m[1], 16) * 0.42)}, ${Math.round(parseInt(m[2], 16) * 0.36)}, ${Math.round(
        parseInt(m[3], 16) * 0.5 + 24
      )}`
    : null;
  shadeCache.set(fill, shade);
  return shade;
}

/**
 * Legt Glanz und Eigenschatten auf den zuletzt gefüllten Ellipsen-Pfad.
 * Kleine Formen (unter `minCells` Rasterzellen) bleiben flach.
 */
export function shadeEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  ps: number,
  rotation = 0,
  minCells = 1.7
): void {
  if (!volumeOn || Math.min(rx, ry) < minCells * ps) return;
  const fill = ctx.fillStyle;
  if (typeof fill !== 'string') return;
  const shade = shadeOf(fill);
  if (!shade) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(-0.34, -0.44, 0, 0, 0, 1.04);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  g.addColorStop(0.42, 'rgba(255, 255, 255, 0)');
  g.addColorStop(0.7, `rgba(${shade}, 0)`);
  g.addColorStop(1, `rgba(${shade}, 0.26)`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

/** Gefüllter Kreis im 32er-Raster. */
export const arcFill = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ps: number,
  offset: number
): void => {
  ctx.beginPath();
  ctx.arc(cx * ps, cy * ps + offset, r * ps, 0, Math.PI * 2);
  ctx.fill();
  shadeEllipse(ctx, cx * ps, cy * ps + offset, r * ps, r * ps, ps);
};

/** Gefüllte Ellipse im 32er-Raster. */
export const ellipseFill = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ps: number,
  offset: number,
  rotation: number = 0
): void => {
  ctx.beginPath();
  ctx.ellipse(cx * ps, cy * ps + offset, rx * ps, ry * ps, rotation, 0, Math.PI * 2);
  ctx.fill();
  shadeEllipse(ctx, cx * ps, cy * ps + offset, rx * ps, ry * ps, ps, rotation);
};
