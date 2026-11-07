// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShootPage, capturePageShot } from './pageShot';

type Bridge = { capturePage?: () => Promise<Uint8Array | null> };
const setBridge = (bridge: Bridge | undefined) => {
  (window as unknown as { electronAPI?: Bridge }).electronAPI = bridge;
};

afterEach(() => {
  setBridge(undefined);
  vi.useRealTimers();
});

describe('capturePageShot', () => {
  it('liefert ohne native Hülle sofort null', async () => {
    expect(canShootPage()).toBe(false);
    expect(await capturePageShot()).toBeNull();
  });

  it('macht aus den Bytes der Electron-Aufnahme ein JPEG', async () => {
    setBridge({ capturePage: async () => new Uint8Array([0xff, 0xd8, 0xff]) });
    expect(canShootPage()).toBe(true);
    const blob = await capturePageShot();
    expect(blob?.type).toBe('image/jpeg');
    expect(blob?.size).toBe(3);
  });

  it('gibt auf, wenn die Aufnahme hängt oder scheitert', async () => {
    setBridge({ capturePage: async () => Promise.reject(new Error('kaputt')) });
    expect(await capturePageShot()).toBeNull();

    vi.useFakeTimers();
    setBridge({ capturePage: () => new Promise(() => {}) });
    const pending = capturePageShot();
    await vi.advanceTimersByTimeAsync(1600);
    expect(await pending).toBeNull();
  });
});
