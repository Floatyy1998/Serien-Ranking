/** Randlicht und Kontaktschatten für die Pets; das Volumen der Formen kommt aus sprites/shapes.ts. */

export interface FigureBox {
  /** Füße, Scheitel und halbe Breite im 32er-Raster. */
  feet: number;
  top: number;
  halfW: number;
}

export interface StageLight {
  /** Farbe des Randlichts hinten rechts. */
  rim: string;
  /** Stärke des Randlichts, 0 bis 1. */
  rimAlpha: number;
  /** Farbe von Schatten und Bodenschatten. */
  shade: string;
}

export const DEFAULT_LIGHT: StageLight = {
  rim: '#f4f9ff',
  rimAlpha: 0.42,
  shade: '64, 34, 120',
};

/** Platz um den Körper, damit Hüte, Ohren und Flügel nicht abgeschnitten werden. */
const SIDE = 5;
const ABOVE = 11;
const BELOW = 2;

let figureCanvas: HTMLCanvasElement | null = null;
let rimCanvas: HTMLCanvasElement | null = null;

function canvasOf(current: HTMLCanvasElement | null, w: number, h: number): HTMLCanvasElement {
  const canvas = current ?? document.createElement('canvas');
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  return canvas;
}

/**
 * Zeichnet die Figur über einen Zwischenpuffer und legt ein Randlicht auf die Kante.
 * `ctx` steht bereits im Figuren-Raster (Ursprung oben links, Einheit `ps`).
 */
export function drawLitFigure(
  ctx: CanvasRenderingContext2D,
  draw: (target: CanvasRenderingContext2D, ps: number) => void,
  ps: number,
  box: FigureBox,
  light: StageLight = DEFAULT_LIGHT,
  pixelRatio = 2
): void {
  const res = ps * pixelRatio;
  const x0 = 16 - box.halfW - SIDE;
  const y0 = box.top - ABOVE;
  const wCells = (box.halfW + SIDE) * 2;
  const hCells = box.feet + BELOW - y0;
  const w = Math.ceil(wCells * res);
  const h = Math.ceil(hCells * res);

  figureCanvas = canvasOf(figureCanvas, w, h);
  const fig = figureCanvas.getContext('2d');
  if (!fig) {
    draw(ctx, ps);
    return;
  }
  fig.setTransform(1, 0, 0, 1, 0, 0);
  fig.globalCompositeOperation = 'source-over';
  fig.globalAlpha = 1;
  fig.clearRect(0, 0, w, h);
  fig.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
  draw(fig, 1);

  // Randlicht: Silhouette minus eine versetzte Kopie ergibt die beleuchtete Kante
  rimCanvas = canvasOf(rimCanvas, w, h);
  const rim = rimCanvas.getContext('2d');
  if (rim && light.rimAlpha > 0) {
    const shift = Math.max(1, 0.32 * res);
    rim.setTransform(1, 0, 0, 1, 0, 0);
    rim.globalCompositeOperation = 'source-over';
    rim.clearRect(0, 0, w, h);
    rim.drawImage(figureCanvas, 0, 0);
    rim.globalCompositeOperation = 'destination-out';
    rim.drawImage(figureCanvas, -shift, shift * 0.7);
    rim.globalCompositeOperation = 'source-in';
    rim.fillStyle = light.rim;
    rim.fillRect(0, 0, w, h);

    fig.setTransform(1, 0, 0, 1, 0, 0);
    fig.globalCompositeOperation = 'source-atop';
    fig.globalAlpha = light.rimAlpha;
    fig.drawImage(rimCanvas, 0, 0);
    fig.globalAlpha = 1;
  }
  fig.globalCompositeOperation = 'source-over';

  ctx.drawImage(figureCanvas, x0 * ps, y0 * ps, wCells * ps, hCells * ps);
}

/** Weicher Kontaktschatten, der beim Springen kleiner und blasser wird. */
export function drawSoftShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  lift: number,
  ps: number,
  halfW: number,
  shade = DEFAULT_LIGHT.shade
): void {
  const k = Math.max(0.3, 1 - lift / 160);
  const rx = halfW * 0.85 * ps * k;
  const ry = 1.9 * ps * k;
  ctx.save();
  ctx.translate(x, groundY - ps * 0.25);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${shade}, ${0.42 * k})`);
  g.addColorStop(0.55, `rgba(${shade}, ${0.2 * k})`);
  g.addColorStop(1, `rgba(${shade}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
