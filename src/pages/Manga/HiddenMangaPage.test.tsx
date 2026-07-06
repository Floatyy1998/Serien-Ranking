// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { HiddenMangaPage } from './HiddenMangaPage';

const listState = vi.hoisted(() => ({ hidden: [] as Manga[] }));
const toggleHideManga = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ hiddenMangaList: listState.hidden, toggleHideManga }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: { primary: '#00d123', text: { primary: '#fff', secondary: '#aaa' } },
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
    title: 'Verstecktes Manga',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 10,
    readStatus: 'paused',
    chapters: 100,
    hidden: true,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.hidden = [];
  toggleHideManga.mockReset();
  navigate.mockReset();
});

describe('HiddenMangaPage', () => {
  it('zeigt den Leerzustand ohne versteckte Manga', () => {
    render(<HiddenMangaPage />);
    expect(screen.getByText('Keine versteckten Manga')).toBeInTheDocument();
  });

  it('rendert versteckte Manga und macht sie über den Button wieder sichtbar', () => {
    listState.hidden = [makeManga({ anilistId: 9, title: 'Verstecktes Manga' })];
    render(<HiddenMangaPage />);
    expect(screen.getByText('Verstecktes Manga')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Weiter'));
    expect(toggleHideManga).toHaveBeenCalledWith(9, false);
  });
});
