// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routerState = vi.hoisted(() => ({ pathname: '/' }));
const analyticsMock = vi.hoisted(() => ({ logPageView: vi.fn<(page: string) => void>() }));

vi.mock('../services/firebase/analytics', () => ({
  logPageView: analyticsMock.logPageView,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: routerState.pathname }),
}));

import { RouteTracker } from './RouteTracker';

beforeEach(() => {
  routerState.pathname = '/';
  analyticsMock.logPageView.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('RouteTracker', () => {
  it('tracks the initial route on mount', () => {
    render(<RouteTracker />);
    expect(analyticsMock.logPageView).toHaveBeenCalledWith('home');
  });

  it('tracks a page view when the route changes', () => {
    const { rerender } = render(<RouteTracker />);
    analyticsMock.logPageView.mockClear();

    routerState.pathname = '/search';
    rerender(<RouteTracker />);

    expect(analyticsMock.logPageView).toHaveBeenCalledWith('search');
  });

  it('maps dynamic detail routes to a stable page name', () => {
    routerState.pathname = '/series/42';
    render(<RouteTracker />);
    expect(analyticsMock.logPageView).toHaveBeenCalledWith('series_detail');
  });

  it('does not re-track when the pathname is unchanged', () => {
    const { rerender } = render(<RouteTracker />);
    expect(analyticsMock.logPageView).toHaveBeenCalledTimes(1);

    rerender(<RouteTracker />);
    expect(analyticsMock.logPageView).toHaveBeenCalledTimes(1);
  });
});
