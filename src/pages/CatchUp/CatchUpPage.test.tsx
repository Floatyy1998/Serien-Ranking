// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { useCatchUpDataMock } = vi.hoisted(() => ({ useCatchUpDataMock: vi.fn() }));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition', 'variants']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
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

vi.mock('../../components/ui', async () => {
  const React = await import('react');
  return {
    PageHeader: (props: { title: string; actions?: React.ReactNode }) => (
      <div>
        <h1>{props.title}</h1>
        {props.actions}
      </div>
    ),
    PageLayout: React.forwardRef(function PageLayout(
      props: { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>
    ) {
      return <div ref={ref}>{props.children}</div>;
    }),
    ScrollToTopButton: () => null,
  };
});

vi.mock('./useCatchUpData', () => ({ useCatchUpData: useCatchUpDataMock }));
vi.mock('./HeroStats', () => ({ HeroStats: () => <div>CU_HERO</div> }));
vi.mock('./SortToolbar', () => ({ SortToolbar: () => <div>CU_SORT</div> }));
vi.mock('./SeriesCard', () => ({ SeriesCard: () => <div>CU_CARD</div> }));
vi.mock('./EmptyState', () => ({ EmptyState: () => <div>CU_EMPTY</div> }));

import { CatchUpPage } from './CatchUpPage';

const baseReturn = {
  catchUpData: [] as unknown[],
  sortedData: [] as unknown[],
  totals: { totalEpisodes: 0, totalMinutes: 0, avgProgress: 0 },
  sortBy: 'episodes',
  sortDirection: 'desc',
  handleSortClick: vi.fn(),
  currentLabel: 'Meiste Episoden',
  scrollContainerRef: { current: null },
};

beforeEach(() => {
  useCatchUpDataMock.mockReturnValue({ ...baseReturn });
});
afterEach(() => cleanup());

describe('CatchUpPage', () => {
  it('renders the header and the empty state when there is no data', () => {
    render(<CatchUpPage />);
    expect(screen.getByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.getByText('CU_EMPTY')).toBeInTheDocument();
    expect(screen.queryByText('CU_HERO')).not.toBeInTheDocument();
  });

  it('renders hero stats, toolbar and a card per series when data exists', () => {
    useCatchUpDataMock.mockReturnValue({
      ...baseReturn,
      catchUpData: [{ series: { id: 1 } }, { series: { id: 2 } }],
      sortedData: [{ series: { id: 1 } }, { series: { id: 2 } }],
    });
    render(<CatchUpPage />);
    expect(screen.getByText('CU_HERO')).toBeInTheDocument();
    expect(screen.getByText('CU_SORT')).toBeInTheDocument();
    expect(screen.getAllByText('CU_CARD')).toHaveLength(2);
    expect(screen.getByText('2 Serien')).toBeInTheDocument();
    expect(screen.queryByText('CU_EMPTY')).not.toBeInTheDocument();
  });
});
