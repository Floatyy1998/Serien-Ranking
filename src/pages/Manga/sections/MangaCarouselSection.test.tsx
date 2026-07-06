// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MangaCarouselItem } from '../../../hooks/useMangaTrending';
import { MangaCarouselSection } from './MangaCarouselSection';

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      primaryDark: '#009a1a',
      accent: '#00b0ff',
      status: { warning: '#f59e0b' },
    },
  }),
}));

vi.mock('../../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: true }) }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../../components/ui', () => ({
  HorizontalScrollContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SectionHeader: ({ title }: { title?: ReactNode }) => <div>{title}</div>,
}));

function makeItem(overrides: Partial<MangaCarouselItem> = {}): MangaCarouselItem {
  return {
    id: 1,
    title: 'Solo Leveling',
    poster: 'poster.jpg',
    rating: 8.5,
    year: '2018',
    genres: 'Action, Fantasy',
    format: 'MANGA',
    countryOfOrigin: 'KR',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('MangaCarouselSection', () => {
  it('rendert nichts bei leerer Item-Liste', () => {
    const { container } = render(
      <MangaCarouselSection variant="trending" items={[]} title="Trending" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('rendert Trending-Karten mit Titel und navigiert beim Klick', () => {
    render(
      <MangaCarouselSection
        variant="trending"
        items={[makeItem({ id: 42, title: 'Solo Leveling' })]}
        title="Trending"
      />
    );
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Solo Leveling' })).toBeInTheDocument();
    // Manhwa-Format wird über countryOfOrigin KR abgeleitet
    expect(screen.getByText('Manhwa')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('heading', { name: 'Solo Leveling' }));
    expect(navigate).toHaveBeenCalledWith('/manga/42');
  });

  it('rendert Popular-Variante ohne Rangnummern', () => {
    render(
      <MangaCarouselSection
        variant="popular"
        items={[makeItem({ id: 7, title: 'Chainsaw Man', countryOfOrigin: 'JP' })]}
        title="Beliebt"
      />
    );
    expect(screen.getByRole('heading', { name: 'Chainsaw Man' })).toBeInTheDocument();
    expect(screen.getByText('Manga')).toBeInTheDocument();
  });
});
