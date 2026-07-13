// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Movie } from '../../types/Movie';

// framer-motion's motion-value lifecycle throws in the jsdom test env
// (`removeOnChange is not a function`); a prop-stripping passthrough is enough here.
vi.mock('framer-motion', async () => {
  const { createElement, forwardRef, Fragment } = await import('react');
  const SKIP = new Set([
    'initial',
    'animate',
    'exit',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'transition',
    'layout',
    'layoutId',
    'drag',
    'dragConstraints',
    'onViewportEnter',
    'onViewportLeave',
    'variants',
    'custom',
    'onAnimationStart',
    'onAnimationComplete',
  ]);
  const make = (tag: string) =>
    forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const k in props) if (!SKIP.has(k)) clean[k] = props[k];
      return createElement(tag, { ...clean, ref });
    });
  const cache: Record<string, unknown> = {};
  const motion = new Proxy(
    {},
    { get: (_t: object, tag: string | symbol) => (cache[String(tag)] ??= make(String(tag))) }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      createElement(Fragment, null, children),
    useMotionValue: (v: unknown) => ({ get: () => v, set: () => {} }),
    useSpring: (v: unknown) => v,
    useTransform: () => ({ get: () => 0, set: () => {} }),
    useMotionTemplate: () => '',
  };
});

vi.mock('../../components/ui', () => ({ BackButton: () => <button aria-label="back" /> }));
vi.mock('../../components/detail', () => ({
  FriendsWhoHaveThis: () => <div />,
  ProviderBadges: () => <div />,
  VideoGallery: () => <div />,
}));
vi.mock('../../components/recommendations/RecommendButton', () => ({
  RecommendButton: () => <button aria-label="empfehlen" />,
}));
vi.mock('../../lib/providerMerge', () => ({ mergeProviders: () => [] }));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
vi.mock('../../utils/themedPlaceholder', () => ({ buildThemedPlaceholderDataUrl: () => 'ph.jpg' }));
vi.mock('../../contexts/ThemeContext', () => {
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
  onNavigateRate: vi.fn(),
  onToggleWatched: vi.fn(),
  onDeleteClick: vi.fn(),
};

beforeEach(() => {
  baseProps.onAddMovie = vi.fn();
  baseProps.onNavigateRate = vi.fn();
  baseProps.onToggleWatched = vi.fn();
  baseProps.onDeleteClick = vi.fn();
});
afterEach(() => cleanup());

describe('MovieHeroSection', () => {
  it('renders the movie title, year and genres', () => {
    render(<MovieHeroSection {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    // Genres werden seit dem Redesign gemeinsam in einem Span gerendert
    expect(screen.getByText(/Sci-Fi, Drama/)).toBeInTheDocument();
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

  it('shows the Bewerten button for an owned movie and invokes onNavigateRate', () => {
    render(<MovieHeroSection {...baseProps} />);
    fireEvent.click(screen.getByText('Bewerten'));
    expect(baseProps.onNavigateRate).toHaveBeenCalled();
  });

  it('hides the Bewerten button for a read-only tmdb movie', () => {
    render(<MovieHeroSection {...baseProps} isReadOnlyTmdbMovie={true} />);
    expect(screen.queryByText('Bewerten')).not.toBeInTheDocument();
  });

  it('shows the "Gesehen" toggle for an owned movie and invokes onToggleWatched', () => {
    render(<MovieHeroSection {...baseProps} />);
    const btn = screen.getByRole('button', { name: 'Als gesehen markieren' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(baseProps.onToggleWatched).toHaveBeenCalled();
  });

  it('reflects the watched state on the toggle (aria-pressed + label)', () => {
    render(<MovieHeroSection {...baseProps} isWatched={true} />);
    const btn = screen.getByRole('button', { name: 'Als nicht gesehen markieren' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveTextContent('Gesehen');
  });

  it('hides the "Gesehen" toggle for a read-only tmdb movie', () => {
    render(<MovieHeroSection {...baseProps} isReadOnlyTmdbMovie={true} />);
    expect(screen.queryByRole('button', { name: /gesehen markieren/i })).not.toBeInTheDocument();
  });

  it('invokes onDeleteClick from the delete action', () => {
    const { container } = render(<MovieHeroSection {...baseProps} />);
    const actionBtns = container.querySelectorAll('.action-btn');
    const deleteBtn = actionBtns[actionBtns.length - 1] as HTMLElement;
    fireEvent.click(deleteBtn);
    expect(baseProps.onDeleteClick).toHaveBeenCalled();
  });
});
