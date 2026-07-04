// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { DynamicTheme } from '../../theme/dynamicTheme';
import type { Series } from '../../types/Series';

vi.mock('@mui/icons-material/Check', () => ({ default: () => null }));
vi.mock('./EpisodeActionSheet', () => ({
  EpisodeActionSheet: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="action-sheet">{isOpen ? 'open' : 'closed'}</div>
  ),
}));
vi.mock('../../components/Discussion', () => ({
  DiscussionThread: () => <div data-testid="discussion-thread" />,
}));
vi.mock('../../components/ui', () => ({
  Dialog: ({ open, title }: { open: boolean; title: string }) =>
    open ? <div data-testid="dialog">{title}</div> : null,
}));
vi.mock('../../lib/episode/seriesMetrics', () => ({
  calculateSeriesMetrics: () => ({ progress: 1 }),
}));

import { SeriesDetailDialogs } from './SeriesDetailDialogs';

const theme = {
  status: { success: '#22c55e' },
  text: { secondary: '#ddd' },
  shadow: { card: '0 1px 2px #000' },
} as unknown as DynamicTheme;

const series = { id: 42, title: 'Lost', poster: { poster: '/p.jpg' } } as unknown as Series;

const baseProps = {
  series,
  showRewatchDialog: { show: false, type: 'episode' as const, item: null },
  setShowRewatchDialog: vi.fn(),
  handleEpisodeRewatch: vi.fn<() => Promise<void>>(),
  handleEpisodeUnwatch: vi.fn<() => Promise<void>>(),
  dialog: { open: false, message: '', type: 'info' as const },
  setDialog: vi.fn(),
  snackbar: { open: false, message: '' },
  currentTheme: theme,
  navigate: vi.fn(),
};

afterEach(() => cleanup());

describe('SeriesDetailDialogs', () => {
  it('renders the discussion thread and episode action sheet', () => {
    render(<SeriesDetailDialogs {...baseProps} />);
    expect(screen.getByTestId('discussion-thread')).toBeInTheDocument();
    expect(screen.getByTestId('action-sheet')).toHaveTextContent('closed');
  });

  it('shows the snackbar message when the snackbar is open', () => {
    render(
      <SeriesDetailDialogs {...baseProps} snackbar={{ open: true, message: 'Gespeichert' }} />
    );
    expect(screen.getByText('Gespeichert')).toBeInTheDocument();
  });

  it('shows the confirmation dialog title when the dialog is open', () => {
    render(
      <SeriesDetailDialogs
        {...baseProps}
        dialog={{ open: true, message: 'Sicher?', type: 'warning' }}
      />
    );
    expect(screen.getByTestId('dialog')).toHaveTextContent('Bestätigung');
  });
});
