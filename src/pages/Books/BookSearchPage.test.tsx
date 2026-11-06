// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookSearchPage } from './BookSearchPage';

const router = vi.hoisted(() => {
  let current = new URLSearchParams();
  let deferred: URLSearchParams[] = [];
  let defer = false;
  const listeners = new Set<() => void>();
  const commit = (next: URLSearchParams) => {
    current = next;
    listeners.forEach((l) => l());
  };
  return {
    reset() {
      current = new URLSearchParams();
      deferred = [];
      defer = false;
    },
    deferUpdates(on: boolean) {
      defer = on;
    },
    flush() {
      const pending = deferred;
      deferred = [];
      pending.forEach(commit);
    },
    get: () => current,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    set(update: (prev: URLSearchParams) => URLSearchParams) {
      const next = update(new URLSearchParams(current));
      if (defer) deferred.push(next);
      else commit(next);
    },
  };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [useSyncExternalStore(router.subscribe, router.get), router.set],
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      background: { default: '#000', surface: '#111' },
      border: { default: '#333' },
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
    },
  }),
}));

vi.mock('../../contexts/BooksListContext', () => ({ useBooksList: () => ({ allBookList: [] }) }));
vi.mock('../../hooks/books/useBasedOnBooks', () => ({
  useBooksForYourShows: () => ({ suggestions: [] }),
}));
vi.mock('../../hooks/books/useBookSearch', () => ({
  useBookSearch: () => ({ results: [], loading: true, error: null }),
}));
vi.mock('../../hooks/books/useMangaVolumes', () => ({
  useMangaVolumes: () => ({ links: new Map(), pending: false, isPending: () => false }),
}));
vi.mock('../../hooks/books/useOwnedBooks', () => ({ useOwnedBooks: () => () => undefined }));
vi.mock('../../hooks/ui/useBookAddPrompt', () => ({ useBookAddPrompt: () => false }));
vi.mock('../../services/settings/recentSearches', () => ({
  addRecentSearch: vi.fn(),
  useRecentSearches: () => [],
}));
vi.mock('../Manga/useAddManga', () => ({ useAddManga: () => ({ add: vi.fn(), addingId: null }) }));
vi.mock('./hooks/useBookActions', () => ({ useBookActions: () => ({ add: vi.fn() }) }));
vi.mock('../../components/ui', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  BackButton: () => null,
}));
vi.mock('../../components/scanner/IsbnScanButton', () => ({ IsbnScanButton: () => null }));
vi.mock('./sections/ForYourShowsSection', () => ({ ForYourShowsSection: () => null }));
vi.mock('./discover/CatalogViews', () => ({
  AllGenresView: () => null,
  CatalogGenreView: () => null,
}));
vi.mock('./discover/GenreView', () => ({ GenreView: () => null }));

const field = () => screen.getByRole('textbox') as HTMLInputElement;

beforeEach(() => {
  vi.useFakeTimers();
  router.reset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('BookSearchPage Suchfeld', () => {
  it('behält Zeichen, die nach dem verzögerten URL-Schreiben getippt wurden', () => {
    render(<BookSearchPage />);
    router.deferUpdates(true);

    fireEvent.change(field(), { target: { value: '978344' } });
    act(() => vi.advanceTimersByTime(400));
    fireEvent.change(field(), { target: { value: '9783442' } });
    act(() => router.flush());

    expect(field().value).toBe('9783442');
    expect(router.get().get('q')).toBe('978344');
  });

  it('übernimmt eine von außen geänderte URL ins Feld', () => {
    render(<BookSearchPage />);
    fireEvent.change(field(), { target: { value: 'Dune' } });
    act(() => vi.advanceTimersByTime(400));

    act(() => router.set(() => new URLSearchParams('q=Hyperion')));

    expect(field().value).toBe('Hyperion');
  });
});
