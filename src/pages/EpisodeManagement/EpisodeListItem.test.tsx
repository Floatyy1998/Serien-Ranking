// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Series } from '../../types/Series';

type Episode = Series['seasons'][number]['episodes'][number];

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

vi.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

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

const episode = (over: Partial<Episode> = {}): Episode =>
  ({
    id: 501,
    name: 'Ozymandias',
    air_date: '2013-09-15',
    watched: false,
    watchCount: 0,
    ...over,
  }) as unknown as Episode;

import { EpisodeListItem } from './EpisodeListItem';

afterEach(() => {
  cleanup();
  navigate.mockClear();
});

describe('EpisodeListItem', () => {
  it('renders the episode name and 1-based number', () => {
    render(
      <EpisodeListItem
        episode={episode()}
        index={4}
        seriesId="1"
        seasonNumber={5}
        discussionCount={0}
        onEpisodeClick={vi.fn()}
      />
    );
    expect(screen.getByText('Ozymandias')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onEpisodeClick when the row is pressed', () => {
    const onEpisodeClick = vi.fn();
    render(
      <EpisodeListItem
        episode={episode()}
        index={0}
        seriesId="1"
        seasonNumber={1}
        discussionCount={0}
        onEpisodeClick={onEpisodeClick}
      />
    );
    fireEvent.click(screen.getByText('Ozymandias'));
    expect(onEpisodeClick).toHaveBeenCalledTimes(1);
  });

  it('shows the discussion count and navigates on discussion click', () => {
    render(
      <EpisodeListItem
        episode={episode()}
        index={5}
        seriesId="9"
        seasonNumber={1}
        discussionCount={3}
        onEpisodeClick={vi.fn()}
      />
    );
    const badge = screen.getByText('3');
    fireEvent.click(badge);
    expect(navigate).toHaveBeenCalledWith('/episode/9/s/1/e/6');
  });

  it('renders a watch-count badge for rewatched episodes', () => {
    render(
      <EpisodeListItem
        episode={episode({ watched: true, watchCount: 2 })}
        index={0}
        seriesId="1"
        seasonNumber={1}
        discussionCount={0}
        onEpisodeClick={vi.fn()}
      />
    );
    expect(screen.getByText('2x')).toBeInTheDocument();
  });
});
