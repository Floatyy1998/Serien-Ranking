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
  seriesId: 1,
  title: 'Severance',
  posterUrl: 'https://img/poster.jpg',
  nextDate: '2030-06-15',
  daysUntil: 12,
  seasonNumber: 3,
  type: 'season-start',
  ...over,
});

import { CountdownHeroCard } from './CountdownHeroCard';

afterEach(() => cleanup());

describe('CountdownHeroCard', () => {
  it('renders the title, season and remaining days', () => {
    render(<CountdownHeroCard item={base()} onClick={vi.fn()} />);
    expect(screen.getByText('Severance')).toBeInTheDocument();
    expect(screen.getByText('Neue Staffel')).toBeInTheDocument();
    expect(screen.getByText('Staffel 3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Tage')).toBeInTheDocument();
  });

  it('shows "Heute" when the season starts today', () => {
    render(<CountdownHeroCard item={base({ daysUntil: 0 })} onClick={vi.fn()} />);
    expect(screen.getByText('Heute')).toBeInTheDocument();
  });

  it('labels mid-season returns as "Rückkehr"', () => {
    render(<CountdownHeroCard item={base({ type: 'mid-season-return' })} onClick={vi.fn()} />);
    expect(screen.getByText('Rückkehr')).toBeInTheDocument();
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<CountdownHeroCard item={base()} onClick={onClick} />);
    fireEvent.click(screen.getByText('Severance'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
