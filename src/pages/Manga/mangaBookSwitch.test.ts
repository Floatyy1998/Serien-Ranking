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

import { moveMangaToBooks, rememberSourceBooks } from './mangaBookSwitch';

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
});
