/**
 * Geometrie für ein zoombares Bild in einem Sichtfenster. Reine Rechnung ohne
 * DOM — die Oberfläche liegt in `components/ui/ZoomableImage.tsx`.
 *
 * Modell: Zoom 1 heißt „das Bild passt vollständig ins Fenster" (contain). Der
 * Versatz `x`/`y` verschiebt die Bildmitte gegen die Fenstermitte, in
 * Bildschirmpixeln. Anders als beim Zuschnitt (`imageCrop.ts`) darf hier nie
 * über den Rand hinaus geschoben werden: was kleiner als das Fenster ist,
 * bleibt mittig.
 */

export interface ZoomTransform {
  zoom: number;
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 6;
/** Zoomstufe für Doppeltipp und den Vergrößern-Knopf. */
export const ZOOM_STEP_TO = 2.5;

export const IDENTITY: ZoomTransform = { zoom: 1, x: 0, y: 0 };

export const clampZoom = (zoom: number): number =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number.isFinite(zoom) ? zoom : ZOOM_MIN));

/** Anzeigegröße bei Zoom 1: eingepasst, ohne das Bild hochzurechnen. */
export const fitSize = (natural: Size, viewport: Size): Size => {
  if (natural.width <= 0 || natural.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(viewport.width / natural.width, viewport.height / natural.height);
  return { width: natural.width * scale, height: natural.height * scale };
};

/** Wie weit darf man schieben? 0, solange die Seite ins Fenster passt. */
export const panLimits = (fit: Size, viewport: Size, zoom: number): { x: number; y: number } => ({
  x: Math.max(0, (fit.width * clampZoom(zoom) - viewport.width) / 2),
  y: Math.max(0, (fit.height * clampZoom(zoom) - viewport.height) / 2),
});

export const clampTransform = (
  transform: ZoomTransform,
  fit: Size,
  viewport: Size
): ZoomTransform => {
  const zoom = clampZoom(transform.zoom);
  const limit = panLimits(fit, viewport, zoom);
  const clamp = (value: number, max: number): number => {
    const bounded = Math.min(max, Math.max(-max, Number.isFinite(value) ? value : 0));
    return bounded === 0 ? 0 : bounded; // kein -0 in Styles und Vergleichen
  };
  return { zoom, x: clamp(transform.x, limit.x), y: clamp(transform.y, limit.y) };
};

/**
 * Zoomt so, dass der Punkt unter dem Finger (bzw. dem Mauszeiger) an Ort und
 * Stelle bleibt. `point` zählt ab der **Fenstermitte**, nicht ab der Ecke.
 *
 * Ohne diesen Anker springt das Bild beim Zoomen immer zur Mitte, und man
 * kommt an einen Bildrand nur mit anschließendem Schieben heran.
 */
export const zoomAtPoint = (
  transform: ZoomTransform,
  nextZoom: number,
  point: { x: number; y: number },
  fit: Size,
  viewport: Size
): ZoomTransform => {
  const from = clampZoom(transform.zoom);
  const to = clampZoom(nextZoom);
  const ratio = to / from;
  return clampTransform(
    {
      zoom: to,
      x: point.x - (point.x - transform.x) * ratio,
      y: point.y - (point.y - transform.y) * ratio,
    },
    fit,
    viewport
  );
};

export const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const midpoint = (
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Mausrad in einen Zoomfaktor übersetzen — feinfühlig, aber ohne Trägheit. */
export const wheelZoomFactor = (deltaY: number): number => {
  const capped = Math.max(-120, Math.min(120, Number.isFinite(deltaY) ? deltaY : 0));
  return Math.exp(-capped * 0.0025);
};
