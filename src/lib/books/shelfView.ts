import type { Book } from '../../types/Book';

export type ShelfSortKey = 'recent' | 'title' | 'author' | 'rating' | 'pages';

export const DEFAULT_DESC: Record<ShelfSortKey, boolean> = {
  recent: true,
  title: false,
  author: false,
  rating: true,
  pages: true,
};

const GENERIC = new Set(['fiction', 'juvenile fiction', 'general', 'belletristik', 'books']);
const ARTICLE = /^(the|a|an|der|die|das|ein|eine|le|la|les|el|los|las)\s+/i;

const activity = (b: Book) =>
  new Date(b.completedAt || b.lastReadAt || b.startedAt || b.addedAt || 0).getTime();

const sortTitle = (b: Book) => b.title.replace(ARTICLE, '').trim();

const compareText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

export function bookGenres(book: Book): string[] {
  const out = new Set<string>();
  for (const raw of book.categories ?? []) {
    const parts = raw
      .split('/')
      .map((p) => p.trim())
      .filter(Boolean);
    const part = parts.find((p) => !GENERIC.has(p.toLowerCase())) ?? parts[0];
    if (part && part.length <= 22) out.add(part);
  }
  return [...out];
}

export function collectGenres(books: Book[], max = 12): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const b of books) for (const g of bookGenres(b)) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || compareText(a.name, b.name))
    .slice(0, max);
}

export function matchesQuery(book: Book, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [book.title, book.subtitle, book.series?.name, ...(book.authors ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => hay.includes(word));
}

export function sortShelf(books: Book[], sort: ShelfSortKey, flip: boolean): Book[] {
  const dir = DEFAULT_DESC[sort] !== flip ? -1 : 1;
  const list = [...books];
  switch (sort) {
    case 'title':
      list.sort((a, b) => compareText(sortTitle(a), sortTitle(b)));
      break;
    case 'author':
      list.sort(
        (a, b) =>
          compareText(a.authors?.[0] ?? '￿', b.authors?.[0] ?? '￿') ||
          compareText(sortTitle(a), sortTitle(b))
      );
      break;
    case 'rating':
      list.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0) || activity(a) - activity(b));
      break;
    case 'pages':
      list.sort((a, b) => (a.pageCount ?? 0) - (b.pageCount ?? 0));
      break;
    default:
      list.sort((a, b) => activity(a) - activity(b));
  }
  return dir === 1 ? list : list.reverse();
}
