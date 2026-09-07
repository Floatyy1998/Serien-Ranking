// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDrawInProgress } from './useDrawInProgress';

const mm = (matches: boolean) =>
  ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

describe('useDrawInProgress (D1)', () => {
  let el: HTMLDivElement;
  let rafCbs: FrameRequestCallback[];

  beforeEach(() => {
    el = document.createElement('div');
    rafCbs = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCbs.push(cb);
      return rafCbs.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('setzt bei prefers-reduced-motion sofort den Zielwert', () => {
    window.matchMedia = mm(true);
    renderHook(() => useDrawInProgress({ current: el }, 73));
    expect(el.style.getPropertyValue('--prog')).toBe('73');
    expect(rafCbs).toHaveLength(0);
  });

  it('animiert --prog per rAF von 0 zum Ziel (Ease-Out)', () => {
    window.matchMedia = mm(false);
    const start = 1000;
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(start);
    renderHook(() => useDrawInProgress({ current: el }, 50, 1000));

    expect(rafCbs).toHaveLength(1);

    // Halbzeit: Wert zwischen 0 und 50 (Ease-Out → über 25)
    nowSpy.mockReturnValue(start + 500);
    rafCbs[0](start + 500);
    const mid = parseFloat(el.style.getPropertyValue('--prog'));
    expect(mid).toBeGreaterThan(25);
    expect(mid).toBeLessThan(50);

    // Ende: exakt Ziel, keine weiteren Frames
    nowSpy.mockReturnValue(start + 1000);
    rafCbs[1](start + 1000);
    expect(parseFloat(el.style.getPropertyValue('--prog'))).toBe(50);
    expect(rafCbs).toHaveLength(2);
  });
});
