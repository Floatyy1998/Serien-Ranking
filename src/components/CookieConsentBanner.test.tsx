// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({
  consent: null as boolean | null,
  getAnalyticsConsent: vi.fn<() => boolean | null>(),
  setAnalyticsConsent: vi.fn<(accepted: boolean) => void>(),
}));

vi.mock('../firebase/analytics', () => ({
  getAnalyticsConsent: analytics.getAnalyticsConsent,
  setAnalyticsConsent: analytics.setAnalyticsConsent,
}));

// framer-motion passthrough: exit animations otherwise keep the node mounted,
// which makes the hide-after-click assertions flaky. Strip motion-only props
// so React does not warn about unknown DOM attributes.
const MOTION_ONLY = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'layout',
  'drag',
]);
const stripMotionProps = (props: Record<string, unknown>): React.HTMLAttributes<HTMLDivElement> => {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_ONLY.has(key)) out[key] = props[key];
  }
  return out as React.HTMLAttributes<HTMLDivElement>;
};

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: (props: Record<string, unknown>) => <div {...stripMotionProps(props)} />,
  },
}));

import { CookieConsentBanner } from './CookieConsentBanner';

beforeEach(() => {
  analytics.consent = null;
  analytics.getAnalyticsConsent.mockReset();
  analytics.getAnalyticsConsent.mockImplementation(() => analytics.consent);
  analytics.setAnalyticsConsent.mockReset();
  analytics.setAnalyticsConsent.mockImplementation((accepted: boolean) => {
    analytics.consent = accepted;
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CookieConsentBanner', () => {
  it('shows the banner after the delay when no consent is stored', () => {
    vi.useFakeTimers();
    render(<CookieConsentBanner />);

    // Not visible until the 800ms timer fires
    expect(screen.queryByText('Akzeptieren')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText('Cookies & Datenschutz')).toBeInTheDocument();
    expect(screen.getByText('Akzeptieren')).toBeInTheDocument();
  });

  it('stores consent and hides on accept', () => {
    vi.useFakeTimers();
    render(<CookieConsentBanner />);
    act(() => {
      vi.advanceTimersByTime(800);
    });

    fireEvent.click(screen.getByText('Akzeptieren'));

    expect(analytics.setAnalyticsConsent).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Akzeptieren')).toBeNull();
  });

  it('stores a decline and hides on decline', () => {
    vi.useFakeTimers();
    render(<CookieConsentBanner />);
    act(() => {
      vi.advanceTimersByTime(800);
    });

    fireEvent.click(screen.getByText('Ablehnen'));

    expect(analytics.setAnalyticsConsent).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Ablehnen')).toBeNull();
  });

  it('never shows when consent was already decided', () => {
    analytics.consent = true;
    vi.useFakeTimers();
    render(<CookieConsentBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Akzeptieren')).toBeNull();
  });
});
