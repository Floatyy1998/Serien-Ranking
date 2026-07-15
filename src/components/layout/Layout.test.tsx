// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from './Layout';

const routerState = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: routerState.pathname }),
}));

vi.mock('../../hooks/useSwipeTabNavigation', () => ({
  useSwipeTabNavigation: () => ({}),
  consumeSwipeDirection: () => 0,
}));
vi.mock('./BottomNavigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-nav" />,
}));
vi.mock('../BugFab', () => ({
  BugFab: () => <div data-testid="bug-fab" />,
}));

beforeEach(() => {
  routerState.pathname = '/';
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Layout', () => {
  it('rendert Kinder, Navigation und BugFab', () => {
    render(
      <Layout>
        <p>Inhalt</p>
      </Layout>
    );
    expect(screen.getByText('Inhalt')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    expect(screen.getByTestId('bug-fab')).toBeInTheDocument();
  });

  it('blendet die Navigation bei hideNav aus', () => {
    render(
      <Layout hideNav>
        <p>Inhalt</p>
      </Layout>
    );
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
  });

  it('blendet den BugFab auf der Bug-Report-Seite aus', () => {
    routerState.pathname = '/bug-report';
    render(
      <Layout>
        <p>Inhalt</p>
      </Layout>
    );
    expect(screen.queryByTestId('bug-fab')).not.toBeInTheDocument();
  });
});
