// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../types/Book';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { addMangaToList } from './addMangaToList';
import { MangaDetailPage } from './MangaDetailPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[], hidden: [] as Manga[] }));
const toggleHideManga = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({
    mangaList: listState.list,
    hiddenMangaList: listState.hidden,
    toggleHideManga,
  }),
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

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../hooks/platform/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: true }),
}));

const liveState = vi.hoisted(() => ({
  data: { anilistData: null, mangadexInfo: null, chapterInfo: null } as {
    anilistData: AniListMangaSearchResult | null;
    mangadexInfo: unknown;
    chapterInfo: unknown;
  },
}));
vi.mock('./detail/useMangaLiveData', () => ({ useMangaLiveData: () => liveState.data }));

vi.mock('./addMangaToList', () => ({ addMangaToList: vi.fn() }));

const findVolumeBook = vi.hoisted(() => vi.fn());
vi.mock('../../services/books/volumeBook', () => ({ findVolumeBook }));

vi.mock('../../services/discussion/readActivityService', () => ({
  logChapterRead: vi.fn(),
  logMangaRating: vi.fn(),
}));

const fb = vi.hoisted(() => {
  const ref = {
    update: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  return { ref, database: vi.fn(() => ({ ref: vi.fn(() => ref) })) };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const navigate = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ id: '123' }));
const routerState = vi.hoisted(() => ({ location: { hash: '' } as Record<string, unknown> }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => params,
  useLocation: () => routerState.location,
}));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title?: ReactNode }) => <h1>{title}</h1>,
  LoadingSpinner: ({ text }: { text?: ReactNode }) => <div>{text}</div>,
}));

vi.mock('./detail/MangaDetailHero', () => ({
  MangaDetailHero: () => <div data-testid="hero" />,
}));
const childProps = vi.hoisted(() => ({
  body: {} as { onOpenBook?: () => void },
  preview: {} as { onAdd?: () => Promise<void> },
}));
vi.mock('./detail/MangaDetailBody', () => ({
  MangaDetailBody: (props: { onOpenBook?: () => void }) => {
    childProps.body = props;
    return <div data-testid="body" />;
  },
}));
vi.mock('./detail/MangaDetailPreview', () => ({
  MangaDetailPreview: (props: { onAdd?: () => Promise<void> }) => {
    childProps.preview = props;
    return <div data-testid="preview" />;
  },
}));

const scannedBook: BookSearchResult = {
  id: 'dnb-9783551000000',
  title: 'Detail Manga – Band 3',
  authors: ['Autorin'],
  source: 'dnb',
  isbn13: '9783551000000',
};

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 123,
    title: 'Detail Manga',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 10,
    readStatus: 'reading',
    format: 'MANGA',
    ...overrides,
  };
}

function makeAniList(): AniListMangaSearchResult {
  return {
    id: 123,
    title: { romaji: 'Detail', english: 'Detail EN', native: null },
    coverImage: { large: 'c.jpg', medium: 'c-s.jpg' },
    bannerImage: null,
    description: null,
    chapters: 10,
    volumes: 1,
    status: 'FINISHED',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: [],
    averageScore: 70,
    startDate: { year: 2020, month: null, day: null },
    isAdult: false,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
  listState.hidden = [];
  liveState.data = { anilistData: null, mangadexInfo: null, chapterInfo: null };
  routerState.location = { hash: '' };
  navigate.mockReset();
  findVolumeBook.mockReset();
  vi.mocked(addMangaToList).mockReset();
});

describe('MangaDetailPage', () => {
  it('zeigt den Ladezustand, wenn Manga weder in der Liste noch als AniList-Daten vorliegt', () => {
    render(<MangaDetailPage />);
    expect(screen.getByText('Laden...')).toBeInTheDocument();
  });

  it('rendert die AniList-Vorschau, wenn Manga nicht in der Sammlung ist', () => {
    liveState.data = { anilistData: makeAniList(), mangadexInfo: null, chapterInfo: null };
    render(<MangaDetailPage />);
    expect(screen.getByTestId('preview')).toBeInTheDocument();
  });

  it('rendert Hero und Body, wenn Manga in der Sammlung ist', () => {
    listState.list = [makeManga({ anilistId: 123 })];
    render(<MangaDetailPage />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('body')).toBeInTheDocument();
  });

  it('behandelt versteckte Manga als Teil der Sammlung', () => {
    listState.hidden = [makeManga({ anilistId: 123, hidden: true })];
    liveState.data = { anilistData: makeAniList(), mangadexInfo: null, chapterInfo: null };
    render(<MangaDetailPage />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
  });

  it('„Zum Buch" öffnet den Band aus der ISBN-Suche statt per Titel zu suchen', async () => {
    listState.list = [makeManga({ trackBy: 'volumes', volumes: 10 })];
    routerState.location = { hash: '', search: '?band=3', state: { volumeBook: scannedBook } };
    render(<MangaDetailPage />);
    await act(async () => childProps.body.onOpenBook?.());
    expect(findVolumeBook).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(`/books/${encodeURIComponent(scannedBook.id)}`, {
      state: { result: scannedBook },
    });
  });

  it('„Zum Buch" sucht ohne bekannten Band weiter per Titel', async () => {
    listState.list = [makeManga({ trackBy: 'volumes', volumes: 10 })];
    findVolumeBook.mockResolvedValue(null);
    render(<MangaDetailPage />);
    await act(async () => childProps.body.onOpenBook?.());
    expect(findVolumeBook).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/books/search?q=Detail%20Manga');
  });

  it('merkt sich beim Hinzufügen aus der ISBN-Suche den Band', async () => {
    liveState.data = { anilistData: makeAniList(), mangadexInfo: null, chapterInfo: null };
    routerState.location = { hash: '', search: '?band=3', state: { volumeBook: scannedBook } };
    render(<MangaDetailPage />);
    await act(async () => childProps.preview.onAdd?.());
    const options = vi.mocked(addMangaToList).mock.calls[0][3];
    expect(options?.byVolume).toBe(true);
    expect(options?.fromBooks?.map((book) => book.isbn13)).toEqual([scannedBook.isbn13]);
  });
});
