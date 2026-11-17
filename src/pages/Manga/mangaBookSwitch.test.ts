import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';

const fb = vi.hoisted(() => ({
  update: vi.fn().mockResolvedValue(undefined),
  refUpdate: vi.fn().mockResolvedValue(undefined),
  path: '',
}));
vi.mock('../../services/db/ref', async () => {
  const { paths } = await import('../../services/db/paths');
  return {
    paths,
    dbUpdate: fb.update,
    dbRef: (path: string) => {
      fb.path = path;
      return { update: fb.refUpdate };
    },
  };
});

import {
  moveMangaToBooks,
  rememberSourceBooks,
  restoreBookFromManga,
  restoreMangaFromBooks,
} from './mangaBookSwitch';

const book = {
  id: 'dnb-1',
  title: 'Band 1',
  authors: [],
  status: 'planned' as const,
  currentPage: 0,
  addedAt: 'x',
};

beforeEach(() => vi.clearAllMocks());

describe('mangaBookSwitch', () => {
  it('merkt sich Bücher an einem schon geführten Manga', async () => {
    await rememberSourceBooks('u1', 42, [book]);
    expect(fb.path).toBe('users/u1/manga/42');
    expect(fb.refUpdate).toHaveBeenCalledWith({ 'fromBooks/dnb-1': book });
  });

  it('nimmt den Besitz eines Buchs als Band mit und beim Rückgängig wieder weg', async () => {
    const since = '2026-11-17T10:00:00.000Z';
    const owned = { ...book, title: 'One Piece 113', ownedAt: since };
    const manga = { anilistId: 42, title: 'One Piece' } as Manga;
    const fields = await rememberSourceBooks('u1', 42, [owned], manga);
    expect(fb.refUpdate).toHaveBeenCalledWith({
      'fromBooks/dnb-1': owned,
      'ownedVolumes/v113': since,
      ownedAt: since,
    });
    expect(fields).toEqual(['ownedVolumes/v113', 'ownedAt']);
    await restoreBookFromManga('u1', owned, 42, {
      mangaWasNew: false,
      seriesAsBooks: false,
      ownedFields: fields,
    });
    expect(fb.update).toHaveBeenLastCalledWith({
      'users/u1/books/dnb-1/hidden': null,
      'users/u1/manga/42/fromBooks/dnb-1': null,
      'users/u1/manga/42/ownedVolumes/v113': null,
      'users/u1/manga/42/ownedAt': null,
    });
  });

  it('zieht Manga, Bücher und Wunsch „als Bücher" in einem Schreibvorgang um', async () => {
    const manga = {
      nmr: 1,
      anilistId: 42,
      title: 'X',
      poster: '',
      rating: {},
      currentChapter: 0,
      readStatus: 'reading',
      fromBooks: { 'dnb-1': book },
    } as Manga;
    const books = await moveMangaToBooks('u1', manga, new Set());
    expect(books).toEqual([book]);
    expect(fb.update).toHaveBeenCalledWith({
      'users/u1/manga/42': null,
      'users/u1/mangaAsBooks/42': true,
      'users/u1/books/dnb-1': book,
    });
  });

  it('macht „Als Buch führen" in einem Schreibvorgang rückgängig', async () => {
    const manga = { anilistId: 42, title: 'X', currentVolume: 3, notes: undefined } as Manga;
    await restoreMangaFromBooks('u1', manga, [book]);
    expect(fb.update).toHaveBeenCalledWith({
      'users/u1/manga/42': { anilistId: 42, title: 'X', currentVolume: 3 },
      'users/u1/mangaAsBooks/42': null,
      'users/u1/books/dnb-1': null,
    });
  });

  it('nimmt beim Rückgängig von „Als Manga führen" nur den eigenen Anteil zurück', async () => {
    await restoreBookFromManga('u1', book, 42, { mangaWasNew: false, seriesAsBooks: false });
    expect(fb.update).toHaveBeenLastCalledWith({
      'users/u1/books/dnb-1/hidden': null,
      'users/u1/manga/42/fromBooks/dnb-1': null,
    });
    await restoreBookFromManga('u1', book, 42, { mangaWasNew: true, seriesAsBooks: true });
    expect(fb.update).toHaveBeenLastCalledWith({
      'users/u1/books/dnb-1/hidden': null,
      'users/u1/manga/42': null,
      'users/u1/mangaAsBooks/42': true,
    });
  });
});
