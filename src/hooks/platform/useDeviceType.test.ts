// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeviceType } from './useDeviceType';

function setWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  });
}

describe('useDeviceType', () => {
  afterEach(() => {
    cleanup();
    setWidth(1024);
    vi.restoreAllMocks();
  });

  it('reports desktop when width is at/above the 768px breakpoint', () => {
    setWidth(1200);
    const { result } = renderHook(() => useDeviceType());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it('reports mobile when width is below the 768px breakpoint', () => {
    setWidth(500);
    const { result } = renderHook(() => useDeviceType());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('treats exactly 768px as desktop (breakpoint is exclusive)', () => {
    setWidth(768);
    const { result } = renderHook(() => useDeviceType());
    expect(result.current.isMobile).toBe(false);
  });

  it('updates on window resize events', () => {
    setWidth(1200);
    const { result } = renderHook(() => useDeviceType());
    expect(result.current.isMobile).toBe(false);

    act(() => {
      setWidth(400);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);

    act(() => {
      setWidth(1000);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.isMobile).toBe(false);
  });

  it('registers and removes the resize listener across mount/unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useDeviceType());
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
