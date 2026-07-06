// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../../types/Manga';
import { MangaCatchUpCard } from './MangaCatchUpCard';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: { accent: '#00b0ff', text: { primary: '#fff', secondary: '#aaa' } },
  }),
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../../components/ui', () => ({
  IconContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  NavCard: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => (
    <div onClick={onClick}>{children}</div>
  ),
}));

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 1,
    title: 'Manga',
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

describe('MangaCatchUpCard', () => {
  it('rendert nichts, wenn keine laufenden Manga mit offenen Kapiteln existieren', () => {
    listState.list = [makeManga({ readStatus: 'completed' })];
    const { container } = render(<MangaCatchUpCard />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt Anzahl offener Manga/Kapitel und navigiert beim Klick', () => {
    listState.list = [
      makeManga({ anilistId: 1, currentChapter: 10, chapters: 100 }),
      makeManga({ anilistId: 2, currentChapter: 5, chapters: 20 }),
    ];
    render(<MangaCatchUpCard />);
    expect(screen.getByText('Aufholen')).toBeInTheDocument();
    // 90 + 15 = 105 offene Kapitel bei 2 Manga
    expect(screen.getByText('2 Manga · 105 Kapitel offen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aufholen'));
    expect(navigate).toHaveBeenCalledWith('/manga/catch-up');
  });
});
