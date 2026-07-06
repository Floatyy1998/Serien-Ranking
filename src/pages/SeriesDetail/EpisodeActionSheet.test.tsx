// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SeriesEpisode } from './types';

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
vi.mock('@mui/icons-material', () => ({
  ChatBubbleOutline: () => null,
  Repeat: () => null,
  RemoveCircle: () => null,
}));
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
vi.mock('../../components/ui', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="sheet">{children}</div> : null,
}));

import { EpisodeActionSheet } from './EpisodeActionSheet';

const episode = {
  id: 10,
  name: 'The Pilot',
  watched: true,
  watchCount: 2,
} as unknown as SeriesEpisode;

const baseProps = {
  isOpen: true,
  episode,
  seriesTitle: 'Lost',
  seasonNumber: 1,
  episodeNumber: 1,
  onRewatch: vi.fn(),
  onUnwatch: vi.fn(),
  onNavigateToDiscussion: vi.fn(),
  onClose: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EpisodeActionSheet', () => {
  it('renders nothing when there is no episode', () => {
    render(<EpisodeActionSheet {...baseProps} episode={null} />);
    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
  });

  it('renders the episode name and watch summary', () => {
    render(<EpisodeActionSheet {...baseProps} />);
    expect(screen.getByText('The Pilot')).toBeInTheDocument();
    expect(screen.getByText(/2x gesehen/)).toBeInTheDocument();
    expect(screen.getByText('Nochmal gesehen (3x)')).toBeInTheDocument();
  });

  it('invokes the rewatch and discussion callbacks', () => {
    render(<EpisodeActionSheet {...baseProps} />);
    fireEvent.click(screen.getByText('Nochmal gesehen (3x)'));
    expect(baseProps.onRewatch).toHaveBeenCalledWith(episode);
    fireEvent.click(screen.getByText('Zur Diskussion'));
    expect(baseProps.onNavigateToDiscussion).toHaveBeenCalledTimes(1);
  });

  it('invokes the unwatch callback for reducing the watch count', () => {
    render(<EpisodeActionSheet {...baseProps} />);
    fireEvent.click(screen.getByText('Auf 1x reduzieren'));
    expect(baseProps.onUnwatch).toHaveBeenCalledWith(episode);
  });
});
