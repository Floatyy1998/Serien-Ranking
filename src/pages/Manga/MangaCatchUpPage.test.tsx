// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { MangaCatchUpPage } from './MangaCatchUpPage';

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
    title: 'Aufhol-Manga',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 10,
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

describe('MangaCatchUpPage', () => {
  it('zeigt den Leerzustand, wenn nichts aufzuholen ist', () => {
    listState.list = [makeManga({ readStatus: 'completed' })];
    render(<MangaCatchUpPage />);
    expect(screen.getByText('Alles aufgeholt!')).toBeInTheDocument();
  });

  it('rendert aufzuholende Manga und navigiert beim Klick', () => {
    listState.list = [
      makeManga({ anilistId: 3, title: 'Aufhol-Manga', currentChapter: 10, chapters: 100 }),
    ];
    render(<MangaCatchUpPage />);
    expect(screen.getByText('Aufhol-Manga')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aufhol-Manga'));
    expect(navigate).toHaveBeenCalledWith('/manga/3');
  });
});
