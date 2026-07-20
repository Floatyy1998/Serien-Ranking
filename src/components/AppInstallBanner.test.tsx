// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});

vi.mock('@mui/icons-material', () => ({ Close: () => null }));
vi.mock('../lib/motion', () => ({ tapScaleTight: {} }));
vi.mock('../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { AppInstallBanner } from './AppInstallBanner';

const setUA = (ua: string) =>
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });

const DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  setUA(DESKTOP);
  delete (window as { Capacitor?: unknown }).Capacitor;
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const flush = async () => {
  await act(async () => {
    vi.advanceTimersByTime(1600);
    await Promise.resolve();
  });
};

describe('AppInstallBanner', () => {
  it('bleibt auf dem Desktop unsichtbar', async () => {
    render(<AppInstallBanner />);
    await flush();
    expect(screen.queryByText('TV-Rank als App')).not.toBeInTheDocument();
  });

  it('zeigt auf Android einen Play-Store-Link', async () => {
    setUA(ANDROID);
    render(<AppInstallBanner />);
    await flush();
    const link = screen.getByText('Öffnen').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('play.google.com'));
    expect(link?.getAttribute('href')).toContain('de.tvrank.app');
  });

  it('erscheint in der nativen App nicht', async () => {
    setUA(ANDROID);
    (window as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true };
    render(<AppInstallBanner />);
    await flush();
    expect(screen.queryByText('TV-Rank als App')).not.toBeInTheDocument();
  });

  it('bleibt nach dem Schließen für den Cooldown weg', async () => {
    setUA(ANDROID);
    render(<AppInstallBanner />);
    await flush();
    fireEvent.click(screen.getByText('Öffnen'));
    expect(localStorage.getItem('appInstallBannerDismissedAt')).toBeTruthy();
    cleanup();
    render(<AppInstallBanner />);
    await flush();
    expect(screen.queryByText('TV-Rank als App')).not.toBeInTheDocument();
  });
});
