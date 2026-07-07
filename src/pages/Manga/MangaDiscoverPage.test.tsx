// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { MangaDiscoverPage } from './MangaDiscoverPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      background: { default: '#000' },
      text: { primary: '#fff', secondary: '#aaa' },
      status: { error: '#ef4444', success: '#22c55e' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: true }) }));

const discoverManga = vi.hoisted(() => vi.fn());
vi.mock('../../services/anilistService', () => ({ discoverManga }));

const addMangaToList = vi.hoisted(() => vi.fn());
vi.mock('./addMangaToList', () => ({ addMangaToList }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../components/ui', () => ({
  BackButton: () => <button type="button">back</button>,
  GradientText: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  ScrollToTopButton: () => null,
}));

function makeResult(overrides: Partial<AniListMangaSearchResult> = {}): AniListMangaSearchResult {
  return {
    id: 1,
    title: { romaji: 'Bleach', english: 'Bleach EN', native: null },
    coverImage: { large: 'c.jpg', medium: 'c-s.jpg' },
    bannerImage: null,
    description: null,
    chapters: 686,
    volumes: 74,
    status: 'FINISHED',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action'],
    averageScore: 78,
    startDate: { year: 2001, month: null, day: null },
    isAdult: false,
    ...overrides,
  };
}

beforeEach(() => {
  discoverManga.mockResolvedValue({ results: [makeResult()], hasNextPage: false });
});

afterEach(() => {
  cleanup();
  listState.list = [];
  navigate.mockReset();
  addMangaToList.mockReset();
});

describe('MangaDiscoverPage', () => {
  it('rendert Kategorien und lädt initiale Ergebnisse', async () => {
    render(<MangaDiscoverPage />);
    expect(screen.getByText('Entdecken')).toBeInTheDocument();
    await waitFor(() => expect(discoverManga).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Bleach EN')).toBeInTheDocument());
  });

  it('wechselt die Kategorie bei Klick', async () => {
    render(<MangaDiscoverPage />);
    await waitFor(() => expect(discoverManga).toHaveBeenCalled());
    discoverManga.mockClear();
    fireEvent.click(screen.getByText('Beliebt'));
    await waitFor(() =>
      expect(discoverManga).toHaveBeenCalledWith('popular', 1, 30, expect.any(String))
    );
  });
});
