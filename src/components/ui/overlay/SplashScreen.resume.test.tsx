// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as StartupUpdateHold from '../../../services/app/startupUpdateHold';

vi.mock('../../../services/app/startupUpdateHold', async (importOriginal) => ({
  ...(await importOriginal<typeof StartupUpdateHold>()),
  isSplashResumed: () => true,
}));

import { APP_READY_KEYS } from '../../../services/app/appReady';
import { SplashScreen } from './SplashScreen';

function setReady(count: number) {
  window.appReadyStatus = Object.fromEntries(
    APP_READY_KEYS.map((key, i) => [key, i < count])
  ) as Window['appReadyStatus'];
}

beforeEach(() => {
  vi.useFakeTimers();
  setReady(0);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe('SplashScreen nach Update-Reload', () => {
  it('setzt beim Balkenstand fort, ohne neu einzublenden', () => {
    const { container } = render(<SplashScreen />);
    expect(container.firstElementChild).toHaveAttribute('data-resumed', 'true');
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('Neue Version wird geladen')).toBeInTheDocument();
  });

  it('der Balken läuft nicht zurück und beendet normal', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    act(() => {
      setReady(3);
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('90%')).toBeInTheDocument();
    act(() => {
      setReady(APP_READY_KEYS.length);
      vi.advanceTimersByTime(300 + 140 + 180);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
