// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#ef6f8a',
      accent: '#f2a648',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#2b1a2e' },
    },
  }),
}));

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => navigateMock,
    Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) =>
      createElement('a', { href: to, ...rest }, children),
  };
});

const addReadingPickMock = vi.hoisted(() => vi.fn());
vi.mock('../../services/account/guestOnboarding', () => ({
  addGuestReadingPick: addReadingPickMock,
}));

const book = {
  id: 'hc-1',
  title: 'Fourth Wing',
  authors: ['Rebecca Yarros'],
  cover: 'https://example.org/c.jpg',
  pageCount: 640,
  publishedYear: 2023,
  description: 'Drachen.',
  source: 'hardcover' as const,
};
vi.mock('../../services/catalog/bookCatalog', () => ({
  loadBookCatalogItem: vi.fn(async (id: string) => (id === 'hc-1' ? book : null)),
  loadBookCatalogDescription: vi.fn(async () => 'Drachen auf Deutsch.'),
}));
vi.mock('../../services/api/booksApi', () => ({ searchBooks: vi.fn(async () => []) }));
vi.mock('../../services/api/bookDiscovery', () => ({
  fetchMoreByAuthor: vi.fn(async () => [
    {
      id: 'hc-2',
      title: 'Iron Flame',
      authors: ['Rebecca Yarros'],
      cover: 'x.jpg',
      source: 'hardcover',
    },
  ]),
}));
vi.mock('../../hooks/books/useBookLinks', () => ({
  useBookLinks: () => ({ links: { adaptations: [] }, parts: [], loading: false }),
}));
vi.mock('../Onboarding/hooks/useReadingPicks', () => ({
  bookItem: (b: { id: string; title: string }) => ({
    key: `book-${b.id}`,
    kind: 'book',
    title: b.title,
  }),
  mangaItem: (m: { id: number; title: { romaji: string } }) => ({
    key: `manga-${m.id}`,
    kind: 'manga',
    title: m.title.romaji,
  }),
}));

const manga = {
  id: 30013,
  title: { romaji: 'One Piece', english: 'One Piece', native: null },
  coverImage: { large: 'op.jpg', medium: 'op.jpg' },
  bannerImage: null,
  description: 'Piraten.',
  chapters: null,
  volumes: null,
  status: 'RELEASING',
  format: 'MANGA',
  countryOfOrigin: 'JP',
  genres: ['Action'],
  averageScore: 92,
  startDate: { year: 1997, month: 7, day: 22 },
  isAdult: false,
  recommendations: {
    edges: [
      {
        node: {
          mediaRecommendation: {
            id: 21,
            title: { romaji: 'Naruto', english: null },
            coverImage: { large: 'n.jpg' },
            format: 'MANGA',
            status: 'FINISHED',
          },
        },
      },
    ],
  },
};
vi.mock('../../services/api/mangaDetails', () => ({
  getMangaDetails: vi.fn(async () => manga),
}));
vi.mock('../../services/catalog/mangaCatalog', () => ({
  loadMangaCatalogItem: vi.fn(async () => null),
  mangaCatalogItemToResult: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const { createElement, forwardRef } = await import('react');
  const SKIP = new Set(['initial', 'animate', 'exit', 'whileTap', 'transition', 'variants']);
  const make = (tag: string) =>
    forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const k in props) if (!SKIP.has(k)) clean[k] = props[k];
      return createElement(tag, { ...clean, ref });
    });
  const cache: Record<string, unknown> = {};
  return {
    motion: new Proxy(
      {},
      { get: (_t: object, tag: string | symbol) => (cache[String(tag)] ??= make(String(tag))) }
    ),
  };
});

import { GuestBookPage } from './GuestBookPage';
import { GuestMangaPage } from './GuestMangaPage';

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
  addReadingPickMock.mockReset();
});

describe('GuestBookPage', () => {
  it('zeigt Katalogdaten mit übersetztem Klappentext und Autoren-Reihe', async () => {
    render(<GuestBookPage bookId="hc-1" />);
    expect(
      await screen.findByRole('heading', { name: 'Fourth Wing', level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText('Drachen auf Deutsch.')).toBeInTheDocument();
    expect(screen.getByText('640 Seiten')).toBeInTheDocument();
    expect((await screen.findByText('Iron Flame')).closest('a')).toHaveAttribute(
      'href',
      '/books/hc-2'
    );
  });

  it('legt das Buch als Lese-Auswahl ab und geht ins Onboarding', async () => {
    render(<GuestBookPage bookId="hc-1" />);
    fireEvent.click((await screen.findAllByText('Jetzt tracken — kostenlos'))[0]);
    expect(addReadingPickMock).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'book-hc-1', status: 'planned' })
    );
    expect(navigateMock).toHaveBeenCalledWith('/join');
  });

  it('meldet unbekannte Bücher', async () => {
    render(<GuestBookPage bookId="gb-unbekannt" />);
    expect(await screen.findByText('Titel nicht gefunden.')).toBeInTheDocument();
  });
});

describe('GuestMangaPage', () => {
  it('zeigt AniList-Daten, Hinweis auf laufende Serie und Empfehlungen als Gast-Links', async () => {
    render(<GuestMangaPage anilistId={30013} />);
    expect(await screen.findByRole('heading', { name: 'One Piece', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Erscheint noch')).toBeInTheDocument();
    expect(screen.getByText('Naruto').closest('a')).toHaveAttribute('href', '/manga/21');
  });

  it('legt den Manga als Lese-Auswahl ab', async () => {
    render(<GuestMangaPage anilistId={30013} />);
    fireEvent.click((await screen.findAllByText('Jetzt tracken — kostenlos'))[0]);
    expect(addReadingPickMock).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'manga-30013', status: 'planned' })
    );
  });
});
