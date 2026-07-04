// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Movie } from '../../types/Movie';

vi.mock('../../components/ui', () => ({ BackButton: () => <button aria-label="back" /> }));
vi.mock('../../components/detail', () => ({
  FriendsWhoHaveThis: () => <div />,
  ProviderBadges: () => <div />,
  VideoGallery: () => <div />,
}));
vi.mock('../../lib/providerMerge', () => ({ mergeProviders: () => [] }));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
vi.mock('../../utils/themedPlaceholder', () => ({ buildThemedPlaceholderDataUrl: () => 'ph.jpg' }));
vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { MovieHeroSection } from './MovieHeroSection';

const movie = {
  id: 5,
  title: 'Dune',
  release_date: '2021-09-15',
  runtime: 155,
  status: 'Released',
  poster: { poster: '/p.jpg' },
  genre: { genres: ['Sci-Fi', 'Drama'] },
} as unknown as Movie;

const baseProps = {
  movie,
  id: '5',
  isMobile: false,
  tmdbBackdrop: null,
  tmdbRating: null,
  imdbRating: null,
  providers: null,
  averageRating: 8,
  isWatched: false,
  isReadOnlyTmdbMovie: false,
  isAdding: false,
  getBackdropUrl: (p: string | undefined) => p ?? '',
  formatRuntime: (m: number) => `${m} Min.`,
  onAddMovie: vi.fn(),
};

beforeEach(() => {
  baseProps.onAddMovie = vi.fn();
});
afterEach(() => cleanup());

describe('MovieHeroSection', () => {
  it('renders the movie title, year and genres', () => {
    render(<MovieHeroSection {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
  });

  it('shows the add button for a read-only tmdb movie and invokes onAddMovie', () => {
    render(<MovieHeroSection {...baseProps} isReadOnlyTmdbMovie={true} />);
    fireEvent.click(screen.getByText('+'));
    expect(baseProps.onAddMovie).toHaveBeenCalled();
  });

  it('renders the formatted runtime', () => {
    render(<MovieHeroSection {...baseProps} />);
    expect(screen.getByText(/155 Min\./)).toBeInTheDocument();
  });
});
