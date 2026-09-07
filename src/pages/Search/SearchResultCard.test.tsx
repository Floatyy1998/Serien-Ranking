// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SearchResultCardProps } from './SearchResultCard';
import type { SearchResult } from './useSearchPage';

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
  const skip = new Set(['initial', 'animate', 'exit', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

const makeTheme = (): SearchResultCardProps['currentTheme'] => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return make() as SearchResultCardProps['currentTheme'];
};
const theme = makeTheme();

const item = (over: Partial<SearchResult> = {}): SearchResult => ({
  id: 3,
  name: 'Dark',
  poster_path: '/p.jpg',
  first_air_date: '2017-12-01',
  vote_average: 8.7,
  type: 'series',
  inList: false,
  ...over,
});

import { SearchResultCard } from './SearchResultCard';

const renderCard = (over: Partial<SearchResultCardProps> = {}) => {
  const props: SearchResultCardProps = {
    item: item(),
    onItemClick: vi.fn(),
    onAddToList: vi.fn(),
    onRate: vi.fn(),
    onMarkWatched: vi.fn(),
    currentTheme: theme,
    isDesktop: false,
    ...over,
  };
  return { ...render(<SearchResultCard {...props} />), props };
};

afterEach(() => cleanup());

describe('SearchResultCard', () => {
  it('renders the title, year, type badge and rating', () => {
    renderCard();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('2017')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(screen.getByText('8.7')).toBeInTheDocument();
  });

  it('calls onAddToList when the add button is pressed', () => {
    const { container, props } = renderCard();
    fireEvent.click(container.querySelector('.search-add-btn') as HTMLElement);
    expect(props.onAddToList).toHaveBeenCalledTimes(1);
  });

  it('shows a rate button instead of the add button when already in the list', () => {
    const { container, props } = renderCard({ item: item({ inList: true }) });
    expect(container.querySelector('.search-add-btn')).toBeNull();
    const rateBtn = container.querySelector('.search-rate-btn') as HTMLElement;
    expect(rateBtn).not.toBeNull();
    expect(rateBtn.getAttribute('aria-label')).toBe('„Dark" bewerten');
    fireEvent.click(rateBtn);
    expect(props.onRate).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
    expect(props.onItemClick).not.toHaveBeenCalled();
  });

  it('shows the own rating on the rate button once rated', () => {
    const { container } = renderCard({ item: item({ inList: true, userRating: 8.5 }) });
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(container.querySelector('.search-rate-btn')?.getAttribute('aria-label')).toBe(
      '„Dark" ist mit 8.5 bewertet. Bewertung ändern'
    );
  });

  it('offers "add and mark watched" for movies that are not watched yet', () => {
    const movie = item({ id: 9, name: undefined, title: 'Heat', type: 'movie', watched: false });
    const { container, props } = renderCard({ item: movie });
    const watchedBtn = container.querySelector('.search-watched-btn') as HTMLElement;
    expect(watchedBtn.getAttribute('aria-label')).toBe(
      '„Heat" hinzufügen und als gesehen markieren'
    );
    fireEvent.click(watchedBtn);
    expect(props.onMarkWatched).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }));
    expect(props.onAddToList).not.toHaveBeenCalled();
  });

  it('labels the watched button differently when the movie is already in the list', () => {
    const movie = item({ id: 9, title: 'Heat', type: 'movie', inList: true, watched: false });
    const { container } = renderCard({ item: movie });
    expect(container.querySelector('.search-watched-btn')?.getAttribute('aria-label')).toBe(
      '„Heat" als gesehen markieren'
    );
    expect(container.querySelector('.search-rate-btn')).not.toBeNull();
  });

  it('hides the watched button for series and for watched movies', () => {
    const { container: series } = renderCard();
    expect(series.querySelector('.search-watched-btn')).toBeNull();
    const { container: watched } = renderCard({
      item: item({ type: 'movie', inList: true, watched: true }),
    });
    expect(watched.querySelector('.search-watched-btn')).toBeNull();
  });

  it('disables both action buttons while an action is pending', () => {
    const { container } = renderCard({
      item: item({ type: 'movie', watched: false }),
      isWatchedPending: true,
    });
    expect((container.querySelector('.search-add-btn') as HTMLButtonElement).disabled).toBe(true);
    expect((container.querySelector('.search-watched-btn') as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('calls onItemClick when the poster is clicked', () => {
    const { container, props } = renderCard();
    fireEvent.click(container.querySelector('.search-result-poster-btn') as HTMLElement);
    expect(props.onItemClick).toHaveBeenCalledTimes(1);
  });
});
