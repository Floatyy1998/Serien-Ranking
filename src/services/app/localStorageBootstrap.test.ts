import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The module runs its cleanup as a side effect at import time, so each test
 * stubs `localStorage` first, then dynamically imports a fresh module copy.
 */

interface FakeLS {
  map: Map<string, string>;
  length: number;
  key(i: number): string | null;
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function makeLocalStorage(
  initial: Record<string, string>,
  removeImpl?: (k: string, map: Map<string, string>) => void
): FakeLS {
  const map = new Map(Object.entries(initial));
  return {
    map,
    get length() {
      return map.size;
    },
    key(i: number) {
      return [...map.keys()][i] ?? null;
    },
    getItem(k: string) {
      return map.has(k) ? (map.get(k) as string) : null;
    },
    setItem(k: string, v: string) {
      map.set(k, v);
    },
    removeItem: vi.fn((k: string) => {
      if (removeImpl) removeImpl(k, map);
      else map.delete(k);
    }),
  };
}

async function runBootstrap(): Promise<void> {
  // @ts-expect-error side-effect-only bootstrap script exposes no exports
  await import('./localStorageBootstrap');
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('localStorageBootstrap', () => {
  it('removes only legacy catalog-static:* keys, keeps everything else', async () => {
    const ls = makeLocalStorage({
      'catalog-static:seriesMeta': '{}',
      'catalog-static:moviesMeta': '{}',
      'catalog-static:seasons/1': '{}',
      customTheme: 'green',
      cachedUser: 'u1',
      'homeConfig:v2': 'x',
    });
    vi.stubGlobal('localStorage', ls);

    await runBootstrap();

    expect(ls.map.has('catalog-static:seriesMeta')).toBe(false);
    expect(ls.map.has('catalog-static:moviesMeta')).toBe(false);
    expect(ls.map.has('catalog-static:seasons/1')).toBe(false);
    expect(ls.map.get('customTheme')).toBe('green');
    expect(ls.map.get('cachedUser')).toBe('u1');
    expect(ls.map.get('homeConfig:v2')).toBe('x');
  });

  it('no-op when there are no legacy keys (nothing removed)', async () => {
    const ls = makeLocalStorage({ customTheme: 'green', cachedUser: 'u1' });
    vi.stubGlobal('localStorage', ls);

    await runBootstrap();

    expect(ls.removeItem).not.toHaveBeenCalled();
    expect(ls.map.size).toBe(2);
  });

  it('does not throw when localStorage is unavailable', async () => {
    vi.stubGlobal('localStorage', undefined);
    await expect(runBootstrap()).resolves.toBeUndefined();
  });

  it('tolerates a removeItem that throws for one key and still clears the rest', async () => {
    const ls = makeLocalStorage(
      {
        'catalog-static:bad': '{}',
        'catalog-static:good': '{}',
        customTheme: 'green',
      },
      (k, map) => {
        if (k === 'catalog-static:bad') throw new Error('quota / access error');
        map.delete(k);
      }
    );
    vi.stubGlobal('localStorage', ls);

    await expect(runBootstrap()).resolves.toBeUndefined();

    // The throwing key survives (delete never ran), the other legacy key is gone.
    expect(ls.map.has('catalog-static:bad')).toBe(true);
    expect(ls.map.has('catalog-static:good')).toBe(false);
    expect(ls.map.get('customTheme')).toBe('green');
  });
});
