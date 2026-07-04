// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContextDef';
import type { PreparedItem } from './useRatingsData';

vi.mock('@mui/icons-material', () => ({ Star: () => null, WatchLater: () => null }));

import { RatingItemCard } from './RatingItemCard';

const theme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
  status: { success: '#4cd137', error: '#e74c3c', warning: '#f5a623', info: '#3498db' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const item: PreparedItem = {
  id: 1,
  title: 'Dark',
  posterUrl: 'https://example.com/p.jpg',
  rating: 8.4,
  progress: 50,
  isMovie: false,
  watchlist: true,
  year: '2017',
  genres: 'Drama',
  providers: [{ name: 'Netflix', logo: 'https://example.com/n.png' }],
};

afterEach(() => cleanup());

describe('RatingItemCard', () => {
  it('renders the title, rating and year', () => {
    render(<RatingItemCard item={item} theme={theme} />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('8.4')).toBeInTheDocument();
    expect(screen.getByText('2017')).toBeInTheDocument();
  });

  it('renders the series progress percentage', () => {
    render(<RatingItemCard item={item} theme={theme} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows "Fertig" when a series is fully watched', () => {
    render(<RatingItemCard item={{ ...item, progress: 100 }} theme={theme} />);
    expect(screen.getByText('Fertig')).toBeInTheDocument();
  });
});
