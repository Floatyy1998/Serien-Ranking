// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../../types/Book';

const feed = vi.hoisted(() => ({
  state: {
    items: [] as BookSearchResult[],
    loading: false,
    loadingMore: false,
    error: false,
    finished: true,
  },
  calls: [] as unknown[],
}));

vi.mock('@mui/icons-material', () => ({
  AutoFixHigh: () => null,
  Bolt: () => null,
  DarkMode: () => null,
  RocketLaunch: () => null,
  Favorite: () => null,
  Fingerprint: () => null,
  HistoryEdu: () => null,
  Lightbulb: () => null,
  Science: () => null,
}));
vi.mock('../../../services/i18n', () => ({ appLocale: 'de', t: (text: string) => text }));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#ef6f8a',
      accent: '#f2a648',
      background: { default: '#222' },
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
    },
  }),
}));
vi.mock('../../../components/ui', () => ({
  BackButton: () => <button type="button">Zurück</button>,
  FilterPill: ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  ),
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabSwitcher: ({
    tabs,
    activeTab,
    onTabChange,
  }: {
    tabs: { id: string; label: string }[];
    activeTab: string;
    onTabChange: (id: string) => void;
  }) => (
    <div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('../../../hooks/books/useCatalogFeed', () => ({
  useCatalogFeed: (genre: string | undefined, options: unknown) => {
    feed.calls.push({ genre, options });
    return { sentinelRef: { current: null }, ...feed.state };
  },
}));
vi.mock('../components/BookCover', () => ({ BookCover: () => null }));
vi.mock('./DiscoverParts', () => ({
  DiscoverCard: ({ result }: { result: BookSearchResult }) => <div>{result.title}</div>,
  SkeletonCards: () => <div>lädt</div>,
}));
vi.mock('./useAddFlow', () => ({
  useAddFlow: () => ({ openAdd: vi.fn(), sheet: null }),
  useHideOwned: () => () => false,
}));

import { AllGenresView, CatalogGenreView } from './CatalogViews';

const book = (n: number): BookSearchResult => ({
  id: `hc-${n}`,
  title: `Buch ${n}`,
  authors: [`Autor ${n}`],
  source: 'hardcover',
});

const Where = () => <div data-testid="where">{useLocation().search}</div>;

afterEach(() => {
  cleanup();
  feed.calls.length = 0;
  feed.state = { items: [], loading: false, loadingMore: false, error: false, finished: true };
});

describe('AllGenresView', () => {
  it('zeigt Gruppen, Genres und Stimmungen und öffnet ein Genre', () => {
    render(
      <MemoryRouter initialEntries={['/books/search?all=1']}>
        <AllGenresView />
        <Where />
      </MemoryRouter>
    );
    expect(screen.getByText('Fantasy & Science-Fiction')).toBeTruthy();
    expect(screen.getByText('Sachbuch & Wissen')).toBeTruthy();
    expect(screen.getByText('Romantasy')).toBeTruthy();
    fireEvent.click(screen.getByText('Romantasy'));
    expect(screen.getByTestId('where').textContent).toBe('?cat=romantasy');
  });

  it('öffnet eine Stimmung', () => {
    render(
      <MemoryRouter initialEntries={['/books/search?all=1']}>
        <AllGenresView />
        <Where />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Entspannend'));
    expect(screen.getByTestId('where').textContent).toBe('?mood=relaxing');
  });
});

describe('CatalogGenreView', () => {
  const view = (path: string, genre?: string, mood?: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/books/search" element={<CatalogGenreView genre={genre} mood={mood} />} />
        </Routes>
        <Where />
      </MemoryRouter>
    );

  it('zeigt Titel, Bücher und fragt Genre mit Stimmung und Sortierung ab', () => {
    feed.state = { ...feed.state, items: [book(1), book(2)] };
    view('/books/search?cat=horror&mood=dark&sort=top', 'horror', 'dark');
    expect(screen.getByRole('heading', { name: 'Horror' })).toBeTruthy();
    expect(screen.getByText('Buch 1')).toBeTruthy();
    expect(feed.calls[feed.calls.length - 1]).toEqual({
      genre: 'horror',
      options: { mood: 'dark', sort: 'top' },
    });
  });

  it('wechselt die Sortierung und die Stimmung über die Adresse', () => {
    feed.state = { ...feed.state, items: [book(1)] };
    view('/books/search?cat=fantasy', 'fantasy');
    fireEvent.click(screen.getByRole('tab', { name: 'Top' }));
    expect(screen.getByTestId('where').textContent).toContain('sort=top');
    fireEvent.click(screen.getByText('Düster'));
    expect(screen.getByTestId('where').textContent).toContain('mood=dark');
  });

  it('zeigt bei Stimmung ohne Genre den Namen der Stimmung', () => {
    feed.state = { ...feed.state, items: [book(1)] };
    view('/books/search?mood=relaxing', undefined, 'relaxing');
    expect(screen.getByRole('heading', { name: 'Entspannend' })).toBeTruthy();
  });

  it('meldet einen Fehler, wenn nichts ankommt', () => {
    feed.state = { ...feed.state, error: true };
    view('/books/search?cat=poetry', 'poetry');
    expect(screen.getByText('Die Buchsuche ist gerade nicht erreichbar.')).toBeTruthy();
  });
});
