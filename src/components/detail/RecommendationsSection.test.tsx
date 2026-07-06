// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { DiscoverItem } from '../../pages/Discover/discoverItemHelpers';

const { navigateMock, recsRef, addToListMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  addToListMock: vi.fn<() => Promise<boolean>>(),
  recsRef: {
    current: {
      items: [] as DiscoverItem[],
      loading: false,
      addingId: null as number | null,
    },
  },
}));

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

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: true, isDesktop: false }),
}));
vi.mock('../../hooks/useTransitionNavigate', () => ({
  useTransitionNavigate: () => navigateMock,
}));
vi.mock('../../hooks/useDetailRecommendations', () => ({
  useDetailRecommendations: () => ({
    items: recsRef.current.items,
    loading: recsRef.current.loading,
    error: null,
    addingId: recsRef.current.addingId,
    addToList: addToListMock,
  }),
}));
vi.mock('../ui/HorizontalScrollContainer', () => ({
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { RecommendationsSection } from './RecommendationsSection';

const item: DiscoverItem = {
  id: 1,
  title: 'Rec Movie',
  poster_path: '/p.png',
  vote_average: 8.2,
  type: 'movie',
  inList: false,
  release_date: '2020-05-01',
};

beforeEach(() => {
  navigateMock.mockReset();
  addToListMock.mockReset();
  addToListMock.mockResolvedValue(true);
  recsRef.current = { items: [item], loading: false, addingId: null };
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', IO);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('RecommendationsSection', () => {
  it('renders the section header and recommendation card', () => {
    render(<RecommendationsSection id={10} mediaType="movie" />);
    expect(screen.getByText('Vielleicht auch was für dich')).toBeInTheDocument();
    expect(screen.getByText('Rec Movie')).toBeInTheDocument();
  });

  it('navigates to the item detail page on card click', () => {
    render(<RecommendationsSection id={10} mediaType="movie" />);
    fireEvent.click(screen.getByText('Rec Movie'));
    expect(navigateMock).toHaveBeenCalledWith('/movie/1');
  });

  it('calls addToList when the add button is clicked', () => {
    render(<RecommendationsSection id={10} mediaType="movie" />);
    fireEvent.click(screen.getByRole('button', { name: 'Zur Liste hinzufügen' }));
    expect(addToListMock).toHaveBeenCalledWith(item);
  });

  it('renders nothing when there are no recommendations and it is not loading', () => {
    recsRef.current = { items: [], loading: false, addingId: null };
    const { container } = render(<RecommendationsSection id={10} mediaType="movie" />);
    expect(container).toBeEmptyDOMElement();
  });
});
