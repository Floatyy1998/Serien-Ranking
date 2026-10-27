import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../../types/Book';

const writes = vi.hoisted(() => ({
  update: vi.fn(async () => {}),
  set: vi.fn(async () => {}),
  push: vi.fn(async () => {}),
}));

vi.mock('../db/ref', () => ({
  dbRef: () => writes,
  dbUpdate: vi.fn(),
  paths: {
    bookItem: (uid: string, id: string) => `users/${uid}/books/${id}`,
    bookEvents: (uid: string, year: number) => `users/${uid}/wrapped/${year}/bookEvents`,
  },
}));

vi.mock('../api/booksApi', () => ({ resolveCover: async () => 'https://cover.test/x.jpg' }));
vi.mock('../catalog/bookCatalog', () => ({ keepInCatalog: vi.fn() }));

import { addBook, setBookStatus, setBookWish, updateBookProgress } from './bookService';

const wished: Book = {
  id: 'b1',
  title: 'Onyx Storm',
  authors: ['Rebecca Yarros'],
  status: 'planned',
  currentPage: 0,
  pageCount: 500,
  addedAt: '2026-10-01T00:00:00.000Z',
  wishedAt: '2026-10-02T00:00:00.000Z',
};

describe('Wunschliste', () => {
  beforeEach(() => {
    writes.update.mockClear();
    writes.set.mockClear();
  });

  it('legt ein Buch direkt als Wunsch an', async () => {
    const book = await addBook(
      'u1',
      { id: 'gb-x', title: 'Onyx Storm', authors: [], source: 'google' },
      'planned',
      { wish: true }
    );
    expect(book.wishedAt).toBeTruthy();
    expect(writes.set).toHaveBeenCalledWith(expect.objectContaining({ wishedAt: book.wishedAt }));
  });

  it('nimmt ein Buch von der Wunschliste, sobald gelesen wird', async () => {
    await setBookStatus('u1', wished, 'reading');
    expect(writes.update).toHaveBeenCalledWith(expect.objectContaining({ wishedAt: null }));
    writes.update.mockClear();
    await updateBookProgress('u1', { ...wished, status: 'reading' }, 40);
    expect(writes.update).toHaveBeenCalledWith(expect.objectContaining({ wishedAt: null }));
  });

  it('lässt den Wunsch stehen, wenn das Buch nur pausiert wird', async () => {
    await setBookStatus('u1', wished, 'paused');
    expect(writes.update).toHaveBeenCalledWith(expect.not.objectContaining({ wishedAt: null }));
  });

  it('schaltet den Wunsch an und aus', async () => {
    await setBookWish('u1', 'b1', true);
    expect(writes.update).toHaveBeenLastCalledWith({ wishedAt: expect.any(String) });
    await setBookWish('u1', 'b1', false);
    expect(writes.update).toHaveBeenLastCalledWith({ wishedAt: null });
  });
});
