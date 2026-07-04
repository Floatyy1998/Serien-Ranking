// @vitest-environment jsdom
import { render, screen, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SplashScreen } from './SplashScreen';

function setAllReady(ready: boolean) {
  window.appReadyStatus = {
    theme: ready,
    auth: ready,
    firebase: ready,
    emailVerification: ready,
    initialData: ready,
    homeConfig: ready,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  setAllReady(false);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe('SplashScreen', () => {
  it('renders the brand and initial loading state (smoke)', () => {
    render(<SplashScreen />);
    expect(screen.getByText('TV-RANK')).toBeInTheDocument();
    expect(screen.getByText('Serien, Filme & Manga im Blick')).toBeInTheDocument();
    expect(screen.getByText('Initialisiere System')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calls onComplete once all systems report ready', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    act(() => {
      setAllReady(true);
      // interval fires (finish), then hide (400ms), then complete (500ms)
      vi.advanceTimersByTime(50 + 400 + 500 + 50);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('finishes via the waitForCondition fallback', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} waitForCondition={() => true} />);
    act(() => {
      vi.advanceTimersByTime(50 + 400 + 500 + 50);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
