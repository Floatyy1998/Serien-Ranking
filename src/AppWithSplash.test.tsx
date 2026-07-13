// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('./App', () => ({ App: () => <div>APP_SHELL</div> }));
vi.mock('./components/ui/SplashScreen', () => ({
  SplashScreen: () => <div>SPLASH_SCREEN</div>,
}));

import { AppWithSplash } from './AppWithSplash';

beforeEach(() => {
  window.history.pushState({}, '', '/');
  localStorage.clear();
});

afterEach(() => cleanup());

describe('AppWithSplash', () => {
  it('shows the splash screen for a logged-in user (cachedUser) on a normal route', () => {
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1' }));
    render(<AppWithSplash />);
    expect(screen.getByText('SPLASH_SCREEN')).toBeInTheDocument();
  });

  it('skips the splash for logged-out visitors (no cachedUser) — Landing rendert sofort', () => {
    render(<AppWithSplash />);
    expect(screen.getByText('APP_SHELL')).toBeInTheDocument();
    expect(screen.queryByText('SPLASH_SCREEN')).not.toBeInTheDocument();
  });

  it('skips the splash and renders the app directly on auth routes', () => {
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1' }));
    window.history.pushState({}, '', '/login');
    render(<AppWithSplash />);
    expect(screen.getByText('APP_SHELL')).toBeInTheDocument();
    expect(screen.queryByText('SPLASH_SCREEN')).not.toBeInTheDocument();
  });
});
