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

afterEach(() => cleanup());

describe('SearchResultCard', () => {
  it('renders the title, year, type badge and rating', () => {
    render(
      <SearchResultCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('2017')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(screen.getByText('8.7')).toBeInTheDocument();
  });

  it('calls onAddToList when the add button is pressed', () => {
    const onAddToList = vi.fn();
    const { container } = render(
      <SearchResultCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={onAddToList}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    fireEvent.click(container.querySelector('.search-add-btn') as HTMLElement);
    expect(onAddToList).toHaveBeenCalledTimes(1);
  });

  it('shows the check badge instead of the add button when already in the list', () => {
    const { container } = render(
      <SearchResultCard
        item={item({ inList: true })}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(container.querySelector('.search-add-btn')).toBeNull();
    expect(container.querySelector('.search-check-badge')).not.toBeNull();
  });

  it('calls onItemClick when the poster is clicked', () => {
    const onItemClick = vi.fn();
    const { container } = render(
      <SearchResultCard
        item={item()}
        onItemClick={onItemClick}
        onAddToList={vi.fn()}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    fireEvent.click(container.querySelector('.search-result-poster-btn') as HTMLElement);
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });
});
