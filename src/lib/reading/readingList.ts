import { progressPercent } from '../books/bookProgress';
import { mangaStand } from '../manga/progress';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';

export type ReadingListSort =
  'name-asc' | 'name-desc' | 'progress-desc' | 'progress-asc' | 'recent-desc';

/** Medium-Filter: Bücher oder ein Manga-Format (MANGA, MANHWA, MANHUA). */
export type ReadingListFormat = 'all' | 'books' | 'MANGA' | 'MANHWA' | 'MANHUA';

export const READING_LIST_SORTS: ReadingListSort[] = [
  'name-asc',
  'name-desc',
  'progress-desc',
  'progress-asc',
  'recent-desc',
];

const FORMATS: ReadingListFormat[] = ['all', 'books', 'MANGA', 'MANHWA', 'MANHUA'];

export const parseReadingListSort = (value: unknown): ReadingListSort | null =>
  READING_LIST_SORTS.includes(value as ReadingListSort) ? (value as ReadingListSort) : null;

export const parseReadingListFormat = (value: unknown): ReadingListFormat | null =>
  FORMATS.includes(value as ReadingListFormat) ? (value as ReadingListFormat) : null;

interface EntryBase {
  key: string;
  title: string;
  progress: number;
  /** Zeitpunkt des letzten Lesens (ms), 0 = nie. */
  lastReadAt: number;
  planned: boolean;
}

export type ReadingListEntry =
  | (EntryBase & { kind: 'book'; book: Book })
  | (EntryBase & { kind: 'manga'; format: string; manga: Manga });

const stamp = (...dates: (string | undefined)[]): number => {
  for (const d of dates) {
    const ms = d ? new Date(d).getTime() : NaN;
    if (Number.isFinite(ms)) return ms;
  }
  return 0;
};

/** Alles, was jemand liest oder lesen will — Bücher und Manga in einer Liste. */
export function readingListEntries(
  books: Book[],
  manga: Manga[],
  formatOf: (manga: Manga) => string
): ReadingListEntry[] {
  const out: ReadingListEntry[] = [];
  for (const book of books) {
    if (book.status !== 'reading' && book.status !== 'planned') continue;
    out.push({
      kind: 'book',
      key: `b-${book.id}`,
      title: book.title,
      progress: progressPercent(book),
      lastReadAt: stamp(book.lastReadAt, book.startedAt),
      planned: book.status === 'planned',
      book,
    });
  }
  for (const m of manga) {
    if (m.readStatus !== 'reading' && m.readStatus !== 'planned') continue;
    out.push({
      kind: 'manga',
      key: `m-${m.anilistId}`,
      title: m.title,
      progress: mangaStand(m).percent,
      lastReadAt: stamp(m.lastReadAt),
      planned: m.readStatus === 'planned',
      format: formatOf(m),
      manga: m,
    });
  }
  return out;
}

/** Filter-Chips: Bücher nur, wenn beide Medien genutzt werden und vorkommen; Manga-Formate nur mit Manga. */
export function readingListFormats(showBooks: boolean, showManga: boolean): ReadingListFormat[] {
  if (!showManga) return [];
  return showBooks ? FORMATS : FORMATS.filter((f) => f !== 'books');
}

const matches = (entry: ReadingListEntry, q: string): boolean =>
  entry.title.toLowerCase().includes(q) ||
  (entry.kind === 'book' && entry.book.authors?.some((a) => a.toLowerCase().includes(q)));

const byTitle = (a: ReadingListEntry, b: ReadingListEntry) => a.title.localeCompare(b.title);

export function filterReadingList(
  entries: ReadingListEntry[],
  { query, format, sort }: { query: string; format: ReadingListFormat; sort: ReadingListSort }
): ReadingListEntry[] {
  const q = query.trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if (q && !matches(e, q)) return false;
    if (format === 'all') return true;
    if (format === 'books') return e.kind === 'book';
    return e.kind === 'manga' && e.format === format;
  });
  return filtered.sort((a, b) => {
    switch (sort) {
      case 'name-asc':
        return byTitle(a, b);
      case 'name-desc':
        return byTitle(b, a);
      case 'progress-desc':
        return b.progress - a.progress || byTitle(a, b);
      case 'progress-asc':
        return a.progress - b.progress || byTitle(a, b);
      case 'recent-desc':
        return b.lastReadAt - a.lastReadAt || byTitle(a, b);
      default:
        return 0;
    }
  });
}
