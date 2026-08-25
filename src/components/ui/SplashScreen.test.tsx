// @vitest-environment jsdom
import { render, screen, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_READY_EVENT } from '../../services/appReady';
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
      // safety interval fires (finish), then hold (140ms), then fade (180ms)
      vi.advanceTimersByTime(250 + 140 + 180 + 50);
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

  it('reacts to the ready event without waiting for the safety interval', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    act(() => {
      setAllReady(true);
      window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
      // Nur Hold + Fade — bewusst WENIGER als der 250ms-Sicherheitstick.
      vi.advanceTimersByTime(140 + 180);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('signals onHideStart before onComplete so the app can fade in underneath', () => {
    const order: string[] = [];
    render(
      <SplashScreen
        onHideStart={() => order.push('hideStart')}
        onComplete={() => order.push('complete')}
      />
    );
    act(() => {
      setAllReady(true);
      window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
      vi.advanceTimersByTime(140);
    });
    expect(order).toEqual(['hideStart']);
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(order).toEqual(['hideStart', 'complete']);
  });
});
