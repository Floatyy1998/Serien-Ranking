// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AnimeFillerData } from '../../services/animeFillerService';

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

import { AnimeFillerBanner } from './AnimeFillerBanner';

const data: AnimeFillerData = {
  malId: 1,
  totalEpisodes: 12,
  fillerCount: 2,
  recapCount: 1,
  episodes: [
    { malEpisodeNumber: 3, title: 'Beach Episode', filler: true, recap: false },
    { malEpisodeNumber: 7, title: 'Recap Time', filler: false, recap: true },
  ],
  fetchedAt: 0,
};

afterEach(() => cleanup());

describe('AnimeFillerBanner', () => {
  it('renders nothing when disabled', () => {
    const { container } = render(
      <AnimeFillerBanner enabled={false} loading={false} data={null} isMobile={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a loading hint while fetching', () => {
    render(<AnimeFillerBanner enabled loading data={null} isMobile={false} />);
    expect(screen.getByText(/Suche Filler-Infos/)).toBeInTheDocument();
  });

  it('shows an error with a reload action when data is missing', () => {
    const onReload = vi.fn();
    render(
      <AnimeFillerBanner enabled loading={false} data={null} isMobile={false} onReload={onReload} />
    );
    expect(screen.getByText(/konnten nicht geladen werden/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Neu laden'));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('summarises filler counts and expands to list episodes', () => {
    render(<AnimeFillerBanner enabled loading={false} data={data} isMobile={false} />);
    expect(screen.getByText(/Folgen gesamt/)).toBeInTheDocument();
    // Episodes only appear once expanded.
    expect(screen.queryByText('Beach Episode')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('Beach Episode')).toBeInTheDocument();
    expect(screen.getByText('Recap Time')).toBeInTheDocument();
  });
});
