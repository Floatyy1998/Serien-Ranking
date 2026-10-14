// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BooksListContext, type BooksListContextType } from '../../../contexts/BooksListContext';
import { MangaListContext, type MangaListContextType } from '../../../contexts/MangaListContext';
import type { Book, BookSearchResult } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';

const authUser = vi.hoisted(() => ({ uid: 'u1' }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authUser }) }));

const svc = vi.hoisted(() => ({
  addBook: vi.fn(async (_uid: string, result: { id: string; title: string }) => ({
    ...result,
    status: 'planned',
  })),
  showToast: vi.fn(),
}));
vi.mock('../../../services/books/bookService', () => ({
  addBook: svc.addBook,
  removeBook: vi.fn(),
  setBookHidden: vi.fn(),
  setBookRating: vi.fn(),
  setBookStatus: vi.fn(),
  setBookWish: vi.fn(),
  updateBookFields: vi.fn(),
  updateBookProgress: vi.fn(),
}));
vi.mock('../../../lib/interaction/toast', () => ({
  showToast: svc.showToast,
  showUndoToast: vi.fn(),
}));
vi.mock('../../../lib/interaction/haptics', () => ({
  hapticCelebrate: vi.fn(),
  hapticSuccess: vi.fn(),
}));
vi.mock('../../../features/badges/minimalActivityLogger', () => ({
  logBookFinished: vi.fn(),
  logReadingActivity: vi.fn(),
}));
vi.mock('../../../hooks/books/useBookEvents', () => ({ notifyBookEventsChanged: vi.fn() }));
vi.mock('../../../hooks/pet/usePetReactions', () => ({ triggerPetReaction: vi.fn() }));

const manga = vi.hoisted(() => ({
  resolveMangaVolumes: vi.fn(async (): Promise<Record<string, unknown>> => ({})),
  addMangaToList: vi.fn(async () => {}),
}));
vi.mock('../../../services/books/mangaVolumes', () => ({
  resolveMangaVolumes: manga.resolveMangaVolumes,
}));
vi.mock('../../Manga/addMangaToList', () => ({ addMangaToList: manga.addMangaToList }));

import { useBookActions } from './useBookActions';

const ownedBook = {
  id: 'gb-1',
  title: 'Der Schwarm',
  authors: ['Frank Schätzing'],
  isbn13: '9783462046441',
  status: 'reading',
  currentPage: 10,
  addedAt: '2026-01-01T00:00:00.000Z',
} as Book;

const ownedManga = {
  nmr: 30013,
  anilistId: 30013,
  title: 'One Piece',
  titleRomaji: 'ONE PIECE',
} as Manga;

const hit = (over: Partial<BookSearchResult>): BookSearchResult => ({
  id: 'ol-x',
  title: 'Neu',
  authors: ['Jemand'],
  source: 'openlibrary',
  ...over,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <BooksListContext.Provider
    value={{ allBookList: [ownedBook], bookList: [ownedBook] } as BooksListContextType}
  >
    <MangaListContext.Provider value={{ allMangaList: [ownedManga] } as MangaListContextType}>
      {children}
    </MangaListContext.Provider>
  </BooksListContext.Provider>
);

beforeEach(() => {
  svc.addBook.mockClear();
  svc.showToast.mockClear();
  manga.resolveMangaVolumes.mockClear();
  manga.addMangaToList.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('useBookActions.add', () => {
  it('legt Manga-Bände einer eigenen Manga-Reihe nicht als Buch an', async () => {
    const { result } = renderHook(() => useBookActions(), { wrapper });
    const added = await result.current.add(
      hit({ id: 'dnb-9783551756107', title: 'One Piece 105' }),
      'planned'
    );
    expect(added).toBeNull();
    expect(svc.addBook).not.toHaveBeenCalled();
    expect(svc.showToast.mock.calls[0][0]).toContain('One Piece');
  });

  it('liefert das vorhandene Buch statt einer Dublette aus anderer Quelle', async () => {
    const { result } = renderHook(() => useBookActions(), { wrapper });
    const byIsbn = await result.current.add(
      hit({ id: 'dnb-x', isbn13: '9783462046441' }),
      'planned'
    );
    const byTitle = await result.current.add(
      hit({ id: 'ol-y', title: 'Der Schwarm: Roman', authors: [] }),
      'planned'
    );
    expect(byIsbn).toBe(ownedBook);
    expect(byTitle).toBe(ownedBook);
    expect(svc.addBook).not.toHaveBeenCalled();
  });

  it('legt erkannte Manga-Bände fremder Reihen als Manga an', async () => {
    const spyFamily = {
      id: 108556,
      title: { romaji: 'SPY×FAMILY', english: 'SPY x FAMILY', native: null },
    };
    manga.resolveMangaVolumes.mockResolvedValueOnce({
      'gb-spy3': { manga: spyFamily, volume: 3 },
    });
    const { result } = renderHook(() => useBookActions(), { wrapper });
    const added = await result.current.add(
      hit({
        id: 'gb-spy3',
        title: 'Spy x Family – Band 3',
        categories: ['Comics & Graphic Novels'],
      }),
      'reading'
    );
    expect(added).toBeNull();
    expect(svc.addBook).not.toHaveBeenCalled();
    expect(manga.addMangaToList).toHaveBeenCalledWith('u1', spyFamily, 30014);
    expect(svc.showToast.mock.calls[0][0]).toContain('SPY x FAMILY');
  });

  it('fragt AniList bei Romanen ohne Comic-Merkmal gar nicht erst', async () => {
    const { result } = renderHook(() => useBookActions(), { wrapper });
    await result.current.add(hit({ title: 'Der Herr der Ringe 1' }), 'planned');
    expect(manga.resolveMangaVolumes).not.toHaveBeenCalled();
    expect(svc.addBook).toHaveBeenCalledOnce();
  });

  it('fügt neue Bücher normal hinzu', async () => {
    const { result } = renderHook(() => useBookActions(), { wrapper });
    const added = await result.current.add(hit({ title: 'Die Verwandlung' }), 'planned');
    expect(added?.id).toBe('ol-x');
    expect(svc.addBook).toHaveBeenCalledOnce();
  });
});
