// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_BYTES, prepareChatImage } from './imageCompress';

/**
 * jsdom hat weder Canvas noch createImageBitmap — beides wird ersetzt, damit
 * die Entscheidungen (unverändert lassen / verkleinern / härter verdichten)
 * prüfbar sind. Die Bildmaße kommen aus dem gefälschten Bitmap.
 */
let natural = { width: 1000, height: 800 };
/** Größe des jeweils codierten Blobs, in der Reihenfolge der Qualitätsstufen. */
let encodedSizes: number[] = [];
let encodeCalls: number[] = [];

const makeFile = (size: number, type = 'image/png'): File => {
  const file = new File(['x'], 'probe', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

beforeEach(() => {
  natural = { width: 1000, height: 800 };
  encodedSizes = [];
  encodeCalls = [];

  vi.stubGlobal('createImageBitmap', async () => ({
    width: natural.width,
    height: natural.height,
    close: () => undefined,
  }));

  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag !== 'canvas') throw new Error('unerwartetes Element: ' + tag);
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: () => undefined,
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
      }),
      toBlob: (cb: (b: Blob | null) => void, _type: string, quality: number) => {
        encodeCalls.push(quality);
        const size = encodedSizes[encodeCalls.length - 1] ?? 100 * 1024;
        const blob = new Blob(['y']);
        Object.defineProperty(blob, 'size', { value: size });
        cb(blob);
      },
    };
    return canvas as unknown as HTMLElement;
  }) as typeof document.createElement);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('prepareChatImage', () => {
  it('weist Nicht-Bilder und zu große Dateien ab', async () => {
    await expect(prepareChatImage(makeFile(1000, 'application/pdf'))).rejects.toThrow(
      'not-an-image'
    );
    await expect(prepareChatImage(makeFile(MAX_IMAGE_BYTES + 1))).rejects.toThrow('too-large');
  });

  it('lässt GIFs unangetastet, damit die Animation bleibt', async () => {
    const file = makeFile(500 * 1024, 'image/gif');
    const result = await prepareChatImage(file);

    expect(result.blob).toBe(file);
    expect(result.isGif).toBe(true);
    expect(result.contentType).toBe('image/gif');
    expect(encodeCalls).toEqual([]);
  });

  it('sendet kleine Bilder unverändert — kein Neucodieren, keine Matschschrift', async () => {
    const file = makeFile(400 * 1024);
    const result = await prepareChatImage(file);

    expect(result.blob).toBe(file);
    expect(result.contentType).toBe('image/png');
    expect(result).toMatchObject({ width: 1000, height: 800 });
    expect(encodeCalls).toEqual([]);
  });

  it('verkleinert große Bilder auf die lange Kante und codiert als WebP', async () => {
    natural = { width: 4000, height: 3000 };
    encodedSizes = [300 * 1024];

    const result = await prepareChatImage(makeFile(5 * 1024 * 1024, 'image/jpeg'));

    expect(result).toMatchObject({ width: 2560, height: 1920, contentType: 'image/webp' });
    expect(encodeCalls).toEqual([0.94]); // erste Stufe reicht
  });

  it('geht nur so weit runter, bis das Bild ins Budget passt', async () => {
    natural = { width: 4000, height: 3000 };
    encodedSizes = [4 * 1024 * 1024, 900 * 1024];

    await prepareChatImage(makeFile(6 * 1024 * 1024, 'image/jpeg'));

    expect(encodeCalls).toEqual([0.94, 0.88]);
  });

  it('behält das Original, wenn das Neucodieren es nicht kleiner macht', async () => {
    // Nicht zu verkleinern, aber über der Behalten-Grenze: es wird codiert —
    // und wenn dabei nichts gewonnen ist, wäre der Qualitätsverlust umsonst.
    const file = makeFile(1000 * 1024);
    encodedSizes = [1200 * 1024, 1100 * 1024, 1050 * 1024];

    const result = await prepareChatImage(file);

    expect(result.blob).toBe(file);
    expect(result.contentType).toBe('image/png');
  });
});
