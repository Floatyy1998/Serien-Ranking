import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Records every Image constructed so tests can assert what was preloaded.
let images: FakeImage[] = [];

class FakeImage {
  decoding = '';
  fetchPriority = '';
  src = '';
  constructor() {
    images.push(this);
  }
}

async function loadPreload() {
  return (await import('./preloadImage')).preloadImage;
}

beforeEach(() => {
  vi.resetModules(); // fresh module-level `seen` Set per test
  images = [];
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('preloadImage', () => {
  it('constructs an Image with async decoding + low priority and sets src', async () => {
    const preloadImage = await loadPreload();
    preloadImage('https://cdn/poster.jpg');
    expect(images).toHaveLength(1);
    expect(images[0].src).toBe('https://cdn/poster.jpg');
    expect(images[0].decoding).toBe('async');
    expect(images[0].fetchPriority).toBe('low');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty string', ''],
  ])('is a no-op for %s url', async (_label, url) => {
    const preloadImage = await loadPreload();
    preloadImage(url as string | undefined | null);
    expect(images).toHaveLength(0);
  });

  it('skips inline data: URLs (already inline)', async () => {
    const preloadImage = await loadPreload();
    preloadImage('data:image/png;base64,AAAA');
    expect(images).toHaveLength(0);
  });

  it('dedupes repeated calls for the same url', async () => {
    const preloadImage = await loadPreload();
    preloadImage('https://cdn/a.jpg');
    preloadImage('https://cdn/a.jpg');
    preloadImage('https://cdn/a.jpg');
    expect(images).toHaveLength(1);
  });

  it('loads distinct urls separately', async () => {
    const preloadImage = await loadPreload();
    preloadImage('https://cdn/a.jpg');
    preloadImage('https://cdn/b.jpg');
    expect(images.map((i) => i.src)).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg']);
  });

  it('swallows a throwing Image constructor (preload is best-effort)', async () => {
    vi.stubGlobal(
      'Image',
      class {
        constructor() {
          throw new Error('no Image in this env');
        }
      }
    );
    const preloadImage = await loadPreload();
    expect(() => preloadImage('https://cdn/boom.jpg')).not.toThrow();
  });
});
