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
});

afterEach(() => cleanup());

describe('AppWithSplash', () => {
  it('shows the splash screen on a normal route', () => {
    render(<AppWithSplash />);
    expect(screen.getByText('SPLASH_SCREEN')).toBeInTheDocument();
  });

  it('skips the splash and renders the app directly on auth routes', () => {
    window.history.pushState({}, '', '/login');
    render(<AppWithSplash />);
    expect(screen.getByText('APP_SHELL')).toBeInTheDocument();
    expect(screen.queryByText('SPLASH_SCREEN')).not.toBeInTheDocument();
  });
});
