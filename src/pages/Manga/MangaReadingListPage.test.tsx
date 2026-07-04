// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { MangaReadingListPage } from './MangaReadingListPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      background: { default: '#000' },
      text: { primary: '#fff', secondary: '#aaa' },
    },
  }),
}));

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: true }) }));

vi.mock('../../services/readActivityService', () => ({ logChapterRead: vi.fn() }));

const fb = vi.hoisted(() => {
  const ref = { update: vi.fn().mockResolvedValue(undefined) };
  return { ref, database: vi.fn(() => ({ ref: vi.fn(() => ref) })) };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../components/ui', () => ({
  BackButton: () => <button type="button">back</button>,
  GradientText: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ScrollToTopButton: () => null,
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

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 1,
    title: 'Leselisten-Manga',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 10,
    readStatus: 'reading',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    chapters: 100,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
  navigate.mockReset();
});

describe('MangaReadingListPage', () => {
  it('zeigt den Leerzustand ohne lesbare Manga', () => {
    render(<MangaReadingListPage />);
    expect(screen.getByText('Keine Manga zum Lesen')).toBeInTheDocument();
  });

  it('listet Manga mit Status reading/planned', () => {
    listState.list = [
      makeManga({ anilistId: 2, title: 'Leselisten-Manga', readStatus: 'reading' }),
      makeManga({ anilistId: 3, title: 'Ignoriert', readStatus: 'completed' }),
    ];
    render(<MangaReadingListPage />);
    expect(screen.getByRole('heading', { name: 'Leselisten-Manga' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ignoriert' })).not.toBeInTheDocument();
  });

  it('navigiert zur Detailseite beim Poster-Klick', () => {
    listState.list = [makeManga({ anilistId: 2, title: 'Leselisten-Manga' })];
    render(<MangaReadingListPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Leselisten-Manga' }));
    expect(navigate).toHaveBeenCalledWith('/manga/2');
  });
});
