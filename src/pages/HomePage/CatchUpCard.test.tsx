// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatchUpCard } from './CatchUpCard';

const navigateMock = vi.hoisted(() => vi.fn());
const seriesState = vi.hoisted(() => ({ list: [] as unknown[] }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { defaultDynamicTheme } = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: defaultDynamicTheme }) };
});

vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: seriesState.list }),
}));

// hasEpisodeAired is the only thing consumed from this module; force "aired".
vi.mock('../../utils/episodeDate', () => ({ hasEpisodeAired: () => true }));

const seriesWithBacklog = {
  seasons: [{ episodes: [{ watched: false, runtime: 30 }] }],
  episodeRuntime: 45,
};

beforeEach(() => {
  navigateMock.mockReset();
  seriesState.list = [];
});

afterEach(cleanup);

describe('CatchUpCard', () => {
  it('renders nothing when there is no backlog', () => {
    seriesState.list = [{ seasons: [{ episodes: [{ watched: true }] }] }];
    render(<CatchUpCard />);
    expect(screen.queryByText('Backlog')).toBeNull();
  });

  it('renders backlog stats when unwatched aired episodes exist', () => {
    seriesState.list = [seriesWithBacklog];
    render(<CatchUpCard />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText(/1 Serien/)).toBeInTheDocument();
    expect(screen.getByText('30 Min')).toBeInTheDocument();
  });

  it('navigates to /catch-up when clicked', () => {
    seriesState.list = [seriesWithBacklog];
    render(<CatchUpCard />);
    fireEvent.click(screen.getByRole('button'));
    expect(navigateMock).toHaveBeenCalledWith('/catch-up');
  });
});
