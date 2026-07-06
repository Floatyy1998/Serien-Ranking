// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ContinueHeroCard, type ContinueHeroItem } from './ContinueHeroCard';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const MOTION_PROPS = new Set([
    'whileTap',
    'whileHover',
    'initial',
    'animate',
    'exit',
    'transition',
    'drag',
    'dragConstraints',
    'dragElastic',
    'layout',
    'layoutId',
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clean = (props: any) =>
    Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k)));
  const motion = new Proxy(
    {},
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: (_t, tag: string) => (props: any) =>
        React.createElement(tag, clean(props), props.children),
    }
  );
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => children };
});

vi.mock('../../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../../lib/haptics', () => ({ hapticTap: vi.fn(), hapticSuccess: vi.fn() }));
vi.mock('../../../utils/episodeChips', () => ({
  chipLabel: (t: string) => t,
  chipColor: () => '#fff',
}));

afterEach(cleanup);

const item: ContinueHeroItem = {
  id: 1,
  title: 'Breaking Bad',
  poster: 'poster.jpg',
  progress: 50,
  nextEpisode: { seasonNumber: 1, episodeNumber: 2, name: 'Cat in the Bag' },
};

describe('ContinueHeroCard', () => {
  it('shows title and next episode', () => {
    render(<ContinueHeroCard item={item} onOpen={() => {}} onMarkWatched={() => {}} />);
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText(/S1 E2 · Cat in the Bag/)).toBeInTheDocument();
  });

  it('calls onOpen when "Ansehen" is tapped', () => {
    const onOpen = vi.fn();
    render(<ContinueHeroCard item={item} onOpen={onOpen} onMarkWatched={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Ansehen/ }));
    expect(onOpen).toHaveBeenCalledWith(item);
  });

  it('calls onMarkWatched when "Gesehen" is tapped', () => {
    const onMarkWatched = vi.fn();
    render(<ContinueHeroCard item={item} onOpen={() => {}} onMarkWatched={onMarkWatched} />);
    fireEvent.click(screen.getByRole('button', { name: /als gesehen markieren/ }));
    expect(onMarkWatched).toHaveBeenCalledWith(item);
  });
});
