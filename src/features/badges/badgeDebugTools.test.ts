import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./offlineBadgeSystem', () => ({
  getOfflineBadgeSystem: vi.fn(() => ({
    debugSocialBadges: vi.fn(async () => ({})),
    invalidateCache: vi.fn(),
    checkForNewBadges: vi.fn(async () => []),
  })),
}));

import { registerBadgeDebugTools } from './badgeDebugTools';

type Win = Record<string, unknown> & {
  debugBadges?: unknown;
  badgeDebugTools?: Record<string, unknown>;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registerBadgeDebugTools', () => {
  it('ohne window (node) → no-op ohne Fehler', () => {
    // node-Umgebung hat kein window
    expect(typeof window).toBe('undefined');
    expect(() => registerBadgeDebugTools()).not.toThrow();
  });

  it('mit window → hängt debugBadges + badgeDebugTools an', () => {
    const win: Win = {};
    vi.stubGlobal('window', win);

    registerBadgeDebugTools();

    expect(typeof win.debugBadges).toBe('function');
    expect(typeof win.badgeDebugTools).toBe('object');
  });

  it('badgeDebugTools bietet die erwarteten Debug-Funktionen', () => {
    const win: Win = {};
    vi.stubGlobal('window', win);

    registerBadgeDebugTools();

    const tools = win.badgeDebugTools as Record<string, unknown>;
    for (const key of [
      'getCurrentUserId',
      'showCounters',
      'simulateBinge',
      'simulateStreak',
      'simulateQuickwatch',
      'showBadgeProgress',
      'resetCounters',
    ]) {
      expect(typeof tools[key], key).toBe('function');
    }
  });
});
