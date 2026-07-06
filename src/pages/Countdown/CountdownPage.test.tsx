// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SeriesCountdown } from '../../hooks/useSeriesCountdowns';

vi.mock(
  '@mui/icons-material',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : typeof p === 'symbol' || p === 'then'
              ? undefined
              : () => null,
        has: () => true,
      }
    )
);

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'variants', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const data = vi.hoisted(() => ({
  countdowns: [] as SeriesCountdown[],
  loading: false,
}));
vi.mock('../../hooks/useSeriesCountdowns', () => ({ useSeriesCountdowns: () => data }));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  SkeletonListRow: () => <div data-testid="skeleton" />,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('./CountdownHeroCard', () => ({
  CountdownHeroCard: ({ item, onClick }: { item: SeriesCountdown; onClick: () => void }) => (
    <button data-testid="hero" onClick={onClick}>
      {item.title}
    </button>
  ),
}));
vi.mock('./CountdownListItem', () => ({
  CountdownListItem: ({ item, onClick }: { item: SeriesCountdown; onClick: () => void }) => (
    <button data-testid="list-item" onClick={onClick}>
      {item.title}
    </button>
  ),
}));

const item = (id: number, title: string): SeriesCountdown => ({
  seriesId: id,
  title,
  posterUrl: '',
  nextDate: '2030-01-01',
  daysUntil: 5,
  seasonNumber: 2,
  type: 'season-start',
});

import { CountdownPage } from './CountdownPage';

afterEach(() => {
  cleanup();
  data.countdowns = [];
  data.loading = false;
  navigate.mockClear();
});

describe('CountdownPage', () => {
  it('renders skeletons while loading', () => {
    data.loading = true;
    render(<CountdownPage />);
    expect(screen.getByLabelText('Countdowns werden geladen')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('shows the empty state when there are no countdowns', () => {
    render(<CountdownPage />);
    expect(screen.getByText('Keine kommenden Staffeln')).toBeInTheDocument();
  });

  it('renders the hero and list items', () => {
    data.countdowns = [item(1, 'Alpha'), item(2, 'Beta')];
    render(<CountdownPage />);
    expect(screen.getByTestId('hero')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('list-item')).toHaveTextContent('Beta');
    expect(screen.getByText('Weitere (1)')).toBeInTheDocument();
  });

  it('navigates to the series when the hero is clicked', () => {
    data.countdowns = [item(42, 'Alpha')];
    render(<CountdownPage />);
    fireEvent.click(screen.getByTestId('hero'));
    expect(navigate).toHaveBeenCalledWith('/series/42');
  });
});
