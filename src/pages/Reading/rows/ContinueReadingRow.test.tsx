// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../../../types/Book';
import { ContinueReadingRow } from './ContinueReadingRow';

const data = vi.hoisted(() => ({
  books: [] as Book[],
  continueManga: [] as unknown[],
  manga: [] as unknown[],
}));
const saveProgress = vi.hoisted(() => vi.fn(async () => {}));
const saveReadProgress = vi.hoisted(() => vi.fn(async () => {}));
const navigate = vi.hoisted(() => vi.fn());

vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: data.books }),
}));
vi.mock('../../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: data.manga }),
}));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: { primary: '#ff0066', accent: '#00f' } }),
}));
vi.mock('../../../hooks/manga/useContinueReading', () => ({
  useContinueReading: () => data.continueManga,
}));
vi.mock('../../Books/hooks/useBookActions', () => ({ useBookActions: () => ({ saveProgress }) }));
vi.mock('../../Manga/saveReadProgress', () => ({ saveReadProgress }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../../components/ui', () => ({
  SectionHeader: ({ title }: { title?: ReactNode }) => <h2>{title}</h2>,
  HorizontalScrollContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

const book = (id: string, lastReadAt: string): Book =>
  ({
    id,
    title: `Buch ${id}`,
    authors: [],
    status: 'reading',
    currentPage: 40,
    pageCount: 300,
    addedAt: '2026-01-01',
    lastReadAt,
  }) as Book;

const mangaItem = (anilistId: number, lastReadAt: string) => ({
  anilistId,
  title: `Manga ${anilistId}`,
  poster: 'p.jpg',
  progress: 10,
  stand: { unit: 'chapter', current: 12, total: 100, remaining: 88, percent: 12 },
  currentChapter: 12,
  totalChapters: 100,
  lastReadAt,
});

afterEach(() => {
  cleanup();
  data.books = [];
  data.continueManga = [];
  data.manga = [];
  saveProgress.mockClear();
  saveReadProgress.mockClear();
});

const titles = () => [...document.querySelectorAll('.mpc-title')].map((el) => el.textContent ?? '');

describe('ContinueReadingRow', () => {
  it('mischt Bücher und Manga, zuletzt Gelesenes zuerst', () => {
    data.books = [book('a', '2026-10-10T10:00:00Z'), book('b', '2026-10-18T10:00:00Z')];
    data.continueManga = [mangaItem(1, '2026-10-15T10:00:00Z')];
    render(<ContinueReadingRow showBooks showManga />);
    expect(titles()).toEqual(['Buch b', 'Manga 1', 'Buch a']);
  });

  it('blättert ein Buch mit +10 Seiten weiter', () => {
    data.books = [book('a', '2026-10-10T10:00:00Z')];
    render(<ContinueReadingRow showBooks showManga={false} />);
    fireEvent.click(screen.getByRole('button', { name: '„Buch a": 10 Seiten weiter' }));
    expect(saveProgress).toHaveBeenCalledWith(data.books[0], 50);
  });

  it('setzt einen Manga mit +1 ein Kapitel weiter', () => {
    data.continueManga = [mangaItem(7, '2026-10-15T10:00:00Z')];
    data.manga = [{ anilistId: 7, title: 'Manga 7' }];
    render(<ContinueReadingRow showBooks={false} showManga />);
    fireEvent.click(screen.getByRole('button', { name: '„Manga 7": ein Kapitel weiter' }));
    expect(saveReadProgress).toHaveBeenCalledWith('u1', data.manga[0], {
      next: 13,
      previous: 12,
      total: 100,
    });
  });

  it('zeigt nur den genutzten Lesebereich und nichts, wenn nichts offen ist', () => {
    data.books = [book('a', '2026-10-10T10:00:00Z')];
    data.continueManga = [mangaItem(1, '2026-10-15T10:00:00Z')];
    render(<ContinueReadingRow showBooks={false} showManga />);
    expect(titles()).toEqual(['Manga 1']);
    cleanup();
    data.continueManga = [];
    const { container } = render(<ContinueReadingRow showBooks={false} showManga />);
    expect(container.textContent).toBe('');
  });
});
