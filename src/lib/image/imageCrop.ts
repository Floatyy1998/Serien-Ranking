/**
 * Geometrie fürs Zuschneiden eines quadratischen Ausschnitts. Reine Rechnung
 * ohne DOM und ohne Canvas — die Oberfläche liegt in
 * `components/ui/ImageCropSheet.tsx`.
 *
 * Modell: ein quadratisches Sichtfenster der Seitenlänge `viewport`. Das Bild
 * liegt darunter, mittig, und deckt es bei Zoom 1 gerade vollständig ab
 * („cover"). `offset` verschiebt die Bildmitte gegen die Fenstermitte.
 */

export interface CropTransform {
  /** 1 = Bild füllt das Fenster gerade eben. */
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface CropSourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export const clampZoom = (zoom: number): number =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number.isFinite(zoom) ? zoom : MIN_ZOOM));

/**
 * Maßstab, bei dem das Bild das Fenster gerade abdeckt. Die längere Seite ragt
 * dann über den Rand hinaus — genau das lässt sich verschieben.
 */
export const coverScale = (imageWidth: number, imageHeight: number, viewport: number): number => {
  if (imageWidth <= 0 || imageHeight <= 0 || viewport <= 0) return 1;
  return Math.max(viewport / imageWidth, viewport / imageHeight);
};

/** Wie weit darf man schieben, ohne dass eine leere Ecke ins Fenster rutscht? */
export const maxOffset = (
  imageWidth: number,
  imageHeight: number,
  viewport: number,
  zoom: number
): { x: number; y: number } => {
  const scale = coverScale(imageWidth, imageHeight, viewport) * clampZoom(zoom);
  return {
    x: Math.max(0, (imageWidth * scale - viewport) / 2),
    y: Math.max(0, (imageHeight * scale - viewport) / 2),
  };
};

/** Hält den Ausschnitt innerhalb des Bildes — nie ein leerer Rand. */
export const clampTransform = (
  transform: CropTransform,
  imageWidth: number,
  imageHeight: number,
  viewport: number
): CropTransform => {
  const zoom = clampZoom(transform.zoom);
  const limit = maxOffset(imageWidth, imageHeight, viewport, zoom);
  const clamp = (value: number, max: number): number => {
    const bounded = Math.min(max, Math.max(-max, Number.isFinite(value) ? value : 0));
    return bounded === 0 ? 0 : bounded; // kein -0 in Styles und Vergleichen
  };
  return {
    zoom,
    offsetX: clamp(transform.offsetX, limit.x),
    offsetY: clamp(transform.offsetY, limit.y),
  };
};

/**
 * Der sichtbare Ausschnitt in Pixeln des Originalbildes — genau das, was
 * `drawImage` als Quelle bekommt.
 */
export const cropSourceRect = (
  transform: CropTransform,
  imageWidth: number,
  imageHeight: number,
  viewport: number
): CropSourceRect => {
  const safe = clampTransform(transform, imageWidth, imageHeight, viewport);
  const scale = coverScale(imageWidth, imageHeight, viewport) * safe.zoom;
  if (scale <= 0) return { sx: 0, sy: 0, sw: imageWidth, sh: imageHeight };

  const side = viewport / scale;
  const sx = (imageWidth - side) / 2 - safe.offsetX / scale;
  const sy = (imageHeight - side) / 2 - safe.offsetY / scale;

  // Rundungsreste dürfen den Ausschnitt nicht über den Bildrand schieben.
  return {
    sx: Math.min(Math.max(0, sx), Math.max(0, imageWidth - side)),
    sy: Math.min(Math.max(0, sy), Math.max(0, imageHeight - side)),
    sw: side,
    sh: side,
  };
};
