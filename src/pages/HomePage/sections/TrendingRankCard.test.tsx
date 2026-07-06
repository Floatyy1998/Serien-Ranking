// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { TrendingRankCard } from './TrendingRankCard';
import type { MediaItem } from './mediaCarouselTypes';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('../../../contexts/ThemeContext', () => {
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
  id: 7,
  title: 'Severance',
  poster: 'poster.jpg',
  type: 'series',
  rating: 9.1,
  year: '2022',
  genres: 'Drama',
  providers: [{ name: 'AppleTV', logo: 'a.png' }],
};

const renderT = (item: MediaItem, index: number) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <TrendingRankCard item={item} index={index} cardWidth="155px" />
    </ThemeProvider>
  );

describe('TrendingRankCard', () => {
  it('renders title, the rank number (index + 1) and the Serie badge', () => {
    renderT(baseItem, 2);
    expect(screen.getByRole('heading', { name: 'Severance' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(screen.getByText('9.1')).toBeInTheDocument();
  });

  it('renders the Film badge for movie items', () => {
    renderT({ ...baseItem, type: 'movie' }, 0);
    expect(screen.getByText('Film')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('navigates to the item detail page on click', () => {
    renderT({ ...baseItem, type: 'movie' }, 0);
    fireEvent.click(screen.getByRole('heading', { name: 'Severance' }));
    expect(navigateMock).toHaveBeenCalledWith('/movie/7');
  });
});
