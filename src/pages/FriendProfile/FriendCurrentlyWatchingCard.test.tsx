// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FriendCurrentlyWatching } from './useFriendCurrentlyWatching';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
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

import { FriendCurrentlyWatchingCard } from './FriendCurrentlyWatchingCard';

const data: FriendCurrentlyWatching = {
  seriesId: 12,
  title: 'Andor',
  poster: '/p.jpg',
  episodeCount: 4,
  daysCovered: 2,
  latestSeason: 1,
  latestEpisode: 8,
  latestWatchedAt: Date.now() - 3 * 60000,
  isRewatch: false,
  mood: 'binge',
  spoilerDiff: { kind: 'friend-ahead', message: 'Er ist dir voraus', warning: true },
};

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('FriendCurrentlyWatchingCard', () => {
  it('renders the mood label, title and spoiler message', () => {
    render(<FriendCurrentlyWatchingCard friendName="Sam" data={data} />);
    expect(screen.getByText('Binge-Modus')).toBeInTheDocument();
    expect(screen.getByText('Andor')).toBeInTheDocument();
    expect(screen.getByText('Er ist dir voraus')).toBeInTheDocument();
  });

  it('shows the friend name and latest episode line', () => {
    render(<FriendCurrentlyWatchingCard friendName="Sam" data={data} />);
    expect(screen.getByText(/Sam schaut S1E8/)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('navigates to the series when the card is clicked', () => {
    render(<FriendCurrentlyWatchingCard friendName="Sam" data={data} />);
    fireEvent.click(screen.getByText('Andor'));
    expect(navigateMock).toHaveBeenCalledWith('/series/12');
  });
});
