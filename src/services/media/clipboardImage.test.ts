// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractClipboardImage, resolveClipboardImage } from './clipboardImage';
import { MAX_IMAGE_BYTES } from '../../lib/image/imageCompress';

const makeClipboard = (html: string, files: File[]): DataTransfer =>
  ({
    getData: (type: string) => (type === 'text/html' ? html : ''),
    files,
  }) as unknown as DataTransfer;

const makeFile = (name: string, type: string, size = 10) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('extractClipboardImage', () => {
  it('liefert nichts bei reinem Text', () => {
    expect(extractClipboardImage(makeClipboard('<p>hallo</p>', []))).toEqual({
      file: null,
      gifUrl: null,
    });
  });

  it('findet das erste Bild in den Dateien', () => {
    const img = makeFile('shot.png', 'image/png');
    const clip = makeClipboard('', [makeFile('notes.txt', 'text/plain'), img]);
    expect(extractClipboardImage(clip).file).toBe(img);
  });

  it('liest die GIF-URL aus dem mitkopierten HTML', () => {
    const clip = makeClipboard('<img src="https://media.tenor.com/abc.gif?x=1">', []);
    expect(extractClipboardImage(clip).gifUrl).toBe('https://media.tenor.com/abc.gif?x=1');
  });

  it('verträgt eine leere Zwischenablage', () => {
    expect(extractClipboardImage(null)).toEqual({ file: null, gifUrl: null });
  });
});

describe('resolveClipboardImage', () => {
  it('holt das echte GIF statt des Standbilds', async () => {
    const blob = new Blob(['g'], { type: 'image/gif' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => blob }))
    );
    const still = makeFile('image.png', 'image/png');
    const result = await resolveClipboardImage(still, 'https://x/a.gif?a=1&amp;b=2');
    expect(result?.type).toBe('image/gif');
    expect(result?.name).toBe('clipboard.gif');
    expect(fetch).toHaveBeenCalledWith('https://x/a.gif?a=1&b=2');
  });

  it('fällt bei CORS-Fehlern auf das Standbild zurück', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('cors');
      })
    );
    const still = makeFile('image.png', 'image/png');
    expect(await resolveClipboardImage(still, 'https://x/a.gif')).toBe(still);
  });

  it('nimmt ein zu großes GIF nicht', async () => {
    const blob = new Blob(['g'], { type: 'image/gif' });
    Object.defineProperty(blob, 'size', { value: MAX_IMAGE_BYTES + 1 });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => blob }))
    );
    expect(await resolveClipboardImage(null, 'https://x/a.gif')).toBeNull();
  });

  it('reicht eine Datei ohne GIF-URL durch', async () => {
    const file = makeFile('image.png', 'image/png');
    expect(await resolveClipboardImage(file, null)).toBe(file);
  });
});
