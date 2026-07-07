// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContinueReadingItem } from '../../../hooks/useContinueReading';
import type { Manga } from '../../../types/Manga';
import { ContinueReadingSection } from './ContinueReadingSection';

const crState = vi.hoisted(() => ({ items: [] as ContinueReadingItem[] }));
vi.mock('../../../hooks/useContinueReading', () => ({
  useContinueReading: () => crState.items,
}));

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

vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../../services/readActivityService', () => ({ logChapterRead: vi.fn() }));

const fb = vi.hoisted(() => {
  const ref = { update: vi.fn().mockResolvedValue(undefined) };
  return { ref, database: vi.fn(() => ({ ref: vi.fn(() => ref) })) };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../../../components/ui', () => ({
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
  SwipeableEpisodeRow: ({
    content,
    posterAlt,
    onPosterClick,
  }: {
    content?: ReactNode;
    posterAlt?: string;
    onPosterClick?: () => void;
  }) => (
    <div>
      {content}
      <button type="button" aria-label={posterAlt} onClick={onPosterClick}>
        poster
      </button>
    </div>
  ),
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

function makeItem(overrides: Partial<ContinueReadingItem> = {}): ContinueReadingItem {
  return {
    anilistId: 1,
    title: 'One Piece',
    poster: 'p.jpg',
    progress: 50,
    currentChapter: 500,
    totalChapters: 1000,
    lastReadAt: new Date().toISOString(),
    format: 'MANGA',
    countryOfOrigin: 'JP',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  crState.items = [];
  listState.list = [];
  navigate.mockReset();
});

describe('ContinueReadingSection', () => {
  it('rendert nichts, wenn es keine Items gibt', () => {
    const { container } = render(<ContinueReadingSection />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt Weiterlesen-Items mit Kapitelinfo', () => {
    crState.items = [makeItem({ anilistId: 7, title: 'One Piece', currentChapter: 500 })];
    render(<ContinueReadingSection />);
    expect(screen.getByText('Weiterlesen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'One Piece' })).toBeInTheDocument();
    expect(screen.getByText(/Kap\. 500/)).toBeInTheDocument();
  });

  it('navigiert zur Detailseite beim Poster-Klick', () => {
    crState.items = [makeItem({ anilistId: 7, title: 'One Piece' })];
    render(<ContinueReadingSection />);
    fireEvent.click(screen.getByRole('button', { name: 'One Piece' }));
    expect(navigate).toHaveBeenCalledWith('/manga/7');
  });
});
