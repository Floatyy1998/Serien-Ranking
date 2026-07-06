// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../../types/Manga';
import { MangaStatsSection } from './MangaStatsSection';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { primary: '#fff', secondary: '#aaa' },
    },
  }),
}));

vi.mock('../../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../../components/ui', () => ({
  IconContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SectionHeader: ({
    title,
    onSeeAll,
    seeAllLabel,
  }: {
    title?: ReactNode;
    onSeeAll?: () => void;
    seeAllLabel?: ReactNode;
  }) => (
    <div>
      <span>{title}</span>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll}>
          {seeAllLabel}
        </button>
      )}
    </div>
  ),
}));

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 1,
    title: 'Manga',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 20,
    readStatus: 'reading',
    format: 'MANGA',
    genres: ['Action'],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
});

describe('MangaStatsSection', () => {
  it('rendert nichts bei leerer Sammlung', () => {
    const { container } = render(<MangaStatsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt Statistiken und schaltet den erweiterten Bereich um', () => {
    listState.list = [
      makeManga({ anilistId: 1, currentChapter: 20, chapters: 40, readStatus: 'reading' }),
      makeManga({ anilistId: 2, currentChapter: 40, chapters: 40, readStatus: 'completed' }),
    ];
    render(<MangaStatsSection />);
    expect(screen.getByText('Statistiken')).toBeInTheDocument();
    expect(screen.getByText('Kapitel gelesen')).toBeInTheDocument();

    // Erweiterten Bereich öffnen
    fireEvent.click(screen.getByRole('button', { name: 'Mehr' }));
    expect(screen.getByText('Ø Bewertung')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weniger' })).toBeInTheDocument();
  });
});
