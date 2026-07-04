// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MediaCarouselSection } from './MediaCarouselSection';
import type { MediaItem } from './mediaCarouselTypes';

vi.mock('../../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));
vi.mock('../../../components/ui', () => ({
  SectionHeader: ({ title, onSeeAll }: { title?: string; onSeeAll?: () => void }) => (
    <div>
      <span>{title}</span>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll}>
          see-all
        </button>
      )}
    </div>
  ),
  HorizontalScrollContainer: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SkeletonPosterRow: () => <div data-testid="skeleton" />,
}));
vi.mock('./CinematicPosterCard', () => ({
  CinematicPosterCard: ({ item }: { item: MediaItem }) => (
    <div data-testid="cinematic">{item.title}</div>
  ),
}));
vi.mock('./TrendingRankCard', () => ({
  TrendingRankCard: ({ item, index }: { item: MediaItem; index: number }) => (
    <div data-testid="trending">
      {index + 1}-{item.title}
    </div>
  ),
}));

afterEach(cleanup);

const items: MediaItem[] = [
  { id: 1, title: 'Dune', poster: 'p1', type: 'movie' },
  { id: 2, title: 'Severance', poster: 'p2', type: 'series' },
];

const renderT = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe('MediaCarouselSection', () => {
  it('shows a skeleton row while loading with no items yet', () => {
    renderT(<MediaCarouselSection variant="seasonal" items={[]} title="Neu" loading />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders nothing when there are no items and not loading', () => {
    const { container } = renderT(
      <MediaCarouselSection variant="seasonal" items={[]} title="Neu" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders TrendingRankCard for the trending variant', () => {
    renderT(<MediaCarouselSection variant="trending" items={items} title="Trending" />);
    const cards = screen.getAllByTestId('trending');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('1-Dune');
  });

  it('renders CinematicPosterCard for non-trending variants and wires onSeeAll', () => {
    const onSeeAll = vi.fn();
    renderT(
      <MediaCarouselSection variant="top-rated" items={items} title="Top" onSeeAll={onSeeAll} />
    );
    expect(screen.getAllByTestId('cinematic')).toHaveLength(2);
    fireEvent.click(screen.getByText('see-all'));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});
