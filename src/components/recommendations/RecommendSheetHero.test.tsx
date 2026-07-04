// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecommendSheetHero } from './RecommendSheetHero';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: { primary: '#00d123', accent: '#00ff99' },
  }),
}));

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: false, isDesktop: true }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RecommendSheetHero', () => {
  it('zeigt Titel und Serie-Label', () => {
    render(<RecommendSheetHero media={{ id: 1, type: 'series', title: 'Breaking Bad' }} />);
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(screen.getByText('Du empfiehlst')).toBeInTheDocument();
  });

  it('zeigt das Film-Label für Filme', () => {
    render(<RecommendSheetHero media={{ id: 2, type: 'movie', title: 'Inception' }} />);
    expect(screen.getByText('Film')).toBeInTheDocument();
  });

  it('rendert das Poster wenn ein posterPath vorhanden ist', () => {
    const { container } = render(
      <RecommendSheetHero
        media={{ id: 3, type: 'movie', title: 'Dune', posterPath: '/dune.jpg' }}
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
  });
});
