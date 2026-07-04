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
vi.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../lib/validation/rewatch.utils', () => ({
  hasActiveRewatch: () => false,
  hasAnySeasonFullyWatched: () => false,
  getImplicitRewatchRound: () => 0,
}));
vi.mock('./SeasonTabs', () => ({ SeasonTabs: () => <div data-testid="season-tabs" /> }));
vi.mock('./RewatchBanner', () => ({ RewatchBanner: () => <div data-testid="rewatch-banner" /> }));
vi.mock('../../components/ui/FillerChip', () => ({ FillerChip: () => <span /> }));

import { SeasonsSection } from './SeasonsSection';

const theme = {
  primary: '#00d123',
  accent: '#00a0ff',
  text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
  background: { default: '#000', surface: '#111', paper: '#181818' },
  status: { success: '#22c55e', warning: '#f59e0b', error: '#ef4444' },
} as unknown as DynamicTheme;

const series = {
  id: 42,
  seasons: [
    {
      seasonNumber: 0,
      episodes: [
        { id: 1, watched: false, name: 'Ep One', air_date: '2020-01-01' },
        { id: 2, watched: true, watchCount: 1, name: 'Ep Two', air_date: '2020-01-08' },
      ],
    },
  ],
} as unknown as Series;

const baseProps = {
  series,
  selectedSeasonIndex: 0,
  setSelectedSeasonIndex: vi.fn(),
  setShowRewatchDialog: vi.fn(),
  episodeDiscussionCounts: {},
  warningColor: '#f59e0b',
  currentTheme: theme,
  handleStopRewatch: vi.fn(),
  handleStartRewatch: vi.fn(),
  handleEpisodeQuickToggle: vi.fn<() => Promise<void>>(),
  navigate: vi.fn(),
  fillerByKey: undefined,
};

beforeEach(() => {
  baseProps.setShowRewatchDialog = vi.fn();
  baseProps.handleEpisodeQuickToggle = vi.fn<() => Promise<void>>();
  baseProps.navigate = vi.fn();
});

afterEach(() => cleanup());

describe('SeasonsSection', () => {
  it('renders the season header and its episode rows', () => {
    render(<SeasonsSection {...baseProps} />);
    expect(screen.getByText('Staffeln')).toBeInTheDocument();
    expect(screen.getByText('Staffel 1')).toBeInTheDocument();
    expect(screen.getByText('Ep One')).toBeInTheDocument();
    expect(screen.getByText('Ep Two')).toBeInTheDocument();
  });

  it('navigates to the episode page when an unwatched episode row is clicked', () => {
    render(<SeasonsSection {...baseProps} />);
    fireEvent.click(screen.getByText('Ep One'));
    expect(baseProps.navigate).toHaveBeenCalledWith('/episode/42/s/1/e/1');
  });

  it('quick-toggles an unwatched episode via its number button', () => {
    render(<SeasonsSection {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Episode 1 als gesehen markieren'));
    expect(baseProps.handleEpisodeQuickToggle).toHaveBeenCalledWith(0, 0);
  });

  it('navigates to the management page from the header action', () => {
    render(<SeasonsSection {...baseProps} />);
    fireEvent.click(screen.getByText('Alle verwalten'));
    expect(baseProps.navigate).toHaveBeenCalledWith('/episodes/42');
  });
});
