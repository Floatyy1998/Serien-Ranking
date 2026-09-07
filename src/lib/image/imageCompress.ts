/**
 * Bild-Aufbereitung für den Chat.
 *
 * Leitgedanke: **so wenig anfassen wie möglich.** Jedes Neucodieren kostet
 * Schärfe, und seit man das Bild im Chat groß zoomen kann, sieht man das auch.
 * Ein Bild, das ohnehin klein genug ist, geht deshalb unverändert raus —
 * gerade Screenshots (PNG, feine Schrift) verlieren beim Umwandeln in
 * verlustbehaftetes WebP sichtbar. Erst wenn es zu groß ist, wird skaliert und
 * codiert, dann aber mit hochwertiger Skalierung und hoher Qualitätsstufe.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Längste Kante nach dem Verkleinern — reicht für scharfe Darstellung beim Zoomen. */
const MAX_EDGE = 2560;
/**
 * Kleinere Originale bleiben unangetastet. Die Grenze ist bewusst nicht höher:
 * das Bild in der Blase lädt jeder Gesprächspartner mit, oft über Mobilfunk.
 * Typische Screenshots liegen darunter, Handyfotos darüber.
 */
const KEEP_ORIGINAL_BYTES = 900 * 1024;
/** Ab hier wird beim Codieren eine Stufe härter verdichtet. */
const TARGET_BYTES = 1.5 * 1024 * 1024;
/** Von scharf nach sparsam — die erste Stufe unter dem Zielwert gewinnt. */
const QUALITY_STEPS = [0.94, 0.88, 0.8];

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
  isGif: boolean;
  /** MIME-Typ des tatsächlich hochgeladenen Blobs — nicht immer WebP. */
  contentType: string;
}

async function loadDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bmp = await createImageBitmap(file);
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    return dims;
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

async function drawToCanvas(file: File, width: number, height: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (typeof createImageBitmap === 'function') {
    // Der Decoder skaliert besser als ein einzelnes drawImage; wo die Optionen
    // nicht unterstützt werden, kommt das Bild in Originalgröße zurück und der
    // Zeichenschritt erledigt es.
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(file, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'high',
      });
    } catch {
      bmp = await createImageBitmap(file);
    }
    ctx.drawImage(bmp, 0, 0, width, height);
    bmp.close();
    return canvas;
  }

  await new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
  return canvas;
}

const encode = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));

async function encodeWithinBudget(canvas: HTMLCanvasElement): Promise<Blob> {
  let last: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    const blob = await encode(canvas, quality);
    if (!blob) continue;
    last = blob;
    if (blob.size <= TARGET_BYTES) return blob;
  }
  if (!last) throw new Error('encode failed');
  return last;
}

export async function prepareChatImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new Error('not-an-image');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('too-large');

  const { width, height } = await loadDimensions(file);

  // GIFs unverändert lassen — Re-Encoding würde die Animation zerstören
  if (file.type === 'image/gif') {
    return { blob: file, width, height, isGif: true, contentType: 'image/gif' };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const needsResize = scale < 1;

  // Passt schon: unverändert senden. Das ist der Unterschied zwischen einem
  // scharfen Screenshot und matschiger Schrift.
  if (!needsResize && file.size <= KEEP_ORIGINAL_BYTES) {
    return { blob: file, width, height, isGif: false, contentType: file.type };
  }

  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = await drawToCanvas(file, w, h);
  const blob = await encodeWithinBudget(canvas);

  // Ohne Verkleinerung lohnt sich das Ergebnis nur, wenn es auch kleiner ist.
  if (!needsResize && blob.size >= file.size) {
    return { blob: file, width, height, isGif: false, contentType: file.type };
  }

  return { blob, width: w, height: h, isGif: false, contentType: 'image/webp' };
}
