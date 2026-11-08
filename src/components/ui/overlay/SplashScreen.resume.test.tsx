// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as StartupUpdateHold from '../../../services/app/startupUpdateHold';

vi.mock('../../../services/app/startupUpdateHold', async (importOriginal) => ({
  ...(await importOriginal<typeof StartupUpdateHold>()),
  isSplashResumed: () => true,
}));

import { SplashScreen } from './SplashScreen';

function setReady(count: number) {
  const keys = ['theme', 'auth', 'firebase', 'emailVerification', 'initialData', 'homeConfig'];
  window.appReadyStatus = Object.fromEntries(
    keys.map((key, i) => [key, i < count])
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
      setReady(6);
      vi.advanceTimersByTime(300 + 140 + 180);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
