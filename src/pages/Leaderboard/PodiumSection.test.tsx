// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { LeaderboardEntry } from '../../types/Leaderboard';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});
vi.mock('../../contexts/ThemeContext', () => {
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

import { PodiumSection } from './PodiumSection';

const entry = (over: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  uid: 'u1',
  displayName: 'Alice Wonder',
  value: 10,
  rank: 1,
  isCurrentUser: false,
  ...over,
});

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('PodiumSection', () => {
  it('renders nothing when there are no entries', () => {
    const { container } = render(
      <PodiumSection topThree={[]} category="episodesThisMonth" unit="Ep." />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders ranks and first-name of the top entries', () => {
    const top = [
      entry({ uid: 'a', displayName: 'Alice Wonder', rank: 1, value: 42 }),
      entry({ uid: 'b', displayName: 'Bob Builder', rank: 2, value: 30 }),
    ];
    render(<PodiumSection topThree={top} category="episodesThisMonth" unit="Ep." />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('navigates to a friend profile when a non-current entry is clicked', () => {
    const top = [entry({ uid: 'friend-1', displayName: 'Alice Wonder', rank: 1 })];
    render(<PodiumSection topThree={top} category="episodesThisMonth" unit="Ep." />);
    fireEvent.click(screen.getByText('Alice'));
    expect(navigateMock).toHaveBeenCalledWith('/friend/friend-1');
  });

  it('does not navigate for the current user', () => {
    const top = [entry({ uid: 'me', isCurrentUser: true, rank: 1 })];
    render(<PodiumSection topThree={top} category="episodesThisMonth" unit="Ep." />);
    fireEvent.click(screen.getByText('Du'));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
