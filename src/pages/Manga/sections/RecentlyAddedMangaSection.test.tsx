// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../../types/Manga';
import { RecentlyAddedMangaSection } from './RecentlyAddedMangaSection';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: { accent: '#00b0ff', text: { primary: '#fff', secondary: '#aaa' } },
  }),
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../../components/ui', () => ({
  HorizontalScrollContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SectionHeader: ({ title }: { title?: ReactNode }) => <div>{title}</div>,
}));

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 1,
    title: 'Recent Manga',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 1,
    readStatus: 'reading',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
  navigate.mockReset();
});

describe('RecentlyAddedMangaSection', () => {
  it('rendert nichts, wenn kein Manga in den letzten 7 Tagen hinzugefügt wurde', () => {
    listState.list = [makeManga({ addedAt: new Date('2000-01-01').toISOString() })];
    const { container } = render(<RecentlyAddedMangaSection />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt kürzlich hinzugefügte Manga und navigiert beim Klick', () => {
    listState.list = [
      makeManga({ anilistId: 5, title: 'Frisch dabei', addedAt: new Date().toISOString() }),
    ];
    render(<RecentlyAddedMangaSection />);
    expect(screen.getByText('Kürzlich hinzugefügt')).toBeInTheDocument();
    expect(screen.getByText('Frisch dabei')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Frisch dabei'));
    expect(navigate).toHaveBeenCalledWith('/manga/5');
  });
});
