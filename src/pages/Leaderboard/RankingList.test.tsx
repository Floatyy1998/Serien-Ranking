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

import { RankingList } from './RankingList';

const entry = (over: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  uid: 'u1',
  displayName: 'Charlie',
  value: 12,
  rank: 4,
  isCurrentUser: false,
  ...over,
});

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('RankingList', () => {
  it('renders nothing when there are no entries', () => {
    const { container } = render(
      <RankingList entries={[]} category="watchtimeThisMonth" unit="" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders entry name, rank and formatted watchtime value', () => {
    const entries = [
      entry({ uid: 'c', displayName: 'Charlie', rank: 4, value: 90, username: 'chaz' }),
    ];
    render(<RankingList entries={entries} category="watchtimeThisMonth" unit="" />);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('@chaz')).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('navigates to friend profile on click of another user', () => {
    const entries = [entry({ uid: 'friend-9', displayName: 'Charlie', rank: 4 })];
    render(<RankingList entries={entries} category="episodesThisMonth" unit="Ep." />);
    fireEvent.click(screen.getByText('Charlie'));
    expect(navigateMock).toHaveBeenCalledWith('/friend/friend-9');
  });

  it('shows "Du" and does not navigate for the current user', () => {
    const entries = [entry({ uid: 'me', isCurrentUser: true, rank: 5 })];
    render(<RankingList entries={entries} category="episodesThisMonth" unit="Ep." />);
    fireEvent.click(screen.getByText('Du'));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
