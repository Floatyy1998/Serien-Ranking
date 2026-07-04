// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { MangaDetailPage } from './MangaDetailPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
const toggleHideManga = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list, toggleHideManga }),
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

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: true }) }));

const liveState = vi.hoisted(() => ({
  data: { anilistData: null, mangadexInfo: null, chapterInfo: null } as {
    anilistData: AniListMangaSearchResult | null;
    mangadexInfo: unknown;
    chapterInfo: unknown;
  },
}));
vi.mock('./detail/useMangaLiveData', () => ({ useMangaLiveData: () => liveState.data }));

vi.mock('./addMangaToList', () => ({ addMangaToList: vi.fn() }));

vi.mock('../../services/readActivityService', () => ({
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
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => params,
}));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title?: ReactNode }) => <h1>{title}</h1>,
}));

vi.mock('./detail/MangaDetailHero', () => ({
  MangaDetailHero: () => <div data-testid="hero" />,
}));
vi.mock('./detail/MangaDetailBody', () => ({
  MangaDetailBody: () => <div data-testid="body" />,
}));
vi.mock('./detail/MangaDetailPreview', () => ({
  MangaDetailPreview: () => <div data-testid="preview" />,
}));

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
  liveState.data = { anilistData: null, mangadexInfo: null, chapterInfo: null };
  navigate.mockReset();
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
});
