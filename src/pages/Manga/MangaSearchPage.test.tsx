// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult } from '../../types/Manga';
import type { Manga } from '../../types/Manga';
import { MangaSearchPage } from './MangaSearchPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[] }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list, hiddenMangaList: [] }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      background: { default: '#000' },
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../hooks/platform/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: true }),
}));

const searchMangaWithTitleFallback = vi.hoisted(() => vi.fn());
vi.mock('../../services/api/mangaSearch', () => ({ searchMangaWithTitleFallback }));

const addMangaToList = vi.hoisted(() => vi.fn());
vi.mock('./addMangaToList', () => ({ addMangaToList }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

function makeOwned(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 1,
    title: 'Naruto EN',
    titleRomaji: 'Naruto',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 120,
    chapters: 700,
    readStatus: 'reading',
    ...overrides,
  };
}

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
  searchMangaWithTitleFallback.mockResolvedValue({ results: [makeResult()], aliases: {} });
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
    await waitFor(() => expect(searchMangaWithTitleFallback).toHaveBeenCalled(), {
      timeout: 2000,
    });
    await waitFor(() => expect(screen.getByText('Naruto EN')).toBeInTheDocument());
  });

  it('zeigt den Titel, über den ein Eintrag gefunden wurde', async () => {
    searchMangaWithTitleFallback.mockResolvedValue({
      results: [
        makeResult({
          id: 7,
          title: { romaji: 'Minamgwa Yasu', english: 'The Beau and the Beast', native: null },
        }),
      ],
      aliases: { 7: 'Der Schöne und das Biest' },
    });
    render(<MangaSearchPage />);
    fireEvent.change(screen.getByPlaceholderText('Manga, Manhwa, Manhua suchen...'), {
      target: { value: 'Der Schöne und das Biest' },
    });
    await waitFor(() => expect(screen.getByText('The Beau and the Beast')).toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByText('Gefunden als „Der Schöne und das Biest“')).toBeInTheDocument();
  });

  it('zeigt die Format-Filter an', () => {
    render(<MangaSearchPage />);
    expect(screen.getByText('Manhwa')).toBeInTheDocument();
    expect(screen.getByText('Manhua')).toBeInTheDocument();
  });

  it('zeigt eigene Manga sofort als Sammlungstreffer, ohne Hinzufügen-Knopf', async () => {
    listState.list = [makeOwned()];
    render(<MangaSearchPage />);
    fireEvent.change(screen.getByPlaceholderText('Manga, Manhwa, Manhua suchen...'), {
      target: { value: 'naru' },
    });
    expect(screen.getByText('In deiner Sammlung')).toBeInTheDocument();
    expect(screen.getByText('Kap. 120 / 700')).toBeInTheDocument();
    await waitFor(() => expect(searchMangaWithTitleFallback).toHaveBeenCalled(), {
      timeout: 2000,
    });
    expect(screen.queryByLabelText('Naruto EN zur Sammlung hinzufügen')).not.toBeInTheDocument();
  });

  it('markiert eigene Manga unter den AniList-Treffern statt sie auszublenden', async () => {
    listState.list = [makeOwned({ title: 'Ganz anders', titleRomaji: 'X', readStatus: 'paused' })];
    render(<MangaSearchPage />);
    fireEvent.change(screen.getByPlaceholderText('Manga, Manhwa, Manhua suchen...'), {
      target: { value: 'Naruto' },
    });
    await waitFor(() => expect(screen.getByText('Naruto EN')).toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByText('Pausiert')).toBeInTheDocument();
    expect(screen.queryByLabelText('Naruto EN zur Sammlung hinzufügen')).not.toBeInTheDocument();
  });
});
