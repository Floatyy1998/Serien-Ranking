// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { CinematicPosterCard } from './CinematicPosterCard';
import type { MediaItem } from './mediaCarouselTypes';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('../../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));
vi.mock('../../../hooks/useTransitionNavigate', () => ({
  useTransitionNavigate: () => navigateMock,
}));
vi.mock('../../../components/ui', () => ({
  PosterImage: ({ alt, src }: { alt?: string; src?: string }) => <img alt={alt} src={src} />,
}));
vi.mock('./MiniProviderBadges', () => ({
  MiniProviderBadges: () => <div data-testid="provider-badges" />,
}));

const MOTION_ONLY = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'layout',
  'drag',
]);
const strip = (props: Record<string, unknown>): React.HTMLAttributes<HTMLDivElement> => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(props)) if (!MOTION_ONLY.has(k)) out[k] = props[k];
  return out as React.HTMLAttributes<HTMLDivElement>;
};
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => <div {...strip(props)} /> }
  ),
}));

afterEach(() => {
  navigateMock.mockClear();
  cleanup();
});

const baseItem: MediaItem = {
  id: 42,
  title: 'Dune',
  poster: 'poster.jpg',
  type: 'series',
  rating: 8.7,
  year: '2021',
  genres: 'Sci-Fi',
  providers: [{ name: 'Netflix', logo: 'n.png' }],
};

const renderT = (item: MediaItem) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <CinematicPosterCard item={item} cardWidth="155px" />
    </ThemeProvider>
  );

describe('CinematicPosterCard', () => {
  it('renders title, rating, year, genres and the Serie type badge', () => {
    renderT(baseItem);
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('8.7')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(screen.getByTestId('provider-badges')).toBeInTheDocument();
  });

  it('renders the Film badge for movie items', () => {
    renderT({ ...baseItem, type: 'movie' });
    expect(screen.getByText('Film')).toBeInTheDocument();
  });

  it('navigates to the item detail page on click', () => {
    renderT(baseItem);
    fireEvent.click(screen.getByRole('heading', { name: 'Dune' }));
    expect(navigateMock).toHaveBeenCalledWith('/series/42');
  });

  it('omits the rating star when rating is not set', () => {
    renderT({ ...baseItem, rating: undefined });
    expect(screen.queryByText('8.7')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
  });
});
