import type { Book, BookSearchResult, BookStatus } from '../../types/Book';
import { normalizeEvents, type CompactBookEvent } from '../../lib/books/bookEvents';
import {
  applyPageUpdate,
  applyStatusChange,
  type ProgressUpdate,
} from '../../lib/books/bookProgress';
import { searchResultToBook, stripUndefined } from '../../lib/books/bookSearchMapping';
import { resolveCover } from '../api/booksApi';
import { dbRef, dbUpdate, paths } from '../db/ref';

const nowIso = () => new Date().toISOString();

function baseEvent(book: Book, t: CompactBookEvent['t']): CompactBookEvent {
  const event: CompactBookEvent = {
    ts: Math.floor(Date.now() / 1000),
    t,
    s: book.id,
    st: book.title,
  };
  if (book.authors?.[0]) event.a = book.authors[0];
  if (book.pageCount) event.pc = book.pageCount;
  if (book.categories?.length) event.g = book.categories.slice(0, 3);
  if ((book.rereadCount ?? 0) > 0) event.rr = 1;
  return event;
}

async function pushEvent(uid: string, event: CompactBookEvent): Promise<void> {
  try {
    await dbRef(paths.bookEvents(uid, new Date().getFullYear())).push(event);
  } catch {
    /* Statistik-Event ist best effort */
  }
}

export interface AddBookOptions {
  /** „Früher gelesen": beendet, aber ohne Datum — zählt in keinem Jahresrückblick. */
  finishedEarlier?: boolean;
}

export async function addBook(
  uid: string,
  result: BookSearchResult,
  status: BookStatus,
  options: AddBookOptions = {}
): Promise<Book> {
  const cover = await resolveCover(result);
  const book = searchResultToBook(result, status, nowIso(), cover);
  if (!cover) delete book.cover;
  if (status === 'completed' && options.finishedEarlier) {
    delete book.completedAt;
    delete book.startedAt;
  }
  await dbRef(paths.bookItem(uid, book.id)).set(book);
  if (status === 'completed' && !options.finishedEarlier) {
    await pushEvent(uid, baseEvent(book, 'fin'));
  }
  return book;
}

/** Buch eines Freundes übernehmen: nur die Buchdaten, Stand und Bewertung bleiben bei ihm. */
export async function addBookCopy(uid: string, source: Book): Promise<void> {
  const book: Book = stripUndefined({
    id: source.id,
    title: source.title,
    subtitle: source.subtitle,
    authors: source.authors,
    cover: source.cover,
    pageCount: source.pageCount,
    publishedYear: source.publishedYear,
    publisher: source.publisher,
    language: source.language,
    categories: source.categories,
    isbn13: source.isbn13,
    googleId: source.googleId,
    olWorkId: source.olWorkId,
    series: source.series,
    source: source.source,
    status: 'planned' as const,
    currentPage: 0,
    addedAt: nowIso(),
  });
  await dbRef(paths.bookItem(uid, book.id)).set(book);
}

export async function updateBookProgress(
  uid: string,
  book: Book,
  page: number
): Promise<ProgressUpdate> {
  const result = applyPageUpdate(book, page, nowIso());
  await dbRef(paths.bookItem(uid, book.id)).update(result.updates);
  if (result.pagesRead > 0) {
    const event = baseEvent(book, 'pg');
    event.p = result.newPage;
    event.p0 = book.currentPage || 0;
    event.n = result.pagesRead;
    await pushEvent(uid, event);
  }
  if (result.finished) await pushEvent(uid, baseEvent(book, 'fin'));
  return result;
}

export async function setBookStatus(
  uid: string,
  book: Book,
  status: BookStatus,
  options: AddBookOptions = {}
): Promise<Partial<Book>> {
  const updates = applyStatusChange(book, status, nowIso());
  const payload: Record<string, unknown> = { ...updates };
  if (status === 'completed' && options.finishedEarlier) payload.completedAt = null;
  if (status !== 'completed' && book.status === 'completed' && status !== 'reading') {
    payload.completedAt = null;
  }
  await dbRef(paths.bookItem(uid, book.id)).update(payload);
  if (status === 'completed' && !options.finishedEarlier && book.status !== 'completed') {
    const pagesLeft = book.pageCount ? book.pageCount - (book.currentPage || 0) : 0;
    if (pagesLeft > 0) {
      const event = baseEvent(book, 'pg');
      event.p = book.pageCount;
      event.p0 = book.currentPage || 0;
      event.n = pagesLeft;
      await pushEvent(uid, event);
    }
    await pushEvent(uid, baseEvent(book, 'fin'));
  }
  return updates;
}

export async function setBookRating(uid: string, book: Book, rating: number): Promise<void> {
  await dbRef(paths.bookItem(uid, book.id)).update({ rating: rating > 0 ? rating : null });
  if (rating > 0) {
    const event = baseEvent(book, 'rg');
    event.rat = rating;
    await pushEvent(uid, event);
  }
}

/** Freie Felder (Notizen, Format, Seitenzahl, Reihe); undefined löscht nichts, null schon. */
export async function updateBookFields(
  uid: string,
  bookId: string,
  fields: Record<string, unknown>
): Promise<void> {
  await dbRef(paths.bookItem(uid, bookId)).update(fields);
}

export async function removeBook(uid: string, bookId: string): Promise<void> {
  await dbRef(paths.bookItem(uid, bookId)).remove();
}

export async function setBookHidden(uid: string, bookId: string, hidden: boolean): Promise<void> {
  await dbRef(paths.bookItem(uid, bookId)).update({ hidden: hidden || null });
}

export async function setReadingGoal(uid: string, year: number, goal: number): Promise<void> {
  await dbRef(paths.bookGoal(uid, year)).set(goal > 0 ? Math.round(goal) : null);
}

export async function fetchBookEvents(uid: string, year: number): Promise<CompactBookEvent[]> {
  const snap = await dbRef(paths.bookEvents(uid, year)).once('value');
  return normalizeEvents(snap.val());
}

/** Import in Paketen — ein riesiges Multi-Path-Update sprengt sonst das RTDB-Limit. */
export async function importBooks(
  uid: string,
  books: Book[],
  onProgress?: (done: number) => void
): Promise<number> {
  let done = 0;
  for (let i = 0; i < books.length; i += 150) {
    const updates: Record<string, unknown> = {};
    for (const book of books.slice(i, i + 150)) {
      updates[paths.bookItem(uid, book.id)] = stripUndefined(book);
    }
    await dbUpdate(updates);
    done += Object.keys(updates).length;
    onProgress?.(done);
  }
  return done;
}
