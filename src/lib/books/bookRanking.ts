import type { Book } from '../../types/Book';

const lastActivity = (b: Book) =>
  new Date(b.completedAt || b.lastReadAt || b.addedAt || 0).getTime();

/** Suche über Titel und Autor; bestbewertete zuerst, bei Gleichstand zuletzt gelesene. */
export function rankBooksByRating(books: Book[], search = ''): Book[] {
  const query = search.trim().toLowerCase();
  return books
    .filter(
      (b) =>
        !query ||
        b.title.toLowerCase().includes(query) ||
        (b.authors ?? []).some((a) => a.toLowerCase().includes(query))
    )
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || lastActivity(b) - lastActivity(a));
}

export function bookRatingStats(books: Book[]): { count: number; average: number } {
  const rated = books.filter((b) => (b.rating ?? 0) > 0);
  const sum = rated.reduce((total, b) => total + (b.rating ?? 0), 0);
  return { count: rated.length, average: rated.length > 0 ? sum / rated.length : 0 };
}
