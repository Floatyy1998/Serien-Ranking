// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollToTop } from './ScrollToTop';

const routerState = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: routerState.pathname }),
}));

beforeEach(() => {
  routerState.pathname = '/';
  vi.useFakeTimers();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe('ScrollToTop', () => {
  it('rendert nichts (Nebeneffekt-Komponente)', () => {
    const { container } = render(<ScrollToTop />);
    expect(container.firstChild).toBeNull();
  });

  it('scrollt das Fenster nach dem Timer nach oben', () => {
    render(<ScrollToTop />);
    vi.advanceTimersByTime(1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
