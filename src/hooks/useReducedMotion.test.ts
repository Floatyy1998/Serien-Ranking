// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

interface FakeMediaQuery {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  fire: (matches: boolean) => void;
}

function stubMatchMedia(initialMatches: boolean): FakeMediaQuery {
  let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;
  const mql: FakeMediaQuery = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      changeHandler = cb;
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    fire: (matches: boolean) => {
      changeHandler?.({ matches } as MediaQueryListEvent);
    },
  };
  vi.stubGlobal('matchMedia', vi.fn<(q: string) => FakeMediaQuery>().mockReturnValue(mql));
  return mql;
}

describe('useReducedMotion', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns false when reduced motion is not preferred', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when reduced motion is preferred initially', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when the media query change event fires', () => {
    const mql = stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => mql.fire(true));
    expect(result.current).toBe(true);

    act(() => mql.fire(false));
    expect(result.current).toBe(false);
  });

  it('subscribes on mount and cleans up the change listener on unmount', () => {
    const mql = stubMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
