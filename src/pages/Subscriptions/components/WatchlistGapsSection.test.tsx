// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WatchlistGapsSection } from './WatchlistGapsSection';
import type { WatchlistGap } from '../../../hooks/useSubscriptionsData';
import type { Series } from '../../../types/Series';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: '/subscriptions' }),
}));

const theme = vi.hoisted(() => ({
  currentTheme: {
    primary: '#00d123',
    secondary: '#8b5cf6',
    accent: '#8b5cf6',
    background: { default: '#000', surface: '#111', surfaceHover: '#222', card: '#0a0a0a' },
    text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
    border: { default: '#333' },
    status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
  },
}));
vi.mock('../../../contexts/ThemeContextDef', () => ({ useTheme: () => theme }));

const makeGap = (id: number, title: string, providers: string[]): WatchlistGap => ({
  series: { id, title, original_name: title, poster: { poster: '' } } as unknown as Series,
  providers,
});

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('WatchlistGapsSection', () => {
  it('shows the no-subscriptions empty state', () => {
    render(<WatchlistGapsSection watchlistGaps={[]} activeCount={0} />);
    expect(
      screen.getByText(
        'Sobald du Abos markierst, zeigen wir hier Serien, die du sonst nirgends streamen kannst.'
      )
    ).toBeInTheDocument();
  });

  it('shows the no-gaps empty state when there are active subscriptions', () => {
    render(<WatchlistGapsSection watchlistGaps={[]} activeCount={3} />);
    expect(
      screen.getByText('Alle Watchlist-Serien laufen auf deinen aktiven Abos.')
    ).toBeInTheDocument();
  });

  it('renders gaps and navigates to the series on click', () => {
    render(
      <WatchlistGapsSection
        watchlistGaps={[makeGap(77, 'Severance', ['Apple TV Plus'])]}
        activeCount={2}
      />
    );
    expect(screen.getByText('Severance')).toBeInTheDocument();
    expect(screen.getByText('Apple TV Plus')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Severance'));
    expect(navigate).toHaveBeenCalledWith('/series/77');
  });
});
