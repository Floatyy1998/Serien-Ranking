// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SeriesSeason } from './types';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'layout',
    'layoutId',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragSnapToOrigin',
    'onDragEnd',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
    useReducedMotion: () => true,
    useDragControls: () => ({ start: () => {} }),
  };
});
vi.mock('@mui/icons-material', () => ({ Check: () => null }));
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

import { SeasonTabs } from './SeasonTabs';

const seasons = [
  {
    seasonNumber: 0,
    episodes: [
      { id: 1, watched: true, watchCount: 1 },
      { id: 2, watched: true, watchCount: 1 },
    ],
  },
  {
    seasonNumber: 1,
    episodes: [
      { id: 3, watched: true, watchCount: 1 },
      { id: 4, watched: false },
    ],
  },
] as unknown as SeriesSeason[];

afterEach(() => cleanup());

describe('SeasonTabs', () => {
  it('renders a tab per season labelled 1-based', () => {
    render(<SeasonTabs seasons={seasons} selectedSeasonIndex={0} onSelectSeason={() => {}} />);
    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.getByText('S2')).toBeInTheDocument();
  });

  it('shows the watched progress percentage for a partially watched season', () => {
    render(<SeasonTabs seasons={seasons} selectedSeasonIndex={0} onSelectSeason={() => {}} />);
    // Season 2 (index 1): 1 of 2 watched → 50%.
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('calls onSelectSeason with the tapped season index', () => {
    const onSelectSeason = vi.fn();
    render(
      <SeasonTabs seasons={seasons} selectedSeasonIndex={0} onSelectSeason={onSelectSeason} />
    );
    fireEvent.click(screen.getByText('S2'));
    expect(onSelectSeason).toHaveBeenCalledWith(1);
  });
});
