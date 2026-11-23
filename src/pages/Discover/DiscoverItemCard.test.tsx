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

const providers = vi.hoisted(() => ({ list: [] as { name: string; logo: string }[] }));
vi.mock('../../hooks/provider/useItemProviders', () => ({
  useItemProviders: () => providers.list,
}));

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

afterEach(() => {
  cleanup();
  providers.list = [];
});

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

  it('zeigt die Provider-Logos auf dem Poster, aber nicht unter dem Info-Overlay', () => {
    providers.list = [{ name: 'Netflix', logo: 'https://img/nf.jpg' }];
    render(
      <ItemCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop
      />
    );
    expect(screen.getByAltText('Netflix')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Dune'));
    expect(screen.queryByAltText('Netflix')).toBeNull();
  });

  it('offers "watched" on movies and passes whether the title is already listed', () => {
    const onMarkWatched = vi.fn();
    render(
      <ItemCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        quickStatus={{ added: false, ownRating: 0, watched: false, busyAction: null }}
        onMarkWatched={onMarkWatched}
        onRate={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    fireEvent.click(screen.getByLabelText('„Dune" hinzufügen und als gesehen markieren'));
    expect(onMarkWatched).toHaveBeenCalledWith(
      expect.objectContaining({ id: 55 }),
      false,
      expect.anything()
    );
  });

  it('hides "watched" for series and for movies already watched', () => {
    const status = { added: true, ownRating: 0, watched: true, busyAction: null };
    const { container, rerender } = render(
      <ItemCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        quickStatus={status}
        onMarkWatched={vi.fn()}
        onRate={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(container.querySelector('.discover-watched-btn')).toBeNull();
    rerender(
      <ItemCard
        item={item({ type: 'series' })}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        quickStatus={{ ...status, added: false, watched: false }}
        onMarkWatched={vi.fn()}
        onRate={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(container.querySelector('.discover-watched-btn')).toBeNull();
  });

  it('swaps the add button for the own rating once the title is listed', () => {
    const onRate = vi.fn();
    const { container } = render(
      <ItemCard
        item={item()}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        quickStatus={{ added: true, ownRating: 8.5, watched: true, busyAction: null }}
        onMarkWatched={vi.fn()}
        onRate={onRate}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(container.querySelector('.discover-add-btn')).toBeNull();
    fireEvent.click(container.querySelector('.discover-rate-btn') as HTMLElement);
    expect(onRate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 55 }),
      8.5,
      expect.anything()
    );
  });

  it('shows the match and falls back to the matching genres as the reason', () => {
    render(
      <ItemCard
        item={item({ match: 86, fitGenres: [80, 18] })}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(screen.getByText('86 %')).toBeInTheDocument();
    expect(screen.getByText('Trifft deinen Geschmack: Krimi, Drama')).toBeInTheDocument();
  });

  it('prefers the favourites behind a title over the genre reason', () => {
    render(
      <ItemCard
        item={item({ match: 91, fitGenres: [80], basedOn: 'Heat' })}
        onItemClick={vi.fn()}
        onAddToList={vi.fn()}
        addingItem={null}
        currentTheme={theme}
        isDesktop={false}
      />
    );
    expect(screen.getByText('Weil du „Heat" magst')).toBeInTheDocument();
    expect(screen.queryByText(/Trifft deinen Geschmack/)).toBeNull();
  });
});
