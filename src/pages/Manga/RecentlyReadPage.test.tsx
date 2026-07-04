// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { RecentlyReadPage } from './RecentlyReadPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa' },
    },
  }),
}));

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
    title: 'Kürzlich gelesen',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 12,
    readStatus: 'reading',
    chapters: 100,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
  navigate.mockReset();
});

describe('RecentlyReadPage', () => {
  it('zeigt den Leerzustand ohne Lese-Verlauf', () => {
    render(<RecentlyReadPage />);
    expect(screen.getByText('Kein Lese-Verlauf')).toBeInTheDocument();
  });

  it('gruppiert kürzlich gelesene Manga und navigiert beim Klick', () => {
    listState.list = [
      makeManga({ anilistId: 8, title: 'Kürzlich gelesen', lastReadAt: new Date().toISOString() }),
    ];
    render(<RecentlyReadPage />);
    expect(screen.getByRole('heading', { name: 'Lese-Verlauf' })).toBeInTheDocument();
    expect(screen.getByText('Kürzlich gelesen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kürzlich gelesen'));
    expect(navigate).toHaveBeenCalledWith('/manga/8');
  });
});
