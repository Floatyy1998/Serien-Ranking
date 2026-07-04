// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { DynamicTheme } from '../../theme/dynamicTheme';
import type { Series } from '../../types/Series';

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
vi.mock('../../components/ui', () => ({ ProgressBar: () => <div data-testid="progress" /> }));

const { rewatchMocks } = vi.hoisted(() => ({
  rewatchMocks: {
    round: 2,
    progress: { current: 3, total: 10 },
    next: null as { seasonNumber: number; episodeIndex: number; name: string } | null,
  },
}));

vi.mock('../../lib/validation/rewatch.utils', () => ({
  getRewatchRound: () => rewatchMocks.round,
  getRewatchProgress: () => rewatchMocks.progress,
  getNextRewatchEpisode: () => rewatchMocks.next,
}));

import { RewatchBanner } from './RewatchBanner';

const theme = {
  primary: '#00d123',
  accent: '#00a0ff',
  text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
  background: { default: '#000', surface: '#111', paper: '#181818' },
  status: { success: '#22c55e', warning: '#f59e0b', error: '#ef4444' },
} as unknown as DynamicTheme;

const series = {
  seasons: [{ seasonNumber: 0, episodes: [{ id: 10, name: 'Pilot' }] }],
} as unknown as Series;

const baseProps = {
  series,
  warningColor: '#f59e0b',
  currentTheme: theme,
  setSelectedSeasonIndex: vi.fn(),
  setShowRewatchDialog: vi.fn(),
  handleStopRewatch: vi.fn(),
};

beforeEach(() => {
  rewatchMocks.next = null;
  baseProps.setSelectedSeasonIndex = vi.fn();
  baseProps.setShowRewatchDialog = vi.fn();
  baseProps.handleStopRewatch = vi.fn();
});

afterEach(() => cleanup());

describe('RewatchBanner', () => {
  it('renders the rewatch round and episode progress', () => {
    render(<RewatchBanner {...baseProps} />);
    expect(screen.getByText('Rewatch #2')).toBeInTheDocument();
    expect(screen.getByText('3/10 Episoden')).toBeInTheDocument();
  });

  it('calls handleStopRewatch when the stop button is pressed', () => {
    render(<RewatchBanner {...baseProps} />);
    fireEvent.click(screen.getByText('Rewatch beenden'));
    expect(baseProps.handleStopRewatch).toHaveBeenCalledTimes(1);
  });

  it('opens the rewatch dialog for the next episode', () => {
    rewatchMocks.next = { seasonNumber: 0, episodeIndex: 0, name: 'Pilot' };
    render(<RewatchBanner {...baseProps} />);
    fireEvent.click(screen.getByText(/Nächste: S1 E1 — Pilot/));
    expect(baseProps.setSelectedSeasonIndex).toHaveBeenCalledWith(0);
    expect(baseProps.setShowRewatchDialog).toHaveBeenCalledWith(
      expect.objectContaining({ show: true, type: 'episode', seasonNumber: 1, episodeNumber: 1 })
    );
  });
});
