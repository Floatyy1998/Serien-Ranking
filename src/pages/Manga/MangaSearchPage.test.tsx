// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult } from '../../types/Manga';
import type { Manga } from '../../types/Manga';
import { MangaSearchPage } from './MangaSearchPage';

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
    },
  }),
}));

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: true }) }));

const searchManga = vi.hoisted(() => vi.fn());
vi.mock('../../services/anilistService', () => ({ searchManga }));

const addMangaToList = vi.hoisted(() => vi.fn());
vi.mock('./addMangaToList', () => ({ addMangaToList }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

function makeResult(overrides: Partial<AniListMangaSearchResult> = {}): AniListMangaSearchResult {
  return {
    id: 1,
    title: { romaji: 'Naruto', english: 'Naruto EN', native: null },
    coverImage: { large: 'c.jpg', medium: 'c-s.jpg' },
    bannerImage: null,
    description: null,
    chapters: 700,
    volumes: 72,
    status: 'FINISHED',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action'],
    averageScore: 80,
    startDate: { year: 1999, month: null, day: null },
    isAdult: false,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  searchManga.mockResolvedValue({ results: [makeResult()] });
});

afterEach(() => {
  cleanup();
  listState.list = [];
  navigate.mockReset();
  addMangaToList.mockReset();
});

describe('MangaSearchPage', () => {
  it('rendert den Leerzustand ohne Suchbegriff', () => {
    render(<MangaSearchPage />);
    expect(screen.getByText('Manga entdecken')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Manga, Manhwa, Manhua suchen...')).toBeInTheDocument();
  });

  it('sucht bei Eingabe und zeigt Ergebnisse', async () => {
    render(<MangaSearchPage />);
    fireEvent.change(screen.getByPlaceholderText('Manga, Manhwa, Manhua suchen...'), {
      target: { value: 'Naruto' },
    });
    await waitFor(() => expect(searchManga).toHaveBeenCalled(), { timeout: 2000 });
    await waitFor(() => expect(screen.getByText('Naruto EN')).toBeInTheDocument());
  });

  it('zeigt die Format-Filter an', () => {
    render(<MangaSearchPage />);
    expect(screen.getByText('Manhwa')).toBeInTheDocument();
    expect(screen.getByText('Manhua')).toBeInTheDocument();
  });
});
