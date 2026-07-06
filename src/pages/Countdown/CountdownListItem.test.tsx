// @vitest-environment jsdom
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

const base = (over: Partial<SeriesCountdown> = {}): SeriesCountdown => ({
  seriesId: 7,
  title: 'The Bear',
  posterUrl: 'https://img/poster.jpg',
  nextDate: '2030-03-01',
  daysUntil: 1,
  seasonNumber: 4,
  type: 'season-start',
  ...over,
});

import { CountdownListItem } from './CountdownListItem';

afterEach(() => cleanup());

describe('CountdownListItem', () => {
  it('renders the title and singular day label', () => {
    render(<CountdownListItem item={base()} index={0} onClick={vi.fn()} />);
    expect(screen.getByText('The Bear')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Tag')).toBeInTheDocument();
  });

  it('shows "Heute" when zero days remain', () => {
    render(<CountdownListItem item={base({ daysUntil: 0 })} index={1} onClick={vi.fn()} />);
    expect(screen.getByText('Heute')).toBeInTheDocument();
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<CountdownListItem item={base()} index={2} onClick={onClick} />);
    fireEvent.click(screen.getByText('The Bear'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
