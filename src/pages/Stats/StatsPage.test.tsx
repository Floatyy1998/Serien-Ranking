// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@mui/icons-material', () => ({ IosShare: () => null }));

const { theme, stats } = vi.hoisted(() => ({
  theme: {
    primary: '#3355ff',
    accent: '#22d3ee',
    text: { primary: '#ffffff' },
  },
  stats: {
    totalMinutes: 5000,
    seriesMinutes: 4000,
    movieMinutes: 1000,
    avgSeriesRating: 8,
    avgMovieRating: 7,
    topGenres: [],
    topProviders: [],
    lastWeekWatched: 3,
  },
}));

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ currentTheme: theme }) }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('./useStatsData', () => ({
  useStatsData: () => stats,
  formatTime: () => ({ value: '3', unit: 'Tage', details: '', breakdown: [] }),
}));
vi.mock('./StatsComponents', () => ({
  ActorUniverseBanner: () => <div data-testid="actor-banner" />,
  WatchtimePod: () => <div data-testid="watchtime" />,
  ProgressPod: () => null,
  QuickPods: () => null,
  RatingsSection: () => null,
  TopGenresSection: () => null,
  TopProvidersSection: () => null,
}));
vi.mock('./StatsShareCard', () => ({
  StatsShareSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="share-sheet" /> : null,
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../components/ui', () => ({
  IconButton: ({ onClick, ariaLabel }: { onClick: () => void; ariaLabel: string }) => (
    <button aria-label={ariaLabel} onClick={onClick} />
  ),
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { StatsPage } from './StatsPage';

afterEach(() => cleanup());

describe('StatsPage', () => {
  it('renders the header and the watchtime pod', () => {
    render(<StatsPage />);
    expect(screen.getByText('Statistiken')).toBeInTheDocument();
    expect(screen.getByTestId('watchtime')).toBeInTheDocument();
  });

  it('opens the share sheet when the share button is clicked', () => {
    render(<StatsPage />);
    expect(screen.queryByTestId('share-sheet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Statistiken als Bild teilen'));
    expect(screen.getByTestId('share-sheet')).toBeInTheDocument();
  });
});
