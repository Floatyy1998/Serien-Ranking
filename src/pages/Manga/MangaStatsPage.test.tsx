// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { MangaStatsPage } from './MangaStatsPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      secondary: '#888',
      text: { primary: '#fff', secondary: '#aaa' },
      status: { success: '#22c55e' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, subtitle }: { title?: ReactNode; subtitle?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <span>{subtitle}</span>
    </div>
  ),
}));

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 1,
    title: 'Manga',
    poster: 'p.jpg',
    rating: { u1: 8 },
    currentChapter: 20,
    readStatus: 'reading',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action'],
    chapters: 40,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
});

describe('MangaStatsPage', () => {
  it('zeigt den Leerzustand ohne Manga', () => {
    render(<MangaStatsPage />);
    expect(screen.getByText('Noch keine Manga in deiner Sammlung.')).toBeInTheDocument();
  });

  it('rendert Statistik-Abschnitte mit Daten', () => {
    listState.list = [
      makeManga({ anilistId: 1, currentChapter: 20, chapters: 40, readStatus: 'reading' }),
      makeManga({ anilistId: 2, currentChapter: 40, chapters: 40, readStatus: 'completed' }),
    ];
    render(<MangaStatsPage />);
    expect(screen.getByRole('heading', { name: 'Manga Statistiken' })).toBeInTheDocument();
    expect(screen.getByText('Kapitel gelesen')).toBeInTheDocument();
    expect(screen.getByText('Status-Verteilung')).toBeInTheDocument();
    expect(screen.getByText('Top Genres')).toBeInTheDocument();
  });
});
