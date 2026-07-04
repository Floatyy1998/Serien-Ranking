// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { DiscoverItem, ItemCardProps } from './discoverItemHelpers';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (p: { children?: unknown }) =>
      React.createElement(React.Fragment, null, p.children as never),
  };
});

const makeTheme = (): ItemCardProps['currentTheme'] => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return make() as ItemCardProps['currentTheme'];
};
const theme = makeTheme();

const item = (over: Partial<DiscoverItem> = {}): DiscoverItem => ({
  id: 55,
  title: 'Dune',
  poster_path: '/p.jpg',
  overview: 'Sand and spice.',
  vote_average: 8.5,
  release_date: '2021-05-01',
  type: 'movie',
  inList: false,
  ...over,
});

import { ItemCard } from './DiscoverItemCard';

afterEach(() => cleanup());

describe('DiscoverItemCard / ItemCard', () => {
  it('renders the title, year and rating', () => {
    render(
      <ItemCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('reveals the info overlay when the poster is clicked', () => {
    const { container } = render(
      <ItemCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    fireEvent.click(container.querySelector('.discover-poster-wrap') as HTMLElement);
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Sand and spice.')).toBeInTheDocument();
  });

  it('calls onAddToList when the add button is pressed', () => {
    const onAddToList = vi.fn();
    const { container } = render(
      <ItemCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={onAddToList}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    fireEvent.click(container.querySelector('.discover-add-btn') as HTMLElement);
    expect(onAddToList).toHaveBeenCalledTimes(1);
  });

  it('hides the add button for items already in the list', () => {
    const { container } = render(
      <ItemCard
        item={item({ inList: true })}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(container.querySelector('.discover-add-btn')).toBeNull();
  });
});
