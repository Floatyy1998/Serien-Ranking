// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultReadingLayout, type ReadingLayout } from '../../lib/layout/readingLayout';
import type { BookYear } from '../Books/hooks/useBookYear';
import { ReadingBody } from './ReadingBody';

const state = vi.hoisted(() => ({
  books: 1,
  manga: 1,
  layout: null as ReadingLayout | null,
}));

vi.mock('../../contexts/BooksListContext', () => ({
  useBooksList: () => ({ bookList: Array.from({ length: state.books }), loading: false }),
}));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: Array.from({ length: state.manga }), loading: false }),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#0f0',
      accent: '#00f',
      text: { secondary: '#aaa', muted: '#777' },
      status: { warning: '#f90' },
    },
  }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('framer-motion', () => ({
  motion: { button: ({ children }: { children?: ReactNode }) => <button>{children}</button> },
}));
vi.mock('../../components/ui', () => ({
  SectionHeader: ({ title }: { title?: ReactNode }) => <h2>{title}</h2>,
}));
vi.mock('../Books/components/Bookshelf', () => ({ Bookshelf: () => null }));
vi.mock('../Books/sections/BookStatsSection', () => ({ StatTile: () => null }));
vi.mock('../../hooks/ui/useReadingLayout', () => ({
  useReadingLayout: () => state.layout ?? defaultReadingLayout(),
}));
vi.mock('../Books/hooks/useReadingOverview', () => ({
  useReadingOverview: () => ({
    shelf: [{ id: 'x' }],
    totalReading: 0,
    finishedThisYear: 0,
    chapters: 0,
    yearStats: { pagesRead: 0 },
  }),
}));

const block = (name: string) => <div data-testid="block">{name}</div>;
vi.mock('./rows/ContinueReadingRow', () => ({
  ContinueReadingRow: ({ showBooks, showManga }: { showBooks: boolean; showManga: boolean }) =>
    block(`continue:${showBooks ? 'b' : ''}${showManga ? 'm' : ''}`),
}));
vi.mock('./rows/NewForYouRow', () => ({ NewForYouRow: () => block('new') }));
vi.mock('./rows/UpNextRow', () => ({ UpNextRow: () => block('up-next') }));
vi.mock('./rows/ReadingQuickActions', () => ({
  ReadingQuickActions: ({ showBooks, showManga }: { showBooks: boolean; showManga: boolean }) =>
    block(`quick-actions:${showBooks ? 'b' : ''}${showManga ? 'm' : ''}`),
}));
vi.mock('./rows/ReadingExtrasRow', () => ({
  ReadingExtrasRow: ({ goal }: { goal: ReactNode }) => <>{goal}</>,
}));
vi.mock('./rows/LibrarySection', () => ({
  LibrarySection: ({ showBooks, showManga }: { showBooks: boolean; showManga: boolean }) =>
    block(`library:${showBooks ? 'b' : ''}${showManga ? 'm' : ''}`),
}));
type Area = { showBooks: boolean; showManga: boolean };
const area = ({ showBooks, showManga }: Area) => `${showBooks ? 'b' : ''}${showManga ? 'm' : ''}`;
vi.mock('./discover/MixedDiscover', () => ({
  NewMixedRow: (p: Area) => block(`discover-new:${area(p)}`),
  ForYouMixedRow: (p: Area) => block(`discover-for-you:${area(p)}`),
  GenreMixedRow: (p: Area & { id: string }) => block(`genre-${p.id}:${area(p)}`),
}));
vi.mock('../Books/discover/DiscoverParts', () => ({
  GenreTiles: ({ only }: { only?: string[] }) => block(`genre-tiles:${only ? 'manga' : 'all'}`),
}));
vi.mock('../Books/useBookSections', () => ({
  useBookSections: () => ({
    hasBooks: true,
    nextVolumes: [],
    goal: block('goal'),
    wished: block('wished'),
    owned: block('owned'),
    friends: block('friends'),
    paused: block('paused'),
    shelf: block('book-shelf'),
    stats: block('book-stats'),
    forYourShows: block('for-shows'),
    hero: block('hero'),
    genres: { picked: [], favorite: [], shelves: ['fantasy', 'biography'], edit: vi.fn() },
    dedupe: null,
    sheets: null,
  }),
}));
vi.mock('../Manga/useMangaSections', () => ({
  useMangaSections: () => ({
    hasManga: true,
    forYouCards: { reread: block('reread-card'), hidden: block('hidden-card') },
    recentlyAdded: block('recently-added'),
    stats: block('manga-stats'),
  }),
}));

const bookYear = { now: 0, year: 2026, yearStats: { pagesRead: 0 } } as unknown as BookYear;

const blocks = (areas: 'both' | 'books' | 'manga' = 'both') => {
  render(
    <ReadingBody
      areas={areas}
      bookYear={bookYear}
      readingRef={{ current: null }}
      onSearch={vi.fn()}
    />
  );
  return [...document.querySelectorAll('[data-testid="block"]')].map((b) => b.textContent);
};

afterEach(() => {
  cleanup();
  state.books = 1;
  state.manga = 1;
  state.layout = null;
});

describe('ReadingBody', () => {
  it('beginnt mit dem Schnellzugriff und den gemischten Reihen, lässt Ausgeblendetes weg', () => {
    const shown = blocks();
    expect(shown.slice(0, 4)).toEqual(['quick-actions:bm', 'goal', 'continue:bm', 'new']);
    expect(shown).toContain('up-next');
    expect(shown).not.toContain('owned');
    expect(shown).not.toContain('book-stats');
  });

  it('zeigt das Leseziel direkt unter dem Schnellzugriff, „Für dich" nur mit Manga-Karten', () => {
    const shown = blocks();
    expect(shown.indexOf('goal')).toBe(1);
    expect(shown.indexOf('hidden-card')).toBe(shown.indexOf('reread-card') + 1);
  });

  it('folgt der Reihenfolge aus dem Lesen-Layout', () => {
    const layout = defaultReadingLayout();
    layout.sections.order = ['library', ...layout.sections.order.filter((id) => id !== 'library')];
    layout.sections.hidden = ['continue-reading'];
    layout.forYou.hidden = ['reread'];
    state.layout = layout;
    const shown = blocks();
    expect(shown[0]).toBe('library:bm');
    expect(shown).not.toContain('continue:bm');
    expect(shown).not.toContain('reread-card');
  });

  it('blendet bei nur Büchern alle Manga-Bausteine aus', () => {
    const shown = blocks('books');
    expect(shown).toContain('continue:b');
    expect(shown).toContain('goal');
    expect(shown).toContain('library:b');
    expect(shown).toContain('quick-actions:b');
    for (const id of ['reread-card', 'discover-new:bm']) {
      expect(shown).not.toContain(id);
    }
  });

  it('blendet bei nur Manga alle Buch-Bausteine aus', () => {
    const shown = blocks('manga');
    expect(shown).toContain('continue:m');
    for (const id of ['goal', 'wished', 'hero', 'for-shows']) {
      expect(shown).not.toContain(id);
    }
  });

  it('mischt Bücher und Manga in Entdecken, auch bei den Genres', () => {
    const shown = blocks();
    expect(shown).toContain('hero');
    expect(shown).toContain('discover-new:bm');
    expect(shown).toContain('discover-for-you:bm');
    expect(shown).toContain('genre-tiles:all');
    expect(shown).toContain('genre-fantasy:bm');
    expect(shown).toContain('genre-biography:bm');
  });

  it('schlägt ohne eigene Bücher keine Bücher vor', () => {
    state.books = 0;
    const shown = blocks();
    expect(shown).toContain('discover-new:m');
    expect(shown).toContain('genre-tiles:manga');
    expect(shown).toContain('genre-fantasy:m');
    expect(shown).not.toContain('genre-biography:m');
    for (const id of ['hero', 'for-shows']) expect(shown).not.toContain(id);
  });

  it('schlägt ohne eigene Manga keine Manga vor', () => {
    state.manga = 0;
    const shown = blocks();
    expect(shown).toContain('discover-new:b');
    expect(shown).toContain('genre-tiles:all');
    expect(shown).toContain('hero');
  });

  it('zeigt Neuen ohne Bibliothek beides zum Entdecken', () => {
    state.books = 0;
    state.manga = 0;
    expect(blocks()).toContain('discover-new:bm');
  });
});
