// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTransitionNavigate } from './useTransitionNavigate';

const navSpy = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navSpy,
}));

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(q: string) => MediaQueryList>().mockReturnValue({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)
  );
}

describe('useTransitionNavigate', () => {
  beforeEach(() => {
    navSpy.mockReset();
    stubReducedMotion(false);
  });

  afterEach(() => {
    cleanup();
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('navigates directly when startViewTransition is unavailable', () => {
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
    const { result } = renderHook(() => useTransitionNavigate());
    result.current('/home');
    expect(navSpy).toHaveBeenCalledWith('/home', undefined);
  });

  it('forwards navigate options', () => {
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
    const { result } = renderHook(() => useTransitionNavigate());
    result.current('/x', { replace: true });
    expect(navSpy).toHaveBeenCalledWith('/x', { replace: true });
  });

  it('passes numeric deltas without options', () => {
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
    const { result } = renderHook(() => useTransitionNavigate());
    result.current(-1);
    expect(navSpy).toHaveBeenCalledWith(-1);
  });

  it('wraps navigation in startViewTransition when supported', () => {
    const svt = vi.fn((cb: () => void) => {
      cb();
      return {};
    });
    (document as unknown as { startViewTransition: typeof svt }).startViewTransition = svt;
    const { result } = renderHook(() => useTransitionNavigate());
    result.current('/detail');
    expect(svt).toHaveBeenCalledTimes(1);
    expect(navSpy).toHaveBeenCalledWith('/detail', undefined);
  });

  it('skips the transition when reduced motion is preferred', () => {
    stubReducedMotion(true);
    const svt = vi.fn((cb: () => void) => cb());
    (document as unknown as { startViewTransition: typeof svt }).startViewTransition = svt;
    const { result } = renderHook(() => useTransitionNavigate());
    result.current('/plain');
    expect(svt).not.toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith('/plain', undefined);
  });
});
