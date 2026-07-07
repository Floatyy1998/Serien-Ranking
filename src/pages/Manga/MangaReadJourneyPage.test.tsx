// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { MangaReadJourneyPage } from './MangaReadJourneyPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa' },
      status: { success: '#22c55e' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../components/ui', () => ({
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
    title: 'Journey Manga',
    poster: 'p.jpg',
    rating: { u1: 8 },
    currentChapter: 30,
    readStatus: 'reading',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action', 'Adventure'],
    lastReadAt: new Date().toISOString(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
});

describe('MangaReadJourneyPage', () => {
  it('rendert den Aktivitäts-Tab standardmäßig', () => {
    listState.list = [makeManga()];
    render(<MangaReadJourneyPage />);
    expect(screen.getByRole('heading', { name: 'Read Journey' })).toBeInTheDocument();
    expect(screen.getByText('Kapitel pro Monat')).toBeInTheDocument();
  });

  it('wechselt zum Genres-Tab', () => {
    listState.list = [makeManga()];
    render(<MangaReadJourneyPage />);
    fireEvent.click(screen.getByText('Genres'));
    expect(screen.getByText('Genre-Verteilung')).toBeInTheDocument();
  });

  it('wechselt zum Insights-Tab und zeigt Kennzahlen', () => {
    listState.list = [makeManga()];
    render(<MangaReadJourneyPage />);
    fireEvent.click(screen.getByText('Insights'));
    expect(screen.getByText('Lese-Streak')).toBeInTheDocument();
    expect(screen.getByText('Gesamt Kapitel')).toBeInTheDocument();
  });
});
