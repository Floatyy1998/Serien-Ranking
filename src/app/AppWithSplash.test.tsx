// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('./App', () => ({ App: () => <div>APP_SHELL</div> }));
vi.mock('../components/ui/overlay/SplashScreen', () => ({
  SplashScreen: () => <div>SPLASH_SCREEN</div>,
}));

import { AppWithSplash } from './AppWithSplash';
import { APP_READY_KEYS } from '../services/app/appReady';

beforeEach(() => {
  window.history.pushState({}, '', '/');
  localStorage.clear();
  for (const key of APP_READY_KEYS) window.appReadyStatus[key] = false;
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

  it('mounts the app shell behind the splash within a couple of frames', async () => {
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1' }));
    render(<AppWithSplash />);
    // Frueher stand hier ein pauschaler 200ms-Timer — die App (und damit Theme,
    // Firebase-Init und alle Daten-Provider) startete erst danach.
    await waitFor(() => expect(screen.getByText('APP_SHELL')).toBeInTheDocument());
    expect(screen.getByText('SPLASH_SCREEN')).toBeInTheDocument();
    expect(screen.getByText('APP_SHELL').parentElement).toHaveStyle({ visibility: 'hidden' });
  });

  it('ohne Splash gilt die Seite sofort als fertig aufgebaut', () => {
    render(<AppWithSplash />);
    expect(window.appReadyStatus.rendered).toBe(true);
  });

  it('meldet „fertig aufgebaut“ erst, wenn alle anderen Systeme bereit sind', async () => {
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1' }));
    render(<AppWithSplash />);
    await waitFor(() => expect(screen.getByText('APP_SHELL')).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(window.appReadyStatus.rendered).toBe(false);

    act(() => {
      for (const key of APP_READY_KEYS) {
        if (key !== 'rendered') window.setAppReady(key, true);
      }
    });
    await waitFor(() => expect(window.appReadyStatus.rendered).toBe(true), { timeout: 2000 });
  });

  it('mounts the app shell even when the page gets no animation frames (hidden window)', () => {
    vi.useFakeTimers();
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    try {
      localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1' }));
      render(<AppWithSplash />);
      expect(screen.queryByText('APP_SHELL')).not.toBeInTheDocument();
      act(() => vi.advanceTimersByTime(200));
      expect(screen.getByText('APP_SHELL')).toBeInTheDocument();
    } finally {
      raf.mockRestore();
      vi.useRealTimers();
    }
  });
});
