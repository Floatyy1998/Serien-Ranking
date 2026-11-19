// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SeriesCountdown } from '../../hooks/watch/useSeriesCountdowns';
import type { CountdownItem } from '../../hooks/watch/useCountdowns';
import type { MovieCountdown } from '../../lib/watch/movieCountdown';

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
  seriesCountdowns: [] as SeriesCountdown[],
  movieCountdowns: [] as MovieCountdown[],
  loading: false,
}));
vi.mock('../../hooks/watch/useCountdowns', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCountdowns: () => ({
    ...data,
    countdowns: [...data.seriesCountdowns, ...data.movieCountdowns].sort(
      (a, b) => a.daysUntil - b.daysUntil
    ),
  }),
}));
vi.mock('../../hooks/watch/useCatchUpPlans', () => ({ useCatchUpPlans: () => new Map() }));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  SkeletonListRow: () => <div data-testid="skeleton" />,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  TabSwitcher: ({
    tabs,
    onTabChange,
  }: {
    tabs: { id: string; label: string; count?: number }[];
    onTabChange: (id: string) => void;
  }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.id} data-testid={`tab-${tab.id}`} onClick={() => onTabChange(tab.id)}>
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./CountdownHeroCard', () => ({
  CountdownHeroCard: ({ item, onClick }: { item: CountdownItem; onClick: () => void }) => (
    <button data-testid="hero" onClick={onClick}>
      {item.title}
    </button>
  ),
}));
vi.mock('./CountdownListItem', () => ({
  CountdownListItem: ({ item, onClick }: { item: CountdownItem; onClick: () => void }) => (
    <button data-testid="list-item" onClick={onClick}>
      {item.title}
    </button>
  ),
}));

const item = (id: number, title: string, daysUntil = 5): SeriesCountdown => ({
  seriesId: id,
  title,
  posterUrl: '',
  nextDate: '2030-01-01',
  daysUntil,
  seasonNumber: 2,
  type: 'season-start',
});

const movie = (id: number, title: string, daysUntil = 5): MovieCountdown => ({
  type: 'movie-release',
  movieId: id,
  title,
  posterUrl: '',
  nextDate: '2030-01-01',
  daysUntil,
  release: 'cinema',
});

import { CountdownPage } from './CountdownPage';

afterEach(() => {
  cleanup();
  data.seriesCountdowns = [];
  data.movieCountdowns = [];
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
    expect(screen.getByText('Keine kommenden Starts')).toBeInTheDocument();
  });

  it('renders the hero and list items', () => {
    data.seriesCountdowns = [item(1, 'Alpha'), item(2, 'Beta')];
    render(<CountdownPage />);
    expect(screen.getByTestId('hero')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('list-item')).toHaveTextContent('Beta');
    expect(screen.getByText('Weitere (1)')).toBeInTheDocument();
  });

  it('navigates to the series when the hero is clicked', () => {
    data.seriesCountdowns = [item(42, 'Alpha')];
    render(<CountdownPage />);
    fireEvent.click(screen.getByTestId('hero'));
    expect(navigate).toHaveBeenCalledWith('/series/42');
  });

  it('führt bei einem Film zur Filmseite', () => {
    data.movieCountdowns = [movie(42, 'Dune')];
    render(<CountdownPage />);
    fireEvent.click(screen.getByTestId('hero'));
    expect(navigate).toHaveBeenCalledWith('/movie/42');
  });

  it('mischt Serien und Filme nach Tagen und hält gleiche IDs auseinander', () => {
    data.seriesCountdowns = [item(7, 'Serie', 9)];
    data.movieCountdowns = [movie(7, 'Film', 3)];
    render(<CountdownPage />);
    expect(screen.getByTestId('hero')).toHaveTextContent('Film');
    expect(screen.getByTestId('list-item')).toHaveTextContent('Serie');
  });

  it('zeigt den Filter nur, wenn es Serien und Filme gibt', () => {
    data.seriesCountdowns = [item(1, 'Serie')];
    render(<CountdownPage />);
    expect(screen.queryByTestId('tab-movies')).toBeNull();
  });

  it('filtert auf Filme und zurück auf alle', () => {
    data.seriesCountdowns = [item(1, 'Serie', 2)];
    data.movieCountdowns = [movie(2, 'Film', 8)];
    render(<CountdownPage />);
    expect(screen.getByTestId('tab-all')).toHaveTextContent('Alle (2)');
    fireEvent.click(screen.getByTestId('tab-movies'));
    expect(screen.getByTestId('hero')).toHaveTextContent('Film');
    expect(screen.queryByTestId('list-item')).toBeNull();
    fireEvent.click(screen.getByTestId('tab-series'));
    expect(screen.getByTestId('hero')).toHaveTextContent('Serie');
    fireEvent.click(screen.getByTestId('tab-all'));
    expect(screen.getByTestId('list-item')).toHaveTextContent('Film');
  });
});
