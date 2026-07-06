// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../../types/Manga';
import { HiddenMangaCard } from './HiddenMangaCard';

const listState = vi.hoisted(() => ({ hidden: [] as Manga[] }));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ hiddenMangaList: listState.hidden }),
}));

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: { primary: '#00d123', text: { primary: '#fff', secondary: '#aaa' } },
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

function makeManga(id: number): Manga {
  return {
    nmr: id,
    anilistId: id,
    title: `Manga ${id}`,
    poster: 'p.jpg',
    rating: {},
    currentChapter: 1,
    readStatus: 'paused',
    hidden: true,
  };
}

afterEach(() => {
  cleanup();
  listState.hidden = [];
  navigate.mockReset();
});

describe('HiddenMangaCard', () => {
  it('rendert nichts, wenn keine versteckten Manga existieren', () => {
    const { container } = render(<HiddenMangaCard />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt die Anzahl versteckter Manga und navigiert beim Klick', () => {
    listState.hidden = [makeManga(1), makeManga(2)];
    render(<HiddenMangaCard />);
    expect(screen.getByText('Versteckte Manga')).toBeInTheDocument();
    expect(screen.getByText('2 Manga pausiert')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Versteckte Manga'));
    expect(navigate).toHaveBeenCalledWith('/manga/hidden');
  });
});
