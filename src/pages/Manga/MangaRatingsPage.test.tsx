// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { MangaRatingsPage } from './MangaRatingsPage';

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
    },
  }),
}));

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

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
    title: 'Bewertetes Manga',
    poster: 'p.jpg',
    rating: { u1: 9 },
    currentChapter: 20,
    readStatus: 'reading',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    chapters: 40,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
  navigate.mockReset();
});

describe('MangaRatingsPage', () => {
  it('rendert Kopfzeile und Schnellfilter', () => {
    listState.list = [makeManga()];
    render(<MangaRatingsPage />);
    expect(screen.getByRole('heading', { name: 'Manga Bewertungen' })).toBeInTheDocument();
    expect(screen.getByText('Bewertetes Manga')).toBeInTheDocument();
    expect(screen.getByText('Unbewertet')).toBeInTheDocument();
  });

  it('filtert per Schnellfilter auf Unbewertet', () => {
    listState.list = [makeManga({ anilistId: 1, rating: { u1: 9 } })];
    render(<MangaRatingsPage />);
    fireEvent.click(screen.getByText('Unbewertet'));
    // Das einzige (bewertete) Manga wird herausgefiltert
    expect(screen.getByText('Keine Manga mit diesem Filter')).toBeInTheDocument();
  });

  it('navigiert zur Detailseite beim Klick auf ein Poster', () => {
    listState.list = [makeManga({ anilistId: 4, title: 'Bewertetes Manga' })];
    render(<MangaRatingsPage />);
    fireEvent.click(screen.getByText('Bewertetes Manga'));
    expect(navigate).toHaveBeenCalledWith('/manga/4');
  });
});
