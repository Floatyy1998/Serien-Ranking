/** Bild-Aufbereitung für den Chat: Fotos → WebP (max. 1600px), GIFs unverändert. */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.82;

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
  isGif: boolean;
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

async function drawToBlob(file: File, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  if (typeof createImageBitmap === 'function') {
    const bmp = await createImageBitmap(file);
    ctx.drawImage(bmp, 0, 0, width, height);
    bmp.close();
  } else {
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
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
  );
  if (!blob) throw new Error('encode failed');
  return blob;
}

export async function prepareChatImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new Error('not-an-image');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('too-large');

  const { width, height } = await loadDimensions(file);

  // GIFs unverändert lassen — Re-Encoding würde die Animation zerstören
  if (file.type === 'image/gif') {
    return { blob: file, width, height, isGif: true };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const blob = await drawToBlob(file, w, h);
  return { blob, width: w, height: h, isGif: false };
}
