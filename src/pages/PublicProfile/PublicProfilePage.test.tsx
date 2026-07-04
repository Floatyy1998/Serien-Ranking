// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { usePublicProfileDataMock } = vi.hoisted(() => ({ usePublicProfileDataMock: vi.fn() }));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition', 'whileTap'].includes(k))
          clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: { children: React.ReactNode }) => <>{props.children}</>,
  };
});

vi.mock('@mui/icons-material', () => {
  const Stub = () => <span />;
  return { Movie: Stub, Public: Stub, Star: Stub, Tv: Stub };
});
vi.mock('../../components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ProfileItemCard: ({ title }: { title: string }) => <div data-testid="item-card">{title}</div>,
  QuickFilter: () => <div data-testid="quick-filter" />,
  ScrollToTopButton: () => <div />,
  Skeleton: () => <div data-testid="skeleton" />,
  SkeletonPosterRow: () => <div />,
  TabSwitcher: () => <div data-testid="tabs" />,
}));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
vi.mock('./PublicProfileHeader', () => ({
  PublicProfileHeader: ({ profileName }: { profileName: string }) => (
    <div>HEADER:{profileName}</div>
  ),
}));
vi.mock('./usePublicProfileData', () => ({
  usePublicProfileData: usePublicProfileDataMock,
  calculatePublicRating: () => '8.0',
  calculateProgress: () => 50,
}));
vi.mock('../../lib/motion', () => ({ tapScale: {} }));

import { PublicProfilePage } from './PublicProfilePage';

const makeTheme = (): unknown =>
  new Proxy(() => '#333', {
    get: (_t, prop) => {
      if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
        return () => '#333';
      return makeTheme();
    },
  });

const baseReturn = () => ({
  currentTheme: makeTheme(),
  navigate: vi.fn(),
  scrollRef: { current: null },
  loading: false,
  profileExists: true,
  profileName: 'Alice',
  averageRating: 8,
  itemsWithRatingCount: 3,
  activeTab: 'series',
  setActiveTab: vi.fn(),
  filters: {},
  setFilters: vi.fn(),
  ratedSeries: [],
  ratedMovies: [],
  currentItems: [] as unknown[],
  handleItemClick: vi.fn(),
});

beforeEach(() => usePublicProfileDataMock.mockReset());

afterEach(() => cleanup());

describe('PublicProfilePage', () => {
  it('renders the loading skeleton while loading', () => {
    usePublicProfileDataMock.mockReturnValue({ ...baseReturn(), loading: true });
    render(<PublicProfilePage />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders a not-found state when the profile does not exist', () => {
    usePublicProfileDataMock.mockReturnValue({ ...baseReturn(), profileExists: false });
    render(<PublicProfilePage />);
    expect(screen.getByText('Profil nicht gefunden')).toBeInTheDocument();
  });

  it('renders the header and rated item cards', () => {
    usePublicProfileDataMock.mockReturnValue({
      ...baseReturn(),
      currentItems: [{ id: 1, title: 'Lost', poster: {}, provider: {}, genres: [], seasons: [] }],
    });
    render(<PublicProfilePage />);
    expect(screen.getByText('HEADER:Alice')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
  });
});
