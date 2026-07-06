// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContext';
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

// Ring-Draw-In (useDrawInProgress) soll im Test sofort den Zielwert setzen:
// prefers-reduced-motion melden → Hook nimmt den Instant-Pfad.
window.matchMedia = ((query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

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

  it('D1: zeichnet den Fortschritts-Ring für Serien mit Fortschritt', () => {
    const { container } = render(<RatingItemCard item={item} theme={theme} />);
    const card = container.querySelector('.ratings-card');
    expect(card).toHaveClass('ratings-card--ring');
    expect(card).not.toHaveClass('ratings-card--ring-done');
    expect((card as HTMLElement).style.getPropertyValue('--prog')).toBe('50');
  });

  it('D1: markiert komplett gesehene Serien als ring-done (Success-Farbe)', () => {
    const { container } = render(
      <RatingItemCard item={{ ...item, progress: 100 }} theme={theme} />
    );
    const card = container.querySelector('.ratings-card') as HTMLElement;
    expect(card).toHaveClass('ratings-card--ring-done');
    expect(card.style.getPropertyValue('--ring-color')).toBe('#4cd137');
  });

  it('D1: Filme bekommen keinen Ring', () => {
    const { container } = render(
      <RatingItemCard item={{ ...item, isMovie: true, progress: 0 }} theme={theme} />
    );
    expect(container.querySelector('.ratings-card')).not.toHaveClass('ratings-card--ring');
  });
});
