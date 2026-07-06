// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  MotionConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@mui/material', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CssBaseline: () => null,
}));
vi.mock('./components/ui/LoadingSpinner', () => ({ LoadingSpinner: () => <div /> }));
vi.mock('./components/auth/EmailVerificationBanner', () => ({
  EmailVerificationBanner: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./hooks/useGlobalImageRetry', () => ({ useGlobalImageRetry: () => {} }));
vi.mock('./contexts/ThemeProvider', () => ({
  DynamicThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./components/CookieConsentBanner', () => ({
  CookieConsentBanner: () => <div data-testid="cookie-banner" />,
}));
vi.mock('./components/ElectronUpdateToast', () => ({ ElectronUpdateToast: () => null }));
vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./components/RouteTracker', () => ({ RouteTracker: () => null }));
vi.mock('./theme', () => ({ updateTheme: () => ({}) }));
vi.mock('./authProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./themeHelpers', () => ({
  loadSavedTheme: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

import { App } from './App';

afterEach(() => cleanup());

describe('App', () => {
  it('mounts and renders its shell once the theme has loaded', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('cookie-banner')).toBeInTheDocument());
  });
});
