// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  vi.useRealTimers();
});

async function load() {
  return import('./startupUpdateHold');
}

describe('startupUpdateHold – Splash-Fortsetzung', () => {
  it('erkennt einen frischen Update-Reload genau einmal pro Seite', async () => {
    (await load()).markSplashResume();
    const next = await load();
    expect(next.isSplashResumed()).toBe(true);
    expect(next.isSplashResumed()).toBe(true);
    expect(sessionStorage.getItem('splashResume')).toBeNull();
    vi.resetModules();
    expect((await load()).isSplashResumed()).toBe(false);
  });

  it('ignoriert eine veraltete Markierung', async () => {
    sessionStorage.setItem('splashResume', String(Date.now() - 60000));
    expect((await load()).isSplashResumed()).toBe(false);
  });

  it('ohne Markierung kein Fortsetzen', async () => {
    expect((await load()).isSplashResumed()).toBe(false);
  });
});
