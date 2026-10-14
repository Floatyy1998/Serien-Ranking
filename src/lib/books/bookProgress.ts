import type { Book, BookStatus } from '../../types/Book';

/** Lesetempo für Zeitschätzungen (Seiten pro Stunde). */
export const PAGES_PER_HOUR = 40;

export function clampPage(page: number, pageCount: number | undefined): number {
  const safe = Math.max(0, Math.round(Number.isFinite(page) ? page : 0));
  return pageCount && pageCount > 0 ? Math.min(safe, pageCount) : safe;
}

export function progressPercent(book: Pick<Book, 'status' | 'currentPage' | 'pageCount'>): number {
  if (book.status === 'completed') return 100;
  if (!book.pageCount || book.pageCount <= 0) return 0;
  return Math.min(100, Math.round((book.currentPage / book.pageCount) * 100));
}

/** Insgesamt gelesene Seiten eines Buchs, abgeschlossene Re-Reads eingerechnet. */
export function pagesReadOf(
  book: Pick<Book, 'status' | 'currentPage' | 'pageCount' | 'rereadCount'>
): number {
  const current =
    book.status === 'completed'
      ? Math.max(book.pageCount ?? 0, book.currentPage || 0)
      : book.currentPage || 0;
  return current + (book.rereadCount ?? 0) * (book.pageCount ?? 0);
}

export function remainingPages(book: Pick<Book, 'currentPage' | 'pageCount'>): number | null {
  if (!book.pageCount) return null;
  return Math.max(0, book.pageCount - book.currentPage);
}

/** „noch ~3 h" — null, wenn die Seitenzahl unbekannt ist. */
export function remainingHours(book: Pick<Book, 'currentPage' | 'pageCount'>): number | null {
  const left = remainingPages(book);
  if (left === null) return null;
  return Math.round((left / PAGES_PER_HOUR) * 10) / 10;
}

export interface ProgressUpdate {
  updates: Partial<Book>;
  pagesRead: number;
  finished: boolean;
  newPage: number;
}

export function applyPageUpdate(book: Book, page: number, nowIso: string): ProgressUpdate {
  const newPage = clampPage(page, book.pageCount);
  const updates: Partial<Book> = { currentPage: newPage, lastReadAt: nowIso };
  if ((book.status === 'planned' || book.status === 'paused') && newPage > 0) {
    updates.status = 'reading';
    if (!book.startedAt) updates.startedAt = nowIso;
  }
  const finished =
    !!book.pageCount && newPage >= book.pageCount && book.status !== 'completed' && newPage > 0;
  if (finished) {
    updates.status = 'completed';
    updates.completedAt = nowIso;
  }
  return {
    updates,
    pagesRead: Math.max(0, newPage - (book.currentPage || 0)),
    finished,
    newPage,
  };
}

export function applyStatusChange(book: Book, status: BookStatus, nowIso: string): Partial<Book> {
  const updates: Partial<Book> = { status };
  if (status === 'reading') {
    if (book.status === 'completed') {
      updates.currentPage = 0;
      updates.rereadCount = (book.rereadCount ?? 0) + 1;
      updates.startedAt = nowIso;
    } else if (!book.startedAt) {
      updates.startedAt = nowIso;
    }
    updates.lastReadAt = nowIso;
  }
  if (status === 'completed') {
    updates.completedAt = nowIso;
    if (book.pageCount) updates.currentPage = book.pageCount;
    if (!book.startedAt) updates.startedAt = nowIso;
  }
  return updates;
}

const STATUS_ORDER: Record<BookStatus, number> = {
  reading: 0,
  paused: 1,
  planned: 2,
  completed: 3,
  dropped: 4,
};

export function sortByRecentActivity(books: Book[]): Book[] {
  const stamp = (b: Book) =>
    new Date(b.lastReadAt || b.completedAt || b.startedAt || b.addedAt || 0).getTime();
  return [...books].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || stamp(b) - stamp(a)
  );
}

export function isFinishedInYear(book: Book, year: number): boolean {
  return (
    book.status === 'completed' &&
    !!book.completedAt &&
    new Date(book.completedAt).getFullYear() === year
  );
}
