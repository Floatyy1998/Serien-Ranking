import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hapticCelebrate,
  hapticError,
  hapticSelect,
  hapticSuccess,
  hapticTap,
  hapticWarning,
} from './haptics';

let vibrateSpy: ReturnType<typeof vi.fn>;

/** Stub `navigator`; pass a spy to expose `vibrate`, or null for "no vibrate API". */
function stubNavigator(vibrate: ReturnType<typeof vi.fn> | null): void {
  vi.stubGlobal('navigator', vibrate ? { vibrate } : {});
}

/** Stub `window.matchMedia` so prefers-reduced-motion returns `matches`. */
function stubWindowMatchMedia(matches: boolean): void {
  vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches })) });
}

beforeEach(() => {
  vibrateSpy = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('haptics — supported device (vibrate present, no reduced motion)', () => {
  beforeEach(() => {
    stubNavigator(vibrateSpy);
    stubWindowMatchMedia(false);
  });

  it('hapticTap → vibrate(10)', () => {
    hapticTap();
    expect(vibrateSpy).toHaveBeenCalledWith(10);
  });

  it('hapticSelect → vibrate(15)', () => {
    hapticSelect();
    expect(vibrateSpy).toHaveBeenCalledWith(15);
  });

  it('hapticSuccess → vibrate([20, 30, 20])', () => {
    hapticSuccess();
    expect(vibrateSpy).toHaveBeenCalledWith([20, 30, 20]);
  });

  it('hapticWarning → vibrate([30, 40])', () => {
    hapticWarning();
    expect(vibrateSpy).toHaveBeenCalledWith([30, 40]);
  });

  it('hapticError → vibrate([60, 50, 60])', () => {
    hapticError();
    expect(vibrateSpy).toHaveBeenCalledWith([60, 50, 60]);
  });

  it('hapticCelebrate → vibrate([60, 40, 60, 40, 120])', () => {
    hapticCelebrate();
    expect(vibrateSpy).toHaveBeenCalledWith([60, 40, 60, 40, 120]);
  });
});

describe('haptics — native Capacitor-Hülle', () => {
  it('nutzt die native Haptics-Engine statt navigator.vibrate', () => {
    const impact = vi.fn(() => Promise.resolve());
    const notification = vi.fn(() => Promise.resolve());
    stubNavigator(vibrateSpy);
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({ matches: false })),
      Capacitor: {
        isNativePlatform: () => true,
        Plugins: { Haptics: { impact, notification } },
      },
    });

    hapticTap();
    expect(impact).toHaveBeenCalledWith({ style: 'LIGHT' });

    hapticError();
    expect(notification).toHaveBeenCalledWith({ type: 'ERROR' });

    hapticCelebrate();
    expect(notification).toHaveBeenCalledWith({ type: 'SUCCESS' });
    expect(impact).toHaveBeenCalledWith({ style: 'HEAVY' });

    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it('fällt im Browser (kein Capacitor) auf vibrate zurück', () => {
    stubNavigator(vibrateSpy);
    stubWindowMatchMedia(false);
    hapticTap();
    expect(vibrateSpy).toHaveBeenCalledWith(10);
  });
});

describe('haptics — feature-detection guards', () => {
  it('no-op when navigator has no vibrate function (does not throw)', () => {
    stubNavigator(null);
    stubWindowMatchMedia(false);
    expect(() => hapticTap()).not.toThrow();
  });

  it('no-op when navigator is undefined (does not throw)', () => {
    vi.stubGlobal('navigator', undefined);
    stubWindowMatchMedia(false);
    expect(() => hapticSuccess()).not.toThrow();
  });

  it('stays silent when the OS requests reduced motion', () => {
    stubNavigator(vibrateSpy);
    stubWindowMatchMedia(true); // prefers-reduced-motion: reduce
    hapticTap();
    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it('still vibrates when window is undefined (reduced-motion check bails to false)', () => {
    stubNavigator(vibrateSpy);
    vi.stubGlobal('window', undefined);
    hapticTap();
    expect(vibrateSpy).toHaveBeenCalledWith(10);
  });

  it('still vibrates when window has no matchMedia', () => {
    stubNavigator(vibrateSpy);
    vi.stubGlobal('window', {});
    hapticSelect();
    expect(vibrateSpy).toHaveBeenCalledWith(15);
  });

  it('swallows a throw from navigator.vibrate (some browsers throttle)', () => {
    const throwing = vi.fn(() => {
      throw new Error('called too frequently');
    });
    stubNavigator(throwing);
    stubWindowMatchMedia(false);
    expect(() => hapticError()).not.toThrow();
    expect(throwing).toHaveBeenCalledTimes(1);
  });
});
